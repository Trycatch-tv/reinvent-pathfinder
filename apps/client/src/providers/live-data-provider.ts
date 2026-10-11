import type { SessionAvailability, SessionCandidate } from "@pathfinder/domain"
import {
  type AwsEventsClient,
  type FavoriteMutationResult,
  type ReservationMutationResult,
  type UserScheduleResult,
  AwsEventsUnauthorizedError,
} from "@pathfinder/events-client"
import type {
  AvailabilityProvider,
  CatalogProvider,
  PathfinderDataProvider,
  ScheduleProvider,
} from "./types.js"

export class LiveCatalogProvider implements CatalogProvider {
  constructor(private readonly client: AwsEventsClient | null) {}

  async getCatalog(): Promise<readonly SessionCandidate[]> {
    if (!this.client) {
      throw new AwsEventsUnauthorizedError(
        "AwsEventsClient is not configured for Live mode.",
      )
    }
    const snapshot = await this.client.fetchAvailabilitySnapshot()
    return snapshot.sessions
  }
}

export class LiveAvailabilityProvider implements AvailabilityProvider {
  constructor(private readonly client: AwsEventsClient | null) {}

  async getAvailability(): Promise<readonly SessionAvailability[]> {
    if (!this.client) {
      throw new AwsEventsUnauthorizedError(
        "AwsEventsClient is not configured for Live mode.",
      )
    }
    const snapshot = await this.client.fetchAvailabilitySnapshot()
    return snapshot.availability
  }
}

export class LiveScheduleProvider implements ScheduleProvider {
  constructor(private readonly client: AwsEventsClient | null) {}

  async getSchedule(): Promise<UserScheduleResult> {
    if (!this.client) {
      throw new AwsEventsUnauthorizedError(
        "AwsEventsClient is not configured for Live mode.",
      )
    }
    return this.client.getPersonalSchedule()
  }

  async toggleFavorite(
    sessionId: string,
    isFavorite: boolean,
  ): Promise<FavoriteMutationResult> {
    if (!this.client) {
      throw new AwsEventsUnauthorizedError(
        "AwsEventsClient is not configured for Live mode.",
      )
    }
    if (isFavorite) {
      await this.client.removeFavorite(sessionId)
      return { successfulSessionIds: [sessionId], failed: [] }
    }
    return this.client.addFavorite(sessionId)
  }

  async toggleReservation(
    sessionId: string,
    isReserved: boolean,
  ): Promise<ReservationMutationResult> {
    if (!this.client) {
      throw new AwsEventsUnauthorizedError(
        "AwsEventsClient is not configured for Live mode.",
      )
    }
    if (isReserved) {
      await this.client.cancelReservation(sessionId)
      return { successfulSessionIds: [sessionId], failed: [] }
    }
    return this.client.reserveSession(sessionId)
  }
}

export class LiveDataProvider implements PathfinderDataProvider {
  readonly catalog: CatalogProvider
  readonly availability: AvailabilityProvider
  readonly schedule: ScheduleProvider

  constructor(client: AwsEventsClient | null) {
    this.catalog = new LiveCatalogProvider(client)
    this.availability = new LiveAvailabilityProvider(client)
    this.schedule = new LiveScheduleProvider(client)
  }
}
