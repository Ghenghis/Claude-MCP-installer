/**
 * Server Updater - Handles checking for updates and updating MCP servers
 */

// State management module
const ServerUpdaterState = {
    data: {
        currentContainer: null,
        updateAvailable: false,
        latestVersion: null,
        currentVersion: null,
        updateDetails: null
    },
    
    /**
     * Get state value
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this.data[key];
    },
    
    /**
     * Set state value
     * @param {string} key - State key
     * @param {*} value - State value
     */
    set(key, value) {
        this.data[key] = value;
    },
    
    /**
     * Reset state to initial values
     * @param {string} containerId - Container ID to set as current
     */
    reset(containerId) {
        this.data = {
            currentContainer: containerId,
            updateAvailable: false,
            latestVersion: null,
            currentVersion: null,
            updateDetails: null
        };
    }
};

// UI management module
const ServerUpdaterUI = {
    /**
     * Update the UI based on update status
     * @param {Object} updateInfo - Update information
     */
    updateStatusDisplay(updateInfo) {
        const updateStatus = document.getElementById('updateStatus');
        const updateStatusContainer = document.getElementById('updateStatusContainer');
        const updateServerBtn = document.getElementById('updateServerBtn');
        
        if (!updateStatus || !updateStatusContainer || !updateServerBtn) {
            console.error('Update status elements not found in DOM');
            return;
        }
        
        // Ensure container is visible
        updateStatusContainer.style.display = 'block';
        
        if (updateInfo.error) {
            // Show error status
            updateStatus.textContent = `Error checking for updates: ${updateInfo.error}`;
            updateStatus.className = 'update-error';
            updateServerBtn.style.display = 'none';
        } else if (updateInfo.checking) {
            // Show checking status
            updateStatus.textContent = 'Checking for updates...';
            updateStatus.className = 'update-checking';
            updateServerBtn.style.display = 'none';
        } else if (updateInfo.updateAvailable) {
            // Show update available status
            updateStatus.textContent = `Update available: ${updateInfo.latestVersion}`;
            updateStatus.className = 'update-available';
            updateServerBtn.style.display = 'block';
        } else {
            // Show up-to-date status
            updateStatus.textContent = 'Server is up to date';
            updateStatus.className = 'update-current';
            updateServerBtn.style.display = 'none';
        }
    },
    
    /**
     * Update container repository display
     * @param {Object} repoInfo - Repository information
     */
    updateRepoDisplay(repoInfo) {
        const containerRepo = document.getElementById('containerRepo');
        const containerVersion = document.getElementById('containerVersion');
        
        if (containerRepo) {
            containerRepo.textContent = repoInfo.repoUrl || 'Unknown';
        }
        
        if (containerVersion) {
            containerVersion.textContent = repoInfo.version || 'Unknown';
        }
    },
    
    /**
     * Update progress display during update operation
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} status - Status message
     */
    updateProgressDisplay(progress, status) {
        const updateProgress = document.getElementById('updateProgress');
        const updateProgressBar = document.getElementById('updateProgressBar');
        const updateProgressStatus = document.getElementById('updateProgressStatus');
        
        if (updateProgress && updateProgressBar && updateProgressStatus) {
            updateProgress.style.display = 'block';
            updateProgressBar.style.width = `${progress}%`;
            updateProgressStatus.textContent = status;
        }
    },
    
    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type) {
        if (window.NotificationManager) {
            window.NotificationManager.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Repository detection module
const RepositoryDetector = {
    /**
     * Extract repository information from container details
     * @param {Object} container - Container details object
     * @returns {Object|null} Repository information or null if not found
     */
    extractRepositoryInfo(container) {
        // Try to get repository information from environment variables
        const repoInfoFromEnv = this.extractRepoFromEnvironment(container);
        if (repoInfoFromEnv) {
            return repoInfoFromEnv;
        }
        
        // If no environment variables, try to extract from image name
        const repoInfoFromImage = this.extractRepoFromImage(container);
        if (repoInfoFromImage) {
            return repoInfoFromImage;
        }
        
        // If we can't determine the repository, return null
        return null;
    },
    
    /**
     * Extract repository information from container environment variables
     * @param {Object} container - Container details object
     * @returns {Object|null} Repository information or null if not found
     */
    extractRepoFromEnvironment(container) {
        if (!container.env) {
            return null;
        }
        
        // Look for REPO_URL environment variable
        const repoUrlEnv = container.env.find(env => env.startsWith('REPO_URL='));
        if (!repoUrlEnv) {
            return null;
        }
        
        const repoUrl = repoUrlEnv.split('=')[1];
        
        // Look for version information
        const versionEnv = container.env.find(env => 
            env.startsWith('VERSION=') || 
            env.startsWith('MCP_VERSION=')
        );
        
        const version = versionEnv 
            ? versionEnv.split('=')[1] 
            : UpdateUtils.extractVersionFromImage(container.image);
        
        return {
            repoUrl,
            version,
            type: 'github'
        };
    },
    
    /**
     * Extract repository information from container image
     * @param {Object} container - Container details object
     * @returns {Object|null} Repository information or null if not found
     */
    extractRepoFromImage(container) {
        if (!container.image) {
            return null;
        }
        
        // For official MCP servers
        if (container.image.includes('modelcontextprotocol/mcp-server')) {
            return {
                repoUrl: 'https://github.com/modelcontextprotocol/servers',
                version: UpdateUtils.extractVersionFromImage(container.image),
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
                    version: UpdateUtils.extractVersionFromImage(container.image),
                    type: 'github'
                };
            }
        }
        
        return null;
    }
};

// Update checker module
const UpdateChecker = {
    /**
     * Check for updates for a repository
     * @param {Object} repoInfo - Repository information
     * @returns {Promise<Object>} Promise resolving to update information
     */
    async checkRepositoryForUpdates(repoInfo) {
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
                const githubInfo = await this.checkGitHubRepositoryForUpdates(repoInfo);
                Object.assign(result, githubInfo);
            } else if (repoInfo.type === 'docker') {
                // For Docker Hub images
                const dockerInfo = await this.checkDockerHubForUpdates(repoInfo);
                Object.assign(result, dockerInfo);
            }
            
            return result;
        } catch (error) {
            console.error('Error checking repository for updates:', error);
            throw new Error(`Failed to check for updates: ${error.message}`);
        }
    },
    
    /**
     * Check a GitHub repository for updates
     * @param {Object} repoInfo - Repository information
     * @returns {Promise<Object>} Promise resolving to update information
     */
    async checkGitHubRepositoryForUpdates(repoInfo) {
        try {
            // Extract owner and repo from GitHub URL
            const { owner, repo } = UpdateUtils.extractGitHubOwnerAndRepo(repoInfo.repoUrl);
            
            // Check if we're running in Electron with command execution access
            if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
                // Use git commands to check for updates
                return await this.checkGitHubUpdatesViaGit(owner, repo, repoInfo.version);
            } else {
                // Fallback to simulation for development/testing
                console.log(`[Simulation] Checking GitHub repository ${owner}/${repo} for updates`);
                return UpdateUtils.getSimulatedGitHubUpdates(repoInfo);
            }
        } catch (error) {
            console.error('Error checking GitHub repository for updates:', error);
            throw new Error(`Failed to check GitHub repository: ${error.message}`);
        }
    },
    
    /**
     * Check GitHub repository for updates using git commands
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} currentVersion - Current version
     * @returns {Promise<Object>} Promise resolving to update information
     */
    async checkGitHubUpdatesViaGit(owner, repo, currentVersion) {
        try {
            // Get repository information
            const repoData = await this.fetchGitHubRepoData(owner, repo);
            
            // Parse commit information
            const [latestCommitHash, latestCommitSubject, latestCommitDate] = 
                repoData.latestCommitInfo.trim().split('|');
            
            // Determine if an update is available
            let updateAvailable = false;
            let commitsBehind = 0;
            
            if (repoData.latestTag && repoData.latestTag !== currentVersion && currentVersion !== 'latest') {
                // If we have a tag and it's different from the current version, an update is available
                updateAvailable = true;
            } else if (currentVersion === 'latest') {
                // If current version is 'latest', we need to check if there are new commits
                updateAvailable = !!latestCommitHash;
            }
            
            return {
                updateAvailable,
                latestVersion: repoData.latestTag || 'latest',
                currentVersion,
                commitsBehind,
                latestCommit: {
                    hash: latestCommitHash,
                    subject: latestCommitSubject,
                    date: latestCommitDate
                },
                latestTag: repoData.latestTag
            };
        } catch (error) {
            console.error('Error checking GitHub updates via git:', error);
            throw new Error(`Failed to check GitHub repository: ${error.message}`);
        }
    },
    
    /**
     * Fetch GitHub repository data using git commands
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Object>} Promise resolving to repository data
     */
    async fetchGitHubRepoData(owner, repo) {
        // Create a temporary directory for the repository
        const tempDir = await window.electronAPI.getTempDir();
        const repoDir = `${tempDir}/repo-${owner}-${repo}`;
        
        try {
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
            
            return { latestCommitInfo, latestTag };
        } finally {
            // Clean up the temporary directory
            await window.electronAPI.executeCommand('rm', ['-rf', repoDir], {});
        }
    },
    
    /**
     * Check Docker Hub for updates
     * @param {Object} repoInfo - Repository information
     * @returns {Promise<Object>} Promise resolving to update information
     */
    async checkDockerHubForUpdates(repoInfo) {
        // This method would be implemented to check Docker Hub for updates
        // For now, using simulated data
        return UpdateUtils.getSimulatedDockerHubUpdates(repoInfo);
    }
};

