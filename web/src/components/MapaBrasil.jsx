import { useMemo, useState } from 'react';
import brasil from '@svg-maps/brazil';
import { NOMES_UF, corCandidato, nomeTitulo, percentual, votos } from '../services/formato.js';

/**
 * Mapa do Brasil colorido por quem lidera: vermelho (Lula, 13) e azul (Flávio, 22).
 * Modo "Estados": cada UF com a cor do líder no estado.
 * Modo "Regiões": cada região com a cor do líder na soma dos votos da região.
 * As cores mudam sozinhas a cada atualização (30 s).
 *
 * Contornos: @svg-maps/brazil (CC BY 4.0, Victor Cazanave).
 */
export const REGIOES = [
  { id: 'norte', nome: 'Norte', ufs: ['ac', 'ap', 'am', 'pa', 'ro', 'rr', 'to'] },
  { id: 'nordeste', nome: 'Nordeste', ufs: ['al', 'ba', 'ce', 'ma', 'pb', 'pe', 'pi', 'rn', 'se'] },
  { id: 'centro-oeste', nome: 'Centro-Oeste', ufs: ['df', 'go', 'ms', 'mt'] },
  { id: 'sudeste', nome: 'Sudeste', ufs: ['es', 'mg', 'rj', 'sp'] },
  { id: 'sul', nome: 'Sul', ufs: ['pr', 'rs', 'sc'] },
];
// Posição aproximada do nome de cada região no viewBox do mapa (613 x 639)
const ROTULOS_REGIAO = {
  norte: [200, 190],
  nordeste: [520, 215],
  'centro-oeste': [300, 330],
  sudeste: [440, 430],
  sul: [335, 545],
};
const REGIAO_DA_UF = Object.fromEntries(REGIOES.flatMap((r) => r.ufs.map((uf) => [uf, r])));

/** Líder de uma lista de candidatos; null em empate ou sem votos. */
function liderDe(candidatos) {
  const [a, b] = [...candidatos].sort((x, y) => y.votos - x.votos);
  return a && a.votos > (b?.votos ?? 0) ? a.numero : null;
}

/** Soma os votos das UFs de cada região e recalcula o % entre os candidatos. */
function agregarRegioes(porUf) {
  return REGIOES.map((regiao) => {
    const somas = new Map();
    let somaSecoes = 0;
    let ufsComDados = 0;
    for (const uf of regiao.ufs) {
      const e = porUf[uf];
      if (!e || e.erro) continue;
      ufsComDados += 1;
      somaSecoes += e.secoes;
      for (const c of e.candidatos) {
        const atual = somas.get(c.numero) || { numero: c.numero, nome: c.nome, votos: 0 };
        atual.votos += c.votos;
        somas.set(c.numero, atual);
      }
    }
    const candidatos = [...somas.values()].sort((a, b) => b.votos - a.votos);
    const total = candidatos.reduce((s, c) => s + c.votos, 0);
    for (const c of candidatos) c.percentual = total ? (c.votos / total) * 100 : 0;
    return {
      ...regiao,
      candidatos,
      lider: liderDe(candidatos),
      // média simples do andamento das UFs da região (indicativo)
      secoes: ufsComDados ? somaSecoes / ufsComDados : 0,
      finalizada: ufsComDados === regiao.ufs.length && regiao.ufs.every((uf) => porUf[uf].finalizada),
    };
  });
}

