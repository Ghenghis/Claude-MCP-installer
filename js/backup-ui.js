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
    _setupModalControlListeners();
    _setupBackupActionListeners();
    _setupRestoreActionListeners();
    _setupBackupManagerActionListeners(); // Handles dynamically added buttons too

    // Add event listeners for backup tab (if needed, or move into a helper)
    setupBackupTabEventListeners();
}

/**
 * Sets up event listeners for general modal open/close controls.
 * @private
 */
function _setupModalControlListeners() {
    // Backup button (in server details) -> Show Backup Modal
    document.querySelectorAll('.backup-server-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) showBackupModal(serverId);
        });
    });

    // Restore button (in server details) -> Show Restore Modal
    document.querySelectorAll('.restore-server-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) showRestoreModal(serverId);
        });
    });

    // Buttons with simple handlers
    _addClickListener('backupAllBtn', showBackupAllModal);
    _addClickListener('manageBackupsBtn', showBackupManagerModal);
    _addClickListener('closeBackupModalBtn', hideBackupModal);
    _addClickListener('closeRestoreModalBtn', hideRestoreModal);
    _addClickListener('closeBackupManagerModalBtn', hideBackupManagerModal);
    _addClickListener('closeBackupDetailsModalBtn', hideBackupDetailsModal);
    _addClickListener('cancelRestoreBtn', hideRestoreConfirmModal);
}

/**
 * Helper to add a click event listener to an element if it exists.
 * @private
 * @param {string} elementId - The ID of the element.
 * @param {Function} handler - The event handler function.
 */
function _addClickListener(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('click', handler);
    }
}

/**
 * Sets up event listeners related to backup creation actions.
 * @private
 */
function _setupBackupActionListeners() {
    // Create backup form submission
    const createBackupForm = document.getElementById('createBackupForm');
    if (createBackupForm) {
        createBackupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            handleCreateBackup();
        });
    }
}

/**
 * Sets up event listeners related to restore actions.
 * @private
 */
function _setupRestoreActionListeners() {
    // Restore backup button (in restore modal) -> Show Confirm Modal
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', function() {
            const backupId = document.getElementById('backupSelect')?.value;
            if (backupId) {
                showRestoreConfirmModal(backupId);
            } else {
                showErrorNotification("Please select a backup to restore.");
            }
        });
    }

    // Confirm restore button (in confirm modal)
    const confirmRestoreBtn = document.getElementById('confirmRestoreBtn');
    if (confirmRestoreBtn) {
        confirmRestoreBtn.addEventListener('click', handleRestoreBackup);
    }
}

/**
 * Sets up event listeners for actions within the backup manager,
 * using event delegation for dynamically added elements.
 * @private
 */
function _setupBackupManagerActionListeners() {
    const managerActionHandlers = {
        'delete-backup-btn': (backupId) => confirmDeleteBackup(backupId),
        'restore-backup-btn': (backupId) => showRestoreConfirmModal(backupId),
        'view-backup-btn': (backupId) => showBackupDetailsModal(backupId),
    };

    document.addEventListener('click', function(event) {
        // Find the closest button element to the clicked target
        const targetButton = event.target.closest('button[data-backup-id]');
        
        if (!targetButton) {
            return; // Click was not on or inside a relevant button
        }

        const backupId = targetButton.getAttribute('data-backup-id');
        // backupId should exist based on the selector, but double-check
        if (!backupId) {
            return; 
        }

        // Check which action class the button has and call the handler
        for (const className in managerActionHandlers) {
            if (targetButton.classList.contains(className)) {
                managerActionHandlers[className](backupId);
                event.stopPropagation(); // Prevent potential parent handlers
                return; // Action handled
            }
        }
    });
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
 * Sets the display style for a modal element.
 * @private
 * @param {string} modalId - The ID of the modal element.
 * @param {string} displayStyle - The display style to set ('block', 'none', etc.).
 * @returns {HTMLElement|null} The modal element if found, otherwise null.
 */
function _setModalDisplay(modalId, displayStyle) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = displayStyle;
    }
    return modal;
}

/**
 * Show backup modal
 * @param {string} serverId - Server ID
 */
