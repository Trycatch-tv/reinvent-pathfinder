import { describe, it, expect } from 'vitest';
import {
  validateAnalyzeContextRequest,
  validateRankRecommendationsRequest,
} from './index.js';

describe('validateAnalyzeContextRequest', () => {
  it('normaliza una petición válida y aplica defaults', () => {
    const result = validateAnalyzeContextRequest({
      projectName: '  Pathfinder  ',
      description: '  Construyo un asistente de aprendizaje  ',
      currentStack: ['  TypeScript ', '', 'AWS'],
      goals: ['aprender Bedrock'],
    });

    expect(result.projectName).toBe('Pathfinder');
    expect(result.description).toBe('Construyo un asistente de aprendizaje');
    expect(result.currentStack).toEqual(['TypeScript', 'AWS']);
    expect(result.goals).toEqual(['aprender Bedrock']);
    // default de seniority cuando no se envía
    expect(result.seniority).toBe('intermediate');
  });

  it('rechaza cuando falta projectName', () => {
    expect(() =>
      validateAnalyzeContextRequest({ description: 'algo' }),
    ).toThrow(/projectName/);
  });

  it('rechaza cuando falta description', () => {
    expect(() =>
      validateAnalyzeContextRequest({ projectName: 'X' }),
    ).toThrow(/description/);
  });

  it('rechaza una seniority inválida', () => {
    expect(() =>
      validateAnalyzeContextRequest({
        projectName: 'X',
        description: 'y',
        seniority: 'wizard',
      }),
    ).toThrow(/seniority/);
  });

  it('rechaza entrada que no es objeto', () => {
    expect(() => validateAnalyzeContextRequest(null)).toThrow(/expected an object/);
  });
});

describe('validateRankRecommendationsRequest', () => {
  const baseGap = { id: 'g1' } as unknown;
  const baseSession = { id: 's1' } as unknown;

  it('normaliza una petición válida y aplica el default de maxRecommendations', () => {
    const result = validateRankRecommendationsRequest({
      knowledgeGaps: [baseGap],
      candidateSessions: [baseSession],
    });

    expect(result.knowledgeGaps).toHaveLength(1);
    expect(result.candidateSessions).toHaveLength(1);
    expect(result.maxRecommendations).toBe(10);
  });

  it('acota maxRecommendations a 50 como máximo', () => {
    const result = validateRankRecommendationsRequest({
      knowledgeGaps: [baseGap],
      candidateSessions: [baseSession],
      maxRecommendations: 999,
    });

    expect(result.maxRecommendations).toBe(50);
  });

  it('rechaza cuando knowledgeGaps está vacío', () => {
    expect(() =>
      validateRankRecommendationsRequest({
        knowledgeGaps: [],
        candidateSessions: [baseSession],
      }),
    ).toThrow(/knowledgeGaps/);
  });

  it('rechaza cuando candidateSessions está vacío', () => {
    expect(() =>
      validateRankRecommendationsRequest({
        knowledgeGaps: [baseGap],
        candidateSessions: [],
      }),
    ).toThrow(/candidateSessions/);
  });
});
