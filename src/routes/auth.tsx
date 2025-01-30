import { useLocation, useNavigate } from "@solidjs/router";
import { Show, onMount } from "solid-js";
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
  const navi = useNavigate();
  const loc = useLocation();

  onMount(async () => {
    console.log("Auth.tsx onMount :: import.meta.env", import.meta);
    //クッキーにTokenがあれば初期処理をして移動
    const token = GetCookie("token");
    if (token !== undefined) {
      await GET_USER_VERIFY_TOKEN().then((r) => {
        InitLoad(r.data.userId);
        //もともと行こうとしていた場所を指定
        if (loc.search.split("?redirect=")[1]) {
          navi(`${loc.search.split("?redirect=")[1]}`);
        } else {
          navi("/app");
        }
      });
    }
  });

  return (
    <div class="pt-5 px-2 max-w-[500px] w-full mx-auto flex flex-col gap-4 md:justify-center">
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

      <Card class={"justify-self-end p-4 px-4 flex items-center"}>
        <p class={"font-bold"}>Giracle</p>
        <p class={"ml-auto"}>
          {
            //@ts-ignore: __VERSION__はvite.config.tsで定義されている
            __VERSION__
          }
        </p>
      </Card>
    </div>
  );
}
