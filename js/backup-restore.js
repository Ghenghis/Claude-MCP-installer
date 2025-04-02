/**
 * Backup/Restore - Handles backup and restore functionality for MCP servers
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBackupRestore();
    addBackupRestoreEventListeners();
});

/**
 * Initialize the backup/restore module
 */
function initBackupRestore() {
    // Initialize any required state
    window.backupRestoreState = {
        backupInProgress: false,
        restoreInProgress: false,
        lastBackupTime: localStorage.getItem('lastBackupTime') || null,
        backupList: JSON.parse(localStorage.getItem('backupList') || '[]'),
        currentServerId: null,
        currentBackupId: null,
        progressInterval: null
    };
}

/**
 * Add event listeners for backup/restore UI elements
 */
function addBackupRestoreEventListeners() {
    // Backup button
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                showBackupModal(serverId);
            }
        });
    }
    
    // Manage backups button
    const manageBackupsBtn = document.getElementById('manageBackupsBtn');
    if (manageBackupsBtn) {
        manageBackupsBtn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                showManageBackupsModal(serverId);
            }
        });
    }
    
    // Close backup modal button
    const closeBackupModal = document.getElementById('closeBackupModal');
    if (closeBackupModal) {
        closeBackupModal.addEventListener('click', function() {
            hideBackupModal();
        });
    }
    
    // Cancel backup button
    const cancelBackupBtn = document.getElementById('cancelBackupBtn');
    if (cancelBackupBtn) {
        cancelBackupBtn.addEventListener('click', function() {
            hideBackupModal();
        });
    }
    
    // Create backup button
    const createBackupBtn = document.getElementById('createBackupBtn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', function() {
            const serverId = window.backupRestoreState.currentServerId;
            const backupName = document.getElementById('backupName').value;
            const backupDescription = document.getElementById('backupDescription').value;
            const includeVolumes = document.getElementById('includeVolumes').checked;
            
            if (!backupName) {
                showNotification('Please enter a backup name', 'error');
                return;
            }
            
            if (serverId) {
                startBackupProcess(serverId, backupName, backupDescription, includeVolumes);
            }
        });
    }
    
    // Close manage backups modal button
    const closeManageBackupsModal = document.getElementById('closeManageBackupsModal');
    if (closeManageBackupsModal) {
        closeManageBackupsModal.addEventListener('click', function() {
            hideManageBackupsModal();
        });
    }
    
    // Close backups button
    const closeBackupsBtn = document.getElementById('closeBackupsBtn');
    if (closeBackupsBtn) {
        closeBackupsBtn.addEventListener('click', function() {
            hideManageBackupsModal();
        });
    }
    
    // Create new backup button (from manage backups modal)
    const createNewBackupBtn = document.getElementById('createNewBackupBtn');
    if (createNewBackupBtn) {
        createNewBackupBtn.addEventListener('click', function() {
            hideManageBackupsModal();
            showBackupModal(window.backupRestoreState.currentServerId);
        });
    }
    
    // Close restore confirm modal button
    const closeRestoreConfirmModal = document.getElementById('closeRestoreConfirmModal');
    if (closeRestoreConfirmModal) {
        closeRestoreConfirmModal.addEventListener('click', function() {
            hideRestoreConfirmModal();
        });
    }
    
    // Cancel restore button
    const cancelRestoreBtn = document.getElementById('cancelRestoreBtn');
    if (cancelRestoreBtn) {
        cancelRestoreBtn.addEventListener('click', function() {
            hideRestoreConfirmModal();
        });
    }
    
    // Confirm restore button
    const confirmRestoreBtn = document.getElementById('confirmRestoreBtn');
    if (confirmRestoreBtn) {
        confirmRestoreBtn.addEventListener('click', function() {
            const serverId = window.backupRestoreState.currentServerId;
            const backupId = window.backupRestoreState.currentBackupId;
            const restoreVolumes = document.getElementById('restoreVolumes').checked;
            
            if (serverId && backupId) {
                startRestoreProcess(serverId, backupId, restoreVolumes);
            }
        });
    }
}

/**
 * Show the backup modal
 * @param {string} serverId - Server/container ID
 */
function showBackupModal(serverId) {
    // Reset form
    document.getElementById('backupName').value = '';
    document.getElementById('backupDescription').value = '';
    document.getElementById('includeVolumes').checked = true;
    document.getElementById('backupProgressContainer').style.display = 'none';
    
    // Set current server ID
    window.backupRestoreState.currentServerId = serverId;
    
    // Show modal
    document.getElementById('backupModal').style.display = 'flex';
}

