#!/usr/bin/env node

/**
 * Quick Theme Switching Script
 * Usage: node scripts/switch-theme.js [theme-name]
 */

const { spawn } = require('child_process');
const path = require('path');

const availableThemes = {
  'default': 'Default MAS theme (cello/magenta colors)',
  'test-theme': 'Test theme (violet/amber colors, different UI)',
  'template': 'Template theme (waikawa-gray colors)'
};

const themeName = process.argv[2] || 'default';

if (!availableThemes[themeName]) {
  console.error(`❌ Theme "${themeName}" not found.`);
  console.log('\nAvailable themes:');
  Object.entries(availableThemes).forEach(([name, desc]) => {
    console.log(`  ${name}: ${desc}`);
  });
  process.exit(1);
}

console.log(`🎨 Switching to theme: ${themeName}`);
console.log(`📝 Description: ${availableThemes[themeName]}`);
console.log(`🚀 Starting dev server with CLIENT=${themeName}...`);

// Start the dev server with the selected theme
const devServer = spawn('npm', ['run', 'dev'], {
  env: {
    ...process.env,
    CLIENT: themeName
  },
  stdio: 'inherit'
});

devServer.on('exit', (code) => {
  console.log(`Dev server exited with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping dev server...');
  devServer.kill('SIGINT');
});