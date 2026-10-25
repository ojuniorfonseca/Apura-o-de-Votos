/**
 * Converte o JSON bruto do TSE (EA20) em um formato simples para o frontend.
 *
 * Estrutura relevante do arquivo do TSE:
 *   dg, hg            data e hora da última totalização (horário de Brasília)
 *   cdabr             abrangência (BR, SP, ...)
 *   s.pst / s.st / s.ts   % de seções totalizadas, totalizadas, total
 *   e.te / e.c / e.a  eleitorado, comparecimento, abstenção (e.pc / e.pa em %)
 *   v.vv / v.vb / v.tvn   votos válidos, brancos e nulos (pvb / ptvn em %)
 *   carg[0].agr[].par[].cand[]  candidatos (n, nm, sqcand, vap, pvap, st)
 *
 * Percentuais exibidos vêm dos campos oficiais; nada é recalculado,
 * exceto quando o TSE não informa o campo.
 */

/** "12,34" ou "1234" -> número. Retorna null quando vazio ou inválido. */
export function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  let texto = String(valor).trim();
  // O TSE usa vírgula como separador decimal ("50,90")
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

/** Percentual com fallback para cálculo próprio quando o TSE não informa. */
function percentual(oficial, parte, total) {
  const p = numero(oficial);
  if (p !== null) return p;
  if (parte === null || !total) return null;
  return Math.round((parte / total) * 10000) / 100;
}

export function normalizar(json) {
  const s = json?.s || {};
  const e = json?.e || {};
  const v = json?.v || {};

  const candidatos = [];
  for (const agr of json?.carg?.[0]?.agr || []) {
    for (const par of agr.par || []) {
      for (const cand of par.cand || []) {
        candidatos.push({
          numero: String(cand.n ?? ''),
          sqcand: String(cand.sqcand ?? ''),
          nome: cand.nmu || cand.nm || 'Candidato',
          partido: par.sg || '',
          coligacao: agr.nm || '',
          votos: numero(cand.vap) ?? 0,
          percentual: numero(cand.pvap) ?? 0,
          situacao: cand.st || '',
          eleito: /^eleito/i.test(cand.st || ''),
        });
      }
    }
  }
  candidatos.sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome, 'pt'));

  const eleitorado = numero(e.te);
  const comparecimento = numero(e.c);
  const abstencao = numero(e.a);
  const validos = numero(v.vv);
  const brancos = numero(v.vb);
  const nulos = numero(v.tvn);

  return {
    abrangencia: String(json?.cdabr || '').toLowerCase(),
    turno: String(json?.t || ''),
    data: json?.dg || '',
    hora: json?.hg || '',
    // "f" indica totalização final na abrangência
    finalizada: json?.and === 'f',
    secoes: {
      percentual: numero(s.pst) ?? 0,
      totalizadas: numero(s.st),
      total: numero(s.ts),
    },
    eleitorado,
    comparecimento: { votos: comparecimento, percentual: percentual(e.pc, comparecimento, eleitorado) },
    abstencao: { votos: abstencao, percentual: percentual(e.pa, abstencao, eleitorado) },
    validos: { votos: validos, percentual: percentual(v.pvv, validos, comparecimento) },
    brancos: { votos: brancos, percentual: percentual(v.pvb, brancos, comparecimento) },
    nulos: { votos: nulos, percentual: percentual(v.ptvn, nulos, comparecimento) },
    candidatos,
  };
}

/** Versão enxuta para o mapa: só o líder e o andamento de cada UF. */
export function resumoUf(dados) {
  const [primeiro, segundo] = dados.candidatos;
  return {
    uf: dados.abrangencia,
    secoes: dados.secoes.percentual,
    finalizada: dados.finalizada,
    hora: dados.hora,
    lider: primeiro && primeiro.votos > (segundo?.votos ?? 0) ? primeiro.numero : null,
    candidatos: dados.candidatos.map(({ numero, nome, votos, percentual }) => ({ numero, nome, votos, percentual })),
  };
}
