import React from 'react'
import type { ExperienceMode } from '@pathfinder/domain'
import { Terminal, Cloud, ArrowRight, ShieldCheck } from 'lucide-react'
import { colors, radii, shadows, spacing, typography } from '../theme/tokens.js'
import { Button } from './ui/Button.js'
import { Badge } from './ui/Badge.js'

export interface ModeSelectorProps {
  readonly currentMode: ExperienceMode | null
  readonly onSelectMode: (mode: ExperienceMode) => void
  readonly isAuthenticated: boolean
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  isAuthenticated,
}) => {
  return (
    <section
      aria-label="Selección de modo de experiencia"
      style={{
        backgroundColor: colors.neutral.white,
        border: `1px solid ${colors.neutral.slate200}`,
        borderRadius: radii.xl,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: shadows.sm,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 1.5rem auto' }}>
        <h2
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.brand.navy,
            margin: '0 0 0.4rem 0',
            letterSpacing: '-0.01em',
          }}
        >
          Bienvenido a re:Invent Pathfinder
        </h2>
        <p
          style={{
            margin: 0,
            color: colors.neutral.slate600,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          Elige cómo deseas experimentar el companion. Ambas opciones mantienen tus rutas y progresos aislados de forma independiente.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: spacing.lg,
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        {/* Opción Demo */}
        <div
          onClick={() => onSelectMode('demo')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectMode('demo')
          }}
          style={{
            border: currentMode === 'demo' ? `2px solid ${colors.brand.blue}` : `1px solid ${colors.neutral.slate200}`,
            borderRadius: radii.lg,
            padding: '1.25rem',
            backgroundColor: currentMode === 'demo' ? colors.semantic.infoBg : colors.neutral.slate50,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: radii.md,
                    backgroundColor: colors.brand.blueMuted,
                    color: colors.brand.blue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Terminal size={18} />
                </div>
                <strong style={{ fontSize: typography.fontSize.base, color: colors.brand.navy }}>
                  Modo Demo
                </strong>
              </div>
              {currentMode === 'demo' && (
                <Badge variant="blue">ACTIVO</Badge>
              )}
            </div>
            <p style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate600, lineHeight: 1.5, margin: '0 0 0.8rem 0' }}>
              Explora todas las capacidades en modo local-first. Sin credenciales ni llamadas reales a AWS.
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: typography.fontSize.xs, color: colors.neutral.slate500, lineHeight: 1.6 }}>
              <li>Catálogo representativo con 12 sesiones</li>
              <li>Diagnóstico y ranking heurístico local</li>
              <li>Simulación de agenda y detección de conflictos</li>
            </ul>
          </div>

          <div style={{ marginTop: '1.2rem' }}>
            <Button
              variant={currentMode === 'demo' ? 'primary' : 'secondary'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelectMode('demo')
              }}
              style={{ width: '100%', justifyContent: 'center' }}
              rightIcon={<ArrowRight size={14} />}
            >
              {currentMode === 'demo' ? '✓ Explorando en Demo' : 'Explorar Demo'}
            </Button>
          </div>
        </div>

        {/* Opción Live */}
        <div
          onClick={() => onSelectMode('live')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectMode('live')
          }}
          style={{
            border: currentMode === 'live' ? `2px solid ${colors.brand.orange}` : `1px solid ${colors.neutral.slate200}`,
            borderRadius: radii.lg,
            padding: '1.25rem',
            backgroundColor: currentMode === 'live' ? colors.semantic.warningBg : colors.neutral.slate50,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: radii.md,
                    backgroundColor: colors.brand.orangeMuted,
                    color: colors.brand.orange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cloud size={18} />
                </div>
                <strong style={{ fontSize: typography.fontSize.base, color: colors.brand.navy }}>
                  Modo Live (re:Invent)
                </strong>
              </div>
              {currentMode === 'live' ? (
                <Badge variant="orange">ACTIVO</Badge>
              ) : isAuthenticated ? (
                <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.success, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={12} /> Conectado
                </span>
              ) : null}
            </div>
            <p style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate600, lineHeight: 1.5, margin: '0 0 0.8rem 0' }}>
              Conéctate a la API oficial de AWS Events mediante Builder ID e inferencia real en Amazon Bedrock.
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: typography.fontSize.xs, color: colors.neutral.slate500, lineHeight: 1.6 }}>
              <li>Requiere autenticación con AWS Builder ID</li>
              <li>Catálogo y cupos reales de AWS re:Invent</li>
              <li>Reconciliación con tu agenda personal y favoritos</li>
              <li>Inferencia generativa en Bedrock (Nova/Claude)</li>
            </ul>
          </div>

          <div style={{ marginTop: '1.2rem' }}>
            <Button
              variant={currentMode === 'live' ? 'primary' : 'secondary'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelectMode('live')
              }}
              style={{
                width: '100%',
                justifyContent: 'center',
                backgroundColor: currentMode === 'live' ? colors.brand.orange : undefined,
                borderColor: currentMode === 'live' ? colors.brand.orange : undefined,
              }}
              rightIcon={<ArrowRight size={14} />}
            >
              Conectar con Builder ID
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
