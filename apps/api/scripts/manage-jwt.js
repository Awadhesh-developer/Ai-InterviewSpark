#!/usr/bin/env node

/**
 * JWT Secrets Management Shortcut
 * This is a convenience script that calls the main JWT management tool
 * from the correct location, so you can run it from the API directory.
 */

const path = require('path');
const { spawn } = require('child_process');

// Path to the main JWT management script
const mainScriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'manage-jwt-secrets.js');

// Get command line arguments (excluding node and script name)
const args = process.argv.slice(2);

// If no arguments provided, show help
if (args.length === 0) {
  args.push('--help');
}

console.log('🔗 JWT Management Shortcut');
console.log('==========================');
console.log(`Running: node ${path.relative(process.cwd(), mainScriptPath)} ${args.join(' ')}\n`);

// Spawn the main script with the provided arguments
const child = spawn('node', [mainScriptPath, ...args], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..', '..', '..')
});

// Handle process exit
child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Error running JWT management script:', error.message);
  process.exit(1);
});
