import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './styles/global.css'
import './styles/ticketsGlobal.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// 2. Leer el ID desde tu archivo .env
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

console.log("MI CLIENT ID DE GOOGLE ES:", clientId)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Envolver la App con el proveedor */}
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
