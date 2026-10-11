import {
  AwsEventsThrottlingError,
  AwsEventsUnauthorizedError,
  type AwsEventsClient,
} from "@pathfinder/events-client"
import { describe, expect, it, vi } from "vitest"
import {
  DemoDataProvider,
  LiveDataProvider,
  createPathfinderDataProvider,
} from "./index.js"

describe("Pathfinder Data Providers", () => {
  describe("DemoDataProvider", () => {
    it("returns offline fixture catalog and availability without remote calls", async () => {
      const provider = new DemoDataProvider()

      const catalog = await provider.catalog.getCatalog()
      expect(catalog.length).toBeGreaterThanOrEqual(12)
      expect(catalog[0]?.id).toBeDefined()

      const availability = await provider.availability.getAvailability()
      expect(availability.length).toBeGreaterThan(0)
      expect(availability.find((a) => a.sessionId === "sess-aim-301")?.status).toBe("available")
    })

    it("manages schedule, favorites and reservations in-memory", async () => {
      const provider = new DemoDataProvider()

      const initialSchedule = await provider.schedule.getSchedule()
      expect(initialSchedule.reservedSessionIds).toContain("sess-aim-301")
      expect(initialSchedule.favoriteSessionIds).toContain("sess-sec-305")

      // Add a favorite
      const addFavRes = await provider.schedule.toggleFavorite("sess-new-fav", false)
      expect(addFavRes.successfulSessionIds).toContain("sess-new-fav")

      const afterFav = await provider.schedule.getSchedule()
      expect(afterFav.favoriteSessionIds).toContain("sess-new-fav")

      // Remove the favorite
      await provider.schedule.toggleFavorite("sess-new-fav", true)
      const afterRemoveFav = await provider.schedule.getSchedule()
      expect(afterRemoveFav.favoriteSessionIds).not.toContain("sess-new-fav")

      // Add a reservation
      const addResRes = await provider.schedule.toggleReservation("sess-new-res", false)
      expect(addResRes.successfulSessionIds).toContain("sess-new-res")

      const afterRes = await provider.schedule.getSchedule()
      expect(afterRes.reservedSessionIds).toContain("sess-new-res")

      // Cancel the reservation
      await provider.schedule.toggleReservation("sess-new-res", true)
      const afterCancelRes = await provider.schedule.getSchedule()
      expect(afterCancelRes.reservedSessionIds).not.toContain("sess-new-res")
    })
  })

  describe("LiveDataProvider", () => {
    it("throws AwsEventsUnauthorizedError when AwsEventsClient is null", async () => {
      const provider = new LiveDataProvider(null)

      await expect(provider.catalog.getCatalog()).rejects.toThrow(
        AwsEventsUnauthorizedError,
      )
      await expect(provider.availability.getAvailability()).rejects.toThrow(
        AwsEventsUnauthorizedError,
      )
      await expect(provider.schedule.getSchedule()).rejects.toThrow(
        AwsEventsUnauthorizedError,
      )
      await expect(
        provider.schedule.toggleFavorite("sess-1", false),
      ).rejects.toThrow(AwsEventsUnauthorizedError)
      await expect(
        provider.schedule.toggleReservation("sess-1", false),
      ).rejects.toThrow(AwsEventsUnauthorizedError)
    })

    it("propagates errors from AwsEventsClient without falling back to demo fixtures", async () => {
      const mockClient = {
        fetchAvailabilitySnapshot: vi
          .fn()
          .mockRejectedValue(new AwsEventsThrottlingError("Rate limit exceeded")),
        getPersonalSchedule: vi.fn(),
        addFavorite: vi.fn(),
        removeFavorite: vi.fn(),
        reserveSession: vi.fn(),
        cancelReservation: vi.fn(),
      } as unknown as AwsEventsClient

      const provider = new LiveDataProvider(mockClient)

      await expect(provider.catalog.getCatalog()).rejects.toThrow(
        AwsEventsThrottlingError,
      )
      await expect(provider.availability.getAvailability()).rejects.toThrow(
        AwsEventsThrottlingError,
      )
    })

    it("delegates catalog, availability and mutations directly to AwsEventsClient", async () => {
      const mockSnapshot = {
        sessions: [
          {
            id: "sess-live-1",
            code: "LIVE100",
            title: "Live AWS Session",
            level: 200 as const,
            format: "breakout" as const,
            topics: ["cloud"],
          },
        ],
        availability: [
          {
            sessionId: "sess-live-1",
            status: "available" as const,
            isReservable: true,
            capacityRemaining: 100,
            lastUpdatedAt: "2026-10-11T00:00:00Z",
          },
        ],
        observedAt: "2026-10-11T00:00:00Z",
      }

      const mockSchedule = {
        reservedSessionIds: ["sess-live-1"],
        favoriteSessionIds: [],
        personalTime: [],
        lastSyncedAt: "2026-10-11T00:00:00Z",
        items: [],
      }

      const mockClient = {
        fetchAvailabilitySnapshot: vi.fn().mockResolvedValue(mockSnapshot),
        getPersonalSchedule: vi.fn().mockResolvedValue(mockSchedule),
        addFavorite: vi
          .fn()
          .mockResolvedValue({ successfulSessionIds: ["sess-live-1"], failed: [] }),
        removeFavorite: vi.fn().mockResolvedValue(undefined),
        reserveSession: vi
          .fn()
          .mockResolvedValue({ successfulSessionIds: ["sess-live-1"], failed: [] }),
        cancelReservation: vi.fn().mockResolvedValue(undefined),
      } as unknown as AwsEventsClient

      const provider = new LiveDataProvider(mockClient)

      const catalog = await provider.catalog.getCatalog()
      expect(catalog).toEqual(mockSnapshot.sessions)

      const availability = await provider.availability.getAvailability()
      expect(availability).toEqual(mockSnapshot.availability)

      const schedule = await provider.schedule.getSchedule()
      expect(schedule).toEqual(mockSchedule)

      await provider.schedule.toggleFavorite("sess-live-1", false)
      expect(mockClient.addFavorite).toHaveBeenCalledWith("sess-live-1")

      await provider.schedule.toggleFavorite("sess-live-1", true)
      expect(mockClient.removeFavorite).toHaveBeenCalledWith("sess-live-1")

      await provider.schedule.toggleReservation("sess-live-1", false)
      expect(mockClient.reserveSession).toHaveBeenCalledWith("sess-live-1")

      await provider.schedule.toggleReservation("sess-live-1", true)
      expect(mockClient.cancelReservation).toHaveBeenCalledWith("sess-live-1")
    })
  })

  describe("createPathfinderDataProvider factory", () => {
    it("creates DemoDataProvider for demo mode", () => {
      const provider = createPathfinderDataProvider("demo", {
        liveEventsClient: null,
      })
      expect(provider).toBeInstanceOf(DemoDataProvider)
    })

    it("creates LiveDataProvider for live mode", () => {
      const provider = createPathfinderDataProvider("live", {
        liveEventsClient: null,
      })
      expect(provider).toBeInstanceOf(LiveDataProvider)
    })
  })
})
