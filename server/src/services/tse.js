/**
 * Cliente do TSE com cache em memória.
 *
 * - Cada URL fica em cache por `config.cacheMs` (30 s por padrão), então
 *   qualquer número de navegadores gera no máximo uma requisição ao TSE
 *   por arquivo a cada 30 s.
 * - Envia If-None-Match / If-Modified-Since: o CDN do TSE responde 304
 *   quando nada mudou, economizando banda.
 * - Se o TSE falhar, devolve o último dado válido marcado como `desatualizado`.
 * - Respostas 404 (arquivo ainda não gerado) também ficam em cache, porque
 *   muitos 404 seguidos podem bloquear o IP no CDN do TSE.
 */
import { config } from '../config.js';

const cache = new Map(); // url -> { json, etag, lastModified, buscadoEm, erro }
const emAndamento = new Map(); // url -> Promise (evita requisições duplicadas)

export class ErroTse extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

async function baixar(url, anterior) {
  const headers = { Accept: 'application/json' };
  if (anterior?.etag) headers['If-None-Match'] = anterior.etag;
  if (anterior?.lastModified) headers['If-Modified-Since'] = anterior.lastModified;

  const resposta = await fetch(url, { headers, signal: AbortSignal.timeout(config.timeoutMs) });

  if (resposta.status === 304 && anterior?.json) {
    return { ...anterior, buscadoEm: Date.now(), erro: null };
  }
  if (resposta.status === 404) {
    throw new ErroTse('O TSE ainda não publicou este arquivo', 404);
  }
  if (!resposta.ok) {
    throw new ErroTse(`O TSE respondeu com HTTP ${resposta.status}`, 502);
  }
  return {
    json: await resposta.json(),
    etag: resposta.headers.get('etag'),
    lastModified: resposta.headers.get('last-modified'),
    buscadoEm: Date.now(),
    erro: null,
  };
}

/**
 * Busca um JSON do TSE respeitando o cache.
 * Retorna { json, buscadoEm, desatualizado, erro }.
 */
export async function buscarJson(url) {
  const atual = cache.get(url);
  if (atual && Date.now() - atual.buscadoEm < config.cacheMs) return resultado(atual);

  if (!emAndamento.has(url)) {
    const promessa = baixar(url, atual)
      .then((novo) => {
        cache.set(url, novo);
        return novo;
      })
      .catch((erro) => {
        const status = erro instanceof ErroTse ? erro.status : 504;
        const mensagem = erro instanceof ErroTse ? erro.message : 'Não foi possível acessar o TSE';
        // Mantém o último dado válido e registra o erro até a próxima tentativa
        const registro = { ...(atual || {}), buscadoEm: Date.now(), erro: { status, mensagem } };
        cache.set(url, registro);
        return registro;
      })
      .finally(() => emAndamento.delete(url));
    emAndamento.set(url, promessa);
  }

  return resultado(await emAndamento.get(url));
}

function resultado(registro) {
  if (!registro.json) {
    throw new ErroTse(registro.erro?.mensagem || 'Dados indisponíveis', registro.erro?.status || 502);
  }
  return {
    json: registro.json,
    buscadoEm: registro.buscadoEm,
    desatualizado: Boolean(registro.erro),
    erro: registro.erro?.mensagem || null,
  };
}

/** Executa tarefas assíncronas com limite de concorrência. */
export async function emLotes(itens, limite, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await tarefa(itens[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

/** Usado nos testes. */
export function limparCache() {
  cache.clear();
}
