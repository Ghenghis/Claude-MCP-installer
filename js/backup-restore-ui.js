/**
 * Backup Restore UI - Handles UI interactions for the backup and restore functionality
 */

class BackupRestoreUI {
    constructor() {
        this.backupManager = new BackupManager();
        this.serverManager = window.ServerManager;
        this.fileSystem = window.FileSystemAPI;
        this.initUI();
    }

    /**
     * Initialize UI elements
     */
    initUI() {
        this.elements = {
            // Backup tab elements
            backupTab: document.getElementById('backup-tab'),
            backupServerSelect: document.getElementById('backup-server-select'),
            createBackupBtn: document.getElementById('create-backup-btn'),
            backupHistoryContainer: document.getElementById('backup-history-container'),
            
            // Backup modal elements
            backupModal: document.getElementById('backup-modal'),
            backupDescription: document.getElementById('backup-description'),
            backupIncludeData: document.getElementById('backup-include-data'),
            confirmBackupBtn: document.getElementById('confirm-backup-btn'),
            cancelBackupBtn: document.getElementById('cancel-backup-btn'),
            
            // Restore modal elements
            restoreModal: document.getElementById('restore-modal'),
            restoreBackupId: document.getElementById('restore-backup-id'),
            restoreServerId: document.getElementById('restore-server-id'),
            restoreCreateBackup: document.getElementById('restore-create-backup'),
            confirmRestoreBtn: document.getElementById('confirm-restore-btn'),
            cancelRestoreBtn: document.getElementById('cancel-restore-btn'),
            
            // Progress elements
            progressContainer: document.getElementById('backup-progress-container'),
            progressBar: document.getElementById('backup-progress-bar'),
            progressText: document.getElementById('backup-progress-text'),
            progressStatus: document.getElementById('backup-progress-status')
        };
        
        this.addEventListeners();
        this.loadServerList();
    }

    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // Backup tab events
        this.elements.backupServerSelect.addEventListener('change', () => this.loadBackupHistory());
        this.elements.createBackupBtn.addEventListener('click', () => this.showBackupModal());
        
        // Backup modal events
        this.elements.confirmBackupBtn.addEventListener('click', () => this.createBackup());
        this.elements.cancelBackupBtn.addEventListener('click', () => this.hideBackupModal());
        
        // Restore modal events
        this.elements.confirmRestoreBtn.addEventListener('click', () => this.restoreBackup());
        this.elements.cancelRestoreBtn.addEventListener('click', () => this.hideRestoreModal());
        