function showBackupModal(serverId) {
    // Set server ID
    document.getElementById('backupServerId').value = serverId;
    
    // Get server info
    getServerInfo(serverId).then(server => {
        // Update modal title
        document.getElementById('backupModalTitle').textContent = `Backup ${server.name}`;
        
        // Show modal
        _setModalDisplay('backupModal', 'block');
    }).catch(error => {
        showErrorNotification("Failed to load server info for backup modal.");
        console.error("Error fetching server info:", error);
    });
}

/**
 * Hide backup modal
 */
function hideBackupModal() {
    const modal = _setModalDisplay('backupModal', 'none');
    if (modal) {
        // Reset form
        const createBackupForm = document.getElementById('createBackupForm');
        if (createBackupForm) {
            createBackupForm.reset();
        }
    }
}

/**
 * Show restore modal
 * @param {string} serverId - Server ID
 */
function showRestoreModal(serverId) {
    // Set server ID
    document.getElementById('restoreServerId').value = serverId;
    
    // Load backups for the server
    loadBackupsForServer(serverId);
    
    // Get server info for title
    getServerInfo(serverId).then(server => {
        document.getElementById('restoreModalTitle').textContent = `Restore ${server.name}`;
        _setModalDisplay('restoreModal', 'block');
    }).catch(error => {
        showErrorNotification("Failed to load server info for restore modal.");
        console.error("Error fetching server info:", error);
    });
}

/**
 * Hide restore modal
 */
function hideRestoreModal() {
    _setModalDisplay('restoreModal', 'none');
}

/**
 * Show backup all modal
 */
function showBackupAllModal() {
    _setModalDisplay('backupAllModal', 'block');
    // Potentially list servers or show confirmation details here
}

/**
 * Hide backup all modal
 */
function hideBackupAllModal() {
    _setModalDisplay('backupAllModal', 'none');
    // Any cleanup for backup all modal?
}

/**
 * Show backup manager modal
 */
function showBackupManagerModal() {
    updateBackupList(); // Ensure the list is up-to-date
    _setModalDisplay('backupManagerModal', 'block');
}

/**
 * Hide backup manager modal
 */
function hideBackupManagerModal() {
    _setModalDisplay('backupManagerModal', 'none');
}

/**
 * Show restore confirm modal
 * @param {string} backupId - Backup ID
 */
function showRestoreConfirmModal(backupId) {
    // Set backup ID for confirmation
    document.getElementById('restoreBackupId').value = backupId;
    
    // You might want to display the backup name/date here for confirmation
    // const backupDetails = findBackupById(backupId); // Assuming a function to get details
    // if (backupDetails) {
    //    document.getElementById('restoreConfirmDetails').textContent = `Restore backup from ${formatDate(backupDetails.timestamp)}?`;
    // }
    
    _setModalDisplay('restoreConfirmModal', 'block');
}

/**
 * Hide restore confirm modal
 */
function hideRestoreConfirmModal() {
    _setModalDisplay('restoreConfirmModal', 'none');
    document.getElementById('restoreBackupId').value = ''; // Clear the stored ID
}

/**
 * Show backup details modal
 * @param {string} backupId - Backup ID
 */
function showBackupDetailsModal(backupId) {
    const modal = _setModalDisplay('backupDetailsModal', 'block');
    if (!modal) return;

    const detailsContainer = document.getElementById('backupDetailsContent');
    detailsContainer.innerHTML = '<p>Loading backup details...</p>'; // Show loading state

    try {
        const backupData = await window.backupManager.getBackupDetails(backupId);
        if (!backupData) {
            detailsContainer.innerHTML = '<p>Error: Backup details not found.</p>';
            return;
        }

        // Populate details (customize as needed)
        detailsContainer.innerHTML = `
            <h5>Backup Details</h5>
            <p><strong>ID:</strong> ${backupData.id}</p>
            <p><strong>Timestamp:</strong> ${formatDate(backupData.timestamp)}</p>
            <p><strong>Size:</strong> ${formatSize(backupData.size)}</p>
            <p><strong>Server ID:</strong> ${backupData.serverId}</p>
            <p><strong>Status:</strong> ${backupData.status}</p>
            ${backupData.notes ? `<p><strong>Notes:</strong> ${backupData.notes}</p>` : ''}
            <!-- Add more details as available -->
        `;
    } catch (error) {
        console.error('Error fetching backup details:', error);
        detailsContainer.innerHTML = `<p>Error loading backup details: ${error.message}</p>`;
        showErrorNotification('Failed to load backup details.');
    }
}

