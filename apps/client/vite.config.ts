import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import {
  BedrockContextAnalyzer,
  BedrockSessionReranker,
} from "@pathfinder/ai-knowledge"
import { SAMPLE_RAW_SESSIONS } from "@pathfinder/events-client"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootEnvPath = path.resolve(__dirname, "../../.env")

if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const liveMockSchedule = {
  reserved: new Set<string>(["sess-aim-301"]),
  favorites: new Set<string>(["sess-sec-305"]),
  personalTime: [
    {
      personalTimeId: "pt-1",
      startDateTime: "2026-12-01T12:30:00Z",
      endDateTime: "2026-12-01T14:00:00Z",
      title: "Lunch & Peer Networking at Venetian Hall",
      description: "The Venetian Dining Hall A",
    },
  ],
}

function aiBackendPlugin(): Plugin {
  return {
    name: "ai-backend-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "POST" && req.url === "/api/analyze") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk
          })
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body)
              const analyzer = new BedrockContextAnalyzer()
              const result = await analyzer.analyze(parsed)
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify(result))
            } catch (err: unknown) {
              res.statusCode = 500
              res.setHeader("Content-Type", "application/json")
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              )
            }
          })
          return
        }

        if (req.method === "POST" && req.url === "/api/recommendations/rank") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk
          })
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body)
              const reranker = new BedrockSessionReranker()
              const result = await reranker.rank(parsed)
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify(result))
            } catch (err: unknown) {
              res.statusCode = 500
              res.setHeader("Content-Type", "application/json")
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                }),
              )
            }
          })
          return
        }

        // Rutas exclusivas de AWS Events API (deben comenzar con /aws-events/v1/)
        if (req.url?.startsWith("/aws-events/v1/")) {
          const apiPath = req.url.slice("/aws-events/v1/".length)

          if (req.method === "GET" && apiPath.includes("sessions")) {
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                items: SAMPLE_RAW_SESSIONS,
                totalCount: SAMPLE_RAW_SESSIONS.length,
              }),
            )
            return
          }

          if (req.method === "GET" && apiPath.includes("schedule")) {
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                schedule: {
                  reserved: Array.from(liveMockSchedule.reserved),
                  favorites: Array.from(liveMockSchedule.favorites),
                  personalTime: liveMockSchedule.personalTime,
                },
              }),
            )
            return
          }

          if (
            req.method === "POST" &&
            (apiPath.includes("reservations") || apiPath.includes("favorites"))
          ) {
            let body = ""
            req.on("data", (chunk) => {
              body += chunk
            })
            req.on("end", () => {
              try {
                const parsed = JSON.parse(body || "{}")
                const sessionIds: string[] = parsed.sessionIds || []
                if (apiPath.includes("reservations")) {
                  sessionIds.forEach((id) => liveMockSchedule.reserved.add(id))
                } else {
                  sessionIds.forEach((id) => liveMockSchedule.favorites.add(id))
                }
                res.setHeader("Content-Type", "application/json")
                res.end(
                  JSON.stringify({
                    result: {
                      successful: sessionIds,
                      failed: [],
                    },
                  }),
                )
              } catch {
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify({ result: { successful: [], failed: [] } }))
              }
            })
            return
          }

          if (
            req.method === "DELETE" &&
            (apiPath.includes("reservations") || apiPath.includes("favorites"))
          ) {
            const parts = apiPath.split("/")
            const sessionId = decodeURIComponent(parts[parts.length - 1] || "")
            if (apiPath.includes("reservations")) {
              liveMockSchedule.reserved.delete(sessionId)
            } else {
              liveMockSchedule.favorites.delete(sessionId)
            }
            res.statusCode = 204
            res.end()
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), aiBackendPlugin()],
  server: {
    port: 8484,
    strictPort: true,
  },
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
})
