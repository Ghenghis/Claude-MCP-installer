/**
 * Installer Utils - Utility functions for the installer
 * This file is maintained for backward compatibility
 * New code should use the InstallerUtils module directly
 */

import installerUtils from './InstallerUtils.js';

/**
 * Detect the operating system
 * @returns {string} The detected operating system (windows, macos, linux)
 */
function detectOS() {
    return installerUtils.detectOS();
}

/**
 * Format a path according to the operating system
 * @param {string} path - The path to format
 * @returns {string} The formatted path
 */
function formatPath(path) {
    return installerUtils.formatPath(path);
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID
 * @returns {string} The generated ID
 */
function generateRandomId(length = 8) {
    return installerUtils.generateRandomId(length);
}

/**
 * Validate a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
    return installerUtils.isValidUrl(url);
}

/**
 * Escape special characters in a string for use in a command
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeCommandString(str) {
    return installerUtils.escapeCommandString(str);
}

/**
 * Get the user's home directory path
 * @returns {string} The home directory path
 */
function getHomeDirPath() {
    return installerUtils.getHomeDirPath();
}

/**
 * Get the Claude Desktop configuration path
 * @returns {string} The configuration path
 */
function getClaudeConfigPath() {
    return installerUtils.getClaudeConfigPath();
}

/**
 * Format a date string
 * @param {Date} date - The date to format
 * @param {string} format - The format string
 * @returns {string} The formatted date string
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return installerUtils.formatDate(date, format);
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait = 300) {
    return installerUtils.debounce(func, wait);
}

/**
 * Throttle a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} The throttled function
 */
function throttle(func, limit = 300) {
    return installerUtils.throttle(func, limit);
}

/**
 * Deep clone an object
 * @param {Object} obj - The object to clone
 * @returns {Object} The cloned object
 */
function deepClone(obj) {
    return installerUtils.deepClone(obj);
}

/**
 * Check if a value is null or undefined
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is null or undefined
 */
function isNullOrUndefined(value) {
    return installerUtils.isNullOrUndefined(value);
}

/**
 * Check if a value is an empty string
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty string
 */
function isEmptyString(value) {
    return installerUtils.isEmptyString(value);
}

/**
 * Check if a value is an empty array
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty array
 */
function isEmptyArray(value) {
    return installerUtils.isEmptyArray(value);
}

/**
 * Check if a value is an empty object
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty object
 */
function isEmptyObject(value) {
    return installerUtils.isEmptyObject(value);
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is empty
 */
function isEmpty(value) {
    return installerUtils.isEmpty(value);
}

// Export functions for use in other modules
window.InstallerUtils = {
    detectOS,
    formatPath,
    generateRandomId,
    isValidUrl,
    escapeCommandString,
    getHomeDirPath,
    getClaudeConfigPath,
    formatDate,
    debounce,
    throttle,
    deepClone,
    isNullOrUndefined,
    isEmptyString,
    isEmptyArray,
    isEmptyObject,
    isEmpty
};
