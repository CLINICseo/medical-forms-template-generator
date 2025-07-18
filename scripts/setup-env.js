#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log(`${colors.blue}${colors.bright}`);
console.log('🔧 Configuración de Variables de Entorno');
console.log('Medical Forms Template Generator');
console.log('=====================================');
console.log(`${colors.reset}\n`);

// Verificar si .env.example existe
if (!fs.existsSync(envExamplePath)) {
  console.log(`${colors.red}❌ Archivo .env.example no encontrado${colors.reset}`);
  console.log(`${colors.yellow}💡 Asegúrate de estar en la raíz del proyecto${colors.reset}`);
  process.exit(1);
}

// Advertencia si .env ya existe
if (fs.existsSync(envPath)) {
  console.log(`${colors.yellow}⚠️  El archivo .env ya existe${colors.reset}`);
  console.log(`${colors.yellow}   Este proceso lo sobrescribirá${colors.reset}\n`);
}

// Leer .env.example
const envExample = fs.readFileSync(envExamplePath, 'utf8');
const lines = envExample.split('\n');

let envContent = '';
let currentIndex = 0;

// Descripción de variables importantes
const variableDescriptions = {
  AZURE_SUBSCRIPTION_ID: 'ID de tu suscripción de Azure (az account show --query id)',
  AZURE_TENANT_ID: 'ID del tenant de Azure AD',
  AZURE_CLIENT_ID: 'ID del Service Principal para deploy',
  RESOURCE_GROUP_NAME: 'Nombre del Resource Group (ej: rg-medical-forms-dev)',
  LOCATION: 'Región de Azure (ej: centralus, eastus)',
  STORAGE_ACCOUNT_NAME: 'Nombre único global para Storage Account',
  COSMOS_ACCOUNT_NAME: 'Nombre único global para Cosmos DB',
  DOCUMENT_INTELLIGENCE_ENDPOINT: 'URL del servicio Document Intelligence',
  NODE_ENV: 'Ambiente de ejecución (development, staging, production)',
  LOG_LEVEL: 'Nivel de logging (debug, info, warn, error)',
};

// Función para procesar cada línea
const processLine = () => {
  if (currentIndex >= lines.length) {
    // Guardar archivo final
    fs.writeFileSync(envPath, envContent);
    console.log(`\n${colors.green}✅ Archivo .env creado exitosamente${colors.reset}`);
    console.log(`${colors.blue}📍 Ubicación: ${envPath}${colors.reset}\n`);

    // Mostrar próximos pasos
    console.log(`${colors.blue}${colors.bright}📋 Próximos pasos:${colors.reset}`);
    console.log(`${colors.yellow}1. Verificar configuración de Azure:${colors.reset}`);
    console.log(`   az login`);
    console.log(`   az account set --subscription "\${AZURE_SUBSCRIPTION_ID}"`);
    console.log(`\n${colors.yellow}2. Crear recursos de Azure:${colors.reset}`);
    console.log(`   npm run setup:azure`);
    console.log(`\n${colors.yellow}3. Iniciar desarrollo:${colors.reset}`);
    console.log(`   npm run dev`);

    console.log(`\n${colors.green}🎉 ¡Configuración completada!${colors.reset}`);
    rl.close();
    return;
  }

  const line = lines[currentIndex];

  // Agregar comentarios y líneas vacías tal como están
  if (line.startsWith('#') || line.trim() === '') {
    envContent += line + '\n';
    currentIndex++;
    processLine();
    return;
  }

  // Procesar variables
  const [key, originalDefaultValue] = line.split('=');

  if (!key) {
    envContent += line + '\n';
    currentIndex++;
    processLine();
    return;
  }

  // Mostrar información de la variable
  console.log(`${colors.cyan}${colors.bright}${key}${colors.reset}`);

  if (variableDescriptions[key]) {
    console.log(`${colors.dim}   💡 ${variableDescriptions[key]}${colors.reset}`);
  }

  const suggestedValue = originalDefaultValue || '';

  const prompt = suggestedValue
    ? `${colors.white}   Valor [${colors.green}${suggestedValue}${colors.white}]: ${colors.reset}`
    : `${colors.white}   Valor: ${colors.reset}`;

  rl.question(prompt, (answer) => {
    const finalValue = answer.trim() || suggestedValue;

    // Validaciones específicas
    if (key === 'NODE_ENV' && !['development', 'staging', 'production'].includes(finalValue)) {
      console.log(
        `${colors.red}⚠️  Valor inválido. Usar: development, staging o production${colors.reset}`,
      );
      processLine();
      return;
    }

    if (key.includes('_NAME') && finalValue.length > 24) {
      console.log(`${colors.yellow}⚠️  Nombre muy largo (max 24 chars para Azure)${colors.reset}`);
    }

    envContent += `${key}=${finalValue}\n`;
    console.log(`${colors.green}   ✓ ${key}=${finalValue}${colors.reset}\n`);

    currentIndex++;
    processLine();
  });
};

// Función para mostrar ayuda de Azure CLI
function showAzureHelp() {
  console.log(`${colors.blue}${colors.bright}🆘 Comandos útiles de Azure CLI:${colors.reset}\n`);

  console.log(`${colors.yellow}Ver suscripciones disponibles:${colors.reset}`);
  console.log(`   az account list --output table\n`);

  console.log(`${colors.yellow}Obtener ID de suscripción actual:${colors.reset}`);
  console.log(`   az account show --query id --output tsv\n`);

  console.log(`${colors.yellow}Obtener tenant ID:${colors.reset}`);
  console.log(`   az account show --query tenantId --output tsv\n`);
}

// Preguntar si necesita ayuda con Azure
rl.question(
  `${colors.blue}¿Necesitas ayuda con comandos de Azure CLI? (y/n): ${colors.reset}`,
  (needHelp) => {
    console.log('');

    if (needHelp.toLowerCase() === 'y' || needHelp.toLowerCase() === 'yes') {
      showAzureHelp();
    }

    console.log(`${colors.blue}Comenzando configuración de variables...${colors.reset}\n`);
    console.log(`${colors.dim}💡 Presiona Enter para usar el valor por defecto${colors.reset}\n`);

    // Iniciar proceso
    processLine();
  },
);

// Manejar interrupción
rl.on('SIGINT', () => {
  console.log(`\n${colors.red}❌ Configuración cancelada${colors.reset}`);
  console.log(
    `${colors.yellow}💡 Puedes ejecutar el script nuevamente cuando quieras${colors.reset}`,
  );
  process.exit(0);
});
