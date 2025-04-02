/**
 * SecurityManager.js - Handles security features for MCP servers
 * Provides secure credential storage, HTTPS support, and permission management
 */

class SecurityManager {
    constructor() {
        this.credentials = {};
        this.permissions = {};
        this.encryptionKey = null;
        this.initialized = false;
        
        // Initialize secure storage
        this.initializeSecureStorage();
    }
    
    /**
     * Initialize secure storage for credentials
     * Uses the Web Crypto API for encryption/decryption
     */
    async initializeSecureStorage() {
        try {
            // Check if Web Crypto API is available
            if (window.crypto && window.crypto.subtle) {
                // Generate or retrieve encryption key
                this.encryptionKey = await this.getEncryptionKey();
                this.initialized = true;
                
                // Load stored credentials if available
                await this.loadStoredCredentials();
                
                console.info('Secure credential storage initialized');
            } else {
                console.warn('Web Crypto API not available, secure storage disabled');
            }
        } catch (error) {
            console.error('Error initializing secure storage:', error);
        }
    }
    
    /**
     * Get or generate encryption key
     * @returns {CryptoKey} Encryption key
     */
    async getEncryptionKey() {
        // Try to retrieve existing key from sessionStorage
        const storedKeyData = sessionStorage.getItem('mcp_encryption_key');
        
        if (storedKeyData) {
            try {
                // Convert stored key data to ArrayBuffer
                const keyData = this.base64ToArrayBuffer(storedKeyData);
                
                // Import the key
                return await window.crypto.subtle.importKey(
                    'raw',
                    keyData,
                    { name: 'AES-GCM' },
                    false, // not extractable
                    ['encrypt', 'decrypt']
                );
            } catch (error) {
                console.warn('Error importing stored encryption key, generating new one:', error);
            }
        }
        
        // Generate a new encryption key
        const key = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );
        
        // Export the key and store it in sessionStorage
        try {
            const exportedKey = await window.crypto.subtle.exportKey('raw', key);
            const keyData = this.arrayBufferToBase64(exportedKey);
            sessionStorage.setItem('mcp_encryption_key', keyData);
        } catch (error) {
            console.warn('Error storing encryption key:', error);
        }
        
        return key;
    }
    
    /**
     * Load stored credentials from localStorage
     */
    async loadStoredCredentials() {
        try {
            const encryptedData = localStorage.getItem('mcp_credentials');
            
            if (encryptedData && this.initialized) {
                const credentials = await this.decryptData(encryptedData);
                if (credentials) {
                    this.credentials = credentials;
                }
            }
        } catch (error) {
            console.error('Error loading stored credentials:', error);
        }
    }
    
    /**
     * Save credentials to localStorage
     */
    async saveCredentials() {
        try {
            if (this.initialized) {
                const encryptedData = await this.encryptData(this.credentials);
                localStorage.setItem('mcp_credentials', encryptedData);
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    }
    
    /**
     * Store credentials for a server
     * @param {string} serverId - Server ID
     * @param {Object} credentials - Credentials object
     * @returns {Promise<boolean>} Success status
     */
    async storeCredentials(serverId, credentials) {
        try {
            if (!this.initialized) {
                throw new Error('Secure storage not initialized');
            }
            
            // Validate credentials
            if (!credentials || typeof credentials !== 'object') {
                throw new Error('Invalid credentials format');
            }
            
            // Store credentials
            this.credentials[serverId] = {
                ...credentials,
                timestamp: Date.now()
            };
            
            // Save to localStorage
            await this.saveCredentials();
            
            return true;
        } catch (error) {
            console.error('Error storing credentials:', error);
            return false;
        }
    }
    
    /**
     * Retrieve credentials for a server
     * @param {string} serverId - Server ID
     * @returns {Promise<Object|null>} Credentials object or null if not found
     */
    async getCredentials(serverId) {
        try {
            if (!this.initialized) {
                throw new Error('Secure storage not initialized');
            }
            
            return this.credentials[serverId] || null;
        } catch (error) {
            console.error('Error retrieving credentials:', error);
            return null;
        }
    }
    
    /**
     * Delete credentials for a server
     * @param {string} serverId - Server ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCredentials(serverId) {
        try {
            if (!this.initialized) {
                throw new Error('Secure storage not initialized');
            }
            
            if (this.credentials[serverId]) {
                delete this.credentials[serverId];
                await this.saveCredentials();
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting credentials:', error);
            return false;
        }
    }
    
    /**
     * Encrypt data using AES-GCM
     * @param {Object} data - Data to encrypt
     * @returns {Promise<string>} Encrypted data as base64 string
     */
    async encryptData(data) {
        if (!this.initialized) {
            throw new Error('Secure storage not initialized');
        }
        
        // Convert data to string
        const dataString = JSON.stringify(data);
        const dataBuffer = new TextEncoder().encode(dataString);
        
        // Generate initialization vector (IV)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt data
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            this.encryptionKey,
            dataBuffer
        );
        
        // Combine IV and encrypted data
        const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combinedBuffer.set(iv, 0);
        combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
        
        // Convert to base64
        return this.arrayBufferToBase64(combinedBuffer);
    }
    
    /**
     * Decrypt data using AES-GCM
     * @param {string} encryptedData - Encrypted data as base64 string
     * @returns {Promise<Object>} Decrypted data
     */
    async decryptData(encryptedData) {
        if (!this.initialized) {
            throw new Error('Secure storage not initialized');
        }
        
        try {
            // Convert base64 to ArrayBuffer
            const dataBuffer = this.base64ToArrayBuffer(encryptedData);
            
            // Extract IV and encrypted data
            const iv = dataBuffer.slice(0, 12);
            const encryptedBuffer = dataBuffer.slice(12);
            
            // Decrypt data
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                this.encryptionKey,
                encryptedBuffer
            );
            
            // Convert to string and parse JSON
            const decryptedString = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    }
    
    /**
     * Convert ArrayBuffer to base64 string
     * @param {ArrayBuffer} buffer - ArrayBuffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    
    /**
     * Convert base64 string to ArrayBuffer
     * @param {string} base64 - Base64 string to convert
     * @returns {ArrayBuffer} ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    /**
     * Set permission for a server
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @param {boolean} value - Permission value
     */
    setPermission(serverId, permission, value) {
        if (!this.permissions[serverId]) {
            this.permissions[serverId] = {};
        }
        
        this.permissions[serverId][permission] = value;
        
        // Save permissions to localStorage
        this.savePermissions();
    }
    
    /**
     * Check if a server has a permission
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @returns {boolean} Whether the server has the permission
     */
    hasPermission(serverId, permission) {
        if (!this.permissions[serverId]) {
            return false;
        }
        
        return !!this.permissions[serverId][permission];
    }
    
    /**
     * Save permissions to localStorage
     */
    savePermissions() {
        try {
            localStorage.setItem('mcp_permissions', JSON.stringify(this.permissions));
        } catch (error) {
            console.error('Error saving permissions:', error);
        }
    }
    
    /**
     * Load permissions from localStorage
     */
    loadPermissions() {
        try {
            const storedPermissions = localStorage.getItem('mcp_permissions');
            
            if (storedPermissions) {
                this.permissions = JSON.parse(storedPermissions);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    }
}

// Create singleton instance
const securityManager = new SecurityManager();

// Export for use in other modules
export default securityManager;
