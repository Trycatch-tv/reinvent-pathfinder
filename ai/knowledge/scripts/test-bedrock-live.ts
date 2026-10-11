import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockContextAnalyzer,
  BedrockSessionReranker,
  CostGuardrail,
  AiMetricsTracker,
} from '../src/index.js';
import type { SessionCandidate } from '@pathfinder/domain';

// 1. Cargar variables desde .env en la raíz del repositorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const envPath = path.resolve(rootDir, '.env');

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const region = process.env.AWS_REGION || 'us-west-2';
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;
const rawModelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0';

console.log('='.repeat(68));
console.log('🚀 PATHFINDER - DIAGNÓSTICO Y PRUEBA DE AWS BEDROCK EN VIVO');
console.log('='.repeat(68));
console.log(`📍 Región configurada   : ${region}`);
console.log(`🔑 Access Key           : ${accessKey ? accessKey.slice(0, 8) + '...' + accessKey.slice(-4) : 'NO CONFIGURADA'}`);
console.log(`🔒 Secret Key           : ${secretKey ? '********' + secretKey.slice(-4) : 'NO CONFIGURADA'}`);
console.log(`🤖 Modelo solicitado    : ${rawModelId}`);
console.log('-'.repeat(68));

if (!accessKey || !secretKey) {
  console.error('❌ Error: Faltan credenciales de AWS en .env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)');
  process.exit(1);
}

const credentials = {
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  ...(sessionToken ? { sessionToken } : {}),
};

const client = new BedrockRuntimeClient({
  region,
  credentials,
});

