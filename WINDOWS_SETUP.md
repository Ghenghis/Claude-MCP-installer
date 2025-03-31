# Windows Setup Guide for Claude Desktop MCP Installer

This guide provides specific instructions for setting up the necessary tools on Windows before using the Claude Desktop MCP Installer. While the installer aims to be simple, some MCP server templates or installation methods might require specific software like Node.js or Python to be installed first.

## Prerequisites

Depending on the **Installation Method** you choose in the installer, you might need one or more of the following:

1.  **Node.js (for `npx` method):** Many MCP servers are built with Node.js. The `npx` method is often the fastest and recommended way if you have Node.js installed.
2.  **Python (for `python` method):** Some MCP servers might be Python-based or require Python for installation.
3.  **`uv` (Universal Installer):** This is a newer, fast installer that might be used by some templates. It might need separate installation if not bundled or automatically handled.

**Recommendation:** Installing **Node.js** is highly recommended as it's commonly used for MCP servers and enables the `npx` installation method.

## Installing Node.js on Windows

Node.js includes `npm` (Node Package Manager) and `npx` (Node Package Execute).

1.  **Download:** Go to the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2.  **Choose LTS:** Download the **LTS (Long Term Support)** version. It's the most stable version recommended for most users. Click the "LTS" button on the homepage.
3.  **Run Installer:** Once downloaded, run the `.msi` installer file.
4.  **Follow Prompts:**
    *   Accept the license agreement.
    *   Keep the default installation location unless you have a specific reason to change it.
    *   Ensure the "Add to PATH" option is selected (it usually is by default). This is crucial!
    *   You can generally keep the default selections for components.
    *   The installer might ask if you want to install tools for native modules (like Chocolatey). You can **skip** this for basic use unless you know you need it. Click "Next".
    *   Click "Install". You might need to grant administrator permission.
5.  **Verify Installation:**
    *   Open **Command Prompt** or **PowerShell**. You can search for `cmd` or `powershell` in the Windows Start menu.
    *   Type `node -v` and press Enter. You should see the Node.js version number (e.g., `v18.17.1`).
    *   Type `npm -v` and press Enter. You should see the npm version number (e.g., `9.6.7`).
    *   Type `npx -v` and press Enter. You should see the npx version number (e.g., `9.6.7`).

If these commands show version numbers, Node.js is installed correctly and ready for the installer's `npx` method.

## Installing Python on Windows

If you plan to use the `python` installation method:

1.  **Download:** Go to the official Python website: [https://www.python.org/downloads/windows/](https://www.python.org/downloads/windows/)
2.  **Choose Version:** Download the latest stable release for Windows (e.g., Python 3.11 or later).
3.  **Run Installer:** Run the downloaded `.exe` installer.
4.  **IMPORTANT:** On the first screen of the installer, make sure to check the box that says **"Add Python [version] to PATH"**. This is crucial for running Python commands easily.
5.  **Choose Install Now:** Click "Install Now" for the recommended installation settings. You might need to grant administrator permission.
6.  **Verify Installation:**
    *   Open a **new** Command Prompt or PowerShell window (important to open a new one after installation).
    *   Type `python --version` or `py --version` and press Enter. You should see the Python version number (e.g., `Python 3.11.5`).
    *   Type `pip --version` and press Enter. You should see the pip version number (pip is Python's package installer).

If these commands work, Python is installed correctly.

## Running the Installer

Once you have the necessary prerequisites (like Node.js or Python) installed:

1.  Navigate to the folder where you saved the `Claude-MCP-installer` project files.
2.  Double-click the `index.html` file. This should open the installer in your default web browser.
3.  Follow the steps in the `WALKTHROUGH.md` guide.