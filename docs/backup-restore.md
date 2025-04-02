# Backup and Restore Functionality

This document explains how to use the backup and restore functionality in the MCP Server Manager.

## Overview

The backup and restore system allows you to:

1. Create backups of your MCP server configurations and data
2. Restore servers from previous backups
3. Manage your backup history

## File System API

The system uses a unified `FileSystemAPI` to handle all file operations, providing a consistent interface for:

- Reading and writing files
- Creating and deleting directories
- Copying files and directories
- Listing directory contents

## Creating a Backup

### Through the UI

1. Navigate to the "Backup & Restore" tab in the MCP Server Manager
2. Select the server you want to backup from the dropdown
3. Click the "Create Backup" button
4. Enter an optional description for the backup
5. Click "Confirm" to start the backup process

### What Gets Backed Up

- Server configuration files
- Server data files (if selected)
- Metadata about the backup (timestamp, description, etc.)

## Restoring from a Backup

1. Navigate to the "Backup & Restore" tab
2. Select the server you want to restore from the dropdown
3. Browse the available backups in the backup history list
4. Click the "Restore" button next to the backup you want to use
5. Confirm the restore operation

## Backup Storage

Backups are stored in the following location:

- Default: `./backups/{server-id}/{backup-id}/`
- Each backup has a unique ID based on the timestamp
- A manifest file (`manifest.json`) is included in each backup with metadata

## Backup Manifest

The backup manifest includes:

```json
{
  "id": "backup-20250401-082644",
  "timestamp": "2025-04-01T08:26:44-07:00",
  "serverId": "brave-search-mcp",
  "description": "Pre-update backup",
  "files": [
    {
      "path": "config/server.json",
      "size": 1024,
      "hash": "a1b2c3d4e5f6..."
    },
    ...
  ]
}
```

## Programmatic Usage

The backup and restore functionality can be used programmatically:

```javascript
// Create a backup
const backupManager = new BackupManager();
const backupId = await backupManager.createBackup('server-id', {
  includeData: true,
  description: 'My backup description'
});

// Restore from a backup
await backupManager.restoreBackup('server-id', 'backup-id', {
  createBackupFirst: true
});
```

## Error Handling

The backup and restore system includes comprehensive error handling:

- File system errors (permission denied, disk full, etc.)
- Invalid backup manifests
- Corrupted backup files
- Incomplete backups

## Best Practices

1. Create regular backups before making significant changes
2. Include descriptive information in backup descriptions
3. Verify backups after creation
4. Store critical backups in multiple locations
5. Test the restore process periodically
