import { randomBytes, createHash } from 'node:crypto';

export interface AuthorizationUrlOptions {
  readonly endpoint?: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope?: string;
  readonly codeChallenge: string;
  readonly codeChallengeMethod?: 'S256';
  readonly state: string;
}

/**
 * Base64URL encoding according to RFC 7636 / RFC 4648.
 * Replaces '+' with '-', '/' with '_', and strips '=' padding.
 */
function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates an unguessable high-entropy code verifier string (RFC 7636).
 * Length between 43 and 128 characters.
 */
export function generateCodeVerifier(byteLength = 48): string {
  const bytes = randomBytes(byteLength);
  return toBase64Url(bytes);
}

/**
 * Generates an S256 code challenge from a code verifier.
 * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier, 'ascii').digest();
  return toBase64Url(hash);
}

/**
 * Generates a cryptographically random state parameter for CSRF mitigation.
 */
export function generateState(byteLength = 24): string {
  return toBase64Url(randomBytes(byteLength));
}

/**
 * Constructs the standard OAuth 2.0 authorization URL for AWS Builder ID with PKCE.
 */
export function buildAuthorizationUrl(options: AuthorizationUrlOptions): string {
  const endpoint = options.endpoint ?? 'https://oidc.signin.aws/v1/authorize';
  const url = new URL(endpoint);

  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('scope', options.scope ?? 'openid email profile aws.events:read');
  url.searchParams.set('state', options.state);
  url.searchParams.set('code_challenge', options.codeChallenge);
  url.searchParams.set('code_challenge_method', options.codeChallengeMethod ?? 'S256');

  return url.toString();
}
