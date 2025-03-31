/**
 * Configuration settings for the MCP Installer
 * Contains default values and constants used throughout the application
 */
const MCPConfig = {
    // API endpoints
    API: {
        CHECK_SERVER: 'https://api.claudedesktop.com/mcp/status',
        TEMPLATES: 'https://api.claudedesktop.com/mcp/templates',
        INSTALL: 'https://api.claudedesktop.com/mcp/install'
    },
    
    // Default installation settings
    DEFAULTS: {
        INSTALL_METHOD: 'npx',
        TEMPLATE: 'basic-api',
        LOG_LEVEL: 'info'
    },
    
    // Installation methods with commands
    INSTALL_METHODS: {
        npx: {
            command: 'npx @claude-desktop/mcp-installer',
            requirements: ['Node.js 14+', 'npm 6+']
        },
        uv: {
            command: 'uv install @claude-desktop/mcp',
            requirements: ['uv package manager']
        },
        python: {
            command: 'pip install claude-desktop-mcp',
            requirements: ['Python 3.8+', 'pip']
        }
    },
    
    // Version information
    VERSION: '1.2.0',
    
    // Debug mode (set to false in production)
    DEBUG: false
};