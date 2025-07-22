import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { blobStorage } from "../../shared/services/blob-storage/storage.service";
import { documentModel } from "../../shared/models/document.model";
import { auditModel, AuditAction, ResourceType } from "../../shared/models/audit.model";
import { validateRequest } from "../../shared/utils/validation";
import { handleError, ValidationError } from "../../shared/utils/error-handler";

const uploadPdf: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    // Validate request
    const validation = validateRequest(req, {
      method: "POST"
    });

    if (!validation.isValid) {
      context.res = {
        status: 400,
        body: { 
          error: "Bad Request", 
          details: validation.errors 
        }
      };
      return;
    }

    // Check if file is present
    if (!req.body || !req.body.file) {
      throw new ValidationError("No file provided in request");
    }

    const { file, fileName, documentType, insurerName, userId } = req.body;

    if (!fileName || !documentType || !insurerName || !userId) {
      throw new ValidationError("Missing required fields: fileName, documentType, insurerName, userId");
    }

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof file === "string") {
      // Assume base64 encoded
      fileBuffer = Buffer.from(file, "base64");
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      throw new ValidationError("Invalid file format");
    }

    // Validate PDF file
    const fileValidation = await blobStorage.validatePdfFile(fileBuffer);
    if (!fileValidation.isValid) {
      throw new ValidationError(fileValidation.error || "Invalid PDF file");
    }

    // Upload to blob storage
    context.log(`Uploading file: ${fileName} for user: ${userId}`);
    
    const uploadResult = await blobStorage.uploadPdf(
      fileBuffer,
      fileName,
      userId,
      {
        documentType,
        insurerName,
        uploadedBy: userId
      }
    );

    // Create initial document record
    const documentRecord = await documentModel.create({
      analysisResult: {
        documentId: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentType,
        analyzedAt: new Date().toISOString(),
        pageCount: 0, // Will be updated after analysis
        detectedFields: [],
        confidence: 0,
        status: "pending"
      },
      userId,
      blobUrl: uploadResult.blobUrl,
      fileName,
      fileSize: uploadResult.size
    });

    // Create audit log
    await auditModel.create({
      userId,
      action: AuditAction.UPLOAD,
      resourceType: ResourceType.DOCUMENT,
      resourceId: documentRecord.id,
      details: {
        fileName,
        fileSize: uploadResult.size,
        documentType,
        insurerName
      },
      ipAddress: req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string,
      userAgent: req.headers["user-agent"] as string
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        documentId: documentRecord.id,
        blobUrl: uploadResult.blobUrl,
        fileName,
        fileSize: uploadResult.size,
        status: "uploaded",
        message: "File uploaded successfully. Processing will begin shortly.",
        nextStep: {
          action: "analyze",
          endpoint: `/api/analyze`,
          payload: {
            documentUrl: uploadResult.blobUrl,
            documentType
          }
        }
      }
    };

    context.res = {
      status: 200,
      body: response
    };

  } catch (error) {
    context.log.error("File upload failed:", error);
    handleError(context, error);
  }
};

export default uploadPdf;