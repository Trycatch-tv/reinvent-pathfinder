// @pathfinder/events-client — Adapter de AWS Events REST API

// Types & Errors
export * from './types/raw-aws-events.js';
export * from './types/errors.js';
export * from './types/user-schedule.js';

// Normalizers
export * from './normalizer/normalize-session.js';

// Client
export * from './client/aws-events-client.js';

// Fixtures for offline mode
export * from './fixtures/sample-sessions.js';
export * from './fixtures/sample-user-schedule.js';

// Authentication (OAuth 2.0 + PKCE with AWS Builder ID)
export * from './auth/pkce.js';
export * from './auth/token-store.js';
export * from './auth/builder-id-client.js';

// Schedule & Conflicts
export * from './schedule/schedule-conflict-evaluator.js';
