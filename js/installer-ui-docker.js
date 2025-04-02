/**
 * Installer UI Docker - Docker-specific functionality
 */

/**
 * Check if Docker is installed and running
 * @returns {Promise<boolean>} Promise that resolves to true if Docker is available
 */
async function checkDockerAvailability() {
    return new Promise((resolve) => {
        logMessage('Checking Docker availability...', 'info');
        
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            window.electronAPI.executeCommand('docker', ['version'], {})
                .then(() => {
                    logMessage('Docker is available', 'success');
                    resolve(true);
                })
                .catch(() => {
                    logMessage('Docker is not available', 'warning');
                    resolve(false);
                });
        } else {
            // Simulation mode
            setTimeout(() => {
                const isAvailable = Math.random() < 0.8;
                logMessage(`Docker is ${isAvailable ? 'available' : 'not available'} (simulated)`, 
                    isAvailable ? 'success' : 'warning');
                resolve(isAvailable);
            }, 1000);
        }
    });
}

/**
 * Get Docker container status
 * @param {string} containerName - Container name
 * @returns {Promise<Object>} Promise that resolves to container status
 */
async function getDockerContainerStatus(containerName) {
    return new Promise((resolve, reject) => {
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            window.electronAPI.executeCommand('docker', ['inspect', '--format', '{{.State.Status}}', containerName], {})
                .then(result => {
                    const status = result.trim();
                    resolve({ name: containerName, status });
                })
                .catch(() => {
                    resolve({ name: containerName, status: 'not_found' });
                });
        } else {
            // Simulation
            setTimeout(() => {
                const statuses = ['running', 'exited', 'not_found'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                resolve({ name: containerName, status });
            }, 500);
        }
    });
}

/**
 * Build Docker image from repository
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @returns {Promise<Object>} Promise that resolves when image is built
 */
async function buildDockerImage(repoUrl, installPath) {
    // Extract repository name from URL
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const imageName = `mcp-${repoName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    logMessage(`Building Docker image: ${imageName}`, 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            // Clone repository if needed
            await cloneRepositoryIfNeeded(repoUrl, installPath);
            
            // Build Docker image
            const buildResult = await window.electronAPI.executeCommand('docker', 
                ['build', '-t', imageName, '.'], 
                { cwd: `${installPath}/${repoName}` });
                
            logMessage('Docker image built successfully', 'success');
            return { success: true, imageName, output: buildResult };
        } catch (error) {
            logMessage(`Error building Docker image: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                logMessage('Docker image built successfully (simulated)', 'success');
                resolve({ success: true, imageName, output: 'Simulated build output' });
            }, 3000);
        });
    }
}

/**
 * Clone repository if it doesn't exist
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @returns {Promise<void>} Promise that resolves when repository is cloned
 */
async function cloneRepositoryIfNeeded(repoUrl, installPath) {
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const repoPath = `${installPath}/${repoName}`;
    
    // Check if repository already exists
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.pathExists) {
        const exists = await window.electronAPI.pathExists(repoPath);
        if (exists) {
            logMessage(`Repository already exists at ${repoPath}`, 'info');
            return;
        }
    }
    
    // Clone repository
    logMessage(`Cloning repository: ${repoUrl}`, 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        await window.electronAPI.executeCommand('git', ['clone', repoUrl], { cwd: installPath });
        logMessage('Repository cloned successfully', 'success');
    } else {
        // Simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        logMessage('Repository cloned successfully (simulated)', 'success');
    }
}

/**
 * Run Docker container
 * @param {string} imageName - Image name
 * @param {Object} options - Container options
 * @returns {Promise<Object>} Promise that resolves when container is running
 */
async function runDockerContainer(imageName, options = {}) {
    const containerName = options.name || `${imageName}-container`;
    const port = options.port || '3000:3000';
    const env = options.env || [];
    const volume = options.volume || '';
    
    logMessage(`Starting Docker container: ${containerName}`, 'info');
    
    // Build docker run command args
    const args = ['run', '-d', '--name', containerName];
    
    // Add port mapping
    args.push('-p', port);
    
    // Add environment variables
    env.forEach(e => {
        args.push('-e', e);
    });
    
    // Add volume if specified
    if (volume) {
        args.push('-v', volume);
    }
    
    // Add restart policy
    args.push('--restart', options.restart || 'unless-stopped');
    
    // Add image name
    args.push(imageName);
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            const result = await window.electronAPI.executeCommand('docker', args, {});
            logMessage(`Container ${containerName} started successfully`, 'success');
            return { success: true, containerId: result.trim(), containerName };
        } catch (error) {
            logMessage(`Error starting container: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                logMessage(`Container ${containerName} started successfully (simulated)`, 'success');
                resolve({ 
                    success: true, 
                    containerId: generateContainerId(),
                    containerName 
                });
            }, 1500);
        });
    }
}

/**
 * Stop Docker container
 * @param {string} containerName - Container name
 * @returns {Promise<Object>} Promise that resolves when container is stopped
 */
async function stopDockerContainer(containerName) {
    logMessage(`Stopping Docker container: ${containerName}`, 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            await window.electronAPI.executeCommand('docker', ['stop', containerName], {});
            logMessage(`Container ${containerName} stopped successfully`, 'success');
            return { success: true };
        } catch (error) {
            logMessage(`Error stopping container: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                logMessage(`Container ${containerName} stopped successfully (simulated)`, 'success');
                resolve({ success: true });
            }, 1000);
        });
    }
}

/**
 * Remove Docker container
 * @param {string} containerName - Container name
 * @returns {Promise<Object>} Promise that resolves when container is removed
 */
