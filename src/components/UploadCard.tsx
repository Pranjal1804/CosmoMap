import { useState, useRef } from 'react';

interface UploadCardProps {
  onUploadSuccess: () => void;
  isLoading: boolean;
}

export default function UploadCard({ onUploadSuccess, isLoading }: UploadCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`✅ Success! Found ${result.detections.length} objects in ${result.processingTime}ms`);
        onUploadSuccess();
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h3>
        <i className="fas fa-cloud-upload-alt"></i> Upload Satellite Image
      </h3>
      <div 
        className={`upload-area ${isDragOver ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleFileSelect}
        />
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <div className="upload-text">Drop image here or click to upload</div>
        <div className="upload-hint">Supports JPEG, PNG, TIFF formats</div>
      </div>
      
      <button 
        className="btn" 
        style={{ width: '100%', marginTop: '1rem' }}
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        <i className="fas fa-search"></i> 
        {selectedFile ? `Analyze ${selectedFile.name}` : 'Analyze Image'}
      </button>

      {uploading && (
        <div className="loading active">
          <div className="spinner"></div>
          <div>Processing image...</div>
        </div>
      )}

      {error && (
        <div className="error" style={{ display: 'block' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success" style={{ display: 'block' }}>
          {success}
        </div>
      )}
    </div>
  );
}