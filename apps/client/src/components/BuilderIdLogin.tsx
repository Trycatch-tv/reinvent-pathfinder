import React, { useEffect, useState } from 'react'
import {
  completeBuilderIdCallback,
  initiateBuilderIdLogin,
  logoutBuilderId,
  type BuilderIdAuthClient,
  type TransactionStorage,
} from '../auth/builder-id-transaction.js'

export interface BuilderIdLoginProps {
  readonly client: BuilderIdAuthClient
  readonly authenticated: boolean
  readonly onAuthenticated: () => void
  readonly onLogout: () => void
}

function getSessionStorage(): TransactionStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function replaceCallbackUrl(): void {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/')
  }
}

export function BuilderIdLogin({
  client,
  authenticated,
  onAuthenticated,
  onLogout,
}: BuilderIdLoginProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const search = typeof window !== 'undefined' && window.location?.search ? window.location.search : ''
  const pathname = typeof window !== 'undefined' && window.location?.pathname ? window.location.pathname : ''
  const isCallback = pathname === '/callback' || (search.includes('code=') && search.includes('state='))

  useEffect(() => {
    if (!isCallback) return

    const storage = getSessionStorage()
    if (!storage) {
      setError('No fue posible completar el inicio de sesión. Inténtalo de nuevo.')
      replaceCallbackUrl()
      return
    }

    let active = true
    setIsWorking(true)
    void completeBuilderIdCallback(client, storage, new URLSearchParams(window.location.search))
      .then((result) => {
        if (!active) return
        if (result === 'authenticated') {
          onAuthenticated()
        } else {
          setError('No fue posible completar el inicio de sesión. Inténtalo de nuevo.')
        }
      })
      .finally(() => {
        if (active) setIsWorking(false)
        replaceCallbackUrl()
      })

    return () => { active = false }
  }, [client, isCallback, onAuthenticated])

  const handleLogin = async () => {
    const storage = getSessionStorage()
    if (!storage || typeof window === 'undefined') {
      setError('No fue posible iniciar sesión en este navegador.')
      return
    }

    setIsWorking(true)
    setError(null)
    try {
      const authorizationUrl = await initiateBuilderIdLogin(client, storage)
      window.location.assign(authorizationUrl)
    } catch {
      setError('No fue posible iniciar el inicio de sesión. Inténtalo de nuevo.')
      setIsWorking(false)
    }
  }

  const handleLogout = () => {
    const storage = getSessionStorage()
    if (storage) logoutBuilderId(client, storage)
    else client.logout()
    onLogout()
    setError(null)
  }

  if (isCallback) {
    return <p role={error ? 'alert' : 'status'}>{error ?? (isWorking ? 'Completando inicio de sesión…' : 'Preparando inicio de sesión…')}</p>
  }

  return (
    <section aria-label="Sesión de AWS Builder ID">
      {authenticated ? (
        <button type="button" onClick={handleLogout}>Cerrar sesión de AWS Builder ID</button>
      ) : (
        <button type="button" onClick={() => void handleLogin()} disabled={isWorking}>
          {isWorking ? 'Redirigiendo a AWS Builder ID…' : 'Iniciar sesión con AWS Builder ID'}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
