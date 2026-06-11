import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import BackButton from '../components/BackButton/BackButton';
import { Upload, Video, Image as ImageIcon } from 'lucide-react';

const DemoScreen = () => {
  const navigate = useNavigate();
  const [fileUploaded, setFileUploaded] = useState(false);
  const [runningDemo, setRunningDemo] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  
  // Video Progress State
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [taskId, setTaskId] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileType(type);
      setFileUploaded(true);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const runDetection = async () => {
    setRunningDemo(true);
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      if (fileType === 'image') {
        const response = await fetch('/api/detect/image', { method: 'POST', body: formData });
        const data = await response.json();
        // Save to localStorage for demo persistence (safe against QuotaExceededError)
        try {
            const dataToSave = { ...data };
            if (dataToSave.image_data) delete dataToSave.image_data; // Don't save huge base64 strings to localstorage
            localStorage.setItem('latestDemoResult', JSON.stringify(dataToSave));
        } catch (e) {
            console.warn("Could not save to localStorage", e);
        }
        navigate('/demo-results', { state: { result: data, type: 'image' } });
      } else if (fileType === 'video') {
        setStatusMessage('Uploading video...');
        const response = await fetch('/api/detect/video', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.task_id) {
            setTaskId(data.task_id);
        } else {
            setStatusMessage('Error starting video processing');
            setRunningDemo(false);
        }
      }
    } catch (err) {
      console.error('Detection failed:', err);
      setStatusMessage('Detection failed');
      setRunningDemo(false);
    }
  };

  useEffect(() => {
    let interval;
    if (taskId) {
        interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/detect/video/progress/${taskId}`);
                const data = await res.json();
                
                if (data.error) {
                    clearInterval(interval);
                    setStatusMessage(data.status || 'Error processing video');
                    setRunningDemo(false);
                    return;
                }
                
                setProgress(data.progress);
                setStatusMessage(data.status);
                
                if (data.progress === 100 && data.status === 'Completed') {
                    clearInterval(interval);
                    // Spread all keys including statistics and vehicles from progress response
                    const resultData = { ...data, type: 'video' };
                    localStorage.setItem('latestDemoResult', JSON.stringify(resultData));
                    navigate('/demo-results', { state: { result: resultData, type: 'video' } });
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskId, navigate]);

  return (
    <div style={{ minHeight: '100vh', padding: '100px var(--spacing-xl)', textAlign: 'center' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: '900px', marginTop: '60px' }}>
        <BackButton />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Demo Smart Parking</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Allow owners to test the system before connecting real CCTV cameras.</p>

        {!fileUploaded ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', borderRadius: '20px', border: '2px dashed var(--primary-color)' }}>
            <Upload size={48} color="var(--primary-color)" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ marginBottom: '2rem' }}>Upload Parking Image or Video</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Drag & drop or click to browse</p>
            
            <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'image')} />
            <input type="file" accept="video/mp4,video/mov,video/avi,video/mkv,video/webm" ref={videoInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'video')} />
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<ImageIcon size={20} />} onClick={() => imageInputRef.current.click()}>Upload Image</Button>
              <Button variant="outline" icon={<Video size={20} />} onClick={() => videoInputRef.current.click()}>Upload Video</Button>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem 2rem', borderRadius: '20px' }}>
            {runningDemo ? (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>{fileType === 'video' ? 'Processing Video...' : 'Processing Image with YOLOv8x...'}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{statusMessage || 'Please wait while the AI analyses the parking layout.'}</p>
                {fileType === 'video' && (
                    <div style={{ marginTop: '2rem', width: '100%', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
                        <div style={{ width: `${progress}%`, backgroundColor: 'var(--primary-color)', height: '100%', transition: 'width 0.3s' }}></div>
                    </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: '2rem' }}>Media Uploaded Successfully</h3>
                {previewUrl && fileType === 'image' && <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', marginBottom: '2rem' }} />}
                {previewUrl && fileType === 'video' && <video src={previewUrl} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', marginBottom: '2rem' }} controls />}
                <br />
                <Button variant="primary" onClick={runDetection}>Run YOLOv8x Detection Demo</Button>
              </div>
            )}
          </div>
        )}

        {!runningDemo && (
          <div style={{ marginTop: '2rem' }}>
            <Button variant="outline" onClick={() => navigate('/signup')}>Skip Demo</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoScreen;