/**
 * Hide the backup modal
 */
function hideBackupModal() {
    document.getElementById('backupModal').style.display = 'none';
    
    // Clear progress interval if active
    if (window.backupRestoreState.progressInterval) {
        clearInterval(window.backupRestoreState.progressInterval);
        window.backupRestoreState.progressInterval = null;
    }
}

/**
 * Show the manage backups modal
 * @param {string} serverId - Server/container ID
 */
async function showManageBackupsModal(serverId) {
    // Set current server ID
    window.backupRestoreState.currentServerId = serverId;
    
    // Show modal
    document.getElementById('manageBackupsModal').style.display = 'flex';
    document.getElementById('restoreProgressContainer').style.display = 'none';
    
    // Load backups for this server
    await loadServerBackups(serverId);
}

/**
 * Hide the manage backups modal
 */
function hideManageBackupsModal() {
    document.getElementById('manageBackupsModal').style.display = 'none';
    
    // Clear progress interval if active
    if (window.backupRestoreState.progressInterval) {
        clearInterval(window.backupRestoreState.progressInterval);
        window.backupRestoreState.progressInterval = null;
    }
}

/**
 * Show the restore confirmation modal
 * @param {string} serverId - Server/container ID
 * @param {string} backupId - Backup ID
 */
function showRestoreConfirmModal(serverId, backupId) {
    // Set current server and backup IDs
    window.backupRestoreState.currentServerId = serverId;
    window.backupRestoreState.currentBackupId = backupId;
    
    // Reset form
    document.getElementById('restoreVolumes').checked = true;
    
    // Show modal
    document.getElementById('restoreConfirmModal').style.display = 'flex';
}

/**
 * Hide the restore confirmation modal
 */
function hideRestoreConfirmModal() {
    document.getElementById('restoreConfirmModal').style.display = 'none';
}

/**
 * Load backups for a server
 * @param {string} serverId - Server/container ID
 */
async function loadServerBackups(serverId) {
    const backupsList = document.getElementById('backupsList');
    const noBackupsMessage = document.getElementById('noBackupsMessage');
    
    // Clear current list
    backupsList.innerHTML = '';
    
    try {
        // Get backups for this server
        const backups = await getServerBackups(serverId);
        
        if (backups.length === 0) {
            // Show no backups message
            backupsList.style.display = 'none';
            noBackupsMessage.style.display = 'block';
        } else {
            // Show backups list
            backupsList.style.display = 'flex';
            noBackupsMessage.style.display = 'none';
            
            // Add backup items
            backups.forEach(backup => {
                const backupItem = createBackupListItem(backup);
                backupsList.appendChild(backupItem);
            });
        }
    } catch (error) {
        console.error('Error loading backups:', error);
        showNotification('Failed to load backups', 'error');
    }
}

/**
 * Create a backup list item element
 * @param {Object} backup - Backup metadata
 * @returns {HTMLElement} Backup list item element
 */
