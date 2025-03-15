const BASE_URL = "http://127.0.0.1:5002";
const ENDPOINTS = {
    news: `${BASE_URL}/api/news`,
    rssFeed: `${BASE_URL}/api/rss-feed`,
    grok: `${BASE_URL}/api/ask-grok`,
    perplexity: `${BASE_URL}/api/ask-perplexity`,
    deepseek: `${BASE_URL}/api/ask-deepseek`,
    openai: `${BASE_URL}/api/ask-openai`
};

const ANALYSIS_INSTRUCTIONS = `Please analyze this content. For each news item:

1. Remove any markdown formatting (**, [], etc.)
2. Provide a clear, concise title
3. Include a detailed description without any special formatting
4. Include the citation number at the end of each item
5. Do not include any introductory text or summaries
6. Do not include any section headers or separators

Example format for each item:
Title: The actual title here
Content: The full description here
Citation: [X]

Please provide each story in this exact format, numbered from 1 onwards.`;

const EXAMPLE_RAW_RESPONSE = `Here's a numbered list of tech hiring news stories from the past 10 days:

1. **Major Tech Expansion** - Google announces 1000 new AI roles across US offices. Salaries range from $150,000 to $300,000. [1]

2. **Startup Growth** - AI startup DeepMind doubles its engineering team, adding 200 positions. [2]

3. **Industry Shift** - Tech hiring in renewable energy sector up 45% since January. [3]`;

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
    responseText.innerHTML = `
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

        if (model === 'perplexity') {
            displayRawPerplexityResponse(data);
        } else {
            displayFormattedResponse(data, model);
        }
    } catch (error) {
        console.error(`${model} Error:`, error);
        responseText.innerHTML = `
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

    // Store the citations array globally for later use
    window.lastPerplexityCitations = data.citations || [];

    // Create the response structure
    responseContainer.innerHTML = `
        <div class="response-boxes">
            <div class="response-box">
                <h4>Raw Response</h4>
                <textarea id="rawResponse" class="response-textarea" rows="10" placeholder="Perplexity response will appear here...">${data.choices[0].message.content}</textarea>
            </div>
            <div class="response-box">
                <h4>Analysis Prompt</h4>
                <textarea id="analysisPrompt" class="response-textarea" rows="10" placeholder="Edit this prompt for analysis...">Extract all positive news stories from this content.</textarea>
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

            // Make sure we have the citations array available
            if (!window.lastPerplexityCitations) {
                window.lastPerplexityCitations = [];
            }

            // Extract citation numbers from the content
            const citationMatches = normalizedResponse.match(/\[(\d+)\]/g) || [];
            window.lastPerplexityCitations = citationMatches.map(() => '');  // Create empty citations array matching the number of citations

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
    const citations = window.lastPerplexityCitations || [];

    // Split content into individual stories based on Title: pattern
    const stories = content.split(/(?=Title:)/).filter(story => story.trim());

    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('ai-items-container');

    stories.forEach((story) => {
        const titleMatch = story.match(/Title:\s*(.+?)(?=\nContent:)/s);
        const contentMatch = story.match(/Content:\s*(.+?)(?=\nCitation:)/s);
        const citationMatch = story.match(/Citation:\s*\[(\d+)\]/);

        if (!titleMatch || !contentMatch) return;

        const title = titleMatch[1].trim();
        const content = contentMatch[1].trim();
        const citationIndex = citationMatch ? parseInt(citationMatch[1]) - 1 : -1;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('ai-response-item');

        // Escape special characters in content for JSON
        const safeContent = {
            title: title.replace(/[\\"']/g, '\\$&'),
            content: content.replace(/[\\"']/g, '\\$&'),
            source_url: citations[citationIndex] || '',
            source_name: model.charAt(0).toUpperCase() + model.slice(1),
            sentiment: 'positive',
            content_type: 'ai_generated',
            published_at: new Date().toISOString(),
            is_active: true,
            metadata: {
                citations: citations,
                original_citation_index: citationIndex + 1
            }
        };

        itemDiv.innerHTML = `
            <h4>${safeContent.title}</h4>
            <p>${safeContent.content}</p>
            <div class="action-buttons">
                ${citations[citationIndex] ? `<a href="${citations[citationIndex]}" target="_blank" class="btn-link">Source</a>` : ''}
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

function loadDefaultPrompt() {
    const defaultPrompt = "Find me good news in tech, particularly around hiring, jobs and layoffs, from the last 10 days\n and give me the sources. Include social media if you can with sources/links.";
    const textarea = document.getElementById('question');
    textarea.value = defaultPrompt;
    textarea.focus();
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

    // Fetch initial stats
    document.getElementById('jobCount').textContent = 'Coming soon';
    document.getElementById('fundingAmount').textContent = 'Coming soon';
});
