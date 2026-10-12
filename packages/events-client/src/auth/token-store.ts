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

/**
 * Persistent localStorage implementation of TokenStore.
 * Persists session tokens across page reloads and browser restarts.
 */
export class LocalStorageTokenStore implements TokenStore {
  private readonly storageKey: string;
  private readonly memoryFallback = new InMemoryTokenStore();

  constructor(storageKey = 'pathfinder_builder_id_tokens') {
    this.storageKey = storageKey;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  public getAccessToken(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return this.memoryFallback.getAccessToken();
    }
    const tokens = this.getTokens();
    if (!tokens || this.isExpired()) {
      return null;
    }
    return tokens.accessToken;
  }

  public getTokens(): AuthTokens | null {
    if (!this.isLocalStorageAvailable()) {
      return this.memoryFallback.getTokens();
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as AuthTokens;
    } catch {
      return null;
    }
  }

  public setTokens(input: SetTokensInput): void {
    const expiresAt = Date.now() + input.expiresIn * 1000;
    const tokens: AuthTokens = {
      accessToken: input.accessToken,
      tokenType: input.tokenType ?? 'Bearer',
      expiresIn: input.expiresIn,
      ...(input.refreshToken ? { refreshToken: input.refreshToken } : {}),
      ...(input.scope ? { scope: input.scope } : {}),
      expiresAt,
    };

    if (!this.isLocalStorageAvailable()) {
      this.memoryFallback.setTokens(input);
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(tokens));
    } catch {
      this.memoryFallback.setTokens(input);
    }
  }

  public isExpired(skewSeconds = 60): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;
    return Date.now() >= tokens.expiresAt - skewSeconds * 1000;
  }

  public hasRefreshToken(): boolean {
    const tokens = this.getTokens();
    return Boolean(tokens?.refreshToken);
  }

  public clear(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(this.storageKey);
      } catch {
        // ignore
      }
    }
    this.memoryFallback.clear();
  }
}

/**
 * Ephemeral sessionStorage implementation of TokenStore.
 * Restricts token lifetime to the active browser tab session, eliminating persistent disk storage.
 */
export class SessionStorageTokenStore implements TokenStore {
  private readonly storageKey: string;
  private readonly memoryFallback = new InMemoryTokenStore();

  constructor(storageKey = 'pathfinder_builder_id_session_tokens') {
    this.storageKey = storageKey;
  }

  private isSessionStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  public getAccessToken(): string | null {
    if (!this.isSessionStorageAvailable()) {
      return this.memoryFallback.getAccessToken();
    }
    const tokens = this.getTokens();
    if (!tokens || this.isExpired()) {
      return null;
    }
    return tokens.accessToken;
  }

  public getTokens(): AuthTokens | null {
    if (!this.isSessionStorageAvailable()) {
      return this.memoryFallback.getTokens();
    }
    try {
      const raw = window.sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as AuthTokens;
    } catch {
      return null;
    }
  }

  public setTokens(input: SetTokensInput): void {
    const expiresAt = Date.now() + input.expiresIn * 1000;
    const tokens: AuthTokens = {
      accessToken: input.accessToken,
      tokenType: input.tokenType ?? 'Bearer',
      expiresIn: input.expiresIn,
      ...(input.refreshToken ? { refreshToken: input.refreshToken } : {}),
      ...(input.scope ? { scope: input.scope } : {}),
      expiresAt,
    };

    if (!this.isSessionStorageAvailable()) {
      this.memoryFallback.setTokens(input);
      return;
    }

    try {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify(tokens));
    } catch {
      this.memoryFallback.setTokens(input);
    }
  }

  public isExpired(skewSeconds = 60): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;
    return Date.now() >= tokens.expiresAt - skewSeconds * 1000;
  }

  public hasRefreshToken(): boolean {
    const tokens = this.getTokens();
    return Boolean(tokens?.refreshToken);
  }

  public clear(): void {
    if (this.isSessionStorageAvailable()) {
      try {
        window.sessionStorage.removeItem(this.storageKey);
      } catch {
        // ignore
      }
    }
    this.memoryFallback.clear();
  }
}


