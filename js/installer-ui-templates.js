/**
 * Installer UI Templates - Template selection and filtering functionality
 */

/**
 * Filter template cards based on search query
 * @param {string} query - The search query
 */
function filterTemplates(query) {
    // Normalize the query
    const normalizedQuery = normalizeSearchQuery(query);
    
    // Get all template cards
    const templateCards = getTemplateCards();
    
    // Apply visibility filter to each card
    applyTemplateFiltering(templateCards, normalizedQuery);
    
    // Log filtering
    logFilteringAction(query);
}

/**
 * Normalize search query by converting to lowercase
 * @param {string} query - The search query
 * @returns {string} Normalized query
 */
function normalizeSearchQuery(query) {
    return (query || '').toLowerCase();
}

/**
 * Get all template cards from the DOM
 * @returns {NodeList} Collection of template card elements
 */
function getTemplateCards() {
    return document.querySelectorAll('.template-card');
}

/**
 * Apply filtering to all template cards
 * @param {NodeList} templateCards - Collection of template card elements
 * @param {string} lowerQuery - The lowercase search query
 */
function applyTemplateFiltering(templateCards, lowerQuery) {
    templateCards.forEach(card => {
        const isVisible = shouldTemplateBeVisible(card, lowerQuery);
        updateCardVisibility(card, isVisible);
    });
}

/**
 * Update a card's visibility based on filter result
 * @param {Element} card - The template card element
 * @param {boolean} isVisible - Whether the card should be visible
 */
function updateCardVisibility(card, isVisible) {
    card.style.display = isVisible ? 'block' : 'none';
}

/**
 * Log the filtering action if a query is provided
 * @param {string} query - The search query
 */
function logFilteringAction(query) {
    if (query) {
        logMessage(`Filtering templates by: ${query}`, 'info');
    }
}

/**
 * Determine if a template card should be visible based on the search query
 * @param {Element} card - The template card element
 * @param {string} lowerQuery - The lowercase search query
 * @returns {boolean} Whether the card should be visible
 */
function shouldTemplateBeVisible(card, lowerQuery) {
    if (lowerQuery === '') {
        return true;
    }
    
    const searchableContent = getSearchableContent(card);
    return searchableContent.includes(lowerQuery);
}

/**
 * Get searchable content from a template card
 * @param {Element} card - The template card element
 * @returns {string} The searchable content in lowercase
 */
function getSearchableContent(card) {
    const title = getElementText(card, 'h3') || getElementText(card, '.template-title') || '';
    const description = getElementText(card, 'p') || getElementText(card, '.template-description') || '';
    const tags = card.dataset.tags || '';
    
    return (title + ' ' + description + ' ' + tags).toLowerCase();
}

/**
 * Get text content from an element
 * @param {Element} parent - The parent element
 * @param {string} selector - The selector for the child element
 * @returns {string|null} The text content or null if not found
 */
function getElementText(parent, selector) {
    const element = parent.querySelector(selector);
    return element ? element.textContent : null;
}

/**
 * Select a template
 * @param {Element} templateCard - The selected template card
 */
function selectTemplate(templateCard) {
    // Apply selection
    applySelection('.template-card', templateCard);
    
    // Get name and log selection
    const name = getElementName(templateCard, 'h3', '.template-title', 'Unknown template');
    logMessage(`Selected template: ${name}`, 'info');
}

/**
 * Select a method
 * @param {Element} methodOption - The selected method option
 */
function selectMethod(methodOption) {
    // Apply selection
    applySelection('.method-option', methodOption);
    
    // Get name and log selection
    const name = getElementName(methodOption, 'h3', null, 'Unknown method');
    logMessage(`Selected method: ${name}`, 'info');
}

/**
 * Apply selection to an element by adding 'selected' class and removing it from others
 * @param {string} groupSelector - Selector for the group of elements
 * @param {Element} selectedElement - The element to select
 */
function applySelection(groupSelector, selectedElement) {
    // Remove selected class from all elements in the group
    const elements = document.querySelectorAll(groupSelector);
    elements.forEach(element => {
        element.classList.remove('selected');
    });
    
    // Add selected class to the selected element
    selectedElement.classList.add('selected');
}

/**
 * Get element name from primary and fallback selectors
 * @param {Element} element - The element to get name from
 * @param {string} primarySelector - Primary selector for name
 * @param {string|null} fallbackSelector - Fallback selector for name
 * @param {string} defaultName - Default name if not found
 * @returns {string} The element name
 */
function getElementName(element, primarySelector, fallbackSelector, defaultName) {
    let name = getElementText(element, primarySelector);
    
    if (!name && fallbackSelector) {
        name = getElementText(element, fallbackSelector);
    }
    
    return name || defaultName;
}

/**
 * Log a message using the available logger
 * @param {string} message - The message to log
 * @param {string} level - The log level
 */
function logMessage(message, level) {
    if (typeof InstallerLogger !== 'undefined' && InstallerLogger.logMessage) {
        InstallerLogger.logMessage(message, level);
    } else {
        console.log(message);
    }
}

/**
 * Generate a random secret
 */
function generateSecret() {
    const jwtSecretInput = document.getElementById('jwtSecret');
    if (!jwtSecretInput) return;
    
    // Generate a random string
    const secret = generateRandomString(32);
    
    jwtSecretInput.value = secret;
    logMessage('Generated JWT secret', 'success');
}

/**
 * Generate a random string of specified length
 * @param {number} length - The length of the string to generate
 * @returns {string} The generated random string
 */
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

// Export functions for use in other modules
window.InstallerUITemplates = {
    filterTemplates,
    shouldTemplateBeVisible,
    getElementText,
    selectTemplate,
    selectMethod,
    generateSecret
};
