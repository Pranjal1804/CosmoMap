import torch
from ultralytics import YOLO
import os

def convert_ultralytics_to_torch(model_path: str, output_path: str = "model.pt"):
    """Convert Ultralytics YOLO model to PyTorch format if needed"""
    try:
        # Load YOLO model
        model = YOLO(model_path)
        
        # Export to PyTorch format
        model.export(format='torchscript', optimize=True)
        
        print(f"Model converted and saved to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error converting model: {e}")
        return False

def test_yolo_model_loading(model_path: str):
    """Test if YOLO model can be loaded with ultralytics"""
    try:
        model = YOLO(model_path)
        print(f"✅ YOLO model loaded successfully from {model_path}")
        print(f"Model type: {type(model)}")
        
        # Test inference on a dummy image
        import numpy as np
        dummy_image = np.zeros((640, 640, 3), dtype=np.uint8)
        results = model(dummy_image)
        print(f"✅ Model inference test successful")
        print(f"Model classes: {model.names}")
        
        return True
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
        return False

def test_torch_model_loading(model_path: str):
    """Test if PyTorch model can be loaded directly"""
    try:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        # Add weights_only=False for compatibility
        model = torch.load(model_path, map_location=device, weights_only=False)
        print(f"✅ PyTorch model loaded successfully on {device}")
        print(f"Model type: {type(model)}")
        return True
    except Exception as e:
        print(f"❌ Error loading PyTorch model: {e}")
        return False

def inspect_model_details(model_path: str):
    """Inspect model details and capabilities"""
    print(f"\n🔍 Inspecting model: {model_path}")
    
    try:
        model = YOLO(model_path)
        
        print(f"📊 Model Details:")
        print(f"  - Model file: {model_path}")
        print(f"  - Model type: {type(model)}")
        print(f"  - Available classes: {model.names}")
        print(f"  - Number of classes: {len(model.names) if model.names else 'Unknown'}")
        
        # Test with dummy input
        import numpy as np
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        print(f"\n🧪 Running test inference...")
        results = model(test_image)
        
        for result in results:
            print(f"  - Result type: {type(result)}")
            if hasattr(result, 'boxes') and result.boxes is not None:
                print(f"  - Boxes detected: {len(result.boxes)}")
            if hasattr(result, 'names'):
                print(f"  - Class names: {result.names}")
            
            # Check for any GPS/location attributes
            attrs = [attr for attr in dir(result) if not attr.startswith('_')]
            print(f"  - Available attributes: {attrs}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error inspecting model: {e}")
        return False

if __name__ == "__main__":
    # Check for different model files
    model_files = [
        "/home/pranjal/Desktop/fastapi_server/qualcomm.pt",
        "/home/pranjal/Desktop/fastapi_server/best.pt",
        "/home/pranjal/Desktop/fastapi_server/model.pt",
        "/home/pranjal/Desktop/fastapi_server/yolov8n.pt"
    ]
    
    print("🚀 Testing Model Loading...")
    print("=" * 50)
    
    working_models = []
    
    for model_path in model_files:
        if os.path.exists(model_path):
            file_size = os.path.getsize(model_path)
            print(f"\n📁 Found: {os.path.basename(model_path)} ({file_size:,} bytes)")
            
            # Try YOLO loading first (recommended for .pt files from ultralytics)
            print(f"🔄 Testing YOLO loading...")
            if test_yolo_model_loading(model_path):
                working_models.append((model_path, "YOLO"))
                inspect_model_details(model_path)
            else:
                # Try PyTorch loading as fallback
                print(f"🔄 Testing PyTorch loading...")
                if test_torch_model_loading(model_path):
                    working_models.append((model_path, "PyTorch"))
        else:
            print(f"❌ Not found: {model_path}")
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    if working_models:
        print("✅ Working models:")
        for model_path, loader_type in working_models:
            print(f"  - {os.path.basename(model_path)} (use {loader_type} loader)")
        
        print(f"\n💡 Recommendation:")
        best_model = working_models[0]
        print(f"  Use: {best_model[0]}")
        print(f"  Loader: {best_model[1]}")
    else:
        print("❌ No working models found!")
        
    # List all .pt files in directory
    print(f"\n📂 All .pt files in directory:")
    try:
        pt_files = [f for f in os.listdir("/home/pranjal/Desktop/fastapi_server/") if f.endswith('.pt')]
        if pt_files:
            for file in pt_files:
                file_path = f"/home/pranjal/Desktop/fastapi_server/qualcomm_updated.pt"
                size = os.path.getsize(file_path)
                print(f"  - {file} ({size:,} bytes)")
        else:
            print("  No .pt files found")
    except Exception as e:
        print(f"  Error listing files: {e}")