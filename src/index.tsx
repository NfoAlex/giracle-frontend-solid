/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router, useNavigate } from "@solidjs/router";

import './index.css';
import { createEffect, type JSX, lazy, onMount } from 'solid-js';
import { storeAppStatus } from './stores/AppStatus';

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

const AuthGuard = (props: {children?: JSX.Element}) => {
  const navi = useNavigate();

  createEffect(() => {
    console.log("index :: wrapper : createEffect");
    if (!storeAppStatus.loggedIn) navi("/auth");
  });

  return (
    <div>
      <p>レイアウトテスト</p>
      {props.children}
    </div>
  );
}

render(() => 
  <Router>
    <Route path="/auth" component={lazy(() => import("./routes/auth"))} />
    <Route path="/app" component={AuthGuard}>
      <Route path="/" component={lazy(() => import("./routes/index"))} />
    </Route>
  </Router>,
  root!
);
