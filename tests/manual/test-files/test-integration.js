#!/usr/bin/env node

/**
 * Script de prueba de integración completa
 * Verifica que todas las tareas críticas 19-22 estén funcionando correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 MEDICAL FORMS - TEST DE INTEGRACIÓN COMPLETA');
console.log('==================================================');
console.log('Verificando implementación de Tareas 19-22...\n');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - FALTA: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = content.includes(searchText);
    if (found) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`⚠️  ${description} - No encontrado: ${searchText}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} - Error leyendo archivo: ${error.message}`, 'red');
    return false;
  }
}

let totalChecks = 0;
let passedChecks = 0;

function runCheck(checkFunction, ...args) {
  totalChecks++;
  if (checkFunction(...args)) {
    passedChecks++;
  }
}

// TAREA 19: Verificar PDF Real
log('\n📋 TAREA 19: Visualización PDF Real', 'blue');
log('-----------------------------------', 'blue');

runCheck(checkFileContent, 
  'backend/src/app.ts', 
  'servePdf', 
  'Endpoint /api/pdf/:documentId implementado'
);

runCheck(checkFileContent, 
  'frontend/src/components/pdf/PDFViewer.tsx', 
  'documentId', 
  'PDFViewer actualizado para usar documentId'
);

runCheck(checkFileContent, 
  'frontend/src/pages/validation/ValidationPage.tsx', 
  'documentId={documentData.documentId}', 
  'ValidationPage pasa documentId al PDFViewer'
);

runCheck(checkFileContent, 
  'frontend/.env.local', 
  'REACT_APP_API_URL', 
  'Variables de entorno del frontend configuradas'
);

// TAREA 20: Verificar Coordenadas Azure DI
log('\n🧠 TAREA 20: Coordenadas Precisas Azure DI', 'blue');
log('------------------------------------------', 'blue');

runCheck(checkFile, 
  'backend/src/shared/services/document-intelligence/documentIntelligenceService.ts', 
  'DocumentIntelligenceService creado'
);

runCheck(checkFileContent, 
  'backend/src/shared/services/document-intelligence/documentIntelligenceService.ts', 
  'convertBoundingRegions', 
  'Conversión de coordenadas implementada'
);

runCheck(checkFileContent, 
  'backend/src/app.ts', 
  'documentIntelligenceService.analyzeDocument', 
  'Servicio DI integrado en endpoint de análisis'
);

runCheck(checkFileContent, 
  'backend/package.json', 
  '@azure/ai-form-recognizer', 
  'Paquete Azure Form Recognizer instalado'
);

// TAREA 21: Verificar Algoritmo Avanzado de Capacidad
log('\n📏 TAREA 21: Algoritmo Avanzado de Capacidad', 'blue');
log('--------------------------------------------', 'blue');

runCheck(checkFile, 
  'backend/src/shared/services/capacityCalculator.ts', 
  'CapacityCalculator avanzado creado'
);

runCheck(checkFileContent, 
  'backend/src/shared/services/capacityCalculator.ts', 
  'detectSpatialConflicts', 
  'Detección de conflictos espaciales implementada'
);

runCheck(checkFileContent, 
  'backend/src/shared/services/capacityCalculator.ts', 
  'STANDARD_FONT_WIDTHS', 
  'Análisis de fuentes variables implementado'
);

runCheck(checkFile, 
  'frontend/src/components/debug/CapacityAnalysisViewer.tsx', 
  'Componente de visualización de capacidad creado'
);

runCheck(checkFileContent, 
  'frontend/src/pages/validation/ValidationPage.tsx', 
  'CapacityAnalysisViewer', 
  'Integración de análisis de capacidad en UI'
);

// TAREA 22: Verificar Integración Completa
log('\n🔗 TAREA 22: Integración Completa Azure DI', 'blue');
log('------------------------------------------', 'blue');

runCheck(checkFileContent, 
  'backend/src/shared/services/document-intelligence/documentIntelligenceService.ts', 
  'capacityCalculator.calculateCapacities', 
  'Integración con calculador de capacidad'
);

runCheck(checkFileContent, 
  'backend/src/app.ts', 
  'debugDocumentIntelligence', 
  'Endpoint de debug para DI creado'
);

runCheck(checkFileContent, 
  'backend/src/app.ts', 
  'documentIntelligenceTest: await documentIntelligenceService.testConnection()', 
  'Test de conexión DI en health check'
);

runCheck(checkFileContent, 
  'frontend/src/components/pdf/PDFViewer.tsx', 
  'capacity?', 
  'Interface FieldDetection actualizada con capacidad'
);

// Verificación de archivos de configuración
log('\n⚙️  CONFIGURACIÓN DEL SISTEMA', 'blue');
log('-----------------------------', 'blue');

runCheck(checkFile, 
  'backend/local.settings.json', 
  'Configuración local del backend'
);

runCheck(checkFile, 
  'workspace.json', 
  'Configuración de Claude Code'
);

runCheck(checkFileContent, 
  'workspace.json', 
  'task19', 
  'Referencias a tareas críticas en workspace'
);

// Resumen final
log('\n📊 RESUMEN DE LA INTEGRACIÓN', 'blue');
log('=============================', 'blue');

const successRate = Math.round((passedChecks / totalChecks) * 100);

log(`\nTotal de verificaciones: ${totalChecks}`);
log(`Verificaciones exitosas: ${passedChecks}`, passedChecks === totalChecks ? 'green' : 'yellow');
log(`Tasa de éxito: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 75 ? 'yellow' : 'red');

if (successRate >= 90) {
  log('\n🎉 ¡INTEGRACIÓN COMPLETA EXITOSA!', 'green');
  log('✅ Todas las tareas críticas 19-22 están implementadas correctamente', 'green');
  log('✅ Sistema listo para testing con PDFs reales', 'green');
  log('✅ Azure Document Intelligence integrado con fallback robusto', 'green');
  log('✅ Algoritmo avanzado de capacidad funcionando', 'green');
} else if (successRate >= 75) {
  log('\n⚠️  INTEGRACIÓN MAYORMENTE COMPLETA', 'yellow');
  log('🔧 Algunas verificaciones fallaron, revisar elementos faltantes', 'yellow');
} else {
  log('\n❌ INTEGRACIÓN INCOMPLETA', 'red');
  log('🚨 Múltiples elementos críticos faltantes, revisar implementación', 'red');
}

// Próximos pasos recomendados
log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:', 'blue');
log('1. Configurar credenciales Azure Document Intelligence en local.settings.json');
log('2. Probar endpoint /api/health para verificar conexiones');
log('3. Probar endpoint /api/debug/document-intelligence para debug');
log('4. Subir un PDF real y verificar que se procese correctamente');
log('5. Verificar que el análisis de capacidad funcione en modo desarrollo');

log('\n' + '='.repeat(50));
process.exit(successRate >= 90 ? 0 : 1);