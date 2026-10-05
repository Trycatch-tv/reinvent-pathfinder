export type SkillProficiency = 'fundamental' | 'associate' | 'professional' | 'specialty';

export interface KnowledgeSkill {
  readonly topic: string;
  readonly proficiency: SkillProficiency;
  readonly verified?: boolean;
}

export interface KnowledgeProfile {
  readonly id: string;
  readonly userId: string;
  readonly skills: readonly KnowledgeSkill[];
  readonly targetDomains: readonly string[];
  readonly updatedAt: string;
}
