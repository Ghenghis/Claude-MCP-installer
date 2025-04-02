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
     * Load user roles from localStorage
     */
    loadUserRoles() {
        try {
            const storedRoles = localStorage.getItem('mcp_user_roles');
            
            if (storedRoles) {
                this.userRoles = JSON.parse(storedRoles);
            }
        } catch (error) {
            console.error('Error loading user roles:', error);
        }
    }
    
    /**
     * Save user roles to localStorage
     */
    saveUserRoles() {
        try {
            localStorage.setItem('mcp_user_roles', JSON.stringify(this.userRoles));
        } catch (error) {
            console.error('Error saving user roles:', error);
        }
    }
    
    /**
     * Load server permissions from localStorage
     */
    loadServerPermissions() {
        try {
            const storedPermissions = localStorage.getItem('mcp_server_permissions');
            
            if (storedPermissions) {
                this.serverPermissions = JSON.parse(storedPermissions);
            }
        } catch (error) {
            console.error('Error loading server permissions:', error);
        }
    }
    
    /**
     * Save server permissions to localStorage
     */
    saveServerPermissions() {
        try {
            localStorage.setItem('mcp_server_permissions', JSON.stringify(this.serverPermissions));
        } catch (error) {
            console.error('Error saving server permissions:', error);
        }
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
            // Get user role
            const role = this.getUserRole(userId);
            const rolePermissions = this.roles[role]?.permissions || [];
            
            // Check if role has wildcard permission
            if (rolePermissions.includes('*')) {
                return true;
            }
            
            // Check if role has the specific permission
            if (rolePermissions.includes(permission)) {
                // If no server ID is specified, or no server-specific permissions exist, role permission is sufficient
                if (!serverId || !this.serverPermissions[serverId]) {
                    return true;
                }
                
                // Check server-specific permissions
                const serverPerms = this.serverPermissions[serverId];
                
                // If user is explicitly denied this permission for this server
                if (serverPerms.userDenied && 
                    serverPerms.userDenied[userId] && 
                    serverPerms.userDenied[userId].includes(permission)) {
                    return false;
                }
                
                // If user is explicitly granted this permission for this server
                if (serverPerms.userGranted && 
                    serverPerms.userGranted[userId] && 
                    serverPerms.userGranted[userId].includes(permission)) {
                    return true;
                }
                
                // If role is explicitly denied this permission for this server
                if (serverPerms.roleDenied && 
                    serverPerms.roleDenied[role] && 
                    serverPerms.roleDenied[role].includes(permission)) {
                    return false;
                }
                
                // If role is explicitly granted this permission for this server
                if (serverPerms.roleGranted && 
                    serverPerms.roleGranted[role] && 
                    serverPerms.roleGranted[role].includes(permission)) {
                    return true;
                }
                
                // Default to role permission
                return true;
            }
            
            // Check if user has server-specific permission
            if (serverId && this.serverPermissions[serverId]) {
                const serverPerms = this.serverPermissions[serverId];
                
                if (serverPerms.userGranted && 
                    serverPerms.userGranted[userId] && 
                    serverPerms.userGranted[userId].includes(permission)) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }
    
    /**
     * Grant permission to a user for a server
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    grantPermission(userId, permission, serverId) {
        try {
            if (!serverId) {
                throw new Error('Server ID is required');
            }
            
            // Initialize server permissions if needed
            if (!this.serverPermissions[serverId]) {
                this.serverPermissions[serverId] = {
                    userGranted: {},
                    userDenied: {},
                    roleGranted: {},
                    roleDenied: {}
                };
            }
            
            // Initialize user granted permissions if needed
            if (!this.serverPermissions[serverId].userGranted[userId]) {
                this.serverPermissions[serverId].userGranted[userId] = [];
            }
            
            // Add permission if not already granted
            if (!this.serverPermissions[serverId].userGranted[userId].includes(permission)) {
                this.serverPermissions[serverId].userGranted[userId].push(permission);
            }
            
            // Remove from denied permissions if present
            if (this.serverPermissions[serverId].userDenied[userId]) {
                const index = this.serverPermissions[serverId].userDenied[userId].indexOf(permission);
                if (index !== -1) {
                    this.serverPermissions[serverId].userDenied[userId].splice(index, 1);
                }
            }
            
            // Save server permissions
            this.saveServerPermissions();
            
            return true;
        } catch (error) {
            console.error('Error granting permission:', error);
            return false;
        }
    }
    
    /**
     * Revoke permission from a user for a server
     * @param {string} userId - User ID
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    revokePermission(userId, permission, serverId) {
        try {
            if (!serverId) {
                throw new Error('Server ID is required');
            }
            
            // Initialize server permissions if needed
            if (!this.serverPermissions[serverId]) {
                this.serverPermissions[serverId] = {
                    userGranted: {},
                    userDenied: {},
                    roleGranted: {},
                    roleDenied: {}
                };
            }
            
            // Initialize user denied permissions if needed
            if (!this.serverPermissions[serverId].userDenied[userId]) {
                this.serverPermissions[serverId].userDenied[userId] = [];
            }
            
            // Add permission to denied list if not already denied
            if (!this.serverPermissions[serverId].userDenied[userId].includes(permission)) {
                this.serverPermissions[serverId].userDenied[userId].push(permission);
            }
            
            // Remove from granted permissions if present
            if (this.serverPermissions[serverId].userGranted[userId]) {
                const index = this.serverPermissions[serverId].userGranted[userId].indexOf(permission);
                if (index !== -1) {
                    this.serverPermissions[serverId].userGranted[userId].splice(index, 1);
                }
            }
            
            // Save server permissions
            this.saveServerPermissions();
            
            return true;
        } catch (error) {
            console.error('Error revoking permission:', error);
            return false;
        }
    }
    
    /**
     * Grant permission to a role for a server
     * @param {string} role - Role name
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    grantRolePermission(role, permission, serverId) {
        try {
            if (!this.roles[role]) {
                throw new Error(`Invalid role: ${role}`);
            }
            
            if (!serverId) {
                throw new Error('Server ID is required');
            }
            
            // Initialize server permissions if needed
            if (!this.serverPermissions[serverId]) {
                this.serverPermissions[serverId] = {
                    userGranted: {},
                    userDenied: {},
                    roleGranted: {},
                    roleDenied: {}
                };
            }
            
            // Initialize role granted permissions if needed
            if (!this.serverPermissions[serverId].roleGranted[role]) {
                this.serverPermissions[serverId].roleGranted[role] = [];
            }
            
            // Add permission if not already granted
            if (!this.serverPermissions[serverId].roleGranted[role].includes(permission)) {
                this.serverPermissions[serverId].roleGranted[role].push(permission);
            }
            
            // Remove from denied permissions if present
            if (this.serverPermissions[serverId].roleDenied[role]) {
                const index = this.serverPermissions[serverId].roleDenied[role].indexOf(permission);
                if (index !== -1) {
                    this.serverPermissions[serverId].roleDenied[role].splice(index, 1);
                }
            }
            
            // Save server permissions
            this.saveServerPermissions();
            
            return true;
        } catch (error) {
            console.error('Error granting role permission:', error);
            return false;
        }
    }
    
    /**
     * Revoke permission from a role for a server
     * @param {string} role - Role name
     * @param {string} permission - Permission name
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    revokeRolePermission(role, permission, serverId) {
        try {
            if (!this.roles[role]) {
                throw new Error(`Invalid role: ${role}`);
            }
            
            if (!serverId) {
                throw new Error('Server ID is required');
            }
            
            // Initialize server permissions if needed
            if (!this.serverPermissions[serverId]) {
                this.serverPermissions[serverId] = {
                    userGranted: {},
                    userDenied: {},
                    roleGranted: {},
                    roleDenied: {}
                };
            }
            
            // Initialize role denied permissions if needed
            if (!this.serverPermissions[serverId].roleDenied[role]) {
                this.serverPermissions[serverId].roleDenied[role] = [];
            }
            
            // Add permission to denied list if not already denied
            if (!this.serverPermissions[serverId].roleDenied[role].includes(permission)) {
                this.serverPermissions[serverId].roleDenied[role].push(permission);
            }
            
            // Remove from granted permissions if present
            if (this.serverPermissions[serverId].roleGranted[role]) {
                const index = this.serverPermissions[serverId].roleGranted[role].indexOf(permission);
                if (index !== -1) {
                    this.serverPermissions[serverId].roleGranted[role].splice(index, 1);
                }
            }
            
            // Save server permissions
            this.saveServerPermissions();
            
            return true;
        } catch (error) {
            console.error('Error revoking role permission:', error);
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
    
    /**
     * Get all roles
     * @returns {Object} Roles object
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
}

// Create singleton instance
const permissionManager = new PermissionManager();

// Export for use in other modules
export default permissionManager;
