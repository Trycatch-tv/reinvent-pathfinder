import type {
  AwsBuilderIdAuthClient,
  HandleCallbackParams,
  InitiateAuthResult,
} from '@pathfinder/events-client'

const STATE_KEY = 'pathfinder.builder-id.state'
const VERIFIER_KEY = 'pathfinder.builder-id.verifier'

export interface TransactionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface BuilderIdTransaction {
  readonly state: string
  readonly verifier: string
}

export type AuthCallbackResult = 'authenticated' | 'invalid-callback'

export type BuilderIdAuthClient = Pick<
  AwsBuilderIdAuthClient,
  'initiateAuth' | 'handleCallback' | 'logout'
>

export function saveBuilderIdTransaction(
  storage: TransactionStorage,
  transaction: BuilderIdTransaction,
): void {
  storage.setItem(STATE_KEY, transaction.state)
  storage.setItem(VERIFIER_KEY, transaction.verifier)
}

/** Reads and removes the one-time PKCE transaction before exchanging a code. */
export function consumeBuilderIdTransaction(
  storage: TransactionStorage,
): BuilderIdTransaction | null {
  const state = storage.getItem(STATE_KEY)
  const verifier = storage.getItem(VERIFIER_KEY)
  clearBuilderIdTransaction(storage)

  return state && verifier ? { state, verifier } : null
}

export function clearBuilderIdTransaction(storage: TransactionStorage): void {
  storage.removeItem(STATE_KEY)
  storage.removeItem(VERIFIER_KEY)
}

export async function initiateBuilderIdLogin(
  client: BuilderIdAuthClient,
  storage: TransactionStorage,
): Promise<string> {
  const result: InitiateAuthResult = await client.initiateAuth()
  saveBuilderIdTransaction(storage, result)
  return result.authorizationUrl
}

export async function completeBuilderIdCallback(
  client: BuilderIdAuthClient,
  storage: TransactionStorage,
  params: URLSearchParams,
): Promise<AuthCallbackResult> {
  const code = params.get('code')
  const state = params.get('state')
  const transaction = consumeBuilderIdTransaction(storage)

  if (params.has('error') || !code || !state || !transaction) {
    return 'invalid-callback'
  }

  const callbackParams: HandleCallbackParams = {
    code,
    state,
    expectedState: transaction.state,
    verifier: transaction.verifier,
  }

  try {
    await client.handleCallback(callbackParams)
    return 'authenticated'
  } catch {
    return 'invalid-callback'
  }
}

export function logoutBuilderId(
  client: BuilderIdAuthClient,
  storage: TransactionStorage,
): void {
  client.logout()
  clearBuilderIdTransaction(storage)
}
