/**
 * Baixa o resultado do Brasil e das 27 UFs no TSE e grava ao-vivo/atual.json,
 * no formato do documento "apuracao/atual" que a página ao vivo lê.
 *
 * Uso: node ao-vivo/coletar.mjs [arquivo-de-saida]
 * Mesma URL, códigos e normalização do servidor (server/src).
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { UFS, urlResultado } from '../server/src/config.js';
import { normalizar, resumoUf } from '../server/src/services/normalizar.js';
import { emLotes } from '../server/src/services/tse.js';

const saida = process.argv[2] || new URL('./atual.json', import.meta.url).pathname;

async function baixar(abrangencia) {
  const r = await fetch(urlResultado(abrangencia), { signal: AbortSignal.timeout(15000) });
  if (r.status === 404) throw new Error('arquivo ainda não publicado pelo TSE');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return normalizar(await r.json());
}

const anterior = existsSync(saida) ? JSON.parse(readFileSync(saida, 'utf8')) : null;
const doc = { atualizadoEm: new Date().toISOString(), fonte: urlResultado('br') };

try {
  doc.brasil = await baixar('br');
} catch (erro) {
  // Mantém o último dado nacional e registra a falha
  if (anterior?.brasil) doc.brasil = anterior.brasil;
  doc.erro = erro.message;
}

const anteriores = Object.fromEntries((anterior?.estados || []).map((e) => [e.uf, e]));
doc.estados = await emLotes(UFS, 5, async (uf) => {
  try {
    return resumoUf(await baixar(uf));
  } catch (erro) {
    return anteriores[uf] && !anteriores[uf].erro ? anteriores[uf] : { uf, erro: erro.message };
  }
});

writeFileSync(saida, JSON.stringify(doc));
const b = doc.brasil;
console.log(
  b
    ? `TSE ${b.data} ${b.hora} | ${b.secoes.percentual}% seções | ` +
        b.candidatos.map((c) => `${c.nome} ${c.percentual}%`).join(' x ')
    : 'sem dado nacional',
  doc.erro ? `| erro: ${doc.erro}` : '',
  `| UFs com erro: ${doc.estados.filter((e) => e.erro).length}`,
);
