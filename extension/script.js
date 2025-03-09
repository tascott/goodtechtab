// In a real deployment, you'd replace this URL with your actual server endpoint.
// For testing locally, you might run your Python server on http://127.0.0.1:5000
const API_URL = "http://127.0.0.1:5000/good-tech-news";

async function fetchNews() {
    try {
        const response = await fetch(API_URL);
        if(!response.ok) {
            throw new Error(`Error fetching news: ${response.statusText}`);
        }
        const data = await response.json();
        displayNews(data);
    } catch(error) {
        console.error("Could not load news:",error);
        const container = document.getElementById("news-container");
        container.innerHTML = `<p>Unable to load news at this time.</p>`;
    }
}

function displayNews(newsArray) {
    const container = document.getElementById("news-container");
    container.innerHTML = ""; // clear any existing content

    if(!Array.isArray(newsArray) || newsArray.length === 0) {
        container.innerHTML = "<p>No positive tech news found at the moment.</p>";
        return;
    }

    newsArray.forEach((item) => {
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("news-item");

        const title = document.createElement("h2");
        title.textContent = item.title || "Untitled";

        const description = document.createElement("p");
        description.textContent = item.description || "";

        const link = document.createElement("a");
        link.href = item.url || "#";
        link.textContent = "Read more";
        link.target = "_blank";

        articleDiv.appendChild(title);
        articleDiv.appendChild(description);
        articleDiv.appendChild(link);

        container.appendChild(articleDiv);
    });
}

// When the new tab page loads, fetch and display the news
document.addEventListener("DOMContentLoaded",fetchNews);
