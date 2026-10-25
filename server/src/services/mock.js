/**
 * Gerador de dados FICTÍCIOS no mesmo formato do TSE (EA20).
 *
 * Ativado com TSE_MOCK=1. Simula a apuração avançando de 0% a 100%
 * em cerca de 10 minutos a partir do início do servidor, para testar a
 * interface fora do dia da eleição. Os números não são resultados reais.
 */
import { UFS } from '../config.js';

// Duração da apuração simulada (minutos), ajustável por TSE_MOCK_MINUTOS
const DURACAO_MS = Number(process.env.TSE_MOCK_MINUTOS || 10) * 60 * 1000;
const inicio = Date.now();

// Eleitorado aproximado (milhares) e inclinação fictícia (% do candidato 13)
const PERFIL = {
  ac: [600, 32], al: [2400, 58], am: [2700, 50], ap: [560, 47], ba: [11300, 70],
  ce: [7000, 66], df: [2200, 42], es: [3000, 43], go: [5000, 38], ma: [5100, 68],
  mg: [16300, 50], ms: [2000, 38], mt: [2500, 35], pa: [6200, 54], pb: [3100, 64],
  pe: [7100, 66], pi: [2600, 74], pr: [8600, 37], rj: [12800, 44], rn: [2600, 63],
  ro: [1200, 30], rr: [370, 26], rs: [8600, 43], sc: [5600, 33], se: [1700, 64],
  sp: [34500, 44], to: [1100, 49], zz: [700, 48],
};

const CANDIDATOS = [
  { n: '13', nm: 'LULA', sg: 'PT', sqcand: '' },
  { n: '22', nm: 'FLAVIO BOLSONARO', sg: 'PL', sqcand: '' },
];

const fmt = (n) => n.toFixed(2).replace('.', ',');

function horaAtual() {
  const agora = new Date();
  const opcoes = { timeZone: 'America/Sao_Paulo' };
  return {
    dg: agora.toLocaleDateString('pt-BR', opcoes),
    hg: agora.toLocaleTimeString('pt-BR', { ...opcoes, hour12: false }),
  };
}

/** Progresso (0..1) de uma UF: estados menores terminam antes. */
function progresso(uf) {
  const atraso = (uf.charCodeAt(0) + uf.charCodeAt(1)) % 7 / 20;
  const t = (Date.now() - inicio) / DURACAO_MS;
  return Math.max(0, Math.min(1, (t - atraso * 0.3) / (1 - atraso * 0.3)));
}

function totaisUf(uf) {
  const [mil, inclinacao] = PERFIL[uf];
  const p = progresso(uf);
  const eleitorado = mil * 1000;
  const comparecimento = Math.round(eleitorado * 0.79 * p);
  const brancos = Math.round(comparecimento * 0.015);
  const nulos = Math.round(comparecimento * 0.035);
  const validos = comparecimento - brancos - nulos;
  // Pequena oscilação conforme a apuração avança, como numa apuração real
  const parcela = Math.min(0.95, Math.max(0.05, (inclinacao + (0.5 - p) * 4) / 100));
  const votos13 = Math.round(validos * parcela);
  return { eleitorado, comparecimento, brancos, nulos, validos, votos: [votos13, validos - votos13], p };
}

function montarJson(abrangencia, t) {
  const secoesTotal = Math.round(t.eleitorado / 330);
  const finalizada = t.p >= 1;
  const pct = (parte, total) => fmt(total ? (parte / total) * 100 : 0);
  return {
    ele: '6258',
    t: '2',
    cdabr: abrangencia.toUpperCase(),
    and: finalizada ? 'f' : 'p',
    ...horaAtual(),
    s: { ts: String(secoesTotal), st: String(Math.round(secoesTotal * t.p)), pst: fmt(t.p * 100) },
    e: {
      te: String(t.eleitorado),
      c: String(t.comparecimento),
      pc: pct(t.comparecimento, t.eleitorado),
      a: String(t.eleitorado - t.comparecimento),
      pa: pct(t.eleitorado - t.comparecimento, t.eleitorado),
    },
    v: {
      vv: String(t.validos),
      pvv: pct(t.validos, t.comparecimento),
      vb: String(t.brancos),
      pvb: pct(t.brancos, t.comparecimento),
      tvn: String(t.nulos),
      ptvn: pct(t.nulos, t.comparecimento),
    },
    carg: [{
      cd: '1',
      agr: CANDIDATOS.map((c, i) => {
        const vencedor = finalizada && t.votos[i] > t.votos[1 - i];
        return {
          nm: '',
          par: [{
            sg: c.sg,
            cand: [{
              n: c.n,
              nm: c.nm,
              sqcand: c.sqcand,
              vap: String(t.votos[i]),
              pvap: pct(t.votos[i], t.validos),
              st: finalizada && abrangencia === 'br' ? (vencedor ? 'Eleito' : 'Não eleito') : '',
            }],
          }],
        };
      }),
    }],
  };
}

/** Devolve um JSON fictício para a abrangência pedida ("br" ou sigla da UF). */
export function jsonFicticio(abrangencia) {
  if (abrangencia !== 'br') return montarJson(abrangencia, totaisUf(abrangencia));

  // Brasil = soma das UFs + exterior
  const soma = { eleitorado: 0, comparecimento: 0, brancos: 0, nulos: 0, validos: 0, votos: [0, 0] };
  let totalizadas = 0;
  for (const uf of [...UFS, 'zz']) {
    const t = totaisUf(uf);
    for (const k of ['eleitorado', 'comparecimento', 'brancos', 'nulos', 'validos']) soma[k] += t[k];
    soma.votos[0] += t.votos[0];
    soma.votos[1] += t.votos[1];
    totalizadas += t.eleitorado * t.p;
  }
  soma.p = totalizadas / soma.eleitorado;
  return montarJson('br', soma);
}
