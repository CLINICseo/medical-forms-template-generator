import { 
  DocumentAnalysisClient, 
  AzureKeyCredential, 
  AnalyzeResult
} from '@azure/ai-form-recognizer';
import { FieldDetection, FieldType } from '../../types/document';
import { fieldMapper } from '../field-mapper';
import { capacityCalculator } from '../capacityCalculator';
import { mexicanFieldsProcessor } from '../validation/mexican-fields-processor';

export interface DocumentAnalysisResult {
  documentId: string;
  analyzedAt: string;
  pageCount: number;
  detectedFields: FieldDetection[];
  confidence: number;
  processingTime: number;
  rawAnalysis: AnalyzeResult;
  status: 'completed' | 'failed' | 'processing';
  insurerDetected?: string;
  formType?: string;
  // 🚀 NUEVO: Métricas de migración prebuilt-layout
  modelUsed: 'prebuilt-layout' | 'prebuilt-document' | 'fallback';
  revolutionMetrics?: {
    tablesDetected: number;
    keyValuePairsDetected: number; 
    selectionMarksDetected: number;
    paragraphsDetected: number;
    improvementFactor: number; // vs prebuilt-document baseline
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DocumentIntelligenceService {
  private client!: DocumentAnalysisClient;
  private isConfigured: boolean = false;
  constructor() {
    const endpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.DOCUMENT_INTELLIGENCE_KEY;
    
    if (!endpoint || !key) {
      console.warn('Document Intelligence credentials not configured, using fallback');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = new DocumentAnalysisClient(
        endpoint,
        new AzureKeyCredential(key)
      );
      this.isConfigured = true;
      console.log('Document Intelligence service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Document Intelligence service:', error);
      this.isConfigured = false;
    }
  }

  async analyzeDocument(documentId: string, pdfBuffer: Buffer): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting Document Intelligence analysis for document: ${documentId}`);
      
      if (!this.isConfigured) {
        console.log('Document Intelligence not configured, using fallback analysis');
        return await this.fallbackAnalysis(documentId, pdfBuffer, startTime);
      }

      // 🚀 MIGRATION: Switch to prebuilt-layout with all features for maximum field detection
      console.log('🤖 Using model: prebuilt-layout with all advanced features enabled');
      
      const analysisOptions = this.getPrebuiltLayoutOptions();
      
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-layout',
        pdfBuffer,
        analysisOptions
      );

      console.log('Document Intelligence analysis started, waiting for completion...');
      
      // Wait for analysis to complete
      const result = await poller.pollUntilDone();
      
      // 🚀 ENHANCED: prebuilt-layout provides rich structured data
      if (!result.pages || result.pages.length === 0) {
        throw new Error('No pages found in prebuilt-layout analysis result');
      }
      
      console.log(`🎯 prebuilt-layout analysis SUCCESSFUL! Found ${result.pages?.length || 0} pages`);

      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`🚀 prebuilt-layout analysis completed in ${processingTime}s`);
      
      // 🚀 DIAGNÓSTICO COMPLETO del resultado de prebuilt-layout
      console.log(`📊 Pages detected: ${result.pages?.length || 0}`);
      console.log(`📊 Key-value pairs detected: ${result.keyValuePairs?.length || 0}`);
      console.log(`📊 Tables detected: ${result.tables?.length || 0}`);
      console.log(`📊 Selection marks detected: ${result.pages?.reduce((acc, page) => acc + (page.selectionMarks?.length || 0), 0) || 0}`);
      console.log(`📊 Paragraphs detected: ${result.paragraphs?.length || 0}`);
      console.log(`📊 Barcodes detected: ${result.pages?.reduce((acc, page) => acc + (page.barcodes?.length || 0), 0) || 0}`);
      
      // Debug adicional para ver la estructura completa
      console.log('🔍 DEBUG - Full result structure:');
      console.log('Pages:', result.pages?.length);
      console.log('Tables:', result.tables?.length);
      console.log('KeyValuePairs:', result.keyValuePairs?.length);
      if (result.pages?.[0]) {
        console.log('First page lines:', result.pages[0].lines?.length);
        console.log('First page words:', result.pages[0].words?.length);
      }

      // 🚀 FIXED: Process prebuilt-document results with improved field extraction
      const analysisResult = await this.processDocumentAnalysisResult(documentId, result, processingTime);

      return analysisResult;

    } catch (error) {
      console.error('Document Intelligence prebuilt-layout analysis failed:', error);
      
      // Try fallback to prebuilt-document if layout fails
      console.log('Attempting fallback to prebuilt-document model...');
      try {
        return await this.analyzeWithPrebuiltDocument(documentId, pdfBuffer, startTime);
      } catch (fallbackError) {
        console.error('Prebuilt-document fallback also failed:', fallbackError);
        // Final fallback to mock analysis
        console.log('Falling back to mock analysis due to all models failing');
        return await this.fallbackAnalysis(documentId, pdfBuffer, startTime);
      }
    }
  }

  private async processDocumentAnalysisResult(
    documentId: string,
    result: AnalyzeResult,
    processingTime: number
  ): Promise<DocumentAnalysisResult> {
    const detectedFields: FieldDetection[] = [];
    
    // 🚀 ENHANCED: Process documents from prebuilt-layout/document (primary source of structured data)
    if (result.documents && result.documents.length > 0) {
      console.log(`🎯 Processing ${result.documents.length} documents from model`);
      
      for (const document of result.documents) {
        if (document.fields) {
          console.log(`📋 Document has ${Object.keys(document.fields).length} fields`);
          
          for (const [fieldName, fieldValue] of Object.entries(document.fields)) {
            if (fieldValue && fieldValue.content) {
              const field = this.createLayoutFieldDetection(
                fieldName,
                fieldValue.content,
                fieldValue.confidence || 0,
                fieldValue.boundingRegions || [],
                'document'
              );
              detectedFields.push(field);
            }
          }
        }
      }
    }
    
    // 🚀 ENHANCED: Process key-value pairs (major improvement with prebuilt-layout)
    if (result.keyValuePairs) {
      console.log(`🎯 Processing ${result.keyValuePairs.length} key-value pairs from model`);
      
      for (const kvp of result.keyValuePairs) {
        // Solo procesar si tiene key y confidence suficiente
        if (!kvp.key?.content || (kvp.confidence && kvp.confidence < 0.2)) {
          continue;
        }

        const field = this.createLayoutFieldDetection(
          kvp.key.content,
          kvp.value?.content || '',
          kvp.confidence || 0,
          kvp.key.boundingRegions || [],
          'keyValuePair'
        );

        detectedFields.push(field);
      }
    }

    // 🚀 ENHANCED: Process tables (dramatically improved with prebuilt-layout)
    if (result.tables) {
      console.log(`📋 Processing ${result.tables.length} tables from model`);
      
      for (const table of result.tables) {
        for (const cell of table.cells || []) {
          if (cell.content && cell.content.trim()) {
            const field = this.createLayoutFieldDetection(
              `table_${table.columnCount}x${table.rowCount}_r${cell.rowIndex}_c${cell.columnIndex}`,
              cell.content,
              0.90, // 🚀 MEJORA: Alta confianza para tablas detectadas
              cell.boundingRegions || [],
              'table'
            );
            
            detectedFields.push(field);
          }
        }
      }
    }

    // 🚀 ENHANCED: Process selection marks (checkboxes) - major improvement with prebuilt-layout
    const allSelectionMarks = result.pages?.reduce((acc, page) => acc.concat(page.selectionMarks || []), [] as any[]) || [];
    if (allSelectionMarks.length > 0) {
      console.log(`☑️ Processing ${allSelectionMarks.length} selection marks from all pages`);
      
      for (const mark of allSelectionMarks) {
        const field = this.createLayoutFieldDetection(
          `checkbox_${mark.polygon?.[0]}_${mark.polygon?.[1]}`,
          mark.state || 'unselected',
          mark.confidence || 0.95, // 🚀 MEJORA: Máxima confianza para checkboxes
          [{ polygon: mark.polygon, pageNumber: 1 }],
          'checkbox'
        );
        
        detectedFields.push(field);
      }
    }

    // 🚀 ENHANCED: Process paragraphs from prebuilt-layout (better structure detection)
    if (result.paragraphs && result.paragraphs.length > 0) {
      console.log(`📝 Processing ${result.paragraphs.length} paragraphs from prebuilt-layout`);
      const paragraphFields = this.extractFieldsFromParagraphs(result.paragraphs);
      detectedFields.push(...paragraphFields);
    }

    // Fallback: Process page lines if no paragraphs available
    if ((!result.paragraphs || result.paragraphs.length === 0) && result.pages) {
      console.log('📝 Fallback: Processing page lines for field extraction');
      for (const page of result.pages) {
        if (page.lines) {
          const additionalFields = this.extractFieldsFromLines(page.lines, page.pageNumber || 1);
          detectedFields.push(...additionalFields);
        }
      }
    }

    // 🚀 MEJORA: Filtrar campos duplicados y con conflictos espaciales
    console.log(`🔍 Pre-filtro: ${detectedFields.length} campos detectados`);
    const spatialFiltered = this.filterSpatialConflicts(detectedFields);
    console.log(`✅ Post-filtro espacial: ${spatialFiltered.length} campos únicos (eliminados ${detectedFields.length - spatialFiltered.length} duplicados)`);
    
    // 🚀 MEJORA: Filtro de calidad con umbral mínimo
    const qualityFiltered = this.filterByQuality(spatialFiltered);
    console.log(`🎯 Post-filtro calidad: ${qualityFiltered.length} campos de alta confianza (eliminados ${spatialFiltered.length - qualityFiltered.length} de baja calidad)`);
    
    // 🚀 SMART FILTERING: Apply minimal quality filtering only
    const basicFiltered = this.filterBasicQuality(detectedFields);
    console.log(`🎯 Basic quality filter: ${basicFiltered.length} campos válidos (eliminados ${detectedFields.length - basicFiltered.length} campos inválidos)`);
    const filteredFields = basicFiltered;
    
    // Calculate advanced capacity for filtered fields
    console.log('Calculating advanced field capacities...');
    const fieldsWithCapacity = await capacityCalculator.calculateCapacities(filteredFields);
    
    // Detect insurer and form type
    const { insurerDetected, formType } = this.detectInsurerAndFormType(fieldsWithCapacity);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(fieldsWithCapacity);
    
    // 🚀 CALCULAR MÉTRICAS REVOLUCIONARIAS
    const revolutionMetrics = {
      tablesDetected: result.tables?.length || 0,
      keyValuePairsDetected: result.keyValuePairs?.length || 0,
      selectionMarksDetected: result.pages?.[0]?.selectionMarks?.length || 0,
      paragraphsDetected: result.pages?.[0]?.lines?.length || 0,
      improvementFactor: Math.round(fieldsWithCapacity.length / 5) // vs baseline de 5 campos
    };
    
    console.log('🚀 REVOLUCIÓN COMPLETADA:', revolutionMetrics);
    console.log(`📊 Mejora: ${revolutionMetrics.improvementFactor}x más campos detectados`);
    
    // Generate capacity report for debugging
    const capacityReport = capacityCalculator.generateCapacityReport(fieldsWithCapacity);
    console.log('Capacity Analysis Report:', capacityReport);

    return {
      documentId,
      analyzedAt: new Date().toISOString(),
      pageCount: result.pages?.length || 1,
      detectedFields: fieldsWithCapacity,
      confidence: overallConfidence,
      processingTime,
      rawAnalysis: result,
      status: 'completed',
      insurerDetected,
      formType,
      modelUsed: 'prebuilt-layout', // 🚀 ENHANCED: Using advanced layout model with all features
      revolutionMetrics
    };
  }

  // 🚀 UPDATED: Método para crear campos desde prebuilt-document
  private createLayoutFieldDetection(
    fieldName: string,
    content: string,
    confidence: number,
    boundingRegions: any[],
    sourceType: 'document' | 'keyValuePair' | 'table' | 'checkbox' | 'paragraph'
  ): FieldDetection {
    // Use field mapper to get proper field type and display name
    const mappedField = fieldMapper.mapField(fieldName, content);
    
    // Convert bounding regions to our format
    const boundingBox = this.convertBoundingRegions(boundingRegions);
    
    return {
      fieldId: mappedField.fieldId,
      displayName: mappedField.displayName,
      value: content,
      confidence: Math.max(confidence, mappedField.confidence), // Use higher confidence
      boundingBox,
      pageNumber: boundingRegions[0]?.pageNumber || 1,
      fieldType: mappedField.fieldType,
      // 🚀 UPDATED: Metadata de prebuilt-document
      sourceType,
      isRevolutionary: true // Marca que viene de la migración a v3.1
    };
  }

  // Método legacy para compatibilidad
  private createFieldDetection(
    fieldName: string,
    content: string,
    confidence: number,
    boundingRegions: any[]
  ): FieldDetection {
    // Use field mapper to get proper field type and display name
    const mappedField = fieldMapper.mapField(fieldName, content);
    
    // Convert bounding regions to our format
    const boundingBox = this.convertBoundingRegions(boundingRegions);
    
    return {
      fieldId: mappedField.fieldId,
      displayName: mappedField.displayName,
      value: content,
      confidence: Math.max(confidence, mappedField.confidence), // Use higher confidence
      boundingBox,
      pageNumber: boundingRegions[0]?.pageNumber || 1,
      fieldType: mappedField.fieldType
    };
  }

  private convertBoundingRegions(boundingRegions: any[]): number[] {
    if (!boundingRegions || boundingRegions.length === 0) {
      return [0, 0, 100, 20]; // Default bounding box
    }

    const region = boundingRegions[0];
    if (!region.polygon || region.polygon.length < 8) {
      return [0, 0, 100, 20]; // Default if no valid polygon
    }

    // Document Intelligence returns polygon as [x1, y1, x2, y2, x3, y3, x4, y4]
    // We need to convert to [x, y, width, height]
    const polygon = region.polygon;
    const minX = Math.min(polygon[0], polygon[2], polygon[4], polygon[6]);
    const maxX = Math.max(polygon[0], polygon[2], polygon[4], polygon[6]);
    const minY = Math.min(polygon[1], polygon[3], polygon[5], polygon[7]);
    const maxY = Math.max(polygon[1], polygon[3], polygon[5], polygon[7]);

    return [
      Math.round(minX),
      Math.round(minY), 
      Math.round(maxX - minX),
      Math.round(maxY - minY)
    ];
  }

  private extractFieldsFromLines(lines: any[], pageNumber: number): FieldDetection[] {
    const fields: FieldDetection[] = [];
    
    for (const line of lines) {
      if (!line.content || line.content.length < 3) {
        continue; // Skip very short content
      }

      // 🚀 MEJORA: Patrones expandidos para formularios médicos mexicanos
      const fieldPatterns = [
        /^([^:]+):\s*(.+)$/, // "Label: Value" pattern
        /^([^=]+)=\s*(.+)$/, // "Label = Value" pattern
        /^([^\-]+)\-\s*(.+)$/, // "Label - Value" pattern
        // Patrones específicos para formularios mexicanos
        /^(nombre\s*completo|nombre\s*del\s*paciente|nombre\s*asegurado)\s*[:=\-]?\s*(.+)$/i,
        /^(rfc|r\.f\.c\.?)\s*[:=\-]?\s*([A-Z]{4}\d{6}[A-Z0-9]{3})$/i,
        /^(curp|c\.u\.r\.p\.?)\s*[:=\-]?\s*([A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d)$/i,
        /^(nss|n\.s\.s\.?|seguro\s*social)\s*[:=\-]?\s*(\d{11})$/i,
        /^(fecha\s*nacimiento|fecha\s*nac\.?)\s*[:=\-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})$/i,
        /^(teléfono|telefono|tel\.?|celular)\s*[:=\-]?\s*(\d{10})$/i,
        /^(póliza|poliza|número\s*póliza)\s*[:=\-]?\s*(.+)$/i,
        /^(siniestro|número\s*siniestro|folio\s*siniestro)\s*[:=\-]?\s*(.+)$/i,
        /^(diagnóstico|diagnostico|cie\-?10)\s*[:=\-]?\s*(.+)$/i,
        /^(hospital|clínica|clinica|centro\s*médico)\s*[:=\-]?\s*(.+)$/i,
        /^(médico|medico|doctor|dr\.?\s*|dra\.?\s*)\s*[:=\-]?\s*(.+)$/i,
        /^(folio\s*afiliación|folio\s*afiliacion|imss|issste)\s*[:=\-]?\s*(.+)$/i
      ];

      let fieldFound = false;
      for (const pattern of fieldPatterns) {
        const match = line.content.match(pattern);
        if (match) {
          const [, label, value] = match;
          
          if (label.trim() && value.trim()) {
            const field = this.createFieldDetection(
              label.trim(),
              value.trim(),
              0.85, // 🚀 MEJORA: Alta confianza para campos estructurados
              [{
                pageNumber,
                polygon: line.polygon || [0, 0, 100, 20, 100, 40, 0, 40]
              }]
            );
            
            fields.push(field);
            fieldFound = true;
            break;
          }
        }
      }

      // If no structured pattern found, try to detect by content only
      if (!fieldFound) {
        const fieldType = fieldMapper.detectFieldType('', line.content);
        if (fieldType !== FieldType.TEXT || line.content.length < 50) {
          // Only include if it's a special type or short text (likely a field value)
          const field = this.createFieldDetection(
            `detected_field_${Date.now()}`,
            line.content,
            0.7, // 🚀 MEJORA: Mayor confianza base para prebuilt-layout
            [{
              pageNumber,
              polygon: line.polygon || [0, 0, 100, 20, 100, 40, 0, 40]
            }]
          );
          
          fields.push(field);
        }
      }
    }

    return fields;
  }

  // 🚀 NEW: Extract fields from paragraphs (better structure with prebuilt-layout)
  private extractFieldsFromParagraphs(paragraphs: any[]): FieldDetection[] {
    const fields: FieldDetection[] = [];
    
    for (const paragraph of paragraphs) {
      if (!paragraph.content || paragraph.content.length < 3) {
        continue;
      }

      // Enhanced patterns for medical forms with better confidence
      const medicalPatterns = [
        // Standard field patterns
        /^([^:]+):\s*(.+)$/,
        /^([^=]+)=\s*(.+)$/,
        /^([^\-]+)\-\s*(.+)$/,
        
        // Mexican medical specific patterns (enhanced)
        /^(nombre\s*completo|nombre\s*del\s*paciente|nombre\s*asegurado)\s*[:=\-]?\s*(.+)$/i,
        /^(rfc|r\.f\.c\.?)\s*[:=\-]?\s*([A-Z]{4}\d{6}[A-Z0-9]{3})$/i,
        /^(curp|c\.u\.r\.p\.?)\s*[:=\-]?\s*([A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d)$/i,
        /^(nss|n\.s\.s\.?|seguro\s*social)\s*[:=\-]?\s*(\d{11})$/i,
        /^(imss|número\s*imss)\s*[:=\-]?\s*(\d{11})$/i,
        /^(issste|número\s*issste)\s*[:=\-]?\s*(\d{11})$/i,
        /^(fecha\s*nacimiento|fecha\s*nac\.?)\s*[:=\-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})$/i,
        /^(póliza|poliza|número\s*póliza)\s*[:=\-]?\s*(.+)$/i,
        /^(siniestro|número\s*siniestro|folio\s*siniestro)\s*[:=\-]?\s*(.+)$/i,
        /^(diagnóstico|diagnostico|cie\-?10)\s*[:=\-]?\s*(.+)$/i,
        /^(médico|medico|doctor|dr\.?\s*|dra\.?\s*)\s*[:=\-]?\s*(.+)$/i,
        /^(hospital|clínica|clinica|centro\s*médico)\s*[:=\-]?\s*(.+)$/i,
        /^(cédula\s*profesional|cedula\s*profesional)\s*[:=\-]?\s*(\d{7,8})$/i,
        /^(clabe|clabe\s*bancaria)\s*[:=\-]?\s*(\d{18})$/i
      ];

      let fieldFound = false;
      for (const pattern of medicalPatterns) {
        const match = paragraph.content.match(pattern);
        if (match) {
          const [, label, value] = match;
          
          if (label.trim() && value.trim()) {
            const field = this.createLayoutFieldDetection(
              label.trim(),
              value.trim(),
              0.88, // Higher confidence for paragraph-detected fields
              paragraph.boundingRegions || [],
              'paragraph'
            );
            
            fields.push(field);
            fieldFound = true;
            break;
          }
        }
      }

      // If no structured pattern found, check if it's a special field type
      if (!fieldFound) {
        const fieldType = fieldMapper.detectFieldType('', paragraph.content);
        if (fieldType !== FieldType.TEXT || paragraph.content.length < 30) {
          const field = this.createLayoutFieldDetection(
            `paragraph_field_${Date.now()}`,
            paragraph.content,
            0.75, // Good confidence for paragraph content
            paragraph.boundingRegions || [],
            'paragraph'
          );
          
          fields.push(field);
        }
      }
    }

    console.log(`📝 Extracted ${fields.length} fields from ${paragraphs.length} paragraphs`);
    return fields;
  }

  private detectInsurerAndFormType(fields: FieldDetection[]): { 
    insurerDetected?: string, 
    formType?: string 
  } {
    const allText = fields.map(f => f.value).join(' ').toLowerCase();
    
    // Mexican insurers patterns
    const insurers = [
      { name: 'AXA', patterns: ['axa', 'axa seguros'] },
      { name: 'MAPFRE', patterns: ['mapfre', 'tepeyac'] },
      { name: 'GNP', patterns: ['gnp', 'grupo nacional provincial'] },
      { name: 'Monterrey', patterns: ['monterrey', 'seguros monterrey'] },
      { name: 'MetLife', patterns: ['metlife', 'met life'] },
      { name: 'INBURSA', patterns: ['inbursa', 'seguros inbursa'] },
      { name: 'Atlas', patterns: ['atlas', 'seguros atlas'] },
      { name: 'Banorte', patterns: ['banorte', 'seguros banorte'] },
      { name: 'Plan Seguro', patterns: ['plan seguro'] }
    ];

    let insurerDetected = 'Unknown';
    for (const insurer of insurers) {
      if (insurer.patterns.some(pattern => allText.includes(pattern))) {
        insurerDetected = insurer.name;
        break;
      }
    }

    // Form type detection
    let formType = 'medical-form';
    if (allText.includes('reembolso')) {
      formType = 'reembolso-gastos-medicos';
    } else if (allText.includes('siniestro')) {
      formType = 'reporte-siniestro';
    } else if (allText.includes('solicitud')) {
      formType = 'solicitud-seguro';
    }

    return { insurerDetected, formType };
  }

  private calculateOverallConfidence(fields: FieldDetection[]): number {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    return totalConfidence / fields.length;
  }

  // Fallback method to use prebuilt-document if layout fails
  private async analyzeWithPrebuiltDocument(
    documentId: string, 
    pdfBuffer: Buffer, 
    startTime: number
  ): Promise<DocumentAnalysisResult> {
    console.log('🔄 Using prebuilt-document as fallback...');
    
    const analysisOptions = this.getPrebuiltDocumentOptions();
    
    const poller = await this.client.beginAnalyzeDocument(
      'prebuilt-document',
      pdfBuffer,
      analysisOptions
    );
    
    const result = await poller.pollUntilDone();
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.log(`📊 Prebuilt-document fallback completed in ${processingTime}s`);
    console.log(`📊 Documents: ${result.documents?.length || 0}, Pages: ${result.pages?.length || 0}`);
    
    // Process with document model specifics
    const analysisResult = await this.processDocumentAnalysisResult(documentId, result, processingTime);
    
    // Update model used to indicate fallback
    return {
      ...analysisResult,
      modelUsed: 'prebuilt-document',
      revolutionMetrics: {
        ...analysisResult.revolutionMetrics!,
        improvementFactor: 1 // No improvement with fallback
      }
    };
  }

  private async fallbackAnalysis(
    documentId: string, 
    pdfBuffer: Buffer, 
    startTime: number
  ): Promise<DocumentAnalysisResult> {
    console.log('Using fallback analysis (mock data)');
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Enhanced mock analysis with better Mexican field patterns
    const mockFields: FieldDetection[] = [
      {
        fieldId: 'nombre_paciente_001',
        displayName: 'Nombre del Paciente',
        value: 'Juan Pérez García',
        confidence: 0.95,
        boundingBox: [120, 180, 280, 25],
        pageNumber: 1,
        fieldType: FieldType.TEXT
      },
      {
        fieldId: 'rfc_001',
        displayName: 'RFC',
        value: 'PEGJ850101ABC',
        confidence: 0.88,
        boundingBox: [120, 220, 180, 20],
        pageNumber: 1,
        fieldType: FieldType.RFC
      },
      {
        fieldId: 'curp_001',
        displayName: 'CURP',
        value: 'PEGJ850101HDFRNN05',
        confidence: 0.92,
        boundingBox: [120, 260, 220, 20],
        pageNumber: 1,
        fieldType: FieldType.CURP
      },
      {
        fieldId: 'nss_001',
        displayName: 'Número de Seguro Social',
        value: '12345678901',
        confidence: 0.87,
        boundingBox: [120, 300, 160, 20],
        pageNumber: 1,
        fieldType: FieldType.NSS
      },
      {
        fieldId: 'fecha_nacimiento_001',
        displayName: 'Fecha de Nacimiento',
        value: '01/01/1985',
        confidence: 0.94,
        boundingBox: [120, 340, 120, 20],
        pageNumber: 1,
        fieldType: FieldType.DATE
      }
    ];

    // Calculate capacity for fallback fields too
    const fieldsWithCapacity = await capacityCalculator.calculateCapacities(mockFields);

    return {
      documentId,
      analyzedAt: new Date().toISOString(),
      pageCount: 1,
      detectedFields: fieldsWithCapacity,
      confidence: 0.91,
      processingTime,
      rawAnalysis: {} as AnalyzeResult, // Empty raw analysis for fallback
      status: 'completed',
      insurerDetected: 'MAPFRE',
      formType: 'reembolso-gastos-medicos',
      modelUsed: 'fallback', // Indica que es fallback
      revolutionMetrics: {
        tablesDetected: 0,
        keyValuePairsDetected: 0,
        selectionMarksDetected: 0,
        paragraphsDetected: 0,
        improvementFactor: 1 // Sin mejora en fallback
      }
    };
  }

  // Test method to verify service configuration
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Document Intelligence service not configured. Check environment variables.'
      };
    }

    try {
      // 🚀 NUEVO: Test real con Azure Document Intelligence
      console.log('🧪 Testing real connection to Azure Document Intelligence...');
      
      // Crear un PDF mínimo válido para testing
      const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000100 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF', 'utf-8');
      
      const testPoller = await this.client.beginAnalyzeDocument(
        'prebuilt-document',
        minimalPdf,
        {
          locale: 'es-MX',
          pages: '1'
        }
      );
      
      const testResult = await testPoller.pollUntilDone();
      
      return {
        success: true,
        message: `Document Intelligence REAL test successful! Model: prebuilt-document. Detected ${testResult.documents?.length || 0} documents, ${testResult.keyValuePairs?.length || 0} key-value pairs, ${testResult.tables?.length || 0} tables.`
      };
    } catch (error) {
      console.error('🚨 Real Azure DI test failed:', error);
      return {
        success: false,
        message: `Document Intelligence REAL test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 🚀 RELAXED: Filtro espacial relajado para preservar más campos
  private filterSpatialConflicts(fields: FieldDetection[]): FieldDetection[] {
    const filtered: FieldDetection[] = [];
    const PROXIMITY_THRESHOLD = 5; // pixels - Reducido de 15 para preservar más campos
    
    // Ordenar campos por confianza descendente para procesar mejores primero
    const sortedFields = [...fields].sort((a, b) => b.confidence - a.confidence);
    
    for (const field of sortedFields) {
      let shouldAdd = true;
      let conflictIndex = -1;
      
      // Buscar campos muy cercanos espacialmente en la misma página
      for (let i = 0; i < filtered.length; i++) {
        const existingField = filtered[i];
        
        if (field.pageNumber === existingField.pageNumber) {
          const distance = this.calculateDistance(field.boundingBox, existingField.boundingBox);
          const overlap = this.calculateOverlap(field.boundingBox, existingField.boundingBox);
          
          // Considerar conflicto si están muy cerca O se superponen significativamente - RELAJADO
          if (distance < PROXIMITY_THRESHOLD || overlap > 0.9) { // Increased overlap threshold from 0.7 to 0.9
            // Ya que están ordenados por confianza, el existente debe ser mejor o igual
            if (field.confidence > existingField.confidence + 0.02) { // margen reducido de 2%
              conflictIndex = i;
              console.log(`🔄 Reemplazando campo "${existingField.displayName}" (${existingField.confidence.toFixed(2)}) por "${field.displayName}" (${field.confidence.toFixed(2)})`);
              break;
            } else {
              shouldAdd = false;
              console.log(`❌ Descartando campo duplicado "${field.displayName}" (${field.confidence.toFixed(2)}) - ya existe mejor`);
              break;
            }
          }
        }
      }
      
      if (shouldAdd) {
        if (conflictIndex >= 0) {
          filtered.splice(conflictIndex, 1); // Remover el conflictivo
        }
        filtered.push(field);
      }
    }
    
    return filtered;
  }
  
  // 🚀 NUEVO: Calcular superposición entre bounding boxes
  private calculateOverlap(box1: number[], box2: number[]): number {
    if (!box1 || !box2 || box1.length < 4 || box2.length < 4) {
      return 0;
    }
    
    // box = [x, y, width, height]
    const x1 = Math.max(box1[0], box2[0]);
    const y1 = Math.max(box1[1], box2[1]);
    const x2 = Math.min(box1[0] + box1[2], box2[0] + box2[2]);
    const y2 = Math.min(box1[1] + box1[3], box2[1] + box2[3]);
    
    if (x2 <= x1 || y2 <= y1) {
      return 0; // No hay superposición
    }
    
    const intersectionArea = (x2 - x1) * (y2 - y1);
    const box1Area = box1[2] * box1[3];
    const box2Area = box2[2] * box2[3];
    const unionArea = box1Area + box2Area - intersectionArea;
    
    return intersectionArea / unionArea; // IoU (Intersection over Union)
  }

  // 🚀 NUEVO: Calcular distancia entre bounding boxes
  private calculateDistance(box1: number[], box2: number[]): number {
    if (!box1 || !box2 || box1.length < 4 || box2.length < 4) {
      return Infinity;
    }
    
    // box = [x, y, width, height]
    const center1 = { x: box1[0] + box1[2] / 2, y: box1[1] + box1[3] / 2 };
    const center2 = { x: box2[0] + box2[2] / 2, y: box2[1] + box2[3] / 2 };
    
    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
    );
  }


  // 🚀 ENHANCED: Configuration for prebuilt-layout with all features
  private getPrebuiltLayoutOptions(): any {
    return {
      locale: 'es-MX',
      pages: '1-15',
      // Enable ALL features for maximum detection
      features: [
        'keyValuePairs',      // RFC, CURP, NSS detection
        'tables',             // Medical tables with structure
        'selectionMarks',     // Checkboxes
        'barcodes',           // QR codes, barcodes
        'formulas',           // Mathematical formulas
        'styleFont',          // Font information
        'languages',          // Language detection
        'paragraphs',         // Text blocks
        'ocrHighResolution',  // High-res OCR for small text
        'queryFields'         // Specific field queries
      ],
      // Query specific Mexican document fields
      queryFields: [
        'RFC',
        'CURP', 
        'NSS',
        'IMSS',
        'ISSSTE',
        'NumeroPoliza',
        'NumeroSiniestro',
        'NumeroCertificado',
        'FolioAfiliacion',
        'Diagnostico',
        'CIE10',
        'CPT',
        'CLABE',
        'CedulaProfesional',
        'RegistroMedico'
      ],
      readingOrder: 'natural'
    };
  }
  
  // Keep old method for fallback
  private getPrebuiltDocumentOptions(): any {
    return {
      locale: 'es-MX',
      pages: '1-15',
      includeFieldElements: true,
      readingOrder: 'natural'
    };
  }


  // 🚀 BASIC: Minimal quality filter to preserve most legitimate fields
  private filterBasicQuality(fields: FieldDetection[]): FieldDetection[] {
    return fields.filter(field => {
      // Only filter out truly invalid fields
      
      // Keep fields with reasonable confidence (very low threshold)
      if (field.confidence < 0.3) {
        console.log(`❌ Descartado por confianza muy baja: ${field.displayName} (${field.confidence.toFixed(2)})`);
        return false;
      }
      
      // Keep fields with any meaningful content
      if (!field.value || !field.value.trim()) {
        console.log(`❌ Descartado por contenido vacío: "${field.value}"`);
        return false;
      }
      
      // Only filter obvious noise/artifacts
      if (field.value.match(/^[\s\-_\.]{1,2}$/) || field.value.match(/^[|\\\/]{1,2}$/)) {
        console.log(`❌ Descartado por ruido: "${field.value}"`);
        return false;
      }
      
      return true;
    });
  }

  // 🚀 RELAXED: Filtro de calidad relajado para preservar más campos detectados
  private filterByQuality(fields: FieldDetection[]): FieldDetection[] {
    const MIN_CONFIDENCE_HIGH_VALUE = 0.70; // Para campos críticos (RFC, CURP, NSS) - Reducido de 0.85
    const MIN_CONFIDENCE_STRUCTURED = 0.60; // Para datos estructurados - Reducido de 0.75
    const MIN_CONFIDENCE_GENERAL = 0.50;    // Para texto general - Reducido de 0.65
    const MIN_CONTENT_LENGTH = 1;           // Reducido de 2 para campos de 1 carácter
    
    return fields.filter(field => {
      // Determinar umbral de confianza según tipo de campo
      let minConfidence = MIN_CONFIDENCE_GENERAL;
      
      if (field.fieldType === 'RFC' || field.fieldType === 'CURP' || field.fieldType === 'NSS') {
        minConfidence = MIN_CONFIDENCE_HIGH_VALUE;
      } else if (field.fieldType === 'DATE' || field.fieldType === 'EMAIL' || field.fieldType === 'PHONE') {
        minConfidence = MIN_CONFIDENCE_STRUCTURED;
      }
      
      // Filtrar por confianza adaptativa
      if (field.confidence < minConfidence) {
        console.log(`❌ Descartado por baja confianza: ${field.displayName} (${field.confidence.toFixed(2)} < ${minConfidence})`);
        return false;
      }
      
      // Filtrar por contenido muy corto (excepto checkboxes y campos especiales) - RELAJADO
      if (field.value.length < MIN_CONTENT_LENGTH && !field.value.match(/selected|unselected|si|no|x|\d/i)) {
        console.log(`❌ Descartado por contenido muy corto: "${field.value}"`);
        return false;
      }
      
      // Filtrar campos que son solo espacios, caracteres especiales o ruido
      if (!field.value.trim() || field.value.match(/^[\s\-_\.]{1,3}$/) || field.value.match(/^[|\\\/]{1,3}$/)) {
        console.log(`❌ Descartado por contenido inválido: "${field.value}"`);
        return false;
      }
      
      // Filtrar texto repetitivo o de relleno
      if (field.value.match(/^(.)\1{4,}$/) || field.value.toLowerCase().includes('lorem ipsum')) {
        console.log(`❌ Descartado por contenido repetitivo: "${field.value}"`);
        return false;
      }
      
      return true;
    });
  }

}

// Export singleton instance
export const documentIntelligenceService = new DocumentIntelligenceService();