function createBackupListItem(backup) {
    const backupItem = document.createElement('div');
    backupItem.className = 'backup-item';
    backupItem.setAttribute('data-backup-id', backup.id);
    
    const backupInfo = document.createElement('div');
    backupInfo.className = 'backup-item-info';
    
    const backupName = document.createElement('div');
    backupName.className = 'backup-item-name';
    backupName.textContent = backup.name || `Backup ${formatDate(backup.timestamp)}`;
    
    const backupDate = document.createElement('div');
    backupDate.className = 'backup-item-date';
    backupDate.textContent = formatDate(backup.timestamp);
    
    backupInfo.appendChild(backupName);
    backupInfo.appendChild(backupDate);
    
    const backupActions = document.createElement('div');
    backupActions.className = 'backup-item-actions';
    
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn btn-outline btn-sm';
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i> Restore';
    restoreBtn.addEventListener('click', function() {
        showRestoreConfirmModal(backup.serverId, backup.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline btn-danger btn-sm';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', function() {
        confirmDeleteBackup(backup.id);
    });
    
    backupActions.appendChild(restoreBtn);
    backupActions.appendChild(deleteBtn);
    
    backupItem.appendChild(backupInfo);
    backupItem.appendChild(backupActions);
    
    return backupItem;
}

/**
 * Start the backup process
 * @param {string} serverId - Server/container ID
 * @param {string} backupName - Backup name
 * @param {string} backupDescription - Backup description
 * @param {boolean} includeVolumes - Whether to include volume data
 */
async function startBackupProcess(serverId, backupName, backupDescription, includeVolumes) {
    // Show progress container
    const progressContainer = document.getElementById('backupProgressContainer');
    progressContainer.style.display = 'block';
    
    // Get progress elements
    const progressStatus = document.querySelector('#backupProgressContainer .backup-progress-status');
    const progressBar = document.querySelector('#backupProgressContainer .backup-progress-bar-fill');
    const progressDetails = document.querySelector('#backupProgressContainer .backup-progress-details');
    
    // Disable form elements
    document.getElementById('backupName').disabled = true;
    document.getElementById('backupDescription').disabled = true;
    document.getElementById('includeVolumes').disabled = true;
    document.getElementById('createBackupBtn').disabled = true;
    document.getElementById('cancelBackupBtn').disabled = true;
    
    // Set initial progress
    progressStatus.textContent = '0%';
    progressBar.style.width = '0%';
    progressDetails.textContent = 'Preparing backup...';
    
    // Set up progress simulation
    let progress = 0;
    window.backupRestoreState.progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 5;
            progressStatus.textContent = `${Math.round(progress)}%`;
            progressBar.style.width = `${progress}%`;
        }
    }, 500);
    
    try {
        // Create backup options
        const options = {
            name: backupName,
            description: backupDescription,
            includeVolumes: includeVolumes
        };
        
        // Start backup
        progressDetails.textContent = 'Backing up server configuration...';
        const result = await backupServer(serverId, options);
        
        // Complete progress
        clearInterval(window.backupRestoreState.progressInterval);
        progressStatus.textContent = '100%';
        progressBar.style.width = '100%';
        progressDetails.textContent = 'Backup completed successfully!';
        
        // Show success notification
        showNotification('Backup created successfully', 'success');
        
        // Hide modal after a delay
        setTimeout(() => {
            hideBackupModal();
        }, 2000);
        
        return result;
    } catch (error) {
        // Show error
        clearInterval(window.backupRestoreState.progressInterval);
        progressStatus.textContent = 'Error';
        progressDetails.textContent = `Backup failed: ${error.message}`;
        
        // Show error notification
        showNotification(`Backup failed: ${error.message}`, 'error');
        
        // Re-enable form elements
        document.getElementById('backupName').disabled = false;
        document.getElementById('backupDescription').disabled = false;
        document.getElementById('includeVolumes').disabled = false;
        document.getElementById('createBackupBtn').disabled = false;
        document.getElementById('cancelBackupBtn').disabled = false;
        
        throw error;
    }
}

/**
 * Start the restore process
 * @param {string} serverId - Server/container ID
 * @param {string} backupId - Backup ID
 * @param {boolean} restoreVolumes - Whether to restore volume data
 */
async function startRestoreProcess(serverId, backupId, restoreVolumes) {
    // Hide restore confirm modal
    hideRestoreConfirmModal();
    
    // Show manage backups modal with progress
    document.getElementById('manageBackupsModal').style.display = 'flex';
    
    // Show progress container
    const progressContainer = document.getElementById('restoreProgressContainer');
    progressContainer.style.display = 'block';
    
    // Get progress elements
    const progressStatus = document.querySelector('#restoreProgressContainer .backup-progress-status');
    const progressBar = document.querySelector('#restoreProgressContainer .backup-progress-bar-fill');
    const progressDetails = document.querySelector('#restoreProgressContainer .backup-progress-details');
    
    // Disable buttons
    document.getElementById('closeBackupsBtn').disabled = true;
    document.getElementById('createNewBackupBtn').disabled = true;
    
    // Set initial progress
    progressStatus.textContent = '0%';
    progressBar.style.width = '0%';
    progressDetails.textContent = 'Preparing restore...';
    
    // Set up progress simulation
    let progress = 0;
    window.backupRestoreState.progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 5;
            progressStatus.textContent = `${Math.round(progress)}%`;
            progressBar.style.width = `${progress}%`;
        }
    }, 500);
    
    try {
        // Create restore options
        const options = {
            restoreVolumes: restoreVolumes
        };
        
        // Start restore
        progressDetails.textContent = 'Stopping server...';
        await stopContainer(serverId);
        
        progressDetails.textContent = 'Restoring server configuration...';
        await restoreServer(serverId, backupId, options);
        
        progressDetails.textContent = 'Starting server...';
        await startContainer(serverId);
        
        // Complete progress
        clearInterval(window.backupRestoreState.progressInterval);
        progressStatus.textContent = '100%';
        progressBar.style.width = '100%';
        progressDetails.textContent = 'Restore completed successfully!';
        
        // Show success notification
        showNotification('Server restored successfully', 'success');
        
        // Re-enable buttons
        document.getElementById('closeBackupsBtn').disabled = false;
        document.getElementById('createNewBackupBtn').disabled = false;
        
        // Hide modal after a delay
        setTimeout(() => {
            hideManageBackupsModal();
            // Refresh server details
            if (typeof window.selectServer === 'function') {
                window.selectServer(serverId);
            }
        }, 2000);
    } catch (error) {
        // Show error
        clearInterval(window.backupRestoreState.progressInterval);
        progressStatus.textContent = 'Error';
        progressDetails.textContent = `Restore failed: ${error.message}`;
        
        // Show error notification
        showNotification(`Restore failed: ${error.message}`, 'error');
        
        // Re-enable buttons
        document.getElementById('closeBackupsBtn').disabled = false;
        document.getElementById('createNewBackupBtn').disabled = false;
    }
}

