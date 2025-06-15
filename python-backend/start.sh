#!/bin/bash
# filepath: /home/pranjal/Projects/tactmap/python-backend/start.sh

echo "🚀 Starting TactMap Python Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "📋 Installing requirements..."
pip install -r requirements.txt

# Create models directory if it doesn't exist
mkdir -p models

# Copy model files if they exist
if [ -f "/home/pranjal/Desktop/fastapi_server/qualcomm.pt" ]; then
    echo "📁 Copying model files..."
    cp /home/pranjal/Desktop/fastapi_server/*.pt models/ 2>/dev/null || true
fi

# Start the FastAPI server
echo "🏃 Starting FastAPI server..."
python main.py