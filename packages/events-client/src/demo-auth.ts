import http from 'node:http';
import {
  AwsBuilderIdAuthClient,
  InMemoryTokenStore,
  AwsEventsClient,
  evaluateScheduleConflicts,
  SAMPLE_USER_SCHEDULE,
} from './index.js';

const PORT = 8484; // Loopback port autorizado por AWS Events API (rango 8484-8489)
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// Se puede configurar vía variables de entorno o usar el oficial por defecto
const CLIENT_ID = process.env.AWS_BUILDER_ID_CLIENT_ID ?? '7vmom55m1qstvq8i71ph127bfq';
const IS_MOCK = process.env.AUTH_MODE !== 'real' && !process.env.AWS_BUILDER_ID_CLIENT_ID;

console.log('='.repeat(65));
console.log('  AWS EVENTS / BUILDER ID — FLUJO OAUTH 2.0 + PKCE');
console.log('='.repeat(65));
console.log(`Modo de ejecución: ${IS_MOCK ? 'SIMULADO / OFFLINE (Mock)' : 'REAL (AWS Events Live)'}`);
console.log(`Endpoint Auth:     https://oauth.awsevents.com/oauth2/authorize`);
console.log(`Endpoint Token:    https://oauth.awsevents.com/oauth2/token`);
console.log(`Client ID:         ${CLIENT_ID}`);
console.log(`Redirect URI:      ${REDIRECT_URI}\n`);

const tokenStore = new InMemoryTokenStore();
const authClient = new AwsBuilderIdAuthClient({
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
  tokenStore,
  mockMode: IS_MOCK,
});

// 1. Generar desafío criptográfico PKCE
const { authorizationUrl, verifier, state } = authClient.initiateAuth();

console.log('1. Parámetros criptográficos PKCE generados:');
console.log(`   - State (anti-CSRF): ${state}`);
console.log(`   - Code Verifier:     ${verifier.slice(0, 15)}... (longitud: ${verifier.length})`);
console.log(`\n2. URL de Autorización oficial:\n   ${authorizationUrl}\n`);

// 2. Levantar servidor HTTP local en el puerto loopback oficial
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // Página de inicio interactiva
  if (reqUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>re:Invent Pathfinder - Auth Launcher</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 650px; margin: 40px auto; padding: 24px; background: #0f172a; color: #f8fafc; }
          .card { background: #1e293b; border-radius: 12px; padding: 28px; border: 1px solid #334155; }
          .btn { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 16px; margin-right: 12px; }
          .btn-mock { background: #3b82f6; }
          .code { background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #38bdf8; overflow-x: auto; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>re:Invent Pathfinder — Login con AWS Builder ID</h2>
          <p>Conexión según especificación técnica del <strong>AWS Events API</strong> (puerto loopback <code>8484</code>).</p>
          <div>
            <a class="btn" href="${authorizationUrl}" target="_blank">1. Abrir AWS Oficial (oauth.awsevents.com) &rarr;</a>
            <a class="btn btn-mock" href="/callback?code=mock_test_code_123&state=${state}">2. Probar Callback Simulado &rarr;</a>
          </div>
          <div class="code">
            <strong>Endpoint oficial:</strong> https://oauth.awsevents.com/oauth2/authorize<br>
            <strong>Client ID:</strong> ${CLIENT_ID}<br>
            <strong>Redirect URI:</strong> ${REDIRECT_URI}<br>
            <strong>Scope:</strong> openid email events/access
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (reqUrl.pathname === '/login') {
    res.writeHead(302, { Location: authorizationUrl });
    res.end();
    return;
  }

  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.searchParams.get('code') ?? (IS_MOCK ? 'mock_auth_code_12345' : '');
    const returnedState = reqUrl.searchParams.get('state') ?? (IS_MOCK ? state : '');

    console.log('3. Callback recibido en el servidor local:');
    console.log(`   - Code recibido:  ${code.slice(0, 20)}...`);
    console.log(`   - State devuelto: ${returnedState}`);

    try {
      // 4. Canjear código por tokens (validando state y enviando code_verifier)
      const tokens = await authClient.handleCallback({
        code,
        state: returnedState,
        expectedState: state,
        verifier,
      });

      console.log('\n4. Tokens intercambiados exitosamente:');
      console.log(`   - Access Token:   ${tokens.accessToken.slice(0, 25)}...`);
      console.log(`   - Token Type:     ${tokens.tokenType}`);
      console.log(`   - Expira en:      ${tokens.expiresIn} segundos`);
      console.log(`   - Token en RAM:   InMemoryTokenStore (${tokenStore.getAccessToken() ? 'OK' : 'FAIL'})`);

      // 5. Demostrar llamada autenticada a la agenda personal
      const eventsClient = new AwsEventsClient({
        tokenStore,
        mockMode: true,
      });

      const scheduleResult = await eventsClient.getPersonalSchedule();
      const favorites = await eventsClient.getFavorites();

      console.log('\n5. Consulta a la Agenda Personal del Asistente:');
      console.log(`   - Total items agendados: ${scheduleResult.items.length}`);
      console.log(`   - Favoritos del usuario: ${favorites.join(', ')}`);

      // 6. Demostrar detección de conflictos de agenda
      const conflicts = evaluateScheduleConflicts(
        [
          {
            id: 'demo-conflict-sess',
            code: 'DAT304-CONFLICT',
            title: 'Sesión de DynamoDB que colisiona',
            description: 'Colisión horaria con la agenda del usuario.',
            level: 300,
            topics: ['DynamoDB'],
            format: 'breakout',
            schedule: {
              day: '2026-12-01',
              startTime: '10:15',
              endTime: '11:15',
            },
          },
        ],
        SAMPLE_USER_SCHEDULE
      );

      console.log(`\n6. Detección de Conflictos: ${conflicts.length} conflicto(s) encontrado(s):`);
      for (const c of conflicts) {
        console.log(`   [!] ${c.conflict.reason}`);
      }

      // Respuesta HTML al navegador
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AWS Builder ID Login - Pathfinder</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; border-radius: 8px; padding: 24px; border: 1px solid #334155; }
            .badge { background: #10b981; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 13px; }
            .code { background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #38bdf8; overflow-x: auto; }
            h2 { margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">&#10003; Autenticado con éxito</span>
            <h2>AWS Builder ID Login Exitoso</h2>
            <p>Se completó el intercambio de credenciales mediante <strong>OAuth 2.0 + PKCE</strong>.</p>
            <div class="code">
              <strong>Token almacenado:</strong> Estrictamente en memoria (RAM)<br>
              <strong>Items en agenda:</strong> ${scheduleResult.items.length}<br>
              <strong>Favoritos:</strong> ${favorites.length}
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">
              Puedes cerrar esta pestaña y volver a la terminal.
            </p>
          </div>
        </body>
        </html>
      `);

      console.log('\n' + '='.repeat(65));
      console.log('  Prueba completada satisfactoriamente. Cerrando servidor.');
      console.log('='.repeat(65));

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1500);
    } catch (err) {
      console.error('Error durante el callback:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error durante la autenticación: ' + String(err));
      server.close();
      process.exit(1);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Servidor local de callback activo en: http://localhost:${PORT}`);
  console.log(`Para completar el flujo automáticamente, visita en tu navegador:`);
  console.log(`👉 http://localhost:${PORT}/callback?code=test-code-123&state=${state}\n`);
  console.log('Esperando callback...');
});
