from flask import Flask, jsonify, request
from dotenv import load_dotenv
import requests
import os
from scraper import scrape_news
from filter import filter_positive_articles
from flask_cors import CORS
import json

load_dotenv()

app = Flask(__name__)
app.debug = True

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

@app.before_request
def log_request_info():
    print('\n=== Request Info ===')  
    print('Headers:', dict(request.headers))
    print('Method:', request.method)
    print('URL:', request.url)
    if request.is_json:
        print('JSON:', request.json)
    print('==================\n')

@app.route("/good-tech-news", methods=["GET", "OPTIONS"])
def get_good_tech_news():
    if request.method == "OPTIONS":
        return "", 200

    # 1. Scrape articles
    articles = scrape_news()

    # 2. Filter for positive
    positive = filter_positive_articles(articles)

    # 3. Return as JSON
    response = jsonify(positive)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/ask-grok", methods=["POST", "OPTIONS"])
def ask_grok():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    grok_key = os.getenv('GROK_KEY')
    if not grok_key:
        return jsonify({"error": "GROK_KEY not found in environment"}), 500

    question = request.json.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        response = requests.post(
            'https://api.x.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {grok_key}'
            },
            json={
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                "model": "grok-2-latest",
                "stream": False,
                "temperature": 0
            }
        )
        response.raise_for_status()
        result = response.json()
        print('\nGrok API Response:', json.dumps(result, indent=2))
        return jsonify(result)
    except requests.exceptions.RequestException as e:
        print('\nGrok API Error:', str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/ask-perplexity", methods=["POST", "OPTIONS"])
def ask_perplexity():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    perplexity_key = os.getenv('PERPLEXITY_KEY')
    if not perplexity_key:
        return jsonify({"error": "PERPLEXITY_KEY not found in environment"}), 500

    question = request.json.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {perplexity_key}'
            },
            json={
                "model": "sonar",
                "messages": [
                    {
                        "role": "system",
                        "content": "Be precise and concise."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                "max_tokens": 123,
                "temperature": 0.2,
                "top_p": 0.9,
                "stream": False,
                "frequency_penalty": 1
            }
        )
        response.raise_for_status()
        result = response.json()
        print('\nPerplexity API Response:', json.dumps(result, indent=2))
        return jsonify(result)
    except requests.exceptions.RequestException as e:
        print('\nPerplexity API Error:', str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/ask-deepseek", methods=["POST", "OPTIONS"])
def ask_deepseek():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        from openai import OpenAI
    except ImportError:
        return jsonify({"error": "OpenAI package not installed"}), 500

    deepseek_key = os.getenv('DEEPSEEK_KEY')
    if not deepseek_key:
        return jsonify({"error": "DEEPSEEK_KEY not found in environment"}), 500

    question = request.json.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": question}
            ],
            stream=False
        )
        result = {
            "choices": [{
                "message": {
                    "content": response.choices[0].message.content,
                    "role": "assistant"
                }
            }]
        }
        print('\nDeepSeek API Response:', json.dumps(result, indent=2))
        return jsonify(result)
    except Exception as e:
        print('\nDeepSeek API Error:', str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # For development purposes:
    # Run: python server.py
    app.run(debug=True, host="127.0.0.1", port=5000)
