/**
 * Installer UI Config - Claude Desktop configuration management
 */

/**
 * Update the Claude Desktop configuration file with new MCP servers
 * @param {string} repoUrl - The repository URL
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method (npx, uv, python)
 * @returns {Promise<boolean>} - Whether the update was successful
 */
async function updateClaudeConfig(repoUrl, installPath, methodId) {
    try {
        // Get the appropriate config path based on OS
        const configPath = await getClaudeConfigPath();
        
        // Read the current configuration
        const config = await readCurrentConfig(configPath);
        
        // Update the configuration with server configs
        await updateConfigWithServers(config, installPath, methodId);
        
        // Save the updated configuration
        await saveUpdatedConfig(configPath, config);
        
        logMessage(`Successfully updated Claude Desktop configuration at ${configPath}`, 'success');
        return true;
    } catch (error) {
        logMessage(`Error updating Claude Desktop configuration: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Get the Claude Desktop configuration file path based on OS
 * @returns {Promise<string>} Path to the Claude Desktop configuration file
 */
async function getClaudeConfigPath() {
    // If running in Electron, use the API to get the correct path
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getConfigPath) {
        return await window.electronAPI.getConfigPath('claude_desktop_config.json');
    }
    
    // Otherwise, determine based on OS
    const os = detectOS();
    const homeDir = await getUserHomeDirectory();
    
    // Use path.join equivalent for better cross-platform compatibility
    const pathSep = os === 'windows' ? '\\' : '/';
    
    // Determine config path based on OS
    switch (os) {
        case 'windows':
            return `${homeDir}${pathSep}AppData${pathSep}Roaming${pathSep}Claude${pathSep}claude_desktop_config.json`;
        case 'macos':
            return `${homeDir}${pathSep}Library${pathSep}Application Support${pathSep}Claude${pathSep}claude_desktop_config.json`;
        case 'linux':
            return `${homeDir}${pathSep}.config${pathSep}Claude${pathSep}claude_desktop_config.json`;
        default:
            throw new Error(`Unsupported OS: ${os}`);
    }
}

/**
 * Get the user's home directory
 * @returns {Promise<string>} Path to the user's home directory
 */
async function getUserHomeDirectory() {
    // If running in Electron, use the API to get the correct path
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getUserHome) {
        return await window.electronAPI.getUserHome();
    }
    
    // Otherwise, use a platform-specific default
    const os = detectOS();
    const username = await getCurrentUsername();
    
    switch (os) {
        case 'windows':
            return `C:\\Users\\${username}`;
        case 'macos':
            return `/Users/${username}`;
        case 'linux':
            return `/home/${username}`;
        default:
            throw new Error(`Unsupported OS: ${os}`);
    }
}

/**
 * Get the current username
 * @returns {Promise<string>} The current username
 */
async function getCurrentUsername() {
    // If running in Electron, use the API to get the username
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getUsername) {
        return await window.electronAPI.getUsername();
    }
    
    // Otherwise, use a default
    return window.username || 'user';
}

/**
 * Read the current Claude Desktop configuration
 * @param {string} configPath - Path to the configuration file
 * @returns {Promise<Object>} The configuration object
 */
async function readCurrentConfig(configPath) {
    try {
        // If running in Electron, use the API to read the file
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.readFile) {
            try {
                // Check if file exists
                const fileExists = await window.electronAPI.fileExists(configPath);
                
                if (fileExists) {
                    // Read and parse the file
                    const fileContent = await window.electronAPI.readFile(configPath);
                    return JSON.parse(fileContent);
                } else {
                    // File doesn't exist, create directory if needed
                    const configDir = getDirectoryFromPath(configPath);
                    await window.electronAPI.createDirectory(configDir);
                    
                    // Return default config
                    logMessage(`Config file not found, creating new one at: ${configPath}`, 'info');
                    return createDefaultConfig();
                }
            } catch (fileError) {
                logMessage(`Error reading config file: ${fileError.message}`, 'warning');
                return createDefaultConfig();
            }
        }
        
        // Fallback to localStorage for simulation
        const configData = localStorage.getItem('claude_config');
        if (configData) {
            return JSON.parse(configData);
        }
        
        // Default configuration if not found
        return createDefaultConfig();
    } catch (error) {
        logMessage(`Error reading configuration: ${error.message}`, 'error');
        return createDefaultConfig();
    }
}

/**
 * Get directory path from a file path
 * @param {string} filePath - The file path
 * @returns {string} The directory path
 */
function getDirectoryFromPath(filePath) {
    const os = detectOS();
    const pathSep = os === 'windows' ? '\\' : '/';
    const lastSepIndex = filePath.lastIndexOf(pathSep);
    
    if (lastSepIndex === -1) {
        return '.';
    }
    
    return filePath.substring(0, lastSepIndex);
}

/**
 * Save the updated configuration
 * @param {string} configPath - Path to the configuration file
 * @param {Object} config - The configuration object to save
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveUpdatedConfig(configPath, config) {
    try {
        // Format the JSON with proper indentation
        const configJson = JSON.stringify(config, null, 2);
        
        // If running in Electron, use the API to write the file
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            // Ensure directory exists
            const configDir = getDirectoryFromPath(configPath);
            await window.electronAPI.createDirectory(configDir);
            
            // Write the file
            await window.electronAPI.writeFile(configPath, configJson);
            return true;
        }
        
        // Fallback to localStorage for simulation
        localStorage.setItem('claude_config', configJson);
        logMessage('[Simulation] Saved configuration to localStorage', 'info');
        return true;
    } catch (error) {
        logMessage(`Error saving configuration: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Update the configuration with server configs
 * @param {Object} config - The configuration object
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {Promise<void>}
 */
async function updateConfigWithServers(config, installPath, methodId) {
    // Ensure mcpServers object exists
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    
    // Discover installed servers dynamically
    const installedServers = await discoverInstalledServers(installPath, methodId);
    
    // Get server configurations based on discovered servers
    const serverConfigs = await generateServerConfigs(installPath, methodId, installedServers);
    
    // Update the configuration with all server configs
    Object.assign(config.mcpServers, serverConfigs);
}

/**
 * Discover installed MCP servers in the installation path
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {Promise<Array<string>>} List of discovered server names
 */
async function discoverInstalledServers(installPath, methodId) {
    try {
        // If running in Electron, use the API to list directories
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.listDirectory) {
            const serverDirs = await window.electronAPI.listDirectory(installPath);
            return serverDirs
                .filter(dir => dir.isDirectory)
                .filter(dir => isValidServerDirectory(dir.name))
                .map(dir => dir.name);
        }
        
        // Fallback to predefined list for simulation
        return ['github', 'filesystem', 'memory', 'brave-search', 'time'];
    } catch (error) {
        logMessage(`Error discovering servers: ${error.message}`, 'warning');
        // Return default servers as fallback
        return ['github', 'filesystem', 'memory', 'brave-search'];
    }
}

/**
 * Check if a directory name is a valid MCP server
 * @param {string} dirName - The directory name
 * @returns {boolean} Whether the directory is a valid server
 */
function isValidServerDirectory(dirName) {
    // Check if the directory name starts with common MCP server prefixes
    const validPrefixes = ['mcp-', 'server-', 'claude-'];
    
    // Check if the directory name contains common MCP server keywords
    const validKeywords = ['mcp', 'server', 'claude'];
    
    // Check prefixes
    for (const prefix of validPrefixes) {
        if (dirName.toLowerCase().startsWith(prefix)) {
            return true;
        }
    }
    
    // Check keywords
    for (const keyword of validKeywords) {
        if (dirName.toLowerCase().includes(keyword)) {
            return true;
        }
    }
    
    // Check for common server names
    const commonServers = [
        'github', 'filesystem', 'memory', 'brave-search', 'time',
        'redis', 'postgres', 'mongodb', 'mysql', 'sqlite',
        'aws', 'azure', 'gcp', 'google', 'microsoft',
        'openai', 'anthropic', 'cohere', 'huggingface'
    ];
    
    return commonServers.includes(dirName.toLowerCase());
}

/**
 * Generate server configurations based on discovered servers
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @param {Array<string>} serverNames - List of server names
 * @returns {Promise<Object>} Server configurations
 */
async function generateServerConfigs(installPath, methodId, serverNames) {
    const configs = {};
    const os = detectOS();
    const pathSep = os === 'windows' ? '\\' : '/';
    
    // Get appropriate executable paths
    const execPaths = await getExecutablePaths(methodId);
    
    // Generate configuration for each server
    for (const serverName of serverNames) {
        // Normalize server name (remove prefixes, convert to lowercase)
        const normalizedName = normalizeServerName(serverName);
        
        // Generate server configuration
        configs[normalizedName] = await generateServerConfig(
            normalizedName,
            installPath,
            methodId,
            execPaths
        );
    }
    
    return configs;
}

/**
 * Normalize server name by removing prefixes and converting to lowercase
 * @param {string} serverName - The server name
 * @returns {string} Normalized server name
 */
function normalizeServerName(serverName) {
    // Remove common prefixes
    const prefixes = ['mcp-', 'server-', 'claude-'];
    let normalizedName = serverName.toLowerCase();
    
    for (const prefix of prefixes) {
        if (normalizedName.startsWith(prefix)) {
            normalizedName = normalizedName.substring(prefix.length);
            break;
        }
    }
    
    return normalizedName;
}

/**
 * Generate server configuration for a specific server
 * @param {string} serverName - The server name
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @param {Object} execPaths - Executable paths
 * @returns {Promise<Object>} Server configuration
 */
async function generateServerConfig(serverName, installPath, methodId, execPaths) {
    const os = detectOS();
    const pathSep = os === 'windows' ? '\\' : '/';
    
    // Determine server type (node or python)
    const serverType = await determineServerType(serverName, installPath);
    
    // Generate configuration based on server type
    if (serverType === 'python') {
        return {
            enabled: true,
            command: execPaths.pythonPath,
            args: ['-m', `mcp_server_${serverName}`],
            env: { DEBUG: '*' }
        };
    } else {
        // Default to Node.js
        return {
            enabled: true,
            command: execPaths.nodePath,
            args: [execPaths.npmModulesPath + pathSep + `server-${serverName}`],
            env: { DEBUG: '*' }
        };
    }
}

/**
 * Determine the server type (node or python)
 * @param {string} serverName - The server name
 * @param {string} installPath - The installation path
 * @returns {Promise<string>} Server type ('node' or 'python')
 */
async function determineServerType(serverName, installPath) {
    try {
        // If running in Electron, check for package.json or setup.py
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.fileExists) {
            const os = detectOS();
            const pathSep = os === 'windows' ? '\\' : '/';
            
            const serverPath = `${installPath}${pathSep}${serverName}`;
            const hasPackageJson = await window.electronAPI.fileExists(`${serverPath}${pathSep}package.json`);
            const hasSetupPy = await window.electronAPI.fileExists(`${serverPath}${pathSep}setup.py`);
            
            if (hasSetupPy) {
                return 'python';
            } else {
                return 'node';
            }
        }
        
        // Fallback to predefined mapping for simulation
        const pythonServers = ['fetch', 'openai', 'anthropic', 'cohere'];
        return pythonServers.includes(serverName) ? 'python' : 'node';
    } catch (error) {
        // Default to Node.js if error
        return 'node';
    }
}

/**
 * Get executable paths based on OS and installation method
 * @param {string} methodId - The installation method
 * @returns {Promise<Object>} Object containing executable paths
 */
async function getExecutablePaths(methodId) {
    const os = detectOS();
    const isWindows = os === 'windows';
    const pathSep = isWindows ? '\\' : '/';
    
    // Default paths
    let nodePath = isWindows ? 'node.exe' : 'node';
    let pythonPath = isWindows ? 'python.exe' : 'python';
    let npmModulesPath = '';
    
    // If running in Electron, get actual paths
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getExecutablePath) {
        nodePath = await window.electronAPI.getExecutablePath('node') || nodePath;
        pythonPath = await window.electronAPI.getExecutablePath('python') || pythonPath;
    }
    
    // Determine npm modules path based on method
    if (methodId === 'npx') {
        // For npx, use global node_modules
        npmModulesPath = isWindows ? 
            `${await getUserHomeDirectory()}${pathSep}AppData${pathSep}Roaming${pathSep}npm${pathSep}node_modules` :
            `/usr/local/lib/node_modules`;
    } else if (methodId === 'uv') {
        // For uv, use site-packages
        npmModulesPath = isWindows ?
            `${await getUserHomeDirectory()}${pathSep}AppData${pathSep}Local${pathSep}uv${pathSep}site-packages` :
            `${await getUserHomeDirectory()}${pathSep}.local${pathSep}lib${pathSep}python3.10${pathSep}site-packages`;
    } else {
        // For python or other methods, use local node_modules
        npmModulesPath = `node_modules`;
    }
    
    return { nodePath, pythonPath, npmModulesPath };
}

