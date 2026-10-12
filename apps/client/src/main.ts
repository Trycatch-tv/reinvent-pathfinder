import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    React.createElement(ErrorBoundary, null, React.createElement(App))
  );
}
