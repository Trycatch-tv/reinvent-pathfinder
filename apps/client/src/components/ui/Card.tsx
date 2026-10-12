import React from 'react'
import { colors, radii, shadows } from '../../theme/tokens.js'

export type CardVariant = 'default' | 'interactive' | 'bordered' | 'flat'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}: CardProps) {
  const paddingMap = {
    none: '0',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
  }

  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      backgroundColor: colors.neutral.white,
      border: `1px solid ${colors.neutral.slate200}`,
      boxShadow: shadows.sm,
    },
    interactive: {
      backgroundColor: colors.neutral.white,
      border: `1px solid ${colors.neutral.slate200}`,
      boxShadow: shadows.md,
      cursor: 'pointer',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    bordered: {
      backgroundColor: colors.neutral.slate50,
      border: `1px solid ${colors.neutral.slate300}`,
      boxShadow: 'none',
    },
    flat: {
      backgroundColor: colors.neutral.slate100,
      border: 'none',
      boxShadow: 'none',
    },
  }

  const cardStyle: React.CSSProperties = {
    borderRadius: radii.lg,
    padding: paddingMap[padding],
    ...variantStyles[variant],
    ...style,
  }

  return (
    <div style={cardStyle} {...props}>
      {children}
    </div>
  )
}
