/**
 * Installer Config Manager - Configuration management functions
 */

/**
 * Verify the configuration was updated correctly
 */
function verifyConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        
        // In a real implementation, this would read the file and verify it
        // For our simulation, we'll check localStorage
        const configData = localStorage.getItem('claude_config');
        if (configData) {
            try {
                const config = JSON.parse(configData);
                verifyAndFixServerConfig(config, configPath);
            } catch (parseError) {
                InstallerLogger.logMessage(`Configuration verification failed: ${parseError.message}`, 'error');
                InstallerLogger.logMessage('Attempting to fix configuration...', 'info');
                fixJsonConfig(configPath);
            }
        } else {
            InstallerLogger.logMessage('Configuration file not found, creating new configuration', 'warning');
            // This would be a call to create a new config file
        }
    } catch (error) {
        InstallerLogger.logMessage(`Error verifying configuration: ${error.message}`, 'error');
    }
}

/**
 * Verify server configuration and fix if needed
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 */
function verifyAndFixServerConfig(config, configPath) {
    // Check if the newly installed servers are in the config
    const missingServers = checkForMissingServers(config);
    
    if (missingServers.length > 0) {
        InstallerLogger.logMessage('Configuration verification failed: Missing servers', 'warning');
        InstallerLogger.logMessage('Attempting to fix configuration...', 'info');
        
        // Ensure mcpServers object exists
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Add missing servers
        addMissingServersToConfig(config, missingServers);
        
        // Save the updated configuration
        writeClaudeConfig(configPath, config);
        InstallerLogger.logMessage('Configuration fixed successfully', 'success');
    } else {
        InstallerLogger.logMessage('Configuration verification successful', 'success');
    }
}

/**
 * Check for missing servers in the configuration
 * @param {Object} config - Configuration object
 * @returns {Array} Array of missing server names
 */
function checkForMissingServers(config) {
    const requiredServers = ['github', 'redis', 'time'];
    const missingServers = [];
    
    if (!config.mcpServers) {
        return requiredServers;
    }
    
    for (const server of requiredServers) {
        if (!config.mcpServers[server]) {
            missingServers.push(server);
        }
    }
    
    return missingServers;
}

/**
 * Add missing servers to configuration
 * @param {Object} config - Configuration object
 * @param {Array} missingServers - Array of missing server names
 */