export default function MapaBrasil({ estados, candidatos }) {
  const [modo, setModo] = useState('estados');
  const [selecionado, setSelecionado] = useState(null); // sigla da UF clicada

  const porUf = useMemo(() => Object.fromEntries((estados || []).map((e) => [e.uf, e])), [estados]);
  const regioes = useMemo(() => agregarRegioes(porUf), [porUf]);

  if (!estados) return null;

  const porRegiao = Object.fromEntries(regioes.map((r) => [r.id, r]));
  const lista = modo === 'regioes' ? regioes : estados;
  const contagem = (numero) => lista.filter((x) => x.lider === numero).length;

  /** Cor de preenchimento da UF conforme o modo. */
  function corDaUf(uf) {
    const lider = modo === 'regioes' ? porRegiao[REGIAO_DA_UF[uf].id].lider : porUf[uf]?.lider;
    return lider ? corCandidato(lider) : 'var(--cor-vazio)';
  }

  const alternar = (uf) => setSelecionado(selecionado === uf ? null : uf);
  const ufSel = selecionado && porUf[selecionado];
  const regiaoSel = selecionado && porRegiao[REGIAO_DA_UF[selecionado].id];

  return (
    <section className="cartao" aria-label="Mapa do resultado">
      <div className="mapa-topo">
        <h2>Quem lidera em cada {modo === 'regioes' ? 'região' : 'estado'}</h2>
        <div className="alternador" role="tablist" aria-label="Ver mapa por">
          {[
            ['estados', 'Estados'],
            ['regioes', 'Regiões'],
          ].map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={modo === id}
              className={modo === id ? 'ativo' : ''}
              onClick={() => setModo(id)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="legenda">
        {candidatos.map((c) => (
          <span key={c.numero} className="legenda-item">
            <span className="legenda-cor" style={{ background: corCandidato(c.numero) }} />
            {nomeTitulo(c.nome)} na frente em <strong>{contagem(c.numero)}</strong>
            {modo === 'regioes' ? ' regiões' : ' estados'}
          </span>
        ))}
      </div>

      <div className="mapa-area">
        <svg
          className={`mapa-svg ${modo === 'regioes' ? 'modo-regioes' : ''}`}
          viewBox={brasil.viewBox}
          role="group"
          aria-label="Mapa do Brasil"
        >
          {brasil.locations.map((loc) => {
            const e = porUf[loc.id];
            const primeiro = e?.candidatos?.[0];
            const descricao =
              e?.erro || !primeiro ? 'sem dados' : `${nomeTitulo(primeiro.nome)} ${percentual(primeiro.percentual)}`;
            return (
              <path
                key={loc.id}
                d={loc.path}
                className={`uf-forma ${selecionado === loc.id ? 'selecionada' : ''}`}
                style={{ '--preenchimento': corDaUf(loc.id) }}
                tabIndex={0}
                role="button"
                aria-label={`${loc.name}: ${descricao}`}
                onClick={() => alternar(loc.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    alternar(loc.id);
                  }
                }}
              >
                <title>{`${loc.name}: ${descricao}`}</title>
              </path>
            );
          })}
          {modo === 'regioes' &&
            regioes.map((r) => (
              <text key={r.id} x={ROTULOS_REGIAO[r.id][0]} y={ROTULOS_REGIAO[r.id][1]} className="rotulo-regiao">
                {r.nome}
              </text>
            ))}
        </svg>

        <div className="mapa-detalhe">
          {modo === 'estados' && ufSel && <Detalhe titulo={NOMES_UF[ufSel.uf]} item={ufSel} />}
          {modo === 'regioes' && regiaoSel && <Detalhe titulo={`Região ${regiaoSel.nome}`} item={regiaoSel} />}
          {!selecionado && <p className="detalhe">Toque em um estado para ver os números.</p>}

          <h3 className="titulo-regioes">Por região</h3>
          <ul className="mini-lista">
            {regioes.map((r) => (
              <li key={r.id}>
                <span className="legenda-cor" style={{ background: r.lider ? corCandidato(r.lider) : 'var(--cor-vazio)' }} />
                <span className="mini-nome">{r.nome}</span>
                {r.candidatos[0]?.votos > 0 ? (
                  <span>
                    {nomeTitulo(r.candidatos[0].nome)} <strong>{percentual(r.candidatos[0].percentual)}</strong>
                  </span>
                ) : (
                  <span className="mini-votos">aguardando</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Números de uma UF ou região selecionada. */
function Detalhe({ titulo, item }) {
  return (
    <>
      <h3>{titulo}</h3>
      {item.erro ? (
        <p className="detalhe">{item.erro}</p>
      ) : (
        <>
          <p className="detalhe">
            {percentual(item.secoes)} das seções{item.finalizada ? ' · totalização final' : ''}
          </p>
          <ul className="mini-lista">
            {item.candidatos.map((c) => (
              <li key={c.numero}>
                <span className="legenda-cor" style={{ background: corCandidato(c.numero) }} />
                <span className="mini-nome">{nomeTitulo(c.nome)}</span>
                <span className="mini-votos">{votos(c.votos)}</span>
                <strong>{percentual(c.percentual)}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
