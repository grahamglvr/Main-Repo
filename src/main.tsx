import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

// No StrictMode: its double mount creates and destroys the Phaser game twice in development.
createRoot(document.getElementById('root')!).render(<App />);
