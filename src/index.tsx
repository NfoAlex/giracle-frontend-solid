/* @refresh reload */
import { render } from 'solid-js/web';
import { Router } from "@solidjs/router";

import './index.css';
import App from './App';
import { lazy } from 'solid-js';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const routes = [
  {
    path: "/",
    component: lazy(() => import("./routes/index")),
  },
  {
    path: "/auth",
    component: lazy(() => import("./routes/auth")),
  },
];

render(() => <Router>{ routes }</Router>, root!);
