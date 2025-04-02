// Logic for the MCP GitHub Search feature

console.log("MCP Search JS Loaded");

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchButton = document.getElementById('githubSearchBtn');
    const searchInput = document.getElementById('githubSearchQuery');
    const resultsContainer = document.getElementById('githubSearchResults');
    const loadingIndicator = resultsContainer.querySelector('.loading-indicator');
    const errorMessage = resultsContainer.querySelector('.error-message');
    const defaultMessage = resultsContainer.querySelector('p'); // The initial 'Enter keywords...' message
    const sortSelect = document.getElementById('githubSort');
    const filterType = document.getElementById('filterType');
    const filterLanguage = document.getElementById('filterLanguage');
    const aiSearchMode = document.getElementById('aiSearchMode');
    const resultsCount = document.getElementById('resultsCount');

    // Storage key for installation queue
    const MCP_INSTALL_QUEUE_KEY = 'mcpInstallQueue';

    // Installation queue
    let installationQueue = loadQueueFromStorage();

    // Queue UI elements
    const queueListContainer = document.getElementById('installationQueueList');
    const installQueueButton = document.getElementById('installQueueBtn');
    const clearQueueButton = document.getElementById('clearQueueBtn');
    const emptyQueueMessage = queueListContainer.querySelector('.empty-queue-message');

    // MCP server repositories to include in search results
    const knownMcpRepos = [
        { owner: 'punkpeye', repo: 'awesome-mcp-servers', type: 'collection' },
        { owner: 'davidteren', repo: 'claude-server', type: 'context' },
        { owner: 'GongRzhe', repo: 'JSON-MCP-Server', type: 'data' },
        { owner: 'anaisbetts', repo: 'mcp-installer', type: 'installer' },
        { owner: 'cline', repo: 'mcp-marketplace', type: 'marketplace' },
        { owner: 'browserbase', repo: 'mcp-server-browserbase', type: 'browser' },
        { owner: 'modelcontextprotocol', repo: 'servers', type: 'official' }
    ];

    // Initialize event listeners
    if (searchButton && searchInput && resultsContainer && loadingIndicator && errorMessage && sortSelect) {
        searchButton.addEventListener('click', performSearch);
        
        // Allow pressing Enter in the input field to trigger search
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });

        // Add event listeners for filters to trigger search on change
        sortSelect.addEventListener('change', () => {
            if (searchInput.value.trim()) {
                performSearch();
            }
        });

        filterType.addEventListener('change', () => {
            if (searchInput.value.trim()) {
                performSearch();
            }
        });

        filterLanguage.addEventListener('change', () => {
            if (searchInput.value.trim()) {
                performSearch();
            }
        });
    } else {
        console.error('Search UI elements not found!');
        // Optionally notify the user via UI if Logger is available
        // Logger?.log('Search UI could not be initialized.', 'error');
    }

    // Add event listeners for queue control buttons
    if (installQueueButton && clearQueueButton) {
        installQueueButton.addEventListener('click', handleInstallQueue);
        clearQueueButton.addEventListener('click', handleClearQueue);
    }

    /**
     * Performs the GitHub search with the current filters
     */
    async function performSearch() {
        const query = searchInput.value.trim();
        const sortBy = sortSelect.value;
        const typeFilter = filterType.value;
        const languageFilter = filterLanguage.value;
        const useAiSearch = aiSearchMode.checked;

        if (!query) {
            console.warn('Search query is empty.');
            // Use the error handler to show a user-friendly message
            window.ErrorHandler.handleError('INVALID_INPUT', 'Please enter a search term to find MCP servers', {
                suppressNotification: false,
                timeout: 3000
            });
            return;
        }

        // Clear previous results and show loading indicator
        resetSearchResults();
        loadingIndicator.style.display = 'flex';
        
        // Hide empty results message
        const emptyResultsMessage = resultsContainer.querySelector('.empty-results-message');
        if (emptyResultsMessage) {
            emptyResultsMessage.style.display = 'none';
        }

        // Construct the GitHub API URL with filters
        let searchQuery = `${encodeURIComponent(query)}`;
        
        // Add type filter if not "all"
        if (typeFilter !== 'all') {
            searchQuery += `+topic:${typeFilter}`;
        }
        
        // Add language filter if not "all"
        if (languageFilter !== 'all') {
            searchQuery += `+language:${languageFilter}`;
        }
        
        // Always focus on MCP servers
        searchQuery += '+topic:mcp-server+OR+MCP+Server+in:name,description,readme';
        
        const apiUrl = `https://api.github.com/search/repositories?q=${searchQuery}&sort=${sortBy}&order=desc&per_page=20`;

        console.log(`Searching GitHub API: ${apiUrl}`);
        
        try {
            // Fetch from GitHub API
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Check for rate limit errors specifically
                if (response.status === 403 && errorData.message.includes('rate limit')) {
                    throw new Error('API_RATE_LIMIT');
                } else {
                    throw new Error(`GitHub API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
                }
            }

            const data = await response.json();
            
            // Hide loading indicator
            loadingIndicator.style.display = 'none';

            if (data.items && data.items.length > 0) {
                // Update results count
                resultsCount.textContent = `${data.items.length} results`;
                
                // Display results
                displayResults(data.items);
                
                // If AI search is enabled, enhance the results
                if (useAiSearch) {
                    enhanceResultsWithAI(data.items);
                }
            } else {
                // Show no results message
                emptyResultsMessage.style.display = 'flex';
                emptyResultsMessage.querySelector('p').textContent = 'No MCP servers found matching your query. Try different keywords or filters.';
                resultsCount.textContent = '0 results';
            }

        } catch (error) {
            console.error('Error fetching GitHub search results:', error);
            loadingIndicator.style.display = 'none';
            
            // Use the error handler to show a user-friendly message
            if (error.message === 'API_RATE_LIMIT') {
                window.ErrorHandler.handleError('API_RATE_LIMIT', 'GitHub API rate limit exceeded. Please try again later or use more specific search terms.');
                errorMessage.querySelector('p').textContent = 'GitHub API rate limit exceeded. Please try again in a few minutes or use more specific search terms.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                window.ErrorHandler.handleError('NETWORK_ERROR', 'Unable to connect to GitHub. Please check your internet connection and try again.');
                errorMessage.querySelector('p').textContent = 'Unable to connect to GitHub. Please check your internet connection and try again.';
            } else {
                window.ErrorHandler.handleError('SEARCH_FAILED', 'An error occurred while searching. Please try again with different search terms.');
                errorMessage.querySelector('p').textContent = 'An error occurred while searching. Please try again with different search terms.';
            }
            
            // Show error message in the results area
            errorMessage.style.display = 'flex';
            resultsCount.textContent = '0 results';
        }
    }

    /**
     * Resets the search results container
     */
    function resetSearchResults() {
        // Keep the loading, error, and empty message elements
        const loading = resultsContainer.querySelector('.loading-indicator');
        const error = resultsContainer.querySelector('.error-message');
        const emptyMessage = resultsContainer.querySelector('.empty-results-message');
        
        // Clear all other content
        resultsContainer.innerHTML = '';
        
        // Add back the special elements
        if (loading) resultsContainer.appendChild(loading);
        if (error) resultsContainer.appendChild(error);
        if (emptyMessage) resultsContainer.appendChild(emptyMessage);
        
        // Hide all special elements initially
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'none';
    }

    /**
     * Displays the search results in the UI
     * @param {Array} items - Array of repository items from GitHub API
     */
    function displayResults(items) {
        // Clear loading/error messages
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Clear previous results
        resultsContainer.innerHTML = '';

        // Create and append result items
        items.forEach(item => {
            const resultElement = createResultElement(item);
            resultsContainer.appendChild(resultElement);
        });

        // Add event listeners for the newly created buttons
        setupResultButtons();
    }

    /**
     * Creates a search result element for a repository
     * @param {Object} item - Repository item from GitHub API
     * @returns {HTMLElement} The created result element
     */
    function createResultElement(item) {
        // Create result card
        const resultElement = document.createElement('div');
        resultElement.classList.add('search-result-item');
        
        // Get repository metadata
        const repoMetadata = getRepositoryMetadata(item);
        
        // Create HTML content
        resultElement.innerHTML = `
            <h3><i class="fas fa-cube"></i> <a href="${item.html_url}" target="_blank">${item.full_name}</a></h3>
            <p>${item.description || 'No description available.'}</p>
            
            <div class="result-meta">
                ${createMetaItemsHTML(item, repoMetadata.formattedDate)}
            </div>
            
            <div class="result-tags">
                ${repoMetadata.tags.join('')}
            </div>
            
            <div class="result-actions">
                <button class="btn btn-sm btn-outline view-details-btn" data-repo-url="${item.html_url}">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                ${repoMetadata.queueButton}
            </div>
        `;
        
        return resultElement;
    }

    /**
     * Gets metadata for a repository
     * @param {Object} item - Repository item from GitHub API
     * @returns {Object} Repository metadata
     */
    function getRepositoryMetadata(item) {
        // Determine if this is a known MCP repository
        const knownRepo = knownMcpRepos.find(repo => 
            repo.owner.toLowerCase() === item.owner.login.toLowerCase() && 
            repo.repo.toLowerCase() === item.name.toLowerCase()
        );
        
        // Get repository type
        const repoType = knownRepo ? knownRepo.type : 'unknown';
        
        // Create tags
        const tags = createTagsArray(item, repoType);
        
        // Format the date nicely
        const updatedDate = new Date(item.updated_at);
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = updatedDate.toLocaleDateString(undefined, dateOptions);
        
        // Check if already in queue and create queue button
        const queueButton = createQueueButtonHTML(item);
        
        return {
            repoType,
            tags,
            formattedDate,
            queueButton
        };
    }

    /**
     * Creates an array of tag HTML strings for a repository
     * @param {Object} item - Repository item from GitHub API
     * @param {string} repoType - Type of the repository
     * @returns {Array} Array of tag HTML strings
     */
    function createTagsArray(item, repoType) {
        const tags = [];
        
        // Add language tag if available
        if (item.language) {
            tags.push(`<span class="result-tag language"><i class="fas fa-code"></i> ${item.language}</span>`);
        }
        
        // Add type tag with appropriate icon
        const typeIcons = {
            'collection': 'fas fa-layer-group',
            'context': 'fas fa-brain',
            'data': 'fas fa-database',
            'installer': 'fas fa-download',
            'marketplace': 'fas fa-store',
            'browser': 'fas fa-globe',
            'official': 'fas fa-check-circle',
            'unknown': 'fas fa-question-circle'
        };
        
        const typeIcon = typeIcons[repoType] || 'fas fa-tag';
        tags.push(`<span class="result-tag type"><i class="${typeIcon}"></i> ${repoType.charAt(0).toUpperCase() + repoType.slice(1)}</span>`);
        
        // Add topics as tags (limit to 3)
        if (item.topics && item.topics.length > 0) {
            item.topics.slice(0, 3).forEach(topic => {
                if (topic !== 'mcp-server') { // Skip the mcp-server topic as it's redundant
                    tags.push(`<span class="result-tag"><i class="fas fa-tag"></i> ${topic}</span>`);
                }
            });
        }
        
        return tags;
    }

    /**
     * Creates HTML for repository meta items
     * @param {Object} item - Repository item from GitHub API
     * @param {string} formattedDate - Formatted update date
     * @returns {string} HTML for meta items
     */
    function createMetaItemsHTML(item, formattedDate) {
        return `
            <div class="meta-item" title="Stars">
                <i class="fas fa-star"></i> ${item.stargazers_count.toLocaleString()}
            </div>
            <div class="meta-item" title="Forks">
                <i class="fas fa-code-branch"></i> ${item.forks_count.toLocaleString()}
            </div>
            <div class="meta-item" title="Last updated">
                <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </div>
            <div class="meta-item" title="Open issues">
                <i class="fas fa-exclamation-circle"></i> ${item.open_issues_count.toLocaleString()}
            </div>
        `;
    }

    /**
     * Creates HTML for the queue button
     * @param {Object} item - Repository item from GitHub API
     * @returns {string} HTML for the queue button
     */
    function createQueueButtonHTML(item) {
        // Check if already in queue
        const isInQueue = installationQueue.some(queueItem => 
            queueItem.repoUrl.includes(`${item.owner.login}/${item.name}`)
        );
        
        if (isInQueue) {
            return `
                <button class="btn btn-sm btn-outline add-to-queue-btn" disabled>
                    <i class="fas fa-check"></i> In Queue
                </button>
            `;
        } else {
            return `
                <button class="btn btn-sm btn-primary add-to-queue-btn" data-repo-url="${item.html_url}" data-repo-name="${item.full_name}">
                    <i class="fas fa-plus"></i> Add to Queue
                </button>
            `;
        }
    }

    /**
     * Sets up event listeners for buttons in search results
     */
    function setupResultButtons() {
        // Setup 'Add to Queue' buttons
        setupQueueButtons();
        
        // Setup 'View Details' buttons
        const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', handleViewDetails);
        });
    }

    /**
     * Handles clicking the 'View Details' button
     * @param {Event} event - The click event
     */
    function handleViewDetails(event) {
        const repoUrl = event.currentTarget.dataset.repoUrl;
        
        // Open the repository URL in a new tab
        window.open(repoUrl, '_blank');
    }

    /**
     * Enhances search results with AI-generated information
     * @param {Array} items - Array of repository items
     */
    function enhanceResultsWithAI(items) {
        // This would integrate with an AI service to enhance results
        // For now, we'll just log that AI enhancement would happen here
        console.log('AI enhancement would be applied to results here');
        
        // In a real implementation, this would:
        // 1. Send repository data to an AI service
        // 2. Get enhanced descriptions, categorizations, compatibility info
        // 3. Update the UI with this additional information
    }

    /**
     * Sets up event listeners for the 'Add to Queue' buttons
     */
    function setupQueueButtons() {
        const addToQueueButtons = document.querySelectorAll('.add-to-queue-btn');
        addToQueueButtons.forEach(button => {
            button.addEventListener('click', handleAddToQueueClick);
        });
    }

    /**
     * Handles clicking the 'Add to Queue' button
     * @param {Event} event - The click event
     */
    function handleAddToQueueClick(event) {
        const repoUrl = event.currentTarget.dataset.repoUrl;
        const repoName = event.currentTarget.dataset.repoName;
        
        // Check if this repo is already in the queue
        const existingItem = installationQueue.find(item => item.repoUrl === repoUrl);
        
        if (existingItem) {
            console.log(`Repository ${repoName} is already in the queue.`);
            // Optionally show a notification to the user
            return;
        }
        
        // Create a new queue item
        const newItem = {
            id: Date.now().toString(), // Use timestamp as unique ID
            repoName: repoName,
            repoUrl: repoUrl,
            status: 'pending', // pending, installing, success, error
            addedAt: new Date().toISOString(),
            errorMessage: null
        };
        
        // Add to queue
        installationQueue.push(newItem);
        
        // Save queue to storage
        saveQueueToStorage();
        
        // Update UI
        updateQueueUI();
        
        // Show notification
        console.log(`Added ${repoName} to installation queue.`);
    }

    /**
     * Updates the visual representation of the installation queue
     */
    function updateQueueUI() {
        // Clear the queue list container
        queueListContainer.innerHTML = '';
        
        // If queue is empty, show empty message
        if (installationQueue.length === 0) {
            queueListContainer.appendChild(emptyQueueMessage);
            setQueueButtonsState(true); // Disable buttons
            return;
        }
        
        // Enable queue buttons
        setQueueButtonsState(false);
        
        // Create queue items
        installationQueue.forEach(item => {
            const queueItemElement = document.createElement('div');
            queueItemElement.classList.add('queue-item');
            
            // Status icon based on item status
            let statusIcon, statusClass;
            switch (item.status) {
                case 'installing':
                    statusIcon = 'fa-spinner fa-spin';
                    statusClass = 'installing';
                    break;
                case 'success':
                    statusIcon = 'fa-check-circle';
                    statusClass = 'success';
                    break;
                case 'error':
                    statusIcon = 'fa-exclamation-circle';
                    statusClass = 'error';
                    break;
                default: // pending
                    statusIcon = 'fa-clock';
                    statusClass = 'pending';
            }
            
            queueItemElement.innerHTML = `
                <div class="queue-item-info">
                    <div class="queue-item-name">${item.repoName}</div>
                    <div class="queue-item-url">${item.repoUrl}</div>
                </div>
                <div class="queue-item-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    <span>${item.status}</span>
                </div>
                <div class="queue-item-actions">
                    <button class="btn btn-sm btn-outline remove-from-queue-btn" data-item-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            queueListContainer.appendChild(queueItemElement);
        });
        
        // Add event listeners for remove buttons
        const removeButtons = queueListContainer.querySelectorAll('.remove-from-queue-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = event.currentTarget.dataset.itemId;
                handleRemoveFromQueue(itemId);
            });
        });
    }

    /**
     * Handles the 'Install Queue' button click
     */
    async function handleInstallQueue() {
        // Disable queue buttons during installation
        setQueueButtonsState(true);
        
        // Get pending items
        const pendingItems = installationQueue.filter(item => item.status === 'pending');
        
        if (pendingItems.length === 0) {
            console.log('No pending items in the queue.');
            setQueueButtonsState(false);
            return;
        }
        
        console.log(`Installing ${pendingItems.length} items from queue...`);
        
        // Create installer instance (assuming we have an installer class)
        const installer = window.Installer || null;
        
        if (!installer) {
            console.error('Installer not found!');
            pendingItems.forEach(item => {
                updateItemStatus(item.id, 'error', 'Installer not available');
            });
            setQueueButtonsState(false);
            return;
        }
        
        // Process each item sequentially
        for (const item of pendingItems) {
            await processQueueItem(item, installer);
        }
        
        // Re-enable queue buttons
        setQueueButtonsState(false);
        
        console.log('Queue installation complete.');
    }

    /**
     * Process a single queue item installation
     * @param {Object} item - Queue item to process
     * @param {Object} installer - Installer instance
     */
    async function processQueueItem(item, installer) {
        // Update status to installing
        updateItemStatus(item.id, 'installing');
        
        try {
            // Create log callback for this item
            const logCallback = createItemLogCallback(item);
            
            // Start installation
            console.log(`Installing ${item.repoName}...`);
            
            // Call installer with repository URL
            const result = await installer.installFromGitHub(
                item.repoUrl,
                { logCallback }
            );
            
            if (result.success) {
                updateItemStatus(item.id, 'success');
                console.log(`Successfully installed ${item.repoName}`);
            } else {
                updateItemStatus(item.id, 'error', result.error || 'Unknown error');
                console.error(`Failed to install ${item.repoName}: ${result.error}`);
            }
        } catch (error) {
            updateItemStatus(item.id, 'error', error.message);
            console.error(`Error installing ${item.repoName}:`, error);
        }
    }

    /**
     * Create a log callback function for a specific queue item
     * @param {Object} item - Queue item
     * @returns {Function} Log callback function
     */
    function createItemLogCallback(item) {
        return (message, type = 'info') => {
            // Log to console
            console.log(`[${item.repoName}] ${message}`);
            
            // Here you could also update a progress indicator or log in the UI
            // For example, adding a progress element to the queue item
            
            // If there's a global logger, use it too
            if (window.Logger) {
                window.Logger.log(message, type);
            }
        };
    }

    /**
     * Update a queue item's status and save
     * @param {string} itemId - ID of the item to update
     * @param {string} status - New status
     * @param {string|null} errorMessage - Error message if status is 'error'
     */
    function updateItemStatus(itemId, status, errorMessage = null) {
        const itemIndex = installationQueue.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            console.error(`Item with ID ${itemId} not found in queue.`);
            return;
        }
        
        installationQueue[itemIndex].status = status;
        
        if (status === 'error' && errorMessage) {
            installationQueue[itemIndex].errorMessage = errorMessage;
        }
        
        // Save queue to storage
        saveQueueToStorage();
        
        // Update UI
        updateQueueUI();
    }

    /**
     * Set the enabled/disabled state of queue buttons
     * @param {boolean} disabled - Whether buttons should be disabled
     */
    function setQueueButtonsState(disabled) {
        installQueueButton.disabled = disabled;
        clearQueueButton.disabled = disabled;
    }

    /**
     * Removes an item from the queue by its ID
     * @param {string} itemId - ID of the item to remove
     */
    function handleRemoveFromQueue(itemId) {
        // Filter out the item with the given ID
        installationQueue = installationQueue.filter(item => item.id !== itemId);
        
        // Save queue to storage
        saveQueueToStorage();
        
        // Update UI
        updateQueueUI();
        
        console.log(`Removed item ${itemId} from queue.`);
    }

    /**
     * Clears all items from the installation queue
     */
    function handleClearQueue() {
        // Confirm before clearing
        const confirmClear = confirm('Are you sure you want to clear the installation queue?');
        
        if (!confirmClear) {
            return;
        }
        
        // Clear queue
        installationQueue = [];
        
        // Save empty queue to storage
        saveQueueToStorage();
        
        // Update UI
        updateQueueUI();
        
        console.log('Installation queue cleared.');
    }

    /**
     * Validate a queue item has all required properties
     * @param {Object} item - Queue item to validate
     * @returns {boolean} Whether the item is valid
     */
    function isValidQueueItem(item) {
        return (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.repoName === 'string' &&
            typeof item.repoUrl === 'string' &&
            typeof item.status === 'string' &&
            typeof item.addedAt === 'string'
        );
    }

    /**
     * Filter valid items from the parsed queue
     * @param {Array} parsedQueue - Parsed queue from storage
     * @returns {Array} Filtered valid items
     */
    function filterValidQueueItems(parsedQueue) {
        if (!Array.isArray(parsedQueue)) {
            console.warn('Parsed queue is not an array, returning empty array.');
            return [];
        }
        
        const validItems = parsedQueue.filter(isValidQueueItem);
        
        if (validItems.length !== parsedQueue.length) {
            console.warn(`Filtered out ${parsedQueue.length - validItems.length} invalid queue items.`);
        }
        
        return validItems;
    }

    /**
     * Saves the current installation queue to localStorage
     */
    function saveQueueToStorage() {
        try {
            const queueJson = JSON.stringify(installationQueue);
            localStorage.setItem(MCP_INSTALL_QUEUE_KEY, queueJson);
            console.log('Installation queue saved to storage.');
        } catch (error) {
            console.error('Error saving installation queue to storage:', error);
            
            // If there's a global logger, log the error
            if (window.Logger) {
                window.Logger.log(`Error saving queue: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Loads the installation queue from localStorage
     * @returns {Array} Installation queue
     */
    function loadQueueFromStorage() {
        try {
            const queueJson = localStorage.getItem(MCP_INSTALL_QUEUE_KEY);
            
            if (!queueJson) {
                console.log('No installation queue found in storage, using empty array.');
                return [];
            }
            
            const parsedQueue = JSON.parse(queueJson);
            const validQueue = filterValidQueueItems(parsedQueue);
            
            console.log(`Loaded ${validQueue.length} items from installation queue.`);
            return validQueue;
        } catch (error) {
            console.error('Error loading installation queue from storage:', error);
            
            // If there's a global logger, log the error
            if (window.Logger) {
                window.Logger.log(`Error loading queue: ${error.message}`, 'error');
            }
            
            return [];
        }
    }

    // Initial UI update for queue
    updateQueueUI();
});
