import { FieldMapper } from './field-mapper';

describe('FieldMapper', () => {
  let fieldMapper: FieldMapper;

  beforeEach(() => {
    fieldMapper = new FieldMapper();
  });

  describe('mapField', () => {
    it('should map RFC field correctly', () => {
      const result = fieldMapper.mapField('RFC', 'ABCD123456ABC');
      
      expect(result.fieldType).toBe('rfc');
      expect(result.value).toBe('ABCD123456ABC');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.fieldId).toContain('rfc');
    });

    it('should map unknown field as text', () => {
      const result = fieldMapper.mapField('unknown_field', 'some value');
      
      expect(result.fieldType).toBe('text');
      expect(result.value).toBe('some value');
      expect(result.fieldId).toContain('unknown_field');
    });

    it('should handle empty values', () => {
      const result = fieldMapper.mapField('nombre', '');
      
      expect(result.fieldType).toBe('text');
      expect(result.value).toBe('');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('detectFieldType', () => {
    it('should detect RFC from field name', () => {
      const result = fieldMapper.detectFieldType('RFC', 'ABCD123456ABC');
      expect(result).toBe('rfc');
    });

    it('should detect CURP from field name', () => {
      const result = fieldMapper.detectFieldType('CURP', 'ABCD123456HDFABC01');
      expect(result).toBe('curp');
    });

    it('should default to text for unrecognized patterns', () => {
      const result = fieldMapper.detectFieldType('random', 'random text');
      expect(result).toBe('text');
    });
  });

  describe('calculateFieldConfidence', () => {
    it('should calculate confidence for matched field types', () => {
      const result = fieldMapper.calculateFieldConfidence('RFC', 'ABCD123456ABC', 'rfc');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('should return confidence for any field type', () => {
      const result = fieldMapper.calculateFieldConfidence('RFC', 'not-an-rfc', 'rfc');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  describe('normalizeFieldName', () => {
    it('should normalize field names', () => {
      const result = fieldMapper.normalizeFieldName('RFC_PACIENTE');
      expect(result).toContain('RFC');
      expect(typeof result).toBe('string');
    });

    it('should handle special characters', () => {
      const result = fieldMapper.normalizeFieldName('fecha_nacimiento');
      expect(result).toContain('Fecha');
      expect(typeof result).toBe('string');
    });
  });
});