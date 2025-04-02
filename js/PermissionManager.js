/**
 * PermissionManager.js - Handles permission management for MCP servers
 * Provides role-based access control for server management
 */

class PermissionManager {
    constructor() {
        this.roles = {
            admin: {
                name: 'Administrator',
                description: 'Full access to all servers and features',
                permissions: ['*']
            },
            operator: {
                name: 'Operator',
                description: 'Can manage servers but cannot modify system settings',
                permissions: [
                    'server:view', 'server:start', 'server:stop', 'server:restart',
                    'server:logs', 'server:config:view', 'server:config:edit'
                ]
            },
            viewer: {
                name: 'Viewer',
                description: 'Can view servers and logs but cannot modify anything',
                permissions: [
                    'server:view', 'server:logs'
                ]
            }
        };
        
        this.userRoles = {};
        this.serverPermissions = {};
        
        // Initialize permission system
        this.initializePermissions();
    }
    
    /**
     * Initialize permission system
     */
    initializePermissions() {
        try {
            // Load user roles and server permissions from localStorage
            this.loadUserRoles();
            this.loadServerPermissions();
            
            // Set default roles if none exist
            if (Object.keys(this.userRoles).length === 0) {
                this.userRoles['default'] = 'admin';
                this.saveUserRoles();
            }
            
            console.info('Permission system initialized');
        } catch (error) {
            console.error('Error initializing permission system:', error);
        }
    }
    
    /**
     * Helper method to load JSON data from localStorage
     * @param {string} key - The localStorage key
     * @param {*} defaultValue - The default value to return on error or if not found
     * @returns {*} The loaded data or the default value
     * @private
     */
    _loadFromLocalStorage(key, defaultValue = {}) {
        try {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : defaultValue;
        } catch (error) {
            console.error(`Error loading data from localStorage key "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Helper method to save JSON data to localStorage
     * @param {string} key - The localStorage key
     * @param {*} data - The data to save
     * @private
     */
    _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving data to localStorage key "${key}":`, error);
        }
    }

    /**
     * Load user roles from localStorage
     */
    loadUserRoles() {
        this.userRoles = this._loadFromLocalStorage('mcp_user_roles', {});
    }
     
    /**
     * Save user roles to localStorage
     */
    saveUserRoles() {
        this._saveToLocalStorage('mcp_user_roles', this.userRoles);
    }
     
    /**
     * Load server permissions from localStorage
     */
    loadServerPermissions() {
        this.serverPermissions = this._loadFromLocalStorage('mcp_server_permissions', {});
    }
     
    /**
     * Save server permissions to localStorage
     */
    saveServerPermissions() {
        this._saveToLocalStorage('mcp_server_permissions', this.serverPermissions);
    }
    
    /**
     * Set role for a user
     * @param {string} userId - User ID
     * @param {string} role - Role name
     * @returns {boolean} Success status
     */
    setUserRole(userId, role) {
        try {
            if (!this.roles[role]) {
                throw new Error(`Invalid role: ${role}`);
            }
            
            this.userRoles[userId] = role;
            this.saveUserRoles();
            
            return true;
        } catch (error) {
            console.error('Error setting user role:', error);
            return false;
        }
    }
    
    /**
     * Get role for a user
     * @param {string} userId - User ID
     * @returns {string} Role name
     */
    getUserRole(userId) {
        return this.userRoles[userId] || this.userRoles['default'] || 'viewer';
    }
    
    /**
     * Check if a user has a permission
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} [serverId] - Server ID (optional)
     * @returns {boolean} Whether the user has the permission
     */
    hasPermission(userId, permission, serverId = null) {
        try {
            const role = this.getUserRole(userId);
            const rolePermissions = this.roles[role]?.permissions || [];

            // Check for wildcard permission
            if (rolePermissions.includes('*')) {
                return true;
            }

            // Check if role has the general permission
            const hasRolePermission = rolePermissions.includes(permission);

            // If no server ID is provided or no server-specific rules exist, rely on role permission
            if (!serverId || !this.serverPermissions[serverId]) {
                return hasRolePermission;
            }

            // Check server-specific overrides if the role has the general permission
            if (hasRolePermission) {
                 const serverOverride = this._checkServerSpecificPermission(userId, role, permission, serverId);
                 // If there's a specific override (true for grant, false for deny), use it.
                 // Otherwise (null), rely on the general role permission.
                 return serverOverride !== null ? serverOverride : true;
            } 
            // If the role doesn't have the general permission, check if there is a specific grant for this server
            else {
                const serverGrant = this._checkServerSpecificPermission(userId, role, permission, serverId);
                // Only return true if specifically granted on the server level
                return serverGrant === true; 
            }

        } catch (error) {
            console.error(`Error checking permission for user ${userId}, permission ${permission}:`, error);
            return false; // Default to deny on error
        }
    }

