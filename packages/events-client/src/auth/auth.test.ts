import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  InMemoryTokenStore,
  AwsBuilderIdAuthClient,
  AwsEventsClient,
  AwsEventsError,
} from '../index.js';

describe('OAuth 2.0 + PKCE with AWS Builder ID', () => {
  describe('PKCE Cryptographic Utilities', () => {
    it('generates a valid RFC 7636 code verifier with base64url characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      // Valid Base64URL characters only (no +, /, or = padding)
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates an exact S256 code challenge matching the RFC 7636 test vector', () => {
      // RFC 7636 Appendix B test vector
      const testVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const challenge = generateCodeChallenge(testVerifier);
      expect(challenge).toBe(expectedChallenge);
    });

    it('generates a unique state parameter for CSRF mitigation', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
      expect(state1).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('builds an authorization URL with all required OAuth PKCE query parameters', () => {
      const urlString = buildAuthorizationUrl({
        clientId: 'test-client-123',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'openid aws.events:read',
        state: 'csrf-token-abc',
        codeChallenge: 'challenge-xyz',
      });

      const url = new URL(urlString);
      expect(url.origin).toBe('https://oidc.signin.aws');
      expect(url.pathname).toBe('/v1/authorize');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('test-client-123');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/callback');
      expect(url.searchParams.get('scope')).toBe('openid aws.events:read');
      expect(url.searchParams.get('state')).toBe('csrf-token-abc');
      expect(url.searchParams.get('code_challenge')).toBe('challenge-xyz');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });
  });

  describe('InMemoryTokenStore', () => {
    it('stores tokens in memory and retrieves unexpired access token', () => {
      const store = new InMemoryTokenStore();
      expect(store.getAccessToken()).toBeNull();
      expect(store.isExpired()).toBe(true);

      store.setTokens({
        accessToken: 'access-123',
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken: 'refresh-456',
        scope: 'aws.events:read',
      });

      expect(store.getAccessToken()).toBe('access-123');
      expect(store.hasRefreshToken()).toBe(true);
      expect(store.isExpired()).toBe(false);
      expect(store.getTokens()?.refreshToken).toBe('refresh-456');
    });

    it('detects expired tokens and ignores expired access token', () => {
      const store = new InMemoryTokenStore();
      // Token expiring in 10 seconds (less than default 60s skew)
      store.setTokens({
        accessToken: 'near-expiry-token',
        expiresIn: 10,
      });

      expect(store.isExpired()).toBe(true);
      expect(store.getAccessToken()).toBeNull();
    });

    it('clears all stored tokens completely on clear()', () => {
      const store = new InMemoryTokenStore();
      store.setTokens({
        accessToken: 'token-to-delete',
        expiresIn: 3600,
      });

      store.clear();
      expect(store.getAccessToken()).toBeNull();
      expect(store.getTokens()).toBeNull();
      expect(store.isExpired()).toBe(true);
    });
  });

  describe('AwsBuilderIdAuthClient', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('initiates auth and prepares code challenge, verifier, and authorization url', () => {
      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
      });

      const init = authClient.initiateAuth();
      expect(init.authorizationUrl).toContain('client_id=client-1');
      expect(init.authorizationUrl).toContain('code_challenge_method=S256');
      expect(init.verifier).toBeTruthy();
      expect(init.state).toBeTruthy();
    });

    it('rejects callback when state does not match (CSRF protection)', async () => {
      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
      });

      await expect(
        authClient.handleCallback({
          code: 'auth-code-123',
          state: 'mismatched-state',
          expectedState: 'expected-state',
          verifier: 'verifier-abc',
        })
      ).rejects.toThrow(AwsEventsError);
    });

    it('exchanges code for tokens in mock mode and saves to store', async () => {
      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
        mockMode: true,
      });

      const tokens = await authClient.handleCallback({
        code: 'mock-code',
        state: 'valid-state',
        expectedState: 'valid-state',
        verifier: 'valid-verifier',
      });

      expect(tokens.accessToken).toContain('mock-access-token');
      expect(authClient.getTokenStore().getAccessToken()).toBe(tokens.accessToken);
    });

    it('exchanges code for tokens via HTTP POST in standard mode', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'live-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'live-refresh-token',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', mockFetch);

      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
      });

      const tokens = await authClient.handleCallback({
        code: 'live-code-123',
        state: 'my-state',
        expectedState: 'my-state',
        verifier: 'my-verifier',
      });

      expect(tokens.accessToken).toBe('live-access-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify request payload
      const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe('https://oidc.signin.aws/v1/token');
      expect(calledInit.method).toBe('POST');
      expect(calledInit.body?.toString()).toContain('grant_type=authorization_code');
      expect(calledInit.body?.toString()).toContain('code_verifier=my-verifier');
    });

    it('refreshes token successfully and updates token store', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'renewed-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'new-refresh-token',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', mockFetch);

      const tokenStore = new InMemoryTokenStore();
      tokenStore.setTokens({
        accessToken: 'old-access-token',
        expiresIn: 3600,
        refreshToken: 'valid-refresh-token',
      });

      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
        tokenStore,
      });

      const refreshed = await authClient.refreshTokens();
      expect(refreshed.accessToken).toBe('renewed-access-token');
      expect(tokenStore.getAccessToken()).toBe('renewed-access-token');
    });

    it('clears token store on logout()', () => {
      const tokenStore = new InMemoryTokenStore();
      tokenStore.setTokens({ accessToken: 'active-token', expiresIn: 3600 });

      const authClient = new AwsBuilderIdAuthClient({
        clientId: 'client-1',
        redirectUri: 'http://localhost:8080/callback',
        tokenStore,
      });

      expect(authClient.getTokenStore().getAccessToken()).toBe('active-token');
      authClient.logout();
      expect(authClient.getTokenStore().getAccessToken()).toBeNull();
    });
  });

  describe('AwsEventsClient with TokenStore Integration', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('automatically injects Authorization Bearer header when tokenStore has active token', async () => {
      let capturedAuthHeader: string | null = null;
      const mockFetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>;
        capturedAuthHeader = headers?.['Authorization'] ?? null;

        return Promise.resolve(
          new Response(JSON.stringify({ data: [], next_cursor: undefined }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
      vi.stubGlobal('fetch', mockFetch);

      const tokenStore = new InMemoryTokenStore();
      tokenStore.setTokens({
        accessToken: 'builder-id-secret-token',
        expiresIn: 3600,
      });

      const eventsClient = new AwsEventsClient({
        baseUrl: 'https://fake-events-api.aws/api',
        tokenStore,
      });

      await eventsClient.fetchCatalogPage();
      expect(capturedAuthHeader).toBe('Bearer builder-id-secret-token');
    });
  });
});
