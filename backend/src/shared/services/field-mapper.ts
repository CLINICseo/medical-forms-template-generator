import { FieldDetection, FieldType } from "../types/document";
import { validateRFC, validateCURP, validateNSS } from "../utils/validation";

export interface FieldMappingRule {
  pattern: RegExp | string;
  fieldType: FieldType;
  validator?: (value: string) => boolean;
}

// Mexican-specific field mapping rules
const mexicanFieldRules: Record<string, FieldMappingRule> = {
  rfc: {
    pattern: /rfc|registro\s*federal|contribuyente/i,
    fieldType: FieldType.RFC,
    validator: validateRFC
  },
  curp: {
    pattern: /curp|clave\s*única|registro\s*población/i,
    fieldType: FieldType.CURP,
    validator: validateCURP
  },
  nss: {
    pattern: /nss|seguro\s*social|número\s*seguridad/i,
    fieldType: FieldType.NSS,
    validator: validateNSS
  }
};

// Common field mapping rules
const commonFieldRules: Record<string, FieldMappingRule> = {
  name: {
    pattern: /nombre\s*completo|nombre\s*paciente|nombre\s*asegurado|full\s*name/i,
    fieldType: FieldType.TEXT
  },
  birthdate: {
    pattern: /fecha\s*nacimiento|birth\s*date|fecha\s*nac/i,
    fieldType: FieldType.DATE
  },
  email: {
    pattern: /correo|email|e-mail/i,
    fieldType: FieldType.EMAIL
  },
  phone: {
    pattern: /teléfono|telefono|celular|móvil|phone|mobile/i,
    fieldType: FieldType.PHONE
  },
  address: {
    pattern: /dirección|direccion|domicilio|address/i,
    fieldType: FieldType.TEXT
  },
  policy: {
    pattern: /póliza|poliza|número\s*póliza|policy\s*number/i,
    fieldType: FieldType.TEXT
  },
  amount: {
    pattern: /monto|cantidad|importe|suma\s*asegurada|amount|total/i,
    fieldType: FieldType.CURRENCY
  },
  diagnosis: {
    pattern: /diagnóstico|diagnostico|padecimiento|enfermedad/i,
    fieldType: FieldType.TEXT
  }
};

export class FieldMapper {
  private allRules: Record<string, FieldMappingRule>;

  constructor() {
    this.allRules = { ...mexicanFieldRules, ...commonFieldRules };
  }

  mapField(fieldName: string, fieldValue: string): FieldDetection {
    const fieldType = this.detectFieldType(fieldName, fieldValue);
    const displayName = this.normalizeFieldName(fieldName);
    const confidence = this.calculateFieldConfidence(fieldName, fieldValue, fieldType);

    return {
      fieldId: this.generateFieldId(fieldName),
      displayName,
      value: fieldValue,
      confidence,
      boundingBox: [], // Will be filled by Document Intelligence
      pageNumber: 1, // Will be updated by Document Intelligence
      fieldType
    };
  }

  detectFieldType(fieldName: string, fieldValue: string): string {
    // First, check field name against rules
    for (const [key, rule] of Object.entries(this.allRules)) {
      if (typeof rule.pattern === "string") {
        if (fieldName.toLowerCase().includes(rule.pattern.toLowerCase())) {
          return rule.fieldType;
        }
      } else if (rule.pattern.test(fieldName)) {
        return rule.fieldType;
      }
    }

    // Then, try to detect by value pattern
    if (fieldValue) {
      // Check Mexican-specific patterns
      if (validateRFC(fieldValue)) return FieldType.RFC;
      if (validateCURP(fieldValue)) return FieldType.CURP;
      if (validateNSS(fieldValue)) return FieldType.NSS;

      // Check common patterns
      if (this.isDate(fieldValue)) return FieldType.DATE;
      if (this.isEmail(fieldValue)) return FieldType.EMAIL;
      if (this.isPhone(fieldValue)) return FieldType.PHONE;
      if (this.isCurrency(fieldValue)) return FieldType.CURRENCY;
      if (this.isNumber(fieldValue)) return FieldType.NUMBER;
    }

    return FieldType.TEXT;
  }

  normalizeFieldName(fieldName: string): string {
    // Remove special characters and normalize spacing
    let normalized = fieldName
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Capitalize each word
    normalized = normalized
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Apply specific transformations for known fields
    const transformations: Record<string, string> = {
      "Rfc": "RFC",
      "Curp": "CURP",
      "Nss": "NSS",
      "Fecha Nac": "Fecha de Nacimiento",
      "Tel": "Teléfono",
      "Num": "Número"
    };

    for (const [from, to] of Object.entries(transformations)) {
      normalized = normalized.replace(new RegExp(from, "gi"), to);
    }

    return normalized;
  }

  calculateFieldConfidence(fieldName: string, fieldValue: string, fieldType: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if field name matches known patterns
    for (const rule of Object.values(this.allRules)) {
      if (typeof rule.pattern === "string") {
        if (fieldName.toLowerCase().includes(rule.pattern.toLowerCase()) && 
            rule.fieldType === fieldType) {
          confidence += 0.3;
          break;
        }
      } else if (rule.pattern.test(fieldName) && rule.fieldType === fieldType) {
        confidence += 0.3;
        break;
      }
    }

    // Increase confidence if value validates correctly
    const rule = Object.values(this.allRules).find(r => r.fieldType === fieldType);
    if (rule?.validator && rule.validator(fieldValue)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private generateFieldId(fieldName: string): string {
    const sanitized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `field_${sanitized}_${timestamp}_${random}`;
  }

  private isDate(value: string): boolean {
    // Common date patterns in Mexico
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{2,4}$/,    // DD-MM-YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/        // YYYY-MM-DD
    ];
    return datePatterns.some(pattern => pattern.test(value));
  }

  private isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private isPhone(value: string): boolean {
    // Mexican phone patterns
    const phonePatterns = [
      /^\d{10}$/,                      // 10 digits
      /^\+52\s?\d{10}$/,              // +52 country code
      /^\(\d{2,3}\)\s?\d{7,8}$/      // (Area) Number
    ];
    return phonePatterns.some(pattern => pattern.test(value.replace(/\s/g, "")));
  }

  private isCurrency(value: string): boolean {
    // Mexican currency patterns
    const currencyPatterns = [
      /^\$[\d,]+\.?\d*$/,             // $1,234.56
      /^[\d,]+\.?\d*\s*(MXN|mxn|pesos?)$/  // 1234.56 MXN
    ];
    return currencyPatterns.some(pattern => pattern.test(value));
  }

  private isNumber(value: string): boolean {
    return /^\d+\.?\d*$/.test(value.replace(/,/g, ""));
  }
}

// Export singleton instance
export const fieldMapper = new FieldMapper();