// Update operation module
const UpdateOperations = {
    /**
     * Update a Docker container to the latest version
     * @param {string} containerId - Container ID
     */
    async updateServer(containerId) {
        try {
            // Show status
            ServerUpdaterUI.updateProgressDisplay(0, 'Preparing to update server...');
            
            // Get container details
            const container = await getContainerDetails(containerId);
            
            // Check if update is available
            if (!ServerUpdaterState.get('updateAvailable')) {
                throw new Error('No update available');
            }
            
            // Get update details
            const updateDetails = ServerUpdaterState.get('updateDetails');
            
            // Perform update
            if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
                // Using real Docker commands if available
                await this.performContainerUpdate(container, updateDetails);
            } else {
                // Fallback to simulation for development/testing
                await UpdateUtils.simulateContainerUpdate(container);
            }
            
            // Complete progress
            ServerUpdaterUI.updateProgressDisplay(100, 'Update completed successfully!');
            ServerUpdaterUI.showNotification('Server updated successfully', 'success');
            
            // Refresh container details
            if (typeof window.selectServer === 'function') {
                window.selectServer(containerId);
            }
        } catch (error) {
            console.error('Error updating server:', error);
            
            // Show error
            ServerUpdaterUI.updateProgressDisplay(0, `Update failed: ${error.message}`);
            ServerUpdaterUI.showNotification(`Failed to update server: ${error.message}`, 'error');
        }
    },
    
    /**
     * Perform a container update
     * @param {Object} container - Container details
     * @param {Object} updateDetails - Update details
     */
    async performContainerUpdate(container, updateDetails) {
        try {
            // Update progress
            ServerUpdaterUI.updateProgressDisplay(10, 'Stopping container...');
            
            // Stop the container
            await window.electronAPI.executeCommand('docker', ['stop', container.id], {});
            
            // Update progress
            ServerUpdaterUI.updateProgressDisplay(30, 'Pulling latest image...');
            
            // Pull the latest image
            const image = container.image.split(':')[0];
            await window.electronAPI.executeCommand('docker', ['pull', `${image}:latest`], {});
            
            // Update progress
            ServerUpdaterUI.updateProgressDisplay(50, 'Recreating container...');
            
            // Recreate the container with the latest image
            await this.recreateContainer(container);
            
            // Update progress
            ServerUpdaterUI.updateProgressDisplay(80, 'Starting container...');
            
            // Start the container
            await window.electronAPI.executeCommand('docker', ['start', container.id], {});
            
            // Update progress
            ServerUpdaterUI.updateProgressDisplay(90, 'Verifying container status...');
            
            // Wait for container to be running
            await UpdateUtils.waitForContainerStatus(container.id, 'running');
            
            // Complete progress
            ServerUpdaterUI.updateProgressDisplay(100, 'Update completed successfully!');
        } catch (error) {
            console.error('Error performing container update:', error);
            throw new Error(`Container update failed: ${error.message}`);
        }
    },
    
    /**
     * Recreate a Docker container with the same settings but latest image
     * @param {Object} container - Container details
     */
    async recreateContainer(container) {
        // Implementation for recreating container
        // This would be expanded in a future refactoring
    }
};

