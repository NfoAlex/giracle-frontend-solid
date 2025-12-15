/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router, useLocation, useNavigate } from "@solidjs/router";

import '@fontsource-variable/noto-sans-jp';
import './index.css';

import { lazy, Show, Suspense } from 'solid-js';
import { storeAppStatus } from './stores/AppStatus.ts';
import { SidebarProvider } from './components/ui/sidebar.tsx';
import { AppSidebar } from './components/Sidebar.tsx';
import Channel from './routes/channel/[id].tsx';
import GET_SERVER_CONFIG from './api/SERVER/SERVER_CONFIG.ts';
import { setStoreServerinfo, storeServerinfo } from './stores/Serverinfo.ts';
import {ColorModeProvider, ColorModeScript, createLocalStorageManager} from "@kobalte/core";
import AuthGuard from "~/components/AuthGuard.tsx";
import SwipeToOpenSidebarWrapper from "~/components/unique/SwipeToOpenSidebarWrapper.tsx";

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

//サーバー情報を取得
GET_SERVER_CONFIG()
  .then((r) => {
    //console.log("AuthGuard : GET_SERVER_CONFIG r->", r);
    setStoreServerinfo ({
      ...storeServerinfo,
      ...r.data,
    });
    storeAppStatus.hasServerinfo = true;
  })
  .catch((e) => {
    console.error("AuthGuard :: GET_SERVER_CONFIG e->", e);
  });

const TopForMoving = () => {
  const navi = useNavigate();
  navi("/app");

  return (
    <p>移動します...</p>
  )
}

const storageManager = createLocalStorageManager("vite-ui-theme")
render(() => 
  <Router root={(props) => (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <SidebarProvider>
          <Show when={useLocation().pathname.startsWith("/app")}>
            <AppSidebar />
          </Show>
          <Suspense>
            {/* サイドバーを考慮した幅指定をしてメッセージレンダー部分の変なオーバーフローを無くす */}
            <div class={"md:w-[calc(100%-16rem)] w-screen mx-auto"}>{props.children}</div>
          </Suspense>
        </SidebarProvider>
      </ColorModeProvider>
    </>
  )}>
    <Route path="/" component={TopForMoving} />
    <Route path="/auth" component={lazy(() => import("./routes/auth.tsx"))} />
    <Route path="*paramName" component={lazy(() => import("./routes/[...404].tsx"))} />
    <Route path="/app" component={AuthGuard}>
      <SwipeToOpenSidebarWrapper>
        <Route path="/" component={lazy(() => import("./routes/index.tsx"))} />
        <Route path="/channel">
          <Route path="/:channelId" component={Channel} />
        </Route>
        <Route path="/online-user" component={lazy(() => import("./routes/online-user.tsx"))} />
        <Route path="/config" component={lazy(() => import("./routes/config.tsx"))} />
        <Route path="/inbox" component={lazy(() => import("./routes/Inbox.tsx"))} />
        <Route path="/channel-browser" component={lazy(() => import("./routes/channel-browser.tsx"))} />
        <Route path="/search" component={lazy(() => import("./routes/search.tsx"))} />
        <Route path="/manage-server" component={lazy(() => import("./routes/manage-server.tsx"))} />
        <Route path="*paramName" component={lazy(() => import("./routes/[...404].tsx"))} />
      </SwipeToOpenSidebarWrapper>
    </Route>
  </Router>,
  root!
);
