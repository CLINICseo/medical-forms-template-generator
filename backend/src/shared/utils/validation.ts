import { HttpRequest } from "@azure/functions";

export interface ValidationOptions {
  requiredFields?: string[];
  method?: string | string[];
  maxBodySize?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validateRequest(
  req: HttpRequest,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];

  // Validate HTTP method
  if (options.method) {
    const allowedMethods = Array.isArray(options.method) 
      ? options.method 
      : [options.method];
    
    if (!allowedMethods.includes(req.method.toUpperCase())) {
      errors.push(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(", ")}`);
    }
  }

  // Validate required fields in body
  if (options.requiredFields && req.body) {
    // Note: For Azure Functions v4, body validation should be done after parsing
    // This is just a placeholder check
    errors.push("Body validation must be performed after parsing the request body");
  }

  // Validate body size
  // Note: For Azure Functions v4, body size validation should be done after parsing the request
  // This is left as a placeholder for now

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRFC(rfc: string): boolean {
  // Mexican RFC validation
  const rfcRegex = /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc.toUpperCase());
}

export function validateCURP(curp: string): boolean {
  // Mexican CURP validation
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return curpRegex.test(curp.toUpperCase());
}

export function validateNSS(nss: string): boolean {
  // Mexican NSS (Número de Seguridad Social) validation
  const nssRegex = /^\d{11}$/;
  return nssRegex.test(nss);
}

export function sanitizeFilename(filename: string): string {
  // Remove special characters and spaces
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}