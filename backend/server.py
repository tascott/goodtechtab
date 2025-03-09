from flask import Flask, jsonify
from scraper import scrape_news
from filter import filter_positive_articles
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

@app.route("/good-tech-news", methods=["GET"])
def get_good_tech_news():
    # 1. Scrape articles
    articles = scrape_news()

    # 2. Filter for positive
    positive = filter_positive_articles(articles)

    # 3. Return as JSON
    return jsonify(positive)

if __name__ == "__main__":
    # For development purposes:
    # Run: python server.py
    app.run(debug=True, host="127.0.0.1", port=5000)
