/**
 * Installer UI Core - Core UI initialization and event handling
 */

// Import dependencies from other modules
// These are already loaded via script tags in the HTML

/**
 * Initialize the installer UI when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initUI();
    
    // Add event listeners
    addEventListeners();
    
    // Show welcome message
    showWelcomeMessage();
});

/**
 * Initialize UI elements
 */
function initUI() {
    // Set default installation path based on OS
    const installPathInput = document.getElementById('installPath');
    if (installPathInput) {
        installPathInput.placeholder = InstallerUtils.detectOS() === 'windows' ? 
            'C:\\Program Files\\Claude Desktop MCP' : 
            '/opt/claude-desktop-mcp';
    }
    
    // Select first template by default
    const firstTemplate = document.querySelector('.template-card');
    if (firstTemplate) {
        firstTemplate.classList.add('selected');
    }
    
    // Select first method by default
    const firstMethod = document.querySelector('.method-option');
    if (firstMethod) {
        firstMethod.classList.add('selected');
    }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    InstallerLogger.logMessage('Welcome to the Claude Desktop MCP Installer', 'info');
    InstallerLogger.logMessage('Select a template and installation method to get started', 'info');
    InstallerLogger.logMessage('For advanced options, enable Advanced Mode', 'info');
}

/**
 * Toggle advanced mode
 * @param {boolean} isAdvanced - Whether advanced mode is enabled
 */
function toggleAdvancedMode(isAdvanced) {
    const advancedOptions = document.querySelectorAll('.advanced-option');
    advancedOptions.forEach(option => {
        option.style.display = isAdvanced ? 'block' : 'none';
    });
    
    // Log mode change
    InstallerLogger.logMessage(`Advanced mode ${isAdvanced ? 'enabled' : 'disabled'}`, 'info');
}

/**
 * Switch tab
 * @param {Element} tabButton - The clicked tab button
 */
function switchTab(tabButton) {
    // Get the tab ID
    const tabId = tabButton.dataset.tab;
    
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to the clicked tab button
    tabButton.classList.add('active');
}

// Export functions for use in other modules
window.InstallerUICore = {
    initUI,
    showWelcomeMessage,
    toggleAdvancedMode,
    switchTab
};
