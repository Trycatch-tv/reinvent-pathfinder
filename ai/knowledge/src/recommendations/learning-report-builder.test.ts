import { describe, it, expect } from 'vitest';
import type { KnowledgeGap, KnowledgeGapSeverity, KnowledgeGapStatus } from '@pathfinder/domain';
import { buildLearningReport, classifyCoverage } from './learning-report-builder.js';

function gap(
  id: string,
  severity: KnowledgeGapSeverity,
  status: KnowledgeGapStatus,
  addressedBySessionIds: string[] = [],
): KnowledgeGap {
  return {
    id,
    topic: `topic-${id}`,
    description: `desc-${id}`,
    targetProficiency: 'professional',
    severity,
    status,
    rationale: `rationale-${id}`,
    addressedBySessionIds,
  };
}

const initialGaps: readonly KnowledgeGap[] = [
  gap('g1', 'critical', 'open'),
  gap('g2', 'important', 'open'),
  gap('g3', 'nice-to-have', 'open'),
];

describe('classifyCoverage', () => {
  it('mapea status de dominio a cobertura', () => {
    expect(classifyCoverage('closed')).toBe('covered');
    expect(classifyCoverage('addressed')).toBe('partial');
    expect(classifyCoverage('open')).toBe('pending');
  });
});

describe('buildLearningReport', () => {
  it('cuenta cubiertos/parciales/pendientes según el estado final', () => {
    const currentGaps = [
      gap('g1', 'critical', 'closed', ['s1']),
      gap('g2', 'important', 'addressed', ['s2']),
      gap('g3', 'nice-to-have', 'open'),
    ];
    const report = buildLearningReport({ initialGaps, currentGaps });

    expect(report.counts).toEqual({ covered: 1, partial: 1, pending: 1, total: 3 });
  });

  it('conserva el estado inicial y final por gap', () => {
    const currentGaps = [gap('g1', 'critical', 'closed', ['s1'])];
    const report = buildLearningReport({ initialGaps, currentGaps });

    const g1 = report.gaps.find((g) => g.gapId === 'g1');
    expect(g1?.initialStatus).toBe('open');
    expect(g1?.finalStatus).toBe('closed');
    expect(g1?.coverage).toBe('covered');
    expect(g1?.addressedBySessionIds).toContain('s1');
  });

  it('la ruta posterior solo incluye pendientes, priorizados por severidad', () => {
    const currentGaps = [
      gap('g3', 'nice-to-have', 'open'),
      gap('g1', 'critical', 'open'),
      gap('g2', 'important', 'closed'), // cubierto: no debe aparecer en la ruta
      gap('g4', 'important', 'open'),
    ];
    const report = buildLearningReport({ initialGaps, currentGaps });

    const routeIds = report.nextRoute.map((g) => g.gapId);
    expect(routeIds).toEqual(['g1', 'g4', 'g3']); // critical, important, nice-to-have
    expect(routeIds).not.toContain('g2');
  });

  it('con todos los gaps cubiertos, la ruta posterior queda vacía', () => {
    const currentGaps = [
      gap('g1', 'critical', 'closed'),
      gap('g2', 'important', 'closed'),
    ];
    const report = buildLearningReport({ initialGaps, currentGaps });

    expect(report.nextRoute).toEqual([]);
    expect(report.counts.pending).toBe(0);
  });

  it('usa el estado actual como inicial cuando el gap no existía al inicio', () => {
    const currentGaps = [gap('gNew', 'critical', 'open')];
    const report = buildLearningReport({ initialGaps: [], currentGaps });

    const g = report.gaps[0];
    expect(g?.initialStatus).toBe('open');
    expect(g?.finalStatus).toBe('open');
  });
});
