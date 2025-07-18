#!/bin/bash

echo "🚀 Iniciando configuración del proyecto Medical Forms Template Generator"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 no está instalado${NC}"
        echo -e "${YELLOW}💡 Por favor instala $1 antes de continuar${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 encontrado${NC}"
    fi
}

# Función para verificar versiones
check_node_version() {
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -lt 18 ]; then
        echo -e "${RED}❌ Se requiere Node.js 18 o superior (actual: v$NODE_VERSION)${NC}"
        echo -e "${YELLOW}💡 Actualiza Node.js: https://nodejs.org${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Node.js v$NODE_VERSION${NC}"
    fi
}

# Banner de bienvenida
echo -e "${BLUE}"
echo "=================================================="
echo "  Medical Forms Template Generator - Setup"
echo "  Configuración inicial del proyecto"
echo "=================================================="
echo -e "${NC}"

# Verificar dependencias
echo -e "${BLUE}🔍 Verificando dependencias...${NC}"
check_command node
check_command npm
check_command git
check_command az

# Verificar versiones específicas
echo -e "${BLUE}📊 Verificando versiones...${NC}"
check_node_version

NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ $NPM_VERSION -lt 9 ]; then
    echo -e "${YELLOW}⚠️  Se recomienda npm 9+ (actual: $NPM_VERSION)${NC}"
    echo -e "${YELLOW}💡 Actualizar: npm install -g npm@latest${NC}"
else
    echo -e "${GREEN}✓ npm v$(npm -v)${NC}"
fi

echo -e "${GREEN}✓ git v$(git --version | cut -d' ' -f3)${NC}"
echo -e "${GREEN}✓ Azure CLI v$(az version --query '"azure-cli"' -o tsv)${NC}"

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ No se detectó repositorio Git${NC}"
    echo -e "${YELLOW}💡 Asegúrate de estar en la raíz del proyecto${NC}"
    exit 1
fi

# Verificar autenticación con Azure
echo -e "${BLUE}🔐 Verificando autenticación con Azure...${NC}"
if az account show &> /dev/null; then
    ACCOUNT_NAME=$(az account show --query name -o tsv)
    echo -e "${GREEN}✓ Autenticado como: $ACCOUNT_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  No autenticado con Azure${NC}"
    echo -e "${YELLOW}💡 Ejecuta: az login${NC}"
    read -p "¿Quieres hacer login ahora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        az login
    else
        echo -e "${YELLOW}⚠️  Continuando sin autenticación Azure${NC}"
    fi
fi

# Instalar dependencias globales
echo -e "${BLUE}📦 Instalando herramientas globales...${NC}"

# Azure Functions Core Tools
if ! command -v func &> /dev/null; then
    echo -e "${YELLOW}Installing Azure Functions Core Tools...${NC}"
    npm install -g azure-functions-core-tools@4 --unsafe-perm true
    echo -e "${GREEN}✓ Azure Functions Core Tools instalado${NC}"
else
    echo -e "${GREEN}✓ Azure Functions Core Tools ya instalado${NC}"
fi

# TypeScript
if ! command -v tsc &> /dev/null; then
    echo -e "${YELLOW}Installing TypeScript...${NC}"
    npm install -g typescript
    echo -e "${GREEN}✓ TypeScript instalado${NC}"
else
    echo -e "${GREEN}✓ TypeScript ya instalado${NC}"
fi

# Crear estructura de directorios
echo -e "${BLUE}📁 Creando estructura del proyecto...${NC}"

# Frontend structure
mkdir -p frontend/{src/{components,pages,services,hooks,utils,types,assets,styles},public,tests/{unit,integration,e2e}}
mkdir -p frontend/src/components/{common,forms,validation,ui}
mkdir -p frontend/src/pages/{dashboard,templates,validation}
mkdir -p frontend/src/services/{api,auth,storage}

# Backend structure  
mkdir -p backend/{functions,shared/{models,services,utils,types,config},tests/{unit,integration}}
mkdir -p backend/functions/{upload,analyze,validate,export}
mkdir -p backend/shared/services/{azure,cosmos,storage,document-intelligence}

