import {createEffect, JSX, on, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {storeAppStatus} from "~/stores/AppStatus";
import {HasAnythingNew} from "~/stores/HasNewMessage";

export default function AuthGuard(props: {children?: JSX.Element}) {
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
        //タブのテキストとfaviconを変更
        if (HasAnythingNew()) {
          document.title = "(*) Giracle"
          const link = document.getElementById("favicon") as HTMLLinkElement;
          if (link)
            link.href = "/favicon_dot.svg";
        } else {
          document.title = "Giracle";
          const link = document.getElementById("favicon") as HTMLLinkElement;
          if (link)
            link.href = "/favicon.svg";
        }
      }
    )
  );

  return (
    <div class="w-full h-screen">
      {props.children}
    </div>
  );
}