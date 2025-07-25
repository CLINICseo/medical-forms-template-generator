import { FieldDetection, FieldType } from "../types/document";
import { validateRFC, validateCURP, validateNSS } from "../utils/validation";

export interface FieldMappingRule {
  pattern: RegExp | string;
  fieldType: FieldType;
  validator?: (value: string) => boolean;
}

// 🚀 MEJORA: Mexican-specific field mapping rules expandidas
const mexicanFieldRules: Record<string, FieldMappingRule> = {
  rfc: {
    pattern: /rfc|r\.f\.c\.?|registro\s*federal|contribuyente/i,
    fieldType: FieldType.RFC,
    validator: validateRFC
  },
  curp: {
    pattern: /curp|c\.u\.r\.p\.?|clave\s*única|registro\s*población/i,
    fieldType: FieldType.CURP,
    validator: validateCURP
  },
  nss: {
    pattern: /nss|n\.s\.s\.?|seguro\s*social|número\s*seguridad/i,
    fieldType: FieldType.NSS,
    validator: validateNSS
  },
  imss: {
    pattern: /imss|número\s*imss|afiliación\s*imss|instituto\s*mexicano/i,
    fieldType: FieldType.IMSS_NUMBER
  },
  issste: {
    pattern: /issste|número\s*issste|afiliación\s*issste|instituto\s*seguridad/i,
    fieldType: FieldType.ISSSTE_NUMBER
  },
  folioAfiliacion: {
    pattern: /folio\s*afiliación|folio\s*afiliacion|número\s*afiliado/i,
    fieldType: FieldType.FOLIO_AFILIACION
  },
  // 🚀 NUEVOS: Campos específicos de formularios médicos mexicanos
  nombreCompleto: {
    pattern: /nombre\s*completo|nombre\s*del\s*paciente|nombre\s*asegurado|apellidos?\s*y\s*nombres?/i,
    fieldType: FieldType.TEXT
  },
  fechaNacimiento: {
    pattern: /fecha\s*nacimiento|fecha\s*nac\.?|birth\s*date|f\.\s*nac\.?/i,
    fieldType: FieldType.DATE
  },
  lugarNacimiento: {
    pattern: /lugar\s*nacimiento|lugar\s*nac\.?|entidad\s*nacimiento/i,
    fieldType: FieldType.TEXT
  },
  estadoCivil: {
    pattern: /estado\s*civil|e\.civil|soltero|casado|viudo|divorciado/i,
    fieldType: FieldType.TEXT
  },
  nacionalidad: {
    pattern: /nacionalidad|mexican[ao]|extranjero/i,
    fieldType: FieldType.TEXT
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
    fieldType: FieldType.ADDRESS
  },
  policy: {
    pattern: /póliza|poliza|número\s*póliza|policy\s*number/i,
    fieldType: FieldType.POLICY_NUMBER
  },
  amount: {
    pattern: /monto|cantidad|importe|suma\s*asegurada|amount|total/i,
    fieldType: FieldType.CURRENCY
  },
  diagnosis: {
    pattern: /diagnóstico|diagnostico|padecimiento|enfermedad|cie-?10/i,
    fieldType: FieldType.MEDICAL_DIAGNOSIS
  }
};

// Medical field mapping rules
const medicalFieldRules: Record<string, FieldMappingRule> = {
  medicalProcedure: {
    pattern: /procedimiento|cirugía|cirugia|operación|operacion|intervención/i,
    fieldType: FieldType.MEDICAL_PROCEDURE
  },
  medicine: {
    pattern: /medicamento|medicina|fármaco|farmaco|tratamiento/i,
    fieldType: FieldType.MEDICINE_NAME
  },
  specialty: {
    pattern: /especialidad|especialista|área\s*médica/i,
    fieldType: FieldType.MEDICAL_SPECIALTY
  },
  hospital: {
    pattern: /hospital|clínica|clinica|centro\s*médico|sanatorio/i,
    fieldType: FieldType.HOSPITAL_NAME
  },
  doctor: {
    pattern: /médico|medico|doctor|dr\.|dra\.|facultativo/i,
    fieldType: FieldType.DOCTOR_NAME
  },
  cedula: {
    pattern: /cédula|cedula|profesional|registro\s*médico/i,
    fieldType: FieldType.CEDULA_PROFESIONAL
  }
};

