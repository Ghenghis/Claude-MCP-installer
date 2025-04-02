/**
 * MCP Server Manager - Main Application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme manager
    if (window.ThemeManager) {
        window.ThemeManager.initialize();
    }
    
    // Initialize error handler
    if (window.ErrorHandler) {
        window.ErrorHandler.initialize();
    }
    
    // Initialize server manager
    if (window.ServerManager) {
        window.ServerManager.initialize();
    }
    
    // Initialize Docker manager
    if (window.DockerManager) {
        window.DockerManager.initialize();
    }
    
    // Initialize AI installer loader
    if (window.AiInstallerLoader) {
        window.AiInstallerLoader.loadAiInstallerModules();
    }
    
    // Initialize server updater
    if (window.ServerUpdater) {
        window.ServerUpdater.initialize();
    }
    
    // Initialize config editor
    if (window.ConfigEditor) {
        window.ConfigEditor.initialize();
    }
    
    // Initialize log viewer
    if (window.LogViewer) {
        window.LogViewer.initialize();
    }
    
    // Add server tab event listeners
    addServerTabEventListeners();
    
    // Add AI mode toggle listener
    addAiModeToggleListener();
});

/**
 * Add event listeners for server management tabs
 */
function addServerTabEventListeners() {
    // Server management tabs
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Get tab ID
            const tabId = this.getAttribute('data-tab');
            
            // Switch tab
            switchServerTab(this, tabId);
        });
    });
}

/**
 * Add event listener for AI mode toggle
 */
function addAiModeToggleListener() {
    const aiModeToggle = document.getElementById('aiModeToggle');
    if (aiModeToggle) {
        aiModeToggle.addEventListener('change', function() {
            if (window.AiInstaller && typeof window.AiInstaller.toggleAiMode === 'function') {
                window.AiInstaller.toggleAiMode(this.checked);
            }
        });
        
        // Set initial state based on localStorage
        const aiModeEnabled = localStorage.getItem('aiModeEnabled') === 'true';
        aiModeToggle.checked = aiModeEnabled;
        
        // Trigger initial state
        if (window.AiInstaller && typeof window.AiInstaller.toggleAiMode === 'function') {
            window.AiInstaller.toggleAiMode(aiModeEnabled);
        }
    }
}

/**
 * Switch server management tab
 * @param {Element} selectedTab - Selected tab button
 * @param {string} tabId - Tab ID
 */
function switchServerTab(selectedTab, tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.server-tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to selected tab
    selectedTab.classList.add('active');
    
    // Hide all tab content
    document.querySelectorAll('.server-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected tab content
    const tabContent = document.getElementById(`${tabId}-tab-content`);
    if (tabContent) {
        tabContent.style.display = 'block';
        
        // Handle tab-specific actions
        handleTabSpecificActions(tabId);
    }
}

/**
 * Handle tab-specific actions when switching tabs
 * @param {string} tabId - Tab ID
 */
function handleTabSpecificActions(tabId) {
    switch (tabId) {
        case 'servers':
            // Refresh server list
            if (window.ServerManager && typeof window.ServerManager.refreshServerList === 'function') {
                window.ServerManager.refreshServerList();
            }
            break;
            
        case 'docker':
            // Refresh Docker containers
            if (window.DockerManager && typeof window.DockerManager.refreshContainers === 'function') {
                window.DockerManager.refreshContainers();
            }
            break;
            
        case 'backups':
            // Update backup list - now handled by BackupEvents system
            if (window.BackupEvents) {
                window.BackupEvents.trigger('refreshBackupList', {});
            }
            break;
    }
}
