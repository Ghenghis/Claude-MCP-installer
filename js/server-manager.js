/**
 * Server Manager - Handles MCP server operations
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initServerManager();
    addServerManagerEventListeners();
    initServerManagerEventListeners();
});

/**
 * Initialize the server manager
 */
async function initServerManager() {
    try {
        await refreshServerList();
    } catch (error) {
        console.error('Error initializing server manager:', error);
    }
}

/**
 * Refresh the server list
 */
async function refreshServerList() {
    try {
        // Get all containers
        const containers = await getDockerContainers();
        
        // Clear server list
        const serverList = document.getElementById('serverList');
        serverList.innerHTML = '';
        
        // Add containers to server list
        if (containers.length === 0) {
            // Show empty state
            document.getElementById('serverListEmptyState').style.display = 'block';
        } else {
            // Hide empty state
            document.getElementById('serverListEmptyState').style.display = 'none';
            
            // Add containers to list
            for (const container of containers) {
                let serverListItem;
                
                // Use BatchOperations.createServerListItem if available, otherwise use default
                if (window.BatchOperations && typeof window.BatchOperations.createServerListItem === 'function') {
                    serverListItem = window.BatchOperations.createServerListItem(container);
                } else {
                    serverListItem = createDefaultServerListItem(container);
                }
                
                serverList.appendChild(serverListItem);
            }
        }
    } catch (error) {
        console.error('Error refreshing server list:', error);
        showNotification('Failed to refresh server list', 'error');
    }
}

/**
 * Create default server list item (without batch operations support)
 * @param {Object} container - Container details
 * @returns {HTMLElement} Server list item element
 */
function createDefaultServerListItem(container) {
    const serverListItem = document.createElement('div');
    serverListItem.className = 'server-list-item';
    serverListItem.setAttribute('data-id', container.id);
    
    // Server name
    const serverName = document.createElement('div');
    serverName.className = 'server-list-item-name';
    serverName.textContent = container.name;
    
    // Server status
    const serverStatus = document.createElement('div');
    serverStatus.className = 'server-list-item-status';
    serverStatus.textContent = container.isRunning ? 'Running' : 'Stopped';
    
    // Server actions
    const serverActions = document.createElement('div');
    serverActions.className = 'server-actions';
    
    // Backup button
    const backupBtn = document.createElement('button');
    backupBtn.className = 'btn btn-sm btn-outline backup-server-btn';
    backupBtn.setAttribute('data-server-id', container.id);
    backupBtn.innerHTML = '<i class="fas fa-save"></i> Backup';
    backupBtn.title = 'Create a backup of this server';
    backupBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent server selection
        if (window.BackupUI && typeof window.BackupUI.showBackupModal === 'function') {
            window.BackupUI.showBackupModal(container.id);
        }
    });
    
    // Restore button
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn btn-sm btn-outline restore-server-btn';
    restoreBtn.setAttribute('data-server-id', container.id);
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i> Restore';
    restoreBtn.title = 'Restore this server from a backup';
    restoreBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent server selection
        if (window.BackupUI && typeof window.BackupUI.showRestoreModal === 'function') {
            window.BackupUI.showRestoreModal(container.id);
        }
    });
    
    // Add buttons to actions
    serverActions.appendChild(backupBtn);
    serverActions.appendChild(restoreBtn);
    
    // Add elements to server list item
    serverListItem.appendChild(serverName);
    serverListItem.appendChild(serverStatus);
    serverListItem.appendChild(serverActions);
    
    // Add click event to select server
    serverListItem.addEventListener('click', function() {
        selectServer(container.id);
    });
    
    return serverListItem;
}

/**
 * Add server button click handler with server ID validation
 * @param {string} buttonId - Button element ID
 * @param {Function} actionFn - Function to call with server ID
 */
function addServerButtonHandler(buttonId, actionFn) {
    document.getElementById(buttonId).addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            actionFn(serverId);
        }
    });
}

/**
 * Add event listeners for server manager UI elements
 */
