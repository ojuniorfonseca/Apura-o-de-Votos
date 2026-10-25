/** Formatação no padrão brasileiro. */

const inteiro = new Intl.NumberFormat('pt-BR');
const pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const votos = (n) => (n === null || n === undefined ? '—' : inteiro.format(n));
export const percentual = (n) => (n === null || n === undefined ? '—' : `${pct.format(n)}%`);

/** Cor fixa por número de urna, para manter a mesma cor em toda a página. */
const CORES = { 13: 'var(--cor-13)', 22: 'var(--cor-22)' };
export const corCandidato = (numero) => CORES[numero] || 'var(--cor-outro)';

/** Iniciais para o avatar quando a foto não carrega. */
export const iniciais = (nome) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

/** Nome em caixa de título: "FLAVIO BOLSONARO" -> "Flavio Bolsonaro". */
export const nomeTitulo = (nome) =>
  nome.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

export const NOMES_UF = {
  ac: 'Acre', al: 'Alagoas', am: 'Amazonas', ap: 'Amapá', ba: 'Bahia', ce: 'Ceará',
  df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão',
  mg: 'Minas Gerais', ms: 'Mato Grosso do Sul', mt: 'Mato Grosso', pa: 'Pará',
  pb: 'Paraíba', pe: 'Pernambuco', pi: 'Piauí', pr: 'Paraná', rj: 'Rio de Janeiro',
  rn: 'Rio Grande do Norte', ro: 'Rondônia', rr: 'Roraima', rs: 'Rio Grande do Sul',
  sc: 'Santa Catarina', se: 'Sergipe', sp: 'São Paulo', to: 'Tocantins',
};
