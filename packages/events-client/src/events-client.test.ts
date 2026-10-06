import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeAwsSession,
  AwsEventsClient,
  SAMPLE_RAW_SESSIONS,
  AwsEventsThrottlingError,
  AwsEventsNotFoundError,
  AwsEventsForbiddenError,
  AwsEventsUnauthorizedError,
  normalizeAwsAvailability,
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

    it('preserves the official level 500 for filtering', () => {
      const candidate = normalizeAwsSession({
        sessionId: 'sess-500',
        title: 'Expert session',
        level: 'Level 500',
      });

      expect(candidate.level).toBe(500);
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

    it('normalizes the official sessionTime date, time and length fields', () => {
      const candidate = normalizeAwsSession({
        sessionId: 'official-time-1',
        abbreviation: 'AIM401',
        title: 'Official timed session',
        sessionTime: { date: '2026-12-03', time: '23:30', length: '90', timezone: 'America/Los_Angeles' },
      });

      expect(candidate.schedule).toEqual({
        day: '2026-12-03',
        startTime: '23:30',
        endTime: '01:00',
      });
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

  describe('AWS Events ListSessions availability', () => {
    const officialSession: RawAwsSession = {
      sessionId: 'official-1',
      abbreviation: 'AIM401',
      title: 'Official session',
      type: 'Breakout session',
      sessionTime: { startTime: '2026-12-01T10:00:00Z', endTime: '2026-12-01T11:00:00Z' },
      isReservable: true,
      seatAvailability: 'veryLimited',
    };

    it.each([
      ['available', 'available'],
      ['limited', 'limited'],
      ['veryLimited', 'limited'],
      ['unavailable', 'unavailable'],
      ['walkUp', 'walk-up'],
      [undefined, 'unknown'],
      ['not-a-provider-value', 'unknown'],
    ] as const)('maps %s conservatively to %s', (seatAvailability, status) => {
      const availability = normalizeAwsAvailability({ ...officialSession, seatAvailability }, '2026-10-06T00:00:00.000Z');
      expect(availability).toMatchObject({ sessionId: 'official-1', status, isReservable: true, lastUpdatedAt: '2026-10-06T00:00:00.000Z' });
    });

    it('uses ListSessions pages until nextToken is absent, even when a page is short', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ items: [officialSession], totalCount: 2, nextToken: 'page-2' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...officialSession, sessionId: 'official-2', seatAvailability: 'walkUp' }], totalCount: 2 }), { status: 200 }));
      vi.stubGlobal('fetch', mockFetch);
      const client = new AwsEventsClient({ baseUrl: 'https://events.example/v1', eventId: 'evt/2026' });

      const snapshot = await client.fetchAvailabilitySnapshot();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0]?.[0]).toBe('https://events.example/v1/events/evt%2F2026/sessions');
      expect(mockFetch.mock.calls[1]?.[0]).toBe('https://events.example/v1/events/evt%2F2026/sessions?nextToken=page-2');
      expect(snapshot.sessions.map((session) => session.id)).toEqual(['official-1', 'official-2']);
      expect(snapshot.availability.map((item) => item.status)).toEqual(['limited', 'walk-up']);
      expect(new Set(snapshot.availability.map((item) => item.lastUpdatedAt))).toEqual(new Set([snapshot.observedAt]));
    });
  });

  describe('AWS Events attendee schedule and favorites', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('reads the official schedule without fetching each session', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        schedule: {
          reserved: ['reserved-1'],
          favorites: ['favorite-1', 'unknown-id'],
          personalTime: [{ personalTimeId: 'personal-1', startDateTime: '2026-12-01T12:00:00', endDateTime: '2026-12-01T13:00:00', title: 'Lunch', description: 'Team lunch' }],
        },
      }), { status: 200 }));
      vi.stubGlobal('fetch', mockFetch);
      const client = new AwsEventsClient({ baseUrl: 'https://events.example/v1', eventId: 'evt-1', tokenStore: { getAccessToken: () => 'token' } as never });

      const schedule = await client.getPersonalSchedule();

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch.mock.calls[0]?.[0]).toBe('https://events.example/v1/events/evt-1/schedule');
      expect(schedule.reservedSessionIds).toEqual(['reserved-1']);
      expect(schedule.favoriteSessionIds).toEqual(['favorite-1', 'unknown-id']);
      expect(schedule.personalTime[0]?.title).toBe('Lunch');
    });

    it('reports partial favorite results instead of assuming a 200 succeeded globally', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        result: { successful: ['favorite-1'], failed: [{ sessionId: 'favorite-2', code: 'OperationUnavailable' }] },
      }), { status: 200 }));
      vi.stubGlobal('fetch', mockFetch);
      const client = new AwsEventsClient({ baseUrl: 'https://events.example/v1', eventId: 'evt-1', tokenStore: { getAccessToken: () => 'token' } as never });

      const result = await client.addFavorite('favorite-1');

      expect(mockFetch.mock.calls[0]?.[0]).toBe('https://events.example/v1/events/evt-1/favorites');
      expect(mockFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ sessionIds: ['favorite-1'] }) });
      expect(result).toEqual({ successfulSessionIds: ['favorite-1'], failed: [{ sessionId: 'favorite-2', code: 'OperationUnavailable' }] });
    });

    it('does not retry a failed favorite removal', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('Not Found', { status: 404 }));
      vi.stubGlobal('fetch', mockFetch);
      const client = new AwsEventsClient({ baseUrl: 'https://events.example/v1', eventId: 'evt-1', tokenStore: { getAccessToken: () => 'token' } as never, maxRetries: 3 });

      await expect(client.removeFavorite('favorite-1')).rejects.toThrow(AwsEventsNotFoundError);
      expect(mockFetch).toHaveBeenCalledOnce();
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

    it.each([
      [401, AwsEventsUnauthorizedError],
      [403, AwsEventsForbiddenError],
      [429, AwsEventsThrottlingError],
    ])('exposes actionable error type for HTTP %i', async (status, ErrorType) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status, headers: { 'Retry-After': '0' } })));
      const client = new AwsEventsClient({ baseUrl: 'https://fake-events-api.aws/api', eventId: 'evt', maxRetries: 0 });
      await expect(client.fetchAvailabilitySnapshot()).rejects.toThrow(ErrorType);
    });
  });
});
