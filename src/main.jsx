import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx' // IMPORTARLO

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary> {/* ENVOLVER LA APP AQUÍ */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)