/**
 * Hide backup details modal
 */
function hideBackupDetailsModal() {
    const modal = _setModalDisplay('backupDetailsModal', 'none');
    if (modal) {
         // Clear details content when hiding
        const detailsContainer = document.getElementById('backupDetailsContent');
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
        }
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
 * Sets the text content of an element by its ID.
 * @private
 * @param {string} elementId - The ID of the element.
 * @param {string} text - The text content to set.
 */
function _setTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Updates the width and ARIA value of a progress bar.
 * @private
 * @param {string} barId - The ID of the progress bar element.
 * @param {number} progress - The progress percentage (0-100).
 */
function _updateProgressBar(barId, progress) {
    const progressBar = document.getElementById(barId);
    if (progressBar) {
        const clampedProgress = Math.max(0, Math.min(100, progress)); // Ensure 0-100
        progressBar.style.width = `${clampedProgress}%`;
        progressBar.setAttribute('aria-valuenow', clampedProgress);
    }
}

/**
 * Update backup status
 * @param {string} backupId - Backup ID
 * @param {string} status - Status
 * @param {string} message - Status message
 */
function updateBackupStatus(backupId, status, message) {
    // Update status in UI list item
    const backupItem = document.querySelector(`.backup-item[data-id="${backupId}"]`);
    if (backupItem) {
        const statusElement = backupItem.querySelector('.backup-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `backup-status ${getStatusClass(status)}`;
        }
    }
    
    // Update overall progress message
    _setTextContent('backupProgressMessage', message);
}

/**
 * Update backup progress
 * @param {string} backupId - Backup ID
 * @param {number} progress - Progress percentage
 * @param {string} message - Progress message
 */
function updateBackupProgress(backupId, progress, message) {
    // Update progress bar
    _updateProgressBar('backupProgressBar', progress);
    
    // Update progress message
    _setTextContent('backupProgressMessage', message);
}

/**
 * Update restore status
 * @param {string} backupId - Backup ID
 * @param {string} status - Status
 * @param {string} message - Status message
 */
function updateRestoreStatus(backupId, status, message) {
    // Update progress message
    _setTextContent('restoreProgressMessage', message);
}

/**
 * Update restore progress
 * @param {string} backupId - Backup ID
 * @param {number} progress - Progress percentage
 * @param {string} message - Progress message
 */
function updateRestoreProgress(backupId, progress, message) {
    // Update progress bar
    _updateProgressBar('restoreProgressBar', progress);
    
    // Update progress message
    _setTextContent('restoreProgressMessage', message);
}

/**
 * Get server info
 * @param {string} serverId - Server ID
 * @returns {Promise<Object|null>} Server info object or null if not found.
 */
async function getServerInfo(serverId) {
    // Define different ways to get server/container info
    const managerCheckers = [
        {
            name: 'DockerManager',
            exists: () => window.dockerManager,
            fetch: (id) => {
                const container = window.dockerManager.getContainerById(id);
                return container ? { id: container.id, name: container.name, type: 'docker', status: container.status } : null;
            }
        },
        {
            name: 'ServerManager',
            exists: () => window.serverManager,
            fetch: (id) => {
                const server = window.serverManager.getServerById(id);
                return server ? { id: server.id, name: server.name, type: server.type, status: server.status } : null;
            }
        }
        // Future managers can be added here easily
    ];

    // Iterate through available managers to find the info
    for (const checker of managerCheckers) {
        if (checker.exists()) {
            try {
                const info = await checker.fetch(serverId); // Assuming fetch might be async in the future
                if (info) {
                    return info; // Found it!
                }
            } catch (error) {
                console.error(`Error fetching server info from ${checker.name}:`, error);
                // Continue to the next checker
            }
        }
    }

    // If not found in any manager after checking all
    console.warn(`Server info not found for ID: ${serverId} in any available manager.`);
    return null;
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