/**
 * Confirm deletion of a backup
 * @param {string} backupId - Backup ID
 */
function confirmDeleteBackup(backupId) {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
        deleteBackup(backupId)
            .then(() => {
                // Reload backups
                loadServerBackups(window.backupRestoreState.currentServerId);
                // Show success notification
                showNotification('Backup deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting backup:', error);
                showNotification(`Failed to delete backup: ${error.message}`, 'error');
            });
    }
}

/**
 * Get backups for a server
 * @param {string} serverId - Server/container ID
 * @returns {Promise<Array>} Promise resolving to array of backups
 */
async function getServerBackups(serverId) {
    // Get all backups
    const allBackups = window.backupRestoreState.backupList;
    
    // Filter backups for this server
    return allBackups.filter(backup => backup.serverId === serverId);
}

/**
 * Backup a single server
 * @param {string} serverId - Server/container ID
 * @param {Object} options - Backup options
 * @returns {Promise<Object>} Promise resolving to backup details
 */
async function backupServer(serverId, options = {}) {
    const log = message => logMessage(`[Backup] ${message}`);
    log(`Starting backup for server ${serverId}...`);
    
    try {
        // Set backup in progress
        window.backupRestoreState.backupInProgress = true;
        
        // Get container details
        const container = await getContainerDetails(serverId);
        
        // Create backup ID
        const backupId = generateBackupId(serverId);
        
        // Create backup directory
        const backupDir = await createBackupDirectory(backupId);
        
        // Backup configuration files
        const configFiles = await backupConfigFiles(serverId, backupDir);
        
        // Backup volume data if requested
        let volumeData = [];
        if (options.includeVolumes !== false) {
            volumeData = await backupVolumeData(serverId, backupDir);
        }
        
        // Create backup metadata
        const backupMetadata = {
            id: backupId,
            serverId: serverId,
            serverName: container.name,
            name: options.name || null,
            description: options.description || null,
            timestamp: new Date().toISOString(),
            configFiles: configFiles,
            volumeData: volumeData,
            containerDetails: container
        };
        
        // Save backup metadata
        await saveBackupMetadata(backupId, backupMetadata);
        
        // Update backup list
        updateBackupList(backupMetadata);
        
        // Set backup in progress to false
        window.backupRestoreState.backupInProgress = false;
        
        log(`Backup completed successfully: ${backupId}`);
        return backupMetadata;
    } catch (error) {
        window.backupRestoreState.backupInProgress = false;
        log(`Backup failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Restore a server from backup
 * @param {string} serverId - Server/container ID
 * @param {string} backupId - Backup ID
 * @param {Object} options - Restore options
 * @returns {Promise<void>} Promise that resolves when restore is complete
 */
async function restoreServer(serverId, backupId, options = {}) {
    const log = message => logMessage(`[Restore] ${message}`);
    log(`Starting restore for server ${serverId} from backup ${backupId}...`);
    
    try {
        // Set restore in progress
        window.backupRestoreState.restoreInProgress = true;
        
        // Get backup metadata
        const backupMetadata = await getBackupMetadata(backupId);
        
        // Restore configuration files
        await restoreConfigFiles(serverId, backupMetadata);
        
        // Restore volume data if requested
        if (options.restoreVolumes !== false && backupMetadata.volumeData && backupMetadata.volumeData.length > 0) {
            await restoreVolumeData(serverId, backupMetadata);
        }
        
        // Set restore in progress to false
        window.backupRestoreState.restoreInProgress = false;
        
        log(`Restore completed successfully: ${backupId}`);
    } catch (error) {
        window.backupRestoreState.restoreInProgress = false;
        log(`Restore failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Backup all servers
 * @returns {Promise<Array>} Promise resolving to array of backup details
 */
async function backupAllServers() {
    const log = message => logMessage(`[Backup] ${message}`);
    log('Starting backup for all servers...');
    
    try {
        // Get all containers
        const containers = await getDockerContainers();
        
        // Create backup ID for the batch
        const batchBackupId = `batch-${Date.now()}`;
        
        // Create backup directory for the batch
        const batchBackupDir = await createBackupDirectory(batchBackupId);
        
        // Backup each server
        const backupResults = [];
        for (const container of containers) {
            try {
                log(`Backing up server ${container.name}...`);
                const backupResult = await backupServer(container.id);
                backupResults.push(backupResult);
            } catch (error) {
                log(`Failed to backup server ${container.name}: ${error.message}`, 'error');
                backupResults.push({
                    serverId: container.id,
                    serverName: container.name,
                    error: error.message
                });
            }
        }
        
        // Create batch backup metadata
        const batchBackupMetadata = {
            id: batchBackupId,
            timestamp: new Date().toISOString(),
            backups: backupResults
        };
        
        // Save batch backup metadata
        await saveBackupMetadata(batchBackupId, batchBackupMetadata);
        
        log(`Batch backup completed: ${batchBackupId}`);
        return backupResults;
    } catch (error) {
        log(`Batch backup failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Generate a backup ID
 * @param {string} serverId - Server/container ID
 * @returns {string} Backup ID
 */
function generateBackupId(serverId) {
    const timestamp = Date.now();
    const shortServerId = serverId.substring(0, 8);
    return `backup-${shortServerId}-${timestamp}`;
}

/**
 * Create a backup directory
 * @param {string} backupId - Backup ID
 * @returns {Promise<string>} Promise resolving to backup directory path
 */
async function createBackupDirectory(backupId) {
    try {
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.createDirectory) {
            // Get backup base directory
            const backupBaseDir = await window.electronAPI.getBackupDirectory();
            
            // Create backup directory
            const backupDir = `${backupBaseDir}/${backupId}`;
            await window.electronAPI.createDirectory(backupDir);
            
            return backupDir;
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Creating backup directory for ${backupId}`);
            return `/simulated/backup/path/${backupId}`;
        }
    } catch (error) {
        console.error('Error creating backup directory:', error);
        throw new Error(`Failed to create backup directory: ${error.message}`);
    }
}

/**
 * Backup configuration files
 * @param {string} serverId - Server/container ID
 * @param {string} backupDir - Backup directory path
 * @returns {Promise<Array>} Promise resolving to array of backed up config files
 */
async function backupConfigFiles(serverId, backupDir) {
    try {
        // Get container details
        const container = await getContainerDetails(serverId);
        
        // Get configuration files
        const configFiles = [
            'config.json',
            '.env',
            'docker-compose.yml',
            'environment.json'
        ];
        
        const backedUpFiles = [];
        
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            for (const configFile of configFiles) {
                try {
                    // Get config file content from container
                    const configContent = await getContainerConfigFile(serverId, configFile);
                    
                    if (configContent) {
                        // Write config file to backup directory
                        const backupFilePath = `${backupDir}/${configFile}`;
                        await window.electronAPI.writeFile(backupFilePath, configContent);
                        
                        backedUpFiles.push({
                            name: configFile,
                            path: backupFilePath
                        });
                    }
                } catch (error) {
                    console.log(`Config file ${configFile} not found or not accessible`);
                }
            }
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Backing up config files for ${serverId}`);
            
            for (const configFile of configFiles) {
                backedUpFiles.push({
                    name: configFile,
                    path: `${backupDir}/${configFile}`
                });
            }
        }
        
        return backedUpFiles;
    } catch (error) {
        console.error('Error backing up config files:', error);
        throw new Error(`Failed to backup config files: ${error.message}`);
    }
}

/**
 * Backup volume data
 * @param {string} serverId - Server/container ID
 * @param {string} backupDir - Backup directory path
 * @returns {Promise<Array>} Promise resolving to array of backed up volume data
 */
async function backupVolumeData(serverId, backupDir) {
    try {
        // Get container details
        const container = await getContainerDetails(serverId);
        
        // Extract volume mounts
        const volumeMounts = container.volumes || [];
        
        const backedUpVolumes = [];
        
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.copyDirectory) {
            for (const volumeMount of volumeMounts) {
                try {
                    // Extract host path from volume mount
                    const hostPath = volumeMount.split(':')[0];
                    const containerPath = volumeMount.split(':')[1];
                    
                    // Create volume backup directory
                    const volumeBackupDir = `${backupDir}/volumes/${containerPath.replace(/\//g, '_')}`;
                    await window.electronAPI.createDirectory(volumeBackupDir);
                    
                    // Copy volume data to backup directory
                    await window.electronAPI.copyDirectory(hostPath, volumeBackupDir);
                    
                    backedUpVolumes.push({
                        hostPath,
                        containerPath,
                        backupPath: volumeBackupDir
                    });
                } catch (error) {
                    console.log(`Volume ${volumeMount} not found or not accessible: ${error.message}`);
                }
            }
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Backing up volume data for ${serverId}`);
            
            if (volumeMounts.length > 0) {
                for (const volumeMount of volumeMounts) {
                    const hostPath = volumeMount.split(':')[0];
                    const containerPath = volumeMount.split(':')[1];
                    
                    backedUpVolumes.push({
                        hostPath,
                        containerPath,
                        backupPath: `${backupDir}/volumes/${containerPath.replace(/\//g, '_')}`
                    });
                }
            } else {
                // Simulate some default volume mounts
                backedUpVolumes.push({
                    hostPath: '/simulated/host/path/data',
                    containerPath: '/app/data',
                    backupPath: `${backupDir}/volumes/app_data`
                });
            }
        }
        
        return backedUpVolumes;
    } catch (error) {
        console.error('Error backing up volume data:', error);
        throw new Error(`Failed to backup volume data: ${error.message}`);
    }
}

