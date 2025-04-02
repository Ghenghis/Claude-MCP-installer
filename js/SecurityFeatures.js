/**
 * SecurityFeatures.js - Main module for enhanced security features
 * Integrates secure credential storage, HTTPS support, and permission management
 */

import securityManager from './SecurityManager.js';
import httpsManager from './HttpsManager.js';
import permissionManager from './PermissionManager.js';

class SecurityFeatures {
    constructor() {
        // Reference to individual managers
        this.credentialManager = securityManager;
        this.httpsManager = httpsManager;
        this.permissionManager = permissionManager;
        
        // Initialize security features
        this.initialized = false;
        this.initializeSecurity();
    }
    
    /**
     * Initialize security features
     */
    async initializeSecurity() {
        try {
            // Wait for all managers to initialize
            await Promise.all([
                this.waitForManager(this.credentialManager, 'initialized'),
                this.waitForManager(this.httpsManager, 'httpsEnabled', 1000),
                this.waitForManager(this.permissionManager, 'roles', 1000)
            ]);
            
            this.initialized = true;
            console.info('Security features initialized');
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('security-initialized'));
        } catch (error) {
            console.error('Error initializing security features:', error);
        }
    }
    
    /**
     * Wait for a manager property to be available
     * @param {Object} manager - Manager object
     * @param {string} property - Property to wait for
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<void>} Promise that resolves when property is available
     */
    waitForManager(manager, property, timeout = 2000) {
        return new Promise((resolve, reject) => {
            // If property already exists, resolve immediately
            if (manager[property] !== undefined) {
                resolve();
                return;
            }
            
            // Set timeout
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout waiting for ${property}`));
            }, timeout);
            
            // Check property every 100ms
            const interval = setInterval(() => {
                if (manager[property] !== undefined) {
                    clearInterval(interval);
                    clearTimeout(timeoutId);
                    resolve();
                }
            }, 100);
        });
    }
    
    /**
     * Check if security features are initialized
     * @returns {boolean} Whether security features are initialized
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Store credentials for a server
     * @param {string} serverId - Server ID
     * @param {Object} credentials - Credentials object
     * @returns {Promise<boolean>} Success status
     */
    async storeCredentials(serverId, credentials) {
        return this.credentialManager.storeCredentials(serverId, credentials);
    }
    
    /**
     * Retrieve credentials for a server
     * @param {string} serverId - Server ID
     * @returns {Promise<Object|null>} Credentials object or null if not found
     */
    async getCredentials(serverId) {
        return this.credentialManager.getCredentials(serverId);
    }
    
    /**
     * Delete credentials for a server
     * @param {string} serverId - Server ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCredentials(serverId) {
        return this.credentialManager.deleteCredentials(serverId);
    }
    
    /**
     * Enable HTTPS for a server
     * @param {string} serverId - Server ID
     * @param {Object} config - Server configuration
     * @returns {boolean} Success status
     */
    enableHttps(serverId, config) {
        return this.httpsManager.enableHttpsForServer(serverId, config);
    }
    
    /**
     * Disable HTTPS for a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    disableHttps(serverId) {
        return this.httpsManager.disableHttpsForServer(serverId);
    }
    
    /**
     * Check if HTTPS is enabled for a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Whether HTTPS is enabled
     */
    isHttpsEnabled(serverId) {
        return this.httpsManager.isHttpsEnabled(serverId);
    }
    
    /**
     * Get HTTPS URL for a server
     * @param {string} serverId - Server ID
     * @returns {string|null} HTTPS URL or null if HTTPS is not enabled
     */
    getHttpsUrl(serverId) {
        return this.httpsManager.getHttpsUrl(serverId);
    }
    
    /**
     * Generate a self-signed certificate for a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Certificate options
     * @returns {Promise<Object>} Certificate data
     */
    async generateCertificate(serverId, options = {}) {
        return this.httpsManager.generateSelfSignedCertificate(serverId, options);
    }
    
    /**
     * Check if a user has permission for an action
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} [serverId] - Server ID (optional)
     * @returns {boolean} Whether the user has permission
     */
    hasPermission(userId, permission, serverId = null) {
        return this.permissionManager.hasPermission(userId, permission, serverId);
    }
    
    /**
     * Set role for a user
     * @param {string} userId - User ID
     * @param {string} role - Role name
     * @returns {boolean} Success status
     */
    setUserRole(userId, role) {
        return this.permissionManager.setUserRole(userId, role);
    }
    
    /**
     * Get role for a user
     * @param {string} userId - User ID
     * @returns {string} Role name
     */
    getUserRole(userId) {
        return this.permissionManager.getUserRole(userId);
    }
    
    /**
     * Grant permission to a user for a server
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    grantPermission(userId, permission, serverId) {
        return this.permissionManager.grantPermission(userId, permission, serverId);
    }
    
    /**
     * Revoke permission from a user for a server
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    revokePermission(userId, permission, serverId) {
        return this.permissionManager.revokePermission(userId, permission, serverId);
    }
    
    /**
     * Get all available roles
     * @returns {Object} Roles object
     */
    getRoles() {
        return this.permissionManager.getRoles();
    }
    
    /**
     * Get permissions for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Server permissions
     */
    getServerPermissions(serverId) {
        return this.permissionManager.getServerPermissions(serverId);
    }
    
    /**
     * Create a secure server configuration object
     * @param {string} serverId - Server ID
     * @param {Object} baseConfig - Base server configuration
     * @returns {Object} Secure server configuration
     */
    createSecureServerConfig(serverId, baseConfig) {
        const config = { ...baseConfig };
        
        // Add HTTPS configuration if enabled
        if (this.isHttpsEnabled(serverId)) {
            config.https = this.httpsManager.createNodeHttpsConfig(serverId);
            config.useHttps = true;
        }
        
        // Add permission configuration
        config.permissions = this.getServerPermissions(serverId);
        
        return config;
    }
    
    /**
     * Secure an existing server
     * @param {string} serverId - Server ID
     * @param {Object} serverConfig - Server configuration
     * @returns {Object} Updated server configuration with security features
     */
    secureServer(serverId, serverConfig) {
        try {
            const config = { ...serverConfig };
            
            // Enable HTTPS if not already enabled
            if (!this.isHttpsEnabled(serverId) && config.enableHttps !== false) {
                this.enableHttps(serverId, config);
                
                // Generate certificate if needed
                if (!this.httpsManager.getCertificateInfo(serverId)) {
                    this.generateCertificate(serverId, {
                        subject: config.host || 'localhost'
                    });
                }
            }
            
            // Set default permissions if none exist
            const permissions = this.getServerPermissions(serverId);
            if (!permissions.roleGranted || Object.keys(permissions.roleGranted).length === 0) {
                // Grant basic permissions to operator role
                this.permissionManager.grantRolePermission('operator', 'server:view', serverId);
                this.permissionManager.grantRolePermission('operator', 'server:start', serverId);
                this.permissionManager.grantRolePermission('operator', 'server:stop', serverId);
                this.permissionManager.grantRolePermission('operator', 'server:logs', serverId);
                
                // Grant view permissions to viewer role
                this.permissionManager.grantRolePermission('viewer', 'server:view', serverId);
                this.permissionManager.grantRolePermission('viewer', 'server:logs', serverId);
            }
            
            // Create secure configuration
            return this.createSecureServerConfig(serverId, config);
        } catch (error) {
            console.error('Error securing server:', error);
            return serverConfig;
        }
    }
}

// Create singleton instance
const securityFeatures = new SecurityFeatures();

// Export for use in other modules
export default securityFeatures;
