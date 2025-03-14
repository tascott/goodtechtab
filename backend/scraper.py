import requests
from bs4 import BeautifulSoup
import json

def scrape_news():
    """
    Scrape success stories from Reddit.
    Returns a list of dicts, each representing an article with
    { 'title': str, 'description': str, 'url': str }
    """
    url = "https://old.reddit.com/r/EngineeringResumes/wiki/success"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        wiki_content = soup.find('div', class_='wiki')
        
        if wiki_content:
            articles = []
            rows = wiki_content.find_all('tr')[1:]  # Skip header row
            
            for row in rows[:5]:  # Get top 5 stories
                cols = row.find_all('td')
                if len(cols) >= 4:
                    date = cols[0].get_text(strip=True)
                    link = cols[1].find('a')
                    if link:
                        title = link.get_text(strip=True)
                        url = link.get('href')
                        user = cols[2].get_text(strip=True)
                        flair = cols[3].get_text(strip=True)
                        
                        articles.append({
                            'title': title,
                            'description': f"Posted {date} by {user} ({flair})",
                            'url': url
                        })
            
            return articles
        else:
            print("No wiki content found")
            return []
            
    except Exception as e:
        print(f"Error scraping Reddit: {str(e)}")
        return []
