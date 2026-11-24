import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/tokens.css'
import './styles/globals.css'

// StrictMode desligado de propósito: evita double-mount do WebGL/AudioContext em dev.
// (Ambos os subsistemas limparem corretamente, mas criar contextos GPU duas vezes
//  por render é custo desnecessário no OneDrive/laptop.)
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)
