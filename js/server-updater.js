/**
 * Server Updater - Handles checking for updates and updating MCP servers
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initServerUpdater();
    addServerUpdaterEventListeners();
});

/**
 * Initialize the server updater
 */
function initServerUpdater() {
    // Initialize any required state
    window.serverUpdates = {
        currentContainer: null,
        updateAvailable: false,
        latestVersion: null,
        currentVersion: null,
        updateDetails: null
    };
}

/**
 * Add event listeners for server updater UI elements
 */
function addServerUpdaterEventListeners() {
    // Check for updates button
    document.getElementById('checkUpdateBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            checkForUpdates(serverId);
        }
    });
    
    // Update server button
    document.getElementById('updateServerBtn').addEventListener('click', function() {
        const serverId = this.getAttribute('data-server-id');
        if (serverId) {
            updateServer(serverId);
        }
    });
}

/**
 * Check for updates for a Docker container
 * @param {string} containerId - Container ID
 */
async function checkForUpdates(containerId) {
    const updateStatus = document.getElementById('updateStatus');
    const updateStatusContainer = document.getElementById('updateStatusContainer');
    const updateServerBtn = document.getElementById('updateServerBtn');
    
    try {
        // Show checking status
        updateStatusContainer.style.display = 'block';
        updateStatus.textContent = 'Checking for updates...';
        updateStatus.className = 'update-checking';
        updateServerBtn.style.display = 'none';
        
        // Reset update state
        window.serverUpdates = {
            currentContainer: containerId,
            updateAvailable: false,
            latestVersion: null,
            currentVersion: null,
            updateDetails: null
        };
        
        // Get container details
        const container = await getContainerDetails(containerId);
        
        // Extract repository information from container
        const repoInfo = extractRepositoryInfo(container);
        
        if (!repoInfo) {
            throw new Error('Unable to determine repository information for this container');
        }
        
        // Update container repo display
        document.getElementById('containerRepo').textContent = repoInfo.repoUrl;
        document.getElementById('containerVersion').textContent = repoInfo.version || 'Unknown';
        
        // Store current version
        window.serverUpdates.currentVersion = repoInfo.version;
        
        // Check for updates
        const updateInfo = await checkRepositoryForUpdates(repoInfo);
        
        // Update UI based on update availability
        if (updateInfo.updateAvailable) {
            // Update available
            updateStatus.textContent = `Update available: ${updateInfo.latestVersion}`;
            updateStatus.className = 'update-available';
            updateServerBtn.style.display = 'block';
            
            // Store update information
            window.serverUpdates.updateAvailable = true;
            window.serverUpdates.latestVersion = updateInfo.latestVersion;
            window.serverUpdates.updateDetails = updateInfo;
        } else {
            // No update available
            updateStatus.textContent = 'Server is up to date';
            updateStatus.className = 'update-current';
            updateServerBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
        
        // Show error status
        updateStatus.textContent = `Error checking for updates: ${error.message}`;
        updateStatus.className = 'update-error';
        updateServerBtn.style.display = 'none';
    }
}

/**
 * Extract repository information from container details
 * @param {Object} container - Container details object
 * @returns {Object|null} Repository information or null if not found
 */
function extractRepositoryInfo(container) {
    // Try to get repository information from environment variables
    if (container.env) {
        // Look for REPO_URL environment variable
        const repoUrlEnv = container.env.find(env => env.startsWith('REPO_URL='));
        if (repoUrlEnv) {
            const repoUrl = repoUrlEnv.split('=')[1];
            
            // Look for version information
            const versionEnv = container.env.find(env => env.startsWith('VERSION=') || env.startsWith('MCP_VERSION='));
            const version = versionEnv ? versionEnv.split('=')[1] : extractVersionFromImage(container.image);
            
            return {
                repoUrl,
                version,
                type: 'github'
            };
        }
    }
    
    // If no environment variables, try to extract from image name
    if (container.image) {
        // For official MCP servers
        if (container.image.includes('modelcontextprotocol/mcp-server')) {
            return {
                repoUrl: 'https://github.com/modelcontextprotocol/servers',
                version: extractVersionFromImage(container.image),
                type: 'github'
            };
        }
        
        // For other known repositories from the list
        const knownRepos = [
            { image: 'punkpeye/mcp', repo: 'https://github.com/punkpeye/awesome-mcp-servers' },
            { image: 'davidteren/claude-server', repo: 'https://github.com/davidteren/claude-server' },
            { image: 'gongrzhe/json-mcp', repo: 'https://github.com/GongRzhe/JSON-MCP-Server' },
            { image: 'anaisbetts/mcp-installer', repo: 'https://github.com/anaisbetts/mcp-installer' },
            { image: 'cline/mcp-marketplace', repo: 'https://github.com/cline/mcp-marketplace' },
            { image: 'browserbase/mcp-server', repo: 'https://github.com/browserbase/mcp-server-browserbase' }
        ];
        
        for (const knownRepo of knownRepos) {
            if (container.image.includes(knownRepo.image)) {
                return {
                    repoUrl: knownRepo.repo,
                    version: extractVersionFromImage(container.image),
                    type: 'github'
                };
            }
        }
    }
    
    // If we can't determine the repository, return null
    return null;
}

/**
 * Extract version from Docker image tag
 * @param {string} image - Docker image name with tag
 * @returns {string} Extracted version or 'latest'
 */
function extractVersionFromImage(image) {
    // Check if image has a tag
    if (image.includes(':')) {
        const tag = image.split(':')[1];
        
        // If tag is not 'latest', return it as the version
        if (tag !== 'latest') {
            return tag;
        }
    }
    
    // Default to 'latest' if no specific version found
    return 'latest';
}

/**
 * Check a repository for updates
 * @param {Object} repoInfo - Repository information
 * @returns {Promise<Object>} Promise resolving to update information
 */
async function checkRepositoryForUpdates(repoInfo) {
    try {
        // Default result
        const result = {
            updateAvailable: false,
            latestVersion: repoInfo.version,
            currentVersion: repoInfo.version,
            commitsBehind: 0,
            latestCommit: null,
            latestTag: null
        };
        
        // Handle different repository types
        if (repoInfo.type === 'github') {
            // For GitHub repositories
            const githubInfo = await checkGitHubRepositoryForUpdates(repoInfo);
            Object.assign(result, githubInfo);
        } else if (repoInfo.type === 'docker') {
            // For Docker Hub images
            const dockerInfo = await checkDockerHubForUpdates(repoInfo);
            Object.assign(result, dockerInfo);
        }
        
        return result;
    } catch (error) {
        console.error('Error checking repository for updates:', error);
        throw new Error(`Failed to check for updates: ${error.message}`);
    }
}

/**
 * Check a GitHub repository for updates
 * @param {Object} repoInfo - Repository information
 * @returns {Promise<Object>} Promise resolving to update information
 */
async function checkGitHubRepositoryForUpdates(repoInfo) {
    try {
        // Extract owner and repo from GitHub URL
        const { owner, repo } = extractGitHubOwnerAndRepo(repoInfo.repoUrl);
        
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            // Use git commands to check for updates
            return await checkGitHubUpdatesViaGit(owner, repo, repoInfo.version);
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Checking GitHub repository ${owner}/${repo} for updates`);
            return getSimulatedGitHubUpdates(repoInfo);
        }
    } catch (error) {
        console.error('Error checking GitHub repository for updates:', error);
        throw error;
    }
}

/**
 * Extract owner and repo from GitHub URL
 * @param {string} url - GitHub repository URL
 * @returns {Object} Object containing owner and repo
 */
function extractGitHubOwnerAndRepo(url) {
    // Remove protocol and domain
    const path = url.replace(/^https?:\/\/github\.com\//, '');
    
    // Split path into owner and repo
    const [owner, repo] = path.split('/');
    
    // Remove .git extension if present
    const cleanRepo = repo.replace(/\.git$/, '');
    
    return { owner, repo: cleanRepo };
}

/**
 * Check GitHub repository for updates using git commands
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} currentVersion - Current version
 * @returns {Promise<Object>} Promise resolving to update information
 */
async function checkGitHubUpdatesViaGit(owner, repo, currentVersion) {
    try {
        // Create a temporary directory for the repository
        const tempDir = await window.electronAPI.getTempDir();
        const repoDir = `${tempDir}/repo-${owner}-${repo}`;
        
        // Clone the repository (shallow clone to save time)
        await window.electronAPI.executeCommand('git', [
            'clone',
            '--depth=1',
            `https://github.com/${owner}/${repo}.git`,
            repoDir
        ], {});
        
        // Get the latest commit information
        const latestCommitInfo = await window.electronAPI.executeCommand('git', [
            'log',
            '-1',
            '--format=%H|%s|%ci'
        ], { cwd: repoDir });
        
        // Parse commit information
        const [latestCommitHash, latestCommitSubject, latestCommitDate] = latestCommitInfo.trim().split('|');
        
        // Get the latest tag
        let latestTag = '';
        try {
            latestTag = await window.electronAPI.executeCommand('git', [
                'describe',
                '--tags',
                '--abbrev=0'
            ], { cwd: repoDir });
        } catch (error) {
            // No tags found, ignore error
            console.log('No tags found in repository');
        }
        
        // Clean up the temporary directory
        await window.electronAPI.executeCommand('rm', ['-rf', repoDir], {});
        
        // Determine if an update is available
        let updateAvailable = false;
        let commitsBehind = 0;
        
        if (latestTag && latestTag !== currentVersion && currentVersion !== 'latest') {
            // If we have a tag and it's different from the current version, an update is available
            updateAvailable = true;
        } else if (currentVersion === 'latest') {
            // If current version is 'latest', we need to check if there are new commits
            // For simplicity, we'll assume there's an update available if we found a commit
            updateAvailable = !!latestCommitHash;
        }
        
        return {
            updateAvailable,
            latestVersion: latestTag || 'latest',
            currentVersion,
            commitsBehind,
            latestCommit: {
                hash: latestCommitHash,
                subject: latestCommitSubject,
                date: latestCommitDate
            },
            latestTag
        };
    } catch (error) {
        console.error('Error checking GitHub updates via git:', error);
        throw new Error(`Failed to check GitHub repository: ${error.message}`);
    }
}

