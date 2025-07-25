import { FieldDetection } from '../types/document';

export interface FieldCapacityAnalysis {
  maxCharacters: number;
  charactersPerLine: number;
  maxLines: number;
  fontSize: number;
  fontFamily: string;
  conflictsWith: string[];
  adjustmentFactor: number;
  confidence: number;
  debugInfo: CapacityDebugInfo;
}

export interface CapacityDebugInfo {
  originalWidth: number;
  originalHeight: number;
  effectiveWidth: number;
  effectiveHeight: number;
  detectedFontSize: number;
  adjacentFields: AdjacentField[];
  spatialConflicts: SpatialConflict[];
}

export interface AdjacentField {
  fieldId: string;
  direction: 'left' | 'right' | 'top' | 'bottom';
  distance: number;
  overlap: number;
}

export interface SpatialConflict {
  field1: string;
  field2: string;
  overlapArea: number;
  overlapPercentage: number;
  conflictType: 'partial' | 'significant' | 'complete';
  resolution: ConflictResolution;
}

export interface ConflictResolution {
  action: 'reduce_size' | 'relocate' | 'merge' | 'ignore';
  newBoundingBox?: number[];
  confidenceImpact: number;
}

export interface FontAnalysis {
  textRegions: TextRegion[];
  dominantFontSize: number;
  fontVariations: FontVariation[];
}

export interface TextRegion {
  text: string;
  boundingBox: number[];
  fontSize: number;
  fontFamily: string;
  confidence: number;
}

export interface FontVariation {
  fontSize: number;
  frequency: number;
  regions: number[];
}

export class CapacityCalculator {
  private readonly STANDARD_FONT_WIDTHS: Record<string, number> = {
    'Arial': 0.6,
    'Helvetica': 0.6,
    'Times': 0.5,
    'Courier': 0.6,
    'Calibri': 0.55,
    'Verdana': 0.65,
    'default': 0.55
  };

  private readonly FIELD_TYPE_ADJUSTMENTS: Record<string, number> = {
    'text': 1.0,
    'rfc': 0.9,   // RFC has fixed format, less variation
    'curp': 0.9,  // CURP has fixed format
    'nss': 0.9,   // NSS has fixed format
    'date': 0.8,  // Dates are typically shorter
    'phone': 0.85,
    'email': 1.1, // Emails can be longer
    'currency': 0.9,
    'number': 0.8
  };

  private readonly MIN_FIELD_SPACING = 8; // Minimum pixels between fields
  private readonly LINE_HEIGHT_MULTIPLIER = 1.2; // Line height as percentage of font size

  async calculateCapacities(fields: FieldDetection[]): Promise<FieldDetection[]> {
    console.log(`Starting advanced capacity calculation for ${fields.length} fields`);
    
    // 1. Analyze font patterns in the document
    const fontAnalysis = await this.analyzeFonts(fields);
    
    // 2. Detect spatial conflicts between fields
    const spatialConflicts = this.detectSpatialConflicts(fields);
    
    // 3. Calculate capacity for each field individually
    const fieldsWithCapacity = fields.map(field => {
      const capacity = this.calculateFieldCapacity(field, fontAnalysis, spatialConflicts);
      
      return {
        ...field,
        capacity
      };
    });
    
    console.log(`Capacity calculation completed. Average confidence: ${this.calculateAverageCapacityConfidence(fieldsWithCapacity)}`);
    
    return fieldsWithCapacity;
  }

