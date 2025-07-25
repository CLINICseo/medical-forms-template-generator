# 🤝 Guía de Contribución - Medical Forms Template Generator

¡Gracias por tu interés en contribuir al **Medical Forms Template Generator**! Esta guía te ayudará a contribuir de manera efectiva al proyecto.

## 📋 Tabla de Contenidos

- [Configuración del Entorno](#configuración-del-entorno)
- [Convenciones de Commits](#convenciones-de-commits)
- [Flujo de Desarrollo](#flujo-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Reporte de Issues](#reporte-de-issues)
- [Comandos Útiles](#comandos-útiles)

## 🛠️ Configuración del Entorno

### Prerrequisitos
- Node.js 20+
- npm 9+
- Git
- Acceso a Azure subscription (para desarrollo completo)

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/CLINICseo/medical-forms-template-generator.git
cd medical-forms-template-generator

# Instalar dependencias
npm install

# Configurar variables de entorno
cp backend/local.settings.example.json backend/local.settings.json
# Editar con tus credenciales de Azure

# Verificar instalación
npm run build
npm run lint
```

## 🎯 Convenciones de Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/).

### Formato:

<tipo>[alcance opcional]: <descripción>
[cuerpo opcional]
[notas al pie opcionales]

### Tipos permitidos:

- **feat**: Nueva funcionalidad
- **fix**: Corrección de error
- **docs**: Cambios en documentación
- **style**: Cambios de formato (espacios, comas, etc.)
- **refactor**: Refactorización de código
- **perf**: Mejoras de rendimiento
- **test**: Agregar o corregir tests
- **chore**: Tareas de mantenimiento
- **ci**: Cambios en CI/CD
- **build**: Cambios en el sistema de build

### Ejemplos:

```bash
git commit -m "feat(auth): add user authentication"
git commit -m "fix(api): resolve CORS issue"
git commit -m "docs: update README with installation steps"
git commit -m "chore: update dependencies"
```

## Flujo de Desarrollo

1. Crear rama desde main
2. Hacer cambios
3. Ejecutar `npm run lint` y `npm run format`
4. Hacer commit con convenciones
5. Push y crear Pull Request

## 📏 Estándares de Código

### TypeScript
- Usar **strict mode** en configuración
- Interfaces para todos los tipos de datos
- Evitar `any`, usar tipos específicos
- Documentar funciones complejas con JSDoc

### React (Frontend)
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Usar Material-UI components consistentemente
- Estado global con Redux Toolkit

### Azure Functions (Backend)
- Manejo de errores consistente
- Logging estructurado
- Validación de entrada en todos los endpoints
- Respuestas HTTP estandarizadas

### Nomenclatura
```typescript
// ✅ Correcto
interface UserProfile {
  firstName: string;
  lastName: string;
}

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // implementación
};

// ❌ Incorrecto
interface userprofile {
  firstname: string;
  lastname: string;
}

const getUser = async (id: any) => {
  // implementación
};
```

## 🧪 Testing

### Estructura de Tests
```
├── backend/tests/       # Tests del backend
├── frontend/src/tests/  # Tests del frontend
└── tests/integration/   # Tests de integración
```

### Requisitos de Testing
- **Unit Tests**: Cobertura mínima 80%
- **Integration Tests**: Endpoints críticos
- **E2E Tests**: Flujos principales del usuario

### Ejecutar Tests
```bash
# Tests completos
npm run test

# Tests del frontend
npm run test:frontend

# Tests del backend  
npm run test:backend

# Tests con cobertura
npm run test:coverage
```

## 🔄 Pull Requests

### Antes de Crear un PR
1. ✅ Ejecutar `npm run build` sin errores
2. ✅ Ejecutar `npm run lint` sin warnings
3. ✅ Ejecutar `npm run test` con cobertura adecuada
4. ✅ Actualizar documentación si es necesario
5. ✅ Probar manualmente las funcionalidades afectadas

### Template de PR
```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] Breaking change (cambio que rompe compatibilidad)
- [ ] Documentación

## ¿Cómo se probó?
Describe las pruebas realizadas para verificar los cambios.

## Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado una revisión de mi propio código
- [ ] He añadido tests que prueban mi cambio
- [ ] Los tests nuevos y existentes pasan localmente
```

## 🐛 Reporte de Issues

### Tipos de Issues
- **🐛 Bug Report**: Para errores en el código
- **✨ Feature Request**: Para nuevas funcionalidades
- **📚 Documentation**: Para mejoras en documentación
- **🔧 Maintenance**: Para tareas de mantenimiento

### Template de Bug Report
```markdown
## Descripción del Bug
Descripción clara y concisa del error.

## Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Scrollear hasta '...'
4. Ver error

## Comportamiento Esperado
Descripción de lo que debería suceder.

## Screenshots
Si aplica, añadir screenshots para explicar el problema.

## Información del Entorno
- OS: [ej. Windows 11]
- Browser: [ej. Chrome 91]
- Versión del proyecto: [ej. 1.0.0]
```

## 📋 Comandos Útiles

### Desarrollo Diario
```bash
# Iniciar desarrollo completo
npm run dev

# Solo frontend (puerto 3000)
npm run dev:frontend

# Solo backend (puerto 7071)
npm run dev:backend
```

### Build y Testing
```bash
# Build completo
npm run build

# Build solo frontend
npm run build:frontend

# Build solo backend
npm run build:backend

# Tests completos
npm run test

# Tests en modo watch
npm run test:watch
```

### Calidad de Código
```bash
# Linting completo
npm run lint

# Corregir problemas de lint automáticamente
npm run lint:fix

# Formatear código
npm run format

# Verificar formato sin cambios
npm run format:check

# Verificación completa de calidad
npm run code-quality
```

### Utilidades
```bash
# Limpiar dependencias y builds
npm run clean

# Instalación limpia completa
npm run fresh-install

# Verificar configuración de entorno
npm run setup
```

## 🎯 Próximos Pasos

Después de configurar tu entorno:

1. **Revisar Issues**: Busca issues marcados como `good first issue`
2. **Entender el Código**: Revisa la arquitectura en `/docs`
3. **Hacer tu Primera Contribución**: Comienza con algo pequeño
4. **Únete a la Conversación**: Participa en discussions del repo

## 📞 ¿Necesitas Ayuda?

- 📧 **Email**: [soporte@clinicseo.com](mailto:soporte@clinicseo.com)
- 📚 **Documentación**: [/docs](./docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CLINICseo/medical-forms-template-generator/issues)

---

¡Gracias por contribuir al Medical Forms Template Generator! 🚀
