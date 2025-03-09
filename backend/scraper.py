import requests
from bs4 import BeautifulSoup
import json

# def scrape_news():
    # """
    # Scrape or fetch tech news from a sample site or RSS feed.
    # Returns a list of dicts, each representing an article with
    # { 'title': str, 'description': str, 'url': str }
    # """

    # # For demonstration, let's assume there's a sample tech site with articles
    # # In reality, you'd replace this with a real URL or multiple URLs
    # url = "https://example.com/tech-news"  # placeholder
    # articles = []

    # try:
    #     response = requests.get(url, timeout=10)
    #     if response.status_code == 200:
    #         soup = BeautifulSoup(response.text, "html.parser")
    #         # Example: find some container with articles
    #         raw_articles = soup.find_all("div", class_="article-container")

    #         for art in raw_articles:
    #             title_tag = art.find("h2")
    #             desc_tag = art.find("p", class_="summary")
    #             link_tag = art.find("a", href=True)

    #             title = title_tag.get_text(strip=True) if title_tag else "No title"
    #             description = desc_tag.get_text(strip=True) if desc_tag else ""
    #             url_link = link_tag["href"] if link_tag else "#"

    #             articles.append({
    #                 "title": title,
    #                 "description": description,
    #                 "url": url_link
    #             })

    #     else:
    #         print(f"Request failed with status code {response.status_code}.")
    # except Exception as e:
    #     print(f"Error during scraping: {str(e)}")

    # return articles

def scrape_news():
    # Instead of actually scraping, load from the dummy file
    with open("sample_data.json", "r") as f:
        data = json.load(f)
    return data
if __name__ == "__main__":
    # Quick test
    data = scrape_news()
    print(json.dumps(data, indent=2))
