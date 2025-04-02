/**
 * Installer UI Server Discovery - Server discovery and executable path management
 * Handles finding installed MCP servers and managing executable paths
 */

/**
 * Get executable paths based on OS and installation method
 * @param {string} methodId - The installation method ID
 * @param {string} installPath - The installation path
 * @returns {Object} Object containing executable paths
 */
function getExecutablePaths(methodId, installPath) {
    const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
        window.InstallerUIUtils.detectOS() : 
        (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
    
    const isWindows = os === 'windows';
    const pathSep = isWindows ? '\\' : '/';
    
    // Default paths
    let nodePath = isWindows ? 'node.exe' : 'node';
    let pythonPath = isWindows ? 'python.exe' : 'python';
    let npmModulesPath = '';
    
    // Try to get actual paths from environment
    if (typeof window.electronAPI !== 'undefined') {
        if (window.electronAPI.getExecutablePath) {
            nodePath = window.electronAPI.getExecutablePath('node') || nodePath;
            pythonPath = window.electronAPI.getExecutablePath('python') || pythonPath;
        }
        
        if (window.electronAPI.getNpmModulesPath) {
            npmModulesPath = window.electronAPI.getNpmModulesPath() || '';
        }
    }
    
    // If no npm modules path was found, use a reasonable default
    if (!npmModulesPath) {
        if (isWindows) {
            const homeDir = getUserHomeDirectory();
            npmModulesPath = `${homeDir}\\AppData\\Roaming\\npm\\node_modules`;
        } else {
            npmModulesPath = '/usr/local/lib/node_modules';
        }
    }
    
    // For local installation, use the installation path
    if (methodId === 'local' && installPath) {
        npmModulesPath = installPath;
    }
    
    return {
        nodePath,
        pythonPath,
        npmModulesPath,
        pathSep
    };
}

/**
 * Get the user's home directory
 * @returns {string} The user's home directory
 */
function getUserHomeDirectory() {
    // Try to get from electronAPI
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getUserHome) {
        return window.electronAPI.getUserHome();
    }
    
    // Default paths based on OS
    const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
        window.InstallerUIUtils.detectOS() : 
        (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
    
    if (os === 'windows') {
        return 'C:\\Users\\Admin';
    } else if (os === 'macos') {
        return '/Users/admin';
    } else {
        return '/home/user';
    }
}

/**
 * Discover installed MCP servers in the installation path
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {Array} Array of installed server names
 */
function discoverInstalledServers(installPath, methodId) {
    // In a real implementation, we would scan the directory for installed servers
    // For our simulation, we'll return a predefined list of servers
    
    // Try to get the actual installed servers if we have access to the file system
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.listDirectory) {
        try {
            const serverDir = methodId === 'docker' ? 
                `${installPath}/servers` : 
                `${installPath}/node_modules/@modelcontextprotocol`;
            
            const directories = window.electronAPI.listDirectory(serverDir);
            
            // Filter for server directories
            return directories
                .filter(dir => dir.startsWith('server-'))
                .map(dir => dir.replace('server-', ''));
        } catch (error) {
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Error discovering servers: ${error.message}`, 'error');
            } else {
                console.error(`Error discovering servers: ${error.message}`);
            }
            
            // Fall back to default list
            return getDefaultServerList();
        }
    }
    
    // If we don't have file system access, return a default list
    return getDefaultServerList();
}

/**
 * Get a default list of MCP servers
 * @returns {Array} Array of default server names
 */
function getDefaultServerList() {
    return [
        'filesystem',
        'memory',
        'aws-kb-retrieval',
        'brave-search',
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
}

/**
 * Check if a specific MCP server is installed
 * @param {string} serverName - The server name to check
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {boolean} Whether the server is installed
 */
function isServerInstalled(serverName, installPath, methodId) {
    // Get the list of installed servers
    const installedServers = discoverInstalledServers(installPath, methodId);
    
    // Check if the server is in the list
    return installedServers.includes(serverName);
}

/**
 * Get the path to a specific MCP server executable
 * @param {string} serverName - The server name
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {string} The path to the server executable
 */
function getServerExecutablePath(serverName, installPath, methodId) {
    // Get executable paths
    const { nodePath, npmModulesPath, pathSep } = getExecutablePaths(methodId, installPath);
    
    // Format server name for package (e.g., brave-search -> server-brave-search)
    const packageName = serverName.startsWith('server-') ? 
        serverName : 
        `server-${serverName}`;
    
    // Build the path
    return `${npmModulesPath}${pathSep}@modelcontextprotocol${pathSep}${packageName}${pathSep}dist${pathSep}index.js`;
}

/**
 * Get server configuration for Claude Desktop config
 * @param {string} serverName - The server name
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method
 * @returns {Object} Server configuration object
 */
function getServerConfig(serverName, installPath, methodId) {
    // Get executable paths
    const { nodePath, pathSep } = getExecutablePaths(methodId, installPath);
    
    // Get server executable path
    const serverPath = getServerExecutablePath(serverName, installPath, methodId);
    
    // Special case for filesystem server
    if (serverName === 'filesystem') {
        return {
            command: nodePath,
            args: [
                serverPath,
                ...getDefaultFilesystemPaths()
            ],
            env: { DEBUG: '*' }
        };
    }
    
    // Default configuration
    return {
        command: nodePath,
        args: [serverPath],
        env: { DEBUG: '*' }
    };
}

/**
 * Get default filesystem paths based on OS
 * @returns {Array} Array of default filesystem paths
 */
function getDefaultFilesystemPaths() {
    // Get user home directory
    const homeDir = getUserHomeDirectory();
    
    // Detect OS
    const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
        window.InstallerUIUtils.detectOS() : 
        (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
    
    if (os === 'windows') {
        return [
            `${homeDir}\\Downloads`,
            `${homeDir}\\Documents`,
            `${homeDir}\\Desktop`
        ];
    } else if (os === 'macos') {
        return [
            `${homeDir}/Downloads`,
            `${homeDir}/Documents`,
            `${homeDir}/Desktop`
        ];
    } else {
        return [
            `${homeDir}/Downloads`,
            `${homeDir}/Documents`,
            `${homeDir}/Desktop`
        ];
    }
}

// Export functions for use in other modules
window.InstallerUIServerDiscovery = {
    getExecutablePaths,
    getUserHomeDirectory,
    discoverInstalledServers,
    getDefaultServerList,
    isServerInstalled,
    getServerExecutablePath,
    getServerConfig,
    getDefaultFilesystemPaths
};
