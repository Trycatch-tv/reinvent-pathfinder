export interface AuthTokens {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly refreshToken?: string;
  readonly scope?: string;
  readonly expiresAt: number; // Unix timestamp in milliseconds
}

export interface SetTokensInput {
  readonly accessToken: string;
  readonly tokenType?: string;
  readonly expiresIn: number; // Seconds until expiration
  readonly refreshToken?: string;
  readonly scope?: string;
}

export interface TokenStore {
  getAccessToken(): string | null;
  getTokens(): AuthTokens | null;
  setTokens(tokens: SetTokensInput): void;
  isExpired(skewSeconds?: number): boolean;
  hasRefreshToken(): boolean;
  clear(): void;
}

/**
 * Ephemeral in-memory implementation of TokenStore.
 * Ensures access and refresh tokens exist ONLY in RAM and are never written to disk/localStorage.
 */
export class InMemoryTokenStore implements TokenStore {
  private currentTokens: AuthTokens | null = null;

  public getAccessToken(): string | null {
    if (!this.currentTokens || this.isExpired()) {
      return null;
    }
    return this.currentTokens.accessToken;
  }

  public getTokens(): AuthTokens | null {
    return this.currentTokens ? { ...this.currentTokens } : null;
  }

  public setTokens(input: SetTokensInput): void {
    const expiresAt = Date.now() + input.expiresIn * 1000;
    this.currentTokens = {
      accessToken: input.accessToken,
      tokenType: input.tokenType ?? 'Bearer',
      expiresIn: input.expiresIn,
      ...(input.refreshToken ? { refreshToken: input.refreshToken } : {}),
      ...(input.scope ? { scope: input.scope } : {}),
      expiresAt,
    };
  }

  public isExpired(skewSeconds = 60): boolean {
    if (!this.currentTokens) {
      return true;
    }
    // Returns true if expiring within skewSeconds
    return Date.now() >= this.currentTokens.expiresAt - skewSeconds * 1000;
  }

  public hasRefreshToken(): boolean {
    return Boolean(this.currentTokens?.refreshToken);
  }

  public clear(): void {
    this.currentTokens = null;
  }
}
