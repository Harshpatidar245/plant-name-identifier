import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Leaf, 
  Loader2, 
  Info, 
  Droplet, 
  Sun, 
  MapPin, 
  Ruler 
} from 'lucide-react';

const PlantIdentifierApp = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [plantInfo, setPlantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setPlantInfo(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error accessing the camera: ', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Take a picture from the video feed
  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageUrl = canvasRef.current.toDataURL('image/jpeg');
      setSelectedImage(imageUrl);
      setIsCameraActive(false);
    }
  };
  const identifyPlant = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);
    setPlantInfo(null);

    try {
      const base64Image = selectedImage.split(',')[1];
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyBVVw8TdxOrN_wLaSurBFcYYOxiVm3w_iU`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Identify this plant. Provide its common name, scientific name, care instructions, description, origin, and botanical characteristics. Format the response with clear sections." },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }]
          })
        }
      );

      const responseBody = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`);
      }

      const data = JSON.parse(responseBody);
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Unexpected API response structure');
      }

      const plantResponse = data.candidates[0].content.parts[0].text;
      const parsedInfo = parsePlantInfo(plantResponse);
      setPlantInfo(parsedInfo);
    } catch (error) {
      setError(`Plant identification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parsePlantInfo = (text) => {
    const sections = text.split('\n').filter(section => section.trim() !== '');
    return {
      name: sections.find(s => s.includes('Common Name:'))?.replace('Common Name:', '').trim() || 'Plant Species',
      scientificName: sections.find(s => s.includes('Scientific Name:'))?.replace('Scientific Name:', '').trim() || 'Unidentified',
      care: {
        instruction1: sections.find(s => s.startsWith('1.')) || 'Basic plant care guidance',
        instruction2: sections.find(s => s.startsWith('2.')) || '',
        instruction3: sections.find(s => s.startsWith('3.')) || ''
      },
      description: sections.find(s => s.includes('Description:'))?.replace('Description:', '').trim() || 'Detailed botanical insights unavailable',
      origin: sections.find(s => s.includes('Origin:'))?.replace('Origin:', '').trim() || 'Global Distribution',
      height: sections.find(s => s.includes('Height:'))?.replace('Height:', '').trim() || 'Varies',
      sunlight: sections.find(s => s.includes('Sunlight:'))?.replace('Sunlight:', '').trim() || 'Adaptable Lighting',
      water: sections.find(s => s.includes('Watering:'))?.replace('Watering:', '').trim() || 'Moderate Hydration'
    };
  };

  const renderPlantInfoMobile = () => {
    if (!plantInfo) return null;

    return (
      <div className="md:hidden">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              {plantInfo.name}
            </h2>
            <p className="italic text-green-600 mb-4">
              {plantInfo.scientificName}
            </p>

            {selectedImage && (
              <div className="mb-4">
                <img 
                  src={selectedImage} 
                  alt="Identified Plant" 
                  className="mx-auto max-h-64 object-cover rounded-xl shadow-md"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <MapPin className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-semibold text-green-800">Origin</h4>
              <p className="text-gray-700">{plantInfo.origin}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <Ruler className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-semibold text-green-800">Height</h4>
              <p className="text-gray-700">{plantInfo.height}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <Sun className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-semibold text-green-800">Sunlight</h4>
              <p className="text-gray-700">{plantInfo.sunlight}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <Droplet className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-semibold text-green-800">Watering</h4>
              <p className="text-gray-700">{plantInfo.water}</p>
            </div>
          </div>

          <div className="bg-green-100 rounded-xl p-4">
            <h3 className="text-xl font-bold text-green-800 mb-3">Care Instructions</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              {plantInfo.care.instruction1 && <li>{plantInfo.care.instruction1}</li>}
              {plantInfo.care.instruction2 && <li>{plantInfo.care.instruction2}</li>}
              {plantInfo.care.instruction3 && <li>{plantInfo.care.instruction3}</li>}
            </ul>
          </div>

          <div className="bg-white border-2 border-green-100 rounded-xl p-4">
            <h3 className="text-xl font-bold text-green-800 mb-3">Plant Description</h3>
            <p className="text-gray-700">{plantInfo.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPlantInfoDesktop = () => {
    if (!plantInfo) return null;

    return (
      <div className="hidden md:block bg-green-50 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            {plantInfo.name}
          </h2>
          <p className="italic text-green-600 mb-4">
            {plantInfo.scientificName}
          </p>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Care Instructions</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {plantInfo.care.instruction1 && <li>{plantInfo.care.instruction1}</li>}
                {plantInfo.care.instruction2 && <li>{plantInfo.care.instruction2}</li>}
                {plantInfo.care.instruction3 && <li>{plantInfo.care.instruction3}</li>}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white rounded-lg p-4 shadow-sm">
              <div>
                <h4 className="font-medium text-green-700">Origin</h4>
                <p className="text-gray-600">{plantInfo.origin}</p>
              </div>
              <div>
                <h4 className="font-medium text-green-700">Height</h4>
                <p className="text-gray-600">{plantInfo.height}</p>
              </div>
              <div>
                <h4 className="font-medium text-green-700">Sunlight</h4>
                <p className="text-gray-600">{plantInfo.sunlight}</p>
              </div>
              <div>
                <h4 className="font-medium text-green-700">Watering</h4>
                <p className="text-gray-600">{plantInfo.water}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-green-700 mb-2">Description</h3>
              <p className="text-gray-700">{plantInfo.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 flex items-center justify-center mb-4">
            <Leaf className="mr-3 text-green-500" size={48} />
            Plant Identifier Pro
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Uncover the botanical mysteries of your green companions. Capture or upload an image, and let our AI reveal their unique characteristics.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="plant-upload"
            />

            <label 
              htmlFor="plant-upload" 
              className="block border-2 border-dashed border-green-500 rounded-2xl h-96 flex items-center justify-center cursor-pointer hover:border-green-600 transition-all"
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-md"
                />
              ) : (
                <div className="text-center text-green-600">
                  <Upload className="mx-auto mb-4" size={64} />
                  <span className="text-lg">Upload Plant Image</span>
                </div>
              )}
            </label>

            <div className="space-y-4">
              {/* Start Camera Button */}
              {!isCameraActive && !selectedImage && (
                <button 
                  onClick={startCamera}
                  className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <Camera className="mr-2" />
                  Take Picture
                </button>
              )}

              {/* Active Camera View */}
              {isCameraActive && (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    className="w-full h-96 object-cover rounded-2xl"
                    playsInline
                    autoPlay
                    muted
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleTakePicture}
                      className="bg-green-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                    >
                      <Camera className="mr-2" />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Identify Plant Button */}
              {selectedImage && (
                <button
                  onClick={identifyPlant}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Identifying Plant...
                    </>
                  ) : (
                    <>
                      <Info className="mr-2" />
                      Identify Plant
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Plant Information Section */}
          <div className="bg-green-50 p-6 rounded-2xl">
            {plantInfo ? (
              <div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  {plantInfo.name}
                </h2>
                <p className="italic text-green-600 mb-4">
                  {plantInfo.scientificName}
                </p>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">Care Instructions</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {plantInfo.care.instruction1 && <li>{plantInfo.care.instruction1}</li>}
                      {plantInfo.care.instruction2 && <li>{plantInfo.care.instruction2}</li>}
                      {plantInfo.care.instruction3 && <li>{plantInfo.care.instruction3}</li>}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white rounded-lg p-4 shadow-sm">
                    <div>
                      <h4 className="font-medium text-green-700">Origin</h4>
                      <p className="text-gray-600">{plantInfo.origin}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700">Height</h4>
                      <p className="text-gray-600">{plantInfo.height}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700">Sunlight</h4>
                      <p className="text-gray-600">{plantInfo.sunlight}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700">Watering</h4>
                      <p className="text-gray-600">{plantInfo.water}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">Description</h3>
                    <p className="text-gray-700">{plantInfo.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500">
                <p>Your plant's story awaits. Capture or upload an image to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="mt-4 text-center bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Hidden Canvas for Picture Capture */}
        <canvas ref={canvasRef} className="hidden" width="640" height="480" />
      </div>
    </div>
  );
};

export default PlantIdentifierApp;