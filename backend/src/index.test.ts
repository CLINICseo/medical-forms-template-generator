import { config } from './index';

describe('Backend Configuration', () => {
  test('should have correct config', () => {
    expect(config.name).toBe('medical-forms-backend');
    expect(config.version).toBe('1.0.0');
  });
});
