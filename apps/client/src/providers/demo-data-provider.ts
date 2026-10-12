import type { SessionAvailability, SessionCandidate } from "@pathfinder/domain"
import {
  type FavoriteMutationResult,
  type ReservationMutationResult,
  type UserScheduleResult,
  SAMPLE_RAW_SESSIONS,
  SAMPLE_USER_SCHEDULE,
  normalizeAwsSession,
} from "@pathfinder/events-client"
import { SAMPLE_HEATMAP_AVAILABILITY } from "../fixtures/availability-heatmap.js"
import type {
  AvailabilityProvider,
  CatalogProvider,
  PathfinderDataProvider,
  ScheduleProvider,
} from "./types.js"

export class DemoCatalogProvider implements CatalogProvider {
  async getCatalog(): Promise<readonly SessionCandidate[]> {
    return SAMPLE_RAW_SESSIONS.map(normalizeAwsSession)
  }
}

export class DemoAvailabilityProvider implements AvailabilityProvider {
  async getAvailability(): Promise<readonly SessionAvailability[]> {
    return SAMPLE_HEATMAP_AVAILABILITY
  }
}

import type { UserScheduleItem } from "@pathfinder/events-client"

export class DemoScheduleProvider implements ScheduleProvider {
  private reservedIds = new Set<string>(["sess-aim-301"])
  private favoriteIds = new Set<string>(["sess-sec-305"])
  private items: UserScheduleItem[] = [...SAMPLE_USER_SCHEDULE]

  async getSchedule(): Promise<UserScheduleResult> {
    return {
      reservedSessionIds: Array.from(this.reservedIds),
      favoriteSessionIds: Array.from(this.favoriteIds),
      personalTime: [],
      lastSyncedAt: new Date().toISOString(),
      items: [...this.items],
    }
  }

  async toggleFavorite(
    sessionId: string,
    isFavorite: boolean,
  ): Promise<FavoriteMutationResult> {
    if (isFavorite) {
      this.favoriteIds.delete(sessionId)
    } else {
      this.favoriteIds.add(sessionId)
    }
    return {
      successfulSessionIds: [sessionId],
      failed: [],
    }
  }

  async toggleReservation(
    sessionId: string,
    isReserved: boolean,
  ): Promise<ReservationMutationResult> {
    if (isReserved) {
      this.reservedIds.delete(sessionId)
      this.items = this.items.filter(
        (item) => (item.session?.id ?? item.id) !== sessionId,
      )
    } else {
      this.reservedIds.add(sessionId)
      const alreadyInItems = this.items.some(
        (item) => (item.session?.id ?? item.id) === sessionId,
      )
      if (!alreadyInItems) {
        const raw = SAMPLE_RAW_SESSIONS.find(
          (s) => s.session_id === sessionId || s.sessionId === sessionId,
        )
        if (raw) {
          const norm = normalizeAwsSession(raw)
          this.items.push({
            id: `sched-demo-${sessionId}`,
            type: "reserved",
            session: norm,
            title: norm.title,
            day: norm.schedule?.day ?? "Monday",
            startTime: norm.schedule?.startTime ?? "09:00",
            endTime: norm.schedule?.endTime ?? "10:00",
            venue: norm.location?.venue,
            room: norm.location?.room,
          })
        }
      }
    }
    return {
      successfulSessionIds: [sessionId],
      failed: [],
    }
  }
}

export class DemoDataProvider implements PathfinderDataProvider {
  readonly catalog: CatalogProvider
  readonly availability: AvailabilityProvider
  readonly schedule: ScheduleProvider

  constructor() {
    this.catalog = new DemoCatalogProvider()
    this.availability = new DemoAvailabilityProvider()
    this.schedule = new DemoScheduleProvider()
  }
}
