import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Leaf, Loader2 } from 'lucide-react';

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
        // Reset previous state
        setPlantInfo(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageUrl = canvasRef.current.toDataURL('image/jpeg');
      setSelectedImage(imageUrl);
      setIsCameraActive(false); // Turn off the camera after taking a picture
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
      setError('Could not access camera. Please try again.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
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
                { text: "Identify this plant. Provide its common name, scientific name, 3 key care instructions, description, origin, and additional details like typical height, sunlight needs, and watering frequency." },
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
      name: sections.find(s => s.includes('Common Name:'))?.replace('Common Name:', '').trim() || 'Unknown Plant',
      scientificName: sections.find(s => s.includes('Scientific Name:'))?.replace('Scientific Name:', '').trim() || 'N/A',
      care: {
        instruction1: sections.find(s => s.startsWith('1.')) || 'No specific care instructions found',
        instruction2: sections.find(s => s.startsWith('2.')) || '',
        instruction3: sections.find(s => s.startsWith('3.')) || ''
      },
      description: sections.find(s => s.includes('Description:'))?.replace('Description:', '').trim() || 'No description available',
      origin: sections.find(s => s.includes('Origin:'))?.replace('Origin:', '').trim() || 'Unknown',
      height: sections.find(s => s.includes('Height:'))?.replace('Height:', '').trim() || 'Not specified',
      sunlight: sections.find(s => s.includes('Sunlight:'))?.replace('Sunlight:', '').trim() || 'Not specified',
      water: sections.find(s => s.includes('Watering:'))?.replace('Watering:', '').trim() || 'Not specified'
    };
  };

  useEffect(() => {
    return () => stopCamera(); // Clean up when the component unmounts
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E3F9E5, #D1F5D7)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#006400', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Leaf style={{ marginRight: '12px', color: '#228B22', width: '48px', height: '48px' }} />
            Plant Identifier Pro
          </h1>
          <p style={{ color: '#4A4A4A', maxWidth: '600px', margin: '0 auto' }}>
            Discover the secrets of your green companions! Upload an image or take a picture using your camera, and let our AI unveil the mysteries of your plant.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Image Upload Section */}
          <div style={{ marginBottom: '32px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="plant-upload"
            />
            <label htmlFor="plant-upload" style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed #4CAF50', borderRadius: '16px', cursor: 'pointer', height: '384px', transition: 'border-color 0.3s ease',
              ':hover': { borderColor: '#388E3C' }
            }}>
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#4CAF50' }}>
                  <Upload style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                  <span style={{ fontSize: '18px' }}>Click to upload plant image</span>
                </div>
              )}
            </label>

            {/* Take Picture Button */}
            {!isCameraActive && !selectedImage && (
              <button
                onClick={startCamera}
                style={{
                  width: '100%', backgroundColor: '#388E3C', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s ease'
                }}
              >
                <Camera style={{ marginRight: '8px' }} />
                Take Picture
              </button>
            )}

            {/* Camera Feed and Take Picture Button */}
            {isCameraActive && (
              <div>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%', height: '384px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px'
                  }}
                  onClick={handleTakePicture}
                  autoPlay
                  muted
                />
                <button
                  onClick={handleTakePicture}
                  style={{
                    width: '100%', backgroundColor: '#388E3C', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s ease'
                  }}
                >
                  Take Picture
                </button>
                <button
                  onClick={stopCamera}
                  style={{
                    width: '100%', backgroundColor: '#D32F2F', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s ease', marginTop: '8px'
                  }}
                >
                  Stop Camera
                </button>
              </div>
            )}

            {/* Identify Plant Button */}
            {selectedImage && (
              <button
                onClick={identifyPlant}
                disabled={isLoading}
                style={{
                  width: '100%', backgroundColor: '#388E3C', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background-color 0.3s ease', opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Loader2 style={{ marginRight: '8px', animation: 'spin 2s linear infinite' }} />
                    Identifying Plant...
                  </div>
                ) : (
                  <>
                    <Camera style={{ marginRight: '8px' }} />
                    Identify Plant
                  </>
                )}
              </button>
            )}
          </div>

          {/* Plant Information Section */}
          {plantInfo && (
            <div>
              <h2 style={{ color: '#388E3C', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {plantInfo.name}
              </h2>
              <p style={{ fontStyle: 'italic', marginBottom: '8px', color: '#4CAF50' }}>
                {plantInfo.scientificName}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Care Instructions:</strong>
                <ul style={{ marginTop: '8px' }}>
                  <li>{plantInfo.care.instruction1}</li>
                  <li>{plantInfo.care.instruction2}</li>
                  <li>{plantInfo.care.instruction3}</li>
                </ul>
              </p>
              <p><strong>Description:</strong> {plantInfo.description}</p>
              <p><strong>Origin:</strong> {plantInfo.origin}</p>
              <p><strong>Typical Height:</strong> {plantInfo.height}</p>
              <p><strong>Sunlight Needs:</strong> {plantInfo.sunlight}</p>
              <p><strong>Watering Frequency:</strong> {plantInfo.water}</p>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div style={{ color: 'red', fontSize: '18px', textAlign: 'center', marginTop: '20px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantIdentifierApp;
