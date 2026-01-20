#!/bin/bash
echo "Starting DeepSeek Fine-tuned Model Server..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi

# Navigate to script directory
cd "$(dirname "$0")"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt --quiet

# Start the server
echo
echo "Starting model server on http://localhost:11434"
echo "Press Ctrl+C to stop the server"
echo
python server.py
