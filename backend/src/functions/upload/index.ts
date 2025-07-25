import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { blobStorage } from "../../shared/services/blob-storage/storage.service";
import { documentModel } from "../../shared/models/document.model";
import { auditModel, AuditAction, ResourceType } from "../../shared/models/audit.model";
import { validateRequest } from "../../shared/utils/validation";
import { handleError, ValidationError } from "../../shared/utils/error-handler";

async function uploadPdf(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Validate request
    const validation = validateRequest(request, {
      method: "POST"
    });

    if (!validation.isValid) {
      return {
        status: 400,
        jsonBody: { 
          error: "Bad Request", 
          details: validation.errors 
        }
      };
    }

    // Get request body
    const body = await request.arrayBuffer();
    
    if (!body || body.byteLength === 0) {
      throw new ValidationError("No file provided in request");
    }

    // Get metadata from headers
    const fileName = request.headers.get('X-File-Name');
    const documentType = request.headers.get('X-Document-Type');
    const insurerName = request.headers.get('X-Insurer-Name');
    const userId = request.headers.get('X-User-Id') || 'anonymous';

    if (!fileName || !documentType || !insurerName) {
      throw new ValidationError("Missing required headers: X-File-Name, X-Document-Type, X-Insurer-Name");
    }

    // Convert ArrayBuffer to Buffer
    const fileBuffer = Buffer.from(body);

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      throw new ValidationError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    // Generate unique blob name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blobName = `uploads/${insurerName}/${documentType}/${timestamp}_${fileName}`;

    // Upload to blob storage
    const uploadResult = await blobStorage.uploadPdf(
      fileBuffer,
      fileName,
      userId,
      {
        documentType,
        insurerName,
        originalFileName: fileName
      }
    );
    const blobUrl = uploadResult.blobUrl;

    // Create document record with minimal analysis result
    const document = await documentModel.create({
      fileName,
      blobUrl,
      userId,
      fileSize: fileBuffer.length,
      analysisResult: {
        documentId: "", // Will be populated by the model
        documentType,
        status: "pending",
        pageCount: 0,
        detectedFields: [],
        confidence: 0,
        analyzedAt: new Date().toISOString()
      }
    });

    // Log audit
    await auditModel.create({
      action: AuditAction.UPLOAD,
      userId,
      resourceType: ResourceType.DOCUMENT,
      resourceId: document.id,
      details: {
        fileName,
        documentType,
        insurerName,
        fileSize: fileBuffer.length
      }
    });

    context.log(`PDF uploaded successfully: ${fileName} (${document.id})`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        documentId: document.id,
        fileName,
        blobUrl,
        status: "pending",
        message: "PDF uploaded successfully"
      }
    };

  } catch (error) {
    context.error('Upload error:', error);
    
    if (error instanceof ValidationError) {
      return {
        status: 400,
        jsonBody: {
          error: "Validation Error",
          message: error.message
        }
      };
    }

    return {
      status: 500,
      jsonBody: {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }
    };
  }
}

app.http('uploadPdf', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'upload',
  handler: uploadPdf
});

export default uploadPdf;