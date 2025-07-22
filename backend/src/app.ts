import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';

// Simple interfaces for our data structures
interface DetectedField {
  fieldId: string;
  displayName: string;
  value: string;
  confidence: number;
  boundingBox: number[];
  pageNumber: number;
  fieldType: string;
}

interface AnalysisResult {
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

interface DocumentRecord {
  id: string;
  fileName: string;
  blobUrl: string | null;
  status: string;
  uploadedAt: string;
  fileSize: number;
  contentType: string;
}

// Health Check Endpoint
app.http('healthCheck', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    context.log('Health check requested');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Medical Forms Backend is running',
      environment: process.env.NODE_ENV || 'development',
      services: {
        documentIntelligence: !!process.env.DOCUMENT_INTELLIGENCE_ENDPOINT,
        storage: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
        cosmosDB: !!process.env.COSMOS_DB_ENDPOINT
      }
    };
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      jsonBody: health
    };
  }
});

// Upload Document Endpoint
app.http('uploadDocument', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'upload',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      };
    }

    try {
      context.log('Upload request received');
      
      // Get file data from request
      const body = await request.arrayBuffer();
      
      if (!body || body.byteLength === 0) {
        return {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          jsonBody: {
            success: false,
            error: 'No file data received'
          }
        };
      }
      
      // Generate unique document ID and filename
      const documentId = uuidv4();
      const fileName = `document_${documentId}.pdf`;
      
      // Create document record
      const documentRecord: DocumentRecord = {
        id: documentId,
        fileName: fileName,
        blobUrl: null,
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
        fileSize: body.byteLength,
        contentType: 'application/pdf'
      };
      
      context.log(`Document uploaded: ${documentId}, Size: ${body.byteLength} bytes`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: true,
          data: {
            documentId: documentId,
            fileName: fileName,
            status: 'uploaded',
            message: 'File uploaded successfully',
            fileSize: body.byteLength
          }
        }
      };
      
    } catch (error) {
      context.error('Upload error:', error);
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Upload failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
});

// Analyze Document Endpoint
app.http('analyzeDocument', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'analyze/{documentId?}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      };
    }

    try {
      context.log('Analyze request received');
      
      const documentId = request.params.documentId || uuidv4();
      
      // Enhanced mock analysis with Mexican-specific fields
      const mockAnalysis: AnalysisResult = {
        documentId: documentId,
        documentType: 'medical-form',
        analyzedAt: new Date().toISOString(),
        pageCount: 1,
        detectedFields: [
          {
            fieldId: 'nombre_paciente',
            displayName: 'Nombre del Paciente',
            value: 'Juan Pérez García',
            confidence: 0.95,
            boundingBox: [100, 150, 300, 25],
            pageNumber: 1,
            fieldType: 'text'
          },
          {
            fieldId: 'rfc',
            displayName: 'RFC',
            value: 'PEGJ850101ABC',
            confidence: 0.88,
            boundingBox: [100, 200, 200, 20],
            pageNumber: 1,
            fieldType: 'rfc'
          },
          {
            fieldId: 'curp',
            displayName: 'CURP',
            value: 'PEGJ850101HDFRNN05',
            confidence: 0.92,
            boundingBox: [100, 250, 250, 20],
            pageNumber: 1,
            fieldType: 'curp'
          },
          {
            fieldId: 'nss',
            displayName: 'Número de Seguro Social',
            value: '12345678901',
            confidence: 0.87,
            boundingBox: [100, 300, 180, 20],
            pageNumber: 1,
            fieldType: 'nss'
          },
          {
            fieldId: 'fecha_nacimiento',
            displayName: 'Fecha de Nacimiento',
            value: '01/01/1985',
            confidence: 0.94,
            boundingBox: [100, 350, 150, 20],
            pageNumber: 1,
            fieldType: 'date'
          }
        ],
        confidence: 0.91,
        status: 'completed',
        processingTime: 1.2,
        insurerDetected: 'MAPFRE',
        formType: 'reembolso-gastos-medicos'
      };
      
      context.log(`Document analyzed: ${documentId}, Fields detected: ${mockAnalysis.detectedFields.length}`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: true,
          data: mockAnalysis
        }
      };
      
    } catch (error) {
      context.error('Analysis error:', error);
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
});

// Validate Document Endpoint
app.http('validateDocument', {
  methods: ['POST', 'GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'validate/{documentId?}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      };
    }

    try {
      context.log('Validate request received');
      
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
      
      // Mock validation response
      const validationResult = {
        documentId: documentId,
        validatedAt: new Date().toISOString(),
        isValid: true,
        validationErrors: [],
        validationWarnings: [
          {
            fieldId: 'rfc',
            message: 'RFC format appears correct but verification with SAT recommended',
            severity: 'warning'
          }
        ],
        completionPercentage: 95,
        status: 'validated'
      };
      
      context.log(`Document validated: ${documentId}, Valid: ${validationResult.isValid}`);
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: true,
          data: validationResult
        }
      };
      
    } catch (error) {
      context.error('Validation error:', error);
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        jsonBody: {
          success: false,
          error: 'Validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
});

export default app;