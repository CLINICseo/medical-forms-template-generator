# 🏗️ Estructura del Proyecto - Medical Forms Template Generator

## 📁 Estructura General del Proyecto

```
medical-forms-template-generator/
├── 📁 backend/                    # Azure Functions Backend
│   ├── 📁 dist/                   # Archivos compilados
│   ├── 📁 src/                    # Código fuente TypeScript
│   ├── 📁 tests/                  # Tests del backend
│   ├── 📄 host.json               # Configuración Azure Functions
│   ├── 📄 local.settings.json     # Variables de entorno locales
│   ├── 📄 package.json            # Dependencias del backend
│   └── 📄 tsconfig.json           # Configuración TypeScript
│
├── 📁 frontend/                   # React Frontend Application
│   ├── 📁 build/                  # Build de producción
│   ├── 📁 public/                 # Archivos públicos estáticos
│   ├── 📁 src/                    # Código fuente React
│   ├── 📁 tests/                  # Tests del frontend
│   ├── 📄 package.json            # Dependencias del frontend
│   └── 📄 tsconfig.json           # Configuración TypeScript
│
├── 📁 infrastructure/             # Infraestructura como Código
│   ├── 📁 bicep/                  # Templates Azure Bicep
│   ├── 📁 terraform/              # Configuración Terraform
│   └── 📁 scripts/                # Scripts de despliegue
│
├── 📁 docs/                       # Documentación del proyecto
│   ├── 📁 architecture/           # Documentación de arquitectura
│   ├── 📁 api/                    # Documentación de API
│   ├── 📁 development/            # Guías de desarrollo
│   ├── 📁 deployment/             # Guías de despliegue
│   └── 📁 infraestructure/        # Docs técnicos existentes
│
├── 📁 tests/                      # Tests de integración E2E
│   ├── 📁 e2e/                    # Tests end-to-end
│   ├── 📁 integration/            # Tests de integración
│   ├── 📁 performance/            # Tests de rendimiento
│   └── 📁 manual/                 # Tests manuales movidos
│
├── 📁 scripts/                    # Scripts de utilidad
│   ├── 📁 deploy/                 # Scripts de despliegue
│   ├── 📁 setup/                  # Scripts de configuración
│   └── 📁 utilities/              # Utilidades varias
│
├── 📄 package.json                # Configuración del workspace
├── 📄 workspace.json              # Configuración del monorepo
├── 📄 tsconfig.json               # TypeScript base
├── 📄 README.md                   # Documentación principal
├── 📄 CONTRIBUTING.md             # Guía de contribución
└── 📄 CONFIGURACION.md            # Guía de configuración
```

---

## 🎯 Backend - Azure Functions (Node.js + TypeScript)

### 📁 Estructura del Backend

```
backend/src/
├── 📄 app.ts                      # Punto de entrada principal
├── 📄 index.ts                    # Exportaciones principales
│
├── 📁 functions/                  # Azure Functions endpoints
│   ├── 📁 analyze/                # Función de análisis de documentos
│   │   ├── 📄 function.json       # Configuración de la función
│   │   └── 📄 index.ts            # Lógica de análisis
│   ├── 📁 upload/                 # Función de carga de archivos
│   │   ├── 📄 function.json       # Configuración de la función
│   │   └── 📄 index.ts            # Lógica de upload
│   └── 📁 validate/               # Función de validación
│       ├── 📄 function.json       # Configuración de la función
│       └── 📄 index.ts            # Lógica de validación
│
├── 📁 shared/                     # Código compartido
│   ├── 📁 models/                 # Modelos de datos
│   │   ├── 📄 document.model.ts   # Modelo de documento
│   │   ├── 📄 template.model.ts   # Modelo de plantilla
│   │   ├── 📄 audit.model.ts      # Modelo de auditoría
│   │   └── 📄 index.ts            # Exportaciones de modelos
│   │
│   ├── 📁 services/               # Servicios de negocio
│   │   ├── 📁 blob-storage/       # Servicio de Azure Blob Storage
│   │   │   └── 📄 storage.service.ts
│   │   ├── 📁 cosmos-db/          # Servicio de Cosmos DB
│   │   │   └── 📄 config.ts
│   │   ├── 📁 document-intelligence/ # Document Intelligence Service
│   │   │   └── 📄 documentIntelligenceService.ts
│   │   ├── 📁 validation/         # Servicios de validación
│   │   │   ├── 📄 medicalValidationEngine.ts
│   │   │   └── 📄 mexican-fields-processor.ts
│   │   ├── 📄 field-mapper.ts     # Mapeo de campos
│   │   ├── 📄 capacityCalculator.ts # Cálculo de capacidad
│   │   └── 📄 init.service.ts     # Inicialización
│   │
│   ├── 📁 types/                  # Definiciones de tipos
│   │   └── 📄 document.ts         # Tipos de documento
│   │
│   └── 📁 utils/                  # Utilidades
│       ├── 📄 error-handler.ts    # Manejo de errores
│       ├── 📄 validation.ts       # Validaciones
│       └── 📄 index.ts            # Exportaciones de utils
│
└── 📁 tests/                      # Tests del backend
    ├── 📁 unit/                   # Tests unitarios
    └── 📁 integration/            # Tests de integración
```

