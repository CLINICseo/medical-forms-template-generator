import { apiClient } from './client';

export interface ValidationWarning {
  fieldId: string;
  message: string;
  severity: string;
}

export interface FieldValidationResult {
  fieldId: string;
  fieldType: string;
  value: string;
  validationResults: {
    ruleName: string;
    result: {
      isValid: boolean;
      message?: string;
      suggestion?: string;
      confidence?: number;
    };
    severity: 'error' | 'warning' | 'info';
  }[];
  overallValid: boolean;
  confidence: number;
  suggestedCorrection?: string;
}

export interface FormValidationIssue {
  type: 'missing_required' | 'invalid_combination' | 'inconsistent_data' | 'format_mismatch';
  message: string;
  affectedFields: string[];
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface DetailedValidationResults {
  fieldResults: FieldValidationResult[];
  formSpecificIssues: FormValidationIssue[];
  validationSummary: {
    totalFields: number;
    validFields: number;
    fieldsWithErrors: number;
    fieldsWithWarnings: number;
    averageConfidence: number;
  };
  suggestions: string[];
}

export interface ValidationResult {
  documentId: string;
  validatedAt: string;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: ValidationWarning[];
  completionPercentage: number;
  status: string;
  detailedResults?: DetailedValidationResults;
  document?: any;
}

export interface ValidationResponse {
  success: boolean;
  data: ValidationResult;
}

class ValidationService {
  async validateDocument(documentId: string): Promise<ValidationResult> {
    try {

      const response = await apiClient.get<ValidationResponse>(`/validate/${documentId}`);
      

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Validation failed: Invalid response format');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Validation failed: Unknown error');
    }
  }

  async updateValidationStatus(documentId: string, status: string): Promise<ValidationResult> {
    try {
      const response = await apiClient.post<ValidationResponse>(`/validate/${documentId}`, {
        status: status
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Failed to update validation status');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update validation status');
    }
  }
}

export const validationService = new ValidationService();