  private async analyzeFonts(fields: FieldDetection[]): Promise<FontAnalysis> {
    const textRegions: TextRegion[] = [];
    const fontSizeFrequency = new Map<number, number>();
    
    // Analyze each field to estimate font characteristics
    for (const field of fields) {
      const fontSize = this.estimateFontSizeFromBoundingBox(field);
      const fontFamily = this.estimateFontFamily(field);
      
      const region: TextRegion = {
        text: field.value,
        boundingBox: field.boundingBox,
        fontSize: fontSize,
        fontFamily: fontFamily,
        confidence: field.confidence
      };
      
      textRegions.push(region);
      
      // Track font size frequency
      const currentCount = fontSizeFrequency.get(fontSize) || 0;
      fontSizeFrequency.set(fontSize, currentCount + 1);
    }
    
    // Find dominant font size
    let dominantFontSize = 12; // Default
    let maxFrequency = 0;
    
    for (const [fontSize, frequency] of fontSizeFrequency.entries()) {
      if (frequency > maxFrequency) {
        maxFrequency = frequency;
        dominantFontSize = fontSize;
      }
    }
    
    // Create font variations array
    const fontVariations: FontVariation[] = [];
    for (const [fontSize, frequency] of fontSizeFrequency.entries()) {
      fontVariations.push({
        fontSize,
        frequency,
        regions: textRegions
          .map((region, index) => region.fontSize === fontSize ? index : -1)
          .filter(index => index !== -1)
      });
    }
    
    return {
      textRegions,
      dominantFontSize,
      fontVariations
    };
  }

  private estimateFontSizeFromBoundingBox(field: FieldDetection): number {
    const height = field.boundingBox[3]; // Height from bounding box
    
    // Estimate font size based on field height
    // Typical relationship: font height ≈ font size * 1.2 (line height)
    const estimatedFontSize = Math.round(height / this.LINE_HEIGHT_MULTIPLIER);
    
    // Clamp to reasonable range
    return Math.max(8, Math.min(24, estimatedFontSize));
  }

  private estimateFontFamily(field: FieldDetection): string {
    // For now, use default. In production, this could analyze character width patterns
    // or use additional metadata from Document Intelligence
    return 'default';
  }

  private detectSpatialConflicts(fields: FieldDetection[]): SpatialConflict[] {
    const conflicts: SpatialConflict[] = [];
    
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];
        
        // Skip if fields are on different pages
        if (field1.pageNumber !== field2.pageNumber) {
          continue;
        }
        
        const overlap = this.calculateOverlap(field1.boundingBox, field2.boundingBox);
        
