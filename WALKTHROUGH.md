# Claude Desktop MCP Installer - Step-by-Step Walkthrough

This guide will walk you through using the Claude Desktop MCP Installer, assuming you have already downloaded the installer files and installed any necessary prerequisites (see `WINDOWS_SETUP.md` if you haven't).

## Step 1: Open the Installer

1.  Find the folder where you saved the `Claude-MCP-installer` files.
2.  Locate the `index.html` file.
3.  Double-click `index.html`. This will open the installer interface in your default web browser (like Chrome, Firefox, Edge, etc.).

You should see the main installer window titled "Claude Desktop MCP Installer".

## Step 2: Choose Normal or Advanced Mode (Optional)

*   **Normal Mode (Default):** This mode shows the essential options and is recommended for most users.
*   **Advanced Mode:** If you need more control over settings like network ports, environment variables, security, etc., you can switch to Advanced mode.
    *   Find the toggle switch near the top right labeled "Normal" and "Advanced".
    *   Click the switch or the "Advanced" text to enable Advanced Mode. The interface will change to show more options, often organized into tabs.
    *   You can switch back to Normal mode anytime by clicking the toggle again.

For this walkthrough, we'll assume you are using **Normal Mode**.

## Step 3: Select an MCP Server Template

The installer offers several templates for different kinds of MCP servers.

1.  Look for the section labeled "MCP Server Template".
2.  You'll see several cards, each representing a template (e.g., "Basic API Server", "Web Dashboard"). Each card has:
    *   An icon.
    *   A name (e.g., "Basic API Server").
    *   A brief description (e.g., "Simple REST API server...").
    *   A difficulty badge (Beginner, Intermediate, Advanced).
3.  Click on the card for the template you want to install. The selected card will get a colored border.
    *   **Recommendation for Beginners:** Start with a "Beginner" template like "Basic API Server" or "Web Dashboard".

## Step 4: Choose an Installation Method

This determines how the installer will download and set up the chosen server template.

1.  Find the section labeled "Installation Method".
2.  You'll see options like `npx`, `uv`, and `python`.
    *   **`npx`:** Requires Node.js installed. Often the fastest and most common method.
    *   **`uv`:** A universal installer. Might be required by some templates.
    *   **`python`:** Requires Python installed. Used for Python-based servers or tools.
3.  Click on the installation method you want to use. The selected option will get a colored border.
    *   **Recommendation:** If you installed Node.js (see `WINDOWS_SETUP.md`), choose `npx`. If you installed Python and the template suggests it, choose `python`.

## Step 5: Set Installation Path (Optional)

This is where the MCP server files will be installed on your computer.

1.  Find the section labeled "Installation Path (optional)".
2.  A default path is usually suggested in the input box (e.g., `/opt/claude-desktop-mcp` or `C:\Program Files\Claude Desktop MCP`).
3.  You can leave this as the default, or type in a different path if you prefer. Make sure it's a location where you have permission to write files.

## Step 6: Use JSON Configuration Tools (Optional)

Before installing, you can use the tools provided:

1.  Find the section labeled "JSON Configuration Tools".
2.  *   **Backup Config:** Click this to save a backup of your current Claude Desktop configuration before the installer modifies it. A message will appear in the log area below the buttons confirming the backup.
    *   **Fix JSON Config:** If you suspect your Claude Desktop configuration file is broken, click this. It will try to fix it (often by resetting to defaults or using a backup). Check the log area for results.
    *   **Verify Config:** Click this to check if your current configuration file is valid. Check the log area for results.

## Step 7: Start the Installation

1.  Once you've selected the template, method, and optional path, click the big button labeled **"Install MCP Server"**.
2.  The button will disappear, and a progress section will appear below it.
3.  You'll see:
    *   A **progress bar** filling up.
    *   A **percentage** indicator.
    *   A **status message** (e.g., "Preparing installation...", "Downloading dependencies...", "Installation complete!").
    *   A **log area** showing detailed steps and messages from the installation process.

## Step 8: Monitor Progress and Logs

*   Watch the progress bar and status messages.
*   Keep an eye on the log area below the progress bar. It will show detailed information, including any potential errors (`error` messages in red) or warnings (`warning` messages in orange). Success messages are usually green (`success`) or blue (`info`).

## Step 9: Installation Complete

*   When the progress bar reaches 100%, the status should say "Installation complete!".
*   The log area should confirm successful installation.
*   The status indicator at the very bottom of the installer window might change from "Offline" (red dot) to "Online" or "Running" (green dot), indicating the newly installed server might be active (depending on the server type).

Congratulations! You have successfully used the Claude Desktop MCP Installer. The chosen MCP server should now be installed and configured in your Claude Desktop application. You might need to restart Claude Desktop for it to recognize the new server.