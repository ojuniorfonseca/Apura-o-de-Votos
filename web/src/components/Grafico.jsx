import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { nomeTitulo, percentual, votos } from '../services/formato.js';
import { useCoresCss } from '../hooks/useCoresCss.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const VARIAVEIS = ['--cor-13', '--cor-22', '--cor-outro', '--cor-branco', '--cor-nulo', '--texto', '--superficie'];

/** Gráfico de rosca: votos de cada candidato, brancos e nulos. */
export default function Grafico({ dados }) {
  const cores = useCoresCss(VARIAVEIS);
  const corDe = (numero) => cores[`--cor-${numero}`] || cores['--cor-outro'];

  const fatias = [
    ...dados.candidatos.map((c) => ({ rotulo: nomeTitulo(c.nome), valor: c.votos, cor: corDe(c.numero) })),
    { rotulo: 'Brancos', valor: dados.brancos.votos || 0, cor: cores['--cor-branco'] },
    { rotulo: 'Nulos', valor: dados.nulos.votos || 0, cor: cores['--cor-nulo'] },
  ];
  const total = fatias.reduce((s, f) => s + f.valor, 0);

  const data = {
    labels: fatias.map((f) => f.rotulo),
    datasets: [{
      data: fatias.map((f) => f.valor),
      backgroundColor: fatias.map((f) => f.cor),
      borderColor: cores['--superficie'],
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    animation: { duration: 400 },
    plugins: {
      legend: { position: 'bottom', labels: { color: cores['--texto'], usePointStyle: true, padding: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${votos(ctx.raw)} votos (${percentual(total ? (ctx.raw / total) * 100 : 0)} do comparecimento)`,
        },
      },
    },
  };

  return (
    <section className="cartao" aria-label="Distribuição dos votos">
      <h2>Distribuição dos votos</h2>
      <div className="grafico">
        {total > 0 ? <Doughnut data={data} options={options} /> : <p className="detalhe">Aguardando os primeiros votos.</p>}
      </div>
    </section>
  );
}
