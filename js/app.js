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
    
    // Initialize backup manager
    if (window.backupManager) {
        window.backupManager.initialize();
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
        
        // Trigger specific actions for each tab
        if (tabId === 'servers') {
            // Refresh server list
            if (window.ServerManager && typeof window.ServerManager.refreshServerList === 'function') {
                window.ServerManager.refreshServerList();
            }
        } else if (tabId === 'docker') {
            // Refresh Docker containers
            if (window.DockerManager && typeof window.DockerManager.refreshContainers === 'function') {
                window.DockerManager.refreshContainers();
            }
        } else if (tabId === 'backups') {
            // Update backup list
            if (window.BackupUI && typeof window.BackupUI.updateBackupListContainer === 'function') {
                window.BackupUI.updateBackupListContainer();
            }
        }
    }
}
