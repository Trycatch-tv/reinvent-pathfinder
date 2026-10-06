import type { SessionAvailability, SessionCandidate } from '@pathfinder/domain';
import type {
  RawAwsSession,
  RawAwsCatalogResponse,
  RawAwsListSessionsResponse,
  CatalogQueryParams,
} from '../types/raw-aws-events.js';
import {
  AwsEventsError,
  AwsEventsThrottlingError,
  AwsEventsNotFoundError,
  AwsEventsUnauthorizedError,
  AwsEventsForbiddenError,
} from '../types/errors.js';
import { normalizeAwsSession } from '../normalizer/normalize-session.js';
import { normalizeAwsAvailability } from '../normalizer/normalize-availability.js';
import { SAMPLE_RAW_SESSIONS } from '../fixtures/sample-sessions.js';
import { SAMPLE_USER_SCHEDULE } from '../fixtures/sample-user-schedule.js';
import type { UserScheduleItem, UserScheduleResult, RawAwsScheduleResponse } from '../types/user-schedule.js';

import type { TokenStore } from '../auth/token-store.js';

export interface AwsEventsClientOptions {
  readonly baseUrl?: string;
  /** Non-secret AWS event id. Enables the official ListSessions endpoint. */
  readonly eventId?: string;
  readonly apiKey?: string;
  readonly tokenStore?: TokenStore;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly baseBackoffMs?: number;
  readonly mockMode?: boolean;
  readonly mockSessions?: readonly RawAwsSession[];
  readonly mockUserSchedule?: readonly UserScheduleItem[];
}

export interface CatalogPageResult {
  readonly sessions: readonly SessionCandidate[];
  readonly availability: readonly SessionAvailability[];
  readonly nextCursor?: string;
  readonly totalCount?: number;
}

export interface AvailabilitySnapshot {
  readonly sessions: readonly SessionCandidate[];
  readonly availability: readonly SessionAvailability[];
  /** Local instant when the provider snapshot was observed. */
  readonly observedAt: string;
}

export class AwsEventsClient {
  private readonly baseUrl: string;
  private readonly eventId?: string;
  private readonly apiKey?: string;
  private readonly tokenStore?: TokenStore;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;
  private readonly mockMode: boolean;
  private readonly mockSessions: readonly RawAwsSession[];
  private mockUserScheduleList: UserScheduleItem[];
  private mockFavoriteIds: Set<string>;

  constructor(options: AwsEventsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.awsevents.com/v1';
    this.eventId = options.eventId;
    this.apiKey = options.apiKey;
    this.tokenStore = options.tokenStore;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseBackoffMs = options.baseBackoffMs ?? 50; // default short backoff for tests
    this.mockMode = options.mockMode ?? false;
    this.mockSessions = options.mockSessions ?? SAMPLE_RAW_SESSIONS;
    this.mockUserScheduleList = [...(options.mockUserSchedule ?? SAMPLE_USER_SCHEDULE)];
    this.mockFavoriteIds = new Set(
      this.mockUserScheduleList
        .filter((item) => item.type === 'favorite')
        .map((item) => item.session?.id ?? item.id)
    );
  }

  /**
   * Fetches a single page of sessions from the catalog.
   */
  public async fetchCatalogPage(params: CatalogQueryParams = {}): Promise<CatalogPageResult> {
    if (this.mockMode) {
      return this.mockFetchCatalogPage(params);
    }

    const query = new URLSearchParams();
    let rawSessions: readonly RawAwsSession[];
    let nextCursor: string | undefined;
    let totalCount: number | undefined;

    if (this.eventId) {
      const nextToken = params.nextToken ?? params.cursor;
      if (nextToken) query.set('nextToken', nextToken);
      const url = `${this.baseUrl}/events/${encodeURIComponent(this.eventId)}/sessions${query.size ? `?${query}` : ''}`;
      const rawResponse = await this.requestWithRetry<RawAwsListSessionsResponse>(url);
      rawSessions = rawResponse.items ?? [];
      nextCursor = rawResponse.nextToken;
      totalCount = rawResponse.totalCount;
    } else {
      // Kept solely for the pre-existing local catalog adapter and its fixtures.
      if (params.limit) query.set('limit', params.limit.toString());
      if (params.cursor) query.set('cursor', params.cursor);
      if (params.search) query.set('search', params.search);
      if (params.topic) query.set('topic', params.topic);
      if (params.level) query.set('level', params.level.toString());
      const url = `${this.baseUrl}/catalog?${query.toString()}`;
      const rawResponse = await this.requestWithRetry<RawAwsCatalogResponse>(url);
      rawSessions = rawResponse.data ?? [];
      nextCursor = rawResponse.next_cursor;
      totalCount = rawResponse.total_count;
    }

    const observedAt = params.observedAt ?? new Date().toISOString();
    const sessions = rawSessions.map(normalizeAwsSession);
    return {
      sessions,
      availability: rawSessions.map((session) => normalizeAwsAvailability(session, observedAt)),
      nextCursor,
      totalCount,
    };
  }