/**
 * Save backup metadata
 * @param {string} backupId - Backup ID
 * @param {Object} metadata - Backup metadata
 * @returns {Promise<void>} Promise that resolves when metadata is saved
 */
async function saveBackupMetadata(backupId, metadata) {
    try {
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            // Get backup base directory
            const backupBaseDir = await window.electronAPI.getBackupDirectory();
            
            // Write metadata file
            const metadataPath = `${backupBaseDir}/${backupId}/metadata.json`;
            await window.electronAPI.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Saving backup metadata for ${backupId}`);
            
            // Store in localStorage for simulation
            const backupMetadata = JSON.parse(localStorage.getItem('backupMetadata') || '{}');
            backupMetadata[backupId] = metadata;
            localStorage.setItem('backupMetadata', JSON.stringify(backupMetadata));
        }
    } catch (error) {
        console.error('Error saving backup metadata:', error);
        throw new Error(`Failed to save backup metadata: ${error.message}`);
    }
}

/**
 * Update backup list
 * @param {Object} backupMetadata - Backup metadata
 */
function updateBackupList(backupMetadata) {
    // Get current backup list
    const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
    
    // Add new backup to list
    backupList.push({
        id: backupMetadata.id,
        serverId: backupMetadata.serverId,
        serverName: backupMetadata.serverName,
        timestamp: backupMetadata.timestamp
    });
    
    // Update localStorage
    localStorage.setItem('backupList', JSON.stringify(backupList));
    localStorage.setItem('lastBackupTime', new Date().toISOString());
    
    // Update state
    window.backupRestoreState.backupList = backupList;
    window.backupRestoreState.lastBackupTime = new Date().toISOString();
}

/**
 * Restore a server from backup
 * @param {string} serverId - Server/container ID
 * @param {string} backupId - Backup ID
 * @returns {Promise<void>} Promise that resolves when restore is complete
 */
async function restoreServer(serverId, backupId) {
    const log = message => logMessage(`[Restore] ${message}`);
    log(`Starting restore for server ${serverId} from backup ${backupId}...`);
    
    try {
        // Set restore in progress
        window.backupRestoreState.restoreInProgress = true;
        
        // Get backup metadata
        const backupMetadata = await getBackupMetadata(backupId);
        
        // Verify backup is for the correct server
        if (backupMetadata.serverId !== serverId) {
            throw new Error(`Backup ${backupId} is not for server ${serverId}`);
        }
        
        // Stop the container
        await stopContainer(serverId);
        
        // Restore configuration files
        await restoreConfigFiles(serverId, backupMetadata);
        
        // Restore volume data
        await restoreVolumeData(serverId, backupMetadata);
        
        // Start the container
        await startContainer(serverId);
        
        // Set restore in progress to false
        window.backupRestoreState.restoreInProgress = false;
        
        log(`Restore completed successfully`);
    } catch (error) {
        window.backupRestoreState.restoreInProgress = false;
        log(`Restore failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Get backup metadata
 * @param {string} backupId - Backup ID
 * @returns {Promise<Object>} Promise resolving to backup metadata
 */
async function getBackupMetadata(backupId) {
    try {
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.readFile) {
            // Get backup base directory
            const backupBaseDir = await window.electronAPI.getBackupDirectory();
            
            // Read metadata file
            const metadataPath = `${backupBaseDir}/${backupId}/metadata.json`;
            const metadataContent = await window.electronAPI.readFile(metadataPath);
            
            return JSON.parse(metadataContent);
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Getting backup metadata for ${backupId}`);
            
            // Get from localStorage for simulation
            const backupMetadata = JSON.parse(localStorage.getItem('backupMetadata') || '{}');
            return backupMetadata[backupId];
        }
    } catch (error) {
        console.error('Error getting backup metadata:', error);
        throw new Error(`Failed to get backup metadata: ${error.message}`);
    }
}

/**
 * Stop a container
 * @param {string} serverId - Server/container ID
 * @returns {Promise<void>} Promise that resolves when container is stopped
 */
async function stopContainer(serverId) {
    try {
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            await window.electronAPI.executeCommand('docker', ['stop', serverId], {});
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Stopping container ${serverId}`);
            await simulateDelay(1000);
        }
    } catch (error) {
        console.error('Error stopping container:', error);
        throw new Error(`Failed to stop container: ${error.message}`);
    }
}

