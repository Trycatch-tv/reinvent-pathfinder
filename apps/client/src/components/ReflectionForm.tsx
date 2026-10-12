import React, { useState } from 'react';
import type {
  Reflection,
  GapUpdateIntent,
  KnowledgeGap,
  KnowledgeGapStatus,
} from '@pathfinder/domain';

export interface ReflectionFormProps {
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
  const [actionItem, setActionItem] = useState('');
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
      actionItem: actionItem.trim() || undefined,
      gapUpdates,
      createdAt: new Date().toISOString(),
    };
    onSubmit(reflection);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '1.2rem',
        marginTop: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
          Reflexión post-sesión: {sessionTitle}
        </h4>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Captura lo aprendido y adapta tu ruta
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', color: '#1e293b' }}>
          ¿Qué tan útil fue? ({rating}/5)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.3rem',
                color: star <= rating ? '#f59e0b' : '#cbd5e1',
                padding: '0 2px',
                lineHeight: 1,
              }}
              title={`${star} estrellas`}
            >
              ★
            </button>
          ))}
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.3rem' }}>
            {rating === 5 ? '¡Excelente!' : rating >= 4 ? 'Muy útil' : rating === 3 ? 'Aceptable' : 'Poco útil'}
          </span>
        </div>
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', color: '#1e293b' }}>
          ¿Qué aprendiste?
        </label>
        <textarea
          value={takeaways}
          onChange={(e) => setTakeaways(e.target.value)}
          placeholder="Conceptos clave, lecciones aprendidas o mejores prácticas que te llevas de esta sesión…"
          rows={3}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', color: '#1e293b' }}>
          🚀 ¿Qué acción implementarás en tu proyecto?
        </label>
        <input
          type="text"
          value={actionItem}
          onChange={(e) => setActionItem(e.target.value)}
          placeholder="ej. Probar DynamoDB Single-Table en staging, configurar Bedrock Guardrails..."
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {relatedGaps.length > 0 && (
        <div style={{ marginBottom: '1.2rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem', color: '#1e293b' }}>
            ¿Esta sesión cubrió alguna de tus brechas?
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {relatedGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontWeight: 500, color: '#334155' }}>{gap.topic}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleGapToggle(gap.id, 'addressed')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: gapChoices[gap.id] === 'addressed' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                      backgroundColor: gapChoices[gap.id] === 'addressed' ? '#fef3c7' : '#ffffff',
                      color: gapChoices[gap.id] === 'addressed' ? '#b45309' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: gapChoices[gap.id] === 'addressed' ? 600 : 400,
                    }}
                  >
                    Abordado parcialmente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGapToggle(gap.id, 'closed')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: gapChoices[gap.id] === 'closed' ? '1px solid #10b981' : '1px solid #e2e8f0',
                      backgroundColor: gapChoices[gap.id] === 'closed' ? '#dcfce7' : '#ffffff',
                      color: gapChoices[gap.id] === 'closed' ? '#15803d' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: gapChoices[gap.id] === 'closed' ? 600 : 400,
                    }}
                  >
                    ✓ Cerrado
                  </button>
                </div>
              </div>
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
              color: '#475569',
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
