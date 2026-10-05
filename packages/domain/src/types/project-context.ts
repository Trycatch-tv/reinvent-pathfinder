export type SeniorityLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProjectContext {
  readonly id: string;
  readonly name: string;
  readonly industry?: string;
  readonly currentStack: readonly string[];
  readonly seniority: SeniorityLevel;
  readonly goals: readonly string[];
  readonly constraints?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