async function removeDockerContainer(containerName) {
    logMessage(`Removing Docker container: ${containerName}`, 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            await window.electronAPI.executeCommand('docker', ['rm', containerName], {});
            logMessage(`Container ${containerName} removed successfully`, 'success');
            return { success: true };
        } catch (error) {
            logMessage(`Error removing container: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                logMessage(`Container ${containerName} removed successfully (simulated)`, 'success');
                resolve({ success: true });
            }, 1000);
        });
    }
}

/**
 * Get Docker container logs
 * @param {string} containerName - Container name
 * @param {number} lines - Number of lines to retrieve
 * @returns {Promise<string>} Promise that resolves to container logs
 */
async function getDockerContainerLogs(containerName, lines = 100) {
    logMessage(`Getting logs for container: ${containerName}`, 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            const logs = await window.electronAPI.executeCommand(
                'docker', ['logs', '--tail', lines.toString(), containerName], {});
            return logs;
        } catch (error) {
            logMessage(`Error getting container logs: ${error.message}`, 'error');
            return `Error: ${error.message}`;
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`Simulated logs for container ${containerName}\n` +
                    `[INFO] Server started\n` +
                    `[INFO] Listening on port 3000\n` +
                    `[INFO] Connected to database\n` +
                    `[INFO] Ready to process requests`);
            }, 500);
        });
    }
}

/**
 * List all Docker containers
 * @param {boolean} all - Whether to include stopped containers
 * @returns {Promise<Array>} Promise that resolves to array of containers
 */
async function listDockerContainers(all = true) {
    logMessage('Listing Docker containers', 'info');
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        try {
            const args = ['ps', '--format', '{{.Names}},{{.Status}},{{.Image}},{{.Ports}}'];
            if (all) {
                args.push('-a');
            }
            
            const result = await window.electronAPI.executeCommand('docker', args, {});
            const lines = result.trim().split('\n');
            
            return lines.map(line => {
                const [name, status, image, ports] = line.split(',');
                return { name, status, image, ports };
            });
        } catch (error) {
            logMessage(`Error listing containers: ${error.message}`, 'error');
            return [];
        }
    } else {
        // Simulation
        return new Promise(resolve => {
            setTimeout(() => {
                const containers = [];
                const statuses = ['Up 2 hours', 'Exited (0) 3 hours ago', 'Up 30 minutes'];
                
                // Generate 3-5 simulated containers
                const count = Math.floor(Math.random() * 3) + 3;
                
                for (let i = 0; i < count; i++) {
                    containers.push({
                        name: `mcp-server-${i + 1}`,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        image: `mcp-server-${i + 1}:latest`,
                        ports: '0.0.0.0:3000->3000/tcp'
                    });
                }
                
                resolve(containers);
            }, 1000);
        });
    }
}

/**
 * Generate a random container ID for simulation
 * @returns {string} Random container ID
 */
function generateContainerId() {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * Helper function to log messages
 * @param {string} message - Message to log
 * @param {string} type - Message type
 */
function logMessage(message, type = 'info') {
    if (typeof window.InstallerUIUtils !== 'undefined' && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Get Docker configuration options from the UI
 * @returns {Object} Docker configuration options
 */
function getDockerConfigOptions() {
    const portMapping = document.getElementById('dockerPort')?.value || '3000:3000';
    const networkMode = document.getElementById('dockerNetworkMode')?.checked || false;
    
    // Parse environment variables
    const envVarsTextarea = document.getElementById('dockerEnvVars');
    const envVars = envVarsTextarea && envVarsTextarea.value ? 
        envVarsTextarea.value.split('\n').filter(line => line.trim() !== '') : [];
    
    // Parse additional volumes
    const volumesTextarea = document.getElementById('dockerVolumes');
    const additionalVolumes = volumesTextarea && volumesTextarea.value ? 
        volumesTextarea.value.split('\n').filter(line => line.trim() !== '') : [];
    
    return {
        portMapping,
        networkMode,
        envVars,
        additionalVolumes
    };
}

/**
 * Build Docker command with custom configuration options
 * @param {string} repoUrl - The repository URL
 * @param {string} templateId - The template ID
 * @param {string} installPath - The installation path
 * @returns {string} The Docker command
 */
function buildDockerCommand(repoUrl, templateId, installPath) {
    // Get Docker configuration options
    const dockerOptions = getDockerConfigOptions();
    
    // Start building the Docker command
    let command = `docker run -d --name mcp-${templateId}`;
    
    // Add network mode if host mode is selected
    if (dockerOptions.networkMode) {
        command += ' --network host';
    } else {
        // Add port mapping if not using host network mode
        command += ` -p ${dockerOptions.portMapping}`;
    }
    
    // Add data volume mapping
    command += ` -v "${installPath}:/app/data"`;
    
    // Add additional volume mappings
    if (dockerOptions.additionalVolumes && dockerOptions.additionalVolumes.length > 0) {
        dockerOptions.additionalVolumes.forEach(volume => {
            command += ` -v "${volume}"`;
        });
    }
    
    // Add required environment variables
    command += ` -e "REPO_URL=${repoUrl}" -e "TEMPLATE_ID=${templateId}"`;
    
    // Add custom environment variables
    if (dockerOptions.envVars && dockerOptions.envVars.length > 0) {
        dockerOptions.envVars.forEach(envVar => {
            command += ` -e "${envVar}"`;
        });
    }
    
    // Add the Docker image
    command += ' modelcontextprotocol/mcp-server:latest';
    
    return command;
}

// Export functions for use in other modules
window.InstallerUIDocker = {
    checkDockerAvailability,
    getDockerContainerStatus,
    buildDockerImage,
    cloneRepositoryIfNeeded,
    runDockerContainer,
    stopDockerContainer,
    removeDockerContainer,
    getDockerContainerLogs,
    listDockerContainers,
    getDockerConfigOptions,
    buildDockerCommand
};
