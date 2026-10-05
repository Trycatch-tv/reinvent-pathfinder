import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeAwsSession,
  AwsEventsClient,
  SAMPLE_RAW_SESSIONS,
  AwsEventsThrottlingError,
  type RawAwsSession,
} from './index.js';

describe('AWS Events Client & Normalizer', () => {
  describe('normalizeAwsSession', () => {
    it('normalizes a complete raw session into a SessionCandidate', () => {
      const raw: RawAwsSession = {
        session_id: 'sess-100',
        session_code: 'AIM301',
        title: '   Building Autonomous Agents with Bedrock   ',
        description: 'Deep dive into agent workflows.',
        level: 300,
        session_type: 'Breakout Session',
        topics: ['AI', 'Bedrock'],
        start_time: '2026-12-01T10:00:00Z',
        end_time: '2026-12-01T11:00:00Z',
        venue: 'Venetian',
        room: 'Palazzo E',
        capacity_remaining: 50,
      };

      const candidate = normalizeAwsSession(raw);

      expect(candidate.id).toBe('sess-100');
      expect(candidate.code).toBe('AIM301');
      expect(candidate.title).toBe('Building Autonomous Agents with Bedrock');
      expect(candidate.level).toBe(300);
      expect(candidate.format).toBe('breakout');
      expect(candidate.topics).toEqual(['AI', 'Bedrock']);
      expect(candidate.schedule?.day).toBe('2026-12-01');
      expect(candidate.location?.venue).toBe('Venetian');
      expect(candidate.location?.room).toBe('Palazzo E');
      expect(candidate.capacityRemaining).toBe(50);
    });

    it('parses string level representations like "Level 400" correctly', () => {
      const raw: RawAwsSession = {
        session_id: 'sess-400',
        title: 'Advanced Kernel Optimizations',
        level: 'Level 400',
        session_type: 'Chalk Talk',
      };

      const candidate = normalizeAwsSession(raw);
      expect(candidate.level).toBe(400);
      expect(candidate.format).toBe('chalk-talk');
    });

    it('gracefully handles missing optional fields', () => {
      const minimalRaw: RawAwsSession = {
        session_id: 'min-1',
        title: 'Minimal Session',
      };

      const candidate = normalizeAwsSession(minimalRaw);
      expect(candidate.id).toBe('min-1');
      expect(candidate.code).toBe('min-1'); // Fallback to id
      expect(candidate.description).toBe('');
      expect(candidate.level).toBe(200); // Default level
      expect(candidate.format).toBe('other');
      expect(candidate.topics).toEqual([]);
      expect(candidate.schedule).toBeUndefined();
      expect(candidate.location).toBeUndefined();
    });
  });

  describe('AwsEventsClient (Offline / Mock Mode)', () => {
    const client = new AwsEventsClient({ mockMode: true });

    it('paginates correctly using cursor and limit', async () => {
      const page1 = await client.fetchCatalogPage({ limit: 2 });
      expect(page1.sessions).toHaveLength(2);
      expect(page1.nextCursor).toBe('2');
      expect(page1.totalCount).toBe(SAMPLE_RAW_SESSIONS.length);

      const page2 = await client.fetchCatalogPage({ limit: 2, cursor: page1.nextCursor });
      expect(page2.sessions).toHaveLength(2);
      expect(page2.nextCursor).toBeUndefined();
    });

    it('fetches all sessions across multiple pages with fetchAllSessions', async () => {
      const all = await client.fetchAllSessions({ params: { limit: 2 } });
      expect(all).toHaveLength(SAMPLE_RAW_SESSIONS.length);
      expect(all[0]?.code).toBe('AIM301');
    });

    it('fetches a single session by ID and returns null for unknown session', async () => {
      const session = await client.fetchSessionById('sess-aim-301');
      expect(session).not.toBeNull();
      expect(session?.title).toContain('Autonomous Multi-Agent Systems');

      const missing = await client.fetchSessionById('non-existent-id');
      expect(missing).toBeNull();
    });

    it('filters sessions by search keyword', async () => {
      const result = await client.fetchCatalogPage({ search: 'dynamodb' });
      expect(result.sessions.length).toBeGreaterThanOrEqual(1);
      expect(result.sessions[0]?.title).toContain('DynamoDB');
    });
  });

  describe('AwsEventsClient Resilience & HTTP Retries', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('retries on HTTP 429 throttling and succeeds on subsequent attempt', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(new Response('Rate Limited', {
            status: 429,
            headers: { 'Retry-After': '0' },
          }));
        }
        return Promise.resolve(new Response(JSON.stringify({
          data: [SAMPLE_RAW_SESSIONS[0]],
          next_cursor: undefined,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new AwsEventsClient({
        baseUrl: 'https://fake-events-api.aws/api',
        maxRetries: 2,
        baseBackoffMs: 5,
      });

      const page = await client.fetchCatalogPage({ limit: 1 });
      expect(callCount).toBe(2);
      expect(page.sessions).toHaveLength(1);
      expect(page.sessions[0]?.code).toBe('AIM301');
    });

    it('throws AwsEventsThrottlingError when max retries are exhausted on 429', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('Rate Limited', {
        status: 429,
        headers: { 'Retry-After': '0' },
      }));
      vi.stubGlobal('fetch', mockFetch);

      const client = new AwsEventsClient({
        baseUrl: 'https://fake-events-api.aws/api',
        maxRetries: 2,
        baseBackoffMs: 5,
      });

      await expect(client.fetchCatalogPage()).rejects.toThrow(AwsEventsThrottlingError);
    });

    it('returns null on fetchSessionById when 404 is returned', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('Not Found', {
        status: 404,
      }));
      vi.stubGlobal('fetch', mockFetch);

      const client = new AwsEventsClient({
        baseUrl: 'https://fake-events-api.aws/api',
        maxRetries: 1,
      });

      const result = await client.fetchSessionById('missing-404');
      expect(result).toBeNull();
    });
  });
});
