from textblob import TextBlob

def filter_positive_articles(articles):
    """
    Takes a list of article dicts, each with
    { 'title': ..., 'description': ..., 'url': ... }
    Returns a list with only the 'positive' ones (simple heuristic).
    """
    positive_articles = []

    for article in articles:
        text = (article.get("title", "") + " " + article.get("description", "")).strip()
        if not text:
            continue

        sentiment_score = TextBlob(text).sentiment.polarity
        # Polarity ranges from -1.0 (negative) to +1.0 (positive).
        if sentiment_score > 0.1:
            # Keep article if it has a somewhat positive sentiment
            positive_articles.append(article)

    return positive_articles
