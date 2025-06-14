'use client';

import { useState, useRef } from 'react';

interface UploadCardProps {
  onUploadSuccess: () => void;
  isLoading: boolean;
}

interface UploadResult {
  success: boolean;
  detections?: any[];
  message?: string;
  error?: string;
}

export default function UploadCard({ onUploadSuccess, isLoading }: UploadCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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
      const file = files[0];
      if (isValidImageFile(file)) {
        setSelectedFile(file);
        setUploadResult(null); // Clear previous results
      } else {
        setUploadResult({ 
          success: false, 
          error: 'Please select a valid image file (JPG, PNG, GIF, WEBP)' 
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidImageFile(file)) {
        setSelectedFile(file);
        setUploadResult(null); // Clear previous results
      } else {
        setUploadResult({ 
          success: false, 
          error: 'Please select a valid image file (JPG, PNG, GIF, WEBP)' 
        });
      }
    }
  };

  const isValidImageFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (!allowedTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > maxSize) {
      setUploadResult({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      });
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload to your Next.js API route which will forward to FastAPI
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Store detections if any were found
      if (result.detections && result.detections.length > 0) {
        try {
          await fetch('/api/detections', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(result.detections),
          });
        } catch (storageError) {
          console.error('Failed to store detections:', storageError);
          // Don't fail the upload if storage fails
        }
      }

      setUploadResult(result);
      onUploadSuccess();
      
      // Clear selected file after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000); // Keep the success message visible for 2 seconds

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadResult({ 
        success: false, 
        error: error.message || 'Failed to analyze image. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    if (!uploading && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h3>
        <i className="fas fa-cloud-upload-alt"></i> Upload Satellite Image
      </h3>
      
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        style={{ 
          cursor: uploading || isLoading ? 'not-allowed' : 'pointer',
          opacity: uploading || isLoading ? 0.6 : 1 
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading || isLoading}
        />
        
        {selectedFile ? (
          <div className="file-selected">
            <i className="fas fa-image"></i>
            <div className="file-info">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            {!uploading && !isLoading && (
              <button 
                className="remove-file-btn"
                onClick={handleRemoveFile}
                title="Remove file"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            <i className="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop an image here</p>
            <p>or <span className="browse-text">browse files</span></p>
            <small>Supports: JPG, PNG, GIF, WEBP (Max 10MB)</small>
          </div>
        )}
      </div>

      {selectedFile && (
        <button 
          className="btn upload-btn"
          onClick={handleUpload}
          disabled={uploading || isLoading}
        >
          {uploading ? (
            <>
              <div className="btn-spinner"></div>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-search"></i>
              Detect Objects
            </>
          )}
        </button>
      )}

      {uploadResult && (
        <div className="upload-result">
          {uploadResult.error ? (
            <div className="error" style={{ display: 'flex' }}>
              <i className="fas fa-exclamation-triangle"></i>
              {uploadResult.error}
            </div>
          ) : (
            <div className="success" style={{ display: 'flex' }}>
              <i className="fas fa-check-circle"></i>
              {uploadResult.message || `Found ${uploadResult.detections?.length || 0} objects!`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}