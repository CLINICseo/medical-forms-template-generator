# 🔧 Configuración del Proyecto - Medical Forms Template Generator

## 📋 **Pasos de Configuración Rápida**

### 1. **Requisitos Previos**
Asegúrate de tener:
- ✅ Node.js 18+ instalado
- ✅ npm 9+ instalado
- ✅ Cuenta de Azure con servicios configurados
- ✅ Git configurado

### 2. **Instalación de Dependencias**
```bash
# Opción A: Instalación automática (recomendado)
npm run install:all

# Opción B: Instalación manual
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. **Configuración de Variables de Entorno**

#### Opción A: Configuración Automática (Recomendado)
```bash
npm run setup
```
El script te guiará paso a paso para configurar tus credenciales de Azure.

#### Opción B: Configuración Manual

**Para Backend:**
1. Copia `backend/local.settings.example.json` como `backend/local.settings.json`
2. Reemplaza los valores de ejemplo con tus credenciales reales

**Para Frontend:**
1. Copia `frontend/.env.example` como `frontend/.env.local`
2. Configura la URL del backend

### 4. **Credenciales de Azure Necesarias**

Necesitarás obtener las siguientes credenciales de tu cuenta de Azure:

#### 🧠 **Document Intelligence**
- Portal → Cognitive Services → Tu recurso → Keys and Endpoint
- `DOCUMENT_INTELLIGENCE_ENDPOINT`: https://tu-recurso.cognitiveservices.azure.com
- `DOCUMENT_INTELLIGENCE_KEY`: Tu clave primaria

#### 🗄️ **Cosmos DB**
- Portal → Azure Cosmos DB → Tu cuenta → Keys
- `COSMOS_DB_ENDPOINT`: https://tu-cuenta.documents.azure.com:443/
- `COSMOS_DB_KEY`: Tu clave primaria
- `COSMOS_DB_DATABASE`: medical-forms

#### 💾 **Storage Account**
- Portal → Storage Accounts → Tu cuenta → Access keys
- `STORAGE_CONNECTION_STRING`: Cadena de conexión completa

### 5. **Verificar Configuración**

```bash
# Construir ambos proyectos
npm run build

# Ejecutar tests
npm run test

# Verificar calidad de código
npm run code-quality
```

### 6. **Iniciar en Modo Desarrollo**

```bash
# Iniciar ambos servicios (recomendado)
npm run dev

# O iniciar por separado:
npm run dev:backend  # Terminal 1: Backend en http://localhost:7071
npm run dev:frontend # Terminal 2: Frontend en http://localhost:3000
```

## 🔍 **Verificación de la Configuración**

### Backend (http://localhost:7071)
- ✅ `/api/analyze` - Función de análisis
- ✅ `/api/upload` - Función de carga

### Frontend (http://localhost:3000)
- ✅ Página de carga de PDFs
- ✅ Visualizador de PDF con campos
- ✅ Panel de validación

## ⚠️ **Troubleshooting Común**

### Error: "Cannot connect to Cosmos DB"
```bash
# Verifica tu connection string
echo $COSMOS_DB_ENDPOINT
echo $COSMOS_DB_KEY
```

### Error: "Document Intelligence quota exceeded"
- Verifica límites en Azure Portal
- Considera usar tier S0 para desarrollo

### Error: "CORS blocked"
- Asegúrate que `local.settings.json` incluye CORS configuration
- Verifica que el frontend usa `http://localhost:7071/api`

### Error: Dependencias no instaladas
```bash
# Reinstalación limpia
npm run clean
npm run fresh-install
```

## 📝 **Estructura de Archivos de Configuración**

```
project/
├── .env.template              # Template de variables globales
├── setup-env.js              # Script de configuración automática
├── backend/
│   ├── local.settings.json    # Configuración Azure Functions
│   └── local.settings.example.json
├── frontend/
│   ├── .env.local             # Variables del frontend
│   └── .env.example
```

## 🚀 **Próximos Pasos**

Una vez configurado:
1. ✅ Probar carga de un PDF de prueba
2. ✅ Verificar que se analiza correctamente
3. ✅ Validar que se puede editar campos
4. ✅ Confirmar persistencia en Cosmos DB

## 📞 **Soporte**

Si encuentras problemas:
1. Revisa este documento
2. Verifica logs en las consolas de desarrollo
3. Consulta los archivos de ejemplo
4. Verifica credenciales en Azure Portal