function addServerManagerEventListeners() {
    // Main tab navigation
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchMainTab(this);
        });
    });
    
    // Refresh servers button
    document.getElementById('refreshServersBtn').addEventListener('click', function() {
        refreshServerList();
    });
    
    // Server search
    document.getElementById('serverSearch').addEventListener('input', function() {
        filterServerList(this.value);
    });
    
    // Server control buttons
    addServerButtonHandler('startServerBtn', startServer);
    addServerButtonHandler('stopServerBtn', stopServer);
    addServerButtonHandler('restartServerBtn', restartServer);
    addServerButtonHandler('viewLogsBtn', toggleServerLogs);
    addServerButtonHandler('deleteServerBtn', confirmDeleteServer);
    
    // Log controls
    document.getElementById('refreshLogsBtn').addEventListener('click', function() {
        const serverId = document.getElementById('viewLogsBtn').getAttribute('data-server-id');
        if (serverId) {
            refreshServerLogs(serverId);
        }
    });
    
    document.getElementById('clearLogsBtn').addEventListener('click', function() {
        document.getElementById('logsContent').textContent = '';
    });
    
    document.getElementById('downloadLogsBtn').addEventListener('click', function() {
        downloadServerLogs();
    });
    
    // Server details tab navigation
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchServerTab(this);
        });
    });
}

/**
 * Initialize server manager event listeners
 */
function initServerManagerEventListeners() {
    // Initialize different groups of event listeners
    initServerActionListeners();
    initDeleteModalListeners();
    initTabListeners();
    initUpdateListeners();
}

/**
 * Initialize server action button listeners
 */
function initServerActionListeners() {
    // Server action buttons
    document.getElementById('startServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            startServer(serverId);
        }
    });
    
    document.getElementById('stopServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            stopServer(serverId);
        }
    });
    
    document.getElementById('restartServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            restartServer(serverId);
        }
    });
    
    document.getElementById('deleteServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            confirmDeleteServer(serverId);
        }
    });
}

/**
 * Initialize delete modal listeners
 */
function initDeleteModalListeners() {
    // Delete server modal buttons
    document.getElementById('closeDeleteServerModal').addEventListener('click', hideDeleteServerModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteServerModal);
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
        await handleDeleteServerConfirmation();
    });
}

/**
 * Handle delete server confirmation
 */
async function handleDeleteServerConfirmation() {
    const serverId = window.currentDeletionServerId;
    const createBackup = document.getElementById('createBackupBeforeDelete').checked;
    
    if (!serverId) {
        hideDeleteServerModal();
        return;
    }
    
    try {
        // Create backup if requested
        if (createBackup) {
            await createBackupBeforeDeletion(serverId);
        }
        
        // Delete server
        await deleteServer(serverId);
        
        // Hide modal
        hideDeleteServerModal();
    } catch (error) {
        console.error('Error during server deletion:', error);
        showNotification(`Failed to delete server: ${error.message}`, 'error');
    }
}

/**
 * Create backup before deletion
 * @param {string} serverId - Server ID
 */
async function createBackupBeforeDeletion(serverId) {
    // Show notification
    showNotification('Creating backup before deletion...', 'info');
    
    // Create backup
    if (typeof window.BackupRestore !== 'undefined' && window.BackupRestore.backupServer) {
        await window.BackupRestore.backupServer(serverId, {
            name: `Pre-deletion backup - ${window.currentDeletionServerName}`,
            description: 'Automatic backup created before server deletion',
            includeVolumes: true
        });
    }
}

/**
 * Initialize tab button listeners
 */
function initTabListeners() {
    // Server tab buttons
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchServerTab(this);
        });
    });
}

/**
 * Initialize update button listeners
 */
function initUpdateListeners() {
    // Check for updates button
    document.getElementById('checkUpdateBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId && typeof window.ServerUpdater !== 'undefined') {
            window.ServerUpdater.checkForUpdates(serverId);
        }
    });
    
    // Update server button
    document.getElementById('updateServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId && typeof window.ServerUpdater !== 'undefined') {
            window.ServerUpdater.updateServer(serverId);
        }
    });
}

/**
 * Switch between main tabs (Install, Manage Servers)
 * @param {Element} selectedTab - The selected tab button
 */
