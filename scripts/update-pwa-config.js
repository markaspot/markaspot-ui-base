#!/usr/bin/env node

/**
 * Script to update PWA install prompt configuration across all client configs
 * 
 * Usage: node scripts/update-pwa-config.js
 * 
 * This script will:
 * 1. Find all client config files
 * 2. Add the PWA install prompt configuration to each one
 * 3. Preserve existing configurations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration to add
const PWA_CONFIG = `        // PWA configuration
        pwaInstallPrompt: {
            enabled: true, // Enable/disable PWA install prompt
            showOnMobile: true, // Show prompt only on mobile devices
            dismissalDuration: 7, // Days before showing prompt again after dismissal
            showDelay: 2000 // Milliseconds to wait before showing prompt
        }`;

// Find all client config files
const configFiles = glob.sync(path.join(__dirname, '../config/clients/*.ts'));

console.log(`Found ${configFiles.length} client config files to update\n`);

configFiles.forEach(file => {
    const fileName = path.basename(file);
    console.log(`Processing: ${fileName}`);
    
    try {
        let content = fs.readFileSync(file, 'utf-8');
        
        // Check if PWA config already exists
        if (content.includes('pwaInstallPrompt')) {
            console.log(`  ✓ PWA config already exists, skipping...`);
            return;
        }
        
        // Find the features object and add PWA config before the closing brace
        // Look for the boundaries config as a reference point (it's typically the last feature)
        const boundariesMatch = content.match(/boundaries:\s*{[^}]*}\s*(,?)\s*$/m);
        
        if (boundariesMatch) {
            // Add comma if not present
            const needsComma = !boundariesMatch[1];
            const insertPosition = boundariesMatch.index + boundariesMatch[0].length;
            
            let updatedContent = content.slice(0, insertPosition);
            if (needsComma) {
                updatedContent = updatedContent.trimEnd() + ',';
            }
            updatedContent += '\n' + PWA_CONFIG + '\n';
            updatedContent += content.slice(insertPosition);
            
            fs.writeFileSync(file, updatedContent, 'utf-8');
            console.log(`  ✓ Successfully added PWA config`);
        } else {
            // Fallback: Try to find the end of features object
            const featuresEndMatch = content.match(/features:\s*{[\s\S]*?}\s*(,?)\s*$/m);
            if (featuresEndMatch) {
                // Insert before the closing brace of features
                const insertPosition = featuresEndMatch.index + featuresEndMatch[0].lastIndexOf('}');
                
                let updatedContent = content.slice(0, insertPosition);
                // Check if we need a comma before our new config
                const trimmedContent = updatedContent.trimEnd();
                if (!trimmedContent.endsWith(',') && !trimmedContent.endsWith('{')) {
                    updatedContent = trimmedContent + ',';
                }
                updatedContent += '\n' + PWA_CONFIG + '\n    ';
                updatedContent += content.slice(insertPosition);
                
                fs.writeFileSync(file, updatedContent, 'utf-8');
                console.log(`  ✓ Successfully added PWA config (fallback method)`);
            } else {
                console.log(`  ✗ Could not find appropriate location to insert PWA config`);
                console.log(`    Please add manually:\n${PWA_CONFIG}\n`);
            }
        }
    } catch (error) {
        console.error(`  ✗ Error processing file: ${error.message}`);
    }
    
    console.log('');
});

console.log('\nUpdate complete!');
console.log('\nTo apply these changes to other branches:');
console.log('1. Commit the changes: git add -A && git commit -m "Add PWA install prompt configuration"');
console.log('2. For each client branch, run:');
console.log('   git checkout <branch-name>');
console.log('   git cherry-pick <commit-hash>');
console.log('   # or merge from dev: git merge dev');