# Infrastructure structure
mkdir -p infrastructure/{terraform/{modules,environments/{dev,staging,prod}},bicep,scripts}
mkdir -p infrastructure/terraform/modules/{compute,storage,security,monitoring}

# Documentation structure
mkdir -p docs/{api,architecture,guides,deployment,security}

# Tests structure
mkdir -p tests/{e2e,integration,performance,security}

# Scripts structure
mkdir -p scripts/{setup,deploy,maintenance,utilities}

echo -e "${GREEN}✓ Estructura de directorios creada${NC}"

# Crear archivos base importantes
echo -e "${BLUE}📄 Creando archivos base...${NC}"

# .env.example si no existe
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'EOF'
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Resource Group
RESOURCE_GROUP_NAME=rg-medical-forms-prod
LOCATION=centralus

# Storage Account
STORAGE_ACCOUNT_NAME=stmedicalformsprod
STORAGE_CONTAINER_PDFS=pdf-uploads
STORAGE_CONTAINER_TEMPLATES=templates

# Cosmos DB
COSMOS_ACCOUNT_NAME=cosmos-medical-forms-prod
COSMOS_DATABASE_NAME=TemplatesDB
COSMOS_CONTAINER_NAME=Templates

# Document Intelligence
DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-instance.cognitiveservices.azure.com/
DOCUMENT_INTELLIGENCE_KEY=your-key

# Function App
FUNCTION_APP_NAME=func-medical-forms-prod

# Static Web App
STATIC_WEB_APP_NAME=stapp-medical-forms-prod

# Azure AD
AZURE_AD_CLIENT_ID=your-aad-client-id
AZURE_AD_TENANT_ID=your-aad-tenant-id
AZURE_AD_CLIENT_SECRET=your-aad-secret

# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
API_VERSION=v1
EOF
    echo -e "${GREEN}✓ .env.example creado${NC}"
fi

# Verificar que .env esté en .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo -e "${GREEN}✓ .env agregado a .gitignore${NC}"
fi

# Instalar dependencias del proyecto
if [ -f "package.json" ]; then
    echo -e "${BLUE}📦 Instalando dependencias del proyecto...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  package.json no encontrado${NC}"
    echo -e "${YELLOW}💡 Se creará en pasos posteriores${NC}"
fi

# Configurar Git hooks si Husky está disponible
if [ -f "package.json" ] && grep -q "husky" package.json; then
    echo -e "${BLUE}🪝 Configurando Git hooks...${NC}"
    npx husky install
    echo -e "${GREEN}✓ Git hooks configurados${NC}"
else
    echo -e "${YELLOW}⚠️  Husky no configurado aún${NC}"
fi

# Verificar GitHub CLI (opcional)
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✓ GitHub CLI disponible${NC}"
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✓ Autenticado con GitHub${NC}"
    else
        echo -e "${YELLOW}⚠️  No autenticado con GitHub${NC}"
        echo -e "${YELLOW}💡 Ejecuta: gh auth login${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI no instalado${NC}"
    echo -e "${YELLOW}💡 Instalar: https://cli.github.com${NC}"
fi

# Resumen final
echo -e "${BLUE}"
echo "=================================================="
echo "✅ Configuración inicial completada"
echo "=================================================="
echo -e "${NC}"

echo -e "${GREEN}🎉 ¡Proyecto inicializado correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo "1. 📝 Configurar variables de entorno:"
echo -e "   ${YELLOW}cp .env.example .env && nano .env${NC}"
echo ""
echo "2. ☁️  Configurar recursos de Azure:"
echo -e "   ${YELLOW}npm run setup:azure${NC}"
echo ""
echo "3. 🚀 Iniciar desarrollo:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. 📚 Revisar documentación:"
echo -e "   ${YELLOW}./docs/README.md${NC}"
echo ""
echo -e "${BLUE}🆘 ¿Necesitas ayuda?${NC}"
echo "📧 Email: soporte@clinicseo.com"
echo "📚 Wiki: ./docs/README.md"
echo "💬 Teams: #medical-forms-support"
echo ""
echo -e "${GREEN}¡Feliz desarrollo! 🚀${NC}"