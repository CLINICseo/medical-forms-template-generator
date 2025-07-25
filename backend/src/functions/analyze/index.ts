import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";
import { validateRequest } from "../../shared/utils/validation";
import { handleError } from "../../shared/utils/error-handler";
import { AnalysisResult, FieldDetection } from "../../shared/types/document";
import { fieldMapper } from "../../shared/services/field-mapper";

export async function analyzeDocument(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Validate request
    const validation = validateRequest(req, {
      requiredFields: ["documentUrl"],
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

    const body = await req.json() as any;
    const { documentUrl, documentType = "general" } = body;

    // Initialize Document Intelligence client
    const endpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
    const apiKey = process.env.DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !apiKey) {
      throw new Error("Document Intelligence credentials not configured");
    }

    const client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    // Analyze document
    context.log(`Analyzing document: ${documentUrl}`);
    
    const poller = await client.beginAnalyzeDocumentFromUrl(
      "prebuilt-document",
      documentUrl
    );

    const result = await poller.pollUntilDone();

    // Process and map detected fields
    const detectedFields: FieldDetection[] = [];
    
    if (result.documents && result.documents[0]) {
      const document = result.documents[0];
      
      // Extract key-value pairs
      if (document.fields) {
        for (const [fieldName, fieldValue] of Object.entries(document.fields)) {
          if (fieldValue && fieldValue.boundingRegions) {
            // Use field mapper for enhanced detection
            const mappedField = fieldMapper.mapField(fieldName, fieldValue.content || "");
            
            detectedFields.push({
              ...mappedField,
              confidence: fieldValue.confidence || mappedField.confidence,
              boundingBox: fieldValue.boundingRegions?.[0]?.polygon?.map((point: any) => [point.x, point.y]).flat() || [],
              pageNumber: fieldValue.boundingRegions?.[0]?.pageNumber || 1
            });
          }
        }
      }
    }

    // Create analysis result
    const analysisResult: AnalysisResult = {
      documentId: generateDocumentId(),
      documentType,
      analyzedAt: new Date().toISOString(),
      pageCount: result.pages?.length || 0,
      detectedFields,
      confidence: calculateOverallConfidence(detectedFields),
      status: "completed"
    };

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: analysisResult
      }
    };

  } catch (error) {
    context.error("Document analysis failed:", error);
    return handleError(error);
  }
}

// Helper functions
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateOverallConfidence(fields: FieldDetection[]): number {
  if (fields.length === 0) return 0;
  
  const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
  return totalConfidence / fields.length;
}

// Register the function
app.http('analyzeDocument', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'analyze',
  handler: analyzeDocument
});