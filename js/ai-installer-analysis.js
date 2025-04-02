/**
 * AI Installer Analysis - Repository analysis functionality
 * Handles analyzing repositories for AI-assisted installation
 */

/**
 * Analyze a repository to determine its structure and dependencies
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 * @returns {Promise<Object>} Promise resolving to repository analysis
 */
async function analyzeRepository(repoUrl, log) {
    try {
        // Initial logging
        log('Cloning repository for analysis...', 'info');
        await simulateDelay(1500);
        
        // Extract repository information
        const repoInfo = extractRepoInfo(repoUrl);
        
        // Log analysis progress
        log(`Analyzing repository structure for ${repoInfo.owner}/${repoInfo.repo}...`, 'info');
        await simulateDelay(2000);
        
        // Get repository details
        const analysis = getRepositoryDetails(repoInfo);
        
        // Add repository URL to analysis
        analysis.repoUrl = repoUrl;
        analysis.owner = repoInfo.owner;
        analysis.repo = repoInfo.repo;
        
        log('Repository analysis completed', 'success');
        return analysis;
    } catch (error) {
        log(`Error analyzing repository: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Extract repository information from URL
 * @param {string} repoUrl - Repository URL
 * @returns {Object} Repository information
 */
function extractRepoInfo(repoUrl) {
    const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, '').split('/');
    return {
        owner: urlParts[0],
        repo: urlParts[1]
    };
}

/**
 * Get repository details based on repository information
 * @param {Object} repoInfo - Repository information
 * @returns {Object} Repository details
 */
function getRepositoryDetails(repoInfo) {
    // Check if this is a known repository
    const repoKey = `${repoInfo.owner}/${repoInfo.repo}`;
    const knownRepo = getKnownRepositoryDetails(repoKey);
    
    if (knownRepo) {
        return knownRepo;
    }
    
    // If not a known repository, return generic analysis
    return getGenericRepositoryDetails();
}

/**
 * Get known repository details
 * @param {string} repoKey - Repository key (owner/repo)
 * @returns {Object|null} Repository details or null if not found
 */
function getKnownRepositoryDetails(repoKey) {
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
    
    return knownRepos[repoKey] || null;
}

/**
 * Get generic repository details
 * @returns {Object} Generic repository details
 */
function getGenericRepositoryDetails() {
    return {
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

/**
 * Simulate a delay for development/testing
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after the delay
 */
function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export functions for use in other modules
window.AiInstallerAnalysis = {
    analyzeRepository,
    extractRepoInfo,
    getRepositoryDetails
};
