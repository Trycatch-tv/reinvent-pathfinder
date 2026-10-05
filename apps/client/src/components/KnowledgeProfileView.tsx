import React from 'react';
import type { KnowledgeProfile, ProjectContext } from '@pathfinder/domain';

interface KnowledgeProfileViewProps {
  readonly profile: KnowledgeProfile;
  readonly context: ProjectContext;
}

export const KnowledgeProfileView: React.FC<KnowledgeProfileViewProps> = ({ profile, context }) => {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.8rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#161e2e' }}>Perfil de Conocimiento: {context.name}</h3>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Seniority actual: <strong>{context.seniority.toUpperCase()}</strong></span>
        </div>
        <span style={{ fontSize: '0.8rem', backgroundColor: '#e2f0d9', color: '#385723', padding: '0.3rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
          Identificado
        </span>
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#4b5563' }}>Dominios Técnicos Clave</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {profile.targetDomains.map((domain) => (
            <span
              key={domain}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              {domain}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#4b5563' }}>Habilidades y Nivel Detectado</h4>
        {profile.skills.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#888' }}>No se detectaron habilidades específicas en el texto.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
            {profile.skills.map((skill, idx) => (
              <div
                key={`${skill.topic}-${idx}`}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                  padding: '0.5rem 0.8rem',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{skill.topic}</span>
                <span style={{ fontSize: '0.75rem', color: '#0066cc', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {skill.proficiency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
