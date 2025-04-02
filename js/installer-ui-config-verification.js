/**
 * Installer UI Config Verification - Configuration verification and repair
 * Handles verifying and fixing Claude Desktop configuration
 */

/**
 * Verify and fix server configuration
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @returns {Object} Updated configuration object
 */
function verifyAndFixServerConfig(config, configPath) {
    // Check if the config has the mcpServers property
    const hasMcpServers = Boolean(config.mcpServers);
    
    // Get the list of required servers
    const requiredServers = getRequiredServers();
    
    // Check which required servers are missing
    const missingServers = [];
    
    if (hasMcpServers) {
        requiredServers.forEach(server => {
            if (!config.mcpServers[server]) {
                missingServers.push(server);
            }
        });
    } else {
        // All servers are missing if mcpServers doesn't exist
        missingServers.push(...requiredServers);
    }
    
    // Check if any required servers are missing
    const hasMissingServers = missingServers.length > 0;
    
    if (hasMissingServers) {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('Configuration verification failed: Missing servers', 'warning');
            window.InstallerUIUtils.logMessage('Attempting to fix configuration...', 'info');
        } else {
            console.warn('Configuration verification failed: Missing servers');
            console.log('Attempting to fix configuration...');
        }
        
        // Create default configuration if needed
        if (!hasMcpServers) {
            config.mcpServers = {};
        }
        
        // Add missing servers
        missingServers.forEach(server => {
            config.mcpServers[server] = createDefaultServerConfig(server);
        });
        
        // Save the updated configuration
        if (window.InstallerUIConfig && window.InstallerUIConfig.saveUpdatedConfig) {
            window.InstallerUIConfig.saveUpdatedConfig(configPath, config);
        } else {
            saveUpdatedConfig(configPath, config);
        }
        
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('Configuration fixed successfully', 'success');
        } else {
            console.log('Configuration fixed successfully');
        }
    } else {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('Configuration verification passed', 'success');
        } else {
            console.log('Configuration verification passed');
        }
    }
    
    return config;
}

/**
 * Get the list of required servers
 * @returns {Array} Array of required server names
 */
function getRequiredServers() {
    return [
        'filesystem',
        'memory',
        'github',
        'redis',
        'time',
        'brave-search'
    ];
}

/**
 * Create default server configuration
 * @param {string} serverName - Server name
 * @returns {Object} Default server configuration
 */
function createDefaultServerConfig(serverName) {
    // Base configuration
    const config = {
        enabled: true
    };
    
    // Assign port based on server name
    switch (serverName) {
        case 'filesystem':
            config.port = 3010;
            break;
        case 'memory':
            config.port = 3011;
            break;
        case 'github':
            config.port = 3012;
            break;
        case 'redis':
            config.port = 3013;
            break;
        case 'time':
            config.port = 3014;
            break;
        case 'brave-search':
            config.port = 3015;
            break;
        default:
            // Generate a port in the 3020-3099 range for other servers
            config.port = 3020 + (serverName.charCodeAt(0) % 80);
    }
    
    return config;
}

/**
 * Save updated configuration
 * @param {string} configPath - Path to configuration file
 * @param {Object} config - Configuration object
 * @returns {boolean} Whether the save was successful
 */
function saveUpdatedConfig(configPath, config) {
    try {
        // In a real implementation, this would write the config to the file
        // For simulation, we'll just log it
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Saving updated configuration to ${configPath}`, 'info');
        } else {
            console.log(`Saving updated configuration to ${configPath}`);
        }
        
        // If running in Electron with file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            // Convert config to JSON string with pretty formatting
            const configJson = JSON.stringify(config, null, 2);
            
            // Write to file
            window.electronAPI.writeFile(configPath, configJson);
            
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Configuration saved to ${configPath}`, 'success');
            } else {
                console.log(`Configuration saved to ${configPath}`);
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
            window.InstallerUIUtils.logMessage(`Error saving configuration: ${error.message}`, 'error');
        } else {
            console.error(`Error saving configuration: ${error.message}`);
        }
        return false;
    }
}

/**
 * Verify the entire configuration
 * @param {string} configPath - Path to configuration file
 * @returns {boolean} Whether the verification was successful
 */
function verifyConfiguration(configPath) {
    try {
        // In a real implementation, this would read the config from the file
        // For simulation, we'll create a sample config
        let config;
        
        // Try to read from file if we have file system access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.readFile) {
            try {
                const configJson = window.electronAPI.readFile(configPath);
                config = JSON.parse(configJson);
            } catch (readError) {
                if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                    window.InstallerUIUtils.logMessage(`Error reading configuration: ${readError.message}`, 'error');
                } else {
                    console.error(`Error reading configuration: ${readError.message}`);
                }
                
                // Create a default config if we can't read the file
                config = createDefaultConfig();
            }
        } else {
            // Try to read from localStorage
            const storedConfig = localStorage.getItem('claude_desktop_config');
            
            if (storedConfig) {
                try {
                    config = JSON.parse(storedConfig);
                } catch (parseError) {
                    config = createDefaultConfig();
                }
            } else {
                config = createDefaultConfig();
            }
        }
        
        // Verify and fix the configuration
        config = verifyAndFixServerConfig(config, configPath);
        
        // Check other configuration aspects
        verifyGeneralConfig(config, configPath);
        
        return true;
    } catch (error) {
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Error verifying configuration: ${error.message}`, 'error');
        } else {
            console.error(`Error verifying configuration: ${error.message}`);
        }
        return false;
    }
}

/**
 * Create default configuration
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
 * Verify general configuration settings
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @returns {Object} Updated configuration object
 */
function verifyGeneralConfig(config, configPath) {
    let modified = false;
    
    // Check for required general settings
    if (!config.globalShortcut) {
        config.globalShortcut = "Ctrl+Space";
        modified = true;
    }
    
    if (!config.theme) {
        config.theme = "dark";
        modified = true;
    }
    
    // Save if modified
    if (modified) {
        if (window.InstallerUIConfig && window.InstallerUIConfig.saveUpdatedConfig) {
            window.InstallerUIConfig.saveUpdatedConfig(configPath, config);
        } else {
            saveUpdatedConfig(configPath, config);
        }
    }
    
    return config;
}

// Export functions for use in other modules
window.InstallerUIConfigVerification = {
    verifyAndFixServerConfig,
    getRequiredServers,
    createDefaultServerConfig,
    saveUpdatedConfig,
    verifyConfiguration,
    createDefaultConfig,
    verifyGeneralConfig
};
