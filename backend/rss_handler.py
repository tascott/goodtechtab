import feedparser
import ssl
from datetime import datetime
import pytz
from bs4 import BeautifulSoup
import re
import html

# Configure SSL for feedparser
if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

def collect_rss_content():
    tech_news_feeds = [
        'https://news.ycombinator.com/rss',
        'https://techcrunch.com/feed/',
        'https://www.techmeme.com/feed.xml',
        # Add feeds from tech job boards that have RSS
    ]

    stories = []
    for feed_url in tech_news_feeds:
        try:
            feed = feedparser.parse(feed_url)

            # Only log debug info for Hacker News
            if 'news.ycombinator.com' in feed_url:
                print(f'\nHacker News Feed Debug Info:')
                print(f'Feed version: {feed.get("version", "unknown")}')
                print(f'Feed encoding: {feed.get("encoding", "unknown")}')
                print(f'Feed headers: {feed.get("headers", {})}')
                print(f'Feed status: {feed.status if hasattr(feed, "status") else "No status"}')
                print(f'Feed bozo: {feed.bozo if hasattr(feed, "bozo") else "No bozo flag"}')
                if hasattr(feed, 'bozo') and feed.bozo:
                    print(f'Bozo exception: {feed.bozo_exception}')
                print(f'Feed keys available: {feed.keys()}')
                print(f'Raw feed content: {str(feed.get("raw_data", ""))[:500]}...')
                if feed.entries:
                    print(f'Number of entries: {len(feed.entries)}')
                    print(f'First entry keys: {feed.entries[0].keys() if feed.entries else "No entries"}')
                    print(f'First entry content: {feed.entries[0] if feed.entries else "No entries"}')

            if hasattr(feed, 'status') and feed.status != 200:
                continue

            if hasattr(feed, 'bozo') and feed.bozo:
                continue

            if not feed.entries:
                continue

            for entry in feed.entries[:20]:  # Get 20 most recent entries per feed
                    # Convert published date to ISO format
                    published = entry.get('published_parsed')
                    if published:
                        dt = datetime(*published[:6], tzinfo=pytz.UTC)
                        published_iso = dt.isoformat()
                    else:
                        published_iso = None

                    def clean_html_text(text):
                        if not text:
                            return ''
                        # First unescape any HTML entities
                        text = html.unescape(text)
                        # Parse HTML
                        soup = BeautifulSoup(text, 'html.parser')
                        # Get text content
                        text = soup.get_text(separator=' ').strip()
                        # Remove extra whitespace
                        text = re.sub(r'\s+', ' ', text)
                        # Remove any remaining special characters
                        text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', text)
                        return text

                    # Clean the HTML content
                    title = clean_html_text(entry.get('title', ''))

                    # Handle different feed formats
                    description = ''
                    if 'summary' in entry:
                        description = clean_html_text(entry.get('summary', ''))
                    elif 'description' in entry:
                        description = clean_html_text(entry.get('description', ''))
                    elif 'content' in entry:
                        if isinstance(entry.content, list) and len(entry.content) > 0:
                            description = clean_html_text(entry.content[0].get('value', ''))
                        else:
                            description = clean_html_text(entry.get('content', ''))

                    # For Hacker News, get additional info from the API
                    if not description and 'link' in entry and 'news.ycombinator.com' in feed_url:
                        try:
                            # Extract story ID from the HN URL
                            story_id = entry.get('id', '').split(':')[-1]
                            if story_id:
                                # Use HN API to get story details
                                api_url = f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json'
                                response = requests.get(api_url, timeout=5)
                                if response.ok:
                                    story_data = response.json()
                                    if story_data:
                                        # Get the story text or URL title
                                        description = story_data.get('text', '')
                                        if not description:
                                            description = f"Points: {story_data.get('score', 0)} | Comments: {story_data.get('descendants', 0)}"
                        except Exception as e:
                            print(f"Error fetching HN API content: {str(e)}")

                    # If still no description, use a placeholder
                    if not description:
                        description = "Click to read more..."

                    stories.append({
                        'title': title,
                        'description': description[:300] + '...' if len(description) > 300 else description,
                        'url': entry.get('link', ''),
                        'source': clean_html_text(feed.feed.get('title', '')),
                        'published': published_iso
                    })
        except Exception as e:
            print(f"Error fetching feed {feed_url}: {str(e)}")
            continue

    # Sort by publication date, newest first
    stories.sort(key=lambda x: x['published'] if x['published'] else '', reverse=True)
    return stories[:100]  # Return top 20 stories overall
