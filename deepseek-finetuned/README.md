# DeepSeek Fine-tuned Model Server

This folder contains a fine-tuned Qwen2-based model for generating travel itineraries, trip summaries, and event descriptions for the Nostia app.

## Requirements

- **Python 3.10+** (with pip)
- **CUDA** (optional, for GPU acceleration)
- **~4GB RAM** minimum (8GB+ recommended)
- **~4GB disk space** for the model

## Quick Start

### Windows
```bash
cd deepseek-finetuned
start-model.bat
```

### Mac/Linux
```bash
cd deepseek-finetuned
chmod +x start-model.sh
./start-model.sh
```

## Manual Setup

1. **Create virtual environment:**
   ```bash
   cd deepseek-finetuned
   python -m venv venv
   ```

2. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   python server.py
   ```

The server will start on `http://localhost:11434` by default.

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and device info.

### Generate Text (Ollama-compatible)
```
POST /api/generate
Content-Type: application/json

{
  "model": "deepseek-finetuned",
  "prompt": "Your prompt here",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "top_p": 0.95,
    "max_tokens": 512
  }
}
```

### Chat Completion
```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "system", "content": "You are a travel assistant."},
    {"role": "user", "content": "Plan a trip to Paris"}
  ],
  "options": {
    "temperature": 0.7
  }
}
```

## Environment Variables

- `MODEL_PORT` - Server port (default: 11434)

## GPU Support

The server automatically uses CUDA if available. For CPU-only mode, it will work but be slower.

To check if CUDA is being used:
```bash
curl http://localhost:11434/health
```

## Troubleshooting

### Out of Memory Error
- Try reducing `max_tokens` in your requests
- Close other GPU-intensive applications
- Use CPU mode if GPU memory is insufficient

### Model Not Loading
- Ensure all model files are present (model.safetensors, config.json, tokenizer.json, etc.)
- Check you have enough disk space
- Try reinstalling dependencies: `pip install -r requirements.txt --force-reinstall`

### Slow Generation
- GPU is recommended for faster inference
- Reduce `max_tokens` for shorter responses
- The first request may be slow as the model initializes
