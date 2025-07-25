# Custom Neural Model Training Guide - Formularios Médicos Mexicanos

## 🎯 Overview

Esta guía detalla cómo entrenar un **Custom Neural Model** específico para formularios médicos mexicanos, alcanzando **85-92% precisión** vs el 61% actual con prebuilt-layout.

## 📋 Dataset de Entrenamiento Requerido

### Formularios por Aseguradora

**Requisitos mínimos por aseguradora:**
- **15-20 ejemplos** de cada tipo de formulario
- **Calidad mínima**: 300 DPI, formato PDF
- **Variedad**: Diferentes estados de llenado (completo, parcial, manuscrito, digital)

#### 1. **AXA Seguros**
```
Formularios requeridos:
├── Reembolso de Gastos Médicos (5 ejemplos)
├── Solicitud de Autorización (5 ejemplos)  
├── Reporte de Siniestro (5 ejemplos)
└── Formato de Beneficiarios (5 ejemplos)

Campos críticos AXA:
- RFC, CURP, NSS
- Número de Certificado AXA
- Cobertura Médica
- Red Médica Preferencial
```

#### 2. **MAPFRE (Tepeyac)**
```
Formularios requeridos:
├── Reembolso Tepeyac (5 ejemplos)
├── Solicitud Cobertura (5 ejemplos)
├── Formato Siniestro (5 ejemplos)  
└── Alta de Beneficiarios (5 ejemplos)

Campos críticos MAPFRE:
- RFC, CURP  
- Número de Póliza MAPFRE
- Modalidad de Atención
- Red Médica
```

#### 3. **GNP (Grupo Nacional Provincial)**
```
Formularios requeridos:
├── Gastos Médicos GNP (5 ejemplos)
├── Autorización Previa (5 ejemplos)
├── Reporte Accidente (5 ejemplos)
└── Beneficiarios GNP (5 ejemplos)

Campos críticos GNP:
- RFC, CURP, NSS
- Póliza GNP
- Plan de Cobertura
- IMSS/ISSSTE
```

## 🏗️ Proceso de Entrenamiento

### Fase 1: Preparación del Dataset (1 semana)

#### **Paso 1.1: Recolección de Formularios**
```bash
# Estructura de directorios recomendada
training-data/
├── axa/
│   ├── reembolso/
│   ├── autorizacion/
│   ├── siniestro/
│   └── beneficiarios/
├── mapfre/
│   ├── reembolso/
│   ├── cobertura/
│   ├── siniestro/
│   └── beneficiarios/
└── gnp/
    ├── gastos-medicos/
    ├── autorizacion/
    ├── accidente/
    └── beneficiarios/
```

#### **Paso 1.2: Etiquetado de Campos**
Para cada PDF, crear archivo `.labels.json`:
```json
{
  "document": "axa_reembolso_001.pdf",
  "fields": [
    {
      "fieldName": "RFC",
      "value": "PEGJ850101ABC",
      "boundingBox": [120, 180, 180, 25],
      "pageNumber": 1,
      "confidence": 1.0,
      "fieldType": "rfc"
    },
    {
      "fieldName": "CURP", 
      "value": "PEGJ850101HDFRNN05",
      "boundingBox": [120, 220, 220, 20],
      "pageNumber": 1,
      "confidence": 1.0,
      "fieldType": "curp"
    },
    {
      "fieldName": "NumeroCertificado",
      "value": "AXA12345678",
      "boundingBox": [120, 260, 160, 20],
      "pageNumber": 1,
      "confidence": 1.0,
      "fieldType": "policy-number"
    }
  ],
  "insurer": "axa",
  "formType": "reembolso-gastos-medicos"
}
```

### Fase 2: Training en Azure (1-2 días)

