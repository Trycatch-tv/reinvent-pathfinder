import React from 'react'
import { colors, radii, typography } from '../../theme/tokens.js'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: readonly SelectOption[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, children, style, disabled, ...props }, ref) => {
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
        <select
          ref={ref}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem',
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily,
            color: colors.neutral.slate900,
            backgroundColor: disabled ? colors.neutral.slate100 : colors.neutral.white,
            border: `1px solid ${error ? colors.semantic.danger : colors.neutral.slate300}`,
            borderRadius: radii.md,
            outline: 'none',
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s ease',
            ...style,
          }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.danger }}>
            {error}
          </span>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
