import React, { useState } from 'react';
import type { SeniorityLevel } from '@pathfinder/domain';
import type { AnalyzeContextRequest } from '@pathfinder/contracts';

interface ContextFormProps {
  readonly onSubmit: (request: AnalyzeContextRequest) => void;
  readonly isLoading?: boolean;
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
];

export const ContextForm: React.FC<ContextFormProps> = ({ onSubmit, isLoading }) => {
  const [projectName, setProjectName] = useState('Mi Proyecto re:Invent');
  const [description, setDescription] = useState(
    'Estoy construyendo un sistema de agentes autónomos y recuperación semántica con Amazon Bedrock y single-table design en DynamoDB.'
  );
  const [seniority, setSeniority] = useState<SeniorityLevel>('intermediate');
  const [selectedStack, setSelectedStack] = useState<string[]>(['Bedrock', 'DynamoDB', 'Lambda']);
  const [customTech, setCustomTech] = useState('');
  const [goals, setGoals] = useState('Diseñar arquitectura resiliente y minimizar costos de inferencia en agentes.');

  const toggleTech = (tech: string) => {
    setSelectedStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const addCustomTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTech.trim() && !selectedStack.includes(customTech.trim())) {
      setSelectedStack((prev) => [...prev, customTech.trim()]);
      setCustomTech('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectName,
      description,
      seniority,
      currentStack: selectedStack,
      goals: goals.split('\n').filter((g) => g.trim().length > 0),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div>
        <label htmlFor="projectName" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
          Nombre del Proyecto o Iniciativa:
        </label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="description" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
          ¿Qué estás construyendo y qué retos enfrentas?
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label htmlFor="seniority" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
          Seniority Técnico:
        </label>
        <select
          id="seniority"
          value={seniority}
          onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="beginner">Principiante (Foundational / Nivel 100-200)</option>
          <option value="intermediate">Intermedio (Intermediate / Nivel 200-300)</option>
          <option value="advanced">Avanzado (Specialist / Nivel 300-400)</option>
        </select>
      </div>

      <div>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
          Stack y Tecnologías:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
          {COMMON_STACK_OPTIONS.map((tech) => {
            const isSelected = selectedStack.includes(tech);
            return (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTech(tech)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #0056b3' : '1px solid #ddd',
                  backgroundColor: isSelected ? '#e7f1ff' : '#f8f9fa',
                  color: isSelected ? '#0056b3' : '#333',
                  cursor: 'pointer',
                  fontWeight: isSelected ? '600' : 'normal',
                }}
              >
                {isSelected ? `✓ ${tech}` : `+ ${tech}`}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type="text"
            placeholder="Otra tecnología..."
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="button"
            onClick={addCustomTech}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Agregar
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="goals" style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
          Objetivos de aprendizaje para re:Invent:
        </label>
        <textarea
          id="goals"
          rows={2}
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: '0.8rem 1.2rem',
          backgroundColor: '#ff9900',
          color: '#111',
          border: 'none',
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginTop: '0.5rem',
        }}
      >
        {isLoading ? 'Analizando Contexto...' : 'Descubrir Mi Knowledge Profile y Gaps →'}
      </button>
    </form>
  );
};
