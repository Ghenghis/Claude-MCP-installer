/**
 * Backup UI - Handles UI interactions for backup and restore functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Backup UI
    initBackupUI();
    
    // Add event listeners
    addBackupEventListeners();
});

/**
 * Initialize Backup UI
 */
function initBackupUI() {
    // Check if backup manager is available
    if (!window.backupManager) {
        console.warn('Backup manager not available');
        return;
    }
    
    // Add backup manager event listeners
    setupBackupManagerEventListeners();
    
    // Update backup list
    updateBackupList();
}

/**
 * Add event listeners for backup UI elements
 */
function addBackupEventListeners() {
    // Backup button (in server details)
    document.querySelectorAll('.backup-server-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                showBackupModal(serverId);
            }
        });
    });
    
    // Restore button (in server details)
    document.querySelectorAll('.restore-server-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                showRestoreModal(serverId);
            }
        });
    });
    
    // Backup all servers button
    const backupAllBtn = document.getElementById('backupAllBtn');
    if (backupAllBtn) {
        backupAllBtn.addEventListener('click', function() {
            showBackupAllModal();
        });
    }
    
    // Manage backups button
    const manageBackupsBtn = document.getElementById('manageBackupsBtn');
    if (manageBackupsBtn) {
        manageBackupsBtn.addEventListener('click', function() {
            showBackupManagerModal();
        });
    }
    
    // Create backup form
    const createBackupForm = document.getElementById('createBackupForm');
    if (createBackupForm) {
        createBackupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            handleCreateBackup();
        });
    }
    
    // Close backup modal button
    const closeBackupModalBtn = document.getElementById('closeBackupModalBtn');
    if (closeBackupModalBtn) {
        closeBackupModalBtn.addEventListener('click', function() {
            hideBackupModal();
        });
    }
    
    // Close restore modal button
    const closeRestoreModalBtn = document.getElementById('closeRestoreModalBtn');
    if (closeRestoreModalBtn) {
        closeRestoreModalBtn.addEventListener('click', function() {
            hideRestoreModal();
        });
    }
    
    // Close backup manager modal button
    const closeBackupManagerModalBtn = document.getElementById('closeBackupManagerModalBtn');
    if (closeBackupManagerModalBtn) {
        closeBackupManagerModalBtn.addEventListener('click', function() {
            hideBackupManagerModal();
        });
    }
    
    // Restore backup button (in restore modal)
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', function() {
            const backupId = document.getElementById('backupSelect').value;
            if (backupId) {
                showRestoreConfirmModal(backupId);
            }
        });
    }
    
    // Confirm restore button
    const confirmRestoreBtn = document.getElementById('confirmRestoreBtn');
    if (confirmRestoreBtn) {
        confirmRestoreBtn.addEventListener('click', function() {
            handleRestoreBackup();
        });
    }
    
    // Cancel restore button
    const cancelRestoreBtn = document.getElementById('cancelRestoreBtn');
    if (cancelRestoreBtn) {
        cancelRestoreBtn.addEventListener('click', function() {
            hideRestoreConfirmModal();
        });
    }
    
    // Delete backup button (in backup manager)
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-backup-btn')) {
            const backupId = event.target.getAttribute('data-backup-id');
            if (backupId) {
                confirmDeleteBackup(backupId);
            }
        }
    });
    
    // Restore backup button (in backup manager)
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('restore-backup-btn')) {
            const backupId = event.target.getAttribute('data-backup-id');
            if (backupId) {
                showRestoreConfirmModal(backupId);
            }
        }
    });
    
    // View backup details button (in backup manager)
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('view-backup-btn')) {
            const backupId = event.target.getAttribute('data-backup-id');
            if (backupId) {
                showBackupDetailsModal(backupId);
            }
        }
    });
    
    // Close backup details modal button
    const closeBackupDetailsModalBtn = document.getElementById('closeBackupDetailsModalBtn');
    if (closeBackupDetailsModalBtn) {
        closeBackupDetailsModalBtn.addEventListener('click', function() {
            hideBackupDetailsModal();
        });
    }
    
    // Add event listeners for backup tab
    setupBackupTabEventListeners();
}

