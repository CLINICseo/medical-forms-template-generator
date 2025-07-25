#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevelopmentSetup {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.errors = [];
    this.completed = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      success: '✅', 
      warning: '⚠️',
      info: 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'success') this.completed.push(message);
  }

  createDirectoryStructure() {
    this.log('Creating required directory structure...', 'info');
    
    const directories = [
      'scripts',
      'docs/api',
      'docs/architecture', 
      'docs/development',
      'docs/deployment',
      'docs/infrastructure',
      'frontend/src/__tests__',
      'frontend/src/types',
      'frontend/src/utils',
      'backend/src/__tests__',
      'backend/src/types',
      'backend/src/utils',
      'backend/src/config',
      '.vscode',
      'test-files'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.rootDir, dir);
      try {
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          this.log(`Created directory: ${dir}`, 'success');
        } else {
          this.log(`Directory exists: ${dir}`, 'info');
        }
      } catch (error) {
        this.log(`Failed to create directory ${dir}: ${error.message}`, 'error');
      }
    }
  }

  createEnvironmentTemplates() {
    this.log('Creating environment template files...', 'info');
    
    const envTemplates = {
      '.env.example': `# Medical Forms Template Generator - Environment Variables
# Copy this file to .env.local and fill in your values

# Azure Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://YOUR_RESOURCE.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=YOUR_KEY
AZURE_COSMOS_DB_ENDPOINT=https://YOUR_DB.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=YOUR_KEY

# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:7071/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0

# Development Configuration
PORT=3000
BROWSER=none
GENERATE_SOURCEMAP=true`,

      'backend/local.settings.example.json': JSON.stringify({
        "IsEncrypted": false,
        "Values": {
          "AzureWebJobsStorage": "UseDevelopmentStorage=true",
          "FUNCTIONS_WORKER_RUNTIME": "node",
          "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
          "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net",
          "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT": "https://YOUR_RESOURCE.cognitiveservices.azure.com/",
          "AZURE_DOCUMENT_INTELLIGENCE_KEY": "YOUR_KEY",
          "AZURE_COSMOS_DB_ENDPOINT": "https://YOUR_DB.documents.azure.com:443/",
          "AZURE_COSMOS_DB_KEY": "YOUR_KEY",
          "CORS_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000"
        },
        "Host": {
          "LocalHttpPort": 7071,
          "CORS": "*",
          "CORSCredentials": false
        }
      }, null, 2)
    };

    for (const [filename, content] of Object.entries(envTemplates)) {
      const fullPath = path.join(this.rootDir, filename);
      try {
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, content);
          this.log(`Created environment template: ${filename}`, 'success');
        } else {
          this.log(`Environment template exists: ${filename}`, 'info');
        }
      } catch (error) {
        this.log(`Failed to create ${filename}: ${error.message}`, 'error');
      }
    }
  }

  createVSCodeConfiguration() {
    this.log('Creating VS Code configuration...', 'info');
    
    const vscodeConfigs = {
      'settings.json': JSON.stringify({
        "typescript.preferences.includePackageJsonAutoImports": "auto",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true
        },
        "files.exclude": {
          "**/node_modules": true,
          "**/dist": true,
          "**/build": true
        },
        "search.exclude": {
          "**/node_modules": true,
          "**/dist": true,
          "**/build": true
        },
        "eslint.workingDirectories": ["frontend", "backend"],
        "typescript.preferences.importModuleSpecifier": "relative",
        "azureFunctions.deploySubpath": "backend",
        "azureFunctions.postDeployTask": "npm install",
        "azureFunctions.projectLanguage": "TypeScript",
        "azureFunctions.projectRuntime": "~4",
        "debug.internalConsoleOptions": "neverOpen"
      }, null, 2),
      
      'launch.json': JSON.stringify({
        "version": "0.2.0",
        "configurations": [
          {
            "name": "Attach to Azure Functions",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "preLaunchTask": "func: host start"
          },
          {
            "name": "Debug Frontend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/frontend/node_modules/.bin/react-scripts",
            "args": ["start"],
            "env": {
              "BROWSER": "none"
            },
            "console": "integratedTerminal"
          }
        ]
      }, null, 2),
      
      'tasks.json': JSON.stringify({
        "version": "2.0.0",
        "tasks": [
          {
            "type": "func",
            "command": "host start",
            "problemMatcher": "$func-node-watch",
            "isBackground": true,
            "dependsOn": "npm build",
            "options": {
              "cwd": "${workspaceFolder}/backend"
            }
          },
          {
            "type": "shell",
            "label": "npm build",
            "command": "npm run build",
            "dependsOrder": "sequence",
            "group": "build",
            "options": {
              "cwd": "${workspaceFolder}/backend"
            }
          },
          {
            "type": "shell",
            "label": "npm start frontend",
            "command": "npm start",
            "group": "build",
            "options": {
              "cwd": "${workspaceFolder}/frontend"
            }
          }
        ]
      }, null, 2),
      
      'extensions.json': JSON.stringify({
        "recommendations": [
          "ms-vscode.azure-account",
          "ms-azuretools.vscode-azurefunctions",
          "ms-vscode.vscode-typescript-next",
          "esbenp.prettier-vscode",
          "dbaeumer.vscode-eslint",
          "ms-vscode.vscode-json",
          "bradlc.vscode-tailwindcss",
          "formulahendry.auto-rename-tag",
          "christian-kohler.path-intellisense"
        ]
      }, null, 2)
    };

    for (const [filename, content] of Object.entries(vscodeConfigs)) {
      const fullPath = path.join(this.rootDir, '.vscode', filename);
      try {
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, content);
          this.log(`Created VS Code config: .vscode/${filename}`, 'success');
        } else {
          this.log(`VS Code config exists: .vscode/${filename}`, 'info');
        }
      } catch (error) {
        this.log(`Failed to create .vscode/${filename}: ${error.message}`, 'error');
      }
    }
  }

  createGitHooks() {
    this.log('Setting up Git hooks...', 'info');
    
    try {
      if (fs.existsSync(path.join(this.rootDir, '.git'))) {
        execSync('npm run prepare', { cwd: this.rootDir, stdio: 'pipe' });
        this.log('Git hooks installed with Husky', 'success');
      } else {
        this.log('Not a Git repository - skipping Git hooks', 'warning');
      }
    } catch (error) {
      this.log(`Failed to install Git hooks: ${error.message}`, 'error');
    }
  }

  installDependencies() {
    this.log('Installing dependencies...', 'info');
    
    const workspaces = ['', 'frontend', 'backend'];
    
    for (const workspace of workspaces) {
      const workspaceDir = workspace ? path.join(this.rootDir, workspace) : this.rootDir;
      const packageJsonPath = path.join(workspaceDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const nodeModulesPath = path.join(workspaceDir, 'node_modules');
          if (!fs.existsSync(nodeModulesPath)) {
            this.log(`Installing dependencies in ${workspace || 'root'}...`, 'info');
            execSync('npm install', { cwd: workspaceDir, stdio: 'inherit' });
            this.log(`Dependencies installed in ${workspace || 'root'}`, 'success');
          } else {
            this.log(`Dependencies already installed in ${workspace || 'root'}`, 'info');
          }
        } catch (error) {
          this.log(`Failed to install dependencies in ${workspace || 'root'}: ${error.message}`, 'error');
        }
      }
    }
  }

  runValidation() {
    this.log('Running environment validation...', 'info');
    
    try {
      const EnvironmentValidator = require('./validate-environment.js');
      const validator = new EnvironmentValidator();
      
      return validator.validate();
    } catch (error) {
      this.log(`Environment validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  generateSetupReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🛠️  DEVELOPMENT SETUP REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Completed: ${this.completed.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);
    
    if (this.completed.length > 0) {
      console.log(`\n✅ Completed Tasks:`);
      this.completed.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log(`\n💡 Next Steps:`);
      console.log('   1. Review and fix the errors above');
      console.log('   2. Run "npm run validate:env" to check environment');
      console.log('   3. Copy .env.example to .env.local and configure');
      console.log('   4. Copy backend/local.settings.example.json to backend/local.settings.json and configure');
    } else {
      console.log(`\n🎉 Development environment setup completed successfully!`);
      console.log(`\n💡 Next Steps:`);
      console.log('   1. Copy .env.example to .env.local and configure your Azure credentials');
      console.log('   2. Copy backend/local.settings.example.json to backend/local.settings.json');
      console.log('   3. Run "npm run dev" to start the development servers');
      console.log('   4. Open http://localhost:3000 to view the application');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return this.errors.length === 0;
  }

  async setup() {
    console.log('🚀 Starting development environment setup...\n');
    
    this.createDirectoryStructure();
    this.createEnvironmentTemplates();
    this.createVSCodeConfiguration();
    this.createGitHooks();
    this.installDependencies();
    
    const success = this.generateSetupReport();
    
    // Run validation after setup
    console.log('\n🔍 Running post-setup validation...');
    await this.runValidation();
    
    return success;
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new DevelopmentSetup();
  setup.setup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = DevelopmentSetup;