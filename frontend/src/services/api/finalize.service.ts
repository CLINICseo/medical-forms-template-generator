import { apiClient } from './client';
import { FieldDetection } from '../../components/pdf/PDFViewer';

export interface FinalizeRequest {
  documentId: string;
  validatedFields: FieldDetection[];
  reviewerNotes?: string;
  finalStatus: 'approved' | 'rejected' | 'needs_review';
  qualityScore?: number;
}

export interface FinalizeResult {
  documentId: string;
  finalizedAt: string;
  status: string;
  templateId?: string;
  validationSummary: {
    totalFields: number;
    approvedFields: number;
    rejectedFields: number;
    averageConfidence: number;
  };
}

export interface FinalizeResponse {
  success: boolean;
  data: FinalizeResult;
}

class FinalizeService {
  async finalizeValidation(request: FinalizeRequest): Promise<FinalizeResult> {
    try {
      const response = await apiClient.post<FinalizeResponse>(`/finalize/${request.documentId}`, {
        validatedFields: request.validatedFields,
        reviewerNotes: request.reviewerNotes,
        finalStatus: request.finalStatus,
        qualityScore: request.qualityScore
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error('Finalization failed: Invalid response format');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Finalization failed: Unknown error');
    }
  }

  async approveTemplate(documentId: string, fields: FieldDetection[], notes?: string): Promise<FinalizeResult> {
    return this.finalizeValidation({
      documentId,
      validatedFields: fields,
      reviewerNotes: notes,
      finalStatus: 'approved',
      qualityScore: this.calculateQualityScore(fields)
    });
  }

  async rejectTemplate(documentId: string, fields: FieldDetection[], reason: string): Promise<FinalizeResult> {
    return this.finalizeValidation({
      documentId,
      validatedFields: fields,
      reviewerNotes: reason,
      finalStatus: 'rejected',
      qualityScore: this.calculateQualityScore(fields)
    });
  }

  async markForReview(documentId: string, fields: FieldDetection[], notes: string): Promise<FinalizeResult> {
    return this.finalizeValidation({
      documentId,
      validatedFields: fields,
      reviewerNotes: notes,
      finalStatus: 'needs_review',
      qualityScore: this.calculateQualityScore(fields)
    });
  }

  private calculateQualityScore(fields: FieldDetection[]): number {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    const averageConfidence = totalConfidence / fields.length;
    
    // Quality score based on average confidence and field completeness
    const completenessScore = Math.min(fields.length / 10, 1); // Assume 10 fields is optimal
    const qualityScore = (averageConfidence * 0.7) + (completenessScore * 0.3);
    
    return Math.round(qualityScore * 100);
  }
}

export const finalizeService = new FinalizeService();