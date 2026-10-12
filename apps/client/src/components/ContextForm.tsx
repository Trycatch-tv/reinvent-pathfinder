import React, { useState } from 'react'
import type { SeniorityLevel } from '@pathfinder/domain'
import type { AnalyzeContextRequest } from '@pathfinder/contracts'
import { Sparkles, Plus, Check } from 'lucide-react'
import { colors, radii, spacing, typography } from '../theme/tokens.js'
import { Button } from './ui/Button.js'
import { Input } from './ui/Input.js'
import { Select } from './ui/Select.js'

interface ContextFormProps {
  readonly onSubmit: (request: AnalyzeContextRequest) => void
  readonly isLoading?: boolean
}

const COMMON_STACK_OPTIONS = [
  'Bedrock',
  'DynamoDB',
  'Lambda',
  'EventBridge',
  'AgentCore',
  'TypeScript',
  'Python',
  'API Gateway',
  'ECS / Fargate',
  'OAuth / Security',
]

export const ContextForm: React.FC<ContextFormProps> = ({ onSubmit, isLoading }) => {
  const [projectName, setProjectName] = useState('Mi Proyecto re:Invent')
  const [description, setDescription] = useState(
    'Estoy construyendo un sistema de agentes autónomos y recuperación semántica con Amazon Bedrock y single-table design en DynamoDB.',
  )
  const [seniority, setSeniority] = useState<SeniorityLevel>('intermediate')
  const [selectedStack, setSelectedStack] = useState<string[]>(['Bedrock', 'DynamoDB', 'Lambda'])
  const [customTech, setCustomTech] = useState('')
  const [goals, setGoals] = useState('Diseñar arquitectura resiliente y minimizar costos de inferencia en agentes.')

  const toggleTech = (tech: string) => {
    setSelectedStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    )
  }

  const addCustomTech = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = customTech.trim()
    if (trimmed && !selectedStack.includes(trimmed)) {
      setSelectedStack((prev) => [...prev, trimmed])
      setCustomTech('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      projectName,
      description,
      seniority,
      currentStack: selectedStack,
      goals: goals.split('\n').filter((g) => g.trim().length > 0),
    })
  }

  const allStackOptions = Array.from(new Set([...COMMON_STACK_OPTIONS, ...selectedStack]))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Input
        label="Nombre del Proyecto o Iniciativa"
        id="projectName"
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label
          htmlFor="description"
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral.slate700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          ¿Qué estás construyendo y qué retos enfrentas?
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: radii.md,
            border: `1px solid ${colors.neutral.slate300}`,
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily,
            color: colors.neutral.slate900,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <Select
        label="Seniority Técnico"
        id="seniority"
        value={seniority}
        onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
        options={[
          { value: 'beginner', label: 'Principiante (Foundational / Nivel 100-200)' },
          { value: 'intermediate', label: 'Intermedio (Intermediate / Nivel 200-300)' },
          { value: 'advanced', label: 'Avanzado (Specialist / Nivel 300-400)' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral.slate700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Stack y Tecnologías del Proyecto:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
          {allStackOptions.map((tech) => {
            const isSelected = selectedStack.includes(tech)
            return (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTech(tech)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.35rem 0.75rem',
                  borderRadius: radii.full,
                  border: isSelected ? `1px solid ${colors.brand.blue}` : `1px solid ${colors.neutral.slate300}`,
                  backgroundColor: isSelected ? colors.brand.blueMuted : colors.neutral.white,
                  color: isSelected ? colors.brand.blue : colors.neutral.slate700,
                  fontSize: typography.fontSize.xs,
                  fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} />}
                <span>{tech}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <Input
            placeholder="Agregar otra tecnología (ej. IAM, S3, ECS)..."
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomTech()
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => addCustomTech()}>
            Agregar
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label
          htmlFor="goals"
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral.slate700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Objetivos de Aprendizaje para re:Invent:
        </label>
        <textarea
          id="goals"
          rows={2}
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: radii.md,
            border: `1px solid ${colors.neutral.slate300}`,
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily,
            color: colors.neutral.slate900,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          isLoading={isLoading}
          leftIcon={<Sparkles size={16} />}
          style={{
            width: '100%',
            justifyContent: 'center',
            backgroundColor: colors.brand.orange,
            borderColor: colors.brand.orange,
            color: colors.neutral.white,
          }}
        >
          {isLoading ? 'Analizando Contexto...' : 'Descubrir Mi Knowledge Profile y Gaps'}
        </Button>
      </div>
    </form>
  )
}
