/**
 * Configuration Editor - Handles loading, editing, and saving configuration files for MCP servers
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initConfigEditor();
    addConfigEditorEventListeners();
});

/**
 * Initialize the configuration editor
 */
function initConfigEditor() {
    // Hide validation message initially
    document.getElementById('configValidationMessage').style.display = 'none';
}

/**
 * Add event listeners for configuration editor UI elements
 */
function addConfigEditorEventListeners() {
    // Server details tab navigation
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchServerTab(this);
        });
    });
    
    // Config file selector
    document.getElementById('configFileSelect').addEventListener('change', function() {
        loadConfigFile(this.value);
    });
    
    // Refresh config button
    document.getElementById('refreshConfigBtn').addEventListener('click', function() {
        const configFile = document.getElementById('configFileSelect').value;
        loadConfigFile(configFile, true);
    });
    
    // Save config button
    document.getElementById('saveConfigBtn').addEventListener('click', function() {
        saveConfigFile();
    });
    
    // Format config button
    document.getElementById('formatConfigBtn').addEventListener('click', function() {
        formatConfigContent();
    });
    
    // Validate config button
    document.getElementById('validateConfigBtn').addEventListener('click', function() {
        validateConfigContent();
    });
}

/**
 * Switch between server details tabs (Info, Configuration, Logs)
 * @param {Element} selectedTab - The selected tab button
 */
