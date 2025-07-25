import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { finalizeService } from '../../shared/services/finalize/finalizeService';

async function finalizeDocument(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const { validatedFields, reviewerNotes, finalStatus, qualityScore } = requestBody;

    if (!validatedFields || !finalStatus) {
      return {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Validated fields and final status are required'
        }
      };
    }

    context.log(`Finalizing document: ${documentId}, status: ${finalStatus}, fields: ${validatedFields.length}`);

    // Use the finalize service
    const finalizeResult = await finalizeService.finalizeDocument({
      documentId,
      validatedFields,
      reviewerNotes,
      finalStatus,
      qualityScore
    });

    context.log(`Document finalized: ${documentId}, status: ${finalStatus}, template: ${finalizeResult.templateId || 'none'}`);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      jsonBody: {
        success: true,
        data: finalizeResult
      }
    };

  } catch (error) {
    context.error('Finalize error:', error);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      jsonBody: {
        success: false,
        error: 'Finalization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

app.http('finalizeDocument', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'finalize/{documentId}',
  handler: finalizeDocument
});

export { finalizeDocument };