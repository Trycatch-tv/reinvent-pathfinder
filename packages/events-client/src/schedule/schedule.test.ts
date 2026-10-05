import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AwsEventsClient,
  AwsEventsUnauthorizedError,
  InMemoryTokenStore,
  evaluateScheduleConflicts,
  SAMPLE_USER_SCHEDULE,
} from '../index.js';
import type { SessionCandidate } from '@pathfinder/domain';
import type { RawAwsScheduleResponse } from '../types/user-schedule.js';

describe('User Personal Schedule, Favorites & Conflict Detection', () => {
  describe('AwsEventsClient - Personal Schedule & Favorites in Mock Mode', () => {
    it('retrieves personal schedule with realistic mock items', async () => {
      const client = new AwsEventsClient({ mockMode: true });
      const schedule = await client.getPersonalSchedule();

      expect(schedule.items.length).toBeGreaterThanOrEqual(4);
      expect(schedule.lastSyncedAt).toBeDefined();

      const reserved = schedule.items.filter((item) => item.type === 'reserved');
      expect(reserved.length).toBeGreaterThanOrEqual(2);
      expect(reserved[0]?.title).toContain('Building Autonomous Multi-Agent Systems');
    });

    it('retrieves favorites list in mock mode', async () => {
      const client = new AwsEventsClient({ mockMode: true });
      const favorites = await client.getFavorites();

      expect(favorites).toContain('sess-sec-305');
    });

    it('adds and removes a session from favorites dynamically in mock mode', async () => {
      const client = new AwsEventsClient({ mockMode: true });

      await client.addFavorite('sess-aim-301');
      let favorites = await client.getFavorites();
      expect(favorites).toContain('sess-aim-301');

      await client.removeFavorite('sess-aim-301');
      favorites = await client.getFavorites();
      expect(favorites).not.toContain('sess-aim-301');
    });
  });

  describe('AwsEventsClient - Personal Schedule & Favorites in Live Mode', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('throws AwsEventsUnauthorizedError when called without active access token', async () => {
      const client = new AwsEventsClient({
        mockMode: false,
        tokenStore: new InMemoryTokenStore(),
      });

      await expect(client.getPersonalSchedule()).rejects.toThrow(AwsEventsUnauthorizedError);
      await expect(client.addFavorite('sess-test')).rejects.toThrow(AwsEventsUnauthorizedError);
      await expect(client.removeFavorite('sess-test')).rejects.toThrow(AwsEventsUnauthorizedError);
    });

    it('fetches schedule via HTTP when active token is present in TokenStore', async () => {
      const tokenStore = new InMemoryTokenStore();
      tokenStore.setTokens({
        accessToken: 'valid-test-access-token',
        expiresIn: 3600,
      });

      const mockResponse: RawAwsScheduleResponse = {
        data: [
          {
            id: 'live-item-1',
            type: 'RESERVED',
            session_id: 'sess-live-100',
            title: 'Live Keynote Stream',
            start_time: '2026-12-01T09:00:00Z',
            end_time: '2026-12-01T10:30:00Z',
            day: '2026-12-01',
            venue: 'The Venetian',
            room: 'Hall A',
          },
        ],
        sync_time: '2026-12-01T09:00:00Z',
      };

      const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/user/schedule')) {
          expect(init?.headers).toMatchObject({
            Authorization: 'Bearer valid-test-access-token',
          });
          return Promise.resolve(
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }

        // Mock session details fetch
        return Promise.resolve(
          new Response(
            JSON.stringify({
              session_id: 'sess-live-100',
              title: 'Live Keynote Stream',
              start_time: '2026-12-01T09:00:00Z',
              end_time: '2026-12-01T10:30:00Z',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      });

      vi.stubGlobal('fetch', fetchMock);

      const client = new AwsEventsClient({
        mockMode: false,
        tokenStore,
      });

      const result = await client.getPersonalSchedule();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.id).toBe('live-item-1');
      expect(result.items[0]?.type).toBe('reserved');
      expect(result.items[0]?.title).toBe('Live Keynote Stream');
    });
  });

  describe('evaluateScheduleConflicts', () => {
    const overlappingCandidate: SessionCandidate = {
      id: 'proposed-sess-overlap',
      code: 'DEV301',
      title: 'Conflicting Agent Design Workshop',
      description: 'Hands-on agent building workshop.',
      level: 300,
      topics: ['Agents', 'Architecture'],
      format: 'workshop',
      schedule: {
        day: '2026-12-01',
        startTime: '10:30', // overlaps with sess-aim-301 (10:00 - 11:00)
        endTime: '11:15',
      },
      location: {
        venue: 'The Venetian',
        room: 'Palazzo Ballroom A',
      },
    };

    const nonOverlappingCandidate: SessionCandidate = {
      id: 'proposed-sess-clean',
      code: 'ARC302',
      title: 'Clean Evening Chalk Talk',
      description: 'Late afternoon chalk talk.',
      level: 300,
      topics: ['Microservices'],
      format: 'chalk-talk',
      schedule: {
        day: '2026-12-01',
        startTime: '16:00',
        endTime: '17:00',
      },
      location: {
        venue: 'The Venetian',
        room: 'Titian 2201',
      },
    };

    it('detects timing overlap with reserved schedule sessions', () => {
      const conflicts = evaluateScheduleConflicts(
        [overlappingCandidate, nonOverlappingCandidate],
        SAMPLE_USER_SCHEDULE
      );

      expect(conflicts.length).toBe(1);
      expect(conflicts[0]?.proposedSession.id).toBe('proposed-sess-overlap');
      expect(conflicts[0]?.scheduledItem.id).toBe('sched-item-1');
      expect(conflicts[0]?.conflict.overlapMinutes).toBe(30); // 10:30 to 11:00
      expect(conflicts[0]?.conflict.reason).toContain('overlap by 30 minutes');
    });

    it('detects overlap with personal time (lunch)', () => {
      const lunchConflictCandidate: SessionCandidate = {
        id: 'lunch-conflict-sess',
        code: 'NET101',
        title: 'Midday Networking Session',
        description: 'Session during lunch.',
        level: 100,
        topics: ['Cloud'],
        format: 'breakout',
        schedule: {
          day: '2026-12-01',
          startTime: '13:00',
          endTime: '14:00', // overlaps with lunch 12:30 - 14:00
        },
        location: {
          venue: 'The Venetian',
        },
      };

      const conflicts = evaluateScheduleConflicts([lunchConflictCandidate], SAMPLE_USER_SCHEDULE);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]?.scheduledItem.type).toBe('personal_time');
      expect(conflicts[0]?.conflict.overlapMinutes).toBe(60);
    });

    it('ignores favorites when includeFavorites is false (default)', () => {
      const favoriteOverlapCandidate: SessionCandidate = {
        id: 'fav-overlap-sess',
        code: 'SEC305-ALT',
        title: 'Alternative Security Session',
        description: 'Overlaps with favorite on Dec 2.',
        level: 300,
        topics: ['Security'],
        format: 'breakout',
        schedule: {
          day: '2026-12-02',
          startTime: '14:30',
          endTime: '15:30', // overlaps with favorite 14:00 - 15:00
        },
      };

      const withoutFavConflicts = evaluateScheduleConflicts(
        [favoriteOverlapCandidate],
        SAMPLE_USER_SCHEDULE,
        { includeFavorites: false }
      );
      expect(withoutFavConflicts.length).toBe(0);

      const withFavConflicts = evaluateScheduleConflicts(
        [favoriteOverlapCandidate],
        SAMPLE_USER_SCHEDULE,
        { includeFavorites: true }
      );
      expect(withFavConflicts.length).toBe(1);
      expect(withFavConflicts[0]?.scheduledItem.type).toBe('favorite');
    });

    it('returns empty array when candidate has no schedule or no overlaps occur', () => {
      const unscheduledCandidate: SessionCandidate = {
        id: 'no-sched-sess',
        code: 'TBD001',
        title: 'Unscheduled Session',
        description: 'No schedule info yet.',
        level: 100,
        topics: [],
        format: 'breakout',
      };

      const conflicts = evaluateScheduleConflicts(
        [unscheduledCandidate, nonOverlappingCandidate],
        SAMPLE_USER_SCHEDULE
      );
      expect(conflicts).toHaveLength(0);
    });
  });
});
