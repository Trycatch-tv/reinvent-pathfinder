export interface RawAwsSession {
  readonly session_id: string;
  readonly session_code?: string;
  readonly title: string;
  readonly description?: string;
  readonly abstract?: string;
  readonly level?: string | number;
  readonly session_type?: string;
  readonly track?: string;
  readonly topics?: readonly string[];
  readonly start_time?: string;
  readonly end_time?: string;
  readonly day?: string;
  readonly venue?: string;
  readonly room?: string;
  readonly capacity_remaining?: number;
}

export interface RawAwsCatalogResponse {
  readonly data: readonly RawAwsSession[];
  readonly next_cursor?: string;
  readonly total_count?: number;
}

export interface CatalogQueryParams {
  readonly limit?: number;
  readonly cursor?: string;
  readonly topic?: string;
  readonly level?: number;
  readonly search?: string;
}