// Insurance field mapping rules
const insuranceFieldRules: Record<string, FieldMappingRule> = {
  claim: {
    pattern: /siniestro|reclamación|reclamacion|folio\s*siniestro/i,
    fieldType: FieldType.CLAIM_NUMBER
  },
  insurer: {
    pattern: /aseguradora|compañía\s*seguros|compania\s*seguros/i,
    fieldType: FieldType.INSURER_NAME
  },
  coverage: {
    pattern: /cobertura|tipo\s*cobertura|plan/i,
    fieldType: FieldType.COVERAGE_TYPE
  },
  deductible: {
    pattern: /deducible|franquicia/i,
    fieldType: FieldType.DEDUCTIBLE
  },
  copayment: {
    pattern: /copago|coaseguro|participación/i,
    fieldType: FieldType.COPAYMENT
  }
};

// Financial field mapping rules
const financialFieldRules: Record<string, FieldMappingRule> = {
  clabe: {
    pattern: /clabe|clave\s*bancaria|cuenta\s*clabe/i,
    fieldType: FieldType.CLABE
  },
  creditCard: {
    pattern: /tarjeta|número\s*tarjeta|card/i,
    fieldType: FieldType.CREDIT_CARD
  },
  invoiceFolio: {
    pattern: /folio\s*factura|factura|invoice/i,
    fieldType: FieldType.INVOICE_FOLIO
  },
  invoiceUuid: {
    pattern: /uuid|folio\s*fiscal|timbre/i,
    fieldType: FieldType.INVOICE_UUID
  }
};

// Location field mapping rules
const locationFieldRules: Record<string, FieldMappingRule> = {
  postalCode: {
    pattern: /código\s*postal|codigo\s*postal|c\.?p\.?|zip/i,
    fieldType: FieldType.POSTAL_CODE
  },
  state: {
    pattern: /estado|entidad\s*federativa|provincia/i,
    fieldType: FieldType.STATE
  },
  municipality: {
    pattern: /municipio|delegación|delegacion|alcaldía|alcaldia/i,
    fieldType: FieldType.MUNICIPALITY
  }
};

export class FieldMapper {
  private allRules: Record<string, FieldMappingRule>;

  constructor() {
    this.allRules = { 
      ...mexicanFieldRules, 
      ...commonFieldRules,
      ...medicalFieldRules,
      ...insuranceFieldRules,
      ...financialFieldRules,
      ...locationFieldRules
    };
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
      if (this.isIMSSNumber(fieldValue)) return FieldType.IMSS_NUMBER;
      if (this.isISSSTE(fieldValue)) return FieldType.ISSSTE_NUMBER;
      
      // Check medical patterns
      if (this.isCIE10(fieldValue)) return FieldType.MEDICAL_DIAGNOSIS;
      if (this.isCedulaProfesional(fieldValue)) return FieldType.CEDULA_PROFESIONAL;
      
      // Check financial patterns
      if (this.isCLABE(fieldValue)) return FieldType.CLABE;
      if (this.isCreditCard(fieldValue)) return FieldType.CREDIT_CARD;
      if (this.isUUID(fieldValue)) return FieldType.INVOICE_UUID;
      
      // Check location patterns
      if (this.isPostalCode(fieldValue)) return FieldType.POSTAL_CODE;

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
    let confidence = 0.75; // 🚀 MEJORA: Mayor confianza base para prebuilt-layout

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

  // Additional validation methods for new field types
  private isIMSSNumber(value: string): boolean {
    // IMSS format: 11 digits
    return /^\d{11}$/.test(value.replace(/[\s-]/g, ""));
  }

  private isISSSTE(value: string): boolean {
    // ISSSTE format: 10-11 digits
    return /^\d{10,11}$/.test(value.replace(/[\s-]/g, ""));
  }

  private isCIE10(value: string): boolean {
    // CIE-10 format: Letter + 2-3 digits + optional decimal and 1-2 digits
    return /^[A-Z]\d{2}(\.\d{1,2})?$/i.test(value);
  }

  private isCedulaProfesional(value: string): boolean {
    // Mexican professional license: 7-8 digits
    return /^\d{7,8}$/.test(value.replace(/[\s-]/g, ""));
  }

  private isCLABE(value: string): boolean {
    // Mexican CLABE: exactly 18 digits
    const cleaned = value.replace(/[\s-]/g, "");
    return /^\d{18}$/.test(cleaned);
  }

  private isCreditCard(value: string): boolean {
    // Credit card: 13-19 digits
    const cleaned = value.replace(/[\s-]/g, "");
    return /^\d{13,19}$/.test(cleaned);
  }

  private isUUID(value: string): boolean {
    // UUID format for Mexican invoices (CFDI)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private isPostalCode(value: string): boolean {
    // Mexican postal code: 5 digits
    return /^\d{5}$/.test(value.replace(/\s/g, ""));
  }
}

// Export singleton instance
export const fieldMapper = new FieldMapper();