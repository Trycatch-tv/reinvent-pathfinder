import type { ExperienceMode } from "@pathfinder/domain"
import type { AwsEventsClient } from "@pathfinder/events-client"
import { DemoDataProvider } from "./demo-data-provider.js"
import { LiveDataProvider } from "./live-data-provider.js"
import type { PathfinderDataProvider } from "./types.js"

export * from "./types.js"
export * from "./demo-data-provider.js"
export * from "./live-data-provider.js"

export function createPathfinderDataProvider(
  mode: ExperienceMode,
  options: {
    readonly liveEventsClient: AwsEventsClient | null
  },
): PathfinderDataProvider {
  if (mode === "demo") {
    return new DemoDataProvider()
  }
  return new LiveDataProvider(options.liveEventsClient)
}
