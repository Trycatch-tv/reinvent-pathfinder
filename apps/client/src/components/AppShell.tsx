import React from 'react'
import type { ExperienceMode } from '@pathfinder/domain'
import { colors, radii, shadows, spacing, typography } from '../theme/tokens.js'
import { Badge } from './ui/Badge.js'
import { Button } from './ui/Button.js'

export type JourneyStepId = 'context' | 'diagnosis' | 'path' | 'reflection' | 'report'

export interface AppShellProps {
  children?: React.ReactNode
  currentRoute: string
  onNavigate: (route: '/' | '/availability' | '/about' | '/callback') => void
  mode: ExperienceMode
  onSelectMode: (mode: ExperienceMode) => void
  isAuthenticated: boolean
  authSlot?: React.ReactNode
  activeStep?: JourneyStepId
}

const JOURNEY_STEPS: { id: JourneyStepId; label: string; icon: string }[] = [
  { id: 'context', label: '1. Contexto', icon: '🎯' },
  { id: 'diagnosis', label: '2. Diagnóstico', icon: '🔍' },
  { id: 'path', label: '3. Learning Path', icon: '🗺️' },
  { id: 'reflection', label: '4. Reflexión', icon: '💡' },
  { id: 'report', label: '5. Learning Report', icon: '📊' },
]

export function AppShell({
  children,
  currentRoute,
  onNavigate,
  mode,
  onSelectMode,
  isAuthenticated,
  authSlot,
  activeStep,
}: AppShellProps) {
  const isAboutRoute = currentRoute === '/about'
  const isAvailabilityRoute = currentRoute === '/availability'
  const isCallbackRoute = currentRoute === '/callback'
  const isHomeRoute = !isAboutRoute && !isAvailabilityRoute && !isCallbackRoute

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.neutral.slate100,
        fontFamily: typography.fontFamily,
        color: colors.neutral.slate900,
      }}
    >
      {/* Top Header / Navbar */}
      <header
        style={{
          backgroundColor: colors.brand.navyDark,
          color: colors.neutral.white,
          borderBottom: `3px solid ${colors.brand.orange}`,
          boxShadow: shadows.md,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: `${spacing.md} ${spacing.lg}`,
          }}
        >
          {/* Main Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spacing.md,
            }}
          >
            {/* Brand Logo & Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('/')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNavigate('/')
              }}
              aria-label="Ir al inicio de re:Invent Pathfinder"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: radii.md,
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  boxShadow: shadows.sm,
                }}
              >
                🧭
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      letterSpacing: '-0.02em',
                      color: colors.neutral.white,
                    }}
                  >
                    re:Invent Pathfinder
                  </h1>
                  <Badge variant="teal" style={{ fontSize: '0.7rem' }}>
                    v0.8
                  </Badge>
                </div>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    color: colors.neutral.slate400,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  AI companion que transforma el catálogo de AWS re:Invent en una ruta de aprendizaje adaptativa.
                </p>
              </div>
            </div>

            {/* Mode & Auth Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <Badge
                variant={mode === 'live' ? 'live' : 'demo'}
                withDot
                style={{
                  fontSize: typography.fontSize.xs,
                  padding: '4px 10px',
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {mode === 'live' ? '🔴 Modo Live' : '🧪 Modo Demo'}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectMode(mode === 'live' ? 'demo' : 'live')}
                style={{
                  color: colors.neutral.slate300,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                {`Cambiar a ${mode === 'live' ? 'Demo' : 'Live'}`}
              </Button>

              {authSlot}
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Navegación principal"
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: spacing.md,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: spacing.sm,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/')
              }}
              style={{
                background: isHomeRoute ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: isHomeRoute ? colors.neutral.white : colors.neutral.slate300,
                textDecoration: 'none',
                borderRadius: radii.sm,
                padding: '0.35rem 0.75rem',
                fontSize: typography.fontSize.sm,
                fontWeight: isHomeRoute
                  ? typography.fontWeight.bold
                  : typography.fontWeight.medium,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🏠</span>
              <span>Journey Pathfinder</span>
            </a>

            {!isAvailabilityRoute && (
              <a
                href="/availability"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('/availability')
                }}
                style={{
                  color: colors.neutral.slate300,
                  textDecoration: 'none',
                  borderRadius: radii.sm,
                  padding: '0.35rem 0.75rem',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🔥</span>
                <span>Ver disponibilidad de sesiones</span>
              </a>
            )}

            {!isAboutRoute && (
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('/about')
                }}
                style={{
                  color: colors.neutral.slate300,
                  textDecoration: 'none',
                  borderRadius: radii.sm,
                  padding: '0.35rem 0.75rem',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>ℹ️</span>
                <span>Qué es Pathfinder</span>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Journey Stages Progress Bar (Shown in Home route) */}
      {isHomeRoute && activeStep && (
        <div
          style={{
            backgroundColor: colors.neutral.white,
            borderBottom: `1px solid ${colors.neutral.slate200}`,
            padding: `${spacing.sm} ${spacing.lg}`,
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflowX: 'auto',
              gap: '1rem',
              paddingBottom: '2px',
            }}
          >
            {JOURNEY_STEPS.map((step, idx) => {
              const isActive = step.id === activeStep
              const stepIndex = JOURNEY_STEPS.findIndex((s) => s.id === step.id)
              const activeIndex = JOURNEY_STEPS.findIndex((s) => s.id === activeStep)
              const isPast = stepIndex < activeIndex

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive
                      ? typography.fontWeight.bold
                      : typography.fontWeight.medium,
                    color: isActive
                      ? colors.brand.orange
                      : isPast
                        ? colors.neutral.slate700
                        : colors.neutral.slate400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isActive
                        ? colors.brand.orange
                        : isPast
                          ? colors.semantic.success
                          : colors.neutral.slate200,
                      color: isActive || isPast ? colors.neutral.white : colors.neutral.slate600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span>{step.label}</span>
                  {idx < JOURNEY_STEPS.length - 1 && (
                    <span
                      style={{
                        color: colors.neutral.slate300,
                        marginLeft: '0.5rem',
                      }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: `${spacing.lg} ${spacing.lg}`,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>

      {/* Institutional Footer */}
      <footer
        style={{
          backgroundColor: colors.brand.navyDark,
          color: colors.neutral.slate400,
          borderTop: `1px solid ${colors.brand.navyBorder}`,
          padding: `${spacing.lg} ${spacing.lg}`,
          marginTop: 'auto',
          fontSize: typography.fontSize.xs,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <div>
            <strong style={{ color: colors.neutral.slate200 }}>
              re:Invent Pathfinder
            </strong>{' '}
            — AI companion adaptativo y trazable para AWS re:Invent.
            <div style={{ marginTop: '4px' }}>
              Modo activo:{' '}
              <span
                style={{
                  color: mode === 'live' ? colors.brand.orangeBright : colors.brand.blueBright,
                  fontWeight: 600,
                }}
              >
                {mode === 'live' ? 'Live (AWS Events + Bedrock)' : 'Demo (Local-First)'}
              </span>
              {' · '}
              Estado de sesión:{' '}
              <span style={{ color: isAuthenticated ? colors.semantic.success : colors.neutral.slate400 }}>
                {isAuthenticated ? 'Builder ID autenticado' : 'Sin autenticación'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/about')
              }}
              style={{
                color: colors.neutral.slate400,
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                textDecoration: 'underline',
              }}
            >
              Documentación
            </a>
            <a
              href="/availability"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/availability')
              }}
              style={{
                color: colors.neutral.slate400,
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                textDecoration: 'underline',
              }}
            >
              Catálogo & Disponibilidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