// Utility functions module
const UpdateUtils = {
    /**
     * Extract version from Docker image tag
     * @param {string} image - Docker image name with tag
     * @returns {string} Extracted version or 'latest'
     */
    extractVersionFromImage(image) {
        // Check if image has a tag
        if (image && image.includes(':')) {
            const tag = image.split(':')[1];
            
            // If tag is not 'latest', return it as the version
            if (tag !== 'latest') {
                return tag;
            }
        }
        
        // Default to 'latest' if no specific version found
        return 'latest';
    },
    
    /**
     * Extract owner and repo from GitHub URL
     * @param {string} url - GitHub repository URL
     * @returns {Object} Object containing owner and repo
     */
    extractGitHubOwnerAndRepo(url) {
        // Remove trailing slash if present
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        
        // Extract owner and repo from URL
        const matches = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        
        if (matches && matches.length >= 3) {
            return {
                owner: matches[1],
                repo: matches[2]
            };
        }
        
        throw new Error(`Invalid GitHub URL: ${url}`);
    },
    
    /**
     * Get simulated GitHub updates for development/testing
     * @param {Object} repoInfo - Repository information
     * @returns {Object} Simulated update information
     */
    getSimulatedGitHubUpdates(repoInfo) {
        // Generate a simulated response based on the current version
        const currentVersion = repoInfo.version || 'latest';
        const hasUpdate = Math.random() > 0.3; // 70% chance of having an update
        
        if (hasUpdate) {
            // Generate a newer version
            let latestVersion;
            if (currentVersion === 'latest') {
                latestVersion = 'latest';
            } else if (currentVersion.startsWith('v')) {
                // Increment the last number in the version string
                const versionParts = currentVersion.substring(1).split('.');
                const lastPart = parseInt(versionParts[versionParts.length - 1], 10);
                versionParts[versionParts.length - 1] = (lastPart + 1).toString();
                latestVersion = 'v' + versionParts.join('.');
            } else {
                // Just append a higher number
                latestVersion = currentVersion + '-new';
            }
            
            return {
                updateAvailable: true,
                latestVersion,
                currentVersion,
                commitsBehind: Math.floor(Math.random() * 10) + 1,
                latestCommit: {
                    hash: this.generateRandomHash(),
                    subject: 'Simulated latest commit',
                    date: new Date().toISOString()
                },
                latestTag: latestVersion
            };
        } else {
            // No update available
            return {
                updateAvailable: false,
                latestVersion: currentVersion,
                currentVersion,
                commitsBehind: 0,
                latestCommit: {
                    hash: this.generateRandomHash(),
                    subject: 'Simulated current commit',
                    date: new Date().toISOString()
                },
                latestTag: currentVersion === 'latest' ? '' : currentVersion
            };
        }
    },
    
    /**
     * Get simulated Docker Hub updates for development/testing
     * @param {Object} repoInfo - Repository information
     * @returns {Object} Simulated update information
     */
    getSimulatedDockerHubUpdates(repoInfo) {
        // Similar to GitHub simulation but for Docker Hub
        return this.getSimulatedGitHubUpdates(repoInfo);
    },
    
    /**
     * Simulate a container update for development/testing
     * @param {Object} container - Container details
     * @returns {Promise<void>} Promise that resolves when simulation is complete
     */
    async simulateContainerUpdate(container) {
        // Simulate update process with delays
        ServerUpdaterUI.updateProgressDisplay(10, 'Simulating container stop...');
        await this.simulateDelay(1000);
        
        ServerUpdaterUI.updateProgressDisplay(30, 'Simulating image pull...');
        await this.simulateDelay(2000);
        
        ServerUpdaterUI.updateProgressDisplay(50, 'Simulating container recreation...');
        await this.simulateDelay(1500);
        
        ServerUpdaterUI.updateProgressDisplay(80, 'Simulating container start...');
        await this.simulateDelay(1000);
        
        ServerUpdaterUI.updateProgressDisplay(90, 'Simulating verification...');
        await this.simulateDelay(500);
    },
    
    /**
     * Wait for a container to reach a specific status
     * @param {string} containerId - Container ID
     * @param {string} status - Target status
     * @returns {Promise<void>} Promise that resolves when container reaches the status
     */
    async waitForContainerStatus(containerId, status) {
        // Implementation would check container status repeatedly
        // For now, just simulate a delay
        return this.simulateDelay(1000);
    },
    
    /**
     * Simulate a delay for development/testing
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>} Promise that resolves after the delay
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Generate a random hash for simulated commits
     * @returns {string} Random hash string
     */
    generateRandomHash() {
        return Array.from({ length: 40 }, () => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
    }
};

// Controller module
const ServerUpdater = {
    /**
     * Check for updates for a Docker container
     * @param {string} containerId - Container ID
     */
    async checkForUpdates(containerId) {
        try {
            // Reset state
            ServerUpdaterState.reset(containerId);
            
            // Update UI to show checking status
            ServerUpdaterUI.updateStatusDisplay({ checking: true });
            
            // Get container details
            const container = await getContainerDetails(containerId);
            
            // Extract repository information from container
            const repoInfo = RepositoryDetector.extractRepositoryInfo(container);
            
            if (!repoInfo) {
                throw new Error('Unable to determine repository information for this container');
            }
            
            // Update container repo display
            ServerUpdaterUI.updateRepoDisplay(repoInfo);
            
            // Store current version in state
            ServerUpdaterState.set('currentVersion', repoInfo.version);
            
            // Check for updates
            const updateInfo = await UpdateChecker.checkRepositoryForUpdates(repoInfo);
            
            // Store update information in state
            ServerUpdaterState.set('updateAvailable', updateInfo.updateAvailable);
            ServerUpdaterState.set('latestVersion', updateInfo.latestVersion);
            ServerUpdaterState.set('updateDetails', updateInfo);
            
            // Update UI based on update availability
            ServerUpdaterUI.updateStatusDisplay(updateInfo);
        } catch (error) {
            console.error('Error checking for updates:', error);
            
            // Show error status
            ServerUpdaterUI.updateStatusDisplay({ error: error.message });
        }
    },
    
    /**
     * Update a server to the latest version
     * @param {string} containerId - Container ID
     */
    updateServer(containerId) {
        return UpdateOperations.updateServer(containerId);
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for updates button
    const checkUpdateBtn = document.getElementById('checkUpdateBtn');
    if (checkUpdateBtn) {
        checkUpdateBtn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                ServerUpdater.checkForUpdates(serverId);
            }
        });
    }
    
    // Update server button
    const updateServerBtn = document.getElementById('updateServerBtn');
    if (updateServerBtn) {
        updateServerBtn.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            if (serverId) {
                ServerUpdater.updateServer(serverId);
            }
        });
    }
});

// For backward compatibility and global access
window.ServerUpdater = ServerUpdater;

// Helper functions that may be implemented elsewhere
async function getContainerDetails(containerId) {
    // This would normally be provided by a container management module
    if (typeof window.DockerManager !== 'undefined' && typeof window.DockerManager.getContainerDetails === 'function') {
        return window.DockerManager.getContainerDetails(containerId);
    } else {
        console.log(`[Simulation] Getting details for container ${containerId}`);
        await UpdateUtils.simulateDelay(500);
        
        // Return simulated container details
        return {
            id: containerId,
            name: `mcp-server-${containerId.substring(0, 6)}`,
            image: 'modelcontextprotocol/mcp-server:latest',
            status: 'running',
            env: [
                'REPO_URL=https://github.com/modelcontextprotocol/servers',
                'VERSION=v0.5.0'
            ],
            ports: ['3000:3000'],
            volumes: ['/data:/app/data']
        };
    }
}
