import type { SessionCandidate } from '@pathfinder/domain';
import type {
  RawAwsSession,
  RawAwsCatalogResponse,
  CatalogQueryParams,
} from '../types/raw-aws-events.js';
import {
  AwsEventsError,
  AwsEventsThrottlingError,
  AwsEventsNotFoundError,
} from '../types/errors.js';
import { normalizeAwsSession } from '../normalizer/normalize-session.js';
import { SAMPLE_RAW_SESSIONS } from '../fixtures/sample-sessions.js';

export interface AwsEventsClientOptions {
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly baseBackoffMs?: number;
  readonly mockMode?: boolean;
  readonly mockSessions?: readonly RawAwsSession[];
}

export interface CatalogPageResult {
  readonly sessions: readonly SessionCandidate[];
  readonly nextCursor?: string;
  readonly totalCount?: number;
}

export class AwsEventsClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;
  private readonly mockMode: boolean;
  private readonly mockSessions: readonly RawAwsSession[];

  constructor(options: AwsEventsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://events.reinvent.aws.amazon.com/api';
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseBackoffMs = options.baseBackoffMs ?? 50; // default short backoff for tests
    this.mockMode = options.mockMode ?? false;
    this.mockSessions = options.mockSessions ?? SAMPLE_RAW_SESSIONS;
  }

  /**
   * Fetches a single page of sessions from the catalog.
   */
  public async fetchCatalogPage(params: CatalogQueryParams = {}): Promise<CatalogPageResult> {
    if (this.mockMode) {
      return this.mockFetchCatalogPage(params);
    }

    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.search) query.set('search', params.search);
    if (params.topic) query.set('topic', params.topic);
    if (params.level) query.set('level', params.level.toString());

    const url = `${this.baseUrl}/catalog?${query.toString()}`;
    const rawResponse = await this.requestWithRetry<RawAwsCatalogResponse>(url);

    const sessions = (rawResponse.data ?? []).map(normalizeAwsSession);
    return {
      sessions,
      nextCursor: rawResponse.next_cursor,
      totalCount: rawResponse.total_count,
    };
  }

  /**
   * Iterates through pages up to maxPages and returns all collected sessions.
   */
  public async fetchAllSessions(options: {
    maxPages?: number;
    params?: CatalogQueryParams;
  } = {}): Promise<readonly SessionCandidate[]> {
    const maxPages = options.maxPages ?? 10;
    const allSessions: SessionCandidate[] = [];
    let currentCursor = options.params?.cursor;
    let pagesFetched = 0;

    while (pagesFetched < maxPages) {
      const pageResult = await this.fetchCatalogPage({
        ...options.params,
        cursor: currentCursor,
      });

      allSessions.push(...pageResult.sessions);
      pagesFetched++;

      if (!pageResult.nextCursor) {
        break;
      }
      currentCursor = pageResult.nextCursor;
    }

    return allSessions;
  }

  /**
   * Fetches a single session by its session ID.
   */
  public async fetchSessionById(sessionId: string): Promise<SessionCandidate | null> {
    if (this.mockMode) {
      const found = this.mockSessions.find((s) => s.session_id === sessionId);
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

  private async requestWithRetry<T>(url: string): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          return (await response.json()) as T;
        }

        if (response.status === 404) {
          throw new AwsEventsNotFoundError(`Resource at ${url} not found`);
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
        (s) => s.title.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
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
      nextCursor,
      totalCount: filtered.length,
    };
  }
}
