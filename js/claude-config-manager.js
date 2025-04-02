/**
 * Claude Config Manager - Handles Claude Desktop configuration management
 * Optimized for Windows environments
 */

/**
 * Get the path to the Claude Desktop configuration file
 * @returns {string} The path to the configuration file
 */
function getClaudeConfigPath() {
    // Default path for Windows
    return InstallerUtils.detectOS() === 'windows' 
        ? 'C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json'
        : '/home/user/.config/Claude/claude_desktop_config.json';
}

/**
 * Update the Claude Desktop configuration file with new MCP servers
 * @param {string} repoUrl - The repository URL
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method (npx, uv, python)
 */
function updateClaudeConfig(repoUrl, installPath, methodId) {
    try {
        // Path to Claude Desktop configuration file
        const configPath = getClaudeConfigPath();
        
        // Read the current configuration
        const config = readCurrentConfig();
        
        // Update the configuration with server configs
        updateConfigWithServers(config);
        
        // Save the updated configuration
        saveConfigFile(configPath, config);
        
        // Log server information
        logServerInformation(config);
    } catch (error) {
        InstallerLogger.logMessage(`Error updating Claude Desktop configuration: ${error.message}`, 'error');
    }
}

/**
 * Read the current Claude Desktop configuration
 * @returns {Object} The configuration object
 */
function readCurrentConfig() {
    try {
        const configData = localStorage.getItem('claude_config');
        if (configData) {
            return JSON.parse(configData);
        } else {
            // Default configuration if not found
            return getDefaultConfig();
        }
    } catch (error) {
        InstallerLogger.logMessage(`Error reading configuration: ${error.message}`, 'error');
        // Return a default configuration
        return getDefaultConfig();
    }
}

/**
 * Get default configuration object
 * @returns {Object} Default configuration
 */
function getDefaultConfig() {
    return {
        globalShortcut: "Ctrl+Space",
        theme: "dark",
        mcpServers: {}
    };
}

/**
 * Update the configuration with server configs
 * @param {Object} config - The configuration object
 */
function updateConfigWithServers(config) {
    // Ensure mcpServers object exists
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    
    // Get server configurations
    const serverConfigs = getServerConfigurations();
    
    // Update the configuration with all server configs
    Object.assign(config.mcpServers, serverConfigs);
}

/**
 * Save configuration file
 * @param {string} configPath - Path to configuration file
 * @param {Object} config - Configuration object
 */
function saveConfigFile(configPath, config) {
    try {
        // Write the configuration to the file
        writeClaudeConfig(configPath, config);
        
        // Also store in localStorage for simulation purposes
        localStorage.setItem('claude_config', JSON.stringify(config, null, 2));
        
        // Log success
        InstallerLogger.logMessage('Claude Desktop configuration updated with new MCP servers', 'success');
        
        // Count new servers (excluding the 5 existing ones)
        const totalServers = Object.keys(config.mcpServers).length;
        const newServers = totalServers - 5;
        InstallerLogger.logMessage(`Added ${newServers} new MCP servers to configuration`, 'success');
    } catch (error) {
        InstallerLogger.logMessage(`Error saving configuration: ${error.message}`, 'error');
    }
}

/**
 * Log information about the servers in the configuration
 * @param {Object} config - The configuration object
 */
function logServerInformation(config) {
    // Log new servers
    const existingServers = ['filesystem', 'memory', 'brave-search', 'puppeteer', 'fetch'];
    const newServerNames = Object.keys(config.mcpServers).filter(server => !existingServers.includes(server));
    
    // Log new server names
    if (newServerNames.length > 0) {
        InstallerLogger.logMessage(`New servers available: ${newServerNames.join(', ')}`, 'info');
    }
}

/**
 * Backup the JSON configuration file
 */
function backupJsonConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        const backupPath = InstallerUtils.backupClaudeConfig(configPath);
        
        if (backupPath) {
            InstallerLogger.logMessage(`Configuration backed up to ${backupPath}`, 'success');
        } else {
            InstallerLogger.logMessage('Failed to backup configuration', 'warning');
        }
    } catch (error) {
        InstallerLogger.logMessage(`Error backing up configuration: ${error.message}`, 'error');
    }
}

/**
 * Fix the JSON configuration file
 */
function fixJsonConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        const success = fixJsonConfig(configPath);
        
        if (success) {
            InstallerLogger.logMessage('Configuration file fixed successfully', 'success');
        } else {
            InstallerLogger.logMessage('Failed to fix configuration file', 'error');
        }
    } catch (error) {
        InstallerLogger.logMessage(`Error fixing configuration: ${error.message}`, 'error');
    }
}

/**
 * Verify and fix server configuration
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @returns {boolean} Whether the configuration is valid
 */
function verifyAndFixServerConfig(config, configPath) {
    // Check for missing required servers
    const requiredServers = ['github', 'redis', 'time'];
    const missingServers = findMissingServers(config, requiredServers);
    
    if (missingServers.length > 0) {
        handleMissingServers(config, configPath, missingServers);
        return true;
    } 
    
    InstallerLogger.logMessage('Configuration verification successful', 'success');
    return true;
}

/**
 * Find missing servers in configuration
 * @param {Object} config - Configuration object
 * @param {Array<string>} requiredServers - List of required server names
 * @returns {Array<string>} List of missing server names
 */
function findMissingServers(config, requiredServers) {
    const missingServers = [];
    const hasMcpServers = Boolean(config.mcpServers);
    
    if (!hasMcpServers) {
        return requiredServers;
    }
    
    for (const serverName of requiredServers) {
        if (!config.mcpServers[serverName]) {
            missingServers.push(serverName);
        }
    }
    
    return missingServers;
}

