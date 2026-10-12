import React from 'react'
import { colors, radii, typography } from '../../theme/tokens.js'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'live'
  | 'demo'
  | 'teal'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  withDot?: boolean
}

export function Badge({
  children,
  variant = 'default',
  withDot = false,
  style,
  ...props
}: BadgeProps) {
  const variantStyles: Record<
    BadgeVariant,
    { bg: string; color: string; border: string; dot?: string }
  > = {
    default: {
      bg: colors.neutral.slate100,
      color: colors.neutral.slate700,
      border: colors.neutral.slate200,
      dot: colors.neutral.slate400,
    },
    primary: {
      bg: colors.brand.blueMuted,
      color: colors.brand.blue,
      border: 'rgba(2, 132, 199, 0.3)',
      dot: colors.brand.blue,
    },
    success: {
      bg: colors.semantic.successBg,
      color: colors.semantic.success,
      border: colors.semantic.successBorder,
      dot: colors.semantic.success,
    },
    warning: {
      bg: colors.semantic.warningBg,
      color: colors.semantic.warning,
      border: colors.semantic.warningBorder,
      dot: colors.semantic.warning,
    },
    danger: {
      bg: colors.semantic.dangerBg,
      color: colors.semantic.danger,
      border: colors.semantic.dangerBorder,
      dot: colors.semantic.danger,
    },
    info: {
      bg: colors.semantic.infoBg,
      color: colors.semantic.info,
      border: colors.semantic.infoBorder,
      dot: colors.semantic.info,
    },
    live: {
      bg: colors.brand.orangeMuted,
      color: colors.brand.orange,
      border: 'rgba(234, 88, 12, 0.3)',
      dot: colors.brand.orangeBright,
    },
    demo: {
      bg: colors.brand.blueMuted,
      color: colors.brand.blue,
      border: 'rgba(2, 132, 199, 0.3)',
      dot: colors.brand.blueBright,
    },
    teal: {
      bg: colors.brand.tealMuted,
      color: colors.brand.teal,
      border: 'rgba(15, 118, 110, 0.3)',
      dot: colors.brand.tealBright,
    },
  }

  const current = variantStyles[variant]

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: radii.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 1.2,
    backgroundColor: current.bg,
    color: current.color,
    border: `1px solid ${current.border}`,
    userSelect: 'none',
    ...style,
  }

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: current.dot ?? current.color,
  }

  return (
    <span style={badgeStyle} {...props}>
      {withDot && <span style={dotStyle} aria-hidden="true" />}
      {children}
    </span>
  )
}
