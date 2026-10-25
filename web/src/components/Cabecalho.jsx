/** Título, indicador "ao vivo" e botões de tema e atualização. */
export default function Cabecalho({ dados, consultadoEm, comErro, aoAlternarTema, aoAtualizar }) {
  const finalizada = dados?.finalizada;
  const estado = comErro ? 'instavel' : finalizada ? 'final' : 'vivo';
  const rotulo = { vivo: 'Ao vivo', final: 'Totalização final', instavel: 'Reconectando' }[estado];

  return (
    <header className="cabecalho">
      <div>
        <p className="sobretitulo">Eleições 2026 · 2º turno</p>
        <h1>Presidente da República</h1>
      </div>
      <div className="cabecalho-acoes">
        <span className={`selo selo-${estado}`} role="status">
          <span className="ponto" aria-hidden="true" />
          {rotulo}
        </span>
        {consultadoEm && (
          <span className="consultado">
            consultado às {consultadoEm.toLocaleTimeString('pt-BR')}
          </span>
        )}
        <button type="button" className="botao-icone" onClick={aoAtualizar} title="Atualizar agora" aria-label="Atualizar agora">
          ↻
        </button>
        <button type="button" className="botao-icone" onClick={aoAlternarTema} title="Alternar tema claro/escuro" aria-label="Alternar tema claro/escuro">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
