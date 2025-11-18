import { compareTwoStrings } from 'string-similarity';
import { scoreWithLLM } from './openai-service';

export interface ScoreResult {
  exactMatch?: boolean;
  similarity?: number;
  llmScore?: number;
  llmReasoning?: string;
}

/**
 * Calculate string similarity score (0-1)
 */
export function calculateSimilarity(output: string, expected: string): number {
  return compareTwoStrings(output.trim().toLowerCase(), expected.trim().toLowerCase());
}

/**
 * Calculate exact match
 */
export function calculateExactMatch(output: string, expected: string): boolean {
  return output.trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * Score an experiment result
 */
export async function scoreResult(params: {
  input: Record<string, any>;
  output: string;
  expectedOutput?: string;
  useLLMJudge?: boolean;
}): Promise<ScoreResult> {
  const { input, output, expectedOutput, useLLMJudge = false } = params;

  const result: ScoreResult = {};

  // Basic scoring if expected output is provided
  if (expectedOutput) {
    result.exactMatch = calculateExactMatch(output, expectedOutput);
    result.similarity = calculateSimilarity(output, expectedOutput);
  }

  // Optional LLM judge scoring
  if (useLLMJudge) {
    try {
      const llmScore = await scoreWithLLM({ input, output, expectedOutput });
      result.llmScore = llmScore.score;
      result.llmReasoning = llmScore.reasoning;
    } catch (error) {
      console.error('LLM scoring failed:', error);
    }
  }

  return result;
}

/**
 * Calculate aggregated metrics for a run
 */
export function calculateRunMetrics(scores: ScoreResult[]): {
  avgSimilarity?: number;
  exactMatchRate?: number;
  avgLLMScore?: number;
  totalItems: number;
} {
  const totalItems = scores.length;

  if (totalItems === 0) {
    return { totalItems: 0 };
  }

  const metrics: any = { totalItems };

  // Calculate average similarity
  const similarities = scores.filter((s) => s.similarity !== undefined).map((s) => s.similarity!);
  if (similarities.length > 0) {
    metrics.avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  }

  // Calculate exact match rate
  const exactMatches = scores.filter((s) => s.exactMatch !== undefined);
  if (exactMatches.length > 0) {
    metrics.exactMatchRate =
      exactMatches.filter((s) => s.exactMatch).length / exactMatches.length;
  }

  // Calculate average LLM score
  const llmScores = scores.filter((s) => s.llmScore !== undefined).map((s) => s.llmScore!);
  if (llmScores.length > 0) {
    metrics.avgLLMScore = llmScores.reduce((a, b) => a + b, 0) / llmScores.length;
  }

  return metrics;
}
