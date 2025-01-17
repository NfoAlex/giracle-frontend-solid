/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router, useNavigate } from "@solidjs/router";

import './index.css';
import { createEffect, type JSX, lazy, on, onMount, Show, Suspense } from 'solid-js';
import { storeAppStatus } from './stores/AppStatus';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/Sidebar';
import Channel from './routes/channel/[id]';
import GET_SERVER_CONFIG from './api/SERVER/SERVER_CONFIG';
import { setStoreServerinfo, storeServerinfo } from './stores/Serverinfo';
import { HasAnythingNew } from './stores/HasNewMessage';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

//サーバー情報を取得
GET_SERVER_CONFIG()
  .then((r) => {
    console.log("AuthGuard : GET_SERVER_CONFIG r->", r);
    setStoreServerinfo ({
      ...storeServerinfo,
      ...r.data,
    });
    storeAppStatus.hasServerinfo = true;
  })
  .catch((e) => {
    console.error("AuthGuard :: GET_SERVER_CONFIG e->", e);
  });

const AuthGuard = (props: {children?: JSX.Element}) => {
  const navi = useNavigate();

  const checkAuth = () => {
    if (!storeAppStatus.loggedIn) navi(`/auth?redirect=${location.pathname}`);
  }

  onMount(checkAuth);

  //ページの移動監視用
  createEffect(() => {
    //console.log("index :: wrapper : createEffect");
    checkAuth();
  });

  //新着状態監視用
  createEffect(
    on(() => HasAnythingNew(),
    () => {
    if (HasAnythingNew()) {
      document.title = "(*) Giracle"
    } else {
      document.title = "Giracle"
    }
  }));

  return (
    <div class="w-full h-screen">
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
        <Route path="/:channelId" component={Channel} />
      </Route>
      <Route path="/profile" component={lazy(() => import("./routes/profile"))} />
      <Route path="/channel-browser" component={lazy(() => import("./routes/channel-browser"))} />
    </Route>
  </Router>,
  root!
);
