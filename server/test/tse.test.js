import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { buscarJson, limparCache, ErroTse } from '../src/services/tse.js';

const URL_TESTE = 'https://exemplo.invalid/br.json';

beforeEach(() => {
  limparCache();
  config.cacheMs = 0; // sempre tenta de novo nos testes
});

test('devolve o último dado válido quando o TSE falha', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 });
  const primeiro = await buscarJson(URL_TESTE);
  assert.deepEqual(primeiro.json, { ok: 1 });
  assert.equal(primeiro.desatualizado, false);

  globalThis.fetch = async () => {
    throw new Error('rede fora');
  };
  const segundo = await buscarJson(URL_TESTE);
  assert.deepEqual(segundo.json, { ok: 1 });
  assert.equal(segundo.desatualizado, true);
});

test('404 sem dado anterior vira ErroTse 404', async () => {
  globalThis.fetch = async () => new Response('', { status: 404 });
  await assert.rejects(buscarJson(URL_TESTE), (e) => e instanceof ErroTse && e.status === 404);
});

test('respeita o cache dentro da janela', async () => {
  config.cacheMs = 60_000;
  let chamadas = 0;
  globalThis.fetch = async () => {
    chamadas += 1;
    return new Response(JSON.stringify({ n: chamadas }), { status: 200 });
  };
  await buscarJson(URL_TESTE);
  await buscarJson(URL_TESTE);
  assert.equal(chamadas, 1);
});