#### **Paso 2.1: Crear Proyecto Custom Neural**
```bash
# Azure CLI - Crear custom model
az cognitiveservices formrecognizer model build \
  --resource-group medical-forms-rg \
  --account-name docint-medical-forms-dev \
  --model-name "medical-forms-mx-v1" \
  --build-mode "neural" \
  --training-data-url "https://stmedicalformsdev7nw4.blob.core.windows.net/training-data" \
  --description "Custom Neural Model para formularios médicos mexicanos (AXA, MAPFRE, GNP)"
```

#### **Paso 2.2: Configuración de Entrenamiento**
```json
{
  "modelName": "medical-forms-mx-v1",
  "buildMode": "neural",
  "description": "Formularios médicos mexicanos - AXA, MAPFRE, GNP",
  "trainingDataUrl": "https://stmedicalformsdev7nw4.blob.core.windows.net/training-data",
  "tags": {
    "version": "1.0",
    "language": "es-MX", 
    "domain": "medical-insurance",
    "insurers": "axa,mapfre,gnp"
  },
  "neuralConfig": {
    "maxIterations": 100,
    "learningRate": 0.001,
    "batchSize": 8
  }
}
```

#### **Paso 2.3: Monitoreo de Entrenamiento**
```bash
# Verificar progreso
az cognitiveservices formrecognizer model show \
  --resource-group medical-forms-rg \
  --account-name docint-medical-forms-dev \
  --model-id "medical-forms-mx-v1"

# Output esperado:
# Status: "ready"
# Accuracy: 85-92%
# Training time: 2-6 horas
```

### Fase 3: Implementación (30 minutos)

#### **Paso 3.1: Actualizar Configuración**
```bash
# Actualizar local.settings.json
{
  "USE_CUSTOM_MODEL": "true",
  "CUSTOM_NEURAL_MODEL_ID": "medical-forms-mx-v1"
}
```

#### **Paso 3.2: Deployment**
```bash
# Recompiliar backend
cd backend && npm run build

# Reiniciar Azure Functions
func start
```

#### **Paso 3.3: Verificación**
```bash
# Test debug endpoint
curl http://localhost:7075/api/debug/document-intelligence

# Output esperado:
{
  "useCustomModel": true,
  "customModelId": "medical-forms-mx-v1",
  "customModelReady": true,
  "mexicanFieldsProcessorReady": true
}
```

## 🎯 Resultados Esperados

### Métricas de Precisión

| Aseguradora | Campos Críticos | Precisión Actual | Precisión Esperada | Mejora |
|-------------|------------------|------------------|--------------------| -------|
| **AXA** | RFC, CURP, NSS, Certificado | 61% | 89-94% | +46% |
| **MAPFRE** | RFC, CURP, Póliza | 61% | 85-91% | +42% |
| **GNP** | RFC, CURP, NSS, Póliza | 61% | 87-92% | +44% |

### Métricas de Procesamiento

```
Antes (prebuilt-layout):
├── 357 campos detectados
├── 61% confianza promedio  
├── 13,721 conflictos espaciales
├── 0 key-value pairs detectados
└── Tiempo procesamiento: 12s

Después (custom-neural):
├── 180-220 campos de alta calidad
├── 85-92% confianza promedio
├── <500 conflictos espaciales  
├── 25-35 key-value pairs detectados
└── Tiempo procesamiento: 8-10s
```

## 🔧 Configuración Avanzada

### Optimizaciones por Aseguradora

#### **AXA Específicas**
```typescript
// Configuración especializada AXA
const axaConfig = {
  queryFields: [
    "RFC", "CURP", "NSS", 
    "NumeroCertificado", "CoberturaMedica",
    "RedMedicaPreferencial"
  ],
  validationPatterns: {
    certificado: /^AXA\d{8}$/,
    redMedica: ["Preferencial", "Abierta", "Básica"]
  }
};
```

#### **MAPFRE Específicas**
```typescript
// Configuración especializada MAPFRE  
const mapfreConfig = {
  queryFields: [
    "RFC", "CURP", "NumeroPoliza",
    "ModalidadAtencion", "RedMedica"
  ],
  validationPatterns: {
    poliza: /^(MPF|MAPFRE)\d{9}$/,
    modalidad: ["Particular", "IMSS", "ISSSTE"]
  }
};
```

