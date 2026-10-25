/**
 * API da apuração: proxy com cache para os arquivos públicos do TSE.
 *
 * Rotas:
 *   GET /api/brasil        resultado nacional
 *   GET /api/estados       líder e andamento de cada UF (para o mapa)
 *   GET /api/uf/:uf        resultado completo de uma UF
 *   GET /api/foto/:sqcand  foto oficial do candidato
 *   GET /api/saude         status do servidor
 */
import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config, UFS, urlResultado, urlFoto } from './config.js';
import { buscarJson, emLotes, ErroTse } from './services/tse.js';
import { normalizar, resumoUf } from './services/normalizar.js';
import { jsonFicticio } from './services/mock.js';

const app = express();

/** Busca e normaliza uma abrangência (real ou fictícia). */
async function obter(abrangencia) {
  if (config.mock) {
    return { dados: normalizar(jsonFicticio(abrangencia)), buscadoEm: Date.now(), desatualizado: false, erro: null };
  }
  const { json, ...meta } = await buscarJson(urlResultado(abrangencia));
  return { dados: normalizar(json), ...meta };
}

function responderErro(res, erro) {
  const status = erro instanceof ErroTse ? erro.status : 500;
  if (!(erro instanceof ErroTse)) console.error(erro);
  res.status(status).json({ erro: erro.message || 'Erro inesperado' });
}

// O navegador pode consultar de novo após 15 s; o cache real fica no servidor
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=15');
  next();
});

app.get('/api/saude', (_req, res) => {
  res.json({ ok: true, eleicao: config.eleicao, mock: config.mock });
});

app.get('/api/brasil', async (_req, res) => {
  try {
    const r = await obter('br');
    res.json({ ...r, mock: config.mock });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/uf/:uf', async (req, res) => {
  const uf = req.params.uf.toLowerCase();
  if (!UFS.includes(uf) && uf !== 'zz') return res.status(400).json({ erro: 'UF inválida' });
  try {
    res.json({ ...(await obter(uf)), mock: config.mock });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/estados', async (_req, res) => {
  // Até 5 downloads simultâneos, bem abaixo do limite de 100 req/s do TSE
  const estados = await emLotes(UFS, 5, async (uf) => {
    try {
      const { dados, desatualizado } = await obter(uf);
      return { ...resumoUf(dados), desatualizado };
    } catch (erro) {
      return { uf, erro: erro.message };
    }
  });
  res.json({ estados, mock: config.mock });
});

app.get('/api/foto/:sqcand', async (req, res) => {
  const { sqcand } = req.params;
  if (!/^\d{1,20}$/.test(sqcand) || config.mock) return res.status(404).end();
  try {
    const resposta = await fetch(urlFoto(sqcand), { signal: AbortSignal.timeout(config.timeoutMs) });
    if (!resposta.ok) return res.status(404).end();
    res.set('Content-Type', resposta.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await resposta.arrayBuffer()));
  } catch {
    res.status(404).end();
  }
});

// Em produção, serve o frontend já compilado (npm run build)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(config.porta, () => {
  const modo = config.mock ? 'DEMONSTRAÇÃO (dados fictícios)' : `TSE oficial, eleição ${config.eleicao}`;
  console.log(`API da apuração em http://localhost:${config.porta} | ${modo}`);
});
