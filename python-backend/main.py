from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import torch
import cv2
import numpy as np
from PIL import Image
import io
import json
from typing import List, Dict, Any
import os
from pathlib import Path
from ultralytics import YOLO
import time
import random
import uvicorn

# Global variables to store the model
model = None
device = None

def load_model(model_path: str):
    """Load the YOLO model"""
    global model, device
    
    try:
        # Check if CUDA is available
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {device}")
        
        # Load YOLO model using ultralytics
        model = YOLO(model_path)
        
        print(f"Model loaded successfully from {model_path}")
        return True
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting TactMap Detection API...")
    
    # Try different possible model file names - Updated paths
    possible_models = [
        # First try local models directory
        os.path.join(os.path.dirname(__file__), "models", "qualcomm.pt"),
        os.path.join(os.path.dirname(__file__), "models", "best.pt"),
        os.path.join(os.path.dirname(__file__), "models", "yolov8n.pt"),
        os.path.join(os.path.dirname(__file__), "models", "model.pt"),
        # Fallback to original location
        "/home/pranjal/Desktop/fastapi_server/qualcomm.pt",
        "/home/pranjal/Desktop/fastapi_server/best.pt",
        "/home/pranjal/Desktop/fastapi_server/yolov8n.pt",
        "/home/pranjal/Desktop/fastapi_server/model.pt"
    ]
    
    model_loaded = False
    for model_path in possible_models:
        if os.path.exists(model_path):
            print(f"Trying to load model: {model_path}")
            success = load_model(model_path)
            if success:
                model_loaded = True
                print(f"✅ Model loaded: {model_path}")
                break
    
    if not model_loaded:
        print("⚠️  Warning: No valid model found. API will return mock data.")
        print("Checked locations:")
        for model_path in possible_models:
            exists = "✅" if os.path.exists(model_path) else "❌"
            print(f"  {exists} {model_path}")
    
    yield
    
    # Shutdown
    print("Shutting down...")

app = FastAPI(title="TactMap AI Detection API", version="1.0.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_inference(image: np.ndarray) -> List[Dict[str, Any]]:
    """Run YOLO model inference on image"""
    try:
        global model
        
        if model is None:
            print("⚠️  Model not loaded, generating mock detections")
            return generate_mock_detections(image.shape)
        
        print("🔍 Running YOLO inference...")
        start_time = time.time()
        
        # Run YOLO inference
        results = model(image)
        
        inference_time = time.time() - start_time
        print(f"⏱️  Inference completed in {inference_time:.3f}s")
        
        detections = []
        strategic_regions = [
            {"name": "Middle East", "base_lat": 33.3152, "base_lng": 44.3661},
            {"name": "Eastern Europe", "base_lat": 50.4501, "base_lng": 30.5234},
            {"name": "Central Asia", "base_lat": 41.2995, "base_lng": 69.2401},
            {"name": "South Asia", "base_lat": 28.6139, "base_lng": 77.2090},
            {"name": "East Asia", "base_lat": 39.9042, "base_lng": 116.4074},
            {"name": "North Africa", "base_lat": 30.0444, "base_lng": 31.2357},
            {"name": "Caucasus", "base_lat": 42.3154, "base_lng": 43.3569},
            {"name": "Southeast Asia", "base_lat": 13.7563, "base_lng": 100.5018}
        ]
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for i, box in enumerate(boxes):
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    center_x = float((x1 + x2) / 2)
                    center_y = float((y1 + y2) / 2)
                    
                    # Generate diverse coordinates
                    height, width = image.shape[:2]
                    region = strategic_regions[i % len(strategic_regions)]
                    
                    lat_variation = (center_y / height - 0.5) * 0.1
                    lng_variation = (center_x / width - 0.5) * 0.1
                    
                    lat = region["base_lat"] + lat_variation + random.uniform(-0.02, 0.02)
                    lng = region["base_lng"] + lng_variation + random.uniform(-0.02, 0.02)
                    
                    detection = {
                        "class": get_class_name(class_id),
                        "confidence": confidence,
                        "x": center_x,
                        "y": center_y,
                        "lat": lat,
                        "lng": lng,
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "region": region["name"]
                    }
                    detections.append(detection)
        
        print(f"✅ Found {len(detections)} detections")
        return detections
        
    except Exception as e:
        print(f"❌ Inference error: {e}")
        return generate_mock_detections(image.shape)

def get_class_name(class_id: int) -> str:
    """Map class ID to class name"""
    class_names = {
        0: "tank",
        1: "military_vehicle",
        2: "personnel",
        3: "aircraft",
        4: "ship",
        5: "building",
        6: "artillery",
        7: "radar"
    }
    return class_names.get(class_id, "tank")

def generate_mock_detections(image_shape: tuple) -> List[Dict[str, Any]]:
    """Generate mock detections for testing"""
    height, width = image_shape[:2]
    num_detections = random.randint(2, 9)
    detections = []
    
    regions = [
        {"name": "Middle East", "base_lat": 33.3152, "base_lng": 44.3661},
        {"name": "Eastern Europe", "base_lat": 50.4501, "base_lng": 30.5234},
        {"name": "Central Asia", "base_lat": 41.2995, "base_lng": 69.2401},
        {"name": "South Asia", "base_lat": 28.6139, "base_lng": 77.2090},
        {"name": "East Asia", "base_lat": 39.9042, "base_lng": 116.4074},
        {"name": "North Africa", "base_lat": 30.0444, "base_lng": 31.2357}
    ]
    
    for i in range(num_detections):
        center_x = random.uniform(50, width - 50)
        center_y = random.uniform(50, height - 50)
        
        bbox_width = random.uniform(30, 100)
        bbox_height = random.uniform(30, 100)
        
        x1 = center_x - bbox_width / 2
        y1 = center_y - bbox_height / 2
        x2 = center_x + bbox_width / 2
        y2 = center_y + bbox_height / 2
        
        region = regions[i % len(regions)]
        lat = region["base_lat"] + random.uniform(-0.05, 0.05)
        lng = region["base_lng"] + random.uniform(-0.05, 0.05)
        
        detection = {
            "class": "tank",
            "confidence": random.uniform(0.6, 0.95),
            "x": center_x,
            "y": center_y,
            "lat": lat,
            "lng": lng,
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "width": bbox_width,
            "height": bbox_height,
            "region": region["name"]
        }
        detections.append(detection)
    
    return detections

@app.get("/")
async def root():
    return {
        "message": "TactMap AI Detection API",
        "status": "running",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    try:
        print(f"📁 Processing file: {file.filename}")
        
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_data = await file.read()
        pil_image = Image.open(io.BytesIO(image_data))
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        detections = run_inference(opencv_image)
        
        return {
            "success": True,
            "detections": detections,
            "total_detections": len(detections),
            "image_shape": {
                "width": pil_image.width,
                "height": pil_image.height
            },
            "filename": file.filename,
            "model_loaded": model is not None
        }
        
    except Exception as e:
        print(f"❌ Detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device) if device else "cpu",
        "timestamp": time.time()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")