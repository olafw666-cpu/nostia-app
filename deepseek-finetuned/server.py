"""
DeepSeek Fine-tuned Model Inference Server
Serves the local fine-tuned model via a REST API compatible with the Nostia app.
"""

import json
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer
import os

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_PATH = os.path.dirname(os.path.abspath(__file__))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_NEW_TOKENS = 512
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.95

print(f"Loading model from {MODEL_PATH}...")
print(f"Using device: {DEVICE}")

# Load model and tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto" if DEVICE == "cuda" else None,
        trust_remote_code=True
    )
    if DEVICE == "cpu":
        model = model.to(DEVICE)
    model.eval()
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    tokenizer = None


def format_prompt(system_prompt: str, user_message: str) -> str:
    """Format prompt using the model's chat template style."""
    # Based on the chat_template.jinja, the format uses special tokens
    # <｜User｜> for user messages and <｜Assistant｜> for assistant
    formatted = f"{system_prompt}<｜User｜>{user_message}<｜Assistant｜>"
    return formatted


def generate_text(prompt: str, temperature: float = DEFAULT_TEMPERATURE,
                  top_p: float = DEFAULT_TOP_P, max_tokens: int = MAX_NEW_TOKENS) -> str:
    """Generate text using the loaded model."""
    if model is None or tokenizer is None:
        raise RuntimeError("Model not loaded")

    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    # Decode and extract only the new generated tokens
    generated_text = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

    # Clean up the response (remove any thinking tokens if present)
    if '</think>' in generated_text:
        generated_text = generated_text.split('</think>')[-1]

    # Remove end of sentence markers
    generated_text = generated_text.replace('<｜end▁of▁sentence｜>', '').strip()

    return generated_text


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy" if model is not None else "model_not_loaded",
        "device": DEVICE,
        "model_path": MODEL_PATH
    })


@app.route('/api/generate', methods=['POST'])
def generate():
    """
    Generate text endpoint - compatible with Ollama API format.
    Expected body: { "model": "...", "prompt": "...", "stream": false, "options": {...} }
    """
    try:
        data = request.get_json()

        if not data or 'prompt' not in data:
            return jsonify({"error": "prompt is required"}), 400

        prompt = data['prompt']
        options = data.get('options', {})
        temperature = options.get('temperature', DEFAULT_TEMPERATURE)
        top_p = options.get('top_p', DEFAULT_TOP_P)
        max_tokens = options.get('max_tokens', MAX_NEW_TOKENS)

        # Generate response
        response_text = generate_text(prompt, temperature, top_p, max_tokens)

        return jsonify({
            "model": "deepseek-finetuned",
            "response": response_text,
            "done": True
        })

    except Exception as e:
        print(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat completion endpoint for conversational use.
    Expected body: { "messages": [{"role": "...", "content": "..."}], "options": {...} }
    """
    try:
        data = request.get_json()

        if not data or 'messages' not in data:
            return jsonify({"error": "messages array is required"}), 400

        messages = data['messages']
        options = data.get('options', {})
        temperature = options.get('temperature', DEFAULT_TEMPERATURE)
        top_p = options.get('top_p', DEFAULT_TOP_P)
        max_tokens = options.get('max_tokens', MAX_NEW_TOKENS)

        # Build prompt from messages
        system_prompt = ""
        user_message = ""

        for msg in messages:
            if msg['role'] == 'system':
                system_prompt = msg['content']
            elif msg['role'] == 'user':
                user_message = msg['content']

        prompt = format_prompt(system_prompt, user_message)

        # Generate response
        response_text = generate_text(prompt, temperature, top_p, max_tokens)

        return jsonify({
            "model": "deepseek-finetuned",
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "done": True
        })

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('MODEL_PORT', 11435))
    print(f"Starting DeepSeek model server on port {port}...")
    print(f"API endpoint: http://localhost:{port}/api/generate")
    app.run(host='0.0.0.0', port=port, debug=False)
