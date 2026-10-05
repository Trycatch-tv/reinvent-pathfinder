import React, { useState } from 'react';
import type { KnowledgeGap, KnowledgeGapSeverity } from '@pathfinder/domain';

interface KnowledgeGapsListProps {
  readonly gaps: readonly KnowledgeGap[];
  readonly onGapsChange?: (updatedGaps: KnowledgeGap[]) => void;
}

const SEVERITY_COLORS: Record<KnowledgeGapSeverity, { bg: string; text: string; label: string }> = {
  critical: { bg: '#fee2e2', text: '#b91c1c', label: 'CRÍTICA' },
  important: { bg: '#fef3c7', text: '#b45309', label: 'IMPORTANTE' },
  'nice-to-have': { bg: '#e0e7ff', text: '#4338ca', label: 'DESEABLE' },
};

export const KnowledgeGapsList: React.FC<KnowledgeGapsListProps> = ({ gaps, onGapsChange }) => {
  const [localGaps, setLocalGaps] = useState<KnowledgeGap[]>([...gaps]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<KnowledgeGapSeverity>('important');

  const handleAddGap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const createdGap: KnowledgeGap = {
      id: `gap-custom-${Date.now()}`,
      topic: newTopic.trim(),
      description: newDescription.trim() || `Brecha identificada por el usuario en ${newTopic.trim()}`,
      targetProficiency: 'professional',
      severity: newSeverity,
      status: 'open',
      rationale: 'Añadida manualmente por el asistente durante la revisión de contexto.',
      addressedBySessionIds: [],
    };

    const updated = [createdGap, ...localGaps];
    setLocalGaps(updated);
    onGapsChange?.(updated);
    setNewTopic('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleDeleteGap = (id: string) => {
    const updated = localGaps.filter((g) => g.id !== id);
    setLocalGaps(updated);
    onGapsChange?.(updated);
  };

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.8rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#161e2e' }}>
            Knowledge Gaps Identificados ({localGaps.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Brechas que tu Learning Path priorizará cerrar en re:Invent
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {isAdding ? 'Cancelar' : '+ Agregar Gap'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGap} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px dashed #cbd5e1' }}>
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem' }}>Nuevo Knowledge Gap</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="text"
              placeholder="Tema o Tecnología (ej: Observabilidad de Modelos Bedrock)"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              required
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="¿Qué necesitas aprender exactamente?"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Severidad:</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as KnowledgeGapSeverity)}
                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="critical">Crítica</option>
                <option value="important">Importante</option>
                <option value="nice-to-have">Deseable</option>
              </select>
              <button
                type="submit"
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      )}

      {localGaps.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>No hay brechas registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {localGaps.map((gap) => {
            const sev = SEVERITY_COLORS[gap.severity] ?? SEVERITY_COLORS.important;
            return (
              <div
                key={gap.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0.8rem',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        backgroundColor: sev.bg,
                        color: sev.text,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      {sev.label}
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#111827' }}>{gap.topic}</strong>
                  </div>
                  <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#4b5563' }}>{gap.description}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                    Motivo: {gap.rationale}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGap(gap.id)}
                  title="Eliminar este gap"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '0.2rem 0.5rem',
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
