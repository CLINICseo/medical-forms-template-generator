import { apiClient } from './client';

export interface ValidationWarning {
  fieldId: string;
  message: string;
  severity: string;
}

export interface ValidationResult {
  documentId: string;
  validatedAt: string;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: ValidationWarning[];
  completionPercentage: number;
  status: string;
  document?: any;
}

export interface ValidationResponse {
  success: boolean;
  data: ValidationResult;
}

class ValidationService {
  async validateDocument(documentId: string): Promise<ValidationResult> {
    try {
      console.log('Starting validation for document:', documentId);

      const response = await apiClient.get<ValidationResponse>(`/validate/${documentId}`);
      
      console.log('Validation response:', response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Validation failed: Invalid response format');
      }
    } catch (error) {
      console.error('Validation error:', error);
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
      console.error('Update validation error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update validation status');
    }
  }
}

export const validationService = new ValidationService();