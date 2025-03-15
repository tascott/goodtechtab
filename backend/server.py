from flask import Flask, jsonify, request, render_template
from dotenv import load_dotenv
import requests
import os
from .scraper import scrape_news
from .filter import filter_positive_articles
from .rss_handler import collect_rss_content
from flask_cors import CORS
import json

load_dotenv()

app = Flask(__name__,
    static_folder='../frontend/static',
    template_folder='../frontend/templates'
)
app.debug = True

# Configure CORS
CORS(app)

# Serve the dashboard
@app.route('/')
def index():
    return render_template('index.html')

@app.before_request
def log_request_info():
    if not request.path.startswith('/static/'):
        print('\n=== Request Info ===')
        print('Headers:', dict(request.headers))
        print('Method:', request.method)
        print('URL:', request.url)
        if request.is_json:
            print('JSON:', request.json)
        print('==================\n')

#######################
# Core Data APIs
#######################

@app.route("/api/news", methods=["GET"])
def get_good_tech_news():
    # 1. Scrape articles
    articles = scrape_news()

    # 2. Filter for positive
    positive = filter_positive_articles(articles)

    # 3. Return as JSON
    return jsonify(positive)

@app.route("/api/rss-feed", methods=["GET"])
def get_rss_feed():
    try:
        stories = collect_rss_content()
        return jsonify(stories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#######################
# Primary AI APIs
#######################

@app.route("/api/ask-perplexity", methods=["POST"])
def ask_perplexity():
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

@app.route("/api/ask-openai", methods=["POST"])
def ask_openai():
    try:
        from openai import OpenAI
    except ImportError:
        return jsonify({"error": "OpenAI package not installed"}), 500

    openai_key = os.getenv('OPENAI_API_KEY')
    if not openai_key:
        return jsonify({"error": "OPENAI_API_KEY not found in environment"}), 500

    question = request.json.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        client = OpenAI(api_key=openai_key)
        response = client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview"}],
            input=question
        )
        result = {
            "choices": [{
                "message": {
                    "content": response.output_text,
                    "role": "assistant"
                }
            }]
        }
        print('\nOpenAI API Response:', json.dumps(result, indent=2))
        return jsonify(result)
    except Exception as e:
        print('\nOpenAI API Error:', str(e))
        return jsonify({"error": str(e)}), 500

#######################
# AI APIs FOR SENTIMENT ANALYSIS (save costs)
#######################

@app.route("/api/ask-grok", methods=["POST"])
def ask_grok():
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

@app.route("/api/ask-deepseek", methods=["POST"])
def ask_deepseek():
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
