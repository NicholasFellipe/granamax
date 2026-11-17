function App() {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#22C55E' }}>🎉 GranaMax - Teste</h1>
      <p>Se você está vendo esta mensagem, o React está funcionando!</p>
      <button 
        style={{ 
          padding: '10px 20px', 
          background: '#22C55E', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Botão funcionando!')}
      >
        Clique para testar
      </button>
    </div>
  );
}

export default App;
