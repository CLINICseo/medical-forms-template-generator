# Medical Forms Template Generator

Sistema de generación de plantillas para formularios médicos de aseguradoras mexicanas utilizando Azure Document Intelligence y React.

![Build Status](https://github.com/CLINICseo/medical-forms-template-generator/workflows/CI%2FCD%20Pipeline/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    subgraph "🖥️ Frontend Layer"
        A[React SPA<br/>TypeScript + Material-UI<br/>Redux Toolkit] --> B[Azure Static Web Apps<br/>CDN Global + Custom Domain]
    end
    
    subgraph "⚡ Backend Layer"
        C[Azure Functions v4<br/>Node.js 20 + TypeScript<br/>Serverless] --> D[Document Intelligence<br/>AI OCR Service<br/>Custom Models]
        C --> E[Cosmos DB<br/>NoSQL Database<br/>Auto-scaling]
        C --> F[Azure Blob Storage<br/>PDF Files + Templates<br/>Hot/Cool Tiers]
    end
    
    subgraph "🔐 Security Layer"
        G[Azure AD B2C<br/>Authentication<br/>Multi-tenant] --> A
        G --> C
        H[Key Vault<br/>Secrets Management<br/>HSM Backed] --> C
        I[API Management<br/>Rate Limiting<br/>Throttling] --> C
    end
    
    subgraph "📊 Observability"
        J[Application Insights<br/>Real-time Telemetry<br/>Custom Metrics] --> A
        J --> C
        K[Log Analytics<br/>Centralized Logging<br/>KQL Queries] --> C
        L[Azure Monitor<br/>Alerts & Dashboards<br/>Auto-scaling] --> C
    end
    
    B --> C
    
    style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style B fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style C fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style D fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style E fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style F fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    style G fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    style H fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    style I fill:#f3e5f5,stroke:#512da8,stroke-width:2px
    style J fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style K fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    style L fill:#fce4ec,stroke:#7b1fa2,stroke-width:2px
```

## 🔄 Flujo de Datos

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant F as 🖥️ Frontend<br/>(React SPA)
    participant AF as ⚡ Azure Functions<br/>(Serverless API)
    participant DI as 🧠 Document Intelligence<br/>(AI Service)
    participant DB as 🗄️ Cosmos DB<br/>(Database)
    participant BS as 📁 Blob Storage<br/>(Files)

    Note over U,BS: 📄 Proceso de Análisis de PDF
    U->>+F: 1. Cargar archivo PDF
    F->>+AF: 2. POST /api/upload
    AF->>+BS: 3. Guardar PDF original
    BS-->>-AF: 4. URL del archivo
    AF->>+DI: 5. Analizar documento
    DI-->>-AF: 6. Campos detectados + coordenadas
    AF->>+DB: 7. Guardar plantilla inicial
    DB-->>-AF: 8. Template ID
    AF-->>-F: 9. Respuesta con campos detectados
    F-->>-U: 10. Mostrar interfaz de validación

    Note over U,BS: ✅ Proceso de Validación
    U->>+F: 11. Validar/Ajustar campos
    F->>+AF: 12. PUT /api/template/{id}/validate
    AF->>+DB: 13. Actualizar plantilla validada
    DB-->>-AF: 14. Confirmación
    AF->>+BS: 15. Guardar JSON final
    BS-->>-AF: 16. Template URL
    AF-->>-F: 17. Plantilla guardada
    F-->>-U: 18. ✅ Confirmación + Analytics
```

## 👥 Equipo del Proyecto

| Rol | Nombre | Responsabilidades | Contacto |
|-----|--------|-------------------|----------|
| **🎯 Project Manager** | **Luis Fernando Martínez Manrique** | • Gestión general del proyecto<br/>• Coordinación entre equipos<br/>• Seguimiento de timelines<br/>• Comunicación con stakeholders | [📧 Contacto](mailto:luis.fernando@clinicseo.com.mx) |
| **👨‍💼 Tech Lead** | **José de Jesús Martínez Manrique** | • Arquitectura técnica<br/>• Code reviews<br/>• Decisiones de tecnología<br/>• Mentoring del equipo | [📧 Contacto](mailto:Josedejesus@clinicseo.com.mxjesus@clinicseo.com) |
| **💻 Full Stack Developer** | **Francisco Javier Martínez Manrique** | • Desarrollo frontend (React)<br/>• Desarrollo backend (Azure Functions)<br/>• Integración de servicios<br/>• Testing e implementación | [📧 Contacto](mailto:francisco.javier@clinicseo.com.mx) |

## 🚀 Características

- 📄 **Análisis automático de PDFs** usando Azure Document Intelligence
- 🔍 **Detección inteligente de campos** con tipos mexicanos (RFC, CURP)
- 🎮 **Interfaz de validación gamificada** para mejor experiencia de usuario
- 📊 **Sistema de versionado** de plantillas con historial completo
- 📏 **Cálculo dimensional** de capacidad de campos automático
- 🔐 **Integración con Azure AD** para seguridad empresarial
- ⚡ **CI/CD automatizado** con GitHub Actions y Azure deployment

## 📋 Tecnologías

### Frontend
- **React 18** con TypeScript
- **Material-UI 5** para componentes
- **Redux Toolkit** para manejo de estado
- **React PDF** para visualización de documentos

### Backend
- **Azure Functions** v4 con Node.js 20
- **TypeScript** para tipado estático
- **Azure Document Intelligence** para procesamiento
- **Azure Cosmos DB** para almacenamiento

### Infraestructura
- **Azure Static Web Apps** para hosting
- **Azure Functions** para serverless backend
- **Azure Storage** para archivos y PDFs
- **Azure Key Vault** para secretos

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- npm 9+
- Azure CLI
- Azure Subscription
- GitHub Account

### Configuración Local

```bash
# Clonar el repositorio
git clone https://github.com/CLINICseo/medical-forms-template-generator.git
cd medical-forms-template-generator

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Azure

# Iniciar desarrollo
npm run dev
```

### Variables de Entorno Requeridas

```bash
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Resource Configuration
RESOURCE_GROUP_NAME=rg-medical-forms-prod
STORAGE_ACCOUNT_NAME=stmedicalformsprod
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-docint.cognitiveservices.azure.com/

# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
```

## 🏃‍♂️ Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Ejecutar frontend y backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Build
npm run build            # Build completo
npm run build:frontend   # Build del frontend
npm run build:backend    # Build del backend

# Testing
npm test                 # Ejecutar todos los tests
npm run test:frontend    # Tests del frontend
npm run test:backend     # Tests del backend
npm run test:coverage    # Tests con cobertura

# Calidad de Código
npm run lint             # Linting completo
npm run lint:fix         # Aplicar correcciones automáticas
npm run format           # Formatear código
npm run code-quality     # Verificación completa
npm run code-quality:fix # Correcciones automáticas
```

## 🚀 Despliegue

### Desarrollo
```bash
# Desplegar infraestructura
npm run deploy:dev

# Desplegar aplicación
npm run deploy:app:dev
```

### Producción
```bash
# Desplegar infraestructura
npm run deploy:prod

# Desplegar aplicación (automático via GitHub Actions)
git push origin main
```

## 📖 Documentación Adicional

- 📐 [Arquitectura del Sistema](./docs/architecture/overview.md)
- 🔧 [Guía de API](./docs/api/reference.md)
- 👥 [Guía de Contribución](./CONTRIBUTING.md)
- 🚀 [Guía de Despliegue](./docs/deployment/azure-setup.md)
- 🔒 [Configuración de Seguridad](./docs/security/setup.md)
- 📊 [Monitoreo y Logging](./docs/monitoring/setup.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'feat: add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Convenciones de Commits
Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Formateo, punto y comas, etc.
- `refactor:` Refactorización de código
- `test:` Agregar o corregir tests
- `chore:` Tareas de mantenimiento

## 🐛 Reporte de Bugs

Para reportar bugs, usa nuestros templates de issues:

- 🐛 **Bug Report** - Para errores y problemas
- ✨ **Feature Request** - Para nuevas funcionalidades
- 📚 **Documentation** - Para mejoras en documentación

## 📈 Roadmap

### Versión 1.0 (Actual)
- ✅ Análisis básico de PDFs
- ✅ Detección de campos de texto
- ✅ Interfaz de validación
- ✅ Sistema de versionado
- ✅ CI/CD pipeline

### Versión 1.1 (Próximo Release)
- 🔄 Detección de tablas complejas
- 🔄 Soporte para formularios multi-página
- 🔄 API REST pública
- 🔄 Dashboard de analytics

### Versión 2.0 (Futuro)
- 📋 Machine Learning personalizado
- 📋 Integración con múltiples aseguradoras
- 📋 App móvil
- 📋 Marketplace de plantillas

## 📊 Métricas del Proyecto

- **Cobertura de Tests**: 85%+
- **Performance Score**: 95+
- **Accessibility Score**: 100
- **Time to Process**: < 30 segundos
- **Uptime**: 99.9%

## 📄 Licencia

Este proyecto es propietario y confidencial. Todos los derechos reservados.

**Copyright (c) 2025 CLINICseo**  
Todos los derechos reservados.

Este software es propietario y confidencial.  
La distribución, modificación o uso no autorizado está prohibido.

## 🙏 Agradecimientos

- **Azure Team** por el excelente soporte de Document Intelligence
- **React Community** por las librerías increíbles
- **TypeScript Team** por hacer JavaScript mejor
- **GitHub** por las herramientas de desarrollo

---

⭐ **¡Dale una estrella si este proyecto te ayuda!**

🆘 **¿Necesitas ayuda?**
- 📧 **Email**: [soporte@clinicseo.com](mailto:soporte@clinicseo.com)
- 💬 **Teams**: Canal #medical-forms-support
- 📚 **Wiki**: [Documentación completa](./docs/README.md)
