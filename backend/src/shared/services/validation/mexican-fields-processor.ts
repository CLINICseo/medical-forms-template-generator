import { FieldDetection, FieldType } from '../../types/document';
import { validateRFC, validateCURP, validateNSS } from '../../utils/validation';

// 🚀 NUEVO: Procesador especializado para campos mexicanos de Custom Neural Model
export class MexicanFieldsProcessor {
  
  // Patrones de validación específicos para formularios médicos mexicanos
  private readonly patterns = {
    rfc: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
    curp: /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]$/,
    nss: /^\d{11}$/,
    imss: /^\d{10,11}$/,
    issste: /^\d{8,10}$/,
    poliza: /^[A-Z0-9]{8,15}$/,
    telefono: /^\d{10}$/,
    fecha: /^\d{1,2}\/\d{1,2}\/\d{4}$/
  };

  // Mapeo de campos por aseguradora
  private readonly insurerFields: Record<string, {
    requiredFields: string[];
    polizaPattern: RegExp;
    specificFields: string[];
  }> = {
    'axa': {
      requiredFields: ['RFC', 'CURP', 'NSS', 'NumeroCertificado'],
      polizaPattern: /^AXA\d{8}$/,
      specificFields: ['CoberturaMedica', 'DeducibleAnual']
    },
    'mapfre': {
      requiredFields: ['RFC', 'CURP', 'NumeroPoliza'],
      polizaPattern: /^(MPF|MAPFRE)\d{9}$/,
      specificFields: ['RedMedica', 'ModalidadAtencion']
    },
    'gnp': {
      requiredFields: ['RFC', 'CURP', 'NSS', 'PolizaGNP'],
      polizaPattern: /^GNP\d{10}$/,
      specificFields: ['PlanCobertura', 'BeneficiosAdicionales']
    }
  };

  /**
   * Procesa y normaliza campos extraídos por Custom Neural Model
   */
  processExtractedFields(rawFields: FieldDetection[], detectedInsurer?: string): FieldDetection[] {
    console.log(`🇲🇽 Procesando ${rawFields.length} campos mexicanos...`);
    
    const processedFields: FieldDetection[] = [];
    const insurer = this.detectInsurer(rawFields, detectedInsurer);
    
    console.log(`🏥 Aseguradora detectada: ${insurer || 'Generic'}`);

    for (const field of rawFields) {
      const processedField = this.processField(field, insurer);
      if (processedField) {
        processedFields.push(processedField);
      }
    }

    // Validar campos requeridos por aseguradora
    this.validateRequiredFields(processedFields, insurer);

    console.log(`✅ Procesamiento completado: ${processedFields.length} campos válidos`);
    return processedFields;
  }

  /**
   * Procesa un campo individual con validación específica
   */
  private processField(field: FieldDetection, insurer?: string): FieldDetection | null {
    const normalizedValue = this.normalizeValue(field.value);
    
    // Skip empty or invalid content
    if (!normalizedValue || normalizedValue.length < 2) {
      return null;
    }

    // Detectar tipo de campo basado en contenido
    const detectedType = this.detectFieldType(field.displayName, normalizedValue);
    
    // Validar campo específico
    const isValid = this.validateField(detectedType, normalizedValue);
    
    if (!isValid && this.isCriticalField(detectedType)) {
      console.log(`⚠️ Campo crítico inválido: ${field.displayName} = "${normalizedValue}"`);
      return null;
    }

    // Aumentar confianza para campos validados correctamente
    const confidence = isValid ? Math.min(field.confidence + 0.2, 1.0) : field.confidence;

    return {
      ...field,
      value: normalizedValue,
      fieldType: detectedType,
      confidence,
      displayName: this.getNormalizedFieldName(detectedType, field.displayName),
      // Metadatos adicionales para Custom Neural Model
      isValidated: isValid,
      insurer: insurer,
      isCritical: this.isCriticalField(detectedType)
    };
  }

  /**
   * Detecta el tipo de campo basado en nombre y contenido
   */
  private detectFieldType(fieldName: string, value: string): FieldType {
    const lowerName = fieldName.toLowerCase();
    const upperValue = value.toUpperCase();

    // RFC - Registro Federal de Contribuyentes
    if (lowerName.includes('rfc') || this.patterns.rfc.test(upperValue)) {
      return FieldType.RFC;
    }

    // CURP - Clave Única de Registro de Población
    if (lowerName.includes('curp') || this.patterns.curp.test(upperValue)) {
      return FieldType.CURP;
    }

    // NSS - Número de Seguro Social
    if (lowerName.includes('nss') || lowerName.includes('seguro social') || this.patterns.nss.test(value)) {
      return FieldType.NSS;
    }

    // Número de póliza
    if (lowerName.includes('poliza') || lowerName.includes('certificado') || this.patterns.poliza.test(upperValue)) {
      return FieldType.POLICY_NUMBER;
    }

    // Fecha
    if (lowerName.includes('fecha') || this.patterns.fecha.test(value)) {
      return FieldType.DATE;
    }

    // Teléfono
    if (lowerName.includes('telefono') || lowerName.includes('celular') || this.patterns.telefono.test(value)) {
      return FieldType.PHONE;
    }

    // IMSS
    if (lowerName.includes('imss') || this.patterns.imss.test(value)) {
      return FieldType.IMSS_NUMBER;
    }

    // ISSSTE
    if (lowerName.includes('issste') || this.patterns.issste.test(value)) {
      return FieldType.ISSSTE_NUMBER;
    }

    return FieldType.TEXT;
  }

  /**
   * Valida un campo según su tipo
   */
  private validateField(fieldType: FieldType, value: string): boolean {
    switch (fieldType) {
      case FieldType.RFC:
        return validateRFC(value);
      case FieldType.CURP:
        return validateCURP(value);
      case FieldType.NSS:
        return validateNSS(value);
      case FieldType.PHONE:
        return this.patterns.telefono.test(value);
      case FieldType.DATE:
        return this.patterns.fecha.test(value) || this.isValidDate(value);
      default:
        return true; // Otros campos se consideran válidos por defecto
    }
  }

  /**
   * Normaliza valores de campos
   */
  private normalizeValue(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\/\.]/g, '')
      .toUpperCase();
  }

  /**
   * Detecta la aseguradora basada en los campos extraídos
   */
  private detectInsurer(fields: FieldDetection[], detectedInsurer?: string): string | undefined {
    if (detectedInsurer) return detectedInsurer.toLowerCase();

    const allText = fields.map(f => f.value).join(' ').toLowerCase();

    if (allText.includes('axa')) return 'axa';
    if (allText.includes('mapfre') || allText.includes('tepeyac')) return 'mapfre';
    if (allText.includes('gnp') || allText.includes('grupo nacional provincial')) return 'gnp';

    return undefined;
  }

  /**
   * Obtiene el nombre normalizado del campo
   */
  private getNormalizedFieldName(fieldType: FieldType, originalName: string): string {
    const typeNames: Partial<Record<FieldType, string>> = {
      [FieldType.RFC]: 'RFC',
      [FieldType.CURP]: 'CURP',
      [FieldType.NSS]: 'Número de Seguro Social',
      [FieldType.POLICY_NUMBER]: 'Número de Póliza',
      [FieldType.PHONE]: 'Teléfono',
      [FieldType.DATE]: 'Fecha',
      [FieldType.IMSS_NUMBER]: 'Número IMSS',
      [FieldType.ISSSTE_NUMBER]: 'Número ISSSTE',
      [FieldType.TEXT]: originalName
    };

    return typeNames[fieldType] || originalName;
  }

  /**
   * Determina si un campo es crítico para el procesamiento
   */
  private isCriticalField(fieldType: FieldType): boolean {
    return [
      FieldType.RFC,
      FieldType.CURP,
      FieldType.NSS,
      FieldType.POLICY_NUMBER
    ].includes(fieldType);
  }

  /**
   * Valida que estén presentes todos los campos requeridos
   */
  private validateRequiredFields(fields: FieldDetection[], insurer?: string): void {
    const lowerInsurer = insurer?.toLowerCase();
    if (!lowerInsurer || !this.insurerFields[lowerInsurer]) return;

    const requiredFields = this.insurerFields[lowerInsurer].requiredFields;
    const presentFields = fields.map(f => f.fieldType);

    const missingFields = requiredFields.filter((required: string) => {
      const fieldType = this.getFieldTypeFromString(required);
      return !presentFields.includes(fieldType);
    });

    if (missingFields.length > 0) {
      console.log(`⚠️ Campos requeridos faltantes para ${lowerInsurer.toUpperCase()}: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Convierte string a FieldType
   */
  private getFieldTypeFromString(fieldName: string): FieldType {
    const mapping: Record<string, FieldType> = {
      'RFC': FieldType.RFC,
      'CURP': FieldType.CURP,
      'NSS': FieldType.NSS,
      'NumeroCertificado': FieldType.POLICY_NUMBER,
      'NumeroPoliza': FieldType.POLICY_NUMBER,
      'PolizaGNP': FieldType.POLICY_NUMBER
    };

    return mapping[fieldName] || FieldType.TEXT;
  }

  /**
   * Valida si una fecha es válida
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Export singleton instance
export const mexicanFieldsProcessor = new MexicanFieldsProcessor();