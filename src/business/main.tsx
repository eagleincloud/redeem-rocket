import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/index.css';
import './theme/modern-theme.css';

createRoot(document.getElementById('root')!).render(<App />);