### 🔧 Tecnologías del Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Azure Functions** | v4.5.1 | Runtime serverless |
| **Node.js** | 20+ | Runtime JavaScript |
| **TypeScript** | 5.5.4 | Tipado estático |
| **@azure/ai-form-recognizer** | 5.0.0 | Document Intelligence |
| **@azure/cosmos** | 4.1.1 | Base de datos NoSQL |
| **@azure/storage-blob** | 12.24.0 | Almacenamiento de archivos |
| **@azure/identity** | 4.4.1 | Autenticación Azure |

---

## 🎨 Frontend - React Application (TypeScript + Material-UI)

### 📁 Estructura del Frontend

```
frontend/src/
├── 📄 index.tsx                   # Punto de entrada de React
├── 📄 App.tsx                     # Componente principal
├── 📄 setupTests.ts               # Configuración de tests
│
├── 📁 components/                 # Componentes reutilizables
│   ├── 📁 common/                 # Componentes comunes
│   ├── 📁 layout/                 # Componentes de layout
│   │   └── 📄 Layout.tsx          # Layout principal
│   ├── 📁 pdf/                    # Componentes PDF
│   │   ├── 📄 PDFViewer.tsx       # Visualizador de PDF
│   │   └── 📄 index.ts            # Exportaciones
│   ├── 📁 upload/                 # Componentes de carga
│   │   ├── 📄 FileUpload.tsx      # Carga de archivos
│   │   ├── 📄 UploadForm.tsx      # Formulario de carga
│   │   └── 📄 index.ts            # Exportaciones
│   ├── 📁 validation/             # Componentes de validación
│   │   ├── 📄 FieldValidationPanel.tsx
│   │   ├── 📄 AdvancedValidationPanel.tsx
│   │   ├── 📄 DeleteFieldDialog.tsx
│   │   └── 📄 index.ts            # Exportaciones
│   ├── 📁 debug/                  # Componentes de debug
│   │   ├── 📄 ValidationDebugger.tsx
│   │   └── 📄 CapacityAnalysisViewer.tsx
│   ├── 📁 forms/                  # Componentes de formularios
│   └── 📁 ui/                     # Componentes de UI base
│
├── 📁 pages/                      # Páginas/Rutas principales
│   ├── 📁 dashboard/              # Dashboard principal
│   │   └── 📄 Dashboard.tsx
│   ├── 📁 upload/                 # Página de carga
│   │   └── 📄 UploadPage.tsx
│   ├── 📁 validation/             # Páginas de validación
│   │   ├── 📄 ValidationPage.tsx
│   │   └── 📄 ValidationListPage.tsx
│   ├── 📁 settings/               # Configuraciones
│   │   └── 📄 SettingsPage.tsx
│   ├── 📁 help/                   # Ayuda y documentación
│   │   └── 📄 HelpPage.tsx
│   └── 📁 templates/              # Gestión de plantillas
│
├── 📁 services/                   # Servicios y API
│   ├── 📁 api/                    # Cliente de API
│   │   ├── 📄 client.ts           # Cliente HTTP base
│   │   ├── 📄 upload.service.ts   # Servicio de carga
│   │   ├── 📄 analysis.service.ts # Servicio de análisis
│   │   ├── 📄 validation.service.ts # Servicio de validación
│   │   ├── 📄 health.service.ts   # Health checks
│   │   ├── 📄 export.service.ts   # Servicio de exportación
│   │   └── 📄 finalize.service.ts # Servicio de finalización
│   ├── 📁 auth/                   # Servicios de autenticación
│   └── 📁 storage/                # Almacenamiento local
│
├── 📁 store/                      # Estado global (Redux)
│   ├── 📄 store.ts                # Configuración del store
│   └── 📁 slices/                 # Redux slices
│       ├── 📄 documentsSlice.ts   # Estado de documentos
│       └── 📄 uiSlice.ts          # Estado de UI
│
├── 📁 contexts/                   # React Contexts
│   └── 📄 SettingsContext.tsx     # Context de configuración
│
├── 📁 hooks/                      # Custom hooks
│   └── 📄 redux.ts                # Hooks de Redux tipados
│
├── 📁 types/                      # Definiciones de tipos
├── 📁 utils/                      # Utilidades del frontend
├── 📁 assets/                     # Assets estáticos
└── 📁 styles/                     # Estilos globales
```

### 🎨 Tecnologías del Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.3.1 | Framework de UI |
| **TypeScript** | 5.5.4 | Tipado estático |
| **Material-UI** | 5.15.21 | Componentes de UI |
| **Redux Toolkit** | 2.2.5 | Gestión de estado |
| **React Router** | 6.24.0 | Enrutamiento |
| **React PDF** | 7.7.3 | Visualización de PDF |
| **Axios** | 1.7.2 | Cliente HTTP |
| **React Dropzone** | 14.2.3 | Carga de archivos |

