/**
 * File replacement script for authentication system upgrade
 * 
 * This script replaces the old authentication files with the new improved versions.
 * It handles backup of original files and proper file renaming.
 */

const fs = require('fs');
const path = require('path');

// Define file mappings (new file -> target location)
const fileMappings = [
  // Components
  {
    source: 'components/auth/login-form-new.tsx',
    target: 'components/auth/login-form.tsx',
    backup: 'components/auth/login-form.tsx.bak'
  },
  {
    source: 'components/providers/auth-provider-new.tsx',
    target: 'components/providers/auth-provider.tsx',
    backup: 'components/providers/auth-provider.tsx.bak'
  },
  
  // API Routes
  {
    source: 'app/api/auth/login/route-new.ts',
    target: 'app/api/auth/login/route.ts',
    backup: 'app/api/auth/login/route.ts.bak'
  },
  
  // Pages
  {
    source: 'app/auth/login/page-new.tsx',
    target: 'app/auth/login/page.tsx',
    backup: 'app/auth/login/page.tsx.bak'
  },
  {
    source: 'app/polls/create/page-new.tsx',
    target: 'app/polls/create/page.tsx',
    backup: 'app/polls/create/page.tsx.bak'
  },
  
  // Middleware
  {
    source: 'middleware-new.ts',
    target: 'middleware.ts',
    backup: 'middleware.ts.bak'
  }
];

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

/**
 * Replace a file with its new version
 * @param {Object} mapping - The file mapping object
 * @returns {Promise<void>}
 */
async function replaceFile(mapping) {
  const sourcePath = path.join(projectRoot, mapping.source);
  const targetPath = path.join(projectRoot, mapping.target);
  const backupPath = path.join(projectRoot, mapping.backup);
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${mapping.source}`);
      return;
    }
    
    // Check if target file exists
    if (fs.existsSync(targetPath)) {
      // Create backup
      console.log(`📦 Creating backup: ${mapping.backup}`);
      fs.copyFileSync(targetPath, backupPath);
    }
    
    // Copy new file to target location
    console.log(`🔄 Replacing: ${mapping.target}`);
    fs.copyFileSync(sourcePath, targetPath);
    
    // Remove the new file (optional)
    // fs.unlinkSync(sourcePath);
    
    console.log(`✅ Successfully replaced: ${mapping.target}`);
  } catch (error) {
    console.error(`❌ Error replacing ${mapping.target}:`, error.message);
  }
}

/**
 * Main function to replace all files
 */
async function replaceAllFiles() {
  console.log('🚀 Starting authentication files replacement...');
  
  // Create backup directory if it doesn't exist
  const backupDir = path.join(projectRoot, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  // Replace each file
  for (const mapping of fileMappings) {
    await replaceFile(mapping);
  }
  
  console.log('✨ File replacement completed!');
  console.log('📝 Note: Original files have been backed up with .bak extension');
}

// Run the replacement process
replaceAllFiles().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});