#!/bin/bash
# filepath: /home/pranjal/Projects/tactmap/start-tactmap.sh

echo "🚀 Starting TactMap Complete System..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping TactMap services..."
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null
        echo "✅ Python backend stopped"
    fi
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null
        echo "✅ Next.js frontend stopped"
    fi
    echo "👋 TactMap shutdown complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Check if required ports are available
echo "🔍 Checking port availability..."
if ! check_port 8000; then
    echo "❌ Port 8000 (Python backend) is in use. Please stop the existing service."
    exit 1
fi

if ! check_port 3000; then
    echo "❌ Port 3000 (Next.js frontend) is in use. Please stop the existing service."
    exit 1
fi

# Start Python backend
echo "📡 Starting Python backend..."
cd python-backend

# Make start script executable
chmod +x start.sh

# Start backend in background
./start.sh &
PYTHON_PID=$!

cd ..

# Wait for Python backend to start
echo "⏳ Waiting for Python backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Python backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Python backend failed to start within 30 seconds"
        cleanup
        exit 1
    fi
    sleep 1
done

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start Next.js frontend
echo "🖥️ Starting Next.js frontend..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js frontend to initialize..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Next.js frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "🎉 TactMap is now running!"
echo "┌─────────────────────────────────────┐"
echo "│  🖥️  Frontend: http://localhost:3000  │"
echo "│  📡 Backend:  http://localhost:8000   │"
echo "└─────────────────────────────────────┘"
echo ""
echo "💡 Tips:"
echo "  • Upload images using the web interface"
echo "  • Check backend health: curl http://localhost:8000/health"
echo "  • Clear detections: curl -X POST http://localhost:3000/api/debug/clear"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait