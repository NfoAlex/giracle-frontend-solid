import {createEffect, JSX, on} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {storeAppStatus} from "~/stores/AppStatus.store.ts";
import {useStoreHasNewMessage} from "~/stores/HasNewMessage.store.ts";

export default function AuthGuard(props: {children?: JSX.Element}) {
  const navi = useNavigate();

  const checkAuth = () => {
    //searchも含めて元の場所へ戻せるように
    if (!storeAppStatus.loggedIn)
      navi(`/auth?redirect=${location.pathname}${location.search}`);
  };

  //loggedIn監視(WSのtoken not valid → falseで/authへ)。マウント時にも実行される
  createEffect(() => checkAuth());

  //新着状態監視用
  createEffect(
    on(() => useStoreHasNewMessage.HasAnythingNew(), (hasNew) => {
      //タブのテキストとfaviconを変更
      document.title = hasNew ? "(*) Giracle" : "Giracle";
      const link = document.getElementById("favicon") as HTMLLinkElement;
      if (link) link.href = hasNew ? "/favicon_dot.svg" : "/favicon.svg";
    })
  );

  return (
    <div class="w-full h-screen">
      {props.children}
    </div>
  );
}