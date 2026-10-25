import { percentual, votos } from '../services/formato.js';

/** Percentual de seções totalizadas e horário da última totalização do TSE. */
export default function Progresso({ dados }) {
  const { secoes, data, hora } = dados;
  return (
    <section className="cartao progresso" aria-label="Andamento da apuração">
      <div className="progresso-topo">
        <span className="progresso-valor">{percentual(secoes.percentual)}</span>
        <span className="progresso-rotulo">das seções totalizadas</span>
      </div>
      <div
        className="barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={secoes.percentual}
        aria-label="Seções totalizadas"
      >
        <div className="barra-preenchida" style={{ width: `${secoes.percentual}%` }} />
      </div>
      <p className="detalhe">
        {secoes.totalizadas !== null && secoes.total !== null && (
          <>
            {votos(secoes.totalizadas)} de {votos(secoes.total)} seções ·{' '}
          </>
        )}
        Última atualização do TSE: {data || '—'} às {hora || '—'} (horário de Brasília)
      </p>
    </section>
  );
}
