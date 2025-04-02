/**
 * Batch Operations - Handles batch operations for MCP servers
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBatchOperations();
    addBatchOperationsEventListeners();
});

/**
 * Initialize batch operations
 */
function initBatchOperations() {
    // Initialize batch operations state
    window.batchOperationsState = {
        selectedServers: [],
        batchOperationInProgress: false
    };
}

/**
 * Add event listeners for batch operations
 */
function addBatchOperationsEventListeners() {
    // Cancel batch button
    const cancelBatchBtn = document.getElementById('cancelBatchBtn');
    if (cancelBatchBtn) {
        cancelBatchBtn.addEventListener('click', cancelBatchSelection);
    }
    
    // Batch action buttons
    const batchStartBtn = document.getElementById('batchStartBtn');
    if (batchStartBtn) {
        batchStartBtn.addEventListener('click', function() {
            executeBatchOperation('start');
        });
    }
    
    const batchStopBtn = document.getElementById('batchStopBtn');
    if (batchStopBtn) {
        batchStopBtn.addEventListener('click', function() {
            executeBatchOperation('stop');
        });
    }
    
    const batchRestartBtn = document.getElementById('batchRestartBtn');
    if (batchRestartBtn) {
        batchRestartBtn.addEventListener('click', function() {
            executeBatchOperation('restart');
        });
    }
    
    const batchBackupBtn = document.getElementById('batchBackupBtn');
    if (batchBackupBtn) {
        batchBackupBtn.addEventListener('click', function() {
            executeBatchOperation('backup');
        });
    }
    
    const batchUpdateBtn = document.getElementById('batchUpdateBtn');
    if (batchUpdateBtn) {
        batchUpdateBtn.addEventListener('click', function() {
            executeBatchOperation('update');
        });
    }
}

/**
 * Toggle server selection for batch operations
 * @param {string} serverId - Server ID
 */
