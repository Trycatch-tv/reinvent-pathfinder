// @pathfinder/domain — Modelos de dominio puros y desacoplados de AWS.

// Types
export * from './types/project-context.js';
export * from './types/knowledge-profile.js';
export * from './types/knowledge-gap.js';
export * from './types/session-candidate.js';
export * from './types/session-availability.js';
export * from './types/session-recommendation.js';
export * from './types/schedule-conflict.js';
export * from './types/learning-path.js';
export * from './types/reflection.js';
export * from './types/attendee-journey.js';

// Logic & Domain services
export * from './logic/gap-transitions.js';
export * from './logic/conflict-detector.js';
export * from './logic/journey-transitions.js';

// Fixtures
export * from './fixtures/session-availability.js';
