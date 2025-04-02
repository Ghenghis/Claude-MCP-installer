/**
 * Logger Tests
 */

// Mock the global MCPConfig object
global.MCPConfig = {
  DEFAULTS: {
    LOG_LEVEL: 'info',
  },
  DEBUG: true,
};

// Mock DOM elements
document.body.innerHTML = '<div id="logContainer"></div>';

// Import the logger
const Logger = require('../logger.js');

describe('Logger', () => {
  beforeEach(() => {
    // Clear the log container before each test
    document.getElementById('logContainer').innerHTML = '';
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.info.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
    console.debug.mockRestore();
  });

  test('should log messages to UI', () => {
    // Act
    Logger.log('Test message', 'info');
    
    // Assert
    const logContainer = document.getElementById('logContainer');
    expect(logContainer.children.length).toBe(1);
    expect(logContainer.querySelector('.log-message').textContent).toBe('Test message');
  });

  test('should log different message types', () => {
    // Act
    Logger.log('Info message', 'info');
    Logger.log('Success message', 'success');
    Logger.log('Warning message', 'warning');
    Logger.log('Error message', 'error');
    
    // Assert
    const logContainer = document.getElementById('logContainer');
    expect(logContainer.children.length).toBe(4);
    expect(logContainer.children[0].classList.contains('info')).toBe(true);
    expect(logContainer.children[1].classList.contains('success')).toBe(true);
    expect(logContainer.children[2].classList.contains('warning')).toBe(true);
    expect(logContainer.children[3].classList.contains('error')).toBe(true);
  });

  test('should log to console when DEBUG is true', () => {
    // Act
    Logger.log('Test message', 'info');
    
    // Assert
    expect(console.info).toHaveBeenCalled();
  });

  test('should not log to console when DEBUG is false', () => {
    // Arrange
    const originalDebug = MCPConfig.DEBUG;
    MCPConfig.DEBUG = false;
    
    // Act
    Logger.log('Test message', 'info');
    
    // Assert
    expect(console.info).not.toHaveBeenCalled();
    
    // Restore
    MCPConfig.DEBUG = originalDebug;
  });

  test('should store logs in history', () => {
    // Act
    Logger.log('Test message 1', 'info');
    Logger.log('Test message 2', 'warning');
    
    // Assert
    expect(Logger.logHistory.length).toBe(2);
    expect(Logger.logHistory[0].message).toBe('Test message 1');
    expect(Logger.logHistory[0].type).toBe('info');
    expect(Logger.logHistory[1].message).toBe('Test message 2');
    expect(Logger.logHistory[1].type).toBe('warning');
  });

  test('should limit log history to maxLogEntries', () => {
    // Arrange
    const originalMaxEntries = Logger.maxLogEntries;
    Logger.maxLogEntries = 2;
    
    // Act
    Logger.log('Test message 1', 'info');
    Logger.log('Test message 2', 'warning');
    Logger.log('Test message 3', 'error');
    
    // Assert
    expect(Logger.logHistory.length).toBe(2);
    expect(Logger.logHistory[0].message).toBe('Test message 2');
    expect(Logger.logHistory[1].message).toBe('Test message 3');
    
    // Restore
    Logger.maxLogEntries = originalMaxEntries;
  });

  test('should clear logs', () => {
    // Arrange
    Logger.log('Test message', 'info');
    
    // Act
    Logger.clearLogs();
    
    // Assert
    const logContainer = document.getElementById('logContainer');
    expect(logContainer.children.length).toBe(0);
    expect(Logger.logHistory.length).toBe(0);
  });
});
