/** Chamadas à API local (o servidor Express faz o proxy e o cache do TSE). */

async function getJson(caminho) {
  const resposta = await fetch(caminho, { headers: { Accept: 'application/json' } });
  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch {
    // resposta sem JSON (servidor fora do ar, por exemplo)
  }
  if (!resposta.ok) {
    throw new Error(corpo?.erro || `Falha ao consultar a apuração (HTTP ${resposta.status})`);
  }
  return corpo;
}

export const buscarBrasil = () => getJson('/api/brasil');
export const buscarEstados = () => getJson('/api/estados');
export const urlFoto = (sqcand) => (sqcand ? `/api/foto/${sqcand}` : null);
