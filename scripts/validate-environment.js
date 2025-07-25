#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.rootDir = path.resolve(__dirname, '..');
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌ ERROR',
      warning: '⚠️  WARNING', 
      info: '✅ INFO',
      success: '✅ SUCCESS'
    }[type] || 'ℹ️  INFO';
    
    console.log(`[${timestamp}] ${prefix}: ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'info') this.info.push(message);
  }

  checkNodeVersion() {
    this.log('info', 'Checking Node.js version...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion >= 20) {
      this.log('success', `Node.js version ${nodeVersion} meets requirements (>=20.0.0)`);
    } else if (majorVersion >= 18) {
      this.log('warning', `Node.js version ${nodeVersion} is supported but consider upgrading to >=20.0.0`);
    } else {
      this.log('error', `Node.js version ${nodeVersion} is not supported. Requires >=20.0.0`);
    }
  }

  checkNpmVersion() {
    this.log('info', 'Checking npm version...');
    
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(npmVersion.split('.')[0]);
      
      if (majorVersion >= 9) {
        this.log('success', `npm version ${npmVersion} meets requirements (>=9.0.0)`);
      } else {
        this.log('error', `npm version ${npmVersion} is not supported. Requires >=9.0.0`);
      }
    } catch (error) {
      this.log('error', 'npm is not installed or not accessible');
    }
  }

  checkWorkspaceStructure() {
    this.log('info', 'Checking workspace structure...');
    
    const requiredPaths = [
      'package.json',
      'frontend/package.json', 
      'backend/package.json',
      'frontend/src',
      'backend/src',
      'docs'
    ];

    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(this.rootDir, requiredPath);
      if (fs.existsSync(fullPath)) {
        this.log('success', `Found required path: ${requiredPath}`);
      } else {
        this.log('error', `Missing required path: ${requiredPath}`);
      }
    }
  }

  checkEnvironmentFiles() {
    this.log('info', 'Checking environment configuration files...');
    
    const envFiles = [
      '.env.local',
      '.env.development',
      '.env.production',
      'backend/local.settings.json'
    ];

    let hasAnyEnvFile = false;
    
    for (const envFile of envFiles) {
      const fullPath = path.join(this.rootDir, envFile);
      if (fs.existsSync(fullPath)) {
        this.log('success', `Found environment file: ${envFile}`);
        hasAnyEnvFile = true;
      } else {
        this.log('info', `Optional environment file not found: ${envFile}`);
      }
    }

    if (!hasAnyEnvFile) {
      this.log('warning', 'No environment configuration files found. Application may not work without proper configuration.');
    }
  }

  checkAzureTooling() {
    this.log('info', 'Checking Azure Functions Core Tools...');
    
    try {
      const funcVersion = execSync('func --version', { encoding: 'utf8' }).trim();
      this.log('success', `Azure Functions Core Tools version: ${funcVersion}`);
      
      // Check if version is 4.x for v4 functions
      if (funcVersion.startsWith('4.')) {
        this.log('success', 'Azure Functions Core Tools version is compatible with v4 functions');
      } else {
        this.log('warning', 'Consider upgrading Azure Functions Core Tools to version 4.x for full compatibility');
      }
    } catch (error) {
      this.log('error', 'Azure Functions Core Tools not found. Install with: npm install -g azure-functions-core-tools@4');
    }

    this.log('info', 'Checking Azure CLI...');
    try {
      const azVersion = execSync('az --version', { encoding: 'utf8' });
      const versionMatch = azVersion.match(/azure-cli\s+(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        this.log('success', `Azure CLI version: ${versionMatch[1]}`);
      } else {
        this.log('success', 'Azure CLI is installed');
      }
    } catch (error) {
      this.log('warning', 'Azure CLI not found. Required for Azure deployments. Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
    }
  }

  checkDependencies() {
    this.log('info', 'Checking if node_modules are installed...');
    
    const nodeModulesPaths = [
      'node_modules',
      'frontend/node_modules',
      'backend/node_modules'
    ];

    let allInstalled = true;
    
    for (const nodeModulesPath of nodeModulesPaths) {
      const fullPath = path.join(this.rootDir, nodeModulesPath);
      if (fs.existsSync(fullPath)) {
        this.log('success', `Dependencies installed: ${nodeModulesPath}`);
      } else {
        this.log('error', `Dependencies not installed: ${nodeModulesPath}`);
        allInstalled = false;
      }
    }

    if (!allInstalled) {
      this.log('info', 'Run "npm run install:all" to install all dependencies');
    }
  }

  checkTypeScriptConfiguration() {
    this.log('info', 'Checking TypeScript configuration...');
    
    const tsConfigPaths = [
      'frontend/tsconfig.json',
      'backend/tsconfig.json'
    ];

    for (const tsConfigPath of tsConfigPaths) {
      const fullPath = path.join(this.rootDir, tsConfigPath);
      if (fs.existsSync(fullPath)) {
        try {
          const tsConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          this.log('success', `Valid TypeScript config: ${tsConfigPath}`);
          
          // Check for strict mode
          if (tsConfig.compilerOptions && tsConfig.compilerOptions.strict) {
            this.log('success', `Strict mode enabled in ${tsConfigPath}`);
          } else {
            this.log('warning', `Consider enabling strict mode in ${tsConfigPath}`);
          }
        } catch (error) {
          this.log('error', `Invalid TypeScript config: ${tsConfigPath} - ${error.message}`);
        }
      } else {
        this.log('error', `Missing TypeScript config: ${tsConfigPath}`);
      }
    }
  }

  checkGitConfiguration() {
    this.log('info', 'Checking Git configuration...');
    
    if (fs.existsSync(path.join(this.rootDir, '.git'))) {
      this.log('success', 'Git repository initialized');
      
      // Check for important Git files
      const gitFiles = ['.gitignore', '.gitattributes'];
      for (const gitFile of gitFiles) {
        const fullPath = path.join(this.rootDir, gitFile);
        if (fs.existsSync(fullPath)) {
          this.log('success', `Found ${gitFile}`);
        } else {
          this.log('warning', `Missing ${gitFile}`);
        }
      }
      
      // Check for Husky hooks
      if (fs.existsSync(path.join(this.rootDir, '.husky'))) {
        this.log('success', 'Husky git hooks configured');
      } else {
        this.log('info', 'Husky git hooks not configured (run npm run prepare)');
      }
    } else {
      this.log('warning', 'Not a Git repository');
    }
  }

  checkBuildability() {
    this.log('info', 'Testing build capability...');
    
    try {
      // Test TypeScript compilation without emitting files
      this.log('info', 'Testing TypeScript compilation...');
      execSync('npm run type-check', { cwd: this.rootDir, stdio: 'pipe' });
      this.log('success', 'TypeScript compilation successful');
    } catch (error) {
      this.log('error', 'TypeScript compilation failed');
    }
  }

  checkPortAvailability() {
    this.log('info', 'Checking default port availability...');
    
    const net = require('net');
    const ports = [3000, 7071]; // React dev server, Azure Functions
    
    for (const port of ports) {
      const server = net.createServer();
      
      server.listen(port, (err) => {
        if (err) {
          this.log('warning', `Port ${port} is in use`);
        } else {
          this.log('success', `Port ${port} is available`);
          server.close();
        }
      });
      
      server.on('error', (err) => {
        this.log('warning', `Port ${port} is in use`);
      });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ENVIRONMENT VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successes: ${this.info.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Critical Issues (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 Environment validation completed successfully!');
      return true;
    } else {
      console.log('💥 Environment validation failed. Please fix the errors above.');
      return false;
    }
  }

  async validate() {
    console.log('🚀 Starting environment validation...\n');
    
    this.checkNodeVersion();
    this.checkNpmVersion();
    this.checkWorkspaceStructure();
    this.checkEnvironmentFiles();
    this.checkAzureTooling();
    this.checkDependencies();
    this.checkTypeScriptConfiguration();
    this.checkGitConfiguration();
    this.checkBuildability();
    this.checkPortAvailability();
    
    // Add a small delay to let async port checks complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = EnvironmentValidator;