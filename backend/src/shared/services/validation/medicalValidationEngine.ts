import { FieldDetection, FieldType } from '../../types/document';
import { validateRFC, validateCURP, validateNSS, validateEmail } from '../../utils/validation';

export interface ValidationRule {
  fieldType: FieldType | string;
  ruleName: string;
  validate: (value: string, field: FieldDetection) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
  confidence?: number;
}

export interface FieldValidationResult {
  fieldId: string;
  fieldType: string;
  value: string;
  validationResults: {
    ruleName: string;
    result: ValidationResult;
    severity: 'error' | 'warning' | 'info';
  }[];
  overallValid: boolean;
  confidence: number;
  suggestedCorrection?: string;
}

export interface DocumentValidationResult {
  documentId: string;
  validatedAt: string;
  fieldResults: FieldValidationResult[];
  overallValid: boolean;
  completionPercentage: number;
  validationSummary: {
    totalFields: number;
    validFields: number;
    fieldsWithErrors: number;
    fieldsWithWarnings: number;
    averageConfidence: number;
  };
  formSpecificIssues: FormValidationIssue[];
}

export interface FormValidationIssue {
  type: 'missing_required' | 'invalid_combination' | 'inconsistent_data' | 'format_mismatch';
  message: string;
  affectedFields: string[];
  severity: 'error' | 'warning';
  suggestion?: string;
}

export class MedicalValidationEngine {
  private validationRules: ValidationRule[] = [];

  constructor() {
    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    // Identificadores mexicanos
    this.addRule({
      fieldType: FieldType.RFC,
      ruleName: 'rfc_format',
      severity: 'error',
      description: 'Validar formato RFC mexicano',
      validate: (value: string) => {
        const isValid = validateRFC(value);
        return {
          isValid,
          message: isValid ? undefined : 'RFC no tiene formato válido (AAAA######AAA)',
          suggestion: isValid ? undefined : 'Formato esperado: 4 letras + 6 números + 3 caracteres'
        };
      }
    });

    this.addRule({
      fieldType: FieldType.CURP,
      ruleName: 'curp_format',
      severity: 'error',
      description: 'Validar formato CURP mexicano',
      validate: (value: string) => {
        const isValid = validateCURP(value);
        return {
          isValid,
          message: isValid ? undefined : 'CURP no tiene formato válido',
          suggestion: isValid ? undefined : 'Formato: 4 letras + 6 números + H/M + 5 letras + 1 dígito + 1 dígito'
        };
      }
    });

    this.addRule({
      fieldType: FieldType.NSS,
      ruleName: 'nss_format',
      severity: 'error',
      description: 'Validar formato NSS',
      validate: (value: string) => {
        const isValid = validateNSS(value);
        return {
          isValid,
          message: isValid ? undefined : 'NSS debe tener exactamente 11 dígitos',
          suggestion: isValid ? undefined : 'Formato: ###########'
        };
      }
    });

    // Campos médicos específicos
    this.addRule({
      fieldType: 'medical-diagnosis',
      ruleName: 'cie10_format',
      severity: 'warning',
      description: 'Validar formato CIE-10',
      validate: (value: string) => {
        const cie10Pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
        const isValid = cie10Pattern.test(value.toUpperCase());
        return {
          isValid,
          message: isValid ? undefined : 'Código CIE-10 podría tener formato incorrecto',
          suggestion: isValid ? undefined : 'Formato esperado: A##.## (ej: I21.0, C50.9)'
        };
      }
    });

    this.addRule({
      fieldType: 'cedula-profesional',
      ruleName: 'cedula_format',
      severity: 'warning',
      description: 'Validar formato cédula profesional',
      validate: (value: string) => {
        const cedulaPattern = /^\d{7,8}$/;
        const isValid = cedulaPattern.test(value.replace(/\s/g, ''));
        return {
          isValid,
          message: isValid ? undefined : 'Cédula profesional debe tener 7-8 dígitos',
          suggestion: isValid ? undefined : 'Formato esperado: 7 u 8 dígitos consecutivos'
        };
      }
    });

    // Campos financieros
    this.addRule({
      fieldType: 'clabe',
      ruleName: 'clabe_format',
      severity: 'error',
      description: 'Validar formato CLABE bancaria',
      validate: (value: string) => {
        const clabePattern = /^\d{18}$/;
        const cleanValue = value.replace(/\s/g, '');
        const isValid = clabePattern.test(cleanValue);
        return {
          isValid,
          message: isValid ? undefined : 'CLABE debe tener exactamente 18 dígitos',
          suggestion: isValid ? undefined : 'Formato: 18 dígitos consecutivos'
        };
      }
    });

    // Campos de ubicación mexicana
    this.addRule({
      fieldType: 'postal-code',
      ruleName: 'mexico_postal_code',
      severity: 'error',
      description: 'Validar código postal mexicano',
      validate: (value: string) => {
        const postalPattern = /^\d{5}$/;
        const isValid = postalPattern.test(value);
        return {
          isValid,
          message: isValid ? undefined : 'Código postal mexicano debe tener 5 dígitos',
          suggestion: isValid ? undefined : 'Formato: ##### (ej: 01000, 64000)'
        };
      }
    });

    // Validaciones de contenido específico
    this.addRule({
      fieldType: FieldType.EMAIL,
      ruleName: 'email_format',
      severity: 'error',
      description: 'Validar formato email',
      validate: (value: string) => {
        const isValid = validateEmail(value);
        return {
          isValid,
          message: isValid ? undefined : 'Formato de email inválido',
          suggestion: isValid ? undefined : 'Formato: usuario@dominio.com'
        };
      }
    });

    this.addRule({
      fieldType: FieldType.PHONE,
      ruleName: 'mexico_phone_format',
      severity: 'warning',
      description: 'Validar formato teléfono mexicano',
      validate: (value: string) => {
        const phonePattern = /^(\+52\s?)?(\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4})$/;
        const cleanValue = value.replace(/[\s()-]/g, '');
        const isValid = phonePattern.test(cleanValue) || /^\d{10}$/.test(cleanValue);
        return {
          isValid,
          message: isValid ? undefined : 'Formato de teléfono mexicano podría ser incorrecto',
          suggestion: isValid ? undefined : 'Formato: 10 dígitos o +52 ## #### ####'
        };
      }
    });

    // Campos de seguros
    this.addRule({
      fieldType: 'policy-number',
      ruleName: 'policy_length',
      severity: 'warning',
      description: 'Validar longitud número de póliza',
      validate: (value: string) => {
        const cleanValue = value.replace(/\s/g, '');
        const isValid = cleanValue.length >= 6 && cleanValue.length <= 20;
        return {
          isValid,
          message: isValid ? undefined : 'Número de póliza parece demasiado corto o largo',
          suggestion: isValid ? undefined : 'Pólizas típicamente tienen 6-20 caracteres'
        };
      }
    });

    // Validaciones de fechas
    this.addRule({
      fieldType: FieldType.DATE,
      ruleName: 'date_format',
      severity: 'error',
      description: 'Validar formato de fecha',
      validate: (value: string) => {
        const datePatterns = [
          /^\d{2}\/\d{2}\/\d{4}$/,  // DD/MM/YYYY
          /^\d{4}-\d{2}-\d{2}$/,    // YYYY-MM-DD
          /^\d{2}-\d{2}-\d{4}$/     // DD-MM-YYYY
        ];
        
        const isValidFormat = datePatterns.some(pattern => pattern.test(value));
        
        if (!isValidFormat) {
          return {
            isValid: false,
            message: 'Formato de fecha no reconocido',
            suggestion: 'Use DD/MM/YYYY, YYYY-MM-DD o DD-MM-YYYY'
          };
        }

        // Verificar si la fecha es válida
        let parsedDate: Date;
        if (value.includes('/')) {
          const [day, month, year] = value.split('/');
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          parsedDate = new Date(value);
        }

        const isValidDate = !isNaN(parsedDate.getTime());
        const isFutureDate = parsedDate > new Date();
        const isVeryOldDate = parsedDate < new Date('1900-01-01');

        if (!isValidDate) {
          return {
            isValid: false,
            message: 'Fecha inválida',
            suggestion: 'Verifique que el día, mes y año sean correctos'
          };
        }

        if (isVeryOldDate) {
          return {
            isValid: true,
            message: 'Fecha muy antigua, verifique si es correcta',
            confidence: 0.6
          };
        }

        if (isFutureDate) {
          return {
            isValid: true,
            message: 'Fecha futura detectada, verifique si es correcta',
            confidence: 0.7
          };
        }

        return { isValid: true };
      }
    });

