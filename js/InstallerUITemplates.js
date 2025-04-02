/**
 * InstallerUITemplates.js
 * Handles template selection and filtering functionality for the installer UI
 */

import installerUICore from './InstallerUICore.js';

class InstallerUITemplates {
    constructor() {
        // Initialize template registry
        this.templateRegistry = this.createTemplateRegistry();
    }
    
    /**
     * Create the template registry
     * @returns {Array} Array of template objects
     */
    createTemplateRegistry() {
        return [
            this.createBasicApiTemplate(),
            this.createFullSuiteTemplate(),
            this.createMemoryOptimizedTemplate(),
            this.createDockerComposeTemplate(),
            this.createDeveloperTemplate()
        ];
    }
    
    /**
     * Create Basic API template
     * @returns {Object} Template object
     */
    createBasicApiTemplate() {
        return {
            id: 'basic-api',
            name: 'Basic API Server',
            description: 'A simple MCP server with basic API functionality',
            requirements: ['Node.js 14+'],
            tags: 'basic api simple lightweight'
        };
    }
    
    /**
     * Create Full Suite template
     * @returns {Object} Template object
     */
    createFullSuiteTemplate() {
        return {
            id: 'full-suite',
            name: 'Full MCP Server Suite',
            description: 'Complete suite of MCP servers with all available functionality',
            requirements: ['Node.js 14+', '4GB RAM', '2GB Disk Space'],
            tags: 'complete full advanced all'
        };
    }
    
    /**
     * Create Memory-Optimized template
     * @returns {Object} Template object
     */
    createMemoryOptimizedTemplate() {
        return {
            id: 'memory-optimized',
            name: 'Memory-Optimized Server',
            description: 'MCP server optimized for low memory usage',
            requirements: ['Node.js 14+', '1GB RAM'],
            tags: 'memory optimized lightweight low-resource'
        };
    }
    
    /**
     * Create Docker Compose template
     * @returns {Object} Template object
     */
    createDockerComposeTemplate() {
        return {
            id: 'docker-compose',
            name: 'Docker Compose Setup',
            description: 'MCP servers with Docker Compose configuration',
            requirements: ['Docker', 'Docker Compose'],
            tags: 'docker container compose containerized'
        };
    }
    
    /**
     * Create Developer template
     * @returns {Object} Template object
     */
    createDeveloperTemplate() {
        return {
            id: 'developer',
            name: 'Developer Environment',
            description: 'MCP server setup with development tools and debugging',
            requirements: ['Node.js 14+', 'Git'],
            tags: 'developer debug development tools'
        };
    }
    
