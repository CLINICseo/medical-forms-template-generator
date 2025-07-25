export interface FieldDetection {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: FieldType | string;
  // 🚀 NUEVO: Campos para migración prebuilt-layout
  sourceType?: 'keyValuePair' | 'table' | 'checkbox' | 'paragraph' | 'custom-neural' | 'document';
  isRevolutionary?: boolean; // Marca campos de la migración
  // 🚀 NUEVO: Campos para Custom Neural Model
  isValidated?: boolean;
  insurer?: string;
  isCritical?: boolean;
  modelSource?: string;
}

export interface AnalysisResult {
  documentId: string;
  documentType: string;
  analyzedAt: string;
  pageCount: number;
  detectedFields: FieldDetection[];
  confidence: number;
  status: "pending" | "completed" | "failed";
}

export enum FieldType {
  // Basic types
  TEXT = "text",
  DATE = "date",
  EMAIL = "email",
  PHONE = "phone",
  CURRENCY = "currency",
  NUMBER = "number",
  CHECKBOX = "checkbox",
  
  // Mexican identifiers
  RFC = "rfc",
  CURP = "curp",
  NSS = "nss",
  IMSS_NUMBER = "imss-number",
  ISSSTE_NUMBER = "issste-number",
  FOLIO_AFILIACION = "folio-afiliacion",
  
  // Medical fields
  MEDICAL_DIAGNOSIS = "medical-diagnosis",
  MEDICAL_PROCEDURE = "medical-procedure",
  MEDICINE_NAME = "medicine-name",
  MEDICAL_SPECIALTY = "medical-specialty",
  HOSPITAL_NAME = "hospital-name",
  DOCTOR_NAME = "doctor-name",
  CEDULA_PROFESIONAL = "cedula-profesional",
  
  // Insurance fields
  POLICY_NUMBER = "policy-number",
  CLAIM_NUMBER = "claim-number",
  INSURER_NAME = "insurer-name",
  COVERAGE_TYPE = "coverage-type",
  DEDUCTIBLE = "deductible",
  COPAYMENT = "copayment",
  
  // Financial fields
  CLABE = "clabe",
  CREDIT_CARD = "credit-card",
  INVOICE_FOLIO = "invoice-folio",
  INVOICE_UUID = "invoice-uuid",
  
  // Location fields
  POSTAL_CODE = "postal-code",
  STATE = "state",
  MUNICIPALITY = "municipality",
  ADDRESS = "address"
}

export interface DocumentTemplate {
  templateId: string;
  documentType: string;
  insurerName: string;
  version: string;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
  status: "draft" | "validated" | "active" | "archived";
}

export interface TemplateField {
  fieldId: string;
  displayName: string;
  fieldType: FieldType;
  required: boolean;
  coordinates: FieldCoordinates;
  capacity: FieldCapacity;
  validation?: FieldValidation;
}

export interface FieldCoordinates {
  page: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FieldCapacity {
  maxCharacters: number;
  maxLines: number;
  fontSize: number;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  customRules?: string[];
}