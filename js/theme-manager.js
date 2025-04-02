/**
 * Theme Manager for MCP Server Manager
 * Handles theme switching between light and dark modes
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Theme constants
    const THEME_STORAGE_KEY = 'mcpManagerTheme';
    const DARK_THEME_CLASS = 'dark-theme';
    const LIGHT_ICON_CLASS = 'fa-sun';
    const DARK_ICON_CLASS = 'fa-moon';
    
    /**
     * Initialize theme based on saved preference or system preference
     */
    function initializeTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme) {
            // Apply saved theme
            applyTheme(savedTheme);
        } else {
            // Check for system preference
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDarkMode ? 'dark' : 'light');
        }
        
        // Add event listener for theme toggle button
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Add event listener for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                // Only apply system theme if user hasn't set a preference
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const isDarkTheme = document.body.classList.contains(DARK_THEME_CLASS);
        applyTheme(isDarkTheme ? 'light' : 'dark');
        
        // Save preference
        localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme ? 'light' : 'dark');
    }
    
    /**
     * Apply the specified theme
     * @param {string} theme - 'light' or 'dark'
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add(DARK_THEME_CLASS);
            themeIcon.classList.remove(DARK_ICON_CLASS);
            themeIcon.classList.add(LIGHT_ICON_CLASS);
        } else {
            document.body.classList.remove(DARK_THEME_CLASS);
            themeIcon.classList.remove(LIGHT_ICON_CLASS);
            themeIcon.classList.add(DARK_ICON_CLASS);
        }
        
        // Dispatch event for other components to react to theme change
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
    
    // Initialize theme when DOM is loaded
    initializeTheme();
});