---

## 🏗️ Infraestructura como Código

### 📁 Estructura de Infraestructura

```
infrastructure/
├── 📁 terraform/                  # Terraform configurations
│   ├── 📄 main.tf                 # Configuración principal
│   ├── 📄 variables.tf            # Variables de entrada
│   ├── 📄 outputs.tf              # Outputs de recursos
│   ├── 📄 terraform.tfstate       # Estado de Terraform
│   ├── 📁 modules/                # Módulos reutilizables
│   │   ├── 📁 compute/            # Recursos de cómputo
│   │   ├── 📁 storage/            # Recursos de almacenamiento
│   │   ├── 📁 security/           # Recursos de seguridad
│   │   └── 📁 monitoring/         # Recursos de monitoreo
│   └── 📁 environments/           # Configuraciones por ambiente
│       ├── 📁 dev/                # Desarrollo
│       ├── 📁 staging/            # Staging
│       └── 📁 prod/               # Producción
│
├── 📁 bicep/                      # Azure Bicep templates
└── 📁 scripts/                    # Scripts de despliegue
```

---

## 📚 Documentación y Tests

### 📁 Estructura de Documentación

```
docs/
├── 📄 README.md                   # Índice de documentación
├── 📁 architecture/               # Documentación de arquitectura
│   ├── 📄 project-structure.md    # Este archivo
│   ├── 📄 system-overview.md      # Visión general del sistema
│   ├── 📄 data-flow.md            # Flujo de datos
│   └── 📄 design-decisions.md     # Decisiones de diseño
├── 📁 api/                        # Documentación de API
├── 📁 development/                # Guías de desarrollo
├── 📁 deployment/                 # Guías de despliegue
├── 📁 infraestructure/            # Documentación técnica existente
└── 📁 pdfs/                       # Formularios de ejemplo
```

### 📁 Estructura de Tests

```
tests/
├── 📁 e2e/                        # Tests end-to-end
├── 📁 integration/                # Tests de integración
├── 📁 performance/                # Tests de rendimiento
├── 📁 security/                   # Tests de seguridad
└── 📁 manual/                     # Tests manuales (movidos aquí)
    ├── 📄 test-blob-diagnostics.js
    ├── 📄 test-fixed-storage.js
    └── 📁 test-files/             # Archivos de prueba
```

---

## 🔧 Archivos de Configuración

### 📄 Configuraciones Principales

| Archivo | Propósito | Ubicación |
|---------|-----------|-----------|
| `package.json` | Configuración del workspace | `/` |
| `workspace.json` | Configuración del monorepo | `/` |
| `tsconfig.json` | TypeScript base | `/` |
| `.prettierrc.json` | Configuración de Prettier | `/` |
| `.commitlintrc.json` | Configuración de commitlint | `/` |
| `.vscode/` | Configuración de VS Code | `/` |

### 🔐 Variables de Entorno

| Archivo | Propósito | Estado |
|---------|-----------|---------|
| `backend/local.settings.json` | Config local del backend | Gitignored |
| `backend/local.settings.example.json` | Template de configuración | Versionado |
| `frontend/.env.local` | Variables del frontend | Gitignored |
| `frontend/.env.example` | Template del frontend | Versionado |

---

## 📊 Métricas del Proyecto

### 📈 Estadísticas Actuales

| Métrica | Backend | Frontend | Total |
|---------|---------|----------|-------|
| **Archivos TypeScript** | 21 | 19 | 40 |
| **Líneas de código** | ~2,000 | ~3,500 | ~5,500 |
| **Componentes React** | - | 15+ | 15+ |
| **Azure Functions** | 4 | - | 4 |
| **Servicios** | 8 | 7 | 15 |
| **Tests** | Pendiente | Pendiente | 0% |

### 🎯 Estado de Implementación

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| **Upload de PDFs** | ✅ Completo | Funcional |
| **Análisis de documentos** | ⚠️ Migración pendiente | Usar prebuilt-layout |
| **Validación de campos** | ✅ Completo | Funcional |
| **Visualización PDF** | ✅ Completo | Funcional |
| **Export de plantillas** | 🔄 Backend pendiente | Frontend implementado |
| **Finalización** | 🔄 Backend pendiente | Frontend implementado |
| **Tests** | ❌ Pendiente | Cobertura 0% |

---

## 🚀 Próximos Pasos

### 🔧 Mejoras de Estructura
1. **Migración crítica**: Document Intelligence a prebuilt-layout
2. **Implementar endpoints**: Export y Finalize en backend
3. **Testing**: Implementar cobertura completa
4. **TypeScript strict**: Activar modo estricto
5. **Documentación API**: Generar automáticamente

### 📚 Documentación Pendiente
1. **API Reference**: Documentación completa de endpoints
2. **Development Guide**: Guías detalladas de desarrollo
3. **Deployment Guide**: Proceso completo de despliegue
4. **Troubleshooting**: Guías de resolución de problemas

---

**Última actualización**: 25 Julio 2025  
**Versión**: 1.0.0