/**
 * Handle missing servers by adding them to config and saving
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @param {Array<string>} missingServers - List of missing server names
 */
function handleMissingServers(config, configPath, missingServers) {
    InstallerLogger.logMessage('Configuration verification failed: Missing servers', 'warning');
    InstallerLogger.logMessage('Attempting to fix configuration...', 'info');
    
    // Create default configuration if needed
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    
    // Add missing servers
    addMissingServers(config, missingServers);
    
    // Save the updated configuration
    saveConfigFile(configPath, config);
}

/**
 * Add missing servers to configuration
 * @param {Object} config - Configuration object
 * @param {Array<string>} missingServers - List of missing server names
 */
function addMissingServers(config, missingServers) {
    const serverDefaults = {
        'github': { enabled: true, port: 3000 },
        'redis': { enabled: true, port: 3001 },
        'time': { enabled: true, port: 3002 }
    };
    
    for (const serverName of missingServers) {
        if (serverDefaults[serverName]) {
            config.mcpServers[serverName] = serverDefaults[serverName];
        }
    }
}

/**
 * Get server configurations
 * @returns {Object} Server configurations
 */
function getServerConfigurations() {
    // Node.js executable path
    const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
    
    // Python executable path
    const pythonPath = 'python';
    
    // Base path for npm modules
    const npmModulesPath = 'C:\\Users\\Admin\\AppData\\Roaming\\npm\\node_modules';
    
    // Define server configurations
    return {
        // Existing servers
        'filesystem': createNodeServerConfig(nodePath, npmModulesPath, 'server-filesystem', [
            'C:\\Users\\Admin\\Downloads',
            'C:\\Users\\Admin\\Documents',
            'C:\\Users\\Admin\\Desktop'
        ]),
        'memory': createNodeServerConfig(nodePath, npmModulesPath, 'server-memory'),
        'brave-search': createNodeServerConfig(nodePath, npmModulesPath, 'server-brave-search'),
        'puppeteer': createNodeServerConfig(nodePath, npmModulesPath, 'server-puppeteer'),
        'fetch': {
            command: pythonPath,
            args: ['-m', 'mcp_server_fetch'],
            env: { DEBUG: '*' }
        },
        
        // New servers
        'github': createNodeServerConfig(nodePath, npmModulesPath, 'server-github'),
        'redis': createNodeServerConfig(nodePath, npmModulesPath, 'server-redis'),
        'time': createNodeServerConfig(nodePath, npmModulesPath, 'server-time'),
        'aws-kb-retrieval-server': createNodeServerConfig(nodePath, npmModulesPath, 'server-aws-kb-retrieval'),
        'everart': createNodeServerConfig(nodePath, npmModulesPath, 'server-everart'),
        'everything': createNodeServerConfig(nodePath, npmModulesPath, 'server-everything'),
        'gdrive': createNodeServerConfig(nodePath, npmModulesPath, 'server-gdrive'),
        'git': createNodeServerConfig(nodePath, npmModulesPath, 'server-git'),
        'gitlab': createNodeServerConfig(nodePath, npmModulesPath, 'server-gitlab'),
        'google-maps': createNodeServerConfig(nodePath, npmModulesPath, 'server-google-maps'),
        'postgres': createNodeServerConfig(nodePath, npmModulesPath, 'server-postgres'),
        'sentry': createNodeServerConfig(nodePath, npmModulesPath, 'server-sentry'),
        'sequentialthinking': createNodeServerConfig(nodePath, npmModulesPath, 'server-sequentialthinking'),
        'slack': createNodeServerConfig(nodePath, npmModulesPath, 'server-slack'),
        'sqlite': createNodeServerConfig(nodePath, npmModulesPath, 'server-sqlite')
    };
}

/**
 * Create a Node.js server configuration
 * @param {string} nodePath - Path to Node.js executable
 * @param {string} npmModulesPath - Path to npm modules
 * @param {string} serverName - Server name
 * @param {Array} [extraArgs=[]] - Extra arguments
 * @returns {Object} Server configuration
 */
function createNodeServerConfig(nodePath, npmModulesPath, serverName, extraArgs = []) {
    const baseArgs = [`${npmModulesPath}\\@modelcontextprotocol\\${serverName}\\dist\\index.js`];
    return {
        command: nodePath,
        args: [...baseArgs, ...extraArgs],
        env: { DEBUG: '*' }
    };
}

/**
 * Write the Claude Desktop configuration file
 * @param {string} configPath - Path to configuration file
 * @param {object} config - The configuration object to write
 */
function writeClaudeConfig(configPath, config) {
    try {
        // In a real implementation, this would use Node.js fs.writeFileSync
        // For our simulation, we'll use localStorage
        localStorage.setItem('claude_config', JSON.stringify(config, null, 2));
        
        return true;
    } catch (error) {
        InstallerLogger.logMessage(`Error writing configuration file: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Fix a corrupted JSON configuration file
 * @param {string} configPath - The path to the configuration file
 * @returns {boolean} Whether the fix was successful
 */
function fixJsonConfig(configPath) {
    try {
        // Create a default configuration
        const defaultConfig = getDefaultConfig();
        
        // Update the configuration with server configs
        updateConfigWithServers(defaultConfig);
        
        // Write the fixed configuration back to the file
        writeClaudeConfig(configPath, defaultConfig);
        
        InstallerLogger.logMessage(`JSON configuration file fixed successfully`, 'success');
        return true;
    } catch (error) {
        InstallerLogger.logMessage(`Error fixing JSON configuration file: ${error.message}`, 'error');
        return false;
    }
}

// Export functions for use in other modules
window.ClaudeConfigManager = {
    updateClaudeConfig,
    backupJsonConfiguration,
    fixJsonConfiguration,
    verifyAndFixServerConfig
};
