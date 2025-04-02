/**
 * Installer UI Command - Command execution and management
 * Handles parsing and executing installation commands
 */

/**
 * Execute installation command asynchronously
 * @param {string} command - Installation command
 * @param {string} installPath - Installation path
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when command completes
 */
async function executeInstallCommand(command, installPath, log) {
    return new Promise((resolve, reject) => {
        try {
            // Use the provided log function or default to console.log
            const logger = log || ((msg, type) => console.log(`[${type}] ${msg}`));
            
            logger(`Executing command: ${command}`, 'info');
            
            // Check if we're running in Electron with command execution access
            if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
                // Parse the command into executable and arguments
                const { executable, args } = parseCommand(command);
                
                // Execute the command
                window.electronAPI.executeCommand(executable, args, { cwd: installPath })
                    .then(result => {
                        logger(`Command executed successfully`, 'success');
                        logger(result, 'info');
                        resolve(result);
                    })
                    .catch(error => {
                        logger(`Error executing command: ${error.message}`, 'error');
                        reject(error);
                    });
            } else {
                // Fallback to simulation for development/testing
                logger('Running in simulation mode', 'info');
                
                // Simulate command execution
                simulateCommandExecution(command, installPath, logger)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        } catch (error) {
            if (log) {
                log(`Error executing command: ${error.message}`, 'error');
            }
            reject(error);
        }
    });
}

/**
 * Parse a command string into executable and arguments
 * @param {string} command - Command string to parse
 * @returns {Object} Object containing executable and arguments array
 */
function parseCommand(command) {
    // Trim the command
    command = command.trim();
    
    // Split the command by spaces, respecting quotes
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        
        if ((char === '"' || char === "'") && (i === 0 || command[i - 1] !== '\\')) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
            } else {
                current += char;
            }
        } else if (char === ' ' && !inQuotes) {
            if (current) {
                parts.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }
    
    if (current) {
        parts.push(current);
    }
    
    // The first part is the executable, the rest are arguments
    const executable = parts[0];
    const args = parts.slice(1);
    
    return { executable, args };
}

/**
 * Simulate command execution for development/testing
 * @param {string} command - Command to simulate
 * @param {string} installPath - Installation path
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when simulation is complete
 */
async function simulateCommandExecution(command, installPath, log) {
    return new Promise((resolve) => {
        // Log the command
        log(`Simulating command: ${command}`, 'info');
        log(`Working directory: ${installPath}`, 'info');
        
        // Simulate a delay
        setTimeout(() => {
            // Generate a simulated output based on the command
            let output = '';
            
            if (command.includes('git clone')) {
                output = simulateGitClone(command);
            } else if (command.includes('npm install') || command.includes('npx')) {
                output = simulateNpmInstall(command);
            } else if (command.includes('python') || command.includes('pip')) {
                output = simulatePythonCommand(command);
            } else if (command.includes('docker')) {
                output = simulateDockerCommand(command);
            } else {
                output = `Simulated output for: ${command}`;
            }
            
            // Log the output
            log(output, 'info');
            
            // Resolve with the output
            resolve(output);
        }, 1500);
    });
}

/**
 * Simulate Git clone command
 * @param {string} command - Git command to simulate
 * @returns {string} Simulated output
 */
function simulateGitClone(command) {
    const repoUrl = command.match(/git clone\s+([^\s]+)/)?.[1] || 'unknown-repo';
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    
    return `Cloning into '${repoName}'...
remote: Enumerating objects: 125, done.
remote: Counting objects: 100% (125/125), done.
remote: Compressing objects: 100% (80/80), done.
remote: Total 125 (delta 40), reused 125 (delta 40), pack-reused 0
Receiving objects: 100% (125/125), 56.78 KiB | 1.42 MiB/s, done.
Resolving deltas: 100% (40/40), done.`;
}

/**
 * Simulate npm install command
 * @param {string} command - npm command to simulate
 * @returns {string} Simulated output
 */
function simulateNpmInstall(command) {
    return `added 256 packages in 4.2s
found 0 vulnerabilities`;
}

/**
 * Simulate Python command
 * @param {string} command - Python command to simulate
 * @returns {string} Simulated output
 */
function simulatePythonCommand(command) {
    if (command.includes('pip install')) {
        return `Collecting package metadata (current_repodata.json): done
Solving environment: done
Preparing transaction: done
Verifying transaction: done
Executing transaction: done
Installing pip dependencies: done`;
    } else {
        return `Python 3.9.7 (default, Sep 16 2021, 13:09:58) 
[GCC 7.5.0] :: Anaconda, Inc. on linux
Type "help", "copyright", "credits" or "license" for more information.`;
    }
}

