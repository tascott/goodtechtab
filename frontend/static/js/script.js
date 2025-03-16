const BASE_URL = "http://127.0.0.1:5002";
const ENDPOINTS = {
    news: `${BASE_URL}/api/news`,
    rssFeed: `${BASE_URL}/api/rss-feed`,
    grok: `${BASE_URL}/api/ask-grok`,
    perplexity: `${BASE_URL}/api/ask-perplexity`,
    deepseek: `${BASE_URL}/api/ask-deepseek`,
    openai: `${BASE_URL}/api/ask-openai`
};

const ANALYSIS_INSTRUCTIONS = `Please convert each news item into the following HTML format:

<div class="news-item">
    <h3>TITLE HERE</h3>
    <p>CONTENT HERE</p>
    <div class="source">SOURCE URL HERE</div>
</div>

Important formatting rules:
1. Each story must be wrapped in a div with class "news-item"
2. Title must be in h3 tags
3. Content must be in p tags
4. Source URL must be in a div with class "source" (extract from the citation links/references)
5. Remove any markdown formatting (**, [], etc.)
6. Do not add any extra text, headers, or summaries
7. Use exact HTML tags as shown above

Example:
<div class="news-item">
    <h3>Google Expands AI Team</h3>
    <p>Google announces major expansion with 1000 new AI roles across US offices. Salaries range from $150,000 to $300,000.</p>
    <div class="source">https://example.com/google-expansion</div>
</div>

Please process all stories in this exact HTML format.`;

const EXAMPLE_RAW_RESPONSE = ``;

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
    responseContainer.classList.remove('hidden');
    responseContainer.innerHTML = `
        <div class="loading-indicator">
            <p>Processing request... This may take a few minutes</p>
            <div class="loading-spinner"></div>
        </div>
    `;

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

        // Both Perplexity and OpenAI responses should show in the raw response textarea
        if (model === 'perplexity' || model === 'openai') {
            displayRawPerplexityResponse(data);
        } else {
            displayFormattedResponse(data, model);
        }
    } catch (error) {
        console.error(`${model} Error:`, error);
        responseContainer.innerHTML = `
            <div class="error-message">
                <p>Error: ${error.message}</p>
                <button onclick="askAI('${model}')" class="btn btn-${model}">Try Again</button>
            </div>
        `;
    }
}

function displayRawPerplexityResponse(data) {
    const responseContainer = document.getElementById('response');
    responseContainer.classList.remove('hidden');

    // Just dump the raw response into the textarea
    responseContainer.innerHTML = `
        <div class="response-boxes">
            <div class="response-box">
                <h4>Raw Response</h4>
                <textarea id="rawResponse" class="response-textarea" rows="10" placeholder="Perplexity response will appear here...">${data.choices[0].message.content}</textarea>
            </div>
            <div class="response-box">
                <h4>Analysis Prompt</h4>
                <textarea id="analysisPrompt" class="response-textarea" rows="10" placeholder="Edit this prompt for analysis...">${ANALYSIS_INSTRUCTIONS}</textarea>
            </div>
        </div>
        <div class="response-box full-width">
            <h4>AI Analysis Response (Optional)</h4>
            <textarea id="aiResponse" class="response-textarea" rows="10" placeholder="If you have a Deepseek/Grok response to render, paste it here. Otherwise, leave empty to generate new analysis."></textarea>
        </div>
        <div class="button-row">
            <button onclick="analyzeWithAI('grok')" class="btn btn-grok">Analyze with Grok</button>
            <button onclick="analyzeWithAI('deepseek')" class="btn btn-deepseek">Analyze with DeepSeek</button>
        </div>
        <div id="analysisResults"></div>
    `;
}

async function analyzeWithAI(model) {
    const aiResponse = document.getElementById('aiResponse').value.trim();
    const resultsContainer = document.getElementById('analysisResults');

    // Show loading indicator
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <p>Analyzing with ${model}...</p>
            <div class="loading-spinner"></div>
        </div>
    `;

    // If aiResponse is populated, use that directly
    if (aiResponse) {
        try {
            // Replace literal \n with actual newlines and normalize
            const normalizedResponse = aiResponse
                .replace(/\\n/g, '\n')  // Replace \n with actual newlines
                .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
                .trim();

            const data = {
                choices: [{
                    message: {
                        content: normalizedResponse
                    }
                }]
            };

            displayFormattedResponse(data, model);
            return;
        } catch (error) {
            console.error('Error processing AI response:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <p>Error processing AI response: ${error.message}</p>
                    <button onclick="analyzeWithAI('${model}')" class="btn btn-${model}">Try Again</button>
                </div>
            `;
            return;
        }
    }

    const rawResponse = document.getElementById('rawResponse').value;
    const formattingInstructions = document.getElementById('analysisPrompt').value;

    // Just use what's in the textarea directly
    const combinedPrompt = `${formattingInstructions}\n\nHere is the content to analyze:\n\n${rawResponse}`;

    // Show what's being sent
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <p>Analyzing with ${model}...</p>
            <div class="loading-spinner"></div>
        </div>
        <div class="prompt-log" style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <h4>Sending to ${model}:</h4>
            <pre style="white-space: pre-wrap; overflow-wrap: break-word;">${combinedPrompt}</pre>
        </div>
    `;

    try {
        const response = await fetch(ENDPOINTS[model], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: combinedPrompt })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        displayFormattedResponse(data, model);
    } catch (error) {
        console.error(`${model} Analysis Error:`, error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                <p>Error: ${error.message}</p>
                <button onclick="analyzeWithAI('${model}')" class="btn btn-${model}">Try Again</button>
            </div>
        `;
    }
}