  /**
   * Iterates until AWS Events omits nextToken. A short page is not a terminal signal.
   */
  public async fetchAllSessions(options: {
    maxPages?: number;
    params?: CatalogQueryParams;
  } = {}): Promise<readonly SessionCandidate[]> {
    const allSessions: SessionCandidate[] = [];
    let currentCursor = options.params?.nextToken ?? options.params?.cursor;
    let pagesFetched = 0;

    while (true) {
      const pageResult = await this.fetchCatalogPage({
        ...options.params,
        cursor: currentCursor,
      });

      allSessions.push(...pageResult.sessions);
      pagesFetched++;

      if (options.maxPages !== undefined && pagesFetched >= options.maxPages) {
        break;
      }

      if (!pageResult.nextCursor) {
        break;
      }
      currentCursor = pageResult.nextCursor;
    }

    return allSessions;
  }

  /** Fetches sessions and their provider availability as one in-memory snapshot. */
  public async fetchAvailabilitySnapshot(): Promise<AvailabilitySnapshot> {
    const observedAt = new Date().toISOString();
    const sessions: SessionCandidate[] = [];
    const availability: SessionAvailability[] = [];
    let nextToken: string | undefined;

    do {
      const page = await this.fetchCatalogPage({ nextToken, observedAt });
      sessions.push(...page.sessions);
      availability.push(...page.availability);
      nextToken = page.nextCursor;
    } while (nextToken);

    return { sessions, availability, observedAt };
  }

  /**
   * Fetches a single session by its session ID.
   */
  public async fetchSessionById(sessionId: string): Promise<SessionCandidate | null> {
    if (this.mockMode) {
      const found = this.mockSessions.find((s) => (s.sessionId ?? s.session_id) === sessionId);
      return found ? normalizeAwsSession(found) : null;
    }

    const url = `${this.baseUrl}/catalog/sessions/${encodeURIComponent(sessionId)}`;
    try {
      const rawSession = await this.requestWithRetry<RawAwsSession>(url);
      return normalizeAwsSession(rawSession);
    } catch (error) {
      if (error instanceof AwsEventsNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  private async requestWithRetry<T>(url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET'): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        const bearerToken = this.tokenStore?.getAccessToken() ?? this.apiKey;
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }

        const response = await fetch(url, {
          method,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          if (response.status === 204) {
            return undefined as T;
          }
          return (await response.json()) as T;
        }

        if (response.status === 404) {
          throw new AwsEventsNotFoundError(`Resource at ${url} not found`);
        }

        if (response.status === 401) {
          throw new AwsEventsUnauthorizedError();
        }

        if (response.status === 403) {
          throw new AwsEventsForbiddenError();
        }

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

          if (attempt === this.maxRetries) {
            throw new AwsEventsThrottlingError('Max retries exceeded on 429 rate limit', retryAfterSeconds);
          }

          const backoff = retryAfterSeconds
            ? retryAfterSeconds * 1000
            : this.calculateBackoff(attempt);
          await this.sleep(backoff);
          attempt++;
          continue;
        }

        if (response.status >= 500) {
          if (attempt === this.maxRetries) {
            throw new AwsEventsError(`Server error HTTP ${response.status}`, response.status, false);
          }
          await this.sleep(this.calculateBackoff(attempt));
          attempt++;
          continue;
        }

        throw new AwsEventsError(`HTTP request failed with status ${response.status}`, response.status, false);
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof AwsEventsError) {
          if (!err.isRetryable || attempt >= this.maxRetries) {
            throw err;
          }
        }
        if (attempt >= this.maxRetries) {
          throw err instanceof Error ? err : new Error(String(err));
        }
        await this.sleep(this.calculateBackoff(attempt));
        attempt++;
      }
    }