/**
 * Check Docker Hub for updates
 * @param {Object} repoInfo - Repository information
 * @returns {Promise<Object>} Promise resolving to update information
 */
async function checkDockerHubForUpdates(repoInfo) {
    // For now, we'll just simulate Docker Hub updates
    console.log(`[Simulation] Checking Docker Hub for updates for ${repoInfo.image}`);
    return getSimulatedDockerHubUpdates(repoInfo);
}

/**
 * Get simulated GitHub updates for development/testing
 * @param {Object} repoInfo - Repository information
 * @returns {Object} Simulated update information
 */
function getSimulatedGitHubUpdates(repoInfo) {
    // For simulation, we'll randomly determine if an update is available
    const updateAvailable = Math.random() > 0.5;
    
    // Generate a new version number
    const currentVersion = repoInfo.version || 'latest';
    let latestVersion = currentVersion;
    
    if (updateAvailable) {
        if (currentVersion === 'latest') {
            latestVersion = 'latest';
        } else if (currentVersion.startsWith('v')) {
            // Increment the version number
            const versionNumber = currentVersion.substring(1);
            const parts = versionNumber.split('.');
            parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
            latestVersion = 'v' + parts.join('.');
        } else {
            // Increment the version number
            const parts = currentVersion.split('.');
            parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
            latestVersion = parts.join('.');
        }
    }
    
    return {
        updateAvailable,
        latestVersion,
        currentVersion,
        commitsBehind: updateAvailable ? Math.floor(Math.random() * 10) + 1 : 0,
        latestCommit: {
            hash: '1234567890abcdef1234567890abcdef12345678',
            subject: 'Update dependencies and fix bugs',
            date: new Date().toISOString()
        },
        latestTag: latestVersion
    };
}

