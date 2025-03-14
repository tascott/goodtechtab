// In a real deployment, you'd replace this URL with your actual server endpoint.
// For testing locally, you might run your Python server on http://127.0.0.1:5000
const BASE_URL = "http://127.0.0.1:5000";
const ENDPOINTS = {
    news: `${BASE_URL}/good-tech-news`,
    grok: `${BASE_URL}/ask-grok`,
    perplexity: `${BASE_URL}/ask-perplexity`,
    deepseek: `${BASE_URL}/ask-deepseek`,
    openai: `${BASE_URL}/ask-openai`
};

async function fetchNews() {
    try {
        const response = await fetch(ENDPOINTS.news, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        console.log('News Response Status:', response.status);
        console.log('News Response Headers:', Object.fromEntries(response.headers));
        
        if(!response.ok) {
            throw new Error(`Error fetching news: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        displayNews(data);
    } catch(error) {
        console.error("Could not load news:", error);
        const container = document.getElementById("news-container");
        container.innerHTML = `<p>Unable to load news at this time. Error: ${error.message}</p>`;
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

// Generic function to ask AI models
async function askAI(question, model) {
    const responseElement = document.getElementById(`${model}-content`);
    responseElement.textContent = 'Thinking...';
    
    try {
        console.log(`Sending ${model} request:`, { question });
        
        const response = await fetch(ENDPOINTS[model], {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({ question })
        });

        console.log(`${model} Response Status:`, response.status);
        console.log(`${model} Response Headers:`, Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${model} Error Response:`, errorText);
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        console.log(`${model.toUpperCase()} API Full Response:`, data);
        responseElement.textContent = data.choices[0].message.content;
    } catch (error) {
        console.error(`${model} Error:`, error);
        responseElement.textContent = `Error: ${error.message}`;
    }
}

// Set up event handlers for both AI models
function setupAIHandler(model) {
    const button = document.getElementById(`${model}-button`);
    const input = document.getElementById(`${model}-input`);

    button.addEventListener('click', () => {
        const question = input.value.trim();
        if (question) {
            askAI(question, model);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const question = input.value.trim();
            if (question) {
                askAI(question, model);
            }
        }
    });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    setupAIHandler('grok');
    setupAIHandler('perplexity');
    setupAIHandler('deepseek');
    setupAIHandler('openai');
});
