import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
} from './pkce.js';
import { InMemoryTokenStore, type TokenStore, type AuthTokens } from './token-store.js';
import { AwsEventsError } from '../types/errors.js';

export interface AwsBuilderIdAuthClientOptions {
  readonly tokenEndpoint?: string;
  readonly authorizationEndpoint?: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly defaultScope?: string;
  readonly mockMode?: boolean;
  readonly tokenStore?: TokenStore;
}

export interface InitiateAuthResult {
  readonly authorizationUrl: string;
  readonly verifier: string;
  readonly state: string;
}

export interface HandleCallbackParams {
  readonly code: string;
  readonly state: string;
  readonly expectedState: string;
  readonly verifier: string;
}

interface RawTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export class AwsBuilderIdAuthClient {
  private readonly tokenEndpoint: string;
  private readonly authorizationEndpoint?: string;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly defaultScope: string;
  private readonly mockMode: boolean;
  private readonly tokenStore: TokenStore;

  constructor(options: AwsBuilderIdAuthClientOptions) {
    this.tokenEndpoint = options.tokenEndpoint ?? 'https://oidc.signin.aws/v1/token';
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.defaultScope = options.defaultScope ?? 'openid email profile aws.events:read';
    this.mockMode = options.mockMode ?? false;
    this.tokenStore = options.tokenStore ?? new InMemoryTokenStore();
  }

  /**
   * Generates PKCE parameters and returns the authorization URL to redirect the user.
   */
  public initiateAuth(scope?: string): InitiateAuthResult {
    const verifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(verifier);
    const state = generateState();

    const authorizationUrl = buildAuthorizationUrl({
      ...(this.authorizationEndpoint ? { endpoint: this.authorizationEndpoint } : {}),
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scope: scope ?? this.defaultScope,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    });

    return {
      authorizationUrl,
      verifier,
      state,
    };
  }

  /**
   * Validates the state parameter and exchanges the authorization code for tokens.
   */
  public async handleCallback(params: HandleCallbackParams): Promise<AuthTokens> {
    if (!params.state || params.state !== params.expectedState) {
      throw new AwsEventsError('Invalid state parameter: possible CSRF attempt detected', 400);
    }

    if (this.mockMode) {
      const mockTokens = {
        accessToken: `mock-access-token-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        scope: this.defaultScope,
      };
      this.tokenStore.setTokens(mockTokens);
      const saved = this.tokenStore.getTokens();
      if (!saved) throw new Error('Failed to retrieve mock tokens');
      return saved;
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code: params.code,
      code_verifier: params.verifier,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as RawTokenResponse;
      const desc = errBody.error_description ?? errBody.error ?? `HTTP ${response.status}`;
      throw new AwsEventsError(`Token exchange failed: ${desc}`, response.status);
    }

    const data = (await response.json()) as RawTokenResponse;
    this.tokenStore.setTokens({
      accessToken: data.access_token,
      tokenType: data.token_type ?? 'Bearer',
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scope: data.scope,
    });

    const tokens = this.tokenStore.getTokens();
    if (!tokens) {
      throw new AwsEventsError('Failed to store exchanged tokens in memory');
    }
    return tokens;
  }

  /**
   * Refreshes the access token using the stored or provided refresh token.
   */
  public async refreshTokens(customRefreshToken?: string): Promise<AuthTokens> {
    const refreshToken = customRefreshToken ?? this.tokenStore.getTokens()?.refreshToken;
    if (!refreshToken) {
      throw new AwsEventsError('No refresh token available to refresh session');
    }

    if (this.mockMode) {
      const mockTokens = {
        accessToken: `refreshed-mock-access-token-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken,
        scope: this.defaultScope,
      };
      this.tokenStore.setTokens(mockTokens);
      const saved = this.tokenStore.getTokens();
      if (!saved) throw new Error('Failed to retrieve refreshed mock tokens');
      return saved;
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as RawTokenResponse;
      const desc = errBody.error_description ?? errBody.error ?? `HTTP ${response.status}`;
      throw new AwsEventsError(`Token refresh failed: ${desc}`, response.status);
    }

    const data = (await response.json()) as RawTokenResponse;
    this.tokenStore.setTokens({
      accessToken: data.access_token,
      tokenType: data.token_type ?? 'Bearer',
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token ?? refreshToken,
      scope: data.scope,
    });

    const tokens = this.tokenStore.getTokens();
    if (!tokens) {
      throw new AwsEventsError('Failed to store refreshed tokens in memory');
    }
    return tokens;
  }

  public getTokenStore(): TokenStore {
    return this.tokenStore;
  }

  public logout(): void {
    this.tokenStore.clear();
  }
}
