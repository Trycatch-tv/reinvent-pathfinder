export type SessionLevel = 100 | 200 | 300 | 400 | 500;

export type SessionFormat =
  | 'breakout'
  | 'workshop'
  | 'chalk-talk'
  | 'builders-session'
  | 'keynote'
  | 'lightning-talk'
  | 'other';

export interface SessionSchedule {
  readonly day: string;
  readonly startTime: string; // ISO 8601 or HH:mm
  readonly endTime: string;   // ISO 8601 or HH:mm
}

export interface SessionLocation {
  readonly venue: string;
  readonly room?: string;
}

export interface SessionCandidate {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly level: SessionLevel;
  readonly format: SessionFormat;
  readonly topics: readonly string[];
  readonly schedule?: SessionSchedule;
  readonly location?: SessionLocation;
  readonly capacityRemaining?: number;
}