/**
 * Start a container
 * @param {string} serverId - Server/container ID
 * @returns {Promise<void>} Promise that resolves when container is started
 */
async function startContainer(serverId) {
    try {
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            await window.electronAPI.executeCommand('docker', ['start', serverId], {});
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Starting container ${serverId}`);
            await simulateDelay(1000);
        }
    } catch (error) {
        console.error('Error starting container:', error);
        throw new Error(`Failed to start container: ${error.message}`);
    }
}

/**
 * Restore configuration files
 * @param {string} serverId - Server/container ID
 * @param {Object} backupMetadata - Backup metadata
 * @returns {Promise<void>} Promise that resolves when config files are restored
 */
async function restoreConfigFiles(serverId, backupMetadata) {
    try {
        const configFiles = backupMetadata.configFiles || [];
        
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.readFile) {
            for (const configFile of configFiles) {
                try {
                    // Read config file from backup
                    const configContent = await window.electronAPI.readFile(configFile.path);
                    
                    // Write config file to container
                    await setContainerConfigFile(serverId, configFile.name, configContent);
                } catch (error) {
                    console.log(`Error restoring config file ${configFile.name}: ${error.message}`);
                }
            }
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Restoring config files for ${serverId}`);
            await simulateDelay(1000);
        }
    } catch (error) {
        console.error('Error restoring config files:', error);
        throw new Error(`Failed to restore config files: ${error.message}`);
    }
}

