export type ExperienceMode = 'demo' | 'live';

export interface ExperienceModePolicy {
  readonly mode: ExperienceMode;
  readonly requiresAuth: boolean;
  readonly usesLiveAwsEvents: boolean;
  readonly allowsLiveMutations: boolean;
  readonly label: string;
  readonly description: string;
}

export const EXPERIENCE_MODE_POLICIES: Record<ExperienceMode, ExperienceModePolicy> = {
  demo: {
    mode: 'demo',
    requiresAuth: false,
    usesLiveAwsEvents: false,
    allowsLiveMutations: false,
    label: 'Modo Demo',
    description: 'Exploración completa y simulada sin credenciales ni mutaciones en AWS.',
  },
  live: {
    mode: 'live',
    requiresAuth: true,
    usesLiveAwsEvents: true,
    allowsLiveMutations: true,
    label: 'Modo Live (re:Invent)',
    description: 'Conexión oficial con AWS Builder ID, catálogo real de AWS Events y reservas confirmadas.',
  },
};
