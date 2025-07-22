import { apiClient } from './client';

export interface AnalysisRequest {
  documentId: string;
}

export interface DetectedField {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: string;
}

export interface AnalysisResult {
  documentId: string;
  documentType: string;
  analyzedAt: string;
  pageCount: number;
  detectedFields: DetectedField[];
  confidence: number;
  status: string;
  processingTime: number;
  insurerDetected: string;
  formType: string;
}

export interface AnalysisResponse {
  success: boolean;
  data: AnalysisResult;
}

class AnalysisService {
  async analyzeDocument(documentId: string): Promise<AnalysisResult> {
    try {
      console.log('Starting analysis for document:', documentId);

      const response = await apiClient.post<AnalysisResponse>(`/analyze/${documentId}`, {});
      
      console.log('Analysis response:', response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Analysis failed: Invalid response format');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Analysis failed: Unknown error');
    }
  }

  async getAnalysisStatus(documentId: string): Promise<string> {
    try {
      const result = await this.analyzeDocument(documentId);
      return result.status;
    } catch (error) {
      console.error('Failed to get analysis status:', error);
      return 'error';
    }
  }
}

export const analysisService = new AnalysisService();