export interface FinalizeRequest {
  documentId: string;
  validatedFields: any[];
  reviewerNotes?: string;
  finalStatus: 'approved' | 'rejected' | 'needs_review';
  qualityScore?: number;
}

export interface ValidationSummary {
  totalFields: number;
  approvedFields: number;
  rejectedFields: number;
  averageConfidence: number;
}

export interface FinalizeResult {
  documentId: string;
  finalizedAt: string;
  status: string;
  templateId?: string;
  validationSummary: ValidationSummary;
}

export interface FinalizationRecord {
  documentId: string;
  finalizedAt: string;
  finalStatus: string;
  templateId?: string;
  validatedFields: any[];
  reviewerNotes: string;
  qualityScore: number;
  validationSummary: ValidationSummary;
  metadata: {
    processingVersion: string;
    finalizedBy: string;
    validationRules: any[];
  };
}

export class FinalizeService {
  
  async finalizeDocument(request: FinalizeRequest): Promise<FinalizeResult> {
    const { documentId, validatedFields, reviewerNotes, finalStatus, qualityScore } = request;
    
    // Calculate validation summary
    const validationSummary = this.calculateValidationSummary(validatedFields);
    
    // Generate template ID for approved documents
    const templateId = finalStatus === 'approved' 
      ? `template_${documentId}_${Date.now()}` 
      : undefined;

    // Calculate quality score if not provided
    const calculatedQualityScore = qualityScore || this.calculateQualityScore(validatedFields, validationSummary);

    // Create finalization record
    const finalizationRecord: FinalizationRecord = {
      documentId,
      finalizedAt: new Date().toISOString(),
      finalStatus,
      templateId,
      validatedFields,
      reviewerNotes: reviewerNotes || '',
      qualityScore: calculatedQualityScore,
      validationSummary,
      metadata: {
        processingVersion: '1.0',
        finalizedBy: 'system', // Would be actual user ID in production
        validationRules: this.extractValidationRules(validatedFields)
      }
    };

    // TODO: Save to Cosmos DB in production
    // await this.saveFinalizationRecord(finalizationRecord);
    
    console.log(`Finalization record created for ${documentId}:`, {
      status: finalStatus,
      templateId,
      qualityScore: calculatedQualityScore,
      summary: validationSummary
    });

    // Return result
    return {
      documentId,
      finalizedAt: finalizationRecord.finalizedAt,
      status: finalStatus,
      templateId,
      validationSummary
    };
  }

  private calculateValidationSummary(fields: any[]): ValidationSummary {
    const totalFields = fields.length;
    const approvedFields = fields.filter(f => f.confidence >= 0.8).length;
    const rejectedFields = fields.filter(f => f.confidence < 0.5).length;
    const averageConfidence = totalFields > 0 
      ? fields.reduce((sum, f) => sum + (f.confidence || 0), 0) / totalFields 
      : 0;

    return {
      totalFields,
      approvedFields,
      rejectedFields,
      averageConfidence: Math.round(averageConfidence * 100) / 100
    };
  }

  private calculateQualityScore(fields: any[], summary: ValidationSummary): number {
    if (fields.length === 0) return 0;
    
    // Quality score based on multiple factors
    const confidenceScore = summary.averageConfidence; // 0-1
    const completenessScore = Math.min(fields.length / 10, 1); // Assume 10 fields is optimal
    const approvalRatio = summary.totalFields > 0 
      ? summary.approvedFields / summary.totalFields 
      : 0;
    
    // Weighted calculation
    const qualityScore = (
      confidenceScore * 0.4 +      // 40% confidence
      completenessScore * 0.3 +    // 30% completeness  
      approvalRatio * 0.3          // 30% approval ratio
    );
    
    return Math.round(qualityScore * 100);
  }

  private extractValidationRules(fields: any[]): any[] {
    return fields.map(field => ({
      fieldId: field.fieldId,
      appliedRules: field.validationRules || [],
      passed: field.confidence >= 0.7,
      fieldType: field.fieldType,
      medicalType: field.medicalType || 'general'
    }));
  }

  // Helper methods for different finalization statuses
  async approveDocument(
    documentId: string, 
    fields: any[], 
    notes?: string
  ): Promise<FinalizeResult> {
    return this.finalizeDocument({
      documentId,
      validatedFields: fields,
      reviewerNotes: notes,
      finalStatus: 'approved'
    });
  }

  async rejectDocument(
    documentId: string, 
    fields: any[], 
    reason: string
  ): Promise<FinalizeResult> {
    return this.finalizeDocument({
      documentId,
      validatedFields: fields,
      reviewerNotes: reason,
      finalStatus: 'rejected'
    });
  }

  async markForReview(
    documentId: string, 
    fields: any[], 
    notes: string
  ): Promise<FinalizeResult> {
    return this.finalizeDocument({
      documentId,
      validatedFields: fields,
      reviewerNotes: notes,
      finalStatus: 'needs_review'
    });
  }

  // TODO: Implement in production
  // private async saveFinalizationRecord(record: FinalizationRecord): Promise<void> {
  //   // Save to Cosmos DB
  //   const cosmosService = new CosmosService();
  //   await cosmosService.saveFinalizationRecord(record);
  // }
}

export const finalizeService = new FinalizeService();