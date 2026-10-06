// PKCE utilities (RFC 7636) implemented with the Web Crypto API so the OAuth
// flow runs natively in the browser (callback local) AND in Node 20+ — without
// importing node:crypto, which breaks Vite browser bundles.

export interface AuthorizationUrlOptions {
  readonly endpoint?: string
  readonly clientId: string
  readonly redirectUri: string
  readonly scope?: string
  readonly codeChallenge: string
  readonly codeChallengeMethod?: "S256"
  readonly state: string
}

/**
 * Base64URL encoding (RFC 7636 / RFC 4648): '+' -> '-', '/' -> '_', strip '='.
 * Web-native: avoids Node's Buffer.
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Generates an unguessable high-entropy code verifier string (RFC 7636).
 * Length between 43 and 128 characters.
 */
export function generateCodeVerifier(byteLength = 48): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/**
 * Generates an S256 code challenge from a code verifier.
 * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 *
 * Async because Web Crypto `subtle.digest` returns a Promise.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return toBase64Url(new Uint8Array(digest))
}

/**
 * Generates a cryptographically random state parameter for CSRF mitigation.
 */
export function generateState(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/**
 * Constructs the standard OAuth 2.0 authorization URL for AWS Builder ID with PKCE.
 * Endpoints and scopes aligned with official AWS Events API Developer Guide.
 */
export function buildAuthorizationUrl(
  options: AuthorizationUrlOptions,
): string {
  const endpoint =
    options.endpoint ?? "https://oauth.awsevents.com/oauth2/authorize"
  const url = new URL(endpoint)

  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", options.clientId)
  url.searchParams.set("redirect_uri", options.redirectUri)
  url.searchParams.set("scope", options.scope ?? "openid email events/access")
  url.searchParams.set("state", options.state)
  url.searchParams.set("code_challenge", options.codeChallenge)
  url.searchParams.set(
    "code_challenge_method",
    options.codeChallengeMethod ?? "S256",
  )

  return url.toString()
}