/**
 * Setup backup tab event listeners
 */
function setupBackupTabEventListeners() {
    // Backup tab button
    const backupsTabBtn = document.getElementById('backupsTabBtn');
    if (backupsTabBtn) {
        backupsTabBtn.addEventListener('click', function() {
            // Update backup list when tab is clicked
            updateBackupListContainer();
        });
    }
    
    // Create new backup button (in backup tab)
    const createNewBackupBtn = document.getElementById('createNewBackupBtn');
    if (createNewBackupBtn) {
        createNewBackupBtn.addEventListener('click', function() {
            showBackupAllModal();
        });
    }
    
    // Refresh backups list button
    const refreshBackupsListBtn = document.getElementById('refreshBackupsListBtn');
    if (refreshBackupsListBtn) {
        refreshBackupsListBtn.addEventListener('click', function() {
            updateBackupListContainer();
        });
    }
    
    // Backup search field
    const backupSearchField = document.getElementById('backupSearchField');
    if (backupSearchField) {
        backupSearchField.addEventListener('input', function() {
            filterBackupList(this.value);
        });
    }
    
    // Backup filter select
    const backupFilterSelect = document.getElementById('backupFilterSelect');
    if (backupFilterSelect) {
        backupFilterSelect.addEventListener('change', function() {
            filterBackupListByType(this.value);
        });
    }
}

/**
 * Setup backup manager event listeners
 */
function setupBackupManagerEventListeners() {
    if (!window.backupManager) return;
    
    // Backup started
    window.backupManager.on('backupStarted', function(data) {
        updateBackupStatus(data.backup.id, 'in_progress', 'Backup in progress...');
    });
    
    // Backup progress
    window.backupManager.on('backupProgress', function(data) {
        updateBackupProgress(data.backupId, data.progress, data.message);
    });
    
    // Backup completed
    window.backupManager.on('backupCompleted', function(data) {
        updateBackupStatus(data.backup.id, 'completed', 'Backup completed successfully');
        updateBackupList();
        updateBackupListContainer();
    });
    
    // Backup failed
    window.backupManager.on('backupFailed', function(data) {
        updateBackupStatus(data.backupId, 'failed', `Backup failed: ${data.error}`);
    });
    
    // Restore started
    window.backupManager.on('restoreStarted', function(data) {
        updateRestoreStatus(data.backup.id, 'in_progress', 'Restore in progress...');
    });
    
    // Restore progress
    window.backupManager.on('restoreProgress', function(data) {
        updateRestoreProgress(data.backupId, data.progress, data.message);
    });
    
    // Restore completed
    window.backupManager.on('restoreCompleted', function(data) {
        updateRestoreStatus(data.backup.id, 'completed', 'Restore completed successfully');
        hideRestoreConfirmModal();
    });
    
    // Restore failed
    window.backupManager.on('restoreFailed', function(data) {
        updateRestoreStatus(data.backupId, 'failed', `Restore failed: ${data.error}`);
    });
}

/**
 * Show backup modal
 * @param {string} serverId - Server ID
 */
function showBackupModal(serverId) {
    const backupModal = document.getElementById('backupModal');
    if (!backupModal) return;
    
    // Set server ID
    document.getElementById('backupServerId').value = serverId;
    
    // Get server info
    getServerInfo(serverId).then(server => {
        // Update modal title
        document.getElementById('backupModalTitle').textContent = `Backup ${server.name}`;
        
        // Show modal
        backupModal.style.display = 'block';
    });
}

/**
 * Hide backup modal
 */