/**
 * Simulate Docker command
 * @param {string} command - Docker command to simulate
 * @returns {string} Simulated output
 */
function simulateDockerCommand(command) {
    if (command.includes('docker run')) {
        const containerName = command.match(/--name\s+([^\s]+)/)?.[1] || 'mcp-server';
        return `${containerName} started successfully
Server listening on port 3000`;
    } else if (command.includes('docker build')) {
        return `Step 1/10 : FROM node:16-alpine
 ---> 1234567890ab
Step 2/10 : WORKDIR /app
 ---> Using cache
 ---> abcdef123456
Step 3/10 : COPY package*.json ./
 ---> Using cache
 ---> 123abc456def
Step 4/10 : RUN npm install
 ---> Using cache
 ---> def456abc123
Step 5/10 : COPY . .
 ---> Using cache
 ---> 456def123abc
Step 6/10 : EXPOSE 3000
 ---> Using cache
 ---> abc123def456
Step 7/10 : CMD ["node", "index.js"]
 ---> Using cache
 ---> 789ghi101112
Successfully built 789ghi101112
Successfully tagged mcp-server:latest`;
    } else {
        return `Docker command executed successfully`;
    }
}

/**
 * Check if Docker is installed and running
 * @param {Function} log - Logging function
 * @returns {Promise<boolean>} Promise that resolves to true if Docker is available
 */
async function checkDockerAvailability(log) {
    return new Promise((resolve) => {
        const logger = log || ((msg, type) => console.log(`[${type}] ${msg}`));
        
        logger('Checking Docker availability...', 'info');
        
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            // Execute the Docker version command
            window.electronAPI.executeCommand('docker', ['version'], {})
                .then(() => {
                    logger('Docker is available', 'success');
                    resolve(true);
                })
                .catch(() => {
                    logger('Docker is not available', 'warning');
                    resolve(false);
                });
        } else {
            // Fallback to simulation for development/testing
            logger('Running in simulation mode', 'info');
            
            // Simulate Docker availability check
            setTimeout(() => {
                const isAvailable = simulateDockerCheck();
                logger(`Docker is ${isAvailable ? 'available' : 'not available'} (simulated)`, isAvailable ? 'success' : 'warning');
                resolve(isAvailable);
            }, 1000);
        }
    });
}

/**
 * Simulate Docker availability check for development/testing
 * @returns {boolean} Simulated Docker availability
 */
function simulateDockerCheck() {
    // Simulate Docker availability (80% chance of being available)
    return Math.random() < 0.8;
}

/**
 * Execute Docker installation command with proper container management
 * @param {string} command - Docker command to execute
 * @param {string} installPath - Installation path for volume mounting
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when command completes
 */
