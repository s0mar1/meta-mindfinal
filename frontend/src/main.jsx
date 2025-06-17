import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import { TFTDataProvider } from './context/TFTDataContext.jsx'; 
import './index.css' // 기본 CSS가 있다면 유지

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TFTDataProvider>
     <BrowserRouter>
      <App />
     </BrowserRouter>
    </TFTDataProvider>
  </React.StrictMode>,
)