function hideBackupModal() {
    const backupModal = document.getElementById('backupModal');
    if (backupModal) {
        backupModal.style.display = 'none';
    }
    
    // Reset form
    const createBackupForm = document.getElementById('createBackupForm');
    if (createBackupForm) {
        createBackupForm.reset();
    }
}

/**
 * Show restore modal
 * @param {string} serverId - Server ID
 */
function showRestoreModal(serverId) {
    const restoreModal = document.getElementById('restoreModal');
    if (!restoreModal) return;
    
    // Set server ID
    document.getElementById('restoreServerId').value = serverId;
    
    // Get server info
    getServerInfo(serverId).then(server => {
        // Update modal title
        document.getElementById('restoreModalTitle').textContent = `Restore ${server.name}`;
        
        // Load backups for server
        loadBackupsForServer(serverId);
        
        // Show modal
        restoreModal.style.display = 'block';
    });
}

/**
 * Hide restore modal
 */
function hideRestoreModal() {
    const restoreModal = document.getElementById('restoreModal');
    if (restoreModal) {
        restoreModal.style.display = 'none';
    }
}

/**
 * Show backup all modal
 */
function showBackupAllModal() {
    const backupAllModal = document.getElementById('backupAllModal');
    if (!backupAllModal) return;
    
    // Show modal
    backupAllModal.style.display = 'block';
}

/**
 * Hide backup all modal
 */
function hideBackupAllModal() {
    const backupAllModal = document.getElementById('backupAllModal');
    if (backupAllModal) {
        backupAllModal.style.display = 'none';
    }
    
    // Reset form
    const backupAllForm = document.getElementById('backupAllForm');
    if (backupAllForm) {
        backupAllForm.reset();
    }
}

/**
 * Show backup manager modal
 */
function showBackupManagerModal() {
    const backupManagerModal = document.getElementById('backupManagerModal');
    if (!backupManagerModal) return;
    
    // Update backup list
    updateBackupList();
    
    // Show modal
    backupManagerModal.style.display = 'block';
}

/**
 * Hide backup manager modal
 */
function hideBackupManagerModal() {
    const backupManagerModal = document.getElementById('backupManagerModal');
    if (backupManagerModal) {
        backupManagerModal.style.display = 'none';
    }
}

/**
 * Show restore confirm modal
 * @param {string} backupId - Backup ID
 */
function showRestoreConfirmModal(backupId) {
    const restoreConfirmModal = document.getElementById('restoreConfirmModal');
    if (!restoreConfirmModal) return;
    
    // Set backup ID
    document.getElementById('restoreBackupId').value = backupId;
    
    // Get backup info
    const backup = window.backupManager.getBackupById(backupId);
    if (backup) {
        // Update modal content
        document.getElementById('restoreBackupDate').textContent = formatDate(backup.createdAt);
        document.getElementById('restoreBackupName').textContent = backup.name;
        document.getElementById('restoreBackupServer').textContent = backup.serverName;
        
        // Show modal
        restoreConfirmModal.style.display = 'block';
    }
}

/**
 * Hide restore confirm modal
 */
function hideRestoreConfirmModal() {
    const restoreConfirmModal = document.getElementById('restoreConfirmModal');
    if (restoreConfirmModal) {
        restoreConfirmModal.style.display = 'none';
    }
}

/**
 * Show backup details modal
 * @param {string} backupId - Backup ID
 */
