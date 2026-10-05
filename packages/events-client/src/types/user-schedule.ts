import type { SessionCandidate } from '@pathfinder/domain';

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

export interface UserScheduleResult {
  readonly items: readonly UserScheduleItem[];
  readonly lastSyncedAt: string;
}

export interface RawAwsScheduleItem {
  readonly id: string;
  readonly type: string; // 'RESERVED' | 'WAITLISTED' | 'FAVORITE' | 'PERSONAL_TIME'
  readonly session_id?: string;
  readonly title?: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly day?: string;
  readonly venue?: string;
  readonly room?: string;
}

export interface RawAwsScheduleResponse {
  readonly data: readonly RawAwsScheduleItem[];
  readonly sync_time?: string;
}