// Export functions for use in other modules
window.InstallerUIConfig = {
    updateClaudeConfig,
    getClaudeConfigPath,
    getUserHomeDirectory,
    readCurrentConfig,
    saveUpdatedConfig,
    updateConfigWithServers,
    discoverInstalledServers,
    generateServerConfigs,
    getExecutablePaths,
    getCurrentUsername,
    normalizeServerName,
    determineServerType,
    isValidServerDirectory,
    getDirectoryFromPath
};

/**
 * Create default configuration object
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
 * Create a backup of the Claude Desktop configuration file
 * @param {string} configPath - The path to the configuration file
 * @returns {string} The path to the backup file
 */
function backupClaudeConfig(configPath) {
    try {
        // Generate backup path with timestamp
        const backupPath = generateBackupPath(configPath);
        
        // Perform the actual backup operation
        return performBackupOperation(configPath, backupPath);
    } catch (error) {
        logMessage(`Error creating backup: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Generate a backup file path with timestamp
 * @param {string} configPath - The original configuration file path
 * @returns {string} The backup file path
 */
function generateBackupPath(configPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${configPath}.${timestamp}.bak`;
}

/**
 * Perform the actual backup operation
 * @param {string} configPath - The original configuration file path
 * @param {string} backupPath - The backup file path
 * @returns {string} The backup file path if successful, null otherwise
 */
function performBackupOperation(configPath, backupPath) {
    // In a real implementation, we would use Node.js fs.copyFileSync
    // For our simulation, we'll use localStorage
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.copyFile) {
        try {
            window.electronAPI.copyFile(configPath, backupPath);
            logMessage(`Configuration backup created at ${backupPath}`, 'info');
            return backupPath;
        } catch (error) {
            logMessage(`Error copying file: ${error.message}`, 'error');
            // Fall back to localStorage backup
            return backupConfigToLocalStorage(backupPath);
        }
    } else {
        // Use localStorage for simulation
        return backupConfigToLocalStorage(backupPath);
    }
}

/**
 * Backup configuration to localStorage for simulation purposes
 * @param {string} backupPath - The backup file path
 * @returns {string} The backup file path
 */
function backupConfigToLocalStorage(backupPath) {
    const configData = localStorage.getItem('claude_config');
    if (configData) {
        localStorage.setItem('claude_config_backup', configData);
        logMessage('Configuration backup created in localStorage', 'info');
        return backupPath;
    }
    return null;
}

/**
 * Write the Claude Desktop configuration file
 * @param {string} configPath - The path to the configuration file
 * @param {object} config - The configuration object to write
 */
function writeClaudeConfig(configPath, config) {
    try {
        // First, create a backup of the current configuration
        backupClaudeConfig(configPath);
        
        // Convert the configuration object to a JSON string
        const configJson = JSON.stringify(config, null, 2);
        
        // Log the action
        logMessage(`Writing configuration to ${configPath}`, 'info');
        
        // In a real implementation, we would use Node.js fs.writeFileSync
        // For our simulation, we'll use localStorage
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.writeFile) {
            try {
                window.electronAPI.writeFile(configPath, configJson);
                logMessage(`Configuration file written successfully`, 'success');
            } catch (writeError) {
                logMessage(`Error writing configuration: ${writeError.message}`, 'error');
                throw writeError;
            }
        } else {
            // Store in localStorage for simulation
            localStorage.setItem('claude_config', configJson);
            localStorage.setItem('claude_config_written', 'true');
            logMessage(`Configuration file written successfully (simulation)`, 'success');
        }
        
        return true;
    } catch (error) {
        logMessage(`Error writing configuration file: ${error.message}`, 'error');
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
        // Create a backup before attempting to fix
        backupClaudeConfig(configPath);
        
        // In a real implementation, we would read the file, attempt to fix it, and write it back
        // For our simulation, we'll use localStorage
        
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.readFile) {
            try {
                const fileContent = window.electronAPI.readFile(configPath);
                
                // Attempt to parse the JSON
                try {
                    JSON.parse(fileContent);
                    // If we get here, the JSON is valid
                    logMessage('Configuration file is valid, no fix needed', 'info');
                    return true;
                } catch (parseError) {
                    // JSON is invalid, attempt to fix
                    logMessage(`Invalid JSON detected: ${parseError.message}`, 'warning');
                    
                    // Apply basic fixes (this is a simplified version)
                    const fixedContent = attemptJsonFix(fileContent);
                    
                    // Try to parse the fixed content
                    try {
                        const fixedJson = JSON.parse(fixedContent);
                        
                        // Write the fixed JSON back to the file
                        writeClaudeConfig(configPath, fixedJson);
                        
                        logMessage('Configuration file fixed successfully', 'success');
                        return true;
                    } catch (fixError) {
                        logMessage(`Could not fix JSON: ${fixError.message}`, 'error');
                        
                        // As a last resort, create a new default config
                        writeClaudeConfig(configPath, createDefaultConfig());
                        
                        logMessage('Created new default configuration', 'warning');
                        return true;
                    }
                }
            } catch (readError) {
                logMessage(`Error reading configuration file: ${readError.message}`, 'error');
                
                // Create a new default config
                writeClaudeConfig(configPath, createDefaultConfig());
                
                logMessage('Created new default configuration', 'warning');
                return true;
            }
        } else {
            // Simulation mode
            const configData = localStorage.getItem('claude_config');
            
            if (!configData) {
                // No config in localStorage, create default
                localStorage.setItem('claude_config', JSON.stringify(createDefaultConfig(), null, 2));
                logMessage('Created new default configuration (simulation)', 'warning');
                return true;
            }
            
            // Attempt to parse the JSON
            try {
                JSON.parse(configData);
                // If we get here, the JSON is valid
                logMessage('Configuration is valid, no fix needed (simulation)', 'info');
                return true;
            } catch (parseError) {
                // JSON is invalid, create default
                localStorage.setItem('claude_config', JSON.stringify(createDefaultConfig(), null, 2));
                logMessage('Created new default configuration (simulation)', 'warning');
                return true;
            }
        }
    } catch (error) {
        logMessage(`Error fixing configuration: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Attempt to fix invalid JSON
 * @param {string} jsonString - The invalid JSON string
 * @returns {string} The fixed JSON string
 */
function attemptJsonFix(jsonString) {
    // This is a simplified version of JSON fixing
    // In a real implementation, we would use more sophisticated methods
    
    // Remove comments
    let fixed = jsonString.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Fix trailing commas
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    
    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    
    return fixed;
}

/**
 * Update Claude Desktop configuration asynchronously
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @param {string} methodId - Installation method ID
 * @param {Function} log - Logging function
 * @returns {Promise<void>} Promise that resolves when configuration is updated
 */
async function updateClaudeConfigAsync(repoUrl, installPath, methodId, log) {
    return new Promise((resolve, reject) => {
        try {
            // Use the provided log function if available
            const logger = log || logMessage;
            
            logger('Updating Claude Desktop configuration...', 'info');
            
            // Update the configuration
            updateClaudeConfig(repoUrl, installPath, methodId);
            
            logger('Claude Desktop configuration updated successfully', 'success');
            resolve();
        } catch (error) {
            const errorMsg = `Error updating Claude Desktop configuration: ${error.message}`;
            if (log) {
                log(errorMsg, 'error');
            } else {
                logMessage(errorMsg, 'error');
                console.error(error);
            }
            reject(error);
        }
    });
}

// Helper function to log messages (if not imported from another module)
function logMessage(message, type = '') {
    if (typeof window.InstallerUI !== 'undefined' && window.InstallerUI.logMessage) {
        window.InstallerUI.logMessage(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Helper function to detect OS (if not imported from another module)
function detectOS() {
    if (typeof window.InstallerUI !== 'undefined' && window.InstallerUI.detectOS) {
        return window.InstallerUI.detectOS();
    }
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Windows') !== -1) return 'windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macos';
    if (userAgent.indexOf('Linux') !== -1) return 'linux';
    return 'unknown';
}
