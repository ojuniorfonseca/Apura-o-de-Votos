import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, numero, resumoUf } from '../src/services/normalizar.js';
import { jsonFicticio } from '../src/services/mock.js';

// Recorte no formato do arquivo EA20 do TSE
const exemplo = {
  ele: '6258',
  t: '2',
  cdabr: 'BR',
  and: 'p',
  dg: '25/10/2026',
  hg: '19:42:10',
  s: { ts: '472075', st: '401264', pst: '85,00' },
  e: { te: '156000000', c: '123000000', a: '33000000', pa: '21,15' },
  v: { vv: '117000000', vb: '1800000', pvb: '1,46', tvn: '4200000', ptvn: '3,41' },
  carg: [{
    agr: [
      { par: [{ sg: 'PL', cand: [{ n: '22', nm: 'FLAVIO BOLSONARO', sqcand: '2', vap: '57000000', pvap: '48,72', st: '' }] }] },
      { par: [{ sg: 'PT', cand: [{ n: '13', nm: 'LULA', sqcand: '1', vap: '60000000', pvap: '51,28', st: '' }] }] },
    ],
  }],
};

test('numero entende vírgula decimal do TSE', () => {
  assert.equal(numero('50,90'), 50.9);
  assert.equal(numero('123456'), 123456);
  assert.equal(numero(''), null);
  assert.equal(numero(undefined), null);
});

test('normalizar lê campos aninhados e ordena por votos', () => {
  const d = normalizar(exemplo);
  assert.equal(d.abrangencia, 'br');
  assert.equal(d.secoes.percentual, 85);
  assert.equal(d.candidatos[0].nome, 'LULA');
  assert.equal(d.candidatos[0].partido, 'PT');
  assert.equal(d.candidatos[0].percentual, 51.28);
  assert.equal(d.nulos.percentual, 3.41);
  assert.equal(d.abstencao.votos, 33000000);
  // pc ausente: calculado a partir de comparecimento / eleitorado
  assert.equal(d.comparecimento.percentual, 78.85);
  assert.equal(d.finalizada, false);
});

test('resumoUf aponta o líder', () => {
  assert.equal(resumoUf(normalizar(exemplo)).lider, '13');
});

test('dados fictícios seguem o formato do TSE', () => {
  const d = normalizar(jsonFicticio('br'));
  assert.equal(d.candidatos.length, 2);
  assert.ok(d.secoes.percentual >= 0 && d.secoes.percentual <= 100);
});
