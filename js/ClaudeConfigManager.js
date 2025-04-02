/**
 * ClaudeConfigManager.js
 * Handles Claude Desktop configuration management
 * Optimized for Windows environments
 */

import installerUtils from './InstallerUtils.js';
import installerUICore from './InstallerUICore.js';

class ClaudeConfigManager {
    /**
     * Get the path to the Claude Desktop configuration file
     * @returns {string} The path to the configuration file
     */
    getClaudeConfigPath() {
        return installerUtils.getClaudeConfigPath();
    }

    /**
     * Update the Claude Desktop configuration file with new MCP servers
     * @param {string} repoUrl - The repository URL
     * @param {string} installPath - The installation path
     * @param {string} methodId - The installation method (npx, uv, python)
     */
    updateClaudeConfig(repoUrl, installPath, methodId) {
        installerUICore.logMessage('Updating Claude Desktop configuration...', 'info');
        
        try {
            // Get configuration path
            const configPath = this.getClaudeConfigPath();
            
            // Read current configuration
            const config = this.readCurrentConfig(configPath);
            
            // Update configuration with server information
            this.updateConfigWithServers(config, installPath, methodId);
            
            // Save updated configuration
            this.saveConfigFile(configPath, config);
            
            // Log server information
            this.logServerInformation(config);
            
            installerUICore.logMessage('Claude Desktop configuration updated successfully', 'success');
        } catch (error) {
            installerUICore.logMessage(`Error updating Claude Desktop configuration: ${error.message}`, 'error');
        }
    }

    /**
     * Read the current Claude Desktop configuration
     * @param {string} configPath - Path to configuration file
     * @returns {Object} The configuration object
     */
    readCurrentConfig(configPath = null) {
        const path = configPath || this.getClaudeConfigPath();
        
        try {
            // Check if file exists
            if (window.fs.existsSync(path)) {
                const configData = window.fs.readFileSync(path, 'utf8');
                return JSON.parse(configData);
            } else {
                installerUICore.logMessage('Configuration file not found, creating default configuration', 'warning');
                return this.getDefaultConfig();
            }
        } catch (error) {
            installerUICore.logMessage(`Error reading configuration: ${error.message}`, 'error');
            return this.getDefaultConfig();
        }
    }

    /**
     * Get default configuration object
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return {
            mcpServers: {},
            theme: 'light',
            apiKeys: {},
            settings: {
                autoStart: true,
                notifications: true
            }
        };
    }

    /**
     * Update the configuration with server configs
     * @param {Object} config - The configuration object
     * @param {string} installPath - The installation path
     * @param {string} methodId - The installation method
     */
    updateConfigWithServers(config, installPath, methodId) {
        // Ensure mcpServers object exists
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Get server configurations
        const serverConfigs = this.getServerConfigurations(installPath, methodId);
        
        // Update configuration with server configs
        Object.assign(config.mcpServers, serverConfigs);
    }

