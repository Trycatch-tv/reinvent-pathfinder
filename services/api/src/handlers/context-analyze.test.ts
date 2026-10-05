import { describe, it, expect } from 'vitest';
import { ContextAnalyzeHandler } from './context-analyze.js';
import { HeuristicContextAnalyzer } from '@pathfinder/ai-knowledge';

describe('ContextAnalyzeHandler (services/api)', () => {
  const handler = new ContextAnalyzeHandler(new HeuristicContextAnalyzer());

  it('handles valid POST request and returns 200 with structured profile and gaps', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        projectName: 'Smart Event Assistant',
        description: 'Building an event planner on AWS using Bedrock, DynamoDB, and Serverless.',
        seniority: 'intermediate',
        goals: ['Improve session recommendation relevance'],
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');

    const parsed = JSON.parse(response.body);
    expect(parsed.projectContext.name).toBe('Smart Event Assistant');
    expect(parsed.knowledgeProfile.skills.length).toBeGreaterThan(0);
    expect(parsed.knowledgeGaps.length).toBeGreaterThan(0);
    expect(parsed.analyzedAt).toBeDefined();
  });

  it('returns 400 when body is empty or null', async () => {
    const response = await handler.handle({});
    expect(response.statusCode).toBe(400);

    const parsed = JSON.parse(response.body);
    expect(parsed.error).toBe('Bad Request');
  });

  it('returns 400 on malformed JSON payload', async () => {
    const response = await handler.handle({
      body: '{ malformed json',
    });
    expect(response.statusCode).toBe(400);

    const parsed = JSON.parse(response.body);
    expect(parsed.message).toContain('Invalid JSON payload');
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        projectName: '',
        description: 'Missing project name',
      }),
    });
    expect(response.statusCode).toBe(400);

    const parsed = JSON.parse(response.body);
    expect(parsed.error).toBe('Validation Error');
    expect(parsed.message).toContain('projectName');
  });

  it('returns 400 when description exceeds character limits', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        projectName: 'Excessive Project',
        description: 'a'.repeat(5001),
      }),
    });
    expect(response.statusCode).toBe(400);

    const parsed = JSON.parse(response.body);
    expect(parsed.message).toContain('exceeds maximum allowed length');
  });
});
