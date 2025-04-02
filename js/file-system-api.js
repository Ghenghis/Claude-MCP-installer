/**
 * File System API - Provides a unified interface for file system operations
 * This is used by the backup manager to perform file operations
 */
class FileSystemAPI {
    constructor() {
        this.fs = window.require('fs');
        this.path = window.require('path');
        this.util = window.require('util');
        
        // Promisify fs functions
        this.readFileAsync = this.util.promisify(this.fs.readFile);
        this.writeFileAsync = this.util.promisify(this.fs.writeFile);
        this.mkdirAsync = this.util.promisify(this.fs.mkdir);
        this.readdirAsync = this.util.promisify(this.fs.readdir);
        this.statAsync = this.util.promisify(this.fs.stat);
        this.unlinkAsync = this.util.promisify(this.fs.unlink);
        this.rmdirAsync = this.util.promisify(this.fs.rmdir);
        this.existsAsync = (path) => {
            return new Promise(resolve => {
                this.fs.access(path, (err) => {
                    resolve(!err);
                });
            });
        };
    }

    /**
     * Create a directory
     * @param {string} dirPath - Directory path
     * @param {boolean} recursive - Whether to create parent directories
     * @returns {Promise<void>}
     */
    async createDirectory(dirPath, recursive = true) {
        try {
            // Check if directory exists
            const exists = await this.existsAsync(dirPath);
            if (exists) {
                return;
            }
            
            // Create directory
            await this.mkdirAsync(dirPath, { recursive });
            console.log(`Created directory: ${dirPath}`);
        } catch (error) {
            console.error(`Error creating directory ${dirPath}:`, error);
            throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Read file content
     * @param {string} filePath - File path
     * @returns {Promise<string>} File content
     */
    async readFile(filePath) {
        try {
            // Check if file exists
            const exists = await this.existsAsync(filePath);
            if (!exists) {
                throw new Error(`File ${filePath} does not exist`);
            }
            
            // Read file
            const content = await this.readFileAsync(filePath, 'utf8');
            return content;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Write file content
     * @param {string} filePath - File path
     * @param {string} content - File content
     * @returns {Promise<void>}
     */
    async writeFile(filePath, content) {
        try {
            // Create directory if it doesn't exist
            const dirPath = this.path.dirname(filePath);
            await this.createDirectory(dirPath);
            
            // Write file
            await this.writeFileAsync(filePath, content, 'utf8');
            console.log(`Wrote file: ${filePath}`);
        } catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    /**
     * List files in a directory
     * @param {string} dirPath - Directory path
     * @param {string} pattern - File pattern (glob)
     * @param {Array<string>} excludePatterns - Patterns to exclude
     * @returns {Promise<Array>} List of files
     */
    async listFiles(dirPath, pattern = '*', excludePatterns = []) {
        try {
            // Check if directory exists
            const exists = await this.existsAsync(dirPath);
            if (!exists) {
                return [];
            }
            
            // Read directory
            const files = await this.readdirAsync(dirPath);
            
            // Filter files by pattern
            const filteredFiles = [];
            for (const file of files) {
                const filePath = this.path.join(dirPath, file);
                const stat = await this.statAsync(filePath);
                
                if (stat.isFile()) {
                    // Check if file matches pattern
                    if (this.matchesPattern(file, pattern)) {
                        // Check if file is excluded
                        const excluded = excludePatterns.some(excludePattern => 
                            this.matchesPattern(file, excludePattern)
                        );
                        
                        if (!excluded) {
                            filteredFiles.push({
                                name: file,
                                path: filePath,
                                size: stat.size,
                                modifiedTime: stat.mtime
                            });
                        }
                    }
                }
            }
            
            return filteredFiles;
        } catch (error) {
            console.error(`Error listing files in ${dirPath}:`, error);
            throw new Error(`Failed to list files in ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Copy a file
     * @param {string} sourcePath - Source file path
     * @param {string} destinationPath - Destination file path
     * @returns {Promise<void>}
     */
    async copyFile(sourcePath, destinationPath) {
        try {
            // Read source file
            const content = await this.readFile(sourcePath);
            
            // Write destination file
            await this.writeFile(destinationPath, content);
            
            console.log(`Copied file from ${sourcePath} to ${destinationPath}`);
        } catch (error) {
            console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
            throw new Error(`Failed to copy file from ${sourcePath} to ${destinationPath}: ${error.message}`);
        }
    }

    /**
     * Copy a directory
     * @param {string} sourcePath - Source directory path
     * @param {string} destinationPath - Destination directory path
     * @returns {Promise<void>}
     */
    async copyDirectory(sourcePath, destinationPath) {
        try {
            // Create destination directory
            await this.createDirectory(destinationPath);
            
            // Get files in source directory
            const files = await this.readdirAsync(sourcePath);
            
            // Copy each file/directory
            for (const file of files) {
                const sourceFilePath = this.path.join(sourcePath, file);
                const destinationFilePath = this.path.join(destinationPath, file);
                
                const stat = await this.statAsync(sourceFilePath);
                
                if (stat.isDirectory()) {
                    // Recursively copy subdirectory
                    await this.copyDirectory(sourceFilePath, destinationFilePath);
                } else {
                    // Copy file
                    await this.copyFile(sourceFilePath, destinationFilePath);
                }
            }
            
            console.log(`Copied directory from ${sourcePath} to ${destinationPath}`);
        } catch (error) {
            console.error(`Error copying directory from ${sourcePath} to ${destinationPath}:`, error);
            throw new Error(`Failed to copy directory from ${sourcePath} to ${destinationPath}: ${error.message}`);
        }
    }

    /**
     * Delete a file
     * @param {string} filePath - File path
     * @returns {Promise<void>}
     */
    async deleteFile(filePath) {
        try {
            // Check if file exists
            const exists = await this.existsAsync(filePath);
            if (!exists) {
                return;
            }
            
            // Delete file
            await this.unlinkAsync(filePath);
            console.log(`Deleted file: ${filePath}`);
        } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
            throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Delete a directory
     * @param {string} dirPath - Directory path
     * @param {boolean} recursive - Whether to delete subdirectories and files
     * @returns {Promise<void>}
     */
    async deleteDirectory(dirPath, recursive = false) {
        try {
            // Check if directory exists
            const exists = await this.existsAsync(dirPath);
            if (!exists) {
                return;
            }
            
            if (recursive) {
                // Get files in directory
                const files = await this.readdirAsync(dirPath);
                
                // Delete each file/directory
                for (const file of files) {
                    const filePath = this.path.join(dirPath, file);
                    const stat = await this.statAsync(filePath);
                    
                    if (stat.isDirectory()) {
                        // Recursively delete subdirectory
                        await this.deleteDirectory(filePath, true);
                    } else {
                        // Delete file
                        await this.deleteFile(filePath);
                    }
                }
            }
            
            // Delete directory
            await this.rmdirAsync(dirPath);
            console.log(`Deleted directory: ${dirPath}`);
        } catch (error) {
            console.error(`Error deleting directory ${dirPath}:`, error);
            throw new Error(`Failed to delete directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Check if a file matches a pattern
     * @param {string} fileName - File name
     * @param {string} pattern - Pattern (glob)
     * @returns {boolean} Whether the file matches the pattern
     */
    matchesPattern(fileName, pattern) {
        // Convert glob pattern to regex
        const regex = new RegExp('^' + pattern.split('*').map(s => this.escapeRegExp(s)).join('.*') + '$');
        return regex.test(fileName);
    }

    /**
     * Escape regular expression special characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Make the FileSystemAPI globally available
window.FileSystemAPI = new FileSystemAPI();
