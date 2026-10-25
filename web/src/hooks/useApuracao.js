import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarBrasil, buscarEstados } from '../services/api.js';

export const INTERVALO_MS = 30_000;

/**
 * Consulta a apuração a cada 30 s sem recarregar a página.
 * - Mantém o último dado válido quando uma consulta falha.
 * - Pausa enquanto a aba está oculta e atualiza ao voltar.
 */
export function useApuracao() {
  const [brasil, setBrasil] = useState(null);
  const [estados, setEstados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [consultadoEm, setConsultadoEm] = useState(null);
  const timer = useRef(null);

  const atualizar = useCallback(async () => {
    clearTimeout(timer.current);
    const [rBrasil, rEstados] = await Promise.allSettled([buscarBrasil(), buscarEstados()]);

    if (rBrasil.status === 'fulfilled') {
      setBrasil(rBrasil.value);
      setErro(rBrasil.value.desatualizado ? rBrasil.value.erro : null);
    } else {
      setErro(rBrasil.reason.message);
    }
    if (rEstados.status === 'fulfilled') setEstados(rEstados.value.estados);

    setConsultadoEm(new Date());
    setCarregando(false);
    if (!document.hidden) timer.current = setTimeout(atualizar, INTERVALO_MS);
  }, []);

  useEffect(() => {
    atualizar();
    const aoMudarVisibilidade = () => {
      if (document.hidden) clearTimeout(timer.current);
      else atualizar();
    };
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, [atualizar]);

  return { brasil, estados, erro, carregando, consultadoEm, atualizar };
}
