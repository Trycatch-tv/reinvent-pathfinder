import React from 'react'
import { colors, radii, typography } from '../../theme/tokens.js'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  icon?: React.ReactNode
  onDismiss?: () => void
}

export function Alert({
  children,
  variant = 'info',
  title,
  icon,
  onDismiss,
  style,
  ...props
}: AlertProps) {
  const variantStyles: Record<
    AlertVariant,
    { bg: string; color: string; border: string; defaultIcon: string }
  > = {
    info: {
      bg: colors.semantic.infoBg,
      color: colors.brand.blue,
      border: colors.semantic.infoBorder,
      defaultIcon: 'ℹ️',
    },
    success: {
      bg: colors.semantic.successBg,
      color: colors.semantic.success,
      border: colors.semantic.successBorder,
      defaultIcon: '✅',
    },
    warning: {
      bg: colors.semantic.warningBg,
      color: colors.semantic.warning,
      border: colors.semantic.warningBorder,
      defaultIcon: '⚠️',
    },
    danger: {
      bg: colors.semantic.dangerBg,
      color: colors.semantic.danger,
      border: colors.semantic.dangerBorder,
      defaultIcon: '🚨',
    },
  }

  const current = variantStyles[variant]

  const alertStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.85rem 1.1rem',
    borderRadius: radii.md,
    backgroundColor: current.bg,
    border: `1px solid ${current.border}`,
    color: current.color,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal,
    ...style,
  }

  return (
    <div role="alert" style={alertStyle} {...props}>
      <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>
        {icon ?? current.defaultIcon}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <div
            style={{
              fontWeight: typography.fontWeight.bold,
              marginBottom: children ? '0.25rem' : 0,
            }}
          >
            {title}
          </div>
        )}
        {children && <div>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: '1rem',
            color: 'inherit',
            opacity: 0.7,
            marginLeft: '0.5rem',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
