const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DATABASE_URL = process.env.DATABASE_URL;

async function createBackup() {
  try {
    console.log('🔄 Starting database backup...');
    
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
    
    const command = `pg_dump "${DATABASE_URL}" > "${backupFile}"`;
    await execAsync(command);
    
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Cleanup old backups (keep last 7 days)
    await cleanupOldBackups();
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sql'));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error);
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup, cleanupOldBackups };