function switchServerTab(selectedTab) {
    // Update active tab button
    document.querySelectorAll('.server-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    selectedTab.classList.add('active');
    
    // Show selected tab content
    const tabId = selectedTab.getAttribute('data-tab');
    document.querySelectorAll('.server-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // If switching to config tab, load the selected config file
    if (tabId === 'config') {
        const configFile = document.getElementById('configFileSelect').value;
        loadConfigFile(configFile);
    }
    
    // If switching to logs tab, load logs
    if (tabId === 'logs') {
        const serverId = document.querySelector('.server-item.selected')?.getAttribute('data-server-id');
        if (serverId) {
            refreshServerLogs(serverId);
        }
    }
}

/**
 * Load a configuration file from a Docker container
 * @param {string} filename - The name of the configuration file
 * @param {boolean} [forceRefresh=false] - Whether to force a refresh from the container
 */
async function loadConfigFile(filename, forceRefresh = false) {
    const configEditor = document.getElementById('configEditor');
    const configFileName = document.getElementById('configFileName');
    const validationMessage = document.getElementById('configValidationMessage');
    
    // Update file name display
    configFileName.textContent = filename;
    
    // Clear validation message
    validationMessage.textContent = '';
    validationMessage.className = 'validation-message';
    validationMessage.style.display = 'none';
    
    // Show loading state
    configEditor.value = 'Loading configuration...';
    
    try {
        // Get the selected container ID
        const containerId = document.querySelector('.server-item.selected')?.getAttribute('data-server-id');
        if (!containerId) {
            throw new Error('No container selected');
        }
        
        // Check if we have a cached version of this config
        const cacheKey = `config_${containerId}_${filename}`;
        const cachedConfig = sessionStorage.getItem(cacheKey);
        
        if (cachedConfig && !forceRefresh) {
            // Use cached version
            configEditor.value = cachedConfig;
            return;
        }
        
        // Get the configuration file from the container
        const config = await getContainerConfigFile(containerId, filename);
        
        // Update editor with config content
        configEditor.value = config;
        
        // Cache the config
        sessionStorage.setItem(cacheKey, config);
    } catch (error) {
        console.error('Error loading configuration file:', error);
        configEditor.value = `Error loading configuration file: ${error.message}`;
    }
}

/**
 * Execute a Docker command with Electron or fallback to simulation
 * @param {Function} electronAction - The action to perform with Electron
 * @param {Function} simulationAction - The fallback simulation action
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise<any>} Promise resolving to the result of the action
 */
async function executeDockerOperation(electronAction, simulationAction, operationName) {
    try {
        // Check if we're running in Electron with command execution access
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.executeCommand) {
            return await electronAction();
        } else {
            // Fallback to simulation for development/testing
            console.log(`[Simulation] ${operationName}`);
            return simulationAction();
        }
    } catch (error) {
        console.error(`Error ${operationName.toLowerCase()}:`, error);
        throw new Error(`Failed to ${operationName.toLowerCase()}: ${error.message}`);
    }
}

/**
 * Get a temporary file path
 * @param {string} filename - The name of the file
 * @returns {Promise<{tempDir: string, tempFile: string}>} The temporary directory and file path
 */
async function getTempFilePath(filename) {
    const tempDir = await window.electronAPI.getTempDir();
    const tempFile = `${tempDir}/${filename}`;
    return { tempDir, tempFile };
}

/**
 * Get a configuration file from a Docker container
 * @param {string} containerId - The container ID
 * @param {string} filename - The name of the configuration file
 * @returns {Promise<string>} Promise resolving to the configuration file content
 */
async function getContainerConfigFile(containerId, filename) {
    const configPath = getConfigFilePath(filename);
    
    const electronAction = async () => {
        // Use Docker cp to copy the file to a temporary location
        const { tempFile } = await getTempFilePath(filename);
        
        // Copy file from container to temp location
        await window.electronAPI.executeCommand('docker', [
            'cp',
            `${containerId}:${configPath}`,
            tempFile
        ], {});
        
        // Read the file content
        const content = await window.electronAPI.readFile(tempFile);
        
        // Clean up temp file
        await window.electronAPI.executeCommand('rm', ['-f', tempFile], {});
        
        return content;
    };
    
    const simulationAction = () => getSimulatedConfigFile(filename);
    
    return executeDockerOperation(
        electronAction,
        simulationAction,
        `Getting config file ${filename} from container ${containerId}`
    );
}

/**
 * Get the path to a configuration file in a Docker container
 * @param {string} filename - The name of the configuration file
 * @returns {string} The path to the configuration file
 */
function getConfigFilePath(filename) {
    // Map common configuration files to their paths in the container
    const configPaths = {
        'config.json': '/app/config/config.json',
        'environment.json': '/app/config/environment.json',
        'docker-compose.yml': '/app/docker-compose.yml',
        '.env': '/app/.env'
    };
    
    return configPaths[filename] || `/app/${filename}`;
}

/**
 * Get a simulated configuration file for development/testing
 * @param {string} filename - The name of the configuration file
 * @returns {string} The simulated configuration file content
 */
function getSimulatedConfigFile(filename) {
    // Simulated configuration files
    const configFiles = {
        'config.json': JSON.stringify({
            "name": "mcp-server",
            "version": "1.0.0",
            "port": 3000,
            "host": "0.0.0.0",
            "database": {
                "type": "sqlite",
                "path": "/app/data/database.sqlite"
            },
            "logging": {
                "level": "info",
                "file": "/app/logs/server.log"
            },
            "security": {
                "jwt": {
                    "secret": "your-secret-key",
                    "expiresIn": "1d"
                },
                "cors": {
                    "origin": "*",
                    "methods": ["GET", "POST", "PUT", "DELETE"]
                }
            }
        }, null, 2),
        'environment.json': JSON.stringify({
            "NODE_ENV": "production",
            "DEBUG": "false",
            "API_KEYS": {
                "brave": "your-brave-api-key",
                "github": "your-github-api-key"
            },
            "RATE_LIMIT": {
                "max": 100,
                "windowMs": 60000
            }
        }, null, 2),
        'docker-compose.yml': `version: '3'
services:
  mcp-server:
    image: modelcontextprotocol/mcp-server:latest
    container_name: mcp-server
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - REPO_URL=https://github.com/modelcontextprotocol/servers
      - TEMPLATE_ID=basic-api
    restart: unless-stopped`,
        '.env': `# MCP Server Environment Variables
NODE_ENV=production
PORT=3000
DEBUG=false
LOG_LEVEL=info

# API Keys
BRAVE_API_KEY=your-brave-api-key
GITHUB_API_KEY=your-github-api-key

# Database Configuration
DB_TYPE=sqlite
DB_PATH=/app/data/database.sqlite`
    };
    
    return configFiles[filename] || `# No simulated content available for ${filename}`;
}

/**
 * Save a configuration file to a Docker container
 */
async function saveConfigFile() {
    const configEditor = document.getElementById('configEditor');
    const filename = document.getElementById('configFileName').textContent;
    const validationMessage = document.getElementById('configValidationMessage');
    
    try {
        // Validate the content before saving
        if (!validateConfigContent(false)) {
            return;
        }
        
        // Get the selected container ID
        const containerId = document.querySelector('.server-item.selected')?.getAttribute('data-server-id');
        if (!containerId) {
            throw new Error('No container selected');
        }
        
        // Get the configuration content
        const content = configEditor.value;
        
        // Save the configuration file to the container
        await saveContainerConfigFile(containerId, filename, content);
        
        // Show success message
        validationMessage.textContent = 'Configuration saved successfully.';
        validationMessage.className = 'validation-message success';
        validationMessage.style.display = 'block';
        
        // Update cache
        const cacheKey = `config_${containerId}_${filename}`;
        sessionStorage.setItem(cacheKey, content);
        
        // Hide success message after a delay
        setTimeout(() => {
            validationMessage.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Error saving configuration file:', error);
        
        // Show error message
        validationMessage.textContent = `Error saving configuration: ${error.message}`;
        validationMessage.className = 'validation-message error';
        validationMessage.style.display = 'block';
    }
}

/**
 * Save a configuration file to a Docker container
 * @param {string} containerId - The container ID
 * @param {string} filename - The name of the configuration file
 * @param {string} content - The content of the configuration file
 */
async function saveContainerConfigFile(containerId, filename, content) {
    const configPath = getConfigFilePath(filename);
    
    const electronAction = async () => {
        // Create a temporary file with the content
        const { tempFile } = await getTempFilePath(filename);
        
        // Write content to temp file
        await window.electronAPI.writeFile(tempFile, content);
        
        // Copy file from temp location to container
        await window.electronAPI.executeCommand('docker', [
            'cp',
            tempFile,
            `${containerId}:${configPath}`
        ], {});
        
        // Clean up temp file
        await window.electronAPI.executeCommand('rm', ['-f', tempFile], {});
        
        // Restart the container to apply changes
        await restartContainer(containerId);
        
        return true;
    };
    
    const simulationAction = () => {
        console.log(`[Simulation] Saving content to ${filename} in container ${containerId}`);
        localStorage.setItem(`config_${filename}`, content);
        return true;
    };
    
    return executeDockerOperation(
        electronAction,
        simulationAction,
        `Saving config file ${filename} to container ${containerId}`
    );
}

/**
 * Format the configuration content based on file type
 */
function formatConfigContent() {
    const configEditor = document.getElementById('configEditor');
    const filename = document.getElementById('configFileName').textContent;
    const content = configEditor.value;
    
    try {
        // Format based on file extension
        if (filename.endsWith('.json')) {
            // Format JSON
            const parsedJson = JSON.parse(content);
            configEditor.value = JSON.stringify(parsedJson, null, 2);
        } else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
            // For YAML, we can't really format it without a YAML library
            // Just ensure consistent indentation (simple approach)
            configEditor.value = formatYamlIndentation(content);
        } else {
            // For other files, just ensure consistent line endings
            configEditor.value = content.replace(/\r\n/g, '\n');
        }
    } catch (error) {
        console.error('Error formatting configuration:', error);
        
        // Show error message
        const validationMessage = document.getElementById('configValidationMessage');
        validationMessage.textContent = `Error formatting configuration: ${error.message}`;
        validationMessage.className = 'validation-message error';
        validationMessage.style.display = 'block';
    }
}

/**
 * Simple YAML indentation formatter
 * @param {string} content - YAML content
 * @returns {string} Formatted YAML content
 */
function formatYamlIndentation(content) {
    // Split into lines
    const lines = content.split('\n');
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
        // Trim trailing whitespace
        lines[i] = lines[i].trimRight();
        
        // Count leading spaces
        const leadingSpaces = lines[i].match(/^\s*/)[0].length;
        
        // Ensure indentation is a multiple of 2 spaces
        if (leadingSpaces > 0 && leadingSpaces % 2 !== 0) {
            const newIndent = Math.floor(leadingSpaces / 2) * 2;
            lines[i] = ' '.repeat(newIndent) + lines[i].trimLeft();
        }
    }
    
    return lines.join('\n');
}

/**
 * Validate the configuration content based on file type
 * @param {boolean} [showMessage=true] - Whether to show validation messages
 * @returns {boolean} Whether the validation was successful
 */
function validateConfigContent(showMessage = true) {
    const configEditor = document.getElementById('configEditor');
    const filename = document.getElementById('configFileName').textContent;
    const content = configEditor.value;
    const validationMessage = document.getElementById('configValidationMessage');
    
    try {
        // Validate based on file extension
        if (filename.endsWith('.json')) {
            // Validate JSON
            JSON.parse(content);
        } else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
            // Basic YAML validation (just check for balanced indentation)
            validateYamlIndentation(content);
        }
        
        // If we got here, validation passed
        if (showMessage) {
            validationMessage.textContent = 'Configuration is valid.';
            validationMessage.className = 'validation-message success';
            validationMessage.style.display = 'block';
            
            // Hide success message after a delay
            setTimeout(() => {
                validationMessage.style.display = 'none';
            }, 3000);
        }
        
        return true;
    } catch (error) {
        console.error('Validation error:', error);
        
        if (showMessage) {
            // Show error message
            validationMessage.textContent = `Validation error: ${error.message}`;
            validationMessage.className = 'validation-message error';
            validationMessage.style.display = 'block';
        }
        
        return false;
    }
}

/**
 * Basic YAML indentation validation
 * @param {string} content - YAML content
 * @throws {Error} If YAML indentation is invalid
 */
function validateYamlIndentation(content) {
    // Split into lines
    const lines = content.split('\n');
    
    // Track indentation levels
    let prevIndent = 0;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines and comments
        if (line.trim() === '' || line.trim().startsWith('#')) {
            continue;
        }
        
        // Count leading spaces
        const leadingSpaces = line.match(/^\s*/)[0].length;
        
        // Check for tab characters (not allowed in YAML)
        if (line.includes('\t')) {
            throw new Error(`Line ${i + 1}: Tab characters are not allowed in YAML`);
        }
        
        // Check for sudden large increases in indentation
        if (leadingSpaces > prevIndent + 2 && prevIndent !== 0) {
            throw new Error(`Line ${i + 1}: Inconsistent indentation`);
        }
        
        prevIndent = leadingSpaces;
    }
}

// Make functions globally accessible
window.ConfigEditor = {
    loadConfigFile,
    saveConfigFile,
    formatConfigContent,
    validateConfigContent,
    switchServerTab
};
