#!/usr/bin/env node

/**
 * This script scans your React codebase for nested component definitions,
 * which can cause performance issues and UI flickering.
 * 
 * Usage:
 *   node scripts/find-nested-components.js
 * 
 * The script will output a list of files that contain nested component definitions
 * and highlight the lines that need to be fixed.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Directories to search
const SEARCH_DIRS = ['src'];

// File extensions to scan
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Regex patterns to detect component definitions
const COMPONENT_PATTERNS = [
  // Arrow function components
  /const\s+([A-Z][a-zA-Z0-9]*)(?:<[^>]*>)?\s*=\s*(?:React\.)?memo\(?\s*(?:\([^)]*\)|[^=]*)\s*=>/,
  /const\s+([A-Z][a-zA-Z0-9]*)(?:<[^>]*>)?\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>/,
  // Function declaration components
  /function\s+([A-Z][a-zA-Z0-9]*)(?:<[^>]*>)?\s*\(/,
  // Class components
  /class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+(?:React\.)?Component/
];

// Counter for statistics
let totalFiles = 0;
let filesWithNestedComponents = 0;
let totalNestedComponents = 0;

/**
 * Checks if a file contains nested component definitions
 * @param {string} filePath - Path to the file
 * @returns {Array|null} - Array of nested component information or null if none found
 */
function checkFileForNestedComponents(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find top-level component definitions first
    const topLevelComponents = [];
    const nestedComponents = [];
    
    // Track the current top-level component and its line range
    let currentComponent = null;
    let componentStartLine = -1;
    let braceCount = 0;
    let inTopLevelComponent = false;
    
    // First pass: identify top-level components
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If we're not in a component block, check if this line starts one
      if (!inTopLevelComponent) {
        for (const pattern of COMPONENT_PATTERNS) {
          const match = line.match(pattern);
          if (match) {
            currentComponent = match[1];
            componentStartLine = i;
            inTopLevelComponent = true;
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            break;
          }
        }
      } else {
        // We're inside a component - count braces to track when it ends
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        // Check if component definition has ended
        if (braceCount <= 0) {
          topLevelComponents.push({
            name: currentComponent,
            startLine: componentStartLine,
            endLine: i
          });
          inTopLevelComponent = false;
          currentComponent = null;
        }
      }
    }
    
    // Second pass: look for component definitions inside the top-level components
    for (const comp of topLevelComponents) {
      for (let i = comp.startLine; i <= comp.endLine; i++) {
        const line = lines[i];
        
        for (const pattern of COMPONENT_PATTERNS) {
          const match = line.match(pattern);
          if (match && i > comp.startLine) { // Skip the top-level component itself
            nestedComponents.push({
              name: match[1],
              parentComponent: comp.name,
              lineNumber: i + 1, // 1-based line number for editor
              line: line.trim()
            });
          }
        }
      }
    }
    
    return nestedComponents.length > 0 ? { nestedComponents, filePath } : null;
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recursively walks through directories to find files to scan
 * @param {string} dir - Directory to search
 * @returns {Array} - Array of file paths
 */
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    // Skip node_modules and hidden directories
    if (file === 'node_modules' || file.startsWith('.')) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (EXTENSIONS.includes(path.extname(filePath))) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Main function to run the script
 */
function main() {
  console.log(chalk.blue('\n🔍 Scanning for nested component definitions...\n'));
  
  // Get all files to scan
  let filesToScan = [];
  for (const dir of SEARCH_DIRS) {
    filesToScan = filesToScan.concat(walkDir(dir));
  }
  
  totalFiles = filesToScan.length;
  console.log(chalk.gray(`Found ${totalFiles} files to scan.`));
  
  // Check each file for nested components
  const filesWithIssues = [];
  
  for (const file of filesToScan) {
    const result = checkFileForNestedComponents(file);
    if (result) {
      filesWithIssues.push(result);
      filesWithNestedComponents++;
      totalNestedComponents += result.nestedComponents.length;
    }
  }
  
  // Display results
  if (filesWithIssues.length === 0) {
    console.log(chalk.green('\n✅ No nested component definitions found! Your codebase follows best practices.'));
  } else {
    console.log(chalk.yellow(`\n⚠️ Found ${totalNestedComponents} nested component definitions in ${filesWithNestedComponents} files:\n`));
    
    for (const fileInfo of filesWithIssues) {
      console.log(chalk.white.bold(`📄 ${fileInfo.filePath}`));
      
      for (const component of fileInfo.nestedComponents) {
        console.log(chalk.red(`  Line ${component.lineNumber}: ${component.name} defined inside ${component.parentComponent}`));
        console.log(chalk.gray(`    ${component.line}`));
        console.log(chalk.blue(`    → Extract this to module level or a separate file.\n`));
      }
    }
    
    console.log(chalk.yellow('\n💡 Suggestion: Extract these components to the module level or separate files.'));
    console.log(chalk.yellow('   See src/docs/ReactBestPractices.md for more information.\n'));
  }
  
  // Display summary
  console.log(chalk.blue(`\n📊 Summary:`));
  console.log(chalk.blue(`  Total files scanned: ${totalFiles}`));
  console.log(chalk.blue(`  Files with nested components: ${filesWithNestedComponents}`));
  console.log(chalk.blue(`  Total nested component definitions: ${totalNestedComponents}\n`));
}

// Run the script
main(); 