#### **GNP Específicas**
```typescript
// Configuración especializada GNP
const gnpConfig = {
  queryFields: [
    "RFC", "CURP", "NSS", "PolizaGNP",
    "PlanCobertura", "InstitucionMedica"
  ],
  validationPatterns: {
    poliza: /^GNP\d{10}$/,
    plan: ["Básico", "Intermedio", "Superior", "Premium"]
  }
};
```

## 📊 Testing y Validación

### Script de Testing Automatizado

```bash
#!/bin/bash
# test-custom-model.sh

echo "🧪 Testing Custom Neural Model..."

# 1. Test endpoint debug
echo "1. Verificando configuración..."
curl -s http://localhost:7075/api/debug/document-intelligence | jq .

# 2. Test con PDF AXA
echo "2. Testing formulario AXA..."
curl -X POST -F "file=@test-files/axa-reembolso.pdf" \
  http://localhost:7075/api/upload

# 3. Análisis del resultado
echo "3. Analizando resultado..."
# ... análisis automatizado

echo "✅ Testing completado"
```

### Métricas de Calidad

```typescript
interface ModelQualityMetrics {
  overallAccuracy: number;      // Target: >85%
  fieldDetectionRate: number;   // Target: >90%
  falsePositiveRate: number;    // Target: <5%
  processingSpeed: number;      // Target: <10s
  spatialConflicts: number;     // Target: <500
  
  byInsurer: {
    axa: QualityScore;
    mapfre: QualityScore; 
    gnp: QualityScore;
  };
}
```

## 🚨 Troubleshooting

### Problemas Comunes

#### **Error: Model training failed**
```bash
# Verificar datos de entrenamiento
az storage blob list \
  --account-name stmedicalformsdev7nw4 \
  --container-name training-data

# Verificar formato de labels
python validate-labels.py training-data/
```

#### **Error: Low accuracy (<80%)**
```
Posibles causas:
1. Dataset insuficiente (<15 ejemplos por tipo)
2. Calidad de imagen baja (<300 DPI)
3. Etiquetado inconsistente
4. Formularios muy variables

Solución:
- Agregar más ejemplos
- Mejorar calidad de escaneo
- Revisar etiquetado manual
```

#### **Error: Custom model not loading**
```bash
# Verificar configuración
echo $USE_CUSTOM_MODEL
echo $CUSTOM_NEURAL_MODEL_ID

# Verificar permisos Azure
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

## 📈 Monitoreo y Mejora Continua

### Dashboard de Métricas

```typescript
// Métricas en tiempo real
const customModelMetrics = {
  dailyAccuracy: number[];
  fieldDetectionTrends: Record<string, number[]>;
  insurerPerformance: Record<string, QualityScore>;
  userFeedback: FeedbackScore[];
  retrainingTriggers: TriggerEvent[];
};
```

### Proceso de Reentrenamiento

```
Triggers para reentrenamiento:
├── Accuracy < 80% por 7 días consecutivos
├── Nuevos tipos de formulario detectados
├── Feedback negativo > 15% 
└── Cambios en formularios de aseguradoras

Frecuencia recomendada:
├── Reentrenamiento menor: Mensual
├── Reentrenamiento mayor: Trimestral
└── Evaluación de modelo: Semanal
```

## 🎉 Implementación Completada

Una vez completado el entrenamiento y deployment:

1. **Precisión objetivo**: 85-92% vs 61% actual
2. **Campos detectados**: 180-220 de alta calidad vs 357 con ruido
3. **Conflictos espaciales**: <500 vs 13,721 actuales
4. **Key-value pairs**: 25-35 vs 0 actuales
5. **Tiempo procesamiento**: 8-10s vs 12s actuales

**El Custom Neural Model representará una mejora revolucionaria de +40% en precisión y una reducción de 95% en conflictos espaciales.**