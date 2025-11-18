import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  calculateExactMatch,
  calculateRunMetrics,
  ScoreResult,
} from '../services/scoring-service';

describe('Scoring Service', () => {
  describe('calculateExactMatch', () => {
    it('should return true for exact matches', () => {
      expect(calculateExactMatch('hello world', 'hello world')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(calculateExactMatch('Hello World', 'hello world')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(calculateExactMatch('  hello world  ', 'hello world')).toBe(true);
    });

    it('should return false for non-matches', () => {
      expect(calculateExactMatch('hello', 'world')).toBe(false);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0);
    });

    it('should return value between 0 and 1 for similar strings', () => {
      const similarity = calculateSimilarity('hello world', 'hello word');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should be case insensitive', () => {
      expect(calculateSimilarity('Hello', 'hello')).toBe(1);
    });
  });

  describe('calculateRunMetrics', () => {
    it('should calculate average similarity correctly', () => {
      const scores: ScoreResult[] = [
        { similarity: 0.8 },
        { similarity: 0.9 },
        { similarity: 0.7 },
      ];

      const metrics = calculateRunMetrics(scores);
      expect(metrics.avgSimilarity).toBeCloseTo(0.8, 2);
      expect(metrics.totalItems).toBe(3);
    });

    it('should calculate exact match rate correctly', () => {
      const scores: ScoreResult[] = [
        { exactMatch: true },
        { exactMatch: false },
        { exactMatch: true },
        { exactMatch: false },
      ];

      const metrics = calculateRunMetrics(scores);
      expect(metrics.exactMatchRate).toBe(0.5);
      expect(metrics.totalItems).toBe(4);
    });

    it('should handle empty scores array', () => {
      const metrics = calculateRunMetrics([]);
      expect(metrics.totalItems).toBe(0);
      expect(metrics.avgSimilarity).toBeUndefined();
      expect(metrics.exactMatchRate).toBeUndefined();
    });

    it('should calculate LLM scores when present', () => {
      const scores: ScoreResult[] = [
        { llmScore: 85 },
        { llmScore: 90 },
        { llmScore: 80 },
      ];

      const metrics = calculateRunMetrics(scores);
      expect(metrics.avgLLMScore).toBeCloseTo(85, 2);
    });

    it('should handle mixed score types', () => {
      const scores: ScoreResult[] = [
        { similarity: 0.8, exactMatch: true },
        { similarity: 0.7, exactMatch: false },
        { llmScore: 85 },
      ];

      const metrics = calculateRunMetrics(scores);
      expect(metrics.avgSimilarity).toBeCloseTo(0.75, 2);
      expect(metrics.exactMatchRate).toBe(0.5);
      expect(metrics.avgLLMScore).toBe(85);
      expect(metrics.totalItems).toBe(3);
    });
  });
});
