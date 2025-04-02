/**
 * AI Installer Planning - Installation planning functionality
 * Handles creating installation plans for AI-assisted installation
 */

/**
 * Create an installation plan based on repository analysis
 * @param {Object} repoAnalysis - Repository analysis
 * @param {Object} options - Installation options
 * @returns {Object} Installation plan
 */
function createInstallationPlan(repoAnalysis, options) {
    const installPath = options.installPath || determineInstallPath(options);
    
    // Determine the best installation method
    const recommendedMethod = determineInstallationMethod(repoAnalysis, options);
    
    // Create installation steps
    const steps = createInstallationSteps(repoAnalysis, recommendedMethod, installPath);
    
    return {
        recommendedMethod,
        installPath,
        steps,
        repoAnalysis
    };
}

/**
 * Determine the best installation method based on analysis
 * @param {Object} repoAnalysis - Repository analysis
 * @param {Object} options - Installation options
 * @returns {string} Recommended installation method
 */
function determineInstallationMethod(repoAnalysis, options) {
    // Start with a default method
    let recommendedMethod = 'npx';
    
    // Determine method based on repository characteristics
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
    
    return recommendedMethod;
}

/**
 * Create installation steps for the plan
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} recommendedMethod - Recommended installation method
 * @param {string} installPath - Installation path
 * @returns {Array} Array of installation steps
 */
function createInstallationSteps(repoAnalysis, recommendedMethod, installPath) {
    const steps = [];
    
    // Step 1: Clone repository
    steps.push(createCloneStep(repoAnalysis, installPath));
    
    // Add method-specific steps
    if (recommendedMethod === 'docker') {
        steps.push(...createDockerSteps(repoAnalysis, installPath));
    } else {
        steps.push(...createNonDockerSteps(repoAnalysis, recommendedMethod, installPath));
    }
    
    return steps;
}

/**
 * Create repository clone step
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} installPath - Installation path
 * @returns {Object} Clone step
 */
function createCloneStep(repoAnalysis, installPath) {
    return {
        type: 'clone',
        description: `Clone repository from ${repoAnalysis.repoUrl}`,
        command: `git clone ${repoAnalysis.repoUrl} "${installPath}"`,
        cwd: null
    };
}

/**
 * Create Docker installation steps
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} installPath - Installation path
 * @returns {Array} Array of Docker installation steps
 */
function createDockerSteps(repoAnalysis, installPath) {
    const steps = [];
    
    // Build Docker image
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
    
    return steps;
}

/**
 * Create non-Docker installation steps
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} recommendedMethod - Recommended installation method
 * @param {string} installPath - Installation path
 * @returns {Array} Array of non-Docker installation steps
 */
function createNonDockerSteps(repoAnalysis, recommendedMethod, installPath) {
    const steps = [];
    
    // Add dependency installation steps based on language
    if (repoAnalysis.language === 'JavaScript' || repoAnalysis.language === 'TypeScript') {
        steps.push(createNodeDependencySteps(repoAnalysis, installPath));
    } else if (repoAnalysis.language === 'Python') {
        steps.push(createPythonDependencySteps(installPath));
    }
    
    // Add configuration step if needed
    if (repoAnalysis.configFiles && repoAnalysis.configFiles.length > 0) {
        steps.push(createConfigurationStep(repoAnalysis, installPath));
    }
    
    return steps.flat();
}

/**
 * Create Node.js dependency installation steps
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} installPath - Installation path
 * @returns {Array} Array of Node.js dependency installation steps
 */
function createNodeDependencySteps(repoAnalysis, installPath) {
    const steps = [];
    
    // Install dependencies
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
    
    return steps;
}

/**
 * Create Python dependency installation steps
 * @param {string} installPath - Installation path
 * @returns {Object} Python dependency installation step
 */
function createPythonDependencySteps(installPath) {
    return {
        type: 'python',
        description: 'Install Python dependencies',
        command: 'pip install -r requirements.txt',
        cwd: installPath
    };
}

/**
 * Create configuration step
 * @param {Object} repoAnalysis - Repository analysis
 * @param {string} installPath - Installation path
 * @returns {Object} Configuration step
 */
function createConfigurationStep(repoAnalysis, installPath) {
    return {
        type: 'config',
        description: 'Configure server',
        command: null, // This step will be handled specially
        configFiles: repoAnalysis.configFiles,
        cwd: installPath
    };
}

/**
 * Determine installation path
 * @param {Object} options - Installation options
 * @returns {string} Installation path
 */
function determineInstallPath(options) {
    // Use provided path if available
    if (options.installPath) {
        return options.installPath;
    }
    
    // Determine default path based on OS
    const isWin = isWindows();
    const basePath = isWin ? 'C:\\MCP\\Servers' : '/opt/mcp/servers';
    
    // Add repository-specific subfolder if repository info is available
    if (options.repoUrl) {
        const urlParts = options.repoUrl.replace(/^https?:\/\/github\.com\//, '').split('/');
        const repo = urlParts[1];
        return `${basePath}\\${repo}`;
    }
    
    return basePath;
}

/**
 * Check if running on Windows
 * @returns {boolean} True if running on Windows
 */
function isWindows() {
    return window.navigator.userAgent.indexOf('Windows') !== -1;
}

// Export functions for use in other modules
window.AiInstallerPlanning = {
    createInstallationPlan,
    determineInstallationMethod,
    createInstallationSteps,
    determineInstallPath
};
