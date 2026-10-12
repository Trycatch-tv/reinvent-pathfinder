import React from 'react'
import { colors, radii, typography } from '../../theme/tokens.js'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, disabled, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
        {label && (
          <label
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.neutral.slate700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
          }}
        >
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                color: colors.neutral.slate400,
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            style={{
              width: '100%',
              padding: leftIcon ? '0.55rem 0.75rem 0.55rem 2.25rem' : '0.55rem 0.75rem',
              paddingRight: rightIcon ? '2.25rem' : '0.75rem',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily,
              color: colors.neutral.slate900,
              backgroundColor: disabled ? colors.neutral.slate100 : colors.neutral.white,
              border: `1px solid ${error ? colors.semantic.danger : colors.neutral.slate300}`,
              borderRadius: radii.md,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              ...style,
            }}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                color: colors.neutral.slate400,
                pointerEvents: 'none',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.danger }}>
            {error}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
