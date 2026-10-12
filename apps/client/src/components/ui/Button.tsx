import React from 'react'
import { colors, radii, typography } from '../../theme/tokens.js'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: '0.35rem 0.7rem',
      fontSize: typography.fontSize.sm,
      gap: '0.4rem',
    },
    md: {
      padding: '0.55rem 1.1rem',
      fontSize: typography.fontSize.sm,
      gap: '0.5rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: typography.fontSize.base,
      gap: '0.6rem',
    },
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.brand.blue,
      color: colors.neutral.white,
      border: `1px solid ${colors.brand.blue}`,
    },
    secondary: {
      backgroundColor: colors.neutral.slate100,
      color: colors.neutral.slate700,
      border: `1px solid ${colors.neutral.slate300}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.brand.blue,
      border: `1px solid ${colors.brand.blue}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.neutral.slate600,
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: colors.semantic.danger,
      color: colors.neutral.white,
      border: `1px solid ${colors.semantic.danger}`,
    },
    teal: {
      backgroundColor: colors.brand.teal,
      color: colors.neutral.white,
      border: `1px solid ${colors.brand.teal}`,
    },
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 1,
    borderRadius: radii.md,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
    userSelect: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  return (
    <button disabled={isDisabled} style={baseStyle} {...props}>
      {isLoading ? (
        <span aria-hidden="true" style={{ display: 'inline-block' }}>
          ⏳
        </span>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  )
}
