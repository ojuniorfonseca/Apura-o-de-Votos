/**
 * Configuração única da eleição acompanhada.
 *
 * Códigos oficiais publicados pelo TSE em
 * https://resultados.tse.jus.br/oficial/comum/config/ele-c.json
 *   6257 = Eleição Ordinária Federal 2026, 1º turno (04/10/2026)
 *   6258 = Eleição Ordinária Federal 2026, 2º turno (25/10/2026)
 *
 * Todos os valores podem ser sobrescritos por variáveis de ambiente.
 */
export const config = {
  porta: Number(process.env.PORT || 3001),
  base: process.env.TSE_BASE || 'https://resultados.tse.jus.br',
  ambiente: process.env.TSE_AMBIENTE || 'oficial',
  ciclo: process.env.TSE_CICLO || 'ele2026',
  eleicao: process.env.TSE_ELEICAO || '6258',
  cargo: '0001', // Presidente da República
  cacheMs: Number(process.env.CACHE_MS || 30_000),
  timeoutMs: Number(process.env.TSE_TIMEOUT_MS || 10_000),
  // Modo demonstração: usa dados fictícios gerados localmente (útil fora do dia da eleição)
  mock: process.env.TSE_MOCK === '1',
};

// As 27 unidades da federação (o exterior, "zz", aparece só no total Brasil)
export const UFS = [
  'ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa',
  'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to',
];

/** Monta a URL do arquivo de resultado unificado (EA20, sufixo -u.json). */
export function urlResultado(abrangencia) {
  const ab = abrangencia.toLowerCase();
  const ele = config.eleicao.padStart(6, '0');
  return `${config.base}/${config.ambiente}/${config.ciclo}/${config.eleicao}/dados/${ab}/${ab}-c${config.cargo}-e${ele}-u.json`;
}

/** URL da foto oficial do candidato pelo número sequencial (sqcand). */
export function urlFoto(sqcand) {
  return `${config.base}/${config.ambiente}/${config.ciclo}/${config.eleicao}/fotos/br/${sqcand}.jpeg`;
}
