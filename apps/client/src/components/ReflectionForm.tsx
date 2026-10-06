import React, { useState } from 'react';
import type {
  Reflection,
  GapUpdateIntent,
  KnowledgeGap,
  KnowledgeGapStatus,
} from '@pathfinder/domain';

interface ReflectionFormProps {
  readonly sessionId: string;
  readonly sessionTitle: string;
  readonly userId: string;
  /** Gaps que esta sesión podía cubrir (para marcarlos como abordados). */
  readonly relatedGaps: readonly KnowledgeGap[];
  readonly onSubmit: (reflection: Reflection) => void;
  readonly onCancel?: () => void;
}

export const ReflectionForm: React.FC<ReflectionFormProps> = ({
  sessionId,
  sessionTitle,
  userId,
  relatedGaps,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(4);
  const [takeaways, setTakeaways] = useState('');
  // gapId -> nuevo status elegido por el usuario (solo los que cambie).
  const [gapChoices, setGapChoices] = useState<Record<string, KnowledgeGapStatus>>({});

  const handleGapToggle = (gapId: string, status: KnowledgeGapStatus) => {
    setGapChoices((prev) => {
      const next = { ...prev };
      if (next[gapId] === status) {
        delete next[gapId];
      } else {
        next[gapId] = status;
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gapUpdates: GapUpdateIntent[] = Object.entries(gapChoices).map(
      ([gapId, newStatus]) => ({ gapId, newStatus }),
    );

    const reflection: Reflection = {
      id: `refl-${sessionId}-${Date.now()}`,
      userId,
      sessionId,
      rating,
      keyTakeaways: takeaways.trim(),
      gapUpdates,
      createdAt: new Date().toISOString(),
    };
    onSubmit(reflection);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#f9fafb',
        border: '1px dashed #cbd5e1',
        borderRadius: '8px',
        padding: '1.2rem',
        marginTop: '0.8rem',
      }}
    >
      <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#0f172a' }}>
        Reflexión post-sesión: {sessionTitle}
      </h4>

      <div style={{ marginBottom: '0.9rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
          ¿Qué tan útil fue? ({rating}/5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          aria-label="rating"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '0.9rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
          ¿Qué aprendiste?
        </label>
        <textarea
          value={takeaways}
          onChange={(e) => setTakeaways(e.target.value)}
          placeholder="Lo más valioso que te llevas de esta sesión…"
          rows={3}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
        />
      </div>

      {relatedGaps.length > 0 && (
        <div style={{ marginBottom: '0.9rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>
            ¿Esta sesión cubrió alguna de tus brechas?
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {relatedGaps.map((gap) => (
              <label
                key={gap.id}
                style={{ fontSize: '0.85rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={gapChoices[gap.id] === 'addressed'}
                  onChange={() => handleGapToggle(gap.id, 'addressed')}
                />
                {gap.topic}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Guardar reflexión y adaptar ruta
        </button>
      </div>
    </form>
  );
};