    /**
     * Helper method to check server-specific permission overrides.
     * Returns true if granted, false if denied, null if no specific override.
     * @param {string} userId
     * @param {string} role
     * @param {string} permission
     * @param {string} serverId
     * @returns {boolean | null}
     * @private
     */
    _checkServerSpecificPermission(userId, role, permission, serverId) {
        const serverPerms = this.serverPermissions[serverId];
        if (!serverPerms) return null; // No specific rules for this server

        // Check user-specific denial first (highest priority)
        if (serverPerms.userDenied?.[userId]?.includes(permission)) {
            return false;
        }

        // Check user-specific grant
        if (serverPerms.userGranted?.[userId]?.includes(permission)) {
            return true;
        }

        // Check role-specific denial
        if (serverPerms.roleDenied?.[role]?.includes(permission)) {
            return false;
        }

        // Check role-specific grant
        if (serverPerms.roleGranted?.[role]?.includes(permission)) {
            return true;
        }
        
        return null; // No specific override found for this user/role/permission on this server
    }

    /**
     * Private helper to add a permission to a specific list for a server.
     * Handles initialization of nested structures.
     * @param {string} serverId - The ID of the server.
     * @param {'userGranted'|'userDenied'|'roleGranted'|'roleDenied'} listType - The type of list to modify.
     * @param {string} identifier - The userId or role name.
     * @param {string} permission - The permission string to add.
     * @returns {boolean} - True if the permission was added or already existed, false on error.
     * @private
     */
    _addPermissionToServerList(serverId, listType, identifier, permission) {
        try {
            // Use short-circuit evaluation to ensure nested objects/arrays exist
            const serverPerms = this.serverPermissions[serverId] = this.serverPermissions[serverId] || {};
            const list = serverPerms[listType] = serverPerms[listType] || {};
            const permissionsList = list[identifier] = list[identifier] || [];

            // Add permission if it doesn't already exist
            if (!permissionsList.includes(permission)) {
                permissionsList.push(permission);
            }

            this.saveServerPermissions();
            return true;
        } catch (error) {
            console.error(`Error adding permission (${permission}) to ${listType} for ${identifier} on server ${serverId}:`, error);
            return false;
        }
    }

    /**
     * Grant permission to a user for a server
     * @param {string} userId - User ID
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @returns {boolean} Success status
     */
    grantUserPermissionForServer(userId, serverId, permission) {
        return this._addPermissionToServerList(serverId, 'userGranted', userId, permission);
    }

    /**
     * Revoke permission from a user for a server (adds to denied list)
     * @param {string} userId - User ID
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @returns {boolean} Success status
     */
    revokeUserPermissionForServer(userId, serverId, permission) {
        // Note: This implementation adds to 'denied'. A different implementation
        // might remove from 'granted'. This follows the original structure.
        return this._addPermissionToServerList(serverId, 'userDenied', userId, permission);
    }

    /**
     * Clear specific user permissions for a server
     * @param {string} userId - User ID
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    clearUserPermissionsForServer(userId, serverId) {
        try {
            if (this.serverPermissions[serverId]) {
                if (this.serverPermissions[serverId].userGranted) {
                    delete this.serverPermissions[serverId].userGranted[userId];
                }
                if (this.serverPermissions[serverId].userDenied) {
                    delete this.serverPermissions[serverId].userDenied[userId];
                }
                this.saveServerPermissions();
            }
            return true;
        } catch (error) {
            console.error('Error clearing user permissions for server:', error);
            return false;
        }
    }

    /**
     * Grant permission to a role for a server
     * @param {string} role - Role name
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @returns {boolean} Success status
     */
    grantRolePermissionForServer(role, serverId, permission) {
        return this._addPermissionToServerList(serverId, 'roleGranted', role, permission);
    }

