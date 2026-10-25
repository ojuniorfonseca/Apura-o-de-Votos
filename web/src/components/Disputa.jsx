import { useState } from 'react';
import { corCandidato, iniciais, nomeTitulo, percentual, votos } from '../services/formato.js';
import { urlFoto } from '../services/api.js';

function Foto({ candidato }) {
  const [falhou, setFalhou] = useState(false);
  const src = urlFoto(candidato.sqcand);
  return (
    <div className="foto" style={{ '--cor': corCandidato(candidato.numero) }}>
      {src && !falhou ? (
        <img src={src} alt="" onError={() => setFalhou(true)} />
      ) : (
        <span aria-hidden="true">{iniciais(candidato.nome)}</span>
      )}
    </div>
  );
}

/** Ranking dos candidatos e barra de disputa direta. */
export default function Disputa({ candidatos }) {
  const [a, b] = candidatos;
  const total = (a?.votos || 0) + (b?.votos || 0);
  const parteA = total ? (a.votos / total) * 100 : 50;

  return (
    <section className="cartao" aria-label="Candidatos">
      <ol className="candidatos">
        {candidatos.map((c, i) => (
          <li
            key={c.numero}
            className={`candidato ${i === 0 && c.votos > 0 ? 'lider' : ''}`}
            style={{ '--cor': corCandidato(c.numero) }}
          >
            <Foto candidato={c} />
            <div className="candidato-info">
              <div className="candidato-nome">
                {nomeTitulo(c.nome)}
                {c.eleito && <span className="etiqueta-eleito">Eleito</span>}
              </div>
              <div className="candidato-partido">
                {c.partido} · {c.numero}
              </div>
            </div>
            <div className="candidato-numeros">
              <div className="candidato-pct">{percentual(c.percentual)}</div>
              <div className="candidato-votos">{votos(c.votos)} votos</div>
            </div>
          </li>
        ))}
      </ol>

      {a && b && (
        <div className="cabo" aria-hidden="true">
          <div className="cabo-a" style={{ width: `${parteA}%`, background: corCandidato(a.numero) }} />
          <div className="cabo-b" style={{ background: corCandidato(b.numero) }} />
          <div className="cabo-meio" title="50% dos votos válidos" />
        </div>
      )}
      {a && b && total > 0 && (
        <p className="detalhe centro">
          Diferença: {votos(a.votos - b.votos)} votos ({percentual(Math.abs(a.percentual - b.percentual)).replace('%', '')} p.p.)
        </p>
      )}
    </section>
  );
}