function displayFormattedResponse(data, model) {
    const resultsContainer = document.getElementById('analysisResults');
    const content = data.choices?.[0]?.message?.content || data.answer || '';

    // Create a temporary container to parse HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = content;

    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('ai-items-container');

    // Get all news items
    const newsItems = tempContainer.getElementsByClassName('news-item');

    Array.from(newsItems).forEach((item) => {
        const title = item.querySelector('h3')?.textContent || 'Untitled';
        const content = item.querySelector('p')?.textContent || '';
        const sourceUrl = item.querySelector('.source')?.textContent?.trim() || '';

        // Try to extract source name from URL
        let sourceName = 'Unknown';
        try {
            if (sourceUrl) {
                const url = new URL(sourceUrl);
                sourceName = url.hostname.replace('www.', '');
            }
        } catch (e) {
            console.warn('Could not parse URL for source name:', e);
        }

        const safeContent = {
            title: title.replace(/[\\"']/g, '\\$&'),
            description: content.replace(/[\\"']/g, '\\$&'),
            url: sourceUrl,
            source: sourceName,
            type: 'ai_api_response',
            published_at: new Date().toISOString(),
            is_active: true,
            metadata: {
                model: model
            }
        };

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('ai-response-item');

        itemDiv.innerHTML = `
            <h4>${safeContent.title}</h4>
            <p>${content}</p>
            <div class="source-info">
                <small>Source: ${safeContent.source}</small>
            </div>
            <div class="action-buttons">
                ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" class="btn-link">Source</a>` : ''}
                <add-content-button content='${JSON.stringify(safeContent).replace(/'/g, "&apos;")}'></add-content-button>
            </div>
        `;

        itemsContainer.appendChild(itemDiv);
    });

    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(itemsContainer);
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

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    fetchRSSFeed();

    // Show empty response container by default
    const responseContainer = document.getElementById('response');
    responseContainer.classList.remove('hidden');
    responseContainer.innerHTML = `
        <div class="response-boxes">
            <div class="response-box">
                <h4>Raw Response</h4>
                <textarea id="rawResponse" class="response-textarea" rows="10" placeholder="Paste your raw response here or wait for Perplexity response...">${EXAMPLE_RAW_RESPONSE}</textarea>
            </div>
            <div class="response-box">
                <h4>Analysis Prompt</h4>
                <textarea id="analysisPrompt" class="response-textarea" rows="10" placeholder="Edit this analysis prompt as needed...">${ANALYSIS_INSTRUCTIONS}</textarea>
            </div>
        </div>
        <div class="response-box full-width">
            <h4>AI Analysis Response (Optional)</h4>
            <textarea id="aiResponse" class="response-textarea" rows="10" placeholder="If you have a Deepseek/Grok response to render, paste it here. Otherwise, leave empty to generate new analysis."></textarea>
        </div>
        <div class="button-row">
            <button onclick="analyzeWithAI('grok')" class="btn btn-grok">Analyze with Grok</button>
            <button onclick="analyzeWithAI('deepseek')" class="btn btn-deepseek">Analyze with DeepSeek</button>
        </div>
        <div id="analysisResults"></div>
    `;

    // Pre-populate the question textbox with the default prompt
    const questionTextarea = document.getElementById('question');
    if (questionTextarea) {
        questionTextarea.value = "Perform a deep research query to gather positive tech news and social media posts from the last 10 days that focus exclusively on hiring, job growth, and successful tech initiatives. Exclude all negative stories such as layoffs or declines. For each positive news item, extract key details (company names, specific roles, dates, etc.) and list them numerically with their corresponding source citation numbers. Your response must be succinct, factual, and strictly limited to the requested information without any fluff or extraneous commentary.";
    }

    // Fetch initial stats
    document.getElementById('jobCount').textContent = 'Coming soon';
    document.getElementById('fundingAmount').textContent = 'Coming soon';
});
