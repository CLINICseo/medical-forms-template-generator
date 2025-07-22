export interface FieldDetection {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: FieldType | string;
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
  TEXT = "text",
  DATE = "date",
  EMAIL = "email",
  PHONE = "phone",
  CURRENCY = "currency",
  NUMBER = "number",
  CHECKBOX = "checkbox",
  // Mexican specific types
  RFC = "rfc",
  CURP = "curp",
  NSS = "nss"
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