/**
 * Get simulated Docker Hub updates for development/testing
 * @param {Object} repoInfo - Repository information
 * @returns {Object} Simulated update information
 */
function getSimulatedDockerHubUpdates(repoInfo) {
    // Similar to GitHub updates, but for Docker Hub
    return getSimulatedGitHubUpdates(repoInfo);
}

/**
 * Update a Docker container to the latest version
 * @param {string} containerId - Container ID
 */
async function updateServer(containerId) {
    const updateStatus = document.getElementById('updateStatus');
    const updateServerBtn = document.getElementById('updateServerBtn');
    
    try {
        // Check if an update is available
        if (!window.serverUpdates.updateAvailable || window.serverUpdates.currentContainer !== containerId) {
            throw new Error('No update available or container mismatch');
        }
        
        // Show updating status
        updateStatus.textContent = 'Updating server...';
        updateStatus.className = 'update-checking';
        updateServerBtn.disabled = true;
        
        // Get container details
        const container = await getContainerDetails(containerId);
        
        // Perform the update
        await performContainerUpdate(container, window.serverUpdates.updateDetails);
        
        // Show success status
        updateStatus.textContent = 'Server updated successfully';
        updateStatus.className = 'update-current';
        updateServerBtn.style.display = 'none';
        
        // Refresh the server list
        if (typeof window.ServerManager !== 'undefined' && window.ServerManager.refreshServerList) {
            window.ServerManager.refreshServerList();
        }
    } catch (error) {
        console.error('Error updating server:', error);
        
        // Show error status
        updateStatus.textContent = `Error updating server: ${error.message}`;
        updateStatus.className = 'update-error';
        updateServerBtn.disabled = false;
    }
}

