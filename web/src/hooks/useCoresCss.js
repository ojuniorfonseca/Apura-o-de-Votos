import { useEffect, useState } from 'react';

/**
 * Lê variáveis CSS (cores do tema) para usar no Chart.js, que não entende var(--x).
 * Atualiza quando o usuário troca o tema ou o sistema muda entre claro/escuro.
 */
export function useCoresCss(nomes) {
  const ler = () => {
    const estilo = getComputedStyle(document.documentElement);
    return Object.fromEntries(nomes.map((n) => [n, estilo.getPropertyValue(n).trim()]));
  };
  const [cores, setCores] = useState(ler);

  useEffect(() => {
    const atualizar = () => setCores(ler());
    const midia = window.matchMedia('(prefers-color-scheme: dark)');
    midia.addEventListener('change', atualizar);
    const observador = new MutationObserver(atualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      midia.removeEventListener('change', atualizar);
      observador.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cores;
}
