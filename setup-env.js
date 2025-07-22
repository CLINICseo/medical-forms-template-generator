#!/usr/bin/env node

/**
 * Script de configuración inicial para Medical Forms Template Generator
 * Ayuda a configurar las variables de entorno necesarias
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Medical Forms Template Generator - Configuración Inicial\n');
console.log('Este script te ayudará a configurar las variables de entorno necesarias.\n');

const questions = [
  {
    key: 'DOCUMENT_INTELLIGENCE_ENDPOINT',
    question: 'Document Intelligence Endpoint (ej: https://tu-recurso.cognitiveservices.azure.com): '
  },
  {
    key: 'DOCUMENT_INTELLIGENCE_KEY',
    question: 'Document Intelligence Key: '
  },
  {
    key: 'COSMOS_DB_ENDPOINT',
    question: 'Cosmos DB Endpoint (ej: https://tu-cosmos.documents.azure.com:443/): '
  },
  {
    key: 'COSMOS_DB_KEY',
    question: 'Cosmos DB Primary Key: '
  },
  {
    key: 'STORAGE_CONNECTION_STRING',
    question: 'Storage Connection String: '
  }
];

const answers = {};

async function askQuestion(index) {
  if (index >= questions.length) {
    await generateConfig();
    return;
  }

  const question = questions[index];
  rl.question(question.question, (answer) => {
    if (answer.trim()) {
      answers[question.key] = answer.trim();
    }
    askQuestion(index + 1);
  });
}

async function generateConfig() {
  try {
    // Generar local.settings.json para backend
    const localSettings = {
      "IsEncrypted": false,
      "Values": {
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "FUNCTIONS_EXTENSION_VERSION": "~4",
        "DOCUMENT_INTELLIGENCE_ENDPOINT": answers.DOCUMENT_INTELLIGENCE_ENDPOINT || "https://your-document-intelligence.cognitiveservices.azure.com",
        "DOCUMENT_INTELLIGENCE_KEY": answers.DOCUMENT_INTELLIGENCE_KEY || "your-document-intelligence-key",
        "COSMOS_DB_ENDPOINT": answers.COSMOS_DB_ENDPOINT || "https://your-cosmos-db.documents.azure.com:443/",
        "COSMOS_DB_KEY": answers.COSMOS_DB_KEY || "your-cosmos-db-key",
        "COSMOS_DB_DATABASE": "medical-forms",
        "STORAGE_CONNECTION_STRING": answers.STORAGE_CONNECTION_STRING || "your-storage-connection-string",
        "NODE_ENV": "development",
        "CORS_ORIGINS": "http://localhost:3000,https://localhost:3000"
      },
      "Host": {
        "CORS": "http://localhost:3000,https://localhost:3000",
        "CORSCredentials": true
      }
    };

    // Escribir local.settings.json
    fs.writeFileSync(
      path.join(__dirname, 'backend', 'local.settings.json'),
      JSON.stringify(localSettings, null, 2)
    );

    // Generar .env para frontend
    const frontendEnv = `# Medical Forms Template Generator - Frontend Config
REACT_APP_API_URL=http://localhost:7071/api
REACT_APP_ENVIRONMENT=development
GENERATE_SOURCEMAP=true
`;

    fs.writeFileSync(
      path.join(__dirname, 'frontend', '.env.local'),
      frontendEnv
    );

    console.log('\n✅ Configuración completada!');
    console.log('\nArchivos generados:');
    console.log('  - backend/local.settings.json');
    console.log('  - frontend/.env.local');
    
    console.log('\n📋 Próximos pasos:');
    console.log('  1. Revisa los archivos generados');
    console.log('  2. Ejecuta: npm run dev:backend (en una terminal)');
    console.log('  3. Ejecuta: npm run dev:frontend (en otra terminal)');
    console.log('  4. Abre http://localhost:3000 para probar la aplicación');

  } catch (error) {
    console.error('❌ Error generando configuración:', error.message);
  }

  rl.close();
}

// Verificar si ya existen archivos de configuración
const backendConfig = path.join(__dirname, 'backend', 'local.settings.json');
const frontendConfig = path.join(__dirname, 'frontend', '.env.local');

if (fs.existsSync(backendConfig) || fs.existsSync(frontendConfig)) {
  console.log('⚠️  Se encontraron archivos de configuración existentes.');
  rl.question('¿Quieres sobrescribirlos? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\nPor favor, proporciona tus credenciales de Azure:\n');
      askQuestion(0);
    } else {
      console.log('Configuración cancelada.');
      rl.close();
    }
  });
} else {
  console.log('Por favor, proporciona tus credenciales de Azure:\n');
  askQuestion(0);
}