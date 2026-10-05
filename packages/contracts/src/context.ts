import type {
  ProjectContext,
  SeniorityLevel,
  KnowledgeProfile,
  KnowledgeGap,
} from '@pathfinder/domain';

export interface AnalyzeContextRequest {
  readonly projectName: string;
  readonly description: string;
  readonly currentStack?: readonly string[];
  readonly seniority?: SeniorityLevel;
  readonly goals?: readonly string[];
  readonly constraints?: readonly string[];
  readonly userId?: string;
}

export interface AnalyzeContextResponse {
  readonly projectContext: ProjectContext;
  readonly knowledgeProfile: KnowledgeProfile;
  readonly knowledgeGaps: readonly KnowledgeGap[];
  readonly analyzedAt: string;
  readonly modelId?: string;
}

export function validateAnalyzeContextRequest(input: unknown): AnalyzeContextRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body: expected an object.');
  }

  const candidate = input as Record<string, unknown>;

  if (typeof candidate.projectName !== 'string' || candidate.projectName.trim().length === 0) {
    throw new Error('Field "projectName" is required and must be a non-empty string.');
  }

  if (typeof candidate.description !== 'string' || candidate.description.trim().length === 0) {
    throw new Error('Field "description" is required and must be a non-empty string.');
  }

  if (candidate.description.length > 5000) {
    throw new Error('Field "description" exceeds maximum allowed length of 5000 characters.');
  }

  const validSeniority: SeniorityLevel[] = ['beginner', 'intermediate', 'advanced'];
  const seniority = candidate.seniority !== undefined
    ? (candidate.seniority as SeniorityLevel)
    : 'intermediate';

  if (!validSeniority.includes(seniority)) {
    throw new Error(`Field "seniority" must be one of: ${validSeniority.join(', ')}.`);
  }

  const currentStack = Array.isArray(candidate.currentStack)
    ? candidate.currentStack.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  const goals = Array.isArray(candidate.goals)
    ? candidate.goals.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  const constraints = Array.isArray(candidate.constraints)
    ? candidate.constraints.map(String).map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    projectName: candidate.projectName.trim(),
    description: candidate.description.trim(),
    currentStack,
    seniority,
    goals,
    constraints,
    userId: typeof candidate.userId === 'string' ? candidate.userId.trim() : undefined,
  };
}