async function executeDockerCommand(command, installPath, log) {
    return new Promise((resolve, reject) => {
        try {
            // Use the provided log function or default to console.log
            const logger = log || ((msg, type) => console.log(`[${type}] ${msg}`));
            
            // Check Docker availability first
            checkDockerAvailability(logger)
                .then(isAvailable => {
                    if (!isAvailable) {
                        const error = new Error('Docker is not available. Please install Docker and ensure it is running.');
                        logger(error.message, 'error');
                        reject(error);
                        return;
                    }
                    
                    // Extract container name from command
                    const containerNameMatch = command.match(/--name\s+([^\s]+)/);
                    const containerName = containerNameMatch ? containerNameMatch[1] : 'mcp-server';
                    
                    logger(`Executing Docker command for container: ${containerName}`, 'info');
                    
                    // Check if we're running in Electron with command execution access
                    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
                        // Parse the command into executable and arguments
                        const { executable, args } = parseCommand(command);
                        
                        // Execute the command
                        window.electronAPI.executeCommand(executable, args, { cwd: installPath })
                            .then(result => {
                                logger(`Docker command executed successfully`, 'success');
                                logger(result, 'info');
                                resolve(result);
                            })
                            .catch(error => {
                                logger(`Error executing Docker command: ${error.message}`, 'error');
                                reject(error);
                            });
                    } else {
                        // Fallback to simulation for development/testing
                        logger('Running in simulation mode', 'info');
                        
                        // Simulate Docker command execution
                        simulateDockerExecution(command, containerName)
                            .then(result => {
                                resolve(result);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    }
                })
                .catch(error => {
                    logger(`Error checking Docker availability: ${error.message}`, 'error');
                    reject(error);
                });
        } catch (error) {
            if (log) {
                log(`Error executing Docker command: ${error.message}`, 'error');
            }
            reject(error);
        }
    });
}

/**
 * Simulate Docker command execution for development/testing
 * @param {string} command - Docker command to simulate
 * @param {string} containerName - Container name
 * @returns {Promise<void>} Promise that resolves when simulation is complete
 */
async function simulateDockerExecution(command, containerName) {
    return new Promise((resolve) => {
        // Simulate a delay
        setTimeout(() => {
            // Generate a simulated output based on the command
            let output = '';
            
            if (command.includes('docker run')) {
                output = `${containerName} started successfully
Server listening on port 3000`;
            } else if (command.includes('docker build')) {
                output = `Step 1/10 : FROM node:16-alpine
 ---> 1234567890ab
Step 2/10 : WORKDIR /app
 ---> Using cache
 ---> abcdef123456
Step 3/10 : COPY package*.json ./
 ---> Using cache
 ---> 123abc456def
Step 4/10 : RUN npm install
 ---> Using cache
 ---> def456abc123
Step 5/10 : COPY . .
 ---> Using cache
 ---> 456def123abc
Step 6/10 : EXPOSE 3000
 ---> Using cache
 ---> abc123def456
Step 7/10 : CMD ["node", "index.js"]
 ---> Using cache
 ---> 789ghi101112
Successfully built 789ghi101112
Successfully tagged mcp-server:latest`;
            } else if (command.includes('docker stop')) {
                output = `${containerName} stopped`;
            } else if (command.includes('docker rm')) {
                output = `${containerName} removed`;
            } else {
                output = `Docker command executed successfully`;
            }
            
            // Resolve with the output
            resolve(output);
        }, 2000);
    });
}

/**
 * Get Docker configuration options from the UI
 * @returns {Object} Docker configuration options
 */
function getDockerConfigOptions() {
    // Get values from the UI
    const portMapping = document.getElementById('dockerPort')?.value || '3000:3000';
    const volumeMapping = document.getElementById('dockerVolume')?.value || './data:/app/data';
    const envVars = document.getElementById('dockerEnv')?.value || 'NODE_ENV=production';
    const networkMode = document.getElementById('dockerNetwork')?.value || 'bridge';
    const restartPolicy = document.getElementById('dockerRestart')?.value || 'unless-stopped';
    
    // Parse environment variables
    const envVarsArray = envVars.split(',').map(v => v.trim()).filter(v => v);
    
    // Create Docker options object
    return {
        portMapping,
        volumeMapping,
        envVars: envVarsArray,
        networkMode,
        restartPolicy
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
    // Extract repository name from URL
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    
    // Generate a container name based on the repository name
    const containerName = `mcp-${repoName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Get Docker configuration options
    const options = getDockerConfigOptions();
    
    // Build the Docker command
    let command = `docker run -d`;
    
    // Add port mapping
    if (options.portMapping) {
        command += ` -p ${options.portMapping}`;
    }
    
    // Add volume mapping
    if (options.volumeMapping) {
        command += ` -v ${options.volumeMapping}`;
    }
    
    // Add environment variables
    if (options.envVars && options.envVars.length > 0) {
        options.envVars.forEach(env => {
            command += ` -e ${env}`;
        });
    }
    
    // Add template ID as environment variable if provided
    if (templateId) {
        command += ` -e TEMPLATE_ID=${templateId}`;
    }
    
    // Add network mode
    if (options.networkMode) {
        command += ` --network ${options.networkMode}`;
    }
    
    // Add restart policy
    if (options.restartPolicy) {
        command += ` --restart ${options.restartPolicy}`;
    }
    
    // Add container name
    command += ` --name ${containerName}`;
    
    // Add image name (using the repository name)
    command += ` ${repoName}:latest`;
    
    return command;
}

/**
 * Ensure the installation directory exists
 * @param {string} installPath - Installation path
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when directory is created
 */
async function ensureInstallDirectory(installPath, log) {
    return new Promise((resolve, reject) => {
        try {
            // Use the provided log function or default to console.log
            const logger = log || ((msg, type) => console.log(`[${type}] ${msg}`));
            
            logger(`Ensuring installation directory exists: ${installPath}`, 'info');
            
            // Check if we're running in Electron with file system access
            if (typeof window.electronAPI !== 'undefined' && window.electronAPI.ensureDirectory) {
                // Create the directory if it doesn't exist
                window.electronAPI.ensureDirectory(installPath)
                    .then(() => {
                        logger(`Installation directory is ready`, 'success');
                        resolve();
                    })
                    .catch(error => {
                        logger(`Error creating installation directory: ${error.message}`, 'error');
                        reject(error);
                    });
            } else {
                // Fallback to simulation for development/testing
                logger('Running in simulation mode', 'info');
                
                // Simulate directory creation
                simulateDirectoryCreation(installPath);
                
                logger(`Installation directory is ready (simulated)`, 'success');
                resolve();
            }
        } catch (error) {
            if (log) {
                log(`Error ensuring installation directory: ${error.message}`, 'error');
            }
            reject(error);
        }
    });
}

/**
 * Simulate directory creation for development/testing
 * @param {string} path - Directory path to simulate creating
 */
function simulateDirectoryCreation(path) {
    console.log(`Simulating directory creation: ${path}`);
    
    // Store in localStorage for simulation
    const createdDirs = JSON.parse(localStorage.getItem('created_directories') || '[]');
    if (!createdDirs.includes(path)) {
        createdDirs.push(path);
        localStorage.setItem('created_directories', JSON.stringify(createdDirs));
    }
}

/**
 * Check if running on Windows
 * @returns {boolean} True if running on Windows
 */
function isWindows() {
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getPlatform) {
        return window.electronAPI.getPlatform() === 'win32';
    }
    
    return window.navigator.userAgent.indexOf('Windows') !== -1;
}

/**
 * Construct installation command
 * @param {string} methodId - Installation method ID
 * @param {string} gitUrl - Git URL
 * @param {string} installPath - Installation path
 * @returns {string} Installation command
 */
function constructInstallCommand(methodId, gitUrl, installPath) {
    switch (methodId) {
        case 'uv':
            return `uv pip install ${gitUrl}`;
        case 'python':
            return `pip install --target "${installPath}" ${gitUrl}`;
        case 'npx': // Assuming Node.js/npm
            return `npm install ${gitUrl}`;
        case 'docker':
            // Use the Docker module's buildDockerCommand if available
            if (window.InstallerUIDocker && window.InstallerUIDocker.buildDockerCommand) {
                // Extract template ID from git URL
                const templateId = gitUrl.split('/').pop().replace('.git', '');
                return window.InstallerUIDocker.buildDockerCommand(gitUrl, templateId, installPath);
            }
            return `docker run -d --name mcp-server -v "${installPath}:/app/data" -p 3000:3000 -e "REPO_URL=${gitUrl}" modelcontextprotocol/mcp-server:latest`;
        default:
            throw new Error(`Unsupported installation method: ${methodId}`);
    }
}

/**
 * Execute installation command
 * @param {string} command - Installation command
 * @param {string} installPath - Installation path
 * @param {Function} log - Optional logging function
 * @returns {Promise<void>} Promise that resolves when command completes
 */
async function executeInstallCommand(command, installPath, log) {
    // Use the provided log function or default to console.log
    const logger = log || ((msg, type) => console.log(`[${type}] ${msg}`));
    
    // Ensure the runCommandAsync function is available
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
        // Parse the command into executable and arguments
        const { executable, args } = parseCommand(command);
        
        // Execute the command
        try {
            logger(`Executing command: ${command}`, 'info');
            const result = await window.electronAPI.executeCommand(executable, args, { cwd: installPath });
            logger(`Command executed successfully`, 'success');
            logger(result, 'info');
            return result;
        } catch (error) {
            logger(`Error executing command: ${error.message}`, 'error');
            throw error;
        }
    } else {
        // Fallback to simulation for development/testing
        logger('Running in simulation mode', 'info');
        
        // Simulate command execution
        return simulateCommandExecution(command, installPath, logger);
    }
}

/**
 * Handle installation error
 * @param {Error} error - Error object
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 */
function handleInstallError(error, repoUrl, log) {
    const errorMsg = `Installation failed for ${repoUrl}: ${error.message || error}`;
    log(errorMsg, 'error');
    
    // Check if error object has stdout/stderr and log that too
    if (error.stdout) log(`stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`stderr: ${error.stderr}`, 'error');
}

// Export functions for use in other modules
window.InstallerUICommand = {
    executeInstallCommand,
    parseCommand,
    simulateCommandExecution,
    simulateGitClone,
    simulateNpmInstall,
    simulatePythonCommand,
    simulateDockerCommand,
    checkDockerAvailability,
    simulateDockerCheck,
    executeDockerCommand,
    simulateDockerExecution,
    getDockerConfigOptions,
    buildDockerCommand,
    ensureInstallDirectory,
    simulateDirectoryCreation,
    isWindows,
    constructInstallCommand,
    handleInstallError
};