/**
 * Perform a container update
 * @param {Object} container - Container details
 * @param {Object} updateDetails - Update details
 */
async function performContainerUpdate(container, updateDetails) {
    try {
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            // Stop the container
            await window.electronAPI.executeCommand('docker', ['stop', container.id], {});
            
            // Pull the latest image
            await window.electronAPI.executeCommand('docker', ['pull', container.image.split(':')[0]], {});
            
            // Remove the old container (but keep volumes)
            await window.electronAPI.executeCommand('docker', ['rm', container.id], {});
            
            // Create a new container with the same settings but latest image
            await recreateContainer(container);
            
            // Start the new container
            await window.electronAPI.executeCommand('docker', ['start', container.id], {});
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] Updating container ${container.id}`);
            await simulateContainerUpdate(container);
        }
    } catch (error) {
        console.error('Error performing container update:', error);
        throw new Error(`Failed to update container: ${error.message}`);
    }
}

/**
 * Recreate a Docker container with the same settings but latest image
 * @param {Object} container - Container details
 */
async function recreateContainer(container) {
    try {
        // Get container creation command
        const inspectFormat = '{{.Name}}|{{range $k, $v := .Config.Env}}{{$v}} {{end}}|{{range $k, $v := .HostConfig.PortBindings}}{{$k}}:{{range $v}}{{.HostPort}}{{end}} {{end}}|{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}';
        const inspectResult = await window.electronAPI.executeCommand('docker', [
            'inspect',
            '--format',
            inspectFormat,
            container.id
        ], {});
        
        // Parse inspect result
        const [name, envString, portString, volumeString] = inspectResult.trim().split('|');
        
        // Build docker run command
        let runArgs = ['run', '-d'];
        
        // Add name
        runArgs.push('--name', name.replace(/^\//, ''));
        
        // Add environment variables
        const envVars = envString.trim().split(' ').filter(Boolean);
        for (const env of envVars) {
            runArgs.push('-e', env);
        }
        
        // Add port mappings
        const ports = portString.trim().split(' ').filter(Boolean);
        for (const port of ports) {
            const [containerPort, hostPort] = port.split(':');
            runArgs.push('-p', `${hostPort}:${containerPort}`);
        }
        
        // Add volume mappings
        const volumes = volumeString.trim().split(' ').filter(Boolean);
        for (const volume of volumes) {
            runArgs.push('-v', volume);
        }
        
        // Add image (use the same image name but ensure it's the latest)
        const imageName = container.image.split(':')[0];
        runArgs.push(`${imageName}:latest`);
        
        // Execute docker run command
        await window.electronAPI.executeCommand('docker', runArgs, {});
    } catch (error) {
        console.error('Error recreating container:', error);
        throw new Error(`Failed to recreate container: ${error.message}`);
    }
}

/**
 * Simulate a container update for development/testing
 * @param {Object} container - Container details
 * @returns {Promise<void>} Promise that resolves when simulation is complete
 */
async function simulateContainerUpdate(container) {
    console.log(`[Simulation] Updating container ${container.id}`);
    
    // Get stored containers
    const storedContainers = localStorage.getItem('dockerContainers');
    if (!storedContainers) {
        return;
    }
    
    try {
        const containers = JSON.parse(storedContainers);
        
        // Find container by ID in simulated containers
        const simulatedContainers = getSimulatedContainers();
        const simulatedContainer = simulatedContainers.find(c => c.id === container.id);
        
        if (!simulatedContainer) {
            return;
        }
        
        // Update container version in storage
        const containerIndex = containers.findIndex(c => c.name === simulatedContainer.name);
        if (containerIndex >= 0) {
            // Add version information to the container
            if (!containers[containerIndex].env) {
                containers[containerIndex].env = [];
            }
            
            // Update or add VERSION environment variable
            const versionIndex = containers[containerIndex].env.findIndex(env => env.startsWith('VERSION='));
            if (versionIndex >= 0) {
                containers[containerIndex].env[versionIndex] = `VERSION=${window.serverUpdates.latestVersion}`;
            } else {
                containers[containerIndex].env.push(`VERSION=${window.serverUpdates.latestVersion}`);
            }
            
            localStorage.setItem('dockerContainers', JSON.stringify(containers));
        }
        
        // Simulate async operation
        return new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
        console.error('Error simulating container update:', error);
        throw new Error(`Failed to simulate container update: ${error.message}`);
    }
}

/**
 * Get simulated containers for development/testing
 * @returns {Array} Array of simulated container objects
 */
function getSimulatedContainers() {
    // This should match the implementation in server-manager.js
    // Try to get containers from localStorage
    const storedContainers = localStorage.getItem('dockerContainers');
    if (storedContainers) {
        try {
            const containers = JSON.parse(storedContainers);
            return containers.map(container => ({
                id: generateRandomId(),
                name: container.name,
                image: 'modelcontextprotocol/mcp-server:latest',
                status: container.status === 'running' ? 'Up 2 hours' : 'Exited (0) 1 hour ago',
                ports: ['3000:3000'],
                createdAt: container.created,
                isRunning: container.status === 'running',
                env: container.env || [
                    'REPO_URL=https://github.com/modelcontextprotocol/servers',
                    'TEMPLATE_ID=basic-api',
                    'NODE_ENV=production'
                ]
            }));
        } catch (error) {
            console.error('Error parsing stored containers:', error);
        }
    }
    
    // Return some default simulated containers if none in storage
    return [
        {
            id: 'abc123def456',
            name: 'mcp-basic-api',
            image: 'modelcontextprotocol/mcp-server:latest',
            status: 'Up 2 hours',
            ports: ['3000:3000'],
            createdAt: new Date().toISOString(),
            isRunning: true,
            env: [
                'REPO_URL=https://github.com/modelcontextprotocol/servers',
                'TEMPLATE_ID=basic-api',
                'NODE_ENV=production'
            ]
        },
        {
            id: 'def456abc789',
            name: 'mcp-web-dashboard',
            image: 'modelcontextprotocol/mcp-server:latest',
            status: 'Exited (0) 1 hour ago',
            ports: ['3001:3000'],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            isRunning: false,
            env: [
                'REPO_URL=https://github.com/modelcontextprotocol/servers',
                'TEMPLATE_ID=web-dashboard',
                'NODE_ENV=production'
            ]
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

// Make functions globally accessible
window.ServerUpdater = {
    checkForUpdates,
    updateServer
};