        // Delegate click events for dynamic restore buttons
        this.elements.backupHistoryContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('restore-backup-btn')) {
                const backupId = e.target.dataset.backupId;
                const serverId = this.elements.backupServerSelect.value;
                this.showRestoreModal(serverId, backupId);
            }
            
            if (e.target.classList.contains('delete-backup-btn')) {
                const backupId = e.target.dataset.backupId;
                const serverId = this.elements.backupServerSelect.value;
                this.confirmDeleteBackup(serverId, backupId);
            }
        });
    }

    /**
     * Load server list into the select dropdown
     */
    async loadServerList() {
        try {
            const servers = await this.serverManager.getServers();
            
            // Clear existing options
            this.elements.backupServerSelect.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a server';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            this.elements.backupServerSelect.appendChild(defaultOption);
            
            // Add server options
            servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.id;
                option.textContent = server.name;
                this.elements.backupServerSelect.appendChild(option);
            });
            
            // Load backup history if a server is selected
            if (this.elements.backupServerSelect.value) {
                this.loadBackupHistory();
            }
        } catch (error) {
            console.error('Error loading server list:', error);
            this.showError('Failed to load server list. Please try again.');
        }
    }

    /**
     * Load backup history for the selected server
     */
    async loadBackupHistory() {
        try {
            const serverId = this.elements.backupServerSelect.value;
            
            if (!serverId) {
                this.elements.backupHistoryContainer.innerHTML = '<p>Please select a server to view backup history.</p>';
                return;
            }
            
            // Show loading state
            this.elements.backupHistoryContainer.innerHTML = '<p>Loading backup history...</p>';
            
            // Get backup history
            const backups = await this.backupManager.getBackups(serverId);
            
            // Display backup history
            if (backups.length === 0) {
                this.elements.backupHistoryContainer.innerHTML = '<p>No backups found for this server.</p>';
                return;
            }
            
            // Generate backup history HTML
            let html = '<div class="backup-list">';
            
            backups.forEach(backup => {
                const date = new Date(backup.timestamp).toLocaleString();
                html += `
                    <div class="backup-item">
                        <div class="backup-info">
                            <h4>${backup.id}</h4>
                            <p class="backup-date">${date}</p>
                            <p class="backup-description">${backup.description || 'No description'}</p>
                        </div>
                        <div class="backup-actions">
                            <button class="restore-backup-btn" data-backup-id="${backup.id}">Restore</button>
                            <button class="delete-backup-btn" data-backup-id="${backup.id}">Delete</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            this.elements.backupHistoryContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading backup history:', error);
            this.elements.backupHistoryContainer.innerHTML = '<p>Failed to load backup history. Please try again.</p>';
        }
    }

    /**
     * Show backup modal
     */
    showBackupModal() {
        const serverId = this.elements.backupServerSelect.value;
        
        if (!serverId) {
            this.showError('Please select a server to backup.');
            return;
        }
        
        // Reset form
        this.elements.backupDescription.value = '';
        this.elements.backupIncludeData.checked = true;
        
        // Show modal
        this.elements.backupModal.classList.add('show');
    }

    /**
     * Hide backup modal
     */
    hideBackupModal() {
        this.elements.backupModal.classList.remove('show');
    }

    /**
     * Show restore modal
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     */
    showRestoreModal(serverId, backupId) {
        // Set form values
        this.elements.restoreServerId.value = serverId;
        this.elements.restoreBackupId.value = backupId;
        this.elements.restoreCreateBackup.checked = true;
        
        // Show modal
        this.elements.restoreModal.classList.add('show');
    }

    /**
     * Hide restore modal
     */
    hideRestoreModal() {
        this.elements.restoreModal.classList.remove('show');
    }

    /**
     * Create a backup
     */
    async createBackup() {
        try {
            const serverId = this.elements.backupServerSelect.value;
            const description = this.elements.backupDescription.value;
            const includeData = this.elements.backupIncludeData.checked;
            
            // Hide modal
            this.hideBackupModal();
            
            // Show progress
            this.showProgress();
            this.updateProgress(0, 'Preparing backup...');
            
            // Create backup
            const backupId = await this.backupManager.createBackup(serverId, {
                description,
                includeData,
                progressCallback: (progress, status) => {
                    this.updateProgress(progress, status);
                }
            });
            
            // Complete progress
            this.updateProgress(100, 'Backup completed successfully!');
            setTimeout(() => {
                this.hideProgress();
                this.loadBackupHistory();
            }, 2000);
            
            this.showSuccess(`Backup created successfully: ${backupId}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            this.hideProgress();
            this.showError(`Failed to create backup: ${error.message}`);
        }
    }

    /**
     * Restore a backup
     */
    async restoreBackup() {
        try {
            const serverId = this.elements.restoreServerId.value;
            const backupId = this.elements.restoreBackupId.value;
            const createBackup = this.elements.restoreCreateBackup.checked;
            
            // Hide modal
            this.hideRestoreModal();
            
            // Show progress
            this.showProgress();
            this.updateProgress(0, 'Preparing restore...');
            
            // Restore backup
            await this.backupManager.restoreBackup(serverId, backupId, {
                createBackupFirst: createBackup,
                progressCallback: (progress, status) => {
                    this.updateProgress(progress, status);
                }
            });
            
            // Complete progress
            this.updateProgress(100, 'Restore completed successfully!');
            setTimeout(() => {
                this.hideProgress();
                this.loadBackupHistory();
            }, 2000);
            
            this.showSuccess('Backup restored successfully!');
        } catch (error) {
            console.error('Error restoring backup:', error);
            this.hideProgress();
            this.showError(`Failed to restore backup: ${error.message}`);
        }
    }

    /**
     * Confirm delete backup
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     */
    confirmDeleteBackup(serverId, backupId) {
        if (confirm(`Are you sure you want to delete backup ${backupId}?`)) {
            this.deleteBackup(serverId, backupId);
        }
    }

    /**
     * Delete a backup
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     */
    async deleteBackup(serverId, backupId) {
        try {
            // Show progress
            this.showProgress();
            this.updateProgress(0, 'Deleting backup...');
            
            // Delete backup
            await this.backupManager.deleteBackup(serverId, backupId, {
                progressCallback: (progress, status) => {
                    this.updateProgress(progress, status);
                }
            });
            
            // Complete progress
            this.updateProgress(100, 'Backup deleted successfully!');
            setTimeout(() => {
                this.hideProgress();
                this.loadBackupHistory();
            }, 2000);
            
            this.showSuccess('Backup deleted successfully!');
        } catch (error) {
            console.error('Error deleting backup:', error);
            this.hideProgress();
            this.showError(`Failed to delete backup: ${error.message}`);
        }
    }

    /**
     * Show progress container
     */
    showProgress() {
        this.elements.progressContainer.classList.add('show');
    }

    /**
     * Hide progress container
     */
    hideProgress() {
        this.elements.progressContainer.classList.remove('show');
    }

    /**
     * Update progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} status - Status message
     */
    updateProgress(progress, status) {
        this.elements.progressBar.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${progress}%`;
        this.elements.progressStatus.textContent = status;
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Implementation depends on your notification system
        console.log('Success:', message);
        if (window.NotificationManager) {
            window.NotificationManager.showSuccess(message);
        } else {
            alert(message);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Implementation depends on your notification system
        console.error('Error:', message);
        if (window.NotificationManager) {
            window.NotificationManager.showError(message);
        } else {
            alert(`Error: ${message}`);
        }
    }
}

// Initialize the BackupRestoreUI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BackupRestoreUI = new BackupRestoreUI();
});
