/** Avisos de modo demonstração e de falha na comunicação com o TSE. */
export default function Avisos({ erro, mock, temDados }) {
  return (
    <>
      {mock && (
        <div className="aviso aviso-mock" role="note">
          <strong>Modo demonstração:</strong> os números abaixo são fictícios e servem só para testar o painel.
        </div>
      )}
      {erro && (
        <div className="aviso aviso-erro" role="alert">
          <strong>{temDados ? 'Exibindo o último dado disponível.' : 'Ainda sem dados.'}</strong> {erro}. Nova tentativa em
          instantes.
        </div>
      )}
    </>
  );
}