function switchMainTab(selectedTab) {
    // Update active tab button
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    selectedTab.classList.add('active');
    
    // Show selected tab content
    const tabId = selectedTab.getAttribute('data-tab');
    document.querySelectorAll('.main-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // If switching to manage tab, refresh server list
    if (tabId === 'manage') {
        refreshServerList();
    }
}

/**
 * Switch between server detail tabs
 * @param {Element} selectedTab - The selected tab button
 */
function switchServerTab(selectedTab) {
    if (!selectedTab) return;
    
    // Update active state on tab buttons
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    selectedTab.classList.add('active');
    
    // Get target tab ID
    const tabId = selectedTab.getAttribute('data-tab');
    
    // Update active state on tab content
    document.querySelectorAll('.server-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    // Refresh content based on tab
    const serverId = document.getElementById('startServerBtn').getAttribute('data-server-id');
    if (serverId) {
        if (tabId === 'logs-tab') {
            refreshServerLogs(serverId);
        } else if (tabId === 'config-tab' && window.ConfigEditor && typeof window.ConfigEditor.loadConfigFileList === 'function') {
            window.ConfigEditor.loadConfigFileList(serverId);
        }
    }
}

/**
 * Get list of Docker containers
 * @returns {Promise<Array>} Promise resolving to array of container objects
 */
async function getDockerContainers() {
    try {
        return await getContainersBasedOnEnvironment();
    } catch (error) {
        console.error('Error getting Docker containers:', error);
        return [];
    }
}

/**
 * Get containers based on the current environment (Electron or simulation)
 * @returns {Promise<Array>} Promise resolving to array of container objects
 */
async function getContainersBasedOnEnvironment() {
    return isElectronEnvironmentAvailable() 
        ? await getContainersFromDocker() 
        : getSimulatedContainers();
}

/**
 * Check if Electron environment with command execution is available
 * @returns {boolean} True if Electron environment is available
 */
function isElectronEnvironmentAvailable() {
    const hasElectronAPI = typeof window.electronAPI !== 'undefined';
    const canExecuteCommands = hasElectronAPI && window.electronAPI.executeCommand;
    
    if (!canExecuteCommands && hasElectronAPI) {
        console.warn('Electron API available but missing executeCommand capability');
    }
    
    if (!canExecuteCommands) {
        console.log('Using simulated Docker containers (Electron API not available)');
    }
    
    return canExecuteCommands;
}

/**
 * Get containers from Docker using Electron API
 * @returns {Promise<Array>} Promise resolving to array of container objects
 */
async function getContainersFromDocker() {
    const dockerCommand = buildDockerPsCommand();
    const result = await executeDockerCommand(dockerCommand);
    return parseDockerPsOutput(result);
}

/**
 * Build the Docker PS command parameters
 * @returns {Object} Docker command configuration
 */
function buildDockerPsCommand() {
    return {
        command: 'docker',
        args: [
            'ps', 
            '-a', 
            '--format', 
            '{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}\\t{{.CreatedAt}}'
        ],
        options: {}
    };
}

/**
 * Execute a Docker command via Electron API
 * @param {Object} commandConfig - Command configuration
 * @returns {Promise<string>} Command output
 */
async function executeDockerCommand(commandConfig) {
    try {
        return await window.electronAPI.executeCommand(
            commandConfig.command,
            commandConfig.args,
            commandConfig.options
        );
    } catch (error) {
        console.error('Error executing Docker command:', error);
        throw new Error(`Docker command failed: ${error.message}`);
    }
}

/**
 * Parse Docker ps command output into container objects
 * @param {string} output - Docker ps command output
 * @returns {Array} Array of container objects
 */
function parseDockerPsOutput(output) {
    if (!output || output.trim() === '') {
        return [];
    }
    
    return output.trim().split('\n').map(parseDockerPsLine);
}

/**
 * Parse a single line from Docker ps output
 * @param {string} line - Line from Docker ps output
 * @returns {Object} Container object
 */
function parseDockerPsLine(line) {
    const [id, name, image, status, ports, createdAt] = line.split('\t');
    
    return {
        id,
        name,
        image,
        status,
        ports: extractPortMappings(ports),
        createdAt,
        isRunning: determineContainerRunningState(status)
    };
}

/**
 * Extract port mappings from Docker ports string
 * @param {string} ports - Docker ports string
 * @returns {Array} Array of port mappings
 */
function extractPortMappings(ports) {
    return ports.match(/\d+:\d+/g) || [];
}

/**
 * Determine if a container is running based on its status
 * @param {string} status - Container status string
 * @returns {boolean} True if container is running
 */
function determineContainerRunningState(status) {
    return status.toLowerCase().includes('up');
}

/**
 * Get simulated Docker containers for development/testing
 * @returns {Array} Array of simulated container objects
 */
function getSimulatedContainers() {
    const storedContainers = getStoredContainers();
    return storedContainers.length > 0
        ? mapToContainerFormat(storedContainers)
        : getDefaultSimulatedContainers();
}

/**
 * Get stored containers from localStorage
 * @returns {Array} Array of stored container objects or empty array
 */
function getStoredContainers() {
    const storedContainers = localStorage.getItem('dockerContainers');
    if (!storedContainers) {
        return [];
    }
    
    try {
        return JSON.parse(storedContainers);
    } catch (error) {
        console.error('Error parsing stored containers:', error);
        return [];
    }
}

/**
 * Map stored containers to the standard container format
 * @param {Array} containers - Array of stored container objects
 * @returns {Array} Array of formatted container objects
 */
function mapToContainerFormat(containers) {
    return containers.map(container => ({
        id: generateRandomId(),
        name: container.name,
        image: 'modelcontextprotocol/mcp-server:latest',
        status: getContainerStatus(container.status),
        ports: ['3000:3000'],
        createdAt: container.created,
        isRunning: container.status === 'running'
    }));
}

/**
 * Get container status string based on status value
 * @param {string} status - Container status ('running' or other)
 * @returns {string} Formatted status string
 */
function getContainerStatus(status) {
    return status === 'running' ? 'Up 2 hours' : 'Exited (0) 1 hour ago';
}

/**
 * Get default simulated containers
 * @returns {Array} Array of default container objects
 */
function getDefaultSimulatedContainers() {
    return [
        {
            id: generateRandomId(),
            name: 'mcp-server-github',
            image: 'modelcontextprotocol/mcp-server:latest',
            status: 'Up 3 hours',
            ports: ['3000:3000'],
            createdAt: '2023-04-01 12:00:00',
            isRunning: true
        },
        {
            id: generateRandomId(),
            name: 'mcp-server-redis',
            image: 'modelcontextprotocol/mcp-server:latest',
            status: 'Exited (0) 1 hour ago',
            ports: ['3001:3001'],
            createdAt: '2023-04-01 10:00:00',
            isRunning: false
        }
    ];
}

/**
 * Generate a random ID for simulated containers
 * @returns {string} Random ID
 */
function generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Filter server list based on search query
 * @param {string} query - Search query
 */
function filterServerList(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    document.querySelectorAll('.server-list-item').forEach(item => {
        const serverName = item.querySelector('.server-list-item-name').textContent.toLowerCase();
        
        if (serverName.includes(normalizedQuery) || normalizedQuery === '') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Select a server and show its details
 * @param {string} serverId - Server/container ID
 */
async function selectServer(serverId) {
    try {
        // Get container details
        const container = await getContainerDetails(serverId);
        
        // Update server details panel
        updateServerDetails(container);
        
        // Update action button states
        updateActionButtonStates(container.isRunning);
        
        // Update server details visibility
        document.getElementById('serverDetails').style.display = 'block';
        document.getElementById('serverListEmptyState').style.display = 
            document.querySelectorAll('.server-list-item').length === 0 ? 'block' : 'none';
        
        // Set active server
        document.querySelectorAll('.server-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`.server-list-item[data-id="${serverId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Set server ID for action buttons
        document.getElementById('startServerBtn').setAttribute('data-server-id', serverId);
        document.getElementById('stopServerBtn').setAttribute('data-server-id', serverId);
        document.getElementById('restartServerBtn').setAttribute('data-server-id', serverId);
        document.getElementById('deleteServerBtn').setAttribute('data-server-id', serverId);
        document.getElementById('checkUpdateBtn').setAttribute('data-server-id', serverId);
        document.getElementById('updateServerBtn').setAttribute('data-server-id', serverId);
        document.getElementById('backupBtn').setAttribute('data-server-id', serverId);
        document.getElementById('manageBackupsBtn').setAttribute('data-server-id', serverId);
        
        // Reset update status display
        document.getElementById('updateStatusContainer').style.display = 'none';
        document.getElementById('updateStatus').textContent = '-';
        document.getElementById('updateServerBtn').style.display = 'none';
        
        // Switch to Info tab
        switchServerTab(document.querySelector('.server-tab-btn[data-tab="info-tab"]'));
        
        // Refresh logs if logs tab is active
        if (document.getElementById('logs-tab').classList.contains('active')) {
            refreshServerLogs(serverId);
        }
    } catch (error) {
        console.error('Error selecting server:', error);
    }
}

/**
 * Get detailed information about a Docker container
 * @param {string} containerId - Container ID
 * @returns {Promise<Object>} Promise resolving to container details object
 */
async function getContainerDetails(containerId) {
    try {
        return isElectronEnvironmentAvailable()
            ? await getDockerContainerDetails(containerId)
            : getSimulatedContainerDetails(containerId);
    } catch (error) {
        console.error('Error getting container details:', error);
        throw new Error(`Failed to get container details: ${error.message}`);
    }
}

/**
 * Get Docker container details using docker inspect
 * @param {string} containerId - Container ID
 * @returns {Promise<Object>} Container details
 */
async function getDockerContainerDetails(containerId) {
    const inspectCommand = {
        command: 'docker',
        args: ['inspect', containerId],
        options: {}
    };
    
    const result = await executeDockerCommand(inspectCommand);
    return parseDockerInspectOutput(result);
}

/**
 * Parse Docker inspect command output into container details object
 * @param {string} output - Docker inspect command output
 * @returns {Object} Container details object
 */
function parseDockerInspectOutput(output) {
    if (!output || output.trim() === '') {
        throw new Error('Empty response from Docker inspect');
    }
    
    try {
        const inspectData = JSON.parse(output)[0];
        
        // Extract relevant information
        const name = inspectData.Name.replace(/^\//, '');
        const id = inspectData.Id;
        const image = inspectData.Config.Image;
        const created = new Date(inspectData.Created).toLocaleString();
        const isRunning = inspectData.State.Running;
        const status = isRunning ? 'Running' : 'Stopped';
        
        // Extract port mappings
        const ports = [];
        if (inspectData.NetworkSettings && inspectData.NetworkSettings.Ports) {
            for (const containerPort in inspectData.NetworkSettings.Ports) {
                const mappings = inspectData.NetworkSettings.Ports[containerPort];
                if (mappings) {
                    mappings.forEach(mapping => {
                        ports.push(`${mapping.HostPort}:${containerPort.split('/')[0]}`);
                    });
                }
            }
        }
        
        // Extract volume mounts
        const volumes = [];
        if (inspectData.Mounts) {
            inspectData.Mounts.forEach(mount => {
                volumes.push(`${mount.Source}:${mount.Destination}`);
            });
        }
        
        // Extract environment variables
        const env = inspectData.Config.Env || [];
        
        return {
            id,
            name,
            image,
            created,
            status,
            isRunning,
            ports,
            volumes,
            env
        };
    } catch (error) {
        console.error('Error parsing Docker inspect output:', error);
        throw new Error('Failed to parse container details');
    }
}

/**
 * Get simulated container details for development/testing
 * @param {string} containerId - Container ID
 * @returns {Object} Simulated container details object
 */
function getSimulatedContainerDetails(containerId) {
    // Try to find container in simulated list
    const containers = getSimulatedContainers();
    const container = containers.find(c => c.id === containerId);
    
    if (!container) {
        throw new Error('Container not found');
    }
    
    return {
        id: container.id,
        name: container.name,
        image: container.image,
        created: new Date(container.createdAt).toLocaleString(),
        status: container.isRunning ? 'Running' : 'Stopped',
        isRunning: container.isRunning,
        ports: container.ports,
        volumes: ['/var/lib/docker/volumes/mcp-data:/app/data'],
        env: [
            'REPO_URL=https://github.com/modelcontextprotocol/servers',
            'TEMPLATE_ID=basic-api',
            'NODE_ENV=production'
        ]
    };
}

/**
 * Update server details panel with container information
 * @param {Object} container - Container details object
 */
function updateServerDetails(container) {
    // Update header
    document.getElementById('detailsServerName').textContent = container.name;
    
    // Update status badge
    const statusBadge = document.getElementById('detailsServerStatus');
    statusBadge.textContent = container.status;
    statusBadge.className = 'status-badge';
    statusBadge.classList.add(container.isRunning ? 'status-running' : 'status-stopped');
    
    // Update container info
    document.getElementById('containerId').textContent = container.id;
    document.getElementById('containerImage').textContent = container.image;
    document.getElementById('containerCreated').textContent = container.created;
    document.getElementById('containerPorts').textContent = container.ports.join(', ') || '-';
    document.getElementById('containerVolumes').textContent = container.volumes.join('\n') || '-';
}

/**
 * Update action button states based on container running state
 * @param {boolean} isRunning - Whether the container is running
 */
function updateActionButtonStates(isRunning) {
    document.getElementById('startServerBtn').disabled = isRunning;
    document.getElementById('stopServerBtn').disabled = !isRunning;
    document.getElementById('restartServerBtn').disabled = !isRunning;
    document.getElementById('viewLogsBtn').disabled = false;
    document.getElementById('deleteServerBtn').disabled = false;
}

/**
 * Perform a server action (start, stop, restart)
 * @param {string} containerId - Container ID
 * @param {string} action - Action to perform ('start', 'stop', 'restart')
 * @returns {Promise<void>} Promise that resolves when the action is complete
 */
async function performServerAction(containerId, action) {
    try {
        await executeServerAction(containerId, action);
        await updateServerStateAfterAction(containerId, action);
    } catch (error) {
        handleServerActionError(error, action, containerId);
    }
}

/**
 * Execute a server action
 * @param {string} containerId - Container ID
 * @param {string} action - Action to perform
 * @returns {Promise<void>}
 */
async function executeServerAction(containerId, action) {
    if (isElectronEnvironmentAvailable()) {
        const actionCommand = {
            command: 'docker',
            args: [action, containerId],
            options: {}
        };
        await executeDockerCommand(actionCommand);
        logServerAction(action, containerId, false);
    } else {
        logServerAction(action, containerId, true);
        simulateContainerStateChange(containerId, action !== 'stop');
    }
}

/**
 * Log a server action
 * @param {string} action - The action performed
 * @param {string} containerId - Container ID
 * @param {boolean} isSimulation - Whether this is a simulation
 */
function logServerAction(action, containerId, isSimulation) {
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    const prefix = isSimulation ? '[Simulation] ' : '';
    const suffix = isSimulation ? 'ing' : 'ed';
    
    console.log(`${prefix}${actionCapitalized}${suffix} container ${containerId}`);
}

/**
 * Update server state after an action
 * @param {string} containerId - Container ID
 * @param {string} action - Action performed
 */
async function updateServerStateAfterAction(containerId, action) {
    // Refresh the server list
    await refreshServerList();
    
    // Update selected server if this is the one
    updateSelectedServerIfNeeded(containerId);
}

/**
 * Update the selected server if it matches the given ID
 * @param {string} containerId - Container ID
 */
function updateSelectedServerIfNeeded(containerId) {
    const selectedItem = document.querySelector('.server-list-item.selected');
    if (selectedItem && selectedItem.getAttribute('data-id') === containerId) {
        selectServer(containerId);
    }
}

/**
 * Handle server action error
 * @param {Error} error - The error
 * @param {string} action - The action that failed
 * @param {string} containerId - Container ID
 */
function handleServerActionError(error, action, containerId) {
    console.error(`Error ${action}ing container ${containerId}:`, error);
    showErrorNotification(`Failed to ${action} server: ${error.message}`);
}

/**
 * Toggle server logs panel visibility
 * @param {string} containerId - Container ID
 */
async function toggleServerLogs(containerId) {
    // Switch to logs tab
    if (window.ConfigEditor && typeof window.ConfigEditor.switchServerTab === 'function') {
        const logsTab = document.querySelector('.server-tab-btn[data-tab="logs"]');
        if (logsTab) {
            window.ConfigEditor.switchServerTab(logsTab);
        }
    }
    
    // Refresh logs
    await refreshServerLogs(containerId);
}

/**
 * Refresh server logs
 * @param {string} containerId - Container ID
 */
async function refreshServerLogs(containerId) {
    const logsContent = document.getElementById('logsContent');
    logsContent.textContent = 'Loading logs...';
    
    try {
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            const logs = await window.electronAPI.executeCommand('docker', ['logs', containerId], {});
            logsContent.textContent = logs || 'No logs available';
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Getting logs for container ${containerId}`);
            logsContent.textContent = getSimulatedContainerLogs(containerId);
        }
    } catch (error) {
        console.error('Error getting container logs:', error);
        logsContent.textContent = `Error loading logs: ${error.message}`;
    }
}

/**
 * Get simulated container logs for development/testing
 * @param {string} containerId - Container ID
 * @returns {string} Simulated logs
 */
function getSimulatedContainerLogs(containerId) {
    // Try to find container in simulated list
    const containers = getSimulatedContainers();
    const container = containers.find(c => c.id === containerId);
    
    if (!container) {
        return 'Container not found';
    }
    
    if (!container.isRunning) {
        return 'Container is not running. No logs available.';
    }
    
    // Generate some fake logs
    return `
[2025-04-01T05:45:12.123Z] INFO: MCP Server starting...
[2025-04-01T05:45:12.456Z] INFO: Loading configuration
[2025-04-01T05:45:12.789Z] INFO: Initializing server with template: ${container.name.replace('mcp-', '')}
[2025-04-01T05:45:13.012Z] INFO: Connecting to database
[2025-04-01T05:45:13.345Z] INFO: Database connection established
[2025-04-01T05:45:13.678Z] INFO: Loading plugins
[2025-04-01T05:45:14.012Z] INFO: Loaded 3 plugins
[2025-04-01T05:45:14.345Z] INFO: Starting HTTP server
[2025-04-01T05:45:14.678Z] INFO: Server listening on port ${container.ports[0]?.split(':')[0] || '3000'}
[2025-04-01T05:45:15.012Z] INFO: MCP Server started successfully
[2025-04-01T05:45:15.345Z] INFO: Ready to accept connections
`.trim();
}

/**
 * Download server logs as a text file
 */
function downloadServerLogs() {
    const logsContent = document.getElementById('logsContent').textContent;
    const selectedItem = document.querySelector('.server-list-item.selected');
    
    if (!selectedItem) {
        return;
    }
    
    const serverName = selectedItem.querySelector('.server-list-item-name').textContent;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `${serverName}-logs-${timestamp}.txt`;
    
    // Create a download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logsContent));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    
    // Add to document, click, and remove
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Confirm and delete a Docker container
 * @param {string} containerId - Container ID
 */
async function confirmDeleteServer(containerId) {
    try {
        // Get container details
        const container = await getContainerDetails(containerId);
        
        // Reset form
        document.getElementById('confirmServerName').value = '';
        document.getElementById('createBackupBeforeDelete').checked = false;
        document.getElementById('nameMatchError').style.display = 'none';
        document.getElementById('confirmDeleteBtn').disabled = true;
        
        // Store server ID and name for later use
        window.currentDeletionServerId = containerId;
        window.currentDeletionServerName = container.name;
        
        // Show modal
        document.getElementById('deleteServerModal').style.display = 'flex';
        
        // Add event listener for server name confirmation
        const confirmServerNameInput = document.getElementById('confirmServerName');
        confirmServerNameInput.addEventListener('input', validateServerNameMatch);
    } catch (error) {
        console.error('Error preparing server deletion:', error);
        showNotification(`Failed to prepare server deletion: ${error.message}`, 'error');
    }
}

/**
 * Validate server name match for deletion confirmation
 */
function validateServerNameMatch() {
    const confirmServerNameInput = document.getElementById('confirmServerName');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const nameMatchError = document.getElementById('nameMatchError');
    
    if (confirmServerNameInput.value === window.currentDeletionServerName) {
        // Names match, enable delete button
        confirmDeleteBtn.disabled = false;
        nameMatchError.style.display = 'none';
    } else {
        // Names don't match, disable delete button
        confirmDeleteBtn.disabled = true;
        if (confirmServerNameInput.value.length > 0) {
            nameMatchError.style.display = 'block';
        } else {
            nameMatchError.style.display = 'none';
        }
    }
}

/**
 * Hide delete server confirmation modal
 */
function hideDeleteServerModal() {
    document.getElementById('deleteServerModal').style.display = 'none';
    
    // Remove event listener
    const confirmServerNameInput = document.getElementById('confirmServerName');
    confirmServerNameInput.removeEventListener('input', validateServerNameMatch);
    
    // Clear stored server ID and name
    window.currentDeletionServerId = null;
    window.currentDeletionServerName = null;
}

/**
 * Delete a server/container
 * @param {string} serverId - Server/container ID
 * @returns {Promise<void>} Promise that resolves when the server is deleted
 */
async function deleteServer(serverId) {
    try {
        // Get container details
        const container = await getContainerDetails(serverId);
        
        // Perform deletion steps
        await stopContainerIfRunning(container);
        await removeContainer(serverId);
        removeContainerFromLocalStorage(serverId);
        await cleanupVolumes(container);
        await removeConfigFiles(container);
        updateUIAfterDeletion(serverId, container);
        
        // Show success notification
        showNotification(`Server "${container.name}" has been deleted`, 'success');
        
        // Refresh the server list
        await refreshServerList();
    } catch (error) {
        console.error('Error deleting server:', error);
        showNotification(`Failed to delete server: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Stop container if it's running
 * @param {Object} container - Container details
 * @returns {Promise<void>}
 */
async function stopContainerIfRunning(container) {
    if (container.isRunning) {
        await stopContainer(container.id);
    }
}

/**
 * Remove Docker container
 * @param {string} serverId - Server/container ID
 * @returns {Promise<void>}
 */
async function removeContainer(serverId) {
    await window.electronAPI.runCommand(`docker rm ${serverId}`);
}

/**
 * Remove container from local storage
 * @param {string} serverId - Server/container ID
 */
function removeContainerFromLocalStorage(serverId) {
    const installedServers = JSON.parse(localStorage.getItem('installedServers') || '[]');
    const updatedServers = installedServers.filter(server => server.id !== serverId);
    localStorage.setItem('installedServers', JSON.stringify(updatedServers));
}

/**
 * Clean up volumes associated with the container
 * @param {Object} container - Container details
 * @returns {Promise<void>}
 */
async function cleanupVolumes(container) {
    if (!container.volumes || container.volumes.length === 0) {
        return;
    }
    
    for (const volume of container.volumes) {
        await removeVolumeIfNotShared(volume, container.id);
    }
}

/**
 * Remove volume if it's not shared with other containers
 * @param {Object} volume - Volume details
 * @param {string} serverId - Server/container ID
 * @returns {Promise<void>}
 */
async function removeVolumeIfNotShared(volume, serverId) {
    // Check if volume is used by other containers before removing
    const volumeInUse = await isVolumeUsedByOtherContainers(volume.name, serverId);
    if (!volumeInUse) {
        try {
            await window.electronAPI.runCommand(`docker volume rm ${volume.name}`);
            console.log(`Removed volume: ${volume.name}`);
        } catch (error) {
            console.warn(`Could not remove volume ${volume.name}: ${error.message}`);
        }
    }
}

/**
 * Remove server configuration files
 * @param {Object} container - Container details
 * @returns {Promise<void>}
 */
async function removeConfigFiles(container) {
    const serverConfigDir = `${window.appConfig.serversConfigPath}/${container.name}`;
    try {
        await window.electronAPI.deleteDirectory(serverConfigDir);
        console.log(`Removed server configuration directory: ${serverConfigDir}`);
    } catch (error) {
        console.warn(`Could not remove server configuration directory: ${error.message}`);
    }
}

/**
 * Update UI after server deletion
 * @param {string} serverId - Server/container ID
 * @param {Object} container - Container details
 */
function updateUIAfterDeletion(serverId, container) {
    // Remove server from the UI
    const serverListItem = document.querySelector(`.server-list-item[data-id="${serverId}"]`);
    if (serverListItem) {
        serverListItem.remove();
    }
    
    // Hide server details if this was the selected server
    const selectedServerId = document.getElementById('startServerBtn').getAttribute('data-server-id');
    if (selectedServerId === serverId) {
        document.getElementById('serverDetails').style.display = 'none';
        document.getElementById('serverListEmptyState').style.display = 
            document.querySelectorAll('.server-list-item').length === 0 ? 'block' : 'none';
    }
}

/**
 * Check if a volume is used by other containers
 * @param {string} volumeName - Name of the volume
 * @param {string} excludeContainerId - Container ID to exclude from the check
 * @returns {Promise<boolean>} Promise that resolves to true if the volume is used by other containers
 */
async function isVolumeUsedByOtherContainers(volumeName, excludeContainerId) {
    try {
        // Get all containers using this volume
        const result = await window.electronAPI.runCommand(`docker ps -a --filter volume=${volumeName} --format "{{.ID}}"`);
        const containerIds = result.stdout.trim().split('\n').filter(id => id && id !== excludeContainerId);
        return containerIds.length > 0;
    } catch (error) {
        console.error(`Error checking volume usage: ${error.message}`);
        // If we can't determine, assume it's used to prevent accidental deletion
        return true;
    }
}

/**
 * Simulate container state change for development/testing
 * @param {string} containerId - Container ID
 * @param {boolean} isRunning - New running state
 */
function simulateContainerStateChange(containerId, isRunning) {
    // Get stored containers
    const storedContainers = localStorage.getItem('dockerContainers');
    if (!storedContainers) {
        return;
    }
    
    try {
        const containers = JSON.parse(storedContainers);
        
        // Find container by ID in simulated containers
        const simulatedContainers = getSimulatedContainers();
        const simulatedContainer = simulatedContainers.find(c => c.id === containerId);
        
        if (!simulatedContainer) {
            return;
        }
        
        // Update container status in storage
        const containerIndex = containers.findIndex(c => c.name === simulatedContainer.name);
        if (containerIndex >= 0) {
            containers[containerIndex].status = isRunning ? 'running' : 'stopped';
            localStorage.setItem('dockerContainers', JSON.stringify(containers));
        }
    } catch (error) {
        console.error('Error simulating container state change:', error);
    }
}

/**
 * Simulate container deletion for development/testing
 * @param {string} containerId - Container ID
 */
function simulateContainerDeletion(containerId) {
    // Get stored containers
    const storedContainers = localStorage.getItem('dockerContainers');
    if (!storedContainers) {
        return;
    }
    
    try {
        const containers = JSON.parse(storedContainers);
        
        // Find container by ID in simulated containers
        const simulatedContainers = getSimulatedContainers();
        const simulatedContainer = simulatedContainers.find(c => c.id === containerId);
        
        if (!simulatedContainer) {
            return;
        }
        
        // Remove container from storage
        const updatedContainers = containers.filter(c => c.name !== simulatedContainer.name);
        localStorage.setItem('dockerContainers', JSON.stringify(updatedContainers));
    } catch (error) {
        console.error('Error simulating container deletion:', error);
    }
}

// Make functions globally accessible
window.ServerManager = {
    refreshServerList,
    startServer,
    stopServer,
    restartServer,
    selectServer,
    confirmDeleteServer,
    switchServerTab,
    deleteServer
};
