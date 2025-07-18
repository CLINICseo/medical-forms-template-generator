# Guía de Contribución

## Convenciones de Commits

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
Flujo de Desarrollo

Crear rama desde main
Hacer cambios
Ejecutar npm run lint y npm run format
Hacer commit con convenciones
Push y crear Pull Request

Comandos Útiles
bash# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm run test

# Linting
npm run lint
npm run lint:fix

# Formato
npm run format
```
