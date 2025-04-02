/**
 * Installer UI - Main entry point for the installer UI
 * Coordinates between various modular components
 */

// Import dependencies
// These would be proper imports in a module system
// For now, we're assuming these are loaded via script tags

/**
 * Initialize the installer UI
 */
function initInstallerUI() {
    // Initialize UI components
    if (window.InstallerUICore && window.InstallerUICore.initUI) {
        window.InstallerUICore.initUI();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check system requirements
    checkSystemRequirements();
    
    // Log initialization
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage('Installer UI initialized', 'info');
    } else {
        console.log('Installer UI initialized');
    }
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    // Set up installation method selection
    setupInstallationMethodSelection();
    
    // Set up template selection
    setupTemplateSelection();
    
    // Set up installation path selection
    setupInstallationPathSelection();
    
    // Set up installation button
    setupInstallButton();
    
    // Set up URL installation
    setupUrlInstallation();
    
    // Set up advanced options
    setupAdvancedOptions();
}

/**
 * Set up installation method selection
 */
function setupInstallationMethodSelection() {
    const methodRadios = document.querySelectorAll('input[name="installMethod"]');
    
    methodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Update UI based on selected method
            updateUIForMethod(this.value);
            
            // Log selection
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Installation method selected: ${this.value}`, 'info');
            } else {
                console.log(`Installation method selected: ${this.value}`);
            }
        });
    });
}

/**
 * Update UI based on selected installation method
 * @param {string} methodId - The selected installation method ID
 */
function updateUIForMethod(methodId) {
    // Get UI elements
    const dockerOptions = document.getElementById('dockerOptions');
    const localOptions = document.getElementById('localOptions');
    const npxOptions = document.getElementById('npxOptions');
    
    // Hide all options first
    dockerOptions.style.display = 'none';
    localOptions.style.display = 'none';
    npxOptions.style.display = 'none';
    
    // Show options for selected method
    switch (methodId) {
        case 'docker':
            dockerOptions.style.display = 'block';
            break;
        case 'local':
            localOptions.style.display = 'block';
            break;
        case 'npx':
            npxOptions.style.display = 'block';
            break;
    }
}

/**
 * Set up template selection
 */
function setupTemplateSelection() {
    const templateSelect = document.getElementById('templateSelect');
    
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            // Get selected template
            const templateId = this.value;
            
            // Update UI based on selected template
            updateUIForTemplate(templateId);
            
            // Log selection
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage(`Template selected: ${templateId}`, 'info');
            } else {
                console.log(`Template selected: ${templateId}`);
            }
        });
    }
}

/**
 * Update UI based on selected template
 * @param {string} templateId - The selected template ID
 */
function updateUIForTemplate(templateId) {
    // Get template details
    const templateDetails = getTemplateDetails(templateId);
    
    // Update UI with template details
    if (templateDetails) {
        const templateDescription = document.getElementById('templateDescription');
        const templateRequirements = document.getElementById('templateRequirements');
        
        if (templateDescription) {
            templateDescription.textContent = templateDetails.description;
        }
        
        if (templateRequirements) {
            templateRequirements.textContent = templateDetails.requirements.join(', ');
        }
    }
}

/**
 * Get template details by ID
 * @param {string} templateId - The template ID
 * @returns {Object|null} Template details or null if not found
 */
function getTemplateDetails(templateId) {
    // Get templates from the template module
    if (window.InstallerUITemplates && window.InstallerUITemplates.getTemplates) {
        const templates = window.InstallerUITemplates.getTemplates();
        return templates.find(template => template.id === templateId) || null;
    }
    
    // Fallback to a simple template list
    const templates = [
        {
            id: 'basic',
            name: 'Basic MCP Server',
            description: 'A basic MCP server with essential functionality',
            requirements: ['Node.js 14+']
        },
        {
            id: 'full',
            name: 'Full MCP Server Suite',
            description: 'Complete suite of MCP servers with all available functionality',
            requirements: ['Node.js 14+', '4GB RAM', '2GB Disk Space']
        },
        {
            id: 'minimal',
            name: 'Minimal MCP Server',
            description: 'Lightweight MCP server with minimal dependencies',
            requirements: ['Node.js 14+', '1GB RAM']
        }
    ];
    
    return templates.find(template => template.id === templateId) || null;
}

/**
 * Set up installation path selection
 */
function setupInstallationPathSelection() {
    const pathInput = document.getElementById('installPath');
    const browseButton = document.getElementById('browsePath');
    
    if (browseButton) {
        browseButton.addEventListener('click', function() {
            // Open file browser if available
            if (typeof window.electronAPI !== 'undefined' && window.electronAPI.openDirectoryPicker) {
                window.electronAPI.openDirectoryPicker()
                    .then(path => {
                        if (path && pathInput) {
                            pathInput.value = path;
                            
                            // Log selection
                            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                                window.InstallerUIUtils.logMessage(`Installation path selected: ${path}`, 'info');
                            } else {
                                console.log(`Installation path selected: ${path}`);
                            }
                        }
                    })
                    .catch(error => {
                        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                            window.InstallerUIUtils.logMessage(`Error selecting path: ${error.message}`, 'error');
                        } else {
                            console.error(`Error selecting path: ${error.message}`);
                        }
                    });
            } else {
                // Fallback for browsers without file system access
                alert('Directory selection is not available in this environment.');
            }
        });
    }
}

/**
 * Set up installation button
 */
function setupInstallButton() {
    const installButton = document.getElementById('installButton');
    
    if (installButton) {
        installButton.addEventListener('click', function() {
            // Get installation parameters
            const params = getInstallationParameters();
            
            // Validate parameters
            if (validateInstallationParameters(params)) {
                // Start installation
                startInstallation(params);
            }
        });
    }
}

/**
 * Get installation parameters from UI
 * @returns {Object} Installation parameters
 */
function getInstallationParameters() {
    // Get selected installation method
    const methodRadios = document.querySelectorAll('input[name="installMethod"]');
    let methodId = 'npx'; // Default
    
    methodRadios.forEach(radio => {
        if (radio.checked) {
            methodId = radio.value;
        }
    });
    
    // Get selected template
    const templateSelect = document.getElementById('templateSelect');
    const templateId = templateSelect ? templateSelect.value : 'basic';
    
    // Get installation path
    const pathInput = document.getElementById('installPath');
    const installPath = pathInput ? pathInput.value : '';
    
    // Get advanced options
    const advancedOptions = getAdvancedOptions();
    
    return {
        methodId,
        templateId,
        installPath,
        ...advancedOptions
    };
}

/**
 * Get advanced installation options
 * @returns {Object} Advanced options
 */
function getAdvancedOptions() {
    const options = {};
    
    // Get Docker options if available
    if (window.InstallerUIDocker && window.InstallerUIDocker.getDockerConfigOptions) {
        options.docker = window.InstallerUIDocker.getDockerConfigOptions();
    }
    
    // Get other advanced options
    const portInput = document.getElementById('serverPort');
    if (portInput) {
        options.port = portInput.value || '3000';
    }
    
    const debugCheckbox = document.getElementById('enableDebug');
    if (debugCheckbox) {
        options.debug = debugCheckbox.checked;
    }
    
    return options;
}

/**
 * Validate installation parameters
 * @param {Object} params - Installation parameters
 * @returns {boolean} Whether the parameters are valid
 */
function validateInstallationParameters(params) {
    // Check for required parameters
    if (!params.methodId) {
        showError('Please select an installation method.');
        return false;
    }
    
    if (!params.templateId) {
        showError('Please select a template.');
        return false;
    }
    
    // Validate installation path
    if (!params.installPath) {
        showError('Please specify an installation path.');
        return false;
    }
    
    // Method-specific validation
    if (params.methodId === 'docker') {
        // Check Docker availability
        if (window.InstallerUIDocker && window.InstallerUIDocker.isDockerAvailable) {
            if (!window.InstallerUIDocker.isDockerAvailable()) {
                showError('Docker is not available. Please install Docker or choose a different installation method.');
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Show error in UI
    const errorElement = document.getElementById('errorMessage');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    // Log error
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage(message, 'error');
    } else {
        console.error(message);
    }
}

/**
 * Start the installation process
 * @param {Object} params - Installation parameters
 */
function startInstallation(params) {
    // Show installation UI
    showInstallationUI();
    
    // Check system requirements
    checkSystemRequirements()
        .then(requirements => {
            if (requirements.satisfied) {
                // Start installation process
                if (window.InstallerUIInstallation && window.InstallerUIInstallation.startInstallation) {
                    window.InstallerUIInstallation.startInstallation(params);
                } else {
                    // Fallback to simulation
                    simulateInstallation(params);
                }
            } else {
                // Show requirements not met
                showRequirementsNotMet(requirements.missing);
            }
        })
        .catch(error => {
            showError(`Error checking system requirements: ${error.message}`);
        });
}

/**
 * Show the installation UI
 */
function showInstallationUI() {
    // Hide setup UI
    const setupContainer = document.getElementById('setupContainer');
    if (setupContainer) {
        setupContainer.style.display = 'none';
    }
    
    // Show installation UI
    const installationContainer = document.getElementById('installationContainer');
    if (installationContainer) {
        installationContainer.style.display = 'block';
    }
}

/**
 * Show requirements not met message
 * @param {Array} missingRequirements - List of missing requirements
 */
function showRequirementsNotMet(missingRequirements) {
    // Show error
    showError(`System requirements not met: ${missingRequirements.join(', ')}`);
    
    // Show setup UI again
    const setupContainer = document.getElementById('setupContainer');
    if (setupContainer) {
        setupContainer.style.display = 'block';
    }
    
    // Hide installation UI
    const installationContainer = document.getElementById('installationContainer');
    if (installationContainer) {
        installationContainer.style.display = 'none';
    }
}

/**
 * Check system requirements
 * @returns {Promise<Object>} Promise resolving to requirements status
 */
function checkSystemRequirements() {
    return new Promise((resolve, reject) => {
        try {
            // Log check
            if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
                window.InstallerUIUtils.logMessage('Checking system requirements...', 'info');
            } else {
                console.log('Checking system requirements...');
            }
            
            // Check Node.js
            const nodeVersion = checkNodeVersion();
            
            // Check disk space
            const diskSpace = checkDiskSpace();
            
            // Check memory
            const memory = checkMemory();
            
            // Check Docker if needed
            const dockerAvailable = window.InstallerUIDocker && window.InstallerUIDocker.isDockerAvailable ? 
                window.InstallerUIDocker.isDockerAvailable() : 
                false;
            
            // Determine if requirements are met
            const missingRequirements = [];
            
            if (!nodeVersion.satisfied) {
                missingRequirements.push(`Node.js ${nodeVersion.required}+`);
            }
            
            if (!diskSpace.satisfied) {
                missingRequirements.push(`${diskSpace.required}GB disk space`);
            }
            
            if (!memory.satisfied) {
                missingRequirements.push(`${memory.required}GB RAM`);
            }
            
            // Resolve with requirements status
            resolve({
                satisfied: missingRequirements.length === 0,
                missing: missingRequirements,
                details: {
                    nodeVersion,
                    diskSpace,
                    memory,
                    dockerAvailable
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Check Node.js version
 * @returns {Object} Node.js version check result
 */
function checkNodeVersion() {
    // In a real implementation, this would check the actual Node.js version
    // For our simulation, we'll assume it's available
    
    return {
        required: '14.0.0',
        current: '16.0.0',
        satisfied: true
    };
}

/**
 * Check available disk space
 * @returns {Object} Disk space check result
 */
function checkDiskSpace() {
    // In a real implementation, this would check the actual disk space
    // For our simulation, we'll assume it's sufficient
    
    return {
        required: 2,
        available: 50,
        satisfied: true
    };
}

/**
 * Check available memory
 * @returns {Object} Memory check result
 */
function checkMemory() {
    // In a real implementation, this would check the actual memory
    // For our simulation, we'll assume it's sufficient
    
    return {
        required: 4,
        available: 8,
        satisfied: true
    };
}

/**
 * Simulate the installation process
 * @param {Object} params - Installation parameters
 */
function simulateInstallation(params) {
    // Use the progress module if available
    if (window.InstallerUIProgress && window.InstallerUIProgress.simulateInstallation) {
        window.InstallerUIProgress.simulateInstallation(params);
    } else {
        // Fallback implementation
        console.log('Simulating installation with params:', params);
        alert('Installation simulation not available. Please check the console for details.');
    }
}

/**
 * Set up URL installation
 */
function setupUrlInstallation() {
    const urlInstallButton = document.getElementById('urlInstallButton');
    const urlInput = document.getElementById('repoUrl');
    
    if (urlInstallButton && urlInput) {
        urlInstallButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            
            if (url) {
                // Use the URL module if available
                if (window.InstallerUIUrl && window.InstallerUIUrl.installFromUrl) {
                    window.InstallerUIUrl.installFromUrl(url);
                } else {
                    // Fallback to alert
                    alert(`URL installation not available for: ${url}`);
                }
            } else {
                showError('Please enter a repository URL.');
            }
        });
    }
}

/**
 * Set up advanced options
 */
function setupAdvancedOptions() {
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedOptions = document.getElementById('advancedOptions');
    
    if (advancedToggle && advancedOptions) {
        advancedToggle.addEventListener('click', function() {
            if (advancedOptions.style.display === 'none') {
                advancedOptions.style.display = 'block';
                advancedToggle.textContent = 'Hide Advanced Options';
            } else {
                advancedOptions.style.display = 'none';
                advancedToggle.textContent = 'Show Advanced Options';
            }
        });
    }
}

/**
 * Update Claude Desktop configuration
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @param {string} methodId - Installation method
 */
function updateClaudeConfig(repoUrl, installPath, methodId) {
    // Use the config module if available
    if (window.InstallerUIConfig && window.InstallerUIConfig.updateClaudeConfig) {
        window.InstallerUIConfig.updateClaudeConfig(repoUrl, installPath, methodId);
    } else {
        // Log fallback
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('Configuration update simulated', 'info');
        } else {
            console.log('Configuration update simulated');
        }
    }
}

/**
 * Install MCP servers
 * @param {string} methodId - Installation method
 */
function installMcpServers(methodId) {
    // Use the server discovery module if available
    if (window.InstallerUIServerDiscovery && window.InstallerUIServerDiscovery.discoverInstalledServers) {
        const installPath = document.getElementById('installPath').value;
        const installedServers = window.InstallerUIServerDiscovery.discoverInstalledServers(installPath, methodId);
        
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage(`Installed MCP servers: ${installedServers.join(', ')}`, 'info');
        } else {
            console.log(`Installed MCP servers: ${installedServers.join(', ')}`);
        }
    } else {
        // Log fallback
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('MCP server installation simulated', 'info');
        } else {
            console.log('MCP server installation simulated');
        }
    }
}

/**
 * Verify configuration
 */
function verifyConfiguration() {
    // Use the config verification module if available
    if (window.InstallerUIConfigVerification && window.InstallerUIConfigVerification.verifyConfiguration) {
        // Get config path based on OS
        const os = window.InstallerUIUtils && window.InstallerUIUtils.detectOS ? 
            window.InstallerUIUtils.detectOS() : 
            (window.navigator.userAgent.indexOf('Windows') !== -1 ? 'windows' : 'other');
        
        let configPath;
        
        if (os === 'windows') {
            configPath = 'C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
        } else if (os === 'macos') {
            configPath = '/Users/admin/Library/Application Support/Claude/claude_desktop_config.json';
        } else {
            configPath = '/home/user/.config/Claude/claude_desktop_config.json';
        }
        
        window.InstallerUIConfigVerification.verifyConfiguration(configPath);
    } else {
        // Log fallback
        if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
            window.InstallerUIUtils.logMessage('Configuration verification simulated', 'info');
        } else {
            console.log('Configuration verification simulated');
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initInstallerUI);

// Export functions for use in other modules
window.InstallerUI = {
    initInstallerUI,
    setupEventListeners,
    updateUIForMethod,
    updateUIForTemplate,
    getTemplateDetails,
    getInstallationParameters,
    validateInstallationParameters,
    showError,
    startInstallation,
    showInstallationUI,
    checkSystemRequirements,
    simulateInstallation,
    updateClaudeConfig,
    installMcpServers,
    verifyConfiguration
};