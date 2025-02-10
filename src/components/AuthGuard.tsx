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
        if (HasAnythingNew()) {
          document.title = "(*) Giracle"
        } else {
          document.title = "Giracle"
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