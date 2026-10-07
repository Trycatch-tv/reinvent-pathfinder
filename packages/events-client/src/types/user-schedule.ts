import type { SessionCandidate } from '@pathfinder/domain';

export interface PersonalTimeEntry {
  readonly personalTimeId: string;
  readonly startDateTime: string;
  readonly endDateTime: string;
  readonly title: string;
  readonly description: string;
  readonly location?: string;
}

/** Provider-independent in-memory view of the attendee's AWS Events schedule. */
export interface UserScheduleResult {
  readonly reservedSessionIds: readonly string[];
  readonly favoriteSessionIds: readonly string[];
  readonly personalTime: readonly PersonalTimeEntry[];
  readonly lastSyncedAt: string;
  /** Compatibility projection for existing local-first consumers. */
  readonly items: readonly UserScheduleItem[];
}

export interface FavoriteFailure {
  readonly sessionId: string;
  readonly code?: string;
}

export interface FavoriteMutationResult {
  readonly successfulSessionIds: readonly string[];
  readonly failed: readonly FavoriteFailure[];
}

/** Reservation failures are per-session and may include a conflicting session ID. */
export interface ReservationFailure {
  readonly sessionId: string;
  readonly code?: string;
  readonly conflictSessionId?: string;
}

export interface ReservationMutationResult {
  readonly successfulSessionIds: readonly string[];
  readonly failed: readonly ReservationFailure[];
}

export interface RawAwsPersonalTime {
  readonly personalTimeId: string;
  readonly startDateTime: string;
  readonly endDateTime: string;
  readonly title: string;
  readonly description: string;
  readonly location?: string;
}

export interface RawAwsScheduleResponse {
  readonly schedule?: {
    readonly reserved: readonly string[];
    readonly favorites: readonly string[];
    readonly personalTime: readonly RawAwsPersonalTime[];
  };
  /** Legacy demo response retained only for fixture compatibility. */
  readonly data?: readonly RawAwsScheduleItem[];
  readonly sync_time?: string;
}

export interface RawAwsScheduleItem {
  readonly id: string;
  readonly type: string;
  readonly session_id?: string;
  readonly title?: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly day?: string;
  readonly venue?: string;
  readonly room?: string;
}

export interface RawAwsFavoriteMutationResponse {
  readonly result: {
    readonly successful: readonly string[];
    readonly failed: readonly { readonly sessionId: string; readonly code?: string }[];
  };
}

export interface RawAwsReservationMutationResponse {
  readonly result: {
    readonly successful?: readonly string[];
    readonly failed?: readonly {
      readonly sessionId: string;
      readonly code?: string;
      readonly conflictSessionId?: string;
    }[];
  };
}

/** Legacy normalized item retained for learning-path conflict evaluation. */
export type ScheduleItemType = 'reserved' | 'waitlisted' | 'favorite' | 'personal_time';

export interface UserScheduleItem {
  readonly id: string;
  readonly type: ScheduleItemType;
  readonly session?: SessionCandidate;
  readonly title: string;
  readonly day: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly venue?: string;
  readonly room?: string;
  readonly notes?: string;
}
