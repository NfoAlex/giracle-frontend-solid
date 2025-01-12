import { useLocation, useNavigate, useParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import GET_USER_VERIFY_TOKEN from "~/api/USER/USER_VERIFY_TOKEN";
import Login from "~/components/Auth/Login";
import Register from "~/components/Auth/Register";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { storeAppStatus } from "~/stores/AppStatus";
import { storeServerinfo } from "~/stores/Serverinfo";
import GetCookie from "~/utils/GetCookie";
import InitLoad from "~/utils/InitLoad";

export default function Auth() {
  const [mode, setMode] = createSignal<"login" | "register">("login");
  const navi = useNavigate();
  const loc = useLocation();

  onMount(async () => {
    //クッキーにTokenがあれば初期処理をして移動
    const token = GetCookie("token");
    if (token !== undefined) {
      await GET_USER_VERIFY_TOKEN().then((r) => {
        InitLoad(r.data.userId);
        //もともと行こうとしていた場所を指定
        navi(loc.search.split("?redirect=")[1] || "/");
      });
    }
  });

  return (
    <div class="pt-5 px-2 max-w-[450px] mx-auto ">
      <p class="text-2xl">{storeServerinfo.name || "Giracle"}</p>
      <Card class="w-full mx-auto py-4">
        <CardContent class="grid- gap-3">
          <Tabs defaultValue="login">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>

            <Show
              when={storeAppStatus.hasServerinfo}
              fallback={<p>loading...</p>}
            >
              <TabsContent value="login">
                <Login />
              </TabsContent>
              <TabsContent value="register">
                <Register />
              </TabsContent>
            </Show>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
