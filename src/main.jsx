import { createRoot } from 'react-dom/client';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { store } from '@/store';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <ReduxProvider store={store}>
    <BrowserRouter>
      <NuqsAdapter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </NuqsAdapter>
    </BrowserRouter>
  </ReduxProvider>,
);
