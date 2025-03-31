# Claude Desktop MCP Installer

This is a user-friendly installer application for setting up and configuring Model Context Protocol (MCP) servers for use with Claude Desktop. It simplifies the process of choosing server templates, installation methods, and configuring settings.

## Features

*   **Easy-to-use Interface:** Simple graphical interface for selecting options.
*   **Template Selection:** Choose from various pre-defined MCP server templates (Basic API, Web Dashboard, Data Processor, etc.).
*   **Installation Methods:** Supports different installation methods like `npx` (Node.js), `uv` (Universal), and `pip` (Python).
*   **Normal & Advanced Modes:** Switch between a simple view and an advanced view with more configuration options.
*   **Configuration Tools:** Includes tools to backup, verify, and attempt to fix the Claude Desktop JSON configuration file.
*   **Progress & Logging:** Displays installation progress and detailed logs.
*   **AI-Assisted Configuration (Advanced):** Option to use AI to help resolve installation issues.

## Getting Started

This installer is designed to be run directly from the `index.html` or `advanced-installer.html` file in a web browser.

1.  **Download:** Get the project files (usually as a ZIP archive or by cloning the repository if you use Git).
2.  **Open:** Double-click the `index.html` file to open the installer in your default web browser.
3.  **Follow:** Use the interface to select your desired MCP server template and installation method.
4.  **Install:** Click the "Install MCP Server" button.

For more detailed instructions, prerequisites, and dependency information, please see:

*   **[Windows Setup Guide](./WINDOWS_SETUP.md):** Specific instructions for setting up prerequisites (like Node.js or Python) on Windows. **Read this first if you are on Windows!**
*   **[Step-by-Step Walkthrough](./WALKTHROUGH.md):** A detailed guide on how to use the installer interface.
*   **[Requirements Context](./requirements.txt):** Explains how dependencies are handled (you usually don't need to install things from this file directly).

## Configuration Tools

The installer includes tools to manage the Claude Desktop configuration file (`claude_desktop_config.json`), typically located in your user's AppData folder on Windows (`C:\Users\[YourUsername]\AppData\Roaming\Claude\`).

*   **Backup Config:** Creates a timestamped backup copy of your current configuration file before making changes.
*   **Fix JSON Config:** Attempts to repair a potentially corrupted configuration file by restoring defaults or trying to parse it correctly.
*   **Verify Config:** Checks if the current configuration file is valid JSON.

These tools provide extra safety and help troubleshoot configuration issues.

## Contributing

(Information about contributing can be added here if applicable).

## License

(License information can be added here).