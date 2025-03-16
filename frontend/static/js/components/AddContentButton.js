class AddContentButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.content = JSON.parse(this.getAttribute('content'));
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .content-fields {
                    margin-top: 15px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: #f9f9f9;
                    clear: both;
                }
                .field {
                    margin-bottom: 10px;
                }
                .field label {
                    display: block;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 4px;
                }
                .field input, .field textarea {
                    width: 100%;
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .field textarea {
                    min-height: 60px;
                    resize: vertical;
                }
                .add-button {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .add-button:hover {
                    background: #45a049;
                }
                .metadata {
                    font-size: 12px;
                    color: #666;
                    margin-top: 8px;
                }
            </style>
            <div class="content-fields">
                <div class="field">
                    <label>Title</label>
                    <input type="text" id="title" value="${this.content.title || ''}" readonly>
                </div>
                <div class="field">
                    <label>Description</label>
                    <textarea id="description" readonly>${this.content.description || ''}</textarea>
                </div>
                <div class="field">
                    <label>URL</label>
                    <input type="text" id="url" value="${this.content.url || ''}" readonly>
                </div>
                <div class="field">
                    <label>Source</label>
                    <input type="text" id="source" value="${this.content.source || ''}" readonly>
                </div>
                <div class="metadata">
                    Type: ${this.content.type || 'N/A'} | Published: ${this.formatDate(this.content.published_at)}
                </div>
                <button class="add-button">Add to Database</button>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    }

    setupEventListeners() {
        const addButton = this.shadowRoot.querySelector('.add-button');
        addButton.addEventListener('click', () => {
            console.log('Add to database clicked:', this.content);
            // Database implementation will go here later
        });
    }
}

customElements.define('add-content-button', AddContentButton);