import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error crítico:", error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm("¿Seguro? Esto borrará todos los datos corruptos y recargará la página.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-red-50 p-10 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-red-100 max-w-lg">
            <h1 className="text-3xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal</h1>
            <p className="text-gray-600 mb-6">
              Se detectaron datos corruptos en el horario que impiden cargar la aplicación.
            </p>
            <div className="bg-gray-100 p-4 rounded text-xs font-mono text-left mb-6 overflow-auto max-h-32 text-red-800">
                {this.state.error?.toString()}
            </div>
            <button 
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              🗑️ BORRAR DATOS Y REINICIAR
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;