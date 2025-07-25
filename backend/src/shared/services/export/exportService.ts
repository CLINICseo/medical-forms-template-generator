import { BlobStorageService } from '../blob-storage/storage.service';

export interface ExportRequest {
  documentId: string;
  format: 'json' | 'xml' | 'pdf-template';
  fields: any[];
  includeCoordinates?: boolean;
  includeMedicalMetadata?: boolean;
}

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  format: string;
  fileSize: number;
  exportedAt: string;
}

export class ExportService {
  private blobService = new BlobStorageService();

  async exportTemplate(request: ExportRequest): Promise<ExportResult> {
    const { documentId, format, fields, includeCoordinates = true, includeMedicalMetadata = true } = request;
    
    // Generate export content based on format
    const { content, contentType, fileExtension } = this.generateExportContent(
      documentId, format, fields, includeCoordinates, includeMedicalMetadata
    );

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${documentId}_export_${timestamp}.${fileExtension}`;

    // Upload to blob storage using direct container access
    await this.blobService.initialize();
    const buffer = Buffer.from(content, 'utf-8');
    
    // Get exports container (we'll use templates container for now)
    const containerClient = this.blobService['blobServiceClient'].getContainerClient('templates');
    await containerClient.createIfNotExists({ access: 'blob' });
    
    const blobName = `exports/${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      metadata: {
        documentId,
        exportFormat: format,
        exportedAt: new Date().toISOString(),
        fileSize: buffer.length.toString()
      }
    });
    
    const blobUrl = blockBlobClient.url;

    return {
      downloadUrl: blobUrl,
      fileName,
      format,
      fileSize: buffer.length,
      exportedAt: new Date().toISOString()
    };
  }

  private generateExportContent(
    documentId: string,
    format: string,
    fields: any[],
    includeCoordinates: boolean,
    includeMedicalMetadata: boolean
  ): { content: string; contentType: string; fileExtension: string } {
    
    switch (format) {
      case 'json':
        return {
          content: JSON.stringify({
            documentId,
            exportedAt: new Date().toISOString(),
            fields: fields.map(field => ({
              fieldId: field.fieldId,
              displayName: field.displayName,
              fieldType: field.fieldType,
              value: field.value,
              confidence: field.confidence,
              ...(includeCoordinates && {
                boundingBox: field.boundingBox,
                pageNumber: field.pageNumber
              }),
              ...(includeMedicalMetadata && {
                medicalType: field.medicalType || 'general',
                validationRules: field.validationRules || []
              })
            })),
            metadata: {
              totalFields: fields.length,
              averageConfidence: this.calculateAverageConfidence(fields),
              exportFormat: 'json',
              version: '1.0'
            }
          }, null, 2),
          contentType: 'application/json',
          fileExtension: 'json'
        };

      case 'xml':
        const xmlFields = fields.map(field => `
    <field>
      <fieldId>${this.escapeXml(field.fieldId)}</fieldId>
      <displayName><![CDATA[${field.displayName}]]></displayName>
      <fieldType>${this.escapeXml(field.fieldType)}</fieldType>
      <value><![CDATA[${field.value || ''}]]></value>
      <confidence>${field.confidence}</confidence>
      ${includeCoordinates ? `
      <boundingBox>
        <x>${field.boundingBox?.[0] || 0}</x>
        <y>${field.boundingBox?.[1] || 0}</y>
        <width>${field.boundingBox?.[2] || 0}</width>
        <height>${field.boundingBox?.[3] || 0}</height>
      </boundingBox>
      <pageNumber>${field.pageNumber || 1}</pageNumber>` : ''}
      ${includeMedicalMetadata ? `
      <medicalType>${this.escapeXml(field.medicalType || 'general')}</medicalType>` : ''}
    </field>`).join('');

        return {
          content: `<?xml version="1.0" encoding="UTF-8"?>
<medicalFormTemplate>
  <documentId>${this.escapeXml(documentId)}</documentId>
  <exportedAt>${new Date().toISOString()}</exportedAt>
  <fields>${xmlFields}
  </fields>
  <metadata>
    <totalFields>${fields.length}</totalFields>
    <averageConfidence>${this.calculateAverageConfidence(fields)}</averageConfidence>
    <exportFormat>xml</exportFormat>
    <version>1.0</version>
  </metadata>
</medicalFormTemplate>`,
          contentType: 'application/xml',
          fileExtension: 'xml'
        };

      case 'pdf-template':
        return {
          content: JSON.stringify({
            documentId,
            templateVersion: '1.0',
            exportedAt: new Date().toISOString(),
            pdfTemplate: {
              fields: fields.map(field => ({
                id: field.fieldId,
                name: field.displayName,
                type: field.fieldType,
                coordinates: includeCoordinates ? {
                  x: field.boundingBox?.[0] || 0,
                  y: field.boundingBox?.[1] || 0,
                  width: field.boundingBox?.[2] || 0,
                  height: field.boundingBox?.[3] || 0,
                  page: field.pageNumber || 1
                } : undefined,
                validation: includeMedicalMetadata ? {
                  required: field.confidence >= 0.8,
                  medicalType: field.medicalType || 'general',
                  rules: field.validationRules || []
                } : undefined
              })),
              metadata: {
                totalFields: fields.length,
                averageConfidence: this.calculateAverageConfidence(fields),
                templateType: 'medical-form-mexican',
                version: '1.0'
              }
            }
          }, null, 2),
          contentType: 'application/json',
          fileExtension: 'json'
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private calculateAverageConfidence(fields: any[]): number {
    if (fields.length === 0) return 0;
    const total = fields.reduce((sum, field) => sum + (field.confidence || 0), 0);
    return Math.round((total / fields.length) * 100) / 100;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

export const exportService = new ExportService();