async function testDirectInvocation(modelCandidate: string): Promise<boolean> {
  console.log(`📡 Probando conexión directa con ConverseCommand (Modelo: ${modelCandidate})...`);
  try {
    const cmd = new ConverseCommand({
      modelId: modelCandidate,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Hola Bedrock, responde únicamente con la palabra "CONECTADO".' }],
        },
      ],
      inferenceConfig: {
        maxTokens: 50,
        temperature: 0.1,
      },
    });

    const res = await client.send(cmd);
    const text = res.output?.message?.content?.[0]?.text?.trim() ?? '';
    console.log(`✅ ¡Conexión exitosa a Bedrock! Respuesta del modelo: "${text}"`);
    console.log(`📊 Tokens usados: Entrada=${res.usage?.inputTokens}, Salida=${res.usage?.outputTokens}`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Falló invocación con ID "${modelCandidate}": ${message}`);
    return false;
  }
}

async function main() {
  // Probar con el ID solicitado y posibles variantes (como prefijo us. para cross-region)
  const candidateIds = [
    rawModelId,
    `us.${rawModelId}`,
    'anthropic.claude-haiku-4-5-20251001-v1:0',
    'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    'anthropic.claude-haiku-5-5',
    'us.anthropic.claude-haiku-5-5',
    'anthropic.claude-sonnet-4-20250514-v1:0',
    'us.anthropic.claude-sonnet-4-20250514-v1:0',
    'amazon.titan-text-express-v1',
    'us.amazon.nova-micro-v1:0',
    'amazon.nova-micro-v1:0',
  ];

  let activeModelId: string | null = null;
  for (const id of Array.from(new Set(candidateIds))) {
    const ok = await testDirectInvocation(id);
    if (ok) {
      activeModelId = id;
      break;
    }
  }

  if (!activeModelId) {
    console.log('\n❌ No se pudo conectar directamente con ninguno de los IDs candidatos.');
    console.log('Posibles causas:');
    console.log('1. El modelo no tiene "Access granted" en AWS Console -> Bedrock -> Model access.');
    console.log('2. El usuario de IAM no tiene la política "bedrock:InvokeModel" asignada.');
    console.log('3. La clave de acceso está inactiva o pertenece a otra región.\n');
  } else {
    console.log(`\n🎉 Modelo validado y listo para usar: ${activeModelId}\n`);
  }

  // Ahora probamos los componentes reales del proyecto (Analyzer & Reranker con Observabilidad)
  const modelToUse = activeModelId ?? rawModelId;
  const guardrail = new CostGuardrail({ maxBudgetUsd: 2.0 });
  const tracker = new AiMetricsTracker();

  console.log('='.repeat(68));
  console.log('🧪 PRUEBA 1: BedrockContextAnalyzer (Análisis de Asistente)');
  console.log('='.repeat(68));

  const analyzer = new BedrockContextAnalyzer({
    modelId: modelToUse,
    region,
    bedrockClient: client,
    guardrail,
    tracker,
  });

  const analyzeStart = Date.now();
  const analysisResult = await analyzer.analyze({
    projectName: 'Pathfinder re:Invent 2026 AI Agent',
    description: 'Construyendo un sistema autónomo de recomendación de sesiones usando Amazon Bedrock, Knowledge Bases, DynamoDB single-table y OAuth 2.0 PKCE.',
    seniority: 'professional',
    currentStack: ['TypeScript', 'Bedrock', 'DynamoDB', 'Lambda'],
    goals: [
      'Aprender orquestación de agentes con Amazon Bedrock AgentCore',
      'Optimizar costos de modelos fundacionales con guardrails',
      'Implementar seguridad Zero Trust en el frontend',
    ],
  });
  const analyzeLatency = Date.now() - analyzeStart;

  console.log(`⏱️ Latencia: ${analyzeLatency} ms`);
  console.log(`🏷️ Modelo utilizado: ${analysisResult.modelId}`);
  console.log(`🧠 Habilidades detectadas:`, analysisResult.knowledgeProfile.skills.map((s) => `${s.topic} (${s.proficiency})`).join(', '));
  console.log(`🎯 Brechas de conocimiento (Knowledge Gaps):`);
  analysisResult.knowledgeGaps.forEach((gap, i) => {
    console.log(`   ${i + 1}. [${gap.severity.toUpperCase()}] ${gap.topic}: ${gap.description}`);
  });

  console.log('\n' + '='.repeat(68));
  console.log('🧪 PRUEBA 2: BedrockSessionReranker (Reranking Inteligente de Sesiones)');
  console.log('='.repeat(68));

  const reranker = new BedrockSessionReranker({
    modelId: modelToUse,
    region,
    bedrockClient: client,
    guardrail,
    tracker,
  });

  const sampleCandidates: SessionCandidate[] = [
    {
      id: 'AIM301',
      code: 'AIM301',
      title: 'Building production-ready autonomous multi-agent systems with Amazon Bedrock',
      abstract: 'Learn how to construct multi-agent collaboration with Bedrock AgentCore, action groups, and memory.',
      level: 300,
      format: 'breakout',
      venue: 'Venetian',
      topics: ['Artificial Intelligence', 'Bedrock', 'AgentCore'],
      durationMinutes: 60,
    },
    {
      id: 'DAT304',
      code: 'DAT304',
      title: 'Advanced Single-Table Design patterns in Amazon DynamoDB for high throughput',
      abstract: 'Deep dive into composite partition keys, global secondary indexes, and avoiding throttling.',
      level: 300,
      format: 'chalk-talk',
      venue: 'Caesars Forum',
      topics: ['Databases', 'DynamoDB', 'NoSQL'],
      durationMinutes: 60,
    },
    {
      id: 'SEC401',
      code: 'SEC401',
      title: 'Zero Trust architecture and least-privilege token delegation with IAM',
      abstract: 'Implementing fine-grained authorization, ephemeral tokens, and PKCE in cloud applications.',
      level: 400,
      format: 'workshop',
      venue: 'Mandalay Bay',
      topics: ['Security', 'Zero Trust', 'OAuth'],
      durationMinutes: 120,
    },
    {
      id: 'NET201',
      code: 'NET201',
      title: 'Introduction to VPC peering and transit gateways',
      abstract: 'Foundational concepts of AWS VPC networking.',
      level: 200,
      format: 'breakout',
      venue: 'Wynn',
      topics: ['Networking'],
      durationMinutes: 60,
    },
  ];

  const rerankStart = Date.now();
  const rankResult = await reranker.rank({
    projectId: analysisResult.projectContext.id,
    seniority: 'professional',
    knowledgeGaps: analysisResult.knowledgeGaps,
    candidateSessions: sampleCandidates,
    maxRecommendations: 3,
  });
  const rerankLatency = Date.now() - rerankStart;

  console.log(`⏱️ Latencia: ${rerankLatency} ms`);
  console.log(`🏆 Top Recomendaciones generadas:`);
  rankResult.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. [Puntaje: ${(rec.relevanceScore * 100).toFixed(1)}%] ${rec.sessionCode} - ${rec.title}`);
    console.log(`      💡 Razón: ${rec.explanation}`);
  });

  console.log('\n' + '='.repeat(68));
  console.log('📈 REPORTE DE OBSERVABILIDAD Y COSTOS ACUMULADOS');
  console.log('='.repeat(68));
  const summary = tracker.getSummary();
  console.log(`Total llamadas registradas : ${summary.totalCalls}`);
  console.log(`Llamadas exitosas          : ${summary.successfulCalls}`);
  console.log(`Llamadas fallback          : ${summary.fallbackCalls}`);
  console.log(`Llamadas presupuesto bloque: ${summary.budgetBlockedCalls}`);
  console.log(`Total Tokens consumidos    : ${summary.totalInputTokens + summary.totalOutputTokens} (In: ${summary.totalInputTokens}, Out: ${summary.totalOutputTokens})`);
  console.log(`Latencia promedio          : ${summary.averageLatencyMs} ms`);
  console.log(`Costo total acumulado      : $${summary.totalCostUsd.toFixed(6)} USD`);
  console.log(`Costo acumulado guardrail  : $${guardrail.getAccumulatedCost().toFixed(6)} USD`);
  console.log('='.repeat(68));
}

main().catch((err) => {
  console.error('Error fatal al ejecutar la prueba:', err);
  process.exit(1);
});