function addMissingServersToConfig(config, missingServers) {
    const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
    const npmModulesPath = 'C:\\Users\\Admin\\AppData\\Roaming\\npm\\node_modules';
    
    for (const server of missingServers) {
        config.mcpServers[server] = {
            command: nodePath,
            args: [`${npmModulesPath}\\@modelcontextprotocol\\server-${server}\\dist\\index.js`],
            env: { DEBUG: '*' }
        };
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
        const defaultConfig = createDefaultConfig();
        
        // Add server configurations
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

/**
 * Create a default configuration object
 * @returns {Object} The default configuration object
 */
function createDefaultConfig() {
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
    const serverConfigs = {
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
        }
    };
    
    // Add new servers
    const newServers = [
        'aws-kb-retrieval-server',
        'everart',
        'everything',
        'gdrive',
        'git',
        'github',
        'gitlab',
        'google-maps',
        'postgres',
        'redis',
        'sentry',
        'sequentialthinking',
        'slack',
        'sqlite',
        'time'
    ];
    
    // Add each new server to the configuration
    newServers.forEach(server => {
        serverConfigs[server] = createNodeServerConfig(nodePath, npmModulesPath, `server-${server}`);
    });
    
    return serverConfigs;
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
 * @param {string} configPath - The path to the configuration file
 * @param {object} config - The configuration object to write
 * @returns {boolean} Whether the write was successful
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
 * Create a backup of the Claude Desktop configuration file
 * @param {string} configPath - The path to the configuration file
 * @returns {string|null} The path to the backup file or null if backup failed
 */
function backupClaudeConfig(configPath) {
    try {
        // In a real implementation, this would use Node.js fs.copyFileSync
        // For our simulation, we'll use localStorage
        const configData = localStorage.getItem('claude_config');
        if (!configData) {
            return null;
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const backupPath = `${configPath}.${timestamp}.bak`;
        
        // Store the backup in localStorage
        localStorage.setItem(`claude_config_backup_${timestamp}`, configData);
        
        return backupPath;
    } catch (error) {
        InstallerLogger.logMessage(`Error backing up configuration file: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Get the Claude Desktop configuration path
 * @returns {string} The configuration path
 */
function getClaudeConfigPath() {
    return 'C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
}

/**
 * Backup the JSON configuration file
 */
function backupJsonConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        const backupPath = backupClaudeConfig(configPath);
        
        logBackupResult(backupPath);
    } catch (error) {
        InstallerLogger.logJsonMessage(`Error backing up configuration file: ${error.message}`, 'error');
    }
}

/**
 * Log the result of the backup operation
 * @param {string|null} backupPath - The path to the backup file or null if backup failed
 */
function logBackupResult(backupPath) {
    if (backupPath) {
        InstallerLogger.logJsonMessage(`Configuration file backed up to: ${backupPath}`, 'success');
    } else {
        InstallerLogger.logJsonMessage('Failed to backup configuration file', 'error');
    }
}

/**
 * Fix the JSON configuration file
 */
function fixJsonConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        const success = fixJsonConfig(configPath);
        
        logFixResult(success);
    } catch (error) {
        InstallerLogger.logJsonMessage(`Error fixing configuration file: ${error.message}`, 'error');
    }
}

/**
 * Log the result of the fix operation
 * @param {boolean} success - Whether the fix was successful
 */
function logFixResult(success) {
    if (success) {
        InstallerLogger.logJsonMessage('Configuration file fixed successfully', 'success');
    } else {
        InstallerLogger.logJsonMessage('Failed to fix configuration file', 'error');
    }
}

/**
 * Verify the JSON configuration file
 */
function verifyJsonConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        
        // In a real implementation, this would read the file and verify it
        // For our simulation, we'll check localStorage
        const configData = localStorage.getItem('claude_config');
        if (!configData) {
            InstallerLogger.logJsonMessage('JSON configuration file not found', 'warning');
            return;
        }
        
        verifyConfigData(configData);
    } catch (error) {
        InstallerLogger.logJsonMessage(`Error verifying JSON configuration: ${error.message}`, 'error');
    }
}

/**
 * Verify the configuration data
 * @param {string} configData - The configuration data as a JSON string
 */
function verifyConfigData(configData) {
    try {
        const config = JSON.parse(configData);
        
        // Check if the config has the required properties
        const hasRequiredProperties = verifyRequiredProperties(config);
        if (!hasRequiredProperties) {
            return;
        }
        
        // Check if the config has the required servers
        verifyRequiredServers(config);
    } catch (error) {
        InstallerLogger.logJsonMessage(`Error parsing configuration file: ${error.message}`, 'error');
    }
}

/**
 * Verify that the configuration has all required properties
 * @param {Object} config - The configuration object
 * @returns {boolean} Whether the configuration has the required properties
 */
function verifyRequiredProperties(config) {
    const requiredProperties = ['globalShortcut', 'theme', 'mcpServers'];
    const missingProperties = findMissingProperties(config, requiredProperties);
    
    if (missingProperties.length === 0) {
        logConfigurationValid();
        return true;
    } else {
        logConfigurationInvalid(missingProperties);
        return false;
    }
}

/**
 * Find missing properties in a configuration object
 * @param {Object} config - The configuration object to check
 * @param {Array<string>} requiredProperties - List of required property names
 * @returns {Array<string>} List of missing property names
 */
function findMissingProperties(config, requiredProperties) {
    return requiredProperties.filter(prop => !Boolean(config[prop]));
}

/**
 * Log that the configuration is valid
 */
function logConfigurationValid() {
    InstallerLogger.logJsonMessage('Configuration file is valid', 'success');
}

/**
 * Log that the configuration is invalid with missing properties
 * @param {Array<string>} missingProperties - List of missing property names
 */
function logConfigurationInvalid(missingProperties) {
    const message = `Configuration file is missing required properties: ${missingProperties.join(', ')}`;
    InstallerLogger.logJsonMessage(message, 'error');
}

/**
 * Verify that the configuration has the required servers
 * @param {Object} config - The configuration object
 */
function verifyRequiredServers(config) {
    const requiredServers = ['github', 'redis', 'time'];
    const missingServers = requiredServers.filter(server => !config.mcpServers[server]);
    
    if (missingServers.length > 0) {
        InstallerLogger.logJsonMessage(`Missing servers: ${missingServers.join(', ')}`, 'warning');
    } else {
        InstallerLogger.logJsonMessage('All required servers are configured', 'success');
    }
}

// Export functions for use in other modules
window.InstallerConfigManager = {
    verifyConfiguration,
    verifyAndFixServerConfig,
    checkForMissingServers,
    addMissingServersToConfig,
    fixJsonConfig,
    createDefaultConfig,
    updateConfigWithServers,
    getServerConfigurations,
    createNodeServerConfig,
    writeClaudeConfig,
    backupClaudeConfig,
    getClaudeConfigPath,
    backupJsonConfiguration,
    logBackupResult,
    fixJsonConfiguration,
    logFixResult,
    verifyJsonConfiguration,
    verifyConfigData,
    verifyRequiredProperties,
    verifyRequiredServers
};
