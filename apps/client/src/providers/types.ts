import type { SessionAvailability, SessionCandidate } from "@pathfinder/domain"
import type {
  FavoriteMutationResult,
  ReservationMutationResult,
  UserScheduleResult,
} from "@pathfinder/events-client"

export interface CatalogProvider {
  getCatalog(): Promise<readonly SessionCandidate[]>
}

export interface AvailabilityProvider {
  getAvailability(): Promise<readonly SessionAvailability[]>
}

export interface ScheduleProvider {
  getSchedule(): Promise<UserScheduleResult>
  toggleFavorite(
    sessionId: string,
    isFavorite: boolean,
  ): Promise<FavoriteMutationResult>
  toggleReservation(
    sessionId: string,
    isReserved: boolean,
  ): Promise<ReservationMutationResult>
}

export interface PathfinderDataProvider {
  readonly catalog: CatalogProvider
  readonly availability: AvailabilityProvider
  readonly schedule: ScheduleProvider
}
