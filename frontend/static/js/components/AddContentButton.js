class AddContentButton extends HTMLElement {
    static modalTemplate = document.createElement('template');
    static modalInstance = null;

    static {
        // Create the modal template once
        this.modalTemplate.innerHTML = `
            <div id="content-preview-modal" class="modal-overlay">
                <div class="tooltip">
                    <button class="close-button">✕</button>
                    <h3>Preview Content to Add</h3>
                    <div class="preview-content-container"></div>
                </div>
            </div>
            <style>
                .modal-overlay {
                    visibility: hidden;
                    opacity: 0;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    transition: opacity 0.3s, visibility 0.3s;
                }

                .modal-overlay.show {
                    visibility: visible;
                    opacity: 1;
                }

                .tooltip {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    position: relative;
                    transform: scale(0.95);
                    transition: transform 0.3s;
                }

                .modal-overlay.show .tooltip {
                    transform: scale(1);
                }

                .preview-item {
                    margin: 12px 0;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }

                .preview-label {
                    font-weight: bold;
                    color: #666;
                    display: block;
                    margin-bottom: 4px;
                    font-size: 0.9em;
                }

                .preview-content {
                    display: block;
                    font-size: 1em;
                    color: #333;
                    line-height: 1.4;
                }

                .close-button {
                    position: absolute;
                    right: 15px;
                    top: 15px;
                    cursor: pointer;
                    color: #666;
                    border: none;
                    background: none;
                    font-size: 20px;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }

                .close-button:hover {
                    background-color: #f0f0f0;
                }

                h3 {
                    margin: 0 0 20px 0;
                    font-size: 1.2em;
                    color: #333;
                    padding-right: 40px;
                }
            </style>
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initializeModal();
    }

    initializeModal() {
        // Create modal only once if it doesn't exist
        if (!AddContentButton.modalInstance) {
            AddContentButton.modalInstance = AddContentButton.modalTemplate.content.cloneNode(true);
            document.body.appendChild(AddContentButton.modalInstance);

            const modal = document.getElementById('content-preview-modal');
            const closeButton = modal.querySelector('.close-button');

            // Close modal when clicking overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });

            // Close on close button click
            closeButton.addEventListener('click', () => {
                this.hideModal();
            });

            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideModal();
                }
            });
        }
    }

    showModal(contentData) {
        const modal = document.getElementById('content-preview-modal');
        const container = modal.querySelector('.preview-content-container');

        container.innerHTML = `
            <div class="preview-item">
                <span class="preview-label">Title:</span>
                <span class="preview-content">${contentData.title}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Content:</span>
                <span class="preview-content">${contentData.description || contentData.content || 'No content'}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Source:</span>
                <span class="preview-content">${contentData.source}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">URL:</span>
                <span class="preview-content">${contentData.url}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Type:</span>
                <span class="preview-content">${contentData.type || 'rss'}</span>
            </div>
        `;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        const modal = document.getElementById('content-preview-modal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    connectedCallback() {
        const content = this.getAttribute('content');
        const contentData = JSON.parse(content);

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }

                .add-button {
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s;
                }

                .add-button:hover {
                    background-color: #45a049;
                }
            </style>

            <button class="add-button">Add</button>
        `;

        const button = this.shadowRoot.querySelector('.add-button');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showModal(contentData);
        });
    }
}

customElements.define('add-content-button', AddContentButton);