    // Validaciones de montos
    this.addRule({
      fieldType: FieldType.CURRENCY,
      ruleName: 'currency_format',
      severity: 'warning',
      description: 'Validar formato de moneda',
      validate: (value: string) => {
        const currencyPattern = /^\$?\s?\d{1,3}(,\d{3})*(\.\d{2})?$|^\d+(\.\d{2})?$/;
        const isValid = currencyPattern.test(value.replace(/\s/g, ''));
        return {
          isValid,
          message: isValid ? undefined : 'Formato de moneda podría ser incorrecto',
          suggestion: isValid ? undefined : 'Formato: $1,234.56 o 1234.56'
        };
      }
    });
  }

  private addRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  async validateDocument(documentId: string, fields: FieldDetection[]): Promise<DocumentValidationResult> {
    const fieldResults: FieldValidationResult[] = [];
    
    // Validar cada campo individualmente
    for (const field of fields) {
      const fieldResult = await this.validateField(field);
      fieldResults.push(fieldResult);
    }

    // Validaciones a nivel de formulario
    const formIssues = this.validateFormConsistency(fields);

    // Calcular estadísticas
    const validFields = fieldResults.filter(r => r.overallValid).length;
    const fieldsWithErrors = fieldResults.filter(r => 
      r.validationResults.some(vr => vr.severity === 'error' && !vr.result.isValid)
    ).length;
    const fieldsWithWarnings = fieldResults.filter(r => 
      r.validationResults.some(vr => vr.severity === 'warning' && !vr.result.isValid)
    ).length;
    
    const averageConfidence = fieldResults.length > 0 
      ? fieldResults.reduce((sum, r) => sum + r.confidence, 0) / fieldResults.length 
      : 0;

    const completionPercentage = fields.length > 0 
      ? (validFields / fields.length) * 100 
      : 0;

    return {
      documentId,
      validatedAt: new Date().toISOString(),
      fieldResults,
      overallValid: fieldsWithErrors === 0 && formIssues.filter(i => i.severity === 'error').length === 0,
      completionPercentage,
      validationSummary: {
        totalFields: fields.length,
        validFields,
        fieldsWithErrors,
        fieldsWithWarnings,
        averageConfidence: Math.round(averageConfidence * 100) / 100
      },
      formSpecificIssues: formIssues
    };
  }

  private async validateField(field: FieldDetection): Promise<FieldValidationResult> {
    const applicableRules = this.validationRules.filter(rule => 
      rule.fieldType === field.fieldType || rule.fieldType === 'all'
    );

    const validationResults = applicableRules.map(rule => ({
      ruleName: rule.ruleName,
      result: rule.validate(field.value, field),
      severity: rule.severity
    }));

    // Determinar si el campo es válido en general
    const hasErrors = validationResults.some(vr => 
      vr.severity === 'error' && !vr.result.isValid
    );

    // Calcular confianza basada en validaciones
    let confidence = field.confidence;
    for (const vr of validationResults) {
      if (vr.result.confidence !== undefined) {
        confidence = Math.min(confidence, vr.result.confidence);
      } else if (!vr.result.isValid && vr.severity === 'error') {
        confidence *= 0.5; // Reducir confianza por errores
      } else if (!vr.result.isValid && vr.severity === 'warning') {
        confidence *= 0.8; // Reducir confianza por warnings
      }
    }

    // Generar sugerencia de corrección si es necesario
    const errorResult = validationResults.find(vr => 
      vr.severity === 'error' && !vr.result.isValid && vr.result.suggestion
    );

    return {
      fieldId: field.fieldId,
      fieldType: field.fieldType,
      value: field.value,
      validationResults,
      overallValid: !hasErrors,
      confidence: Math.max(0.1, confidence),
      suggestedCorrection: errorResult?.result.suggestion
    };
  }

  private validateFormConsistency(fields: FieldDetection[]): FormValidationIssue[] {
    const issues: FormValidationIssue[] = [];

    // Verificar campos requeridos para formularios médicos
    const requiredFieldTypes = ['nombre_paciente', 'fecha_nacimiento'];
    const missingRequired = requiredFieldTypes.filter(type => 
      !fields.some(f => f.fieldId.includes(type))
    );

    if (missingRequired.length > 0) {
      issues.push({
        type: 'missing_required',
        message: `Campos requeridos faltantes: ${missingRequired.join(', ')}`,
        affectedFields: missingRequired,
        severity: 'warning',
        suggestion: 'Verifique que todos los campos obligatorios estén presentes'
      });
    }

    // Validación de consistencia entre RFC y CURP
    const rfcField = fields.find(f => f.fieldType === FieldType.RFC);
    const curpField = fields.find(f => f.fieldType === FieldType.CURP);

    if (rfcField && curpField && rfcField.value && curpField.value) {
      // Extraer fecha de nacimiento de ambos
      const rfcDate = rfcField.value.substring(4, 10); // YYMMDD
      const curpDate = curpField.value.substring(4, 10); // YYMMDD

      if (rfcDate !== curpDate) {
        issues.push({
          type: 'inconsistent_data',
          message: 'Las fechas en RFC y CURP no coinciden',
          affectedFields: [rfcField.fieldId, curpField.fieldId],
          severity: 'error',
          suggestion: 'Verifique que RFC y CURP correspondan a la misma persona'
        });
      }
    }

    // Validación de rangos de edad para campos médicos
    const birthDateField = fields.find(f => f.fieldId.includes('fecha_nacimiento'));
    if (birthDateField && birthDateField.value) {
      try {
        const birthDate = new Date(birthDateField.value.split('/').reverse().join('-'));
        const age = new Date().getFullYear() - birthDate.getFullYear();
        
        if (age < 0 || age > 150) {
          issues.push({
            type: 'invalid_combination',
            message: `Edad calculada (${age} años) parece incorrecta`,
            affectedFields: [birthDateField.fieldId],
            severity: 'warning',
            suggestion: 'Verifique el formato y valor de la fecha de nacimiento'
          });
        }
      } catch (error) {
        // Error en parsing de fecha, ya manejado en validación individual
      }
    }

    return issues;
  }

  // Método para obtener sugerencias de mejora
  getValidationSuggestions(validationResult: DocumentValidationResult): string[] {
    const suggestions: string[] = [];

    if (validationResult.completionPercentage < 80) {
      suggestions.push('Considere revisar los campos con baja confianza para mejorar la precisión');
    }

    if (validationResult.validationSummary.fieldsWithErrors > 0) {
      suggestions.push('Corrija los errores de validación antes de proceder');
    }

    if (validationResult.formSpecificIssues.some(i => i.severity === 'error')) {
      suggestions.push('Resuelva las inconsistencias detectadas entre campos relacionados');
    }

    if (validationResult.validationSummary.averageConfidence < 0.7) {
      suggestions.push('La confianza promedio es baja. Considere verificar manualmente los campos detectados');
    }

    return suggestions;
  }
}

// Export singleton instance
export const medicalValidationEngine = new MedicalValidationEngine();