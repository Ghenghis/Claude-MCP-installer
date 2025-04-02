/**
 * Installer UI Tests
 */

// Mock dependencies
jest.mock('../InstallerUICore.js', () => ({
  initUI: jest.fn(),
  logMessage: jest.fn(),
}));

jest.mock('../InstallerUIEvents.js', () => ({
  setupEventListeners: jest.fn(),
}));

jest.mock('../InstallerUIStateManager.js', () => ({
  loadStateFromStorage: jest.fn(),
  updateUIFromState: jest.fn(),
  saveStateToStorage: jest.fn(),
}));

jest.mock('../InstallerUISystemRequirements.js', () => ({
  checkSystemRequirements: jest.fn(),
}));

// Import the module
import '../installer-ui.js';

describe('Installer UI', () => {
  // Get references to mocked dependencies
  const installerUICore = require('../InstallerUICore.js');
  const installerUIEvents = require('../InstallerUIEvents.js');
  const installerUIStateManager = require('../InstallerUIStateManager.js');
  const installerUISystemRequirements = require('../InstallerUISystemRequirements.js');
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('should initialize UI components', () => {
    // Simulate DOMContentLoaded event
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Assert that initialization functions were called
    expect(installerUICore.initUI).toHaveBeenCalled();
    expect(installerUIEvents.setupEventListeners).toHaveBeenCalled();
    expect(installerUISystemRequirements.checkSystemRequirements).toHaveBeenCalled();
    expect(installerUICore.logMessage).toHaveBeenCalledWith('Installer UI initialized', 'info');
    expect(installerUIStateManager.loadStateFromStorage).toHaveBeenCalled();
  });
  
  test('should export functions to window.InstallerUI', () => {
    // Assert that functions are exported to window.InstallerUI
    expect(window.InstallerUI).toBeDefined();
    expect(window.InstallerUI.initInstallerUI).toBeDefined();
    expect(window.InstallerUI.updateUIFromState).toBeDefined();
    expect(window.InstallerUI.loadStateFromStorage).toBeDefined();
    expect(window.InstallerUI.saveStateToStorage).toBeDefined();
  });
});