        if (overlap.area > 0) {
          const conflict: SpatialConflict = {
            field1: field1.fieldId,
            field2: field2.fieldId,
            overlapArea: overlap.area,
            overlapPercentage: overlap.percentage,
            conflictType: this.classifyConflictType(overlap.percentage),
            resolution: this.suggestConflictResolution(field1, field2, overlap)
          };
          
          conflicts.push(conflict);
        }
      }
    }
    
    console.log(`Detected ${conflicts.length} spatial conflicts`);
    return conflicts;
  }

  private calculateOverlap(bbox1: number[], bbox2: number[]): { area: number; percentage: number } {
    const [x1, y1, w1, h1] = bbox1;
    const [x2, y2, w2, h2] = bbox2;
    
    // Calculate intersection rectangle
    const left = Math.max(x1, x2);
    const top = Math.max(y1, y2);
    const right = Math.min(x1 + w1, x2 + w2);
    const bottom = Math.min(y1 + h1, y2 + h2);
    
    // Check if there's any overlap
    if (left >= right || top >= bottom) {
      return { area: 0, percentage: 0 };
    }
    
    const overlapArea = (right - left) * (bottom - top);
    const area1 = w1 * h1;
    const area2 = w2 * h2;
    const smallerArea = Math.min(area1, area2);
    
    const percentage = smallerArea > 0 ? (overlapArea / smallerArea) * 100 : 0;
    
    return { area: overlapArea, percentage };
  }

  private classifyConflictType(overlapPercentage: number): 'partial' | 'significant' | 'complete' {
    if (overlapPercentage > 80) return 'complete';
    if (overlapPercentage > 30) return 'significant';
    return 'partial';
  }

  private suggestConflictResolution(
    field1: FieldDetection,
    field2: FieldDetection,
    overlap: { area: number; percentage: number }
  ): ConflictResolution {
    const { percentage } = overlap;
    
    if (percentage > 80) {
      // Complete overlap - likely duplicate detection
      return {
        action: 'merge',
        confidenceImpact: -0.1
      };
    } else if (percentage > 30) {
      // Significant overlap - reduce size of lower confidence field
      return {
        action: 'reduce_size',
        confidenceImpact: -0.2
      };
    } else {
      // Partial overlap - reduce capacity slightly
      return {
        action: 'ignore',
        confidenceImpact: -0.05
      };
    }
  }

  private calculateFieldCapacity(
    field: FieldDetection,
    fontAnalysis: FontAnalysis,
    conflicts: SpatialConflict[]
  ): FieldCapacityAnalysis {
    const [x, y, width, height] = field.boundingBox;
    
    // 1. Determine font characteristics for this field
    const fontSize = this.detectFontSizeForField(field, fontAnalysis);
    const fontFamily = this.detectFontFamily(field, fontAnalysis);
    
    // 2. Calculate character width based on font
    const charWidth = fontSize * (this.STANDARD_FONT_WIDTHS[fontFamily] || this.STANDARD_FONT_WIDTHS['default']);
    const lineHeight = fontSize * this.LINE_HEIGHT_MULTIPLIER;
    
    // 3. Find conflicts affecting this field
    const fieldConflicts = conflicts.filter(c => 
      c.field1 === field.fieldId || c.field2 === field.fieldId
    );
    
    // 4. Calculate effective dimensions (after accounting for conflicts)
    const effectiveWidth = this.calculateEffectiveWidth(width, fieldConflicts);
    const effectiveHeight = this.calculateEffectiveHeight(height, fieldConflicts);
    
    // 5. Calculate capacity metrics
    const charactersPerLine = Math.floor(effectiveWidth / charWidth);
    const maxLines = Math.floor(effectiveHeight / lineHeight);
    const rawCapacity = charactersPerLine * maxLines;
    
    // 6. Apply field type adjustment
    const adjustmentFactor = this.getAdjustmentFactor(field.fieldType);
    const finalCapacity = Math.floor(rawCapacity * adjustmentFactor);
    
    // 7. Calculate confidence based on various factors
    const confidence = this.calculateCapacityConfidence(field, conflicts, fontSize);
    
    // 8. Find adjacent fields for debugging
    const adjacentFields = this.findAdjacentFields(field, conflicts);
    
    return {
      maxCharacters: Math.max(1, finalCapacity), // Ensure at least 1 character
      charactersPerLine: Math.max(1, charactersPerLine),
      maxLines: Math.max(1, maxLines),
      fontSize,
      fontFamily,
      conflictsWith: fieldConflicts.map(c => c.field1 === field.fieldId ? c.field2 : c.field1),
      adjustmentFactor,
      confidence,
      debugInfo: {
        originalWidth: width,
        originalHeight: height,
        effectiveWidth,
        effectiveHeight,
        detectedFontSize: fontSize,
        adjacentFields,
        spatialConflicts: fieldConflicts
      }
    };
  }

  private detectFontSizeForField(field: FieldDetection, fontAnalysis: FontAnalysis): number {
    // Find the nearest text region to estimate font size
    const fieldCenter = [
      field.boundingBox[0] + field.boundingBox[2] / 2,
      field.boundingBox[1] + field.boundingBox[3] / 2
    ];
    
    let nearestRegion: TextRegion | null = null;
    let minDistance = Infinity;
    
    for (const region of fontAnalysis.textRegions) {
      const regionCenter = [
        region.boundingBox[0] + region.boundingBox[2] / 2,
        region.boundingBox[1] + region.boundingBox[3] / 2
      ];
      
      const distance = Math.sqrt(
        Math.pow(fieldCenter[0] - regionCenter[0], 2) +
        Math.pow(fieldCenter[1] - regionCenter[1], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    }
    
    // If we found a nearby region, use its font size; otherwise use dominant
    if (nearestRegion && minDistance < 50) { // Within 50 pixels
      return nearestRegion.fontSize;
    }
    
    return fontAnalysis.dominantFontSize;
  }

  private detectFontFamily(field: FieldDetection, fontAnalysis: FontAnalysis): string {
    // For now, return default. In production, this could analyze patterns
    return 'default';
  }

  private calculateEffectiveWidth(originalWidth: number, conflicts: SpatialConflict[]): number {
    let reduction = 0;
    
    for (const conflict of conflicts) {
      switch (conflict.conflictType) {
        case 'complete':
          reduction += originalWidth * 0.5; // 50% reduction for complete overlap
          break;
        case 'significant':
          reduction += originalWidth * 0.3; // 30% reduction for significant overlap
          break;
        case 'partial':
          reduction += originalWidth * 0.1; // 10% reduction for partial overlap
          break;
      }
    }
    
    return Math.max(originalWidth * 0.2, originalWidth - reduction); // Ensure at least 20% remains
  }

  private calculateEffectiveHeight(originalHeight: number, conflicts: SpatialConflict[]): number {
    let reduction = 0;
    
    for (const conflict of conflicts) {
      switch (conflict.conflictType) {
        case 'complete':
          reduction += originalHeight * 0.4; // 40% reduction for complete overlap
          break;
        case 'significant':
          reduction += originalHeight * 0.2; // 20% reduction for significant overlap
          break;
        case 'partial':
          reduction += originalHeight * 0.05; // 5% reduction for partial overlap
          break;
      }
    }
    
    return Math.max(originalHeight * 0.3, originalHeight - reduction); // Ensure at least 30% remains
  }

  private getAdjustmentFactor(fieldType: string): number {
    return this.FIELD_TYPE_ADJUSTMENTS[fieldType] || this.FIELD_TYPE_ADJUSTMENTS['text'];
  }

  private calculateCapacityConfidence(
    field: FieldDetection,
    conflicts: SpatialConflict[],
    fontSize: number
  ): number {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence based on conflicts
    for (const conflict of conflicts) {
      confidence -= conflict.resolution.confidenceImpact;
    }
    
    // Adjust based on field detection confidence
    confidence = (confidence + field.confidence) / 2;
    
    // Adjust based on font size estimation reliability
    const heightBasedFontSize = field.boundingBox[3] / this.LINE_HEIGHT_MULTIPLIER;
    const fontSizeDifference = Math.abs(fontSize - heightBasedFontSize);
    
    if (fontSizeDifference > 3) {
      confidence -= 0.1; // Reduce confidence if font size estimation is uncertain
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private findAdjacentFields(field: FieldDetection, conflicts: SpatialConflict[]): AdjacentField[] {
    // This is a simplified implementation. In production, you would analyze
    // all fields to find truly adjacent ones, not just conflicting ones.
    return conflicts
      .filter(c => c.field1 === field.fieldId || c.field2 === field.fieldId)
      .map(c => ({
        fieldId: c.field1 === field.fieldId ? c.field2 : c.field1,
        direction: 'right' as const, // Simplified
        distance: 0, // Would calculate actual distance
        overlap: c.overlapPercentage
      }));
  }

  private calculateAverageCapacityConfidence(fieldsWithCapacity: any[]): number {
    if (fieldsWithCapacity.length === 0) return 0;
    
    const totalConfidence = fieldsWithCapacity.reduce((sum, field) => {
      return sum + (field.capacity?.confidence || 0);
    }, 0);
    
    return Math.round((totalConfidence / fieldsWithCapacity.length) * 100) / 100;
  }

  // Method to generate capacity analysis report for debugging
  generateCapacityReport(fieldsWithCapacity: any[]): string {
    const report = {
      totalFields: fieldsWithCapacity.length,
      averageConfidence: this.calculateAverageCapacityConfidence(fieldsWithCapacity),
      fieldsWithConflicts: fieldsWithCapacity.filter(f => 
        f.capacity?.conflictsWith?.length > 0
      ).length,
      capacityDistribution: {
        small: fieldsWithCapacity.filter(f => f.capacity?.maxCharacters < 50).length,
        medium: fieldsWithCapacity.filter(f => 
          f.capacity?.maxCharacters >= 50 && f.capacity?.maxCharacters < 200
        ).length,
        large: fieldsWithCapacity.filter(f => f.capacity?.maxCharacters >= 200).length
      }
    };
    
    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const capacityCalculator = new CapacityCalculator();