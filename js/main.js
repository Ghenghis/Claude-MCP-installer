/**
 * Main application entry point
 * Initializes the MCP Installer application
 */
class MCPInstallerApp {
    constructor() {
        this.initialized = false;
        this.os = Utils.detectOS();
        this.aiModels = {
            'gemini': {
                name: 'Google Gemini 2.5 Pro',
                available: false,
                apiKey: null
            },
            'claude': {
                name: 'Claude Sonnet 3.7',
                available: false,
                apiKey: null
            }
        };
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            Logger.log('Initializing MCP Installer...', 'info');
            
            // Check if we're running on Windows 11
            this.checkWindowsVersion();
            
            // Initialize UI components
            this.initUI();
            
            // Check for AI model API keys
            this.checkAIModels();
            
            // Check system requirements
            await this.checkSystemRequirements();
            
            // Initialize event listeners
            this.initEventListeners();
            
            this.initialized = true;
            Logger.log('MCP Installer initialized successfully', 'success');
            
            // Show welcome message
            this.showWelcomeMessage();
        } catch (error) {
            Logger.log(`Initialization failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Check if we're running on Windows 11
     */
    checkWindowsVersion() {
        if (this.os === 'windows') {
            // Check Windows version (simulated)
            const isWin11 = navigator.userAgent.indexOf('Windows NT 11') !== -1 || 
                           (navigator.userAgent.indexOf('Windows NT 10') !== -1 && 
                            navigator.userAgent.indexOf('Build') !== -1);
            
            if (isWin11) {
                Logger.log('Running on Windows 11 x64', 'info');
            } else {
                Logger.log('Not running on Windows 11. Some features may not work correctly.', 'warning');
            }
        } else {
            Logger.log(`Detected OS: ${this.os}. This installer is optimized for Windows 11.`, 'warning');
        }
    }
    
    /**
     * Initialize UI components
     */
    initUI() {
        // Populate content area with installation form
        this.populateInstallationForm();
        
        // Update UI based on detected OS
        this.updateUIForOS();
    }
    
    /**
     * Populate the installation form
     */
    populateInstallationForm() {
        const contentArea = document.querySelector('.content');
        if (!contentArea) return;
        
        // Check if content is already populated
        if (contentArea.querySelector('#modeToggle')) return;
        
        // Add mode toggle
        const modeToggleHTML = `
            <div class="mode-switch">
                <label class="switch-label">
                    <span>Normal</span>
                    <div class="switch" style="margin: 0 10px;">
                        <input type="checkbox" id="modeToggle">
                        <span class="slider"></span>
                    </div>
                    <span>Advanced</span>
                </label>
            </div>
        `;
        
        // Add repository URL input
        const repoInputHTML = `
            <div class="form-group">
                <label for="repoUrl">GitHub Repository URL</label>
                <div class="input-group">
                    <input type="text" id="repoUrl" placeholder="https://github.com/username/repo.git">
                    <i class="fas fa-code-branch"></i>
                </div>
            </div>
        `;
        
        // Add template selection
        const templateSelectionHTML = `
            <div class="form-group">
                <label>MCP Server Template</label>
                <div class="template-grid">
                    <div class="template-card" data-template="basic-api">
                        <div class="template-badge beginner">Beginner</div>
                        <img src="https://via.placeholder.com/150?text=API+Server" alt="Basic API Server">
                        <h3>Basic API Server</h3>
                        <p>Simple REST API server with basic CRUD operations</p>
                    </div>
                    <div class="template-card" data-template="web-dashboard">
                        <div class="template-badge beginner">Beginner</div>
                        <img src="https://via.placeholder.com/150?text=Web+Dashboard" alt="Web Dashboard">
                        <h3>Web Dashboard</h3>
                        <p>Admin dashboard with user management</p>
                    </div>
                    <div class="template-card" data-template="data-processor">
                        <div class="template-badge intermediate">Intermediate</div>
                        <img src="https://via.placeholder.com/150?text=Data+Processor" alt="Data Processor">
                        <h3>Data Processor</h3>
                        <p>Background processing with task queue</p>
                    </div>
                    <div class="template-card" data-template="media-server">
                        <div class="template-badge intermediate">Intermediate</div>
                        <img src="https://via.placeholder.com/150?text=Media+Server" alt="Media Server">
                        <h3>Media Server</h3>
                        <p>File storage and streaming capabilities</p>
                    </div>
                    <div class="template-card" data-template="ml-inference">
                        <div class="template-badge advanced">Advanced</div>
                        <img src="https://via.placeholder.com/150?text=ML+Inference" alt="ML Inference">
                        <h3>ML Inference</h3>
                        <p>Machine learning model deployment</p>
                    </div>
                    <div class="template-card" data-template="full-stack">
                        <div class="template-badge advanced">Advanced</div>
                        <img src="https://via.placeholder.com/150?text=Full+Stack" alt="Full Stack">
                        <h3>Full Stack</h3>
                        <p>Complete application with frontend and backend</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add installation method selection
        const methodSelectionHTML = `
            <label>Installation Method</label>
            <div class="method-options">
                <div class="method-option" data-method="npx">
                    <i class="fab fa-node-js"></i>
                    <h3>npx</h3>
                    <p>Fastest method with Node.js</p>
                </div>
                <div class="method-option" data-method="uv">
                    <i class="fas fa-bolt"></i>
                    <h3>uv</h3>
                    <p>Universal package installer</p>
                </div>
                <div class="method-option" data-method="python">
                    <i class="fab fa-python"></i>
                    <h3>Python</h3>
                    <p>Works with pip</p>
                </div>
            </div>
        `;
        
        // Add installation path input
        const installPathHTML = `
            <div class="form-group">
                <label for="installPath">Installation Path (optional)</label>
                <div class="input-group">
                    <input type="text" id="installPath" placeholder="${Utils.getDefaultInstallPath()}">
                    <i class="fas fa-folder-open"></i>
                </div>
            </div>
        `;
        
        // Add advanced options
        const advancedOptionsHTML = `
            <div class="advanced-options" id="advancedOptions">
                <h3>Advanced Configuration</h3>
                
                <div class="tab-container">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="network">Network</button>
                        <button class="tab-btn" data-tab="environment">Environment</button>
                        <button class="tab-btn" data-tab="storage">Storage</button>
                        <button class="tab-btn" data-tab="security">Security</button>
                        <button class="tab-btn" data-tab="ai">AI Integration</button>
                    </div>
                    
                    <div class="tab-content active" id="network-tab">
                        <div class="form-group">
                            <label for="serverPort">Server Port</label>
                            <input type="number" id="serverPort" value="3000" min="0" max="65535">
                        </div>
                        <div class="form-group">
                            <label for="enableSSL">
                                <input type="checkbox" id="enableSSL"> Enable SSL/TLS
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="corsOrigin">CORS Allowed Origins</label>
                            <input type="text" id="corsOrigin" placeholder="*">
                        </div>
                    </div>
                    
                    <div class="tab-content" id="environment-tab">
                        <div class="form-group">
                            <label for="nodeEnv">Node Environment</label>
                            <select id="nodeEnv">
                                <option value="development">Development</option>
                                <option value="production">Production</option>
                                <option value="testing">Testing</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="logLevel">Log Level</label>
                            <select id="logLevel">
                                <option value="error">Error</option>
                                <option value="warn">Warning</option>
                                <option value="info" selected>Info</option>
                                <option value="debug">Debug</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="storage-tab">
                        <div class="form-group">
                            <label for="dataDir">Data Directory</label>
                            <input type="text" id="dataDir" placeholder="${Utils.getDefaultInstallPath()}/data">
                        </div>
                        <div class="form-group">
                            <label for="enablePersistence">
                                <input type="checkbox" id="enablePersistence" checked> Enable Data Persistence
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="backupInterval">Backup Interval (hours)</label>
                            <input type="number" id="backupInterval" value="24" min="1">
                        </div>
                    </div>
                    
                    <div class="tab-content" id="security-tab">
                        <div class="form-group">
                            <label for="authType">Authentication Type</label>
                            <select id="authType">
                                <option value="none">None</option>
                                <option value="basic">Basic Auth</option>
                                <option value="jwt" selected>JWT</option>
                                <option value="oauth">OAuth</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="jwtSecret">JWT Secret (if applicable)</label>
                            <input type="text" id="jwtSecret" placeholder="Generate a strong secret">
                            <button class="btn btn-outline" style="width: auto; margin-top: 5px;" id="generateSecret">Generate</button>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="ai-tab">
                        <div class="form-group">
                            <label for="geminiApiKey">Google Gemini 2.5 Pro API Key</label>
                            <input type="password" id="geminiApiKey" placeholder="Enter your Gemini API key">
                        </div>
                        <div class="form-group">
                            <label for="claudeApiKey">Claude Sonnet 3.7 API Key</label>
                            <input type="password" id="claudeApiKey" placeholder="Enter your Claude API key">
                        </div>
                        <div class="form-group">
                            <label for="aiAssistance">
                                <input type="checkbox" id="aiAssistance" checked> Enable AI-assisted installation
                            </label>
                            <p class="help-text">AI will help resolve installation issues automatically</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add install button
        const installButtonHTML = `
            <button id="installBtn" class="btn">
                <i class="fas fa-magic"></i> Install MCP Server
            </button>
        `;
        
        // Add progress container
        const progressContainerHTML = `
            <div class="progress-container" id="progressContainer">
                <div class="progress-title">
                    <span id="progressStatus">Preparing installation...</span>
                    <span id="progressPercent">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" id="progressBar"></div>
                </div>
                
                <div class="logs" id="logContainer">
                    <!-- Log messages will appear here -->
                </div>
            </div>
        `;
        
        // Combine all HTML
        contentArea.innerHTML = `
            ${modeToggleHTML}
            ${repoInputHTML}
            ${templateSelectionHTML}
            ${methodSelectionHTML}
            ${installPathHTML}
            ${advancedOptionsHTML}
            ${installButtonHTML}
            ${progressContainerHTML}
        `;
    }
    
    /**
     * Update UI based on detected OS
     */
    updateUIForOS() {
        // Set default installation path based on OS
        const installPathInput = document.getElementById('installPath');
        if (installPathInput) {
            installPathInput.placeholder = Utils.getDefaultInstallPath();
        }
        
        // Update data directory placeholder
        const dataDirInput = document.getElementById('dataDir');
        if (dataDirInput) {
            dataDirInput.placeholder = `${Utils.getDefaultInstallPath()}/data`;
        }
        
        // Add OS-specific notes
        if (this.os === 'windows') {
            // Windows-specific UI adjustments
            const methodOptions = document.querySelectorAll('.method-option');
            methodOptions.forEach(option => {
                if (option.dataset.method === 'npx') {
                    option.classList.add('selected');
                }
            });
        } else if (this.os === 'macos') {
            // macOS-specific UI adjustments
            Logger.log('This installer is optimized for Windows 11. Some features may not work correctly on macOS.', 'warning');
        } else if (this.os === 'linux') {
            // Linux-specific UI adjustments
            Logger.log('This installer is optimized for Windows 11. Some features may not work correctly on Linux.', 'warning');
        }
    }
    
    /**
     * Check for AI model API keys
     */
    checkAIModels() {
        // Check for stored API keys
        const geminiApiKey = localStorage.getItem('geminiApiKey');
        const claudeApiKey = localStorage.getItem('claudeApiKey');
        
        if (geminiApiKey) {
            this.aiModels.gemini.available = true;
            this.aiModels.gemini.apiKey = geminiApiKey;
            Logger.log('Google Gemini 2.5 Pro API key found', 'success');
        }
        
        if (claudeApiKey) {
            this.aiModels.claude.available = true;
            this.aiModels.claude.apiKey = claudeApiKey;
            Logger.log('Claude Sonnet 3.7 API key found', 'success');
        }
        
        // Update AI tab if it exists
        const geminiApiKeyInput = document.getElementById('geminiApiKey');
        const claudeApiKeyInput = document.getElementById('claudeApiKey');
        
        if (geminiApiKeyInput && this.aiModels.gemini.available) {
            geminiApiKeyInput.value = '••••••••••••••••';
        }
        
        if (claudeApiKeyInput && this.aiModels.claude.available) {
            claudeApiKeyInput.value = '••••••••••••••••';
        }
    }
    
    /**
     * Check system requirements
     */
    async checkSystemRequirements() {
        Logger.log('Checking system requirements...', 'info');
        
        const requirements = {
            node: true,
            npm: true,
            memory: true,
            disk: true,
            os: this.os === 'windows'
        };
        
        const results = await Utils.checkSystemRequirements(requirements);
        
        let allMet = true;
        for (const [requirement, met] of Object.entries(results)) {
            if (!met) {
                allMet = false;
                Logger.log(`System requirement not met: ${requirement}`, 'warning');
            }
        }
        
        if (allMet) {
            Logger.log('All system requirements met', 'success');
        } else {
            Logger.log('Some system requirements not met. Installation may not work correctly.', 'warning');
        }
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Mode toggle
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', () => {
                const advancedOptions = document.getElementById('advancedOptions');
                if (advancedOptions) {
                    advancedOptions.style.display = modeToggle.checked ? 'block' : 'none';
                }
            });
        }
        
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab') + '-tab';
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
        
        // Generate JWT secret
        const generateSecretBtn = document.getElementById('generateSecret');
        if (generateSecretBtn) {
            generateSecretBtn.addEventListener('click', () => {
                const jwtSecretInput = document.getElementById('jwtSecret');
                if (jwtSecretInput) {
                    jwtSecretInput.value = Utils.generateRandomString(32);
                }
            });
        }
        
        // Install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.startInstallation();
            });
        }
        
        // AI API key inputs
        const geminiApiKeyInput = document.getElementById('geminiApiKey');
        if (geminiApiKeyInput) {
            geminiApiKeyInput.addEventListener('change', () => {
                if (geminiApiKeyInput.value) {
                    localStorage.setItem('geminiApiKey', geminiApiKeyInput.value);
                    this.aiModels.gemini.available = true;
                    this.aiModels.gemini.apiKey = geminiApiKeyInput.value;
                    Logger.log('Google Gemini 2.5 Pro API key saved', 'success');
                }
            });
        }
        
        const claudeApiKeyInput = document.getElementById('claudeApiKey');
        if (claudeApiKeyInput) {
            claudeApiKeyInput.addEventListener('change', () => {
                if (claudeApiKeyInput.value) {
                    localStorage.setItem('claudeApiKey', claudeApiKeyInput.value);
                    this.aiModels.claude.available = true;
                    this.aiModels.claude.apiKey = claudeApiKeyInput.value;
                    Logger.log('Claude Sonnet 3.7 API key saved', 'success');
                }
            });
        }
    }
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        Logger.log('Welcome to the Claude Desktop MCP Installer for Windows 11', 'success');
        Logger.log('This installer will help you set up an MCP server with comprehensive verification', 'info');
        
        if (this.aiModels.gemini.available || this.aiModels.claude.available) {
            Logger.log('AI-assisted installation is enabled. AI will help resolve installation issues automatically.', 'info');
        } else {
            Logger.log('Add AI model API keys in Advanced Configuration > AI Integration for AI-assisted installation', 'info');
        }
    }
    
    /**
     * Start the installation process
     */
    startInstallation() {
        // Get form values
        const repoUrl = document.getElementById('repoUrl')?.value;
        const installPath = document.getElementById('installPath')?.value || Utils.getDefaultInstallPath();
        
        // Get selected template
        const selectedTemplateCard = document.querySelector('.template-card.selected');
        const templateId = selectedTemplateCard?.dataset.template || 'basic-api';
        
        // Get selected method
        const selectedMethodOption = document.querySelector('.method-option.selected');
        const methodId = selectedMethodOption?.dataset.method || 'npx';
        
        // Validate inputs
        if (!repoUrl) {
            Logger.log('Please enter a GitHub repository URL', 'error');
            return;
        }
        
        if (!Utils.isValidGitHubUrl(repoUrl)) {
            Logger.log('Please enter a valid GitHub repository URL', 'error');
            return;
        }
        
        // Show progress container
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        // Hide install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        
        // Start installation
        Logger.log(`Starting installation of ${templateId} template from ${repoUrl}`, 'info');
        Logger.log(`Using method: ${methodId.toUpperCase()}`, 'info');
        Logger.log(`Installation path: ${installPath}`, 'info');
        
        // Delegate to InstallationManager
        InstallationManager.install();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.MCPApp = new MCPInstallerApp();
});