function toggleServerSelection(serverId) {
    const selectedServers = window.batchOperationsState.selectedServers;
    const serverListItem = document.querySelector(`.server-list-item[data-id="${serverId}"]`);
    
    // Check if server is already selected
    const index = selectedServers.indexOf(serverId);
    
    if (index === -1) {
        // Add server to selection
        selectedServers.push(serverId);
        if (serverListItem) {
            serverListItem.classList.add('selected');
            const checkbox = serverListItem.querySelector('.server-list-item-checkbox');
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    } else {
        // Remove server from selection
        selectedServers.splice(index, 1);
        if (serverListItem) {
            serverListItem.classList.remove('selected');
            const checkbox = serverListItem.querySelector('.server-list-item-checkbox');
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    }
    
    // Update batch operations UI
    updateBatchOperationsUI();
}

/**
 * Update batch operations UI based on selected servers
 */
function updateBatchOperationsUI() {
    const selectedServers = window.batchOperationsState.selectedServers;
    const batchActionsContainer = document.querySelector('.server-list-batch-actions');
    const selectedServersCount = document.getElementById('selectedServersCount');
    
    // Update selected servers count
    if (selectedServersCount) {
        selectedServersCount.textContent = selectedServers.length;
    }
    
    // Show/hide batch actions container
    if (batchActionsContainer) {
        batchActionsContainer.style.display = selectedServers.length > 0 ? 'flex' : 'none';
    }
    
    // Enable/disable batch action buttons based on server states
    updateBatchActionButtonsState();
}

/**
 * Update batch action buttons state based on selected servers
 */
async function updateBatchActionButtonsState() {
    const selectedServers = window.batchOperationsState.selectedServers;
    
    if (selectedServers.length === 0) {
        // No servers selected, disable all buttons
        document.getElementById('batchStartBtn').disabled = true;
        document.getElementById('batchStopBtn').disabled = true;
        document.getElementById('batchRestartBtn').disabled = true;
        document.getElementById('batchBackupBtn').disabled = true;
        document.getElementById('batchUpdateBtn').disabled = true;
        return;
    }
    
    // Enable all buttons by default
    document.getElementById('batchStartBtn').disabled = false;
    document.getElementById('batchStopBtn').disabled = false;
    document.getElementById('batchRestartBtn').disabled = false;
    document.getElementById('batchBackupBtn').disabled = false;
    document.getElementById('batchUpdateBtn').disabled = false;
    
    // Check if any servers are running/stopped
    let anyRunning = false;
    let anyStopped = false;
    
    for (const serverId of selectedServers) {
        try {
            const container = await window.ServerManager.getContainerDetails(serverId);
            if (container.isRunning) {
                anyRunning = true;
            } else {
                anyStopped = true;
            }
        } catch (error) {
            console.error(`Error getting container details for ${serverId}:`, error);
        }
    }
    
    // Update button states based on server states
    document.getElementById('batchStartBtn').disabled = !anyStopped;
    document.getElementById('batchStopBtn').disabled = !anyRunning;
    document.getElementById('batchRestartBtn').disabled = !anyRunning;
}

/**
 * Cancel batch selection
 */
function cancelBatchSelection() {
    const selectedServers = window.batchOperationsState.selectedServers;
    
    // Uncheck all checkboxes and remove selected class
    selectedServers.forEach(serverId => {
        const serverListItem = document.querySelector(`.server-list-item[data-id="${serverId}"]`);
        if (serverListItem) {
            serverListItem.classList.remove('selected');
            const checkbox = serverListItem.querySelector('.server-list-item-checkbox');
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    });
    
    // Clear selected servers array
    window.batchOperationsState.selectedServers = [];
    
    // Update batch operations UI
    updateBatchOperationsUI();
}

/**
 * Execute batch operation on selected servers
 * @param {string} operation - Operation to execute (start, stop, restart, backup, update)
 */
async function executeBatchOperation(operation) {
    const selectedServers = window.batchOperationsState.selectedServers;
    
    if (selectedServers.length === 0) {
        return;
    }
    
    // Set batch operation in progress
    window.batchOperationsState.batchOperationInProgress = true;
    
    // Disable all batch action buttons
    document.getElementById('batchStartBtn').disabled = true;
    document.getElementById('batchStopBtn').disabled = true;
    document.getElementById('batchRestartBtn').disabled = true;
    document.getElementById('batchBackupBtn').disabled = true;
    document.getElementById('batchUpdateBtn').disabled = true;
    
    // Show notification
    const operationName = getOperationName(operation);
    showNotification(`${operationName} ${selectedServers.length} servers...`, 'info');
    
    // Execute operation on each server
    const results = [];
    for (const serverId of selectedServers) {
        try {
            let result;
            switch (operation) {
                case 'start':
                    result = await window.ServerManager.startServer(serverId);
                    break;
                case 'stop':
                    result = await window.ServerManager.stopServer(serverId);
                    break;
                case 'restart':
                    result = await window.ServerManager.restartServer(serverId);
                    break;
                case 'backup':
                    if (typeof window.BackupRestore !== 'undefined' && window.BackupRestore.backupServer) {
                        result = await window.BackupRestore.backupServer(serverId, {
                            name: `Batch backup - ${new Date().toLocaleString()}`,
                            description: 'Created via batch operation',
                            includeVolumes: true
                        });
                    }
                    break;
                case 'update':
                    if (typeof window.ServerUpdater !== 'undefined' && window.ServerUpdater.updateServer) {
                        result = await window.ServerUpdater.updateServer(serverId);
                    }
                    break;
            }
            
            results.push({
                serverId,
                success: true,
                result
            });
        } catch (error) {
            console.error(`Error executing ${operation} on server ${serverId}:`, error);
            results.push({
                serverId,
                success: false,
                error: error.message
            });
        }
    }
    
    // Show results notification
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    if (failureCount === 0) {
        showNotification(`Successfully ${getOperationPastTense(operation)} ${successCount} servers`, 'success');
    } else if (successCount === 0) {
        showNotification(`Failed to ${operation} all servers`, 'error');
    } else {
        showNotification(`${operationName} completed: ${successCount} successful, ${failureCount} failed`, 'warning');
    }
    
    // Set batch operation in progress to false
    window.batchOperationsState.batchOperationInProgress = false;
    
    // Update batch action buttons state
    updateBatchActionButtonsState();
    
    // Refresh server list
    if (typeof window.ServerManager !== 'undefined' && window.ServerManager.refreshServerList) {
        await window.ServerManager.refreshServerList();
    }
}

/**
 * Get operation name for display
 * @param {string} operation - Operation (start, stop, restart, backup, update)
 * @returns {string} Operation name
 */
function getOperationName(operation) {
    switch (operation) {
        case 'start':
            return 'Starting';
        case 'stop':
            return 'Stopping';
        case 'restart':
            return 'Restarting';
        case 'backup':
            return 'Backing up';
        case 'update':
            return 'Updating';
        default:
            return 'Processing';
    }
}

/**
 * Get operation past tense for display
 * @param {string} operation - Operation (start, stop, restart, backup, update)
 * @returns {string} Operation past tense
 */
function getOperationPastTense(operation) {
    switch (operation) {
        case 'start':
            return 'started';
        case 'stop':
            return 'stopped';
        case 'restart':
            return 'restarted';
        case 'backup':
            return 'backed up';
        case 'update':
            return 'updated';
        default:
            return 'processed';
    }
}

/**
 * Create server list item with batch operation support
 * @param {Object} container - Container details
 * @returns {HTMLElement} Server list item element
 */
function createServerListItem(container) {
    const serverListItem = document.createElement('div');
    serverListItem.className = 'server-list-item';
    serverListItem.setAttribute('data-id', container.id);
    
    // Add checkbox for batch selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'server-list-item-checkbox';
    checkbox.addEventListener('change', function(event) {
        // Prevent click event from bubbling to the list item
        event.stopPropagation();
        toggleServerSelection(container.id);
    });
    
    // Check if server is already selected
    if (window.batchOperationsState && window.batchOperationsState.selectedServers.includes(container.id)) {
        checkbox.checked = true;
        serverListItem.classList.add('selected');
    }
    
    // Create server content
    const serverContent = document.createElement('div');
    serverContent.className = 'server-list-item-content';
    
    // Server name
    const serverName = document.createElement('div');
    serverName.className = 'server-list-item-name';
    serverName.textContent = container.name;
    
    // Server type
    const serverType = document.createElement('div');
    serverType.className = 'server-list-item-type';
    serverType.textContent = container.type || 'Docker';
    
    // Server status
    const serverStatus = document.createElement('div');
    serverStatus.className = 'server-list-item-status';
    
    const statusIndicator = document.createElement('span');
    statusIndicator.className = `status-indicator ${container.isRunning ? 'running' : 'stopped'}`;
    
    const statusText = document.createElement('span');
    statusText.textContent = container.isRunning ? 'Running' : 'Stopped';
    
    serverStatus.appendChild(statusIndicator);
    serverStatus.appendChild(statusText);
    
    // Server port
    const serverPort = document.createElement('div');
    serverPort.className = 'server-list-item-port';
    if (container.ports && container.ports.length > 0) {
        serverPort.textContent = `Port: ${container.ports.join(', ')}`;
    } else {
        serverPort.textContent = 'No ports';
    }
    
    // Add elements to server content
    serverContent.appendChild(serverName);
    serverContent.appendChild(serverType);
    serverContent.appendChild(serverStatus);
    serverContent.appendChild(serverPort);
    
    // Add click event to select server
    serverContent.addEventListener('click', function() {
        if (typeof window.ServerManager !== 'undefined' && window.ServerManager.selectServer) {
            window.ServerManager.selectServer(container.id);
        }
    });
    
    // Add elements to server list item
    serverListItem.appendChild(checkbox);
    serverListItem.appendChild(serverContent);
    
    return serverListItem;
}

// Make functions globally accessible
window.BatchOperations = {
    toggleServerSelection,
    cancelBatchSelection,
    executeBatchOperation,
    updateBatchOperationsUI,
    createServerListItem
};
