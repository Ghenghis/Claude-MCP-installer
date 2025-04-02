/**
 * Installer UI Templates - Template selection and filtering functionality
 * This file is maintained for backward compatibility
 * New code should use the InstallerUITemplates module directly
 */

import installerUITemplates from './InstallerUITemplates.js';

/**
 * Get all available templates
 * @returns {Array} Array of template objects
 */
function getTemplates() {
    return installerUITemplates.getTemplates();
}

/**
 * Filter template cards based on search query
 * @param {string} query - The search query
 */
function filterTemplates(query) {
    installerUITemplates.filterTemplates(query);
}

/**
 * Determine if a template card should be visible based on the search query
 * @param {Element} card - The template card element
 * @param {string} lowerQuery - The lowercase search query
 * @returns {boolean} Whether the card should be visible
 */
function shouldTemplateBeVisible(card, lowerQuery) {
    return installerUITemplates.shouldTemplateBeVisible(card, lowerQuery);
}

/**
 * Get searchable content from a template card
 * @param {Element} card - The template card element
 * @returns {string} The searchable content in lowercase
 */
function getSearchableContent(card) {
    return installerUITemplates.getSearchableContent(card);
}

/**
 * Select a template
 * @param {Element} templateCard - The selected template card
 */
function selectTemplate(templateCard) {
    installerUITemplates.selectTemplate(templateCard);
}

/**
 * Update UI with template details
 * @param {Element} templateCard - The selected template card
 */
function updateTemplateDetails(templateCard) {
    installerUITemplates.updateTemplateDetails(templateCard);
}

/**
 * Select a method
 * @param {Element} methodOption - The selected method option
 */
function selectMethod(methodOption) {
    installerUITemplates.selectMethod(methodOption);
}

/**
 * Update UI based on selected method
 * @param {Element} methodOption - The selected method option
 */
function updateMethodUI(methodOption) {
    installerUITemplates.updateMethodUI(methodOption);
}

/**
 * Generate a random string of specified length
 * @param {number} length - The length of the string to generate
 * @returns {string} The generated random string
 */
function generateRandomString(length) {
    return installerUITemplates.generateRandomString(length);
}

/**
 * Log a message using the available logger
 * @param {string} message - The message to log
 * @param {string} level - The log level
 */
function logMessage(message, level = 'info') {
    if (window.InstallerUICore && window.InstallerUICore.logMessage) {
        window.InstallerUICore.logMessage(message, level);
    } else {
        console.log(`[${level.toUpperCase()}] ${message}`);
    }
}

/**
 * Initialize template functionality
 */
function initTemplates() {
    installerUITemplates.initTemplates();
}

/**
 * Set up template search functionality
 */
function setupTemplateSearch() {
    installerUITemplates.setupTemplateSearch();
}

/**
 * Set up template selection functionality
 */
function setupTemplateSelection() {
    installerUITemplates.setupTemplateSelection();
}

/**
 * Set up method selection functionality
 */
function setupMethodSelection() {
    installerUITemplates.setupMethodSelection();
}

/**
 * Set up secret generation functionality
 */
function setupSecretGeneration() {
    installerUITemplates.setupSecretGeneration();
}

// Export functions for use in other modules
window.InstallerUITemplates = {
    getTemplates,
    filterTemplates,
    shouldTemplateBeVisible,
    getSearchableContent,
    selectTemplate,
    updateTemplateDetails,
    selectMethod,
    updateMethodUI,
    generateRandomString,
    logMessage,
    initTemplates,
    setupTemplateSearch,
    setupTemplateSelection,
    setupMethodSelection,
    setupSecretGeneration
};
