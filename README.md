# Apuração ao vivo: 2º turno presidencial 2026

Painel que acompanha em tempo real a apuração do **2º turno da eleição para Presidente da República (25/10/2026)** usando os arquivos públicos do TSE.

- Percentual de seções totalizadas e horário da última totalização
- Lula (13) x Flávio Bolsonaro (22): votos, % dos válidos, diferença e selo de eleito
- Gráfico de rosca (Chart.js) com candidatos, brancos e nulos
- Resumo: válidos, brancos, nulos, comparecimento e abstenção
- **Mapa do Brasil por estado e por região**: vermelho onde Lula lidera, azul onde Flávio lidera; as cores mudam sozinhas conforme a apuração avança
- Atualização automática a cada 30 s, indicador "ao vivo", modo claro/escuro, layout para celular
- Se o TSE ficar fora do ar, continua mostrando o último dado recebido

## Como rodar

Requer Node.js 18 ou mais recente.

```bash
npm install
npm run dev
```

Abra http://localhost:5173. O comando sobe o servidor da API (porta 3001) e o frontend Vite juntos.

### Modo demonstração

Fora do horário da apuração (ou sem acesso ao TSE), use dados **fictícios** que simulam a apuração de 0% a 100% em 10 minutos:

```bash
npm run dev:mock
```

A página mostra uma faixa amarela avisando que os números são fictícios.

### Produção

```bash
npm run build   # gera web/dist
npm start       # Express serve a API e o site em http://localhost:3001
```

## Como funciona

```
navegador  ──/api──▶  Express (cache 30 s)  ──▶  resultados.tse.jus.br
```

O servidor Express funciona como proxy: cada arquivo do TSE é baixado no máximo uma vez a cada 30 s, não importa quantas pessoas estejam com a página aberta. Ele envia `If-None-Match`/`If-Modified-Since` (o CDN do TSE responde 304 quando nada mudou) e baixa as UFs com no máximo 5 conexões simultâneas. O TSE bloqueia por 10 minutos IPs que passam de 100 requisições por segundo ou geram muitos 404, por isso respostas 404 também ficam em cache.

### Arquivos do TSE usados

| O quê | URL |
|---|---|
| Brasil | `https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json` |
| Cada UF | `https://resultados.tse.jus.br/oficial/ele2026/6258/dados/{uf}/{uf}-c0001-e006258-u.json` |
| Foto | `https://resultados.tse.jus.br/oficial/ele2026/6258/fotos/br/{sqcand}.jpeg` |

`6258` é o código da Eleição Ordinária Federal 2026, 2º turno, conforme `https://resultados.tse.jus.br/oficial/comum/config/ele-c.json`. `0001` é o cargo de Presidente.

Campos lidos (arquivo de resultado unificado EA20): `dg`/`hg` (data e hora), `s.pst`/`s.st`/`s.ts` (seções), `e.te`/`e.c`/`e.a` (eleitorado, comparecimento, abstenção), `v.vv`/`v.vb`/`v.tvn` (válidos, brancos, nulos) e `carg[0].agr[].par[].cand[]` (candidatos: `n`, `nm`, `vap`, `pvap`, `st`). Os percentuais exibidos são os oficiais; só são calculados quando o TSE não informa o campo.

### Variáveis de ambiente (servidor)

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3001` | Porta do Express |
| `TSE_ELEICAO` | `6258` | Código da eleição (ex.: `6257` para testar com o 1º turno) |
| `CACHE_MS` | `30000` | Tempo de cache por arquivo |
| `TSE_MOCK` | | `1` liga o modo demonstração |
| `TSE_MOCK_MINUTOS` | `10` | Duração da apuração simulada |

## Estrutura

```
server/
  src/index.js              rotas /api/brasil, /api/estados, /api/uf/:uf, /api/foto/:sqcand
  src/config.js             códigos da eleição e URLs do TSE
  src/services/tse.js       download com cache, ETag e fallback para o último dado
  src/services/normalizar.js  converte o JSON do TSE no formato do frontend
  src/services/mock.js      dados fictícios para o modo demonstração
  test/                     testes (npm test)
web/
  src/hooks/useApuracao.js  polling de 30 s, pausa com a aba oculta
  src/components/           Cabecalho, Progresso, Disputa, Grafico, Resumo, MapaBrasil, Avisos
  src/services/             chamadas à API e formatação pt-BR
```

## Créditos

- Dados: [Tribunal Superior Eleitoral](https://resultados.tse.jus.br). O resultado oficial é o divulgado pelo TSE.
- Contornos do mapa: [@svg-maps/brazil](https://github.com/VictorCazanave/svg-maps/tree/master/packages/brazil), de Victor Cazanave, licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
