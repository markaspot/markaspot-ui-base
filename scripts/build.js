import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function for deep merge of objects
function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  
  return output;
}

// Helper function to read and parse TypeScript exports (default or named)
function loadTsModule(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Try "export default" first
  let exportIndex = content.indexOf('export default');
  let afterExport;

  if (exportIndex !== -1) {
    afterExport = content.substring(exportIndex + 'export default'.length).trim();
  } else {
    // Try "export const <name> = " pattern
    const namedExportMatch = content.match(/export\s+const\s+\w+\s*=\s*/);
    if (namedExportMatch) {
      exportIndex = namedExportMatch.index;
      afterExport = content.substring(exportIndex + namedExportMatch[0].length).trim();
    } else {
      throw new Error(`Could not find export in ${filePath}`);
    }
  }
  
  // Find the matching closing brace
  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < afterExport.length; i++) {
    const char = afterExport[i];
    
    if (char === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Could not parse export default object in ${filePath}`);
  }
  
  const objectLiteral = afterExport.substring(startIndex, endIndex);
  
  try {
    // Evaluate the object literal
    // Note: This is safe because we control the locale files
    return eval(`(${objectLiteral})`);
  } catch (error) {
    throw new Error(`Failed to parse TypeScript module ${filePath}: ${error.message}`);
  }
}

// Setup paths
const defaultDir = path.join(__dirname, '../i18n/locales/default')
const clientDir = path.join(__dirname, `../i18n/locales/${process.env.CLIENT || 'default'}`)
const dashboardDir = path.join(__dirname, '../pro-layer/i18n/locales/dashboard')
const outputDir = path.join(__dirname, '../i18n/locales/merged')

// Check if dashboard feature is enabled in client config
// Uses simple pattern matching to avoid parsing TypeScript syntax
function isDashboardEnabled() {
  const clientName = process.env.CLIENT || 'default'
  let configPath = path.join(__dirname, `../config/clients/${clientName}.ts`)
  if (!fs.existsSync(configPath)) {
    configPath = path.join(__dirname, '../config/clients/default.ts')
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    // Look for dashboard: { enabled: true } pattern
    const dashboardMatch = content.match(/dashboard\s*:\s*\{[^}]*enabled\s*:\s*(true|false)/s)
    if (dashboardMatch) {
      const enabled = dashboardMatch[1] === 'true'
      console.log(`Dashboard feature enabled: ${enabled} (from ${path.basename(configPath)})`)
      return enabled
    }
    console.log('Dashboard config not found, defaulting to false')
    return false
  } catch (error) {
    console.warn('Could not check dashboard config:', error.message)
    return false
  }
}

const dashboardEnabled = isDashboardEnabled()

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

try {
  // Dynamically detect available languages from default translations
  const languages = fs.readdirSync(defaultDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.basename(file, '.ts'))

  languages.forEach(lang => {
    console.log(`\nProcessing ${lang} translations...`)

    const defaultPath = path.join(defaultDir, `${lang}.ts`)
    const clientPath = path.join(clientDir, `${lang}.ts`)
    const outputPath = path.join(outputDir, `${lang}.ts`)

    let defaultTranslations = {}
    let clientTranslations = {}

    // Load default translations
    try {
      defaultTranslations = loadTsModule(defaultPath)
    } catch (error) {
      console.error(`Error loading default translations from ${defaultPath}:`, error)
      throw error
    }

    // Load client translations if they exist
    if (fs.existsSync(clientPath)) {
      try {
        clientTranslations = loadTsModule(clientPath)
      } catch (error) {
        console.error(`Error loading client translations from ${clientPath}:`, error)
        throw error
      }
    }

    // Merge translations with client overriding default (deep merge)
    let merged = deepMerge(defaultTranslations, clientTranslations);

    // Conditionally merge dashboard translations if feature is enabled
    if (dashboardEnabled) {
      const dashboardPath = path.join(dashboardDir, `${lang}.ts`)
      if (fs.existsSync(dashboardPath)) {
        try {
          const dashboardTranslations = loadTsModule(dashboardPath)
          merged = deepMerge(merged, dashboardTranslations)
          console.log(`  + Merged dashboard translations for ${lang}`)
        } catch (error) {
          console.warn(`  ! Warning: Could not load dashboard translations for ${lang}:`, error.message)
        }
      }
    }

    // Write merged translations with proper TS formatting
    const formattedJson = JSON.stringify(merged, null, 2)
      .replace(/\n/g, '\n  ') // Add consistent indentation for all lines
      .replace(/": {/g, '": {') // No extra space after property with object
      .replace(/": \[/g, '": [') // No extra space after property with array
      .replace(/  \}/g, '}')   // Dedent closing braces
      .replace(/  \]/g, ']');  // Dedent closing brackets

    const tsContent = `// locales/${lang}.ts
export default ${formattedJson}`;

    fs.writeFileSync(outputPath, tsContent);
    console.log(`Written merged translations to ${outputPath} with proper TS formatting`)
  })

  console.log('\nTranslation build completed successfully')
} catch (error) {
  console.error('\nError building translations:', error)
  process.exit(1)
}
