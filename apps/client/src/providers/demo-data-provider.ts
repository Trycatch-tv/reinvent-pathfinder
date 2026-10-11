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

export class DemoScheduleProvider implements ScheduleProvider {
  private reservedIds = new Set<string>(["sess-aim-301"])
  private favoriteIds = new Set<string>(["sess-sec-305"])

  async getSchedule(): Promise<UserScheduleResult> {
    return {
      reservedSessionIds: Array.from(this.reservedIds),
      favoriteSessionIds: Array.from(this.favoriteIds),
      personalTime: [],
      lastSyncedAt: new Date().toISOString(),
      items: SAMPLE_USER_SCHEDULE,
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
    } else {
      this.reservedIds.add(sessionId)
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