function showBackupDetailsModal(backupId) {
    const backupDetailsModal = document.getElementById('backupDetailsModal');
    if (!backupDetailsModal) return;
    
    // Get backup info
    const backup = window.backupManager.getBackupById(backupId);
    if (backup) {
        // Update modal content
        document.getElementById('backupDetailsName').textContent = backup.name;
        document.getElementById('backupDetailsDate').textContent = formatDate(backup.createdAt);
        document.getElementById('backupDetailsServer').textContent = backup.serverName;
        document.getElementById('backupDetailsType').textContent = backup.type;
        document.getElementById('backupDetailsSize').textContent = formatSize(backup.size);
        document.getElementById('backupDetailsStatus').textContent = backup.status;
        
        // Load backup manifest
        window.backupManager.loadBackupManifest(backupId).then(manifest => {
            // Update items list
            const itemsList = document.getElementById('backupDetailsItems');
            if (itemsList) {
                itemsList.innerHTML = '';
                
                manifest.items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <strong>${item.name}</strong> (${item.type})
                        <div class="item-details">
                            <div>Original path: ${item.originalPath}</div>
                            <div>Size: ${formatSize(item.size)}</div>
                        </div>
                    `;
                    itemsList.appendChild(li);
                });
            }
        }).catch(error => {
            console.error('Error loading backup manifest:', error);
        });
        
        // Show modal
        backupDetailsModal.style.display = 'block';
    }
}

/**
 * Hide backup details modal
 */
function hideBackupDetailsModal() {
    const backupDetailsModal = document.getElementById('backupDetailsModal');
    if (backupDetailsModal) {
        backupDetailsModal.style.display = 'none';
    }
}

/**
 * Handle create backup
 */
async function handleCreateBackup() {
    const serverId = document.getElementById('backupServerId').value;
    const backupName = document.getElementById('backupName').value;
    const backupDescription = document.getElementById('backupDescription').value;
    const backupType = document.querySelector('input[name="backupType"]:checked').value;
    const includeLogs = document.getElementById('includeLogs').checked;
    
    if (!serverId || !backupName) {
        showErrorNotification('Server ID and backup name are required');
        return;
    }
    
    try {
        // Show progress
        const progressContainer = document.getElementById('backupProgressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        // Create backup
        const backup = await window.backupManager.createBackup(serverId, {
            name: backupName,
            description: backupDescription,
            type: backupType,
            includeLogs
        });
        
        // Show success message
        showSuccessNotification('Backup created successfully');
        
        // Hide modal
        hideBackupModal();
        
        // Update backup list
        updateBackupList();
    } catch (error) {
        console.error('Error creating backup:', error);
        showErrorNotification(`Error creating backup: ${error.message}`);
    }
}

/**
 * Handle restore backup
 */
async function handleRestoreBackup() {
    const backupId = document.getElementById('restoreBackupId').value;
    const restoreConfig = document.getElementById('restoreConfig').checked;
    const restoreData = document.getElementById('restoreData').checked;
    const stopServer = document.getElementById('stopServerDuringRestore').checked;
    
    if (!backupId) {
        showErrorNotification('Backup ID is required');
        return;
    }
    
    try {
        // Show progress
        const progressContainer = document.getElementById('restoreProgressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        // Restore backup
        const result = await window.backupManager.restoreBackup(backupId, {
            restoreConfig,
            restoreData,
            stopServer
        });
        
        // Show success message
        showSuccessNotification('Backup restored successfully');
        
        // Hide modal
        hideRestoreConfirmModal();
    } catch (error) {
        console.error('Error restoring backup:', error);
        showErrorNotification(`Error restoring backup: ${error.message}`);
    }
}

/**
 * Confirm delete backup
 * @param {string} backupId - Backup ID
 */
function confirmDeleteBackup(backupId) {
    const backup = window.backupManager.getBackupById(backupId);
    if (!backup) return;
    
    if (confirm(`Are you sure you want to delete the backup "${backup.name}"?`)) {
        deleteBackup(backupId);
    }
}

/**
 * Delete backup
 * @param {string} backupId - Backup ID
 */
async function deleteBackup(backupId) {
    try {
        await window.backupManager.deleteBackup(backupId);
        
        // Show success message
        showSuccessNotification('Backup deleted successfully');
        
        // Update backup list
        updateBackupList();
    } catch (error) {
        console.error('Error deleting backup:', error);
        showErrorNotification(`Error deleting backup: ${error.message}`);
    }
}

/**
 * Load backups for a server
 * @param {string} serverId - Server ID
 */
function loadBackupsForServer(serverId) {
    if (!window.backupManager) return;
    
    const backups = window.backupManager.getBackupsForServer(serverId);
    
    // Update backup select
    const backupSelect = document.getElementById('backupSelect');
    if (backupSelect) {
        backupSelect.innerHTML = '';
        
        if (backups.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No backups available';
            backupSelect.appendChild(option);
            backupSelect.disabled = true;
        } else {
            backupSelect.disabled = false;
            
            backups.forEach(backup => {
                const option = document.createElement('option');
                option.value = backup.id;
                option.textContent = `${backup.name} (${formatDate(backup.createdAt)})`;
                backupSelect.appendChild(option);
            });
        }
    }
    
    // Update restore button
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.disabled = backups.length === 0;
    }
}

/**
 * Update backup list
 */
function updateBackupList() {
    if (!window.backupManager) return;
    
    const backups = window.backupManager.getAllBackups();
    
    // Update backup list
    const backupList = document.getElementById('backupList');
    if (backupList) {
        backupList.innerHTML = '';
        
        if (backups.length === 0) {
            backupList.innerHTML = '<div class="empty-message">No backups available</div>';
        } else {
            backups.forEach(backup => {
                const backupItem = createBackupListItem(backup);
                backupList.appendChild(backupItem);
            });
        }
    }
}

/**
 * Create backup list item
 * @param {Object} backup - Backup metadata
 * @returns {HTMLElement} Backup list item
 */
function createBackupListItem(backup) {
    const backupItem = document.createElement('div');
    backupItem.className = 'backup-item';
    backupItem.dataset.id = backup.id;
    
    // Status class
    const statusClass = getStatusClass(backup.status);
    
    backupItem.innerHTML = `
        <div class="backup-info">
            <div class="backup-name">${backup.name}</div>
            <div class="backup-details">
                <span class="backup-server">${backup.serverName}</span>
                <span class="backup-date">${formatDate(backup.createdAt)}</span>
                <span class="backup-type">${backup.type}</span>
                <span class="backup-size">${formatSize(backup.size)}</span>
            </div>
            <div class="backup-status ${statusClass}">${backup.status}</div>
        </div>
        <div class="backup-actions">
            <button class="btn btn-sm view-backup-btn" data-backup-id="${backup.id}" title="View Details">
                <i class="fas fa-info-circle"></i>
            </button>
            <button class="btn btn-sm restore-backup-btn" data-backup-id="${backup.id}" title="Restore Backup">
                <i class="fas fa-undo"></i>
            </button>
            <button class="btn btn-sm delete-backup-btn" data-backup-id="${backup.id}" title="Delete Backup">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return backupItem;
}

/**
 * Update backup status
 * @param {string} backupId - Backup ID
 * @param {string} status - Status
 * @param {string} message - Status message
 */
function updateBackupStatus(backupId, status, message) {
    // Update status in UI
    const backupItem = document.querySelector(`.backup-item[data-id="${backupId}"]`);
    if (backupItem) {
        const statusElement = backupItem.querySelector('.backup-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `backup-status ${getStatusClass(status)}`;
        }
    }
    
    // Update progress message
    const progressMessage = document.getElementById('backupProgressMessage');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

/**
 * Update backup progress
 * @param {string} backupId - Backup ID
 * @param {number} progress - Progress percentage
 * @param {string} message - Progress message
 */
function updateBackupProgress(backupId, progress, message) {
    // Update progress bar
    const progressBar = document.getElementById('backupProgressBar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }
    
    // Update progress message
    const progressMessage = document.getElementById('backupProgressMessage');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

/**
 * Update restore status
 * @param {string} backupId - Backup ID
 * @param {string} status - Status
 * @param {string} message - Status message
 */
function updateRestoreStatus(backupId, status, message) {
    // Update progress message
    const progressMessage = document.getElementById('restoreProgressMessage');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

/**
 * Update restore progress
 * @param {string} backupId - Backup ID
 * @param {number} progress - Progress percentage
 * @param {string} message - Progress message
 */
function updateRestoreProgress(backupId, progress, message) {
    // Update progress bar
    const progressBar = document.getElementById('restoreProgressBar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }
    
    // Update progress message
    const progressMessage = document.getElementById('restoreProgressMessage');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

/**
 * Get server info
 * @param {string} serverId - Server ID
 * @returns {Promise<Object>} Server info
 */
async function getServerInfo(serverId) {
    // Check if Docker manager is available
    if (window.dockerManager) {
        const container = window.dockerManager.getContainerById(serverId);
        if (container) {
            return {
                id: container.id,
                name: container.name,
                type: 'docker',
                status: container.status
            };
        }
    }
    
    // Check if server manager is available
    if (window.serverManager) {
        const server = window.serverManager.getServerById(serverId);
        if (server) {
            return {
                id: server.id,
                name: server.name,
                type: server.type,
                status: server.status
            };
        }
    }
    
    // Return mock data if server not found
    return {
        id: serverId,
        name: `Server ${serverId}`,
        type: 'unknown',
        status: 'unknown'
    };
}

/**
 * Get status class
 * @param {string} status - Status
 * @returns {string} Status class
 */
function getStatusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-success';
        case 'failed':
            return 'status-error';
        case 'in_progress':
            return 'status-warning';
        default:
            return 'status-info';
    }
}

/**
 * Format date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

/**
 * Format size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Show success notification
 * @param {string} message - Notification message
 */
function showSuccessNotification(message) {
    if (window.ErrorHandler && typeof window.ErrorHandler.showSuccessNotification === 'function') {
        window.ErrorHandler.showSuccessNotification(message);
    } else {
        alert(message);
    }
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
function showErrorNotification(message) {
    if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
        window.ErrorHandler.handleError('BACKUP_ERROR', message);
    } else {
        alert(`Error: ${message}`);
    }
}

/**
 * Update backup list container in the backup tab
 */
function updateBackupListContainer() {
    if (!window.backupManager) return;
    
    const backups = window.backupManager.getAllBackups();
    
    // Update backup list
    const backupListContainer = document.getElementById('backupListContainer');
    if (backupListContainer) {
        backupListContainer.innerHTML = '';
        
        if (backups.length === 0) {
            backupListContainer.innerHTML = '<div class="empty-message">No backups available</div>';
        } else {
            backups.forEach(backup => {
                const backupItem = createBackupListItem(backup);
                backupListContainer.appendChild(backupItem);
            });
        }
    }
}

/**
 * Filter backup list by search query
 * @param {string} query - Search query
 */
function filterBackupList(query) {
    if (!query) {
        // Show all backups
        document.querySelectorAll('.backup-item').forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    // Filter backup items
    document.querySelectorAll('.backup-item').forEach(item => {
        const name = item.querySelector('.backup-name').textContent.toLowerCase();
        const server = item.querySelector('.backup-server').textContent.toLowerCase();
        
        if (name.includes(lowerQuery) || server.includes(lowerQuery)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Filter backup list by type
 * @param {string} type - Backup type
 */
function filterBackupListByType(type) {
    if (type === 'all') {
        // Show all backups
        document.querySelectorAll('.backup-item').forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    // Filter backup items by type
    document.querySelectorAll('.backup-item').forEach(item => {
        const backupType = item.querySelector('.backup-type').textContent.toLowerCase();
        
        if (backupType === type) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Make functions globally accessible
window.BackupUI = {
    showBackupModal,
    hideBackupModal,
    showRestoreModal,
    hideRestoreModal,
    showBackupManagerModal,
    hideBackupManagerModal,
    updateBackupList
};
