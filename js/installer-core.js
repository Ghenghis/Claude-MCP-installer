/**
 * Installer Core - Core initialization and event handling for the installer
 */

// Import dependencies
// These will be added as script tags in the HTML
// import './installer-ui-templates.js';
// import './installer-ui-installation.js';
// import './installer-logger.js';
// import './installer-utils.js';

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
        installPathInput.placeholder = detectOS() === 'windows' ? 
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
 * Add event listeners to UI elements
 */
function addEventListeners() {
    // Mode toggle
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('change', function() {
            toggleAdvancedMode(this.checked);
        });
    }
    
    // Template search
    const templateSearch = document.getElementById('templateSearch');
    if (templateSearch) {
        templateSearch.addEventListener('input', function() {
            filterTemplates(this.value);
        });
    }
    
    // Template cards
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            selectTemplate(this);
        });
    });
    
    // Method options
    const methodOptions = document.querySelectorAll('.method-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectMethod(this);
        });
    });
    
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this);
        });
    });
    
    // Generate secret button
    const generateSecretBtn = document.getElementById('generateSecretBtn');
    if (generateSecretBtn) {
        generateSecretBtn.addEventListener('click', generateSecret);
    }
    
    // Install button
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', startInstallation);
    }
    
    // Verify button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyJsonConfiguration);
    }
    
    // Backup button
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', backupJsonConfiguration);
    }
    
    // Fix button
    const fixBtn = document.getElementById('fixBtn');
    if (fixBtn) {
        fixBtn.addEventListener('click', fixJsonConfiguration);
    }
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
    logMessage(`Advanced mode ${isAdvanced ? 'enabled' : 'disabled'}`, 'info');
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

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    logMessage('Welcome to the Claude Desktop MCP Installer', 'info');
    logMessage('Select a template and installation method to get started', 'info');
    logMessage('For advanced options, enable Advanced Mode', 'info');
}

// Export functions for use in other modules
window.InstallerCore = {
    initUI,
    addEventListeners,
    toggleAdvancedMode,
    switchTab,
    showWelcomeMessage
};
