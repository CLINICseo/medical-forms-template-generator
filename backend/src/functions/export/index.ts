import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { exportService } from '../../shared/services/export/exportService';

async function exportDocument(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }

  try {
    const documentId = request.params.documentId;
    
    if (!documentId) {
      return {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Document ID is required'
        }
      };
    }

    // Parse request body
    const requestBody = await request.json() as any;
    const { format, fields, includeCoordinates = true, includeMedicalMetadata = true } = requestBody;

    if (!format || !fields) {
      return {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Format and fields are required'
        }
      };
    }

    context.log(`Exporting template for document: ${documentId}, format: ${format}, fields: ${fields.length}`);

    // Use the export service
    const exportResult = await exportService.exportTemplate({
      documentId,
      format,
      fields,
      includeCoordinates,
      includeMedicalMetadata
    });

    context.log(`Export completed: ${documentId}, format: ${format}, size: ${exportResult.fileSize} bytes`);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      jsonBody: {
        success: true,
        data: exportResult
      }
    };

  } catch (error) {
    context.error('Export error:', error);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      jsonBody: {
        success: false,
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

app.http('exportDocument', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'export/{documentId}',
  handler: exportDocument
});

export { exportDocument };