    /**
     * Save configuration file
     * @param {string} configPath - Path to configuration file
     * @param {Object} config - Configuration object
     */
    saveConfigFile(configPath, config) {
        try {
            // Create directory if it doesn't exist
            const configDir = window.path.dirname(configPath);
            if (!window.fs.existsSync(configDir)) {
                window.fs.mkdirSync(configDir, { recursive: true });
            }
            
            // Write configuration to file
            this.writeClaudeConfig(configPath, config);
            
            installerUICore.logMessage(`Configuration saved to ${configPath}`, 'success');
        } catch (error) {
            installerUICore.logMessage(`Error saving configuration: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Log information about the servers in the configuration
     * @param {Object} config - The configuration object
     */
    logServerInformation(config) {
        if (!config.mcpServers) {
            installerUICore.logMessage('No MCP servers configured', 'warning');
            return;
        }
        
        const serverCount = Object.keys(config.mcpServers).length;
        installerUICore.logMessage(`${serverCount} MCP servers configured:`, 'info');
        
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
            installerUICore.logMessage(`- ${serverName}: ${serverConfig.command.join(' ')}`, 'info');
        }
    }

    /**
     * Backup the JSON configuration file
     */
    backupJsonConfiguration() {
        installerUICore.logMessage('Backing up Claude Desktop configuration...', 'info');
        
        try {
            const configPath = this.getClaudeConfigPath();
            
            // Check if file exists
            if (!window.fs.existsSync(configPath)) {
                installerUICore.logMessage('Configuration file not found, nothing to backup', 'warning');
                return;
            }
            
            // Create backup file path
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${configPath}.${timestamp}.backup`;
            
            // Copy file
            window.fs.copyFileSync(configPath, backupPath);
            
            installerUICore.logMessage(`Configuration backed up to ${backupPath}`, 'success');
        } catch (error) {
            installerUICore.logMessage(`Error backing up configuration: ${error.message}`, 'error');
        }
    }

    /**
     * Fix the JSON configuration file
     */
    fixJsonConfiguration() {
        installerUICore.logMessage('Attempting to fix Claude Desktop configuration...', 'info');
        
        try {
            const configPath = this.getClaudeConfigPath();
            
            // Check if file exists
            if (!window.fs.existsSync(configPath)) {
                installerUICore.logMessage('Configuration file not found, creating default configuration', 'warning');
                this.saveConfigFile(configPath, this.getDefaultConfig());
                return;
            }
            
            // Try to fix JSON
            const success = this.fixJsonConfig(configPath);
            
            if (success) {
                installerUICore.logMessage('Configuration file fixed successfully', 'success');
            } else {
                installerUICore.logMessage('Unable to fix configuration file', 'error');
            }
        } catch (error) {
            installerUICore.logMessage(`Error fixing configuration: ${error.message}`, 'error');
        }
    }

    /**
     * Verify JSON configuration
     */
    verifyJsonConfiguration() {
        installerUICore.logMessage('Verifying Claude Desktop configuration...', 'info');
        
        try {
            const configPath = this.getClaudeConfigPath();
            
            // Check if file exists
            if (!window.fs.existsSync(configPath)) {
                installerUICore.logMessage('Configuration file not found, creating default configuration', 'warning');
                this.saveConfigFile(configPath, this.getDefaultConfig());
                return;
            }
            
            // Read configuration
            const config = this.readCurrentConfig(configPath);
            
            // Verify and fix server configuration
            const isValid = this.verifyAndFixServerConfig(config, configPath);
            
            if (isValid) {
                installerUICore.logMessage('Configuration verification completed', 'success');
            } else {
                installerUICore.logMessage('Configuration verification failed', 'error');
            }
        } catch (error) {
            installerUICore.logMessage(`Error verifying configuration: ${error.message}`, 'error');
        }
    }

    /**
     * Verify and fix server configuration
     * @param {Object} config - Configuration object
     * @param {string} configPath - Path to configuration file
     * @returns {boolean} Whether the configuration is valid
     */
    verifyAndFixServerConfig(config, configPath) {
        // Check for missing required servers
        const requiredServers = ['github', 'redis', 'time'];
        const missingServers = this.findMissingServers(config, requiredServers);
        
        if (missingServers.length > 0) {
            this.handleMissingServers(config, configPath, missingServers);
            return true;
        } 
        
        installerUICore.logMessage('Configuration verification successful', 'success');
        return true;
    }

    /**
     * Find missing servers in configuration
     * @param {Object} config - Configuration object
     * @param {Array<string>} requiredServers - List of required server names
     * @returns {Array<string>} List of missing server names
     */
    findMissingServers(config, requiredServers) {
        const missingServers = [];
        
        // Check if mcpServers exists
        if (!config.mcpServers) {
            return requiredServers;
        }
        
        // Check each required server
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
    handleMissingServers(config, configPath, missingServers) {
        installerUICore.logMessage('Configuration verification failed: Missing servers', 'warning');
        installerUICore.logMessage('Attempting to fix configuration...', 'info');
        
        // Create default configuration if needed
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Add missing servers
        this.addMissingServers(config, missingServers);
        
        // Save the updated configuration
        this.saveConfigFile(configPath, config);
    }

    /**
     * Add missing servers to configuration
     * @param {Object} config - Configuration object
     * @param {Array<string>} missingServers - List of missing server names
     */
    addMissingServers(config, missingServers) {
        const serverConfigs = this.getServerConfigurations();
        
        for (const serverName of missingServers) {
            if (serverConfigs[serverName]) {
                config.mcpServers[serverName] = serverConfigs[serverName];
                installerUICore.logMessage(`Added missing server: ${serverName}`, 'info');
            } else {
                installerUICore.logMessage(`Unable to add server: ${serverName} (configuration not found)`, 'warning');
            }
        }
    }

    /**
     * Get server configurations
     * @param {string} installPath - The installation path
     * @param {string} methodId - The installation method
     * @returns {Object} Server configurations
     */
    getServerConfigurations(installPath = null, methodId = 'npx') {
        // Default npm modules path
        const npmModulesPath = installPath || 'node_modules';
        
        // Get Node.js path
        const nodePath = 'node';
        
        // Server configurations
        const serverConfigs = {};
        
        // GitHub MCP server
        serverConfigs.github = this.createNodeServerConfig(
            nodePath,
            npmModulesPath,
            'github',
            ['--port', '3001']
        );
        
        // Redis MCP server
        serverConfigs.redis = this.createNodeServerConfig(
            nodePath,
            npmModulesPath,
            'redis',
            ['--port', '3002']
        );
        
        // Time MCP server
        serverConfigs.time = this.createNodeServerConfig(
            nodePath,
            npmModulesPath,
            'time',
            ['--port', '3003']
        );
        
        // Filesystem MCP server
        serverConfigs.filesystem = this.createNodeServerConfig(
            nodePath,
            npmModulesPath,
            'filesystem',
            ['--port', '3004']
        );
        
        // Brave Search MCP server
        serverConfigs['brave-search'] = this.createNodeServerConfig(
            nodePath,
            npmModulesPath,
            'brave-search',
            ['--port', '3005']
        );
        
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
    createNodeServerConfig(nodePath, npmModulesPath, serverName, extraArgs = []) {
        const serverPath = `${npmModulesPath}/@mcp/server-${serverName}`;
        
        return {
            command: [
                nodePath,
                `${serverPath}/dist/index.js`,
                ...extraArgs
            ],
            cwd: npmModulesPath,
            env: {},
            autoRestart: true
        };
    }

    /**
     * Write the Claude Desktop configuration file
     * @param {string} configPath - Path to configuration file
     * @param {object} config - The configuration object to write
     */
    writeClaudeConfig(configPath, config) {
        try {
            const configJson = JSON.stringify(config, null, 2);
            window.fs.writeFileSync(configPath, configJson, 'utf8');
        } catch (error) {
            installerUICore.logMessage(`Error writing configuration: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Fix a corrupted JSON configuration file
     * @param {string} configPath - The path to the configuration file
     * @returns {boolean} Whether the fix was successful
     */
    fixJsonConfig(configPath) {
        try {
            // Read the file content
            const content = window.fs.readFileSync(configPath, 'utf8');
            
            try {
                // Try to parse the JSON
                const config = JSON.parse(content);
                
                // If parsing succeeds, verify the structure
                if (!config.mcpServers) {
                    config.mcpServers = {};
                }
                
                // Write the fixed configuration
                this.writeClaudeConfig(configPath, config);
                
                return true;
            } catch (jsonError) {
                // JSON parsing failed, create a backup and write default config
                this.backupJsonConfiguration();
                this.writeClaudeConfig(configPath, this.getDefaultConfig());
                
                return true;
            }
        } catch (error) {
            installerUICore.logMessage(`Error fixing JSON configuration: ${error.message}`, 'error');
            return false;
        }
    }
}

// Create a singleton instance
const claudeConfigManager = new ClaudeConfigManager();

// Export the singleton
export default claudeConfigManager;
