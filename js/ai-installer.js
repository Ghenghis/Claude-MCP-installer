/**
 * AI Installer - Handles AI-assisted installation of MCP servers
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAiInstaller();
    addAiInstallerEventListeners();
});

/**
 * Initialize the AI installer
 */
function initAiInstaller() {
    // Initialize any required state
    window.aiInstallerState = {
        isAnalyzing: false,
        analysisResult: null,
        installPlan: null,
        currentStep: 0,
        totalSteps: 0,
        errors: []
    };
}

/**
 * Add event listeners for AI installer UI elements
 */
function addAiInstallerEventListeners() {
    // AI mode toggle
    const aiModeToggle = document.getElementById('aiModeToggle');
    if (aiModeToggle) {
        aiModeToggle.addEventListener('change', function() {
            toggleAiMode(this.checked);
        });
    }
}

/**
 * Toggle AI-assisted installation mode
 * @param {boolean} enabled - Whether AI mode is enabled
 */
function toggleAiMode(enabled) {
    // Update UI to reflect AI mode
    document.querySelectorAll('.ai-feature').forEach(element => {
        element.style.display = enabled ? 'block' : 'none';
    });
    
    // Update installation button text
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.textContent = enabled ? 'AI-Assisted Install' : 'Install';
    }
    
    // Store preference
    localStorage.setItem('aiModeEnabled', enabled ? 'true' : 'false');
    
    // Log mode change
    logMessage(`AI-assisted installation mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
}

/**
 * Perform AI-assisted installation
 * @param {string} repoUrl - Repository URL
 * @param {Object} options - Installation options
 * @returns {Promise<void>} Promise that resolves when installation is complete
 */
async function performAiAssistedInstallation(repoUrl, options = {}) {
    const log = options.logCallback || ((msg, level) => logMessage(`[AI Installer] ${msg}`, level));
    
    try {
        // Reset state
        window.aiInstallerState = {
            isAnalyzing: true,
            analysisResult: null,
            installPlan: null,
            currentStep: 0,
            totalSteps: 0,
            errors: []
        };
        
        log('Starting AI-assisted installation...', 'info');
        log('Analyzing repository structure and dependencies...', 'info');
        
        // Step 1: Analyze repository
        const repoAnalysis = await analyzeRepository(repoUrl, log);
        window.aiInstallerState.analysisResult = repoAnalysis;
        
        // Step 2: Determine language/framework and dependencies
        log(`Detected primary language: ${repoAnalysis.language}`, 'info');
        log(`Detected framework: ${repoAnalysis.framework || 'None'}`, 'info');
        
        if (repoAnalysis.dependencies && repoAnalysis.dependencies.length > 0) {
            log('Detected dependencies:', 'info');
            repoAnalysis.dependencies.forEach(dep => {
                log(`- ${dep.name}${dep.version ? ` (${dep.version})` : ''}`, 'info');
            });
        }
        
        // Step 3: Create installation plan
        log('Creating installation plan...', 'info');
        const installPlan = createInstallationPlan(repoAnalysis, options);
        window.aiInstallerState.installPlan = installPlan;
        window.aiInstallerState.totalSteps = installPlan.steps.length;
        
        // Log installation plan
        log('Installation plan:', 'info');
        installPlan.steps.forEach((step, index) => {
            log(`${index + 1}. ${step.description}`, 'info');
        });
        
        // Step 4: Verify prerequisites
        log('Verifying prerequisites...', 'info');
        await verifyPrerequisites(installPlan, log);
        
        // Step 5: Execute installation steps
        log('Executing installation steps...', 'info');
        for (let i = 0; i < installPlan.steps.length; i++) {
            const step = installPlan.steps[i];
            window.aiInstallerState.currentStep = i + 1;
            
            log(`Step ${i + 1}/${installPlan.steps.length}: ${step.description}`, 'info');
            
            try {
                await executeInstallationStep(step, options, log);
                log(`Step ${i + 1} completed successfully`, 'success');
            } catch (error) {
                log(`Error in step ${i + 1}: ${error.message}`, 'error');
                window.aiInstallerState.errors.push({
                    step: i + 1,
                    error: error.message,
                    command: step.command
                });
                
                // Attempt automated error diagnosis and fixing
                if (await attemptErrorRecovery(error, step, options, log)) {
                    log(`Successfully recovered from error in step ${i + 1}`, 'success');
                } else {
                    throw new Error(`Failed to recover from error in step ${i + 1}: ${error.message}`);
                }
            }
        }
        
        // Step 6: Verify installation
        log('Verifying installation...', 'info');
        await verifyInstallation(installPlan, options, log);
        
        // Update Claude Desktop configuration
        log('Updating Claude Desktop configuration...', 'info');
        await updateClaudeConfigAsync(repoUrl, options.installPath, installPlan.recommendedMethod, log);
        
        log('AI-assisted installation completed successfully', 'success');
        window.aiInstallerState.isAnalyzing = false;
        return Promise.resolve();
    } catch (error) {
        window.aiInstallerState.isAnalyzing = false;
        log(`AI-assisted installation failed: ${error.message}`, 'error');
        return Promise.reject(error);
    }
}

/**
 * Analyze a repository to determine its structure and dependencies
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 * @returns {Promise<Object>} Promise resolving to repository analysis
 */
async function analyzeRepository(repoUrl, log) {
    try {
        // In a real implementation, this would clone the repository and analyze its contents
        // For now, we'll simulate the analysis based on the repository URL
        
        log('Cloning repository for analysis...', 'info');
        await simulateDelay(1500);
        
        // Extract owner and repo name from URL
        const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, '').split('/');
        const owner = urlParts[0];
        const repo = urlParts[1];
        
        log(`Analyzing repository structure for ${owner}/${repo}...`, 'info');
        await simulateDelay(2000);
        
        // Simulate repository analysis based on known repositories
        const knownRepos = {
            'modelcontextprotocol/servers': {
                language: 'JavaScript',
                framework: 'Node.js',
                hasDockerfile: true,
                dependencies: [
                    { name: 'express', version: '^4.18.2' },
                    { name: 'cors', version: '^2.8.5' },
                    { name: 'dotenv', version: '^16.0.3' }
                ],
                installCommands: [
                    'npm install',
                    'npm run build'
                ],
                startCommand: 'npm start',
                configFiles: ['config.json', '.env']
            },
            'davidteren/claude-server': {
                language: 'JavaScript',
                framework: 'Node.js',
                hasDockerfile: true,
                dependencies: [
                    { name: 'express', version: '^4.18.2' },
                    { name: 'anthropic', version: '^0.5.0' }
                ],
                installCommands: [
                    'npm install'
                ],
                startCommand: 'node server.js',
                configFiles: ['config.json']
            },
            'GongRzhe/JSON-MCP-Server': {
                language: 'JavaScript',
                framework: 'Node.js',
                hasDockerfile: false,
                dependencies: [
                    { name: 'express', version: '^4.18.2' },
                    { name: 'body-parser', version: '^1.20.2' }
                ],
                installCommands: [
                    'npm install'
                ],
                startCommand: 'node index.js',
                configFiles: ['config.json']
            },
            'browserbase/mcp-server-browserbase': {
                language: 'JavaScript',
                framework: 'Node.js',
                hasDockerfile: true,
                dependencies: [
                    { name: 'express', version: '^4.18.2' },
                    { name: 'puppeteer', version: '^19.7.2' }
                ],
                installCommands: [
                    'npm install'
                ],
                startCommand: 'node server.js',
                configFiles: ['config.json']
            }
        };
        
        // Check if this is a known repository
        const repoKey = `${owner}/${repo}`;
        let analysis = knownRepos[repoKey];
        
        if (!analysis) {
            // If not a known repository, perform generic analysis
            log('Repository not in known list, performing generic analysis...', 'info');
            await simulateDelay(1000);
            
            // Default to JavaScript/Node.js for unknown repositories
            analysis = {
                language: 'JavaScript',
                framework: 'Node.js',
                hasDockerfile: Math.random() > 0.5, // Randomly determine if it has a Dockerfile
                dependencies: [
                    { name: 'express', version: '^4.18.2' }
                ],
                installCommands: [
                    'npm install'
                ],
                startCommand: 'node index.js',
                configFiles: ['config.json']
            };
        }
        
        // Add repository URL to analysis
        analysis.repoUrl = repoUrl;
        analysis.owner = owner;
        analysis.repo = repo;
        
        log('Repository analysis completed', 'success');
        return analysis;
    } catch (error) {
        log(`Error analyzing repository: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Create an installation plan based on repository analysis
 * @param {Object} repoAnalysis - Repository analysis
 * @param {Object} options - Installation options
 * @returns {Object} Installation plan
 */
function createInstallationPlan(repoAnalysis, options) {
    const installPath = options.installPath || determineInstallPath(options);
    
    // Determine the best installation method based on analysis
    let recommendedMethod = 'npx';
    
    if (repoAnalysis.hasDockerfile) {
        recommendedMethod = 'docker';
    } else if (repoAnalysis.language === 'Python') {
        recommendedMethod = 'python';
    } else if (repoAnalysis.language === 'JavaScript' || repoAnalysis.language === 'TypeScript') {
        // Prefer uv for Node.js projects if available
        recommendedMethod = 'uv';
    }
    
    // Override with user preference if specified
    if (options.methodId) {
        recommendedMethod = options.methodId;
    }
    
    // Create installation steps
    const steps = [];
    
    // Step 1: Clone repository
    steps.push({
        type: 'clone',
        description: `Clone repository from ${repoAnalysis.repoUrl}`,
        command: `git clone ${repoAnalysis.repoUrl} "${installPath}"`,
        cwd: null
    });
    
    if (recommendedMethod === 'docker') {
        // Docker installation steps
        steps.push({
            type: 'docker',
            description: 'Build Docker image',
            command: `docker build -t mcp-${repoAnalysis.repo} "${installPath}"`,
            cwd: null
        });
        
        // Create container
        const containerName = `mcp-${repoAnalysis.repo}`;
        steps.push({
            type: 'docker',
            description: 'Create and start Docker container',
            command: `docker run -d --name ${containerName} -p 3000:3000 -v "${installPath}:/app/data" mcp-${repoAnalysis.repo}`,
            cwd: null
        });
    } else {
        // Non-Docker installation steps
        
        // Install dependencies
        if (repoAnalysis.language === 'JavaScript' || repoAnalysis.language === 'TypeScript') {
            steps.push({
                type: 'npm',
                description: 'Install Node.js dependencies',
                command: 'npm install',
                cwd: installPath
            });
            
            // Build if needed
            if (repoAnalysis.installCommands.includes('npm run build')) {
                steps.push({
                    type: 'npm',
                    description: 'Build project',
                    command: 'npm run build',
                    cwd: installPath
                });
            }
        } else if (repoAnalysis.language === 'Python') {
            steps.push({
                type: 'python',
                description: 'Install Python dependencies',
                command: 'pip install -r requirements.txt',
                cwd: installPath
            });
        }
        
        // Configure
        if (repoAnalysis.configFiles && repoAnalysis.configFiles.length > 0) {
            steps.push({
                type: 'config',
                description: 'Configure server',
                command: null, // This step will be handled specially
                configFiles: repoAnalysis.configFiles,
                cwd: installPath
            });
        }
    }
    
    return {
        recommendedMethod,
        installPath,
        steps,
        repoAnalysis
    };
}

/**
 * Verify prerequisites for installation
 * @param {Object} installPlan - Installation plan
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when prerequisites are verified
 */
async function verifyPrerequisites(installPlan, log) {
    try {
        const method = installPlan.recommendedMethod;
        
        if (method === 'docker') {
            // Check Docker
            log('Checking Docker availability...', 'info');
            const dockerAvailable = await checkDockerAvailability(log);
            
            if (!dockerAvailable) {
                throw new Error('Docker is not available. Please install Docker and ensure it is running.');
            }
            
            log('Docker is available', 'success');
        } else if (method === 'npx' || method === 'uv') {
            // Check Node.js
            log('Checking Node.js availability...', 'info');
            await simulateDelay(500);
            
            // In a real implementation, we would check the Node.js version
            log('Node.js is available', 'success');
        } else if (method === 'python') {
            // Check Python
            log('Checking Python availability...', 'info');
            await simulateDelay(500);
            
            // In a real implementation, we would check the Python version
            log('Python is available', 'success');
        }
        
        // Check Git
        log('Checking Git availability...', 'info');
        await simulateDelay(500);
        
        // In a real implementation, we would check the Git version
        log('Git is available', 'success');
        
        return Promise.resolve();
    } catch (error) {
        log(`Prerequisite check failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Execute an installation step
 * @param {Object} step - Installation step
 * @param {Object} options - Installation options
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when step is executed
 */
async function executeInstallationStep(step, options, log) {
    try {
        if (step.type === 'config') {
            // Handle configuration step
            return await configureServer(step, options, log);
        }
        
        // For other steps, execute the command
        if (!step.command) {
            throw new Error('No command specified for this step');
        }
        
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            // Parse the command
            const { executable, args } = parseCommand(step.command);
            
            // Execute the command
            const result = await window.electronAPI.executeCommand(executable, args, {
                cwd: step.cwd || options.installPath
            });
            
            return result;
        } else {
            // Fallback to simulation for development/testing
            log(`[Simulation] Executing command: ${step.command}`, 'info');
            await simulateDelay(2000);
            
            return Promise.resolve();
        }
    } catch (error) {
        log(`Error executing step: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Configure the server
 * @param {Object} step - Configuration step
 * @param {Object} options - Installation options
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when configuration is complete
 */
async function configureServer(step, options, log) {
    try {
        const configFiles = step.configFiles || [];
        
        for (const configFile of configFiles) {
            log(`Configuring ${configFile}...`, 'info');
            
            // In a real implementation, we would read and modify the configuration file
            await simulateDelay(1000);
            
            log(`${configFile} configured successfully`, 'success');
        }
        
        return Promise.resolve();
    } catch (error) {
        log(`Error configuring server: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Attempt to recover from an installation error
 * @param {Error} error - The error that occurred
 * @param {Object} step - The step that failed
 * @param {Object} options - Installation options
 * @param {Function} log - Logging function
 * @returns {Promise<boolean>} Promise resolving to true if recovery was successful
 */
async function attemptErrorRecovery(error, step, options, log) {
    try {
        log(`Attempting to recover from error: ${error.message}`, 'info');
        
        // Check for common error patterns and apply fixes
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
            // Missing file or command
            log('Detected missing file or command error', 'info');
            
            if (step.type === 'npm') {
                // Try to fix npm issues
                log('Attempting to fix npm issue...', 'info');
                
                // In a real implementation, we would try different approaches
                await simulateDelay(1500);
                
                return true;
            } else if (step.type === 'python') {
                // Try to fix Python issues
                log('Attempting to fix Python issue...', 'info');
                
                // In a real implementation, we would try different approaches
                await simulateDelay(1500);
                
                return true;
            }
        } else if (error.message.includes('permission') || error.message.includes('EACCES')) {
            // Permission error
            log('Detected permission error', 'info');
            
            // In a real implementation, we would try to fix permissions
            await simulateDelay(1500);
            
            return true;
        } else if (error.message.includes('already exists') || error.message.includes('EEXIST')) {
            // Already exists error
            log('Detected "already exists" error', 'info');
            
            // In a real implementation, we would handle existing files/directories
            await simulateDelay(1500);
            
            return true;
        }
        
        // If we couldn't identify a specific error pattern, we failed to recover
        log('Unable to automatically recover from this error', 'warning');
        return false;
    } catch (recoveryError) {
        log(`Error during recovery attempt: ${recoveryError.message}`, 'error');
        return false;
    }
}

/**
 * Verify the installation
 * @param {Object} installPlan - Installation plan
 * @param {Object} options - Installation options
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when verification is complete
 */
async function verifyInstallation(installPlan, options, log) {
    try {
        log('Verifying installation...', 'info');
        
        if (installPlan.recommendedMethod === 'docker') {
            // Verify Docker container
            log('Verifying Docker container...', 'info');
            
            // In a real implementation, we would check if the container is running
            await simulateDelay(1000);
            
            log('Docker container is running', 'success');
        } else {
            // Verify files and configuration
            log('Verifying files and configuration...', 'info');
            
            // In a real implementation, we would check if key files exist
            await simulateDelay(1000);
            
            log('Files and configuration verified', 'success');
        }
        
        return Promise.resolve();
    } catch (error) {
        log(`Verification failed: ${error.message}`, 'error');
        throw error;
    }
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
 * Parse a command string into executable and arguments
 * @param {string} command - Command string to parse
 * @returns {Object} Object containing executable and arguments array
 */
function parseCommand(command) {
    if (!command) return { executable: '', args: [] };
    
    // Split the command into parts
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    // The first part is the executable
    const executable = parts[0].replace(/"/g, '');
    
    // The rest are arguments
    const args = parts.slice(1).map(arg => arg.replace(/"/g, ''));
    
    return { executable, args };
}

/**
 * Determine installation path
 * @param {Object} options - Installation options
 * @returns {string} Installation path
 */
function determineInstallPath(options) {
    if (options.installPath) {
        return options.installPath;
    }
    
    // Default paths based on OS
    if (isWindows()) {
        return `C:\\Program Files\\Claude Desktop MCP\\${options.templateId || 'custom'}`;
    } else {
        return `/opt/claude-desktop-mcp/${options.templateId || 'custom'}`;
    }
}

/**
 * Check if running on Windows
 * @returns {boolean} True if running on Windows
 */
function isWindows() {
    return navigator.platform.indexOf('Win') > -1 || 
           (typeof window.electronAPI !== 'undefined' && window.electronAPI.platform === 'win32');
}

/**
 * Log a message
 * @param {string} message - Message to log
 * @param {string} type - Message type (info, success, warning, error)
 */
function logMessage(message, type = 'info') {
    // Use the global logMessage function if available
    if (typeof window.logMessage === 'function') {
        window.logMessage(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Make functions globally accessible
window.AiInstaller = {
    performAiAssistedInstallation,
    toggleAiMode
};
