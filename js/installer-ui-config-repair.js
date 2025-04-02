/**
 * Installer UI Config Repair - Configuration file repair and maintenance
 * Handles fixing corrupted JSON configuration files and creating default configurations
 */

/**
 * Fix a corrupted JSON configuration file
 * @param {string} configPath - The path to the configuration file
 * @returns {boolean} Whether the fix was successful
 */
function fixJsonConfig(configPath) {
    try {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Attempting to fix JSON configuration file at ${configPath}`, 'info');
        } else {
            console.log(`Attempting to fix JSON configuration file at ${configPath}`);
        }
        
        // In a real implementation, this would read the file, attempt to parse it,
        // and if that fails, restore from a backup or create a default configuration
        
        // For our simulation, we'll create a default configuration
        const defaultConfig = createDefaultConfig();
        
        // Add server configurations
        addServerConfigurations(defaultConfig);
        
        // Write the fixed configuration to the file
        if (window.InstallerUIConfig && window.InstallerUIConfig.writeClaudeConfig) {
            window.InstallerUIConfig.writeClaudeConfig(configPath, defaultConfig);
        } else {
            writeClaudeConfig(configPath, defaultConfig);
        }
        
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Configuration file fixed successfully`, 'success');
        } else {
            console.log(`Configuration file fixed successfully`);
        }
        
        return true;
    } catch (error) {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Error fixing configuration file: ${error.message}`, 'error');
        } else {
            console.error(`Error fixing configuration file: ${error.message}`);
        }
        return false;
    }
}

/**
 * Create a default configuration object
 * @returns {Object} Default configuration object
 */
function createDefaultConfig() {
    return {
        globalShortcut: "Ctrl+Space",
        theme: "dark",
        mcpServers: {}
    };
}

/**
 * Add server configurations to the config object
 * @param {Object} config - Configuration object to update
 */
function addServerConfigurations(config) {
    // Ensure mcpServers object exists
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    
    // Get executable paths based on OS
    const execPaths = getExecutablePaths();
    
    // Add server configurations
    Object.assign(config.mcpServers, generateServerConfigs(execPaths));
}

/**
 * Get executable paths based on OS
 * @returns {Object} Object containing executable paths
 */
function getExecutablePaths() {
    // Detect OS
    const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
        window.InstallerUIUtils.detectOS() : 
        (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
    
    // Set paths based on OS
    if (os === 'windows') {
        return {
            nodePath: 'C:\\Program Files\\nodejs\\node.exe',
            pythonPath: 'python',
            npmModulesPath: 'C:\\Users\\Admin\\AppData\\Roaming\\npm\\node_modules',
            pathSep: '\\'
        };
    } else if (os === 'macos') {
        return {
            nodePath: '/usr/local/bin/node',
            pythonPath: 'python3',
            npmModulesPath: '/usr/local/lib/node_modules',
            pathSep: '/'
        };
    } else {
        return {
            nodePath: '/usr/bin/node',
            pythonPath: 'python3',
            npmModulesPath: '/usr/lib/node_modules',
            pathSep: '/'
        };
    }
}

/**
 * Generate server configurations based on executable paths
 * @param {Object} execPaths - Object containing executable paths
 * @returns {Object} Server configurations
 */
function generateServerConfigs(execPaths) {
    const { nodePath, npmModulesPath, pathSep } = execPaths;
    
    // Base path for MCP servers
    const basePath = `${npmModulesPath}${pathSep}@modelcontextprotocol${pathSep}`;
    
    // List of MCP servers
    const mcpServers = [
        'filesystem',
        'memory',
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
    
    // Generate configurations
    const configs = {};
    
    // Add filesystem server with special configuration
    configs['filesystem'] = {
        command: nodePath,
        args: [
            `${basePath}server-filesystem${pathSep}dist${pathSep}index.js`,
            ...getDefaultFilesystemPaths()
        ],
        env: { DEBUG: '*' }
    };
    
    // Add other servers
    mcpServers.filter(server => server !== 'filesystem').forEach(server => {
        // Convert server name to package name format (e.g., aws-kb-retrieval-server -> server-aws-kb-retrieval)
        let packageName = server;
        if (server === 'aws-kb-retrieval-server') {
            packageName = 'server-aws-kb-retrieval';
        } else if (!server.startsWith('server-')) {
            packageName = `server-${server}`;
        }
        
        configs[server] = {
            command: nodePath,
            args: [
                `${basePath}${packageName}${pathSep}dist${pathSep}index.js`
            ],
            env: { DEBUG: '*' }
        };
    });
    
    return configs;
}

/**
 * Get default filesystem paths based on OS
 * @returns {Array} Array of default filesystem paths
 */
function getDefaultFilesystemPaths() {
    // Detect OS
    const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
        window.InstallerUIUtils.detectOS() : 
        (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
    
    if (os === 'windows') {
        return [
            'C:\\Users\\Admin\\Downloads',
            'C:\\Users\\Admin\\Documents',
            'C:\\Users\\Admin\\Desktop'
        ];
    } else if (os === 'macos') {
        return [
            '/Users/admin/Downloads',
            '/Users/admin/Documents',
            '/Users/admin/Desktop'
        ];
    } else {
        return [
            '/home/user/Downloads',
            '/home/user/Documents',
            '/home/user/Desktop'
        ];
    }
}

/**
 * Write the Claude Desktop configuration file
 * @param {string} configPath - The path to the configuration file
 * @param {object} config - The configuration object to write
 * @returns {boolean} Whether the write was successful
 */
function writeClaudeConfig(configPath, config) {
    try {
        // In a real implementation, this would write the config to the file
        // For simulation, we'll just log it
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Writing configuration to ${configPath}`, 'info');
        } else {
            console.log(`Writing configuration to ${configPath}`);
        }
        
        // If running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            // Convert config to JSON string with pretty formatting
            const configJson = JSON.stringify(config, null, 2);
            
            // Write to file
            window.electronAPI.writeFile(configPath, configJson);
            
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Configuration written to ${configPath}`, 'success');
            } else {
                console.log(`Configuration written to ${configPath}`);
            }
            
            return true;
        } else {
            // Simulate writing to file
            localStorage.setItem('claude_desktop_config', JSON.stringify(config));
            
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Configuration simulated (localStorage)`, 'info');
            } else {
                console.log(`Configuration simulated (localStorage)`);
            }
            
            return true;
        }
    } catch (error) {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Error writing configuration: ${error.message}`, 'error');
        } else {
            console.error(`Error writing configuration: ${error.message}`);
        }
        return false;
    }
}

// Export functions for use in other modules
window.InstallerUIConfigRepair = {
    fixJsonConfig,
    createDefaultConfig,
    addServerConfigurations,
    getExecutablePaths,
    generateServerConfigs,
    getDefaultFilesystemPaths,
    writeClaudeConfig
};
