import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ContextForm } from './components/ContextForm.js';
import { KnowledgeProfileView } from './components/KnowledgeProfileView.js';
import { KnowledgeGapsList } from './components/KnowledgeGapsList.js';
import { App } from './App.js';
import type { KnowledgeProfile, ProjectContext, KnowledgeGap } from '@pathfinder/domain';

const mockProfile: KnowledgeProfile = {
  id: 'prof-1',
  userId: 'user-1',
  skills: [
    { topic: 'BEDROCK', proficiency: 'associate' },
    { topic: 'DYNAMODB', proficiency: 'professional' },
  ],
  targetDomains: ['Artificial Intelligence', 'Databases'],
  updatedAt: '2026-10-05T00:00:00Z',
};

const mockContext: ProjectContext = {
  id: 'ctx-1',
  name: 're:Invent Agent Core',
  currentStack: ['Bedrock', 'DynamoDB'],
  seniority: 'advanced',
  goals: ['Build autonomous systems'],
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: '2026-10-05T00:00:00Z',
};

const mockGaps: KnowledgeGap[] = [
  {
    id: 'gap-1',
    topic: 'Amazon Bedrock AgentCore & Autonomous Workflows',
    description: 'Deep dive into multi-agent orchestration and tools.',
    targetProficiency: 'professional',
    severity: 'critical',
    status: 'open',
    rationale: 'Project requires agents',
    addressedBySessionIds: [],
  },
  {
    id: 'gap-2',
    topic: 'DynamoDB Single-Table Design',
    description: 'Advanced partition key strategies.',
    targetProficiency: 'professional',
    severity: 'important',
    status: 'open',
    rationale: 'Scalable storage',
    addressedBySessionIds: [],
  },
];

describe('apps/client UI components', () => {
  it('ContextForm renders form inputs and buttons properly', () => {
    const html = renderToString(React.createElement(ContextForm, { onSubmit: () => {} }));
    expect(html).toContain('Nombre del Proyecto');
    expect(html).toContain('¿Qué estás construyendo');
    expect(html).toContain('Bedrock');
    expect(html).toContain('Descubrir Mi Knowledge Profile y Gaps');
  });

  it('KnowledgeProfileView renders detected domains and skill badges', () => {
    const html = renderToString(React.createElement(KnowledgeProfileView, {
      profile: mockProfile,
      context: mockContext,
    }));
    expect(html).toContain('Perfil de Conocimiento:');
    expect(html).toContain('re:Invent Agent Core');
    expect(html).toContain('ADVANCED');
    expect(html).toContain('Artificial Intelligence');
    expect(html).toContain('BEDROCK');
    expect(html).toContain('DYNAMODB');
  });

  it('KnowledgeGapsList renders gaps with severity badges and descriptions', () => {
    const html = renderToString(React.createElement(KnowledgeGapsList, {
      gaps: mockGaps,
    }));
    expect(html).toContain('Knowledge Gaps Identificados');
    expect(html).toContain('CRÍTICA');
    expect(html).toContain('IMPORTANTE');
    expect(html).toContain('Amazon Bedrock AgentCore');
    expect(html).toContain('DynamoDB Single-Table Design');
  });

  it('App renders step 1 capture view initially', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('re:Invent Pathfinder');
    expect(html).toContain('Paso 1: ¿Qué estás construyendo?');
    expect(html).toContain('Descubrir Mi Knowledge Profile y Gaps');
  });
});
