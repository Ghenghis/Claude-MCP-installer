/**
 * Claude Config Manager - Handles Claude Desktop configuration management
 * This file is maintained for backward compatibility
 * New code should use the ClaudeConfigManager module directly
 */

import claudeConfigManager from './ClaudeConfigManager.js';

/**
 * Get the path to the Claude Desktop configuration file
 * @returns {string} The path to the configuration file
 */
function getClaudeConfigPath() {
    return claudeConfigManager.getClaudeConfigPath();
}

/**
 * Update the Claude Desktop configuration file with new MCP servers
 * @param {string} repoUrl - The repository URL
 * @param {string} installPath - The installation path
 * @param {string} methodId - The installation method (npx, uv, python)
 */
function updateClaudeConfig(repoUrl, installPath, methodId) {
    return claudeConfigManager.updateClaudeConfig(repoUrl, installPath, methodId);
}

/**
 * Read the current Claude Desktop configuration
 * @returns {Object} The configuration object
 */
function readCurrentConfig() {
    return claudeConfigManager.readCurrentConfig();
}

/**
 * Get default configuration object
 * @returns {Object} Default configuration
 */
function getDefaultConfig() {
    return claudeConfigManager.getDefaultConfig();
}

/**
 * Update the configuration with server configs
 * @param {Object} config - The configuration object
 */
function updateConfigWithServers(config) {
    return claudeConfigManager.updateConfigWithServers(config);
}

/**
 * Save configuration file
 * @param {string} configPath - Path to configuration file
 * @param {Object} config - Configuration object
 */
function saveConfigFile(configPath, config) {
    return claudeConfigManager.saveConfigFile(configPath, config);
}

/**
 * Log information about the servers in the configuration
 * @param {Object} config - The configuration object
 */
function logServerInformation(config) {
    return claudeConfigManager.logServerInformation(config);
}

/**
 * Backup the JSON configuration file
 */
function backupJsonConfiguration() {
    return claudeConfigManager.backupJsonConfiguration();
}

/**
 * Fix the JSON configuration file
 */
function fixJsonConfiguration() {
    return claudeConfigManager.fixJsonConfiguration();
}

/**
 * Verify JSON configuration
 */
function verifyJsonConfiguration() {
    return claudeConfigManager.verifyJsonConfiguration();
}

/**
 * Verify and fix server configuration
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @returns {boolean} Whether the configuration is valid
 */
function verifyAndFixServerConfig(config, configPath) {
    return claudeConfigManager.verifyAndFixServerConfig(config, configPath);
}

/**
 * Find missing servers in configuration
 * @param {Object} config - Configuration object
 * @param {Array<string>} requiredServers - List of required server names
 * @returns {Array<string>} List of missing server names
 */
function findMissingServers(config, requiredServers) {
    return claudeConfigManager.findMissingServers(config, requiredServers);
}

/**
 * Handle missing servers by adding them to config and saving
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 * @param {Array<string>} missingServers - List of missing server names
 */
function handleMissingServers(config, configPath, missingServers) {
    return claudeConfigManager.handleMissingServers(config, configPath, missingServers);
}

/**
 * Add missing servers to configuration
 * @param {Object} config - Configuration object
 * @param {Array<string>} missingServers - List of missing server names
 */
function addMissingServers(config, missingServers) {
    return claudeConfigManager.addMissingServers(config, missingServers);
}

/**
 * Get server configurations
 * @returns {Object} Server configurations
 */
function getServerConfigurations() {
    return claudeConfigManager.getServerConfigurations();
}

/**
 * Create a Node.js server configuration
 * @param {string} nodePath - Path to Node.js executable
 * @param {string} npmModulesPath - Path to npm modules
 * @param {string} serverName - Server name
 * @param {Array} [extraArgs=[]] - Extra arguments
 * @returns {Object} Server configuration
 */
function createNodeServerConfig(nodePath, npmModulesPath, serverName, extraArgs = []) {
    return claudeConfigManager.createNodeServerConfig(nodePath, npmModulesPath, serverName, extraArgs);
}

/**
 * Write the Claude Desktop configuration file
 * @param {string} configPath - Path to configuration file
 * @param {object} config - The configuration object to write
 */
function writeClaudeConfig(configPath, config) {
    return claudeConfigManager.writeClaudeConfig(configPath, config);
}

/**
 * Fix a corrupted JSON configuration file
 * @param {string} configPath - The path to the configuration file
 * @returns {boolean} Whether the fix was successful
 */
function fixJsonConfig(configPath) {
    return claudeConfigManager.fixJsonConfig(configPath);
}

// Export functions for use in other modules
window.ClaudeConfigManager = {
    updateClaudeConfig,
    backupJsonConfiguration,
    fixJsonConfiguration,
    verifyJsonConfiguration,
    getClaudeConfigPath,
    readCurrentConfig,
    getDefaultConfig,
    updateConfigWithServers,
    saveConfigFile,
    logServerInformation,
    verifyAndFixServerConfig,
    findMissingServers,
    handleMissingServers,
    addMissingServers,
    getServerConfigurations,
    createNodeServerConfig,
    writeClaudeConfig,
    fixJsonConfig
};
