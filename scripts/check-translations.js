#!/usr/bin/env node

/**
 * Translation Coverage Checker
 * Identifies missing translation keys across all locale layers.
 *
 * Scans: default layer, fastmap layer, dashboard (pro) layer.
 * Auto-discovers all locale files per layer.
 */

import fs from 'fs';
import path from 'path';

// --strict makes the checker a hard gate: a non-zero exit when any locale has
// missing keys, so CI / test-all can enforce the "i18n 100%" rule. Without the
// flag the checker stays advisory (exit 0) for exploratory local runs.
const STRICT = process.argv.includes('--strict');

const LAYERS = [
  { name: 'default', dir: 'i18n/locales/default' },
  { name: 'fastmap', dir: 'fastmap-layer/i18n/locales/fastmap' },
  { name: 'dashboard', dir: 'pro-layer/i18n/locales/dashboard' },
];

/**
 * Extract all keys from a translation object recursively.
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (key === 'locale' || key === 'meta') continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Load and parse a locale file.
 */
function loadLocale(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('};');
    if (startIndex === -1 || endIndex === -1) return null;
    const objectContent = content.slice(startIndex, endIndex + 1);
    const localeData = eval(`(${objectContent})`);
    return { keys: extractKeys(localeData), data: localeData };
  } catch (error) {
    console.error(`  Error loading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Discover all .ts locale files in a directory.
 */
function discoverLocales(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts'))
    .map(f => f.replace('.ts', ''))
    .sort();
}

/**
 * Main checker.
 */
async function checkTranslations() {
  console.log('🔍 Checking translation coverage...\n');

  let hasIssues = false;

  for (const layer of LAYERS) {
    if (!fs.existsSync(layer.dir)) {
      console.log(`⏭  Layer "${layer.name}" (${layer.dir}): directory not found, skipping.\n`);
      continue;
    }

    const localeNames = discoverLocales(layer.dir);
    if (localeNames.length === 0) {
      console.log(`⏭  Layer "${layer.name}": no locale files found.\n`);
      continue;
    }

    console.log(`━━━ Layer: ${layer.name} (${layer.dir}) ━━━`);
    console.log(`    Locales: ${localeNames.join(', ')}\n`);

    // Load all locales for this layer
    const locales = [];
    for (const name of localeNames) {
      const filePath = path.join(layer.dir, `${name}.ts`);
      const result = loadLocale(filePath);
      if (result) {
        locales.push({ name, ...result });
      }
    }

    // Collect all unique keys across locales in this layer
    const allKeys = new Set();
    locales.forEach(l => l.keys.forEach(k => allKeys.add(k)));

    console.log(`    Total keys: ${allKeys.size}\n`);

    // Coverage per locale
    locales.forEach(locale => {
      const coverage = (locale.keys.length / allKeys.size * 100).toFixed(1);
      const status = locale.keys.length === allKeys.size ? '✅' : '⚠️';
      console.log(`    ${status} ${locale.name.toUpperCase()}: ${locale.keys.length}/${allKeys.size} (${coverage}%)`);
    });

    // Find missing locales (locales present in en but not others)
    const enLocale = locales.find(l => l.name === 'en');
    if (enLocale && localeNames.length < 13) {
      const allExpected = ['ar', 'da', 'de', 'de-ls', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'uk'];
      const missing = allExpected.filter(l => !localeNames.includes(l));
      if (missing.length > 0) {
        console.log(`\n    🚨 Missing locale files: ${missing.join(', ')}`);
        hasIssues = true;
      }
    }

    // Missing keys per locale
    const localesWithMissing = locales.filter(l => l.keys.length < allKeys.size);
    if (localesWithMissing.length > 0) {
      console.log('\n    Missing keys:');
      hasIssues = true;
      localesWithMissing.forEach(locale => {
        const missingKeys = Array.from(allKeys).filter(k => !locale.keys.includes(k));
        const sections = {};
        missingKeys.forEach(key => {
          const section = key.split('.')[0];
          if (!sections[section]) sections[section] = [];
          sections[section].push(key);
        });

        console.log(`\n    ❌ ${locale.name.toUpperCase()} missing ${missingKeys.length} keys:`);
        Object.entries(sections).forEach(([section, keys]) => {
          console.log(`       ${section}: ${keys.length} missing`);
          if (keys.length <= 5) {
            keys.forEach(key => console.log(`         - ${key}`));
          } else {
            keys.slice(0, 3).forEach(key => console.log(`         - ${key}`));
            console.log(`         ... and ${keys.length - 3} more`);
          }
        });
      });
    }

    console.log('\n');
  }

  // Summary
  console.log('━━━ Summary ━━━');
  for (const layer of LAYERS) {
    if (!fs.existsSync(layer.dir)) continue;
    const localeNames = discoverLocales(layer.dir);
    console.log(`  ${layer.name}: ${localeNames.length} locales`);
  }

  if (hasIssues) {
    console.log('\n⚠️  Translation gaps found. Run translations to fill missing keys.');
  } else {
    console.log('\n✅ All layers fully covered!');
  }

  return hasIssues;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkTranslations()
    .then((hasIssues) => {
      if (STRICT && hasIssues) {
        console.error('\n❌ Strict mode: translation gaps present — failing (exit 1).');
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

export { checkTranslations };
