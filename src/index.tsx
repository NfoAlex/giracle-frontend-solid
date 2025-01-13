/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router, useNavigate } from "@solidjs/router";

import './index.css';
import { createEffect, type JSX, lazy, onMount, Show, Suspense } from 'solid-js';
import { storeAppStatus } from './stores/AppStatus';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/Sidebar';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

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
  <Router root={(props) => (
    <>
      <SidebarProvider>
        <Show when={location.pathname !== "/auth"}>
          <AppSidebar />
        </Show>
        <Suspense>{props.children}</Suspense>
      </SidebarProvider>
    </>
  )}>
    <Route path="/auth" component={lazy(() => import("./routes/auth"))} />
    <Route path="/app" component={AuthGuard}>
      <Route path="/" component={lazy(() => import("./routes/index"))} />
      <Route path="/channel">
        <Route path="/:channelId" component={lazy(() => import("./routes/channel/[id]"))} />
      </Route>
    </Route>
  </Router>,
  root!
);