    throw new AwsEventsError(`Max retries of ${this.maxRetries} exceeded`);
  }

  private calculateBackoff(attempt: number): number {
    const jitter = Math.random() * 20;
    return this.baseBackoffMs * Math.pow(2, attempt) + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mockFetchCatalogPage(params: CatalogQueryParams): CatalogPageResult {
    let filtered = [...this.mockSessions];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) => (s.title ?? '').toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
      );
    }

    if (params.topic) {
      const t = params.topic.toLowerCase();
      filtered = filtered.filter(
        (s) => (s.topics ?? []).some((item) => item.toLowerCase().includes(t)) || s.track?.toLowerCase().includes(t)
      );
    }

    const limit = params.limit ?? 2;
    const startIndex = params.cursor ? parseInt(params.cursor, 10) : 0;
    const pageItems = filtered.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;
    const nextCursor = nextIndex < filtered.length ? nextIndex.toString() : undefined;

    return {
      sessions: pageItems.map(normalizeAwsSession),
      availability: pageItems.map((session) => normalizeAwsAvailability(session, params.observedAt ?? new Date().toISOString())),
      nextCursor,
      totalCount: filtered.length,
    };
  }

  /**
   * Fetches the authenticated user's personal schedule (reservations, favorites, personal time).
   * In non-mock mode, requires a valid token in the configured TokenStore.
   */
  public async getPersonalSchedule(): Promise<UserScheduleResult> {
    if (this.mockMode) {
      return {
        items: [...this.mockUserScheduleList],
        lastSyncedAt: new Date().toISOString(),
      };
    }

    const token = this.tokenStore?.getAccessToken();
    if (!token) {
      throw new AwsEventsUnauthorizedError('Cannot fetch personal schedule without an active access token.');
    }

    const url = `${this.baseUrl}/user/schedule`;
    const rawResponse = await this.requestWithRetry<RawAwsScheduleResponse>(url);

    const items: UserScheduleItem[] = [];
    for (const rawItem of rawResponse.data ?? []) {
      let session: SessionCandidate | undefined;
      if (rawItem.session_id) {
        try {
          session = (await this.fetchSessionById(rawItem.session_id)) ?? undefined;
        } catch {
          // If session details fail to fetch, proceed with minimal schedule info
        }
      }

      const itemType = rawItem.type.toLowerCase() as UserScheduleItem['type'];
      items.push({
        id: rawItem.id,
        type: itemType,
        session,
        title: rawItem.title ?? session?.title ?? 'Scheduled Item',
        day: rawItem.day ?? session?.schedule?.day ?? rawItem.start_time.split('T')[0] ?? '',
        startTime: rawItem.start_time,
        endTime: rawItem.end_time,
        venue: rawItem.venue ?? session?.location?.venue,
        room: rawItem.room ?? session?.location?.room,
      });
    }

    return {
      items,
      lastSyncedAt: rawResponse.sync_time ?? new Date().toISOString(),
    };
  }

  /**
   * Retrieves the IDs of all sessions marked as favorites.
   */
  public async getFavorites(): Promise<readonly string[]> {
    if (this.mockMode) {
      return Array.from(this.mockFavoriteIds);
    }

    const schedule = await this.getPersonalSchedule();
    return schedule.items
      .filter((item) => item.type === 'favorite')
      .map((item) => item.session?.id ?? item.id);
  }

  /**
   * Adds a session to user favorites.
   */
  public async addFavorite(sessionId: string): Promise<void> {
    if (this.mockMode) {
      this.mockFavoriteIds.add(sessionId);
      if (!this.mockUserScheduleList.some((item) => (item.session?.id ?? item.id) === sessionId)) {
        const session = await this.fetchSessionById(sessionId);
        this.mockUserScheduleList.push({
          id: `fav-${sessionId}`,
          type: 'favorite',
          session: session ?? undefined,
          title: session?.title ?? `Session ${sessionId}`,
          day: session?.schedule?.day ?? '',
          startTime: session?.schedule?.startTime ?? '',
          endTime: session?.schedule?.endTime ?? '',
          venue: session?.location?.venue,
          room: session?.location?.room,
        });
      }
      return;
    }

    const token = this.tokenStore?.getAccessToken();
    if (!token) {
      throw new AwsEventsUnauthorizedError('Cannot add favorite without an active access token.');
    }

    const url = `${this.baseUrl}/user/favorites/${encodeURIComponent(sessionId)}`;
    await this.requestWithRetry<unknown>(url, 'POST');
  }

  /**
   * Removes a session from user favorites.
   */
  public async removeFavorite(sessionId: string): Promise<void> {
    if (this.mockMode) {
      this.mockFavoriteIds.delete(sessionId);
      this.mockUserScheduleList = this.mockUserScheduleList.filter(
        (item) => (item.session?.id ?? item.id) !== sessionId && item.id !== `fav-${sessionId}`
      );
      return;
    }

    const token = this.tokenStore?.getAccessToken();
    if (!token) {
      throw new AwsEventsUnauthorizedError('Cannot remove favorite without an active access token.');
    }

    const url = `${this.baseUrl}/user/favorites/${encodeURIComponent(sessionId)}`;
    await this.requestWithRetry<unknown>(url, 'DELETE');
  }
}
