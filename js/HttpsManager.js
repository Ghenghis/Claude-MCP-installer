/**
 * HttpsManager.js - Handles HTTPS support for local server communication
 * Provides secure communication between the MCP installer and local servers
 */

class HttpsManager {
    constructor() {
        this.certificates = {};
        this.httpsEnabled = false;
        this.serverConfigs = {};
        
        // Initialize HTTPS support
        this.initializeHttpsSupport();
    }
    
    /**
     * Initialize HTTPS support
     */
    initializeHttpsSupport() {
        try {
            // Check if we're in a secure context
            this.httpsEnabled = window.isSecureContext;
            
            if (this.httpsEnabled) {
                console.info('HTTPS support initialized in secure context');
                this.loadServerConfigs();
            } else {
                console.warn('Not in a secure context, HTTPS support limited');
            }
        } catch (error) {
            console.error('Error initializing HTTPS support:', error);
        }
    }
    
    /**
     * Load server configurations from localStorage
     */
    loadServerConfigs() {
        try {
            const storedConfigs = localStorage.getItem('mcp_server_configs');
            
            if (storedConfigs) {
                this.serverConfigs = JSON.parse(storedConfigs);
                
                // Update HTTPS settings for each server
                Object.keys(this.serverConfigs).forEach(serverId => {
                    const config = this.serverConfigs[serverId];
                    if (config.useHttps) {
                        this.enableHttpsForServer(serverId, config);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading server configurations:', error);
        }
    }
    
    /**
     * Save server configurations to localStorage
     */
    saveServerConfigs() {
        try {
            localStorage.setItem('mcp_server_configs', JSON.stringify(this.serverConfigs));
        } catch (error) {
            console.error('Error saving server configurations:', error);
        }
    }
    
    /**
     * Enable HTTPS for a server
     * @param {string} serverId - Server ID
     * @param {Object} config - Server configuration
     * @returns {boolean} Success status
     */
    enableHttpsForServer(serverId, config) {
        try {
            if (!this.httpsEnabled) {
                console.warn('Cannot enable HTTPS in non-secure context');
                return false;
            }
            
            // Update server configuration
            this.serverConfigs[serverId] = {
                ...config,
                useHttps: true,
                httpsPort: config.httpsPort || this.getDefaultHttpsPort(config.port),
                certificate: config.certificate || null
            };
            
            // Save updated configurations
            this.saveServerConfigs();
            
            return true;
        } catch (error) {
            console.error('Error enabling HTTPS for server:', error);
            return false;
        }
    }
    
    /**
     * Disable HTTPS for a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    disableHttpsForServer(serverId) {
        try {
            if (this.serverConfigs[serverId]) {
                this.serverConfigs[serverId].useHttps = false;
                this.saveServerConfigs();
            }
            
            return true;
        } catch (error) {
            console.error('Error disabling HTTPS for server:', error);
            return false;
        }
    }
    
    /**
     * Get default HTTPS port based on HTTP port
     * @param {number} httpPort - HTTP port
     * @returns {number} HTTPS port
     */
    getDefaultHttpsPort(httpPort) {
        // Common HTTP to HTTPS port mappings
        const portMappings = {
            80: 443,    // Default HTTP -> HTTPS
            8080: 8443, // Common alternative
            3000: 3443, // Common for Node.js
            5000: 5443, // Common for Python
            4000: 4443, // Common for Ruby
            8000: 8443  // Common for Django
        };
        
        return portMappings[httpPort] || httpPort + 443 - 80; // Default to adding the difference between 443 and 80
    }
    
    /**
     * Generate a self-signed certificate for local development
     * @param {string} serverId - Server ID
     * @param {Object} options - Certificate options
     * @returns {Promise<Object>} Certificate data
     */
    async generateSelfSignedCertificate(serverId, options = {}) {
        try {
            if (!this.httpsEnabled) {
                throw new Error('Cannot generate certificate in non-secure context');
            }
            
            // In a real implementation, we would use a library or service to generate a certificate
            // For this demo, we'll just create a placeholder
            const certificate = {
                subject: options.subject || `localhost-${serverId}`,
                issuer: 'MCP Installer Self-Signed',
                validFrom: new Date(),
                validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
                fingerprint: this.generateRandomFingerprint(),
                generated: Date.now()
            };
            
            // Store certificate
            this.certificates[serverId] = certificate;
            
            // Update server configuration
            if (this.serverConfigs[serverId]) {
                this.serverConfigs[serverId].certificate = certificate;
                this.saveServerConfigs();
            }
            
            return certificate;
        } catch (error) {
            console.error('Error generating self-signed certificate:', error);
            return null;
        }
    }
    
    /**
     * Generate a random certificate fingerprint (for demo purposes)
     * @returns {string} Certificate fingerprint
     */
    generateRandomFingerprint() {
        const hex = '0123456789ABCDEF';
        let fingerprint = '';
        
        for (let i = 0; i < 40; i++) {
            fingerprint += hex[Math.floor(Math.random() * 16)];
            if (i % 2 === 1 && i < 39) {
                fingerprint += ':';
            }
        }
        
        return fingerprint;
    }
    
    /**
     * Get HTTPS URL for a server
     * @param {string} serverId - Server ID
     * @returns {string|null} HTTPS URL or null if HTTPS is not enabled
     */
    getHttpsUrl(serverId) {
        try {
            const config = this.serverConfigs[serverId];
            
            if (!config || !config.useHttps) {
                return null;
            }
            
            const host = config.host || 'localhost';
            const port = config.httpsPort || this.getDefaultHttpsPort(config.port);
            
            return `https://${host}:${port}`;
        } catch (error) {
            console.error('Error getting HTTPS URL:', error);
            return null;
        }
    }
    
    /**
     * Validates if a server configuration meets HTTPS requirements
     * @param {string} serverId - Server ID
     * @param {Object|undefined} config - Server configuration object
     * @returns {boolean} True if configuration is valid for HTTPS
     * @private
     */
    _isHttpsConfigValid(serverId, config) {
        // Check if config exists
        if (!config) {
            logger.debug(`[HTTPS Manager] No config found for server ${serverId}`);
            return false;
        }
        
        // Check if HTTPS is enabled
        if (!config.useHttps) {
            logger.debug(`[HTTPS Manager] HTTPS not enabled for server ${serverId}`);
            return false;
        }
        
        // Check if certificate exists
        if (!config.certificate) {
            logger.debug(`[HTTPS Manager] Certificate missing for server ${serverId}`);
            return false;
        }
        
        return true;
    }

    /**
     * Create HTTPS server configuration for a Node.js server
     * @param {string} serverId - Server ID
     * @returns {Object|null} HTTPS server configuration
     */
    createNodeHttpsConfig(serverId) {
        try {
            const config = this.serverConfigs[serverId];
            
            // Validate configuration requirements for HTTPS
            if (!this._isHttpsConfigValid(serverId, config)) {
                return null;
            }
            
            // In a real implementation, we would generate actual key and cert files
            // For this demo, we'll just return a placeholder configuration
            return {
                key: `-----BEGIN PRIVATE KEY-----\n[Private key for ${serverId}]\n-----END PRIVATE KEY-----`,
                cert: `-----BEGIN CERTIFICATE-----\n[Certificate for ${serverId}]\n-----END CERTIFICATE-----`,
                port: config.httpsPort,
                host: config.host || 'localhost'
            };
        } catch (error) {
            console.error('Error creating Node.js HTTPS configuration:', error);
            return null;
        }
    }
    
    /**
     * Check if a server has HTTPS enabled
     * @param {string} serverId - Server ID
     * @returns {boolean} Whether HTTPS is enabled
     */
    isHttpsEnabled(serverId) {
        try {
            const config = this.serverConfigs[serverId];
            return !!(config && config.useHttps);
        } catch (error) {
            console.error('Error checking HTTPS status:', error);
            return false;
        }
    }
    
    /**
     * Get certificate information for a server
     * @param {string} serverId - Server ID
     * @returns {Object|null} Certificate information
     */
    getCertificateInfo(serverId) {
        try {
            const config = this.serverConfigs[serverId];
            return (config && config.certificate) || null;
        } catch (error) {
            console.error('Error getting certificate information:', error);
            return null;
        }
    }
}

// Create singleton instance
const httpsManager = new HttpsManager();

// Export for use in other modules
export default httpsManager;
