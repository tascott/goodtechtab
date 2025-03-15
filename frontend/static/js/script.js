const BASE_URL = "http://127.0.0.1:5002";
const ENDPOINTS = {
    news: `${BASE_URL}/api/news`,
    rssFeed: `${BASE_URL}/api/rss-feed`,
    grok: `${BASE_URL}/api/ask-grok`,
    perplexity: `${BASE_URL}/api/ask-perplexity`,
    deepseek: `${BASE_URL}/api/ask-deepseek`,
    openai: `${BASE_URL}/api/ask-openai`
};

async function fetchNews() {
    try {
        const response = await fetch(ENDPOINTS.news);
        if (!response.ok) {
            throw new Error(`Error fetching news: ${response.status}`);
        }
        const data = await response.json();
        displayNews(data);
    } catch (error) {
        console.error("Could not load news:", error);
        const container = document.getElementById("newsContainer");
        container.innerHTML = `<div class="error">Unable to load news: ${error.message}</div>`;
    }
}

function displayNews(newsArray) {
    const container = document.getElementById("newsContainer");
    container.innerHTML = "";

    if (!Array.isArray(newsArray) || newsArray.length === 0) {
        container.innerHTML = "<div class='no-data'>No tech news found at the moment.</div>";
        return;
    }

    newsArray.forEach((item) => {
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("news-item");

        const title = document.createElement("h3");
        title.textContent = item.title || "Untitled";

        const description = document.createElement("p");
        description.textContent = item.description || "";

        const link = document.createElement("a");
        link.href = item.url || "#";
        link.textContent = "Read more";
        link.target = "_blank";

        const addButton = document.createElement("add-content-button");
        addButton.setAttribute("content", JSON.stringify({
            title: item.title,
            description: item.description,
            url: item.url,
            source: "Reddit",
            type: "reddit"
        }));

        const actionDiv = document.createElement("div");
        actionDiv.classList.add("action-buttons");
        actionDiv.appendChild(link);
        actionDiv.appendChild(addButton);

        articleDiv.appendChild(title);
        articleDiv.appendChild(description);
        articleDiv.appendChild(actionDiv);

        container.appendChild(articleDiv);
    });
}

async function askAI(model) {
    const question = document.getElementById('question').value.trim();
    if (!question) return;

    const responseContainer = document.getElementById('response');
    const responseText = document.getElementById('responseText');

    responseContainer.classList.remove('hidden');
    responseText.textContent = 'Thinking...';

    try {
        const response = await fetch(ENDPOINTS[model], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        responseText.textContent = data.choices?.[0]?.message?.content || data.answer || 'No response received';
    } catch (error) {
        console.error(`${model} Error:`, error);
        responseText.textContent = `Error: ${error.message}`;
    }
}

async function fetchRSSFeed() {
    try {
        const response = await fetch(ENDPOINTS.rssFeed);
        if (!response.ok) {
            throw new Error(`Error fetching RSS feed: ${response.status}`);
        }
        const stories = await response.json();
        displayRSSFeed(stories);
    } catch (error) {
        console.error("Could not load RSS feed:", error);
        const container = document.getElementById("rssFeedContainer");
        container.innerHTML = `<div class="error">Unable to load RSS feed: ${error.message}</div>`;
    }
}

function displayRSSFeed(stories) {
    const container = document.getElementById("rssFeedContainer");
    container.innerHTML = "";

    if (!Array.isArray(stories) || stories.length === 0) {
        container.innerHTML = "<div class='no-data'>No RSS stories found at the moment.</div>";
        return;
    }

    stories.forEach((story) => {
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("news-item");

        const title = document.createElement("h3");
        title.textContent = story.title || "Untitled";

        const source = document.createElement("small");
        source.classList.add("source");
        source.textContent = `Source: ${story.source || 'Unknown'}`;

        const published = document.createElement("small");
        published.classList.add("date");
        if (story.published) {
            const date = new Date(story.published);
            published.textContent = `Published: ${date.toLocaleDateString()}`;
        }

        const description = document.createElement("p");
        description.textContent = story.description || "";

        const link = document.createElement("a");
        link.href = story.url || "#";
        link.textContent = "Read more";
        link.target = "_blank";

        const addButton = document.createElement("add-content-button");
        addButton.setAttribute("content", JSON.stringify({
            title: story.title,
            description: story.description,
            url: story.url,
            source: story.source,
            type: "rss",
            published: story.published
        }));

        const actionDiv = document.createElement("div");
        actionDiv.classList.add("action-buttons");
        actionDiv.appendChild(link);
        actionDiv.appendChild(addButton);

        articleDiv.appendChild(title);
        articleDiv.appendChild(source);
        articleDiv.appendChild(published);
        articleDiv.appendChild(description);
        articleDiv.appendChild(actionDiv);

        container.appendChild(articleDiv);
    });
}

function populateAndAskPerplexity() {
    const defaultPrompt = "Find me good news in tech, particularly around hiring, jobs and layoffs, from the last 7 days\n and give me the sources. Include social media if you can with sources/links.";
    const textarea = document.getElementById('question');
    textarea.value = defaultPrompt;
    textarea.focus();
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    fetchRSSFeed();

    // Fetch initial stats
    document.getElementById('jobCount').textContent = 'Coming soon';
    document.getElementById('fundingAmount').textContent = 'Coming soon';
});
