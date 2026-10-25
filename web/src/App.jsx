import { useEffect, useState } from 'react';
import { useApuracao } from './hooks/useApuracao.js';
import Cabecalho from './components/Cabecalho.jsx';
import Avisos from './components/Avisos.jsx';
import Progresso from './components/Progresso.jsx';
import Disputa from './components/Disputa.jsx';
import Grafico from './components/Grafico.jsx';
import Resumo from './components/Resumo.jsx';
import MapaBrasil from './components/MapaBrasil.jsx';

/** Lê o tema salvo; sem preferência salva, segue o sistema operacional. */
function temaInicial() {
  try {
    return localStorage.getItem('tema');
  } catch {
    return null;
  }
}

export default function App() {
  const { brasil, estados, erro, carregando, consultadoEm, atualizar } = useApuracao();
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    if (tema) document.documentElement.dataset.theme = tema;
    else delete document.documentElement.dataset.theme;
  }, [tema]);

  function alternarTema() {
    const escuroAtual =
      tema === 'dark' || (!tema && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const novo = escuroAtual ? 'light' : 'dark';
    setTema(novo);
    try {
      localStorage.setItem('tema', novo);
    } catch {
      // armazenamento indisponível (aba privada): o tema vale só nesta visita
    }
  }

  const dados = brasil?.dados;

  return (
    <div className="pagina">
      <Cabecalho
        dados={dados}
        consultadoEm={consultadoEm}
        comErro={Boolean(erro)}
        aoAlternarTema={alternarTema}
        aoAtualizar={atualizar}
      />
      <main className="conteudo">
        <Avisos erro={erro} mock={brasil?.mock} temDados={Boolean(dados)} />

        {carregando && !dados && <div className="carregando" aria-busy="true">Carregando apuração…</div>}

        {dados && (
          <>
            <Progresso dados={dados} />
            <Disputa candidatos={dados.candidatos} />
            <div className="grade">
              <Grafico dados={dados} />
              <Resumo dados={dados} />
            </div>
            <MapaBrasil estados={estados} candidatos={dados.candidatos} />
          </>
        )}
      </main>
      <footer className="rodape">
        Fonte: <a href="https://resultados.tse.jus.br" target="_blank" rel="noreferrer">Tribunal Superior Eleitoral</a>.
        Atualização automática a cada 30 segundos. Resultado oficial somente após a totalização pelo TSE. Mapa: @svg-maps/brazil (CC BY 4.0).
      </footer>
    </div>
  );
}
