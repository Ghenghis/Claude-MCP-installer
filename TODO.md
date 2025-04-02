# MCP Server Manager TODO List

This file tracks planned features, improvements, and bug fixes for the Advanced MCP Server Installer & Manager.

## Core Installation & Search

-   [x] **Refine `installFromUrl` Logic (installer-ui.js):**
    -   [x] Replace placeholder command logic with actual installation steps adapted from `simulateInstallation`.
    -   [x] Accurately handle `npx`, `uv`, `python` methods based on `simulateInstallation` logic.
    -   [x] Determine if direct `npm install` support is needed or if `npx` is sufficient.
    -   [x] Integrate calls to `installMcpServers` and `updateClaudeConfig` (or equivalents) within `installFromUrl`.
    -   [x] Implement smarter default method selection (check system capabilities).
-   [x] **Real-time Installation Feedback (mcp-search.js/installer-ui.js):**
    -   [x] Replace `alert()` calls with integrated UI status updates (e.g., in queue sidebar, main log area).
    -   [x] Show progress per item during queue installation. (Done via status spans)
-   [x] **Installation Queue Persistence:**
    -   [x] Save/load the `installationQueue` to/from `localStorage`.
    -   [x] Add validation for loaded queue items.
    -   [x] Implement status tracking and visual indicators.
-   [x] **Test Queue Installation:** Thoroughly test the `handleInstallQueue` flow with real repositories and different methods.
-   [x] **Refactor `handleInstallQueue` (mcp-search.js):** Address complexity (cc=15, ID: fe93dc83) by breaking down into smaller functions.
-   [ ] **Docker Integration:**
    -   [x] Add option to install/manage MCP servers as Docker containers.
    -   [x] Implement Docker command generation with customizable configuration.
    -   [x] Add Docker-specific UI controls for container configuration.
    -   [x] Display online/offline status for containerized servers.
    -   [x] Provide basic Docker controls (start/stop/restart/logs).
-   [ ] **Server Management Tab:**
    -   [x] Display list of currently installed servers (regardless of install method).
    -   [x] Show basic status (running/stopped, requires Docker integration or process check).
    -   [x] Add controls (start/stop/restart - needs method-specific implementation).
    -   [x] Configuration editor/viewer per server.
    -   [x] Centralized log viewer.
-   [x] **Server Updates:**
    -   [x] Mechanism to check for updates for installed servers (e.g., comparing local version/commit with remote repo).
    -   [x] One-click update button per server.
-   [x] **AI Features:**
    -   [x] **UI Toggle:** Add UI switch for AI-Assisted vs. Manual installation.
    -   [x] **AI Installation Workflow:**
        -   [x] Analyze target repository (package files, dockerfiles, scripts).
        -   [x] Determine language/framework and dependencies.
        -   [x] Plan installation steps (git clone, deps install, build, config).
        -   [x] Execute steps via `run_command` (using Git, PS, Bash, Docker, npm, pip, uv, etc.).
        -   [x] Attempt automated error diagnosis and fixing.
        -   [x] Verify prerequisites (Node/Python versions, Docker running).
        -   [x] Perform smart installation method selection.
        -   [x] Provide configuration assistance (analyze samples, prompt user).
        -   [x] Check for port conflicts.
        -   [x] **Requires Environment Setup:** Ensure necessary CLI tools (Git, Node, Python, Docker, uv, WSL/Bash) are available in the execution environment.
    -   [x] Implement AI-enhanced search query refinement.
    -   [x] Use AI to generate summaries/descriptions for search results.
    -   [x] Implement AI-assisted installation mode (needs definition - e.g., dependency resolution, config suggestions).
-   [x] **Backup/Restore:**
    -   [x] Functionality to backup server configurations and potentially data.
    -   [x] Restore functionality.

## UI/UX Improvements

-   [x] **Improve UI/UX:**
    -   [x] Refine the Search UI with better filtering and results display.
    -   [x] Ensure consistent light/dark theme support across all components.
    -   [x] Provide more detailed and user-friendly error messages.

## Code Quality & Refactoring

-   [x] **Lint Warnings:**
    -   [x] Address lint warnings in installer-ui.js
    -   [x] Address lint warnings in installer-ui-templates.js
    -   [x] Address lint warnings in installer-ui-installation.js
    -   [x] Address lint warnings in server-manager.js
-   [x] **Refactor `updateClaudeConfig` (installer-ui.js):** Overhaul function for dynamic server registration, proper file system interaction (not just localStorage), and removal of hardcoded paths.
-   [x] **Modularize `installer-ui.js`:** Break down the large file into smaller, more focused modules if complexity continues to grow.
    -   [x] Create installer-ui-url.js for URL-based installation functionality
    -   [x] Move remaining functions to appropriate modules
    -   [x] Update main file to be a lightweight coordinator