    /**
     * Get all available templates
     * @returns {Array} Array of template objects
     */
    getTemplates() {
        return this.templateRegistry;
    }
    
    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object} Template object or null if not found
     */
    getTemplateById(templateId) {
        return this.templateRegistry.find(template => template.id === templateId) || null;
    }
    
    /**
     * Filter template cards based on search query
     * @param {string} query - The search query
     */
    filterTemplates(query) {
        // Normalize the query
        const normalizedQuery = query ? query.toLowerCase() : '';
        
        // Get all template cards
        const templateCards = document.querySelectorAll('.template-card');
        
        // Apply visibility filter to each card
        templateCards.forEach(card => {
            const isVisible = this.shouldTemplateBeVisible(card, normalizedQuery);
            card.style.display = isVisible ? 'block' : 'none';
        });
        
        // Log filtering
        if (query) {
            installerUICore.logMessage(`Filtering templates by: ${query}`, 'info');
        }
    }
    
    /**
     * Determine if a template card should be visible based on the search query
     * @param {Element} card - The template card element
     * @param {string} lowerQuery - The lowercase search query
     * @returns {boolean} Whether the card should be visible
     */
    shouldTemplateBeVisible(card, lowerQuery) {
        // If no query, show all templates
        if (!lowerQuery) {
            return true;
        }
        
        // Get searchable content
        const searchableContent = this.getSearchableContent(card);
        
        // Check if query is in the searchable content
        return searchableContent.includes(lowerQuery);
    }
    
    /**
     * Helper to get text content from an element using fallback selectors.
     * @param {Element} parentElement - The parent element to search within.
     * @param {string[]} selectors - An array of CSS selectors to try in order.
     * @returns {string} The text content of the first matching selector, or an empty string.
     * @private
     */
    _getTextContentWithFallback(parentElement, selectors) {
        for (const selector of selectors) {
            const element = parentElement.querySelector(selector);
            if (element && element.textContent) {
                return element.textContent.trim();
            }
        }
        return '';
    }

    /**
     * Get searchable content from a template card
     * @param {Element} card - The template card element
     * @returns {string} The searchable content in lowercase
     */
    getSearchableContent(card) {
        // Get title using helper
        const title = this._getTextContentWithFallback(card, ['h3', '.template-title']);
        
        // Get description using helper
        const description = this._getTextContentWithFallback(card, ['p', '.template-description']);
        
        // Get tags
        const tags = card.dataset.tags || '';
        
        // Combine and convert to lowercase
        return (title + ' ' + description + ' ' + tags).toLowerCase();
    }
    
    /**
     * Select a template
     * @param {Element} templateCard - The selected template card
     */
    selectTemplate(templateCard) {
        // Remove selected class from all template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selected class to the selected template
        templateCard.classList.add('selected');
        
        // Get template name
        const name = templateCard.querySelector('h3')?.textContent || 
                    templateCard.querySelector('.template-title')?.textContent || 
                    'Unknown template';
        
        // Log selection
        installerUICore.logMessage(`Selected template: ${name}`, 'info');
        
        // Update UI with template details
        this.updateTemplateDetails(templateCard);
    }
    
    /**
     * Update UI with template details
     * @param {Element} templateCard - The selected template card
     */
    updateTemplateDetails(templateCard) {
        // Get template ID
        const templateId = templateCard.dataset.template;
        
        // Find template details
        const template = this.getTemplateById(templateId);
        
        if (template) {
            // Update description
            const descriptionElement = document.getElementById('templateDescription');
            if (descriptionElement) {
                descriptionElement.textContent = template.description;
            }
            
            // Update requirements
            const requirementsElement = document.getElementById('templateRequirements');
            if (requirementsElement) {
                requirementsElement.textContent = template.requirements.join(', ');
            }
        }
    }
    
    /**
     * Select a method
     * @param {Element} methodOption - The selected method option
     */
    selectMethod(methodOption) {
        // Remove selected class from all method options
        document.querySelectorAll('.method-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to the selected method
        methodOption.classList.add('selected');
        
        // Get method name
        const name = methodOption.querySelector('h3')?.textContent || 'Unknown method';
        
        // Log selection
        installerUICore.logMessage(`Selected method: ${name}`, 'info');
        
        // Update UI based on selected method
        this.updateMethodUI(methodOption);
    }
    
    /**
     * Update UI based on selected method
     * @param {Element} methodOption - The selected method option
     */
    updateMethodUI(methodOption) {
        // Get method ID
        const methodId = methodOption.dataset.method;
        
        // Update UI based on method
        if (window.InstallerUIDisplay && window.InstallerUIDisplay.updateUIForMethod) {
            window.InstallerUIDisplay.updateUIForMethod(methodId);
        } else if (window.InstallerUI && window.InstallerUI.updateUIForMethod) {
            window.InstallerUI.updateUIForMethod(methodId);
        }
    }
    
    /**
     * Generate a random string of specified length
     * @param {number} length - The length of the string to generate
     * @returns {string} The generated random string
     */
    generateRandomString(length) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        // Create a Uint32Array of the required length
        const randomValues = new Uint32Array(length);
        
        // Fill with random values
        window.crypto.getRandomValues(randomValues);
        
        // Convert to string using the charset
        for (let i = 0; i < length; i++) {
            result += charset.charAt(randomValues[i] % charset.length);
        }
        
        return result;
    }
    
    /**
     * Initialize template functionality
     */
    initTemplates() {
        // Set up template search
        this.setupTemplateSearch();
        
        // Set up template selection
        this.setupTemplateSelection();
        
        // Set up method selection
        this.setupMethodSelection();
        
        // Set up secret generation
        this.setupSecretGeneration();
        
        // Log initialization
        installerUICore.logMessage('Template functionality initialized', 'info');
    }
    
    /**
     * Set up template search functionality
     */
    setupTemplateSearch() {
        const searchInput = document.getElementById('templateSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterTemplates(searchInput.value);
            });
        }
    }
    
    /**
     * Set up template selection functionality
     */
    setupTemplateSelection() {
        const templateCards = document.querySelectorAll('.template-card');
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectTemplate(card);
            });
        });
    }
    
    /**
     * Set up method selection functionality
     */
    setupMethodSelection() {
        const methodOptions = document.querySelectorAll('.method-option');
        
        methodOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectMethod(option);
            });
        });
    }
    
    /**
     * Set up secret generation functionality
     */
    setupSecretGeneration() {
        const generateButton = document.getElementById('generateSecret');
        const secretInput = document.getElementById('apiSecret');
        
        if (generateButton && secretInput) {
            generateButton.addEventListener('click', () => {
                secretInput.value = this.generateRandomString(32);
            });
        }
    }
}

// Create a singleton instance
const installerUITemplates = new InstallerUITemplates();

// Export the singleton
export default installerUITemplates;
