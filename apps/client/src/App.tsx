import React, { useState } from 'react';
import type {
  AnalyzeContextRequest,
  AnalyzeContextResponse,
} from '@pathfinder/contracts';
import { HeuristicContextAnalyzer } from '@pathfinder/ai-knowledge';
import { ContextForm } from './components/ContextForm.js';
import { KnowledgeProfileView } from './components/KnowledgeProfileView.js';
import { KnowledgeGapsList } from './components/KnowledgeGapsList.js';

export const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContextSubmit = async (request: AnalyzeContextRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // Local-first execution using Heuristic analyzer
      const analyzer = new HeuristicContextAnalyzer();
      const result = await analyzer.analyze(request);
      setAnalysisResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al analizar el contexto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid #ea580c', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>re:Invent Pathfinder</h1>
        <p style={{ margin: '0.4rem 0 0 0', color: '#475569', fontSize: '1rem' }}>
          AI companion que transforma el catálogo de AWS re:Invent en una ruta de aprendizaje adaptativa.
        </p>
      </header>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {!analysisResult ? (
        <section style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.3rem', color: '#0f172a' }}>
            Paso 1: ¿Qué estás construyendo?
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Describe tu iniciativa o reto arquitectónico. Pathfinder extraerá tus competencias actuales y determinará qué conocimientos necesitas profundizar.
          </p>
          <ContextForm onSubmit={handleContextSubmit} isLoading={isLoading} />
        </section>
      ) : (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
              Tu Diagnóstico de Aprendizaje
            </h2>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Modificar Contexto
            </button>
          </div>

          <KnowledgeProfileView
            profile={analysisResult.knowledgeProfile}
            context={analysisResult.projectContext}
          />

          <KnowledgeGapsList
            gaps={analysisResult.knowledgeGaps}
          />

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button
              type="button"
              style={{
                padding: '0.8rem 1.6rem',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => alert('Próximo paso: Generación de Learning Path y reconciliación de agenda (WI-012)!')}
            >
              Construir Learning Path Recomendado →
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
