import React, { useState } from 'react'
import type {
  Reflection,
  GapUpdateIntent,
  KnowledgeGap,
  KnowledgeGapStatus,
} from '@pathfinder/domain'
import { Star, Check, Rocket } from 'lucide-react'
import { colors, radii, spacing, typography } from '../theme/tokens.js'
import { Button } from './ui/Button.js'
import { Input } from './ui/Input.js'

export interface ReflectionFormProps {
  readonly sessionId: string
  readonly sessionTitle: string
  readonly userId: string
  readonly relatedGaps: readonly KnowledgeGap[]
  readonly onSubmit: (reflection: Reflection) => void
  readonly onCancel?: () => void
}

export const ReflectionForm: React.FC<ReflectionFormProps> = ({
  sessionId,
  sessionTitle,
  userId,
  relatedGaps,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(4)
  const [takeaways, setTakeaways] = useState('')
  const [actionItem, setActionItem] = useState('')
  const [gapChoices, setGapChoices] = useState<Record<string, KnowledgeGapStatus>>({})

  const handleGapToggle = (gapId: string, status: KnowledgeGapStatus) => {
    setGapChoices((prev) => {
      const next = { ...prev }
      if (next[gapId] === status) {
        delete next[gapId]
      } else {
        next[gapId] = status
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const gapUpdates: GapUpdateIntent[] = Object.entries(gapChoices).map(
      ([gapId, newStatus]) => ({ gapId, newStatus }),
    )

    const reflection: Reflection = {
      id: `refl-${sessionId}-${Date.now()}`,
      userId,
      sessionId,
      rating,
      keyTakeaways: takeaways.trim(),
      actionItem: actionItem.trim() || undefined,
      gapUpdates,
      createdAt: new Date().toISOString(),
    }
    onSubmit(reflection)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: colors.neutral.slate50,
        border: `1px solid ${colors.neutral.slate200}`,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h4 style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.brand.navy, fontWeight: typography.fontWeight.bold }}>
          {`Reflexión post-sesión: ${sessionTitle}`}
        </h4>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
          Captura lo aprendido y adapta tu ruta
        </span>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, display: 'block', marginBottom: '0.3rem', color: colors.neutral.slate700, textTransform: 'uppercase' }}>
          {`¿Qué tan útil fue? (${rating} / 5)`}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: star <= rating ? '#f59e0b' : colors.neutral.slate300,
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={`${star} estrellas`}
            >
              <Star size={18} fill={star <= rating ? '#f59e0b' : 'none'} strokeWidth={1.5} />
            </button>
          ))}
          <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate600, marginLeft: '0.4rem' }}>
            {rating === 5 ? '¡Excelente!' : rating >= 4 ? 'Muy útil' : rating === 3 ? 'Aceptable' : 'Poco útil'}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          aria-label="rating"
          style={{ width: '100%', accentColor: colors.brand.orange }}
        />
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, display: 'block', marginBottom: '0.3rem', color: colors.neutral.slate700, textTransform: 'uppercase' }}>
          ¿Qué aprendiste?
        </label>
        <textarea
          value={takeaways}
          onChange={(e) => setTakeaways(e.target.value)}
          placeholder="Conceptos clave, lecciones aprendidas o mejores prácticas que te llevas de esta sesión…"
          rows={3}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: radii.md,
            border: `1px solid ${colors.neutral.slate300}`,
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.sm,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <Input
          label="¿Qué acción implementarás en tu proyecto?"
          value={actionItem}
          onChange={(e) => setActionItem(e.target.value)}
          placeholder="ej. Probar DynamoDB Single-Table en staging, configurar Bedrock Guardrails..."
          leftIcon={<Rocket size={14} />}
        />
      </div>

      {relatedGaps.length > 0 && (
        <div style={{ marginBottom: spacing.md }}>
          <span style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, display: 'block', marginBottom: '0.4rem', color: colors.neutral.slate700, textTransform: 'uppercase' }}>
            ¿Esta sesión cubrió alguna de tus brechas?
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {relatedGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: colors.neutral.white,
                  border: `1px solid ${colors.neutral.slate200}`,
                  borderRadius: radii.md,
                  fontSize: typography.fontSize.xs,
                }}
              >
                <span style={{ fontWeight: typography.fontWeight.medium, color: colors.neutral.slate800 }}>{gap.topic}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleGapToggle(gap.id, 'addressed')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: radii.sm,
                      fontSize: '0.72rem',
                      border: gapChoices[gap.id] === 'addressed' ? `1px solid ${colors.semantic.warning}` : `1px solid ${colors.neutral.slate200}`,
                      backgroundColor: gapChoices[gap.id] === 'addressed' ? colors.semantic.warningBg : colors.neutral.white,
                      color: gapChoices[gap.id] === 'addressed' ? colors.semantic.warning : colors.neutral.slate600,
                      cursor: 'pointer',
                      fontWeight: gapChoices[gap.id] === 'addressed' ? 600 : 400,
                    }}
                  >
                    Abordado parcialmente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGapToggle(gap.id, 'closed')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: radii.sm,
                      fontSize: '0.72rem',
                      border: gapChoices[gap.id] === 'closed' ? `1px solid ${colors.semantic.success}` : `1px solid ${colors.neutral.slate200}`,
                      backgroundColor: gapChoices[gap.id] === 'closed' ? colors.semantic.successBg : colors.neutral.white,
                      color: gapChoices[gap.id] === 'closed' ? colors.semantic.success : colors.neutral.slate600,
                      cursor: 'pointer',
                      fontWeight: gapChoices[gap.id] === 'closed' ? 600 : 400,
                    }}
                  >
                    <Check size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    Cerrado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm">
          Guardar reflexión y adaptar ruta
        </Button>
      </div>
    </form>
  )
}