    /**
     * Revoke permission from a role for a server (adds to denied list)
     * @param {string} role - Role name
     * @param {string} serverId - Server ID
     * @param {string} permission - Permission name
     * @returns {boolean} Success status
     */
    revokeRolePermissionForServer(role, serverId, permission) {
        // Note: This implementation adds to 'denied'. A different implementation
        // might remove from 'granted'. This follows the original structure.
        return this._addPermissionToServerList(serverId, 'roleDenied', role, permission);
    }

    /**
     * Clear specific role permissions for a server
     * @param {string} role - Role name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    clearRolePermissionsForServer(role, serverId) {
        try {
            if (this.serverPermissions[serverId]) {
                if (this.serverPermissions[serverId].roleGranted) {
                    delete this.serverPermissions[serverId].roleGranted[role];
                }
                if (this.serverPermissions[serverId].roleDenied) {
                    delete this.serverPermissions[serverId].roleDenied[role];
                }
                this.saveServerPermissions();
            }
            return true;
        } catch (error) {
            console.error('Error clearing role permissions for server:', error);
            return false;
        }
    }

    /**
     * Get all roles defined in the system
     * @returns {object} Dictionary of roles
     */
    getRoles() {
        return { ...this.roles };
    }

    /**
     * Get permissions for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Server permissions
     */
    getServerPermissions(serverId) {
        return this.serverPermissions[serverId] || {
            userGranted: {},
            userDenied: {},
            roleGranted: {},
            roleDenied: {}
        };
    }

    /**
     * Reset permissions for a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    resetServerPermissions(serverId) {
        try {
            if (this.serverPermissions[serverId]) {
                delete this.serverPermissions[serverId];
                this.saveServerPermissions();
            }

            return true;
        } catch (error) {
            console.error('Error resetting server permissions:', error);
            return false;
        }
    }

    /**
     * Create a new role
     * @param {string} roleName - Role name
     * @param {Object} roleConfig - Role configuration
     * @returns {boolean} Success status
     */
    createRole(roleName, roleConfig) {
        try {
            if (this.roles[roleName]) {
                throw new Error(`Role already exists: ${roleName}`);
            }

            this.roles[roleName] = {
                name: roleConfig.name || roleName,
                description: roleConfig.description || '',
                permissions: roleConfig.permissions || []
            };

            // Save roles to localStorage
            this.saveRoles();

            return true;
        } catch (error) {
            console.error('Error creating role:', error);
            return false;
        }
    }

    /**
     * Update an existing role
     * @param {string} roleName - Role name
     * @param {Object} roleConfig - Role configuration
     * @returns {boolean} Success status
     */
    updateRole(roleName, roleConfig) {
        try {
            if (!this.roles[roleName]) {
                throw new Error(`Role does not exist: ${roleName}`);
            }

            // Update role properties
            if (roleConfig.name) {
                this.roles[roleName].name = roleConfig.name;
            }

            if (roleConfig.description) {
                this.roles[roleName].description = roleConfig.description;
            }

            if (roleConfig.permissions) {
                this.roles[roleName].permissions = roleConfig.permissions;
            }

            // Save roles to localStorage
            this.saveRoles();

            return true;
        } catch (error) {
            console.error('Error updating role:', error);
            return false;
        }
    }

    /**
     * Delete a role
     * @param {string} roleName - Role name
     * @returns {boolean} Success status
     */
    deleteRole(roleName) {
        try {
            if (!this.roles[roleName]) {
                throw new Error(`Role does not exist: ${roleName}`);
            }

            // Cannot delete built-in roles
            if (['admin', 'operator', 'viewer'].includes(roleName)) {
                throw new Error(`Cannot delete built-in role: ${roleName}`);
            }

            // Remove role
            delete this.roles[roleName];

            // Update users with this role to default role
            Object.keys(this.userRoles).forEach(userId => {
                if (this.userRoles[userId] === roleName) {
                    this.userRoles[userId] = 'viewer';
                }
            });

            // Save roles and user roles
            this.saveRoles();
            this.saveUserRoles();

            return true;
        } catch (error) {
            console.error('Error deleting role:', error);
            return false;
        }
    }

    /**
     * Save roles to localStorage
     */
    saveRoles() {
        try {
            localStorage.setItem('mcp_roles', JSON.stringify(this.roles));
        } catch (error) {
            console.error('Error saving roles:', error);
        }
    }
}

// Create singleton instance
const permissionManager = new PermissionManager();

// Export for use in other modules
export default permissionManager;
