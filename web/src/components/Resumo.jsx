import { percentual, votos } from '../services/formato.js';

/** Votos válidos, brancos, nulos, comparecimento e abstenção. */
export default function Resumo({ dados }) {
  const linhas = [
    ['Votos válidos', dados.validos],
    ['Brancos', dados.brancos],
    ['Nulos', dados.nulos],
    ['Comparecimento', dados.comparecimento],
    ['Abstenção', dados.abstencao],
  ];
  return (
    <section className="cartao" aria-label="Resumo da votação">
      <h2>Resumo</h2>
      <dl className="resumo">
        {linhas.map(([rotulo, item]) => (
          <div key={rotulo} className="resumo-linha">
            <dt>{rotulo}</dt>
            <dd>
              <span>{votos(item.votos)}</span>
              <span className="resumo-pct">{percentual(item.percentual)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {dados.eleitorado !== null && <p className="detalhe">Eleitorado apto: {votos(dados.eleitorado)}</p>}
    </section>
  );
}