/**
 * Restore volume data
 * @param {string} serverId - Server/container ID
 * @param {Object} backupMetadata - Backup metadata
 * @returns {Promise<void>} Promise that resolves when volume data is restored
 */
async function restoreVolumeData(serverId, backupMetadata) {
    try {
        const volumeData = backupMetadata.volumeData || [];
        
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.copyDirectory) {
            for (const volume of volumeData) {
                try {
                    // Copy volume data from backup to host path
                    await window.electronAPI.copyDirectory(volume.backupPath, volume.hostPath);
                } catch (error) {
                    console.log(`Error restoring volume ${volume.containerPath}: ${error.message}`);
                }
            }
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Restoring volume data for ${serverId}`);
            await simulateDelay(2000);
        }
    } catch (error) {
        console.error('Error restoring volume data:', error);
        throw new Error(`Failed to restore volume data: ${error.message}`);
    }
}

/**
 * Show backup manager dialog
 */
function showBackupManager() {
    // Get backup list
    const backupList = window.backupRestoreState.backupList;
    
    // Create backup manager dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Backup Manager</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="backup-list">
                    ${backupList.length > 0 ? 
                        backupList.map(backup => `
                            <div class="backup-item" data-backup-id="${backup.id}">
                                <div class="backup-item-info">
                                    <div class="backup-item-name">${backup.serverName}</div>
                                    <div class="backup-item-date">${formatDate(backup.timestamp)}</div>
                                </div>
                                <div class="backup-item-actions">
                                    <button class="btn btn-sm restore-backup-btn" data-server-id="${backup.serverId}" data-backup-id="${backup.id}">
                                        <i class="fas fa-undo"></i> Restore
                                    </button>
                                    <button class="btn btn-sm delete-backup-btn" data-backup-id="${backup.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="empty-state">No backups found</div>'
                    }
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" id="createBackupBtn">Create New Backup</button>
                <button class="btn btn-outline" id="closeBackupManagerBtn">Close</button>
            </div>
        </div>
    `;
    
    // Add dialog to document
    document.body.appendChild(dialog);
    
    // Add event listeners
    dialog.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    dialog.querySelector('#closeBackupManagerBtn').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    dialog.querySelector('#createBackupBtn').addEventListener('click', () => {
        document.body.removeChild(dialog);
        backupAllServers();
    });
    
    dialog.querySelectorAll('.restore-backup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const serverId = btn.getAttribute('data-server-id');
            const backupId = btn.getAttribute('data-backup-id');
            document.body.removeChild(dialog);
            restoreServer(serverId, backupId);
        });
    });
    
    dialog.querySelectorAll('.delete-backup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const backupId = btn.getAttribute('data-backup-id');
            deleteBackup(backupId);
            document.body.removeChild(dialog);
        });
    });
}

/**
 * Delete a backup
 * @param {string} backupId - Backup ID
 * @returns {Promise<void>} Promise that resolves when backup is deleted
 */
async function deleteBackup(backupId) {
    const log = message => logMessage(`[Backup] ${message}`);
    log(`Deleting backup ${backupId}...`);
    
    try {
        // Check if we're running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.deleteDirectory) {
            // Get backup base directory
            const backupBaseDir = await window.electronAPI.getBackupDirectory();
            
            // Delete backup directory
            await window.electronAPI.deleteDirectory(`${backupBaseDir}/${backupId}`);
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Deleting backup ${backupId}`);
            
            // Remove from localStorage for simulation
            const backupMetadata = JSON.parse(localStorage.getItem('backupMetadata') || '{}');
            delete backupMetadata[backupId];
            localStorage.setItem('backupMetadata', JSON.stringify(backupMetadata));
        }
        
        // Update backup list
        const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
        const updatedBackupList = backupList.filter(backup => backup.id !== backupId);
        localStorage.setItem('backupList', JSON.stringify(updatedBackupList));
        
        // Update state
        window.backupRestoreState.backupList = updatedBackupList;
        
        log(`Backup ${backupId} deleted successfully`);
    } catch (error) {
        log(`Failed to delete backup: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

/**
 * Simulate a delay for development/testing
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after the delay
 */
function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get configuration file content from a container
 * @param {string} containerId - Container ID
 * @param {string} filename - Configuration file name
 * @returns {Promise<string>} Promise resolving to file content
 */
async function getContainerConfigFile(containerId, filename) {
    // This function should be implemented in the config-editor.js module
    // For now, we'll use a placeholder implementation
    if (typeof window.ConfigEditor !== 'undefined' && typeof window.ConfigEditor.getContainerConfigFile === 'function') {
        return window.ConfigEditor.getContainerConfigFile(containerId, filename);
    } else {
        // Fallback to simulation for development/testing
        console.log(`[Simulation] Getting config file ${filename} from container ${containerId}`);
        
        // Generate simulated content based on filename
        if (filename === 'config.json') {
            return JSON.stringify({
                server: {
                    port: 3000,
                    host: '0.0.0.0'
                },
                api: {
                    timeout: 30000,
                    maxRequestSize: '10mb'
                }
            }, null, 2);
        } else if (filename === '.env') {
            return 'PORT=3000\nHOST=0.0.0.0\nNODE_ENV=production';
        } else if (filename === 'docker-compose.yml') {
            return `version: '3'\nservices:\n  app:\n    image: mcp-server\n    ports:\n      - 3000:3000`;
        } else if (filename === 'environment.json') {
            return JSON.stringify({
                variables: {
                    PORT: 3000,
                    HOST: '0.0.0.0',
                    NODE_ENV: 'production'
                }
            }, null, 2);
        } else {
            return null;
        }
    }
}

/**
 * Set configuration file content in a container
 * @param {string} containerId - Container ID
 * @param {string} filename - Configuration file name
 * @param {string} content - File content
 * @returns {Promise<void>} Promise that resolves when file is set
 */
async function setContainerConfigFile(containerId, filename, content) {
    // This function should be implemented in the config-editor.js module
    // For now, we'll use a placeholder implementation
    if (typeof window.ConfigEditor !== 'undefined' && typeof window.ConfigEditor.setContainerConfigFile === 'function') {
        return window.ConfigEditor.setContainerConfigFile(containerId, filename, content);
    } else {
        // Fallback to simulation for development/testing
        console.log(`[Simulation] Setting config file ${filename} in container ${containerId}`);
        await simulateDelay(500);
    }
}

// Make functions globally accessible
window.BackupRestore = {
    backupServer,
    backupAllServers,
    restoreServer,
    showBackupManager,
    deleteBackup
};
