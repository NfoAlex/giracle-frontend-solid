import {IconCheck, IconCircleX, IconMoonFilled, IconPencil, IconSunFilled} from "@tabler/icons-solidjs";
import { Show, createSignal } from "solid-js";
import POST_USER_PROFILE_UPDATE from "~/api/USER/USER_PROFILE_UPDATE";
import ChangeIcon from "~/components/Profile/ChangeIcon";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";
import ChangeBanner from "~/components/Profile/ChangeBanner";
import {useColorMode} from "@kobalte/core";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";

export default function Profile() {
  const [nameEditMode, setNameEditMode] = createSignal(false);
  const [newName, setNewName] = createSignal(storeMyUserinfo.name);
  const [selfIntroEditMode, setSelfIntroEditMode] = createSignal(false);
  const [newSelfIntro, setNewSelfIntro] = createSignal(
    storeMyUserinfo.selfIntroduction,
  );
  const { setColorMode, colorMode } = useColorMode()

  /**
   * 名前の変更
   */
  const changeName = () => {
    POST_USER_PROFILE_UPDATE(newName(), undefined)
      .then((r) => {
        //自分の情報を更新
        setStoreMyUserinfo({
          ...storeMyUserinfo,
          name: r.data.name ? r.data.name : storeMyUserinfo.name,
        });
        //名前編集モードをやめる
        setNameEditMode(false);
      })
      .catch((e) => {
        console.log("profile :: changeName : e->", e);
      });
  };

  /**
   * 自己紹介の変更
   */
  const changeSelfIntro = () => {
    POST_USER_PROFILE_UPDATE(undefined, newSelfIntro())
      .then((r) => {
        //自分の情報を更新
        setStoreMyUserinfo({
          ...storeMyUserinfo,
          selfIntroduction: r.data.selfIntroduction
            ? r.data.selfIntroduction
            : storeMyUserinfo.selfIntroduction,
        });
        //名前編集モードをやめる
        setSelfIntroEditMode(false);
      })
      .catch((e) => {
        console.log("profile :: changeSelfIntro : e->", e);
      });
  };

  return (
    <div class="md:max-w-[450px] w-11/12 h-full mx-auto flex flex-col gap-2">
      <span class="flex items-center gap-2">
        <p class="font-bold text-2xl my-2">プロフィール</p>
      </span>
      <Card class="w-full">
        <CardHeader>
          <div class={"relative mb-[37.5px]"}>
            <img alt={"バナー画像"} src={"/api/user/banner/" + storeMyUserinfo.id} class="w-full rounded" />
            <span class={"absolute top-2 right-2 z-50"}>
              <ChangeBanner />
            </span>

            <Avatar
              class="mx-auto h-[75px] w-[75px] absolute z-50"
              style={"left:calc(50% - 37.5px); right:left:calc(50% - 37.5px); bottom:-37.5px;"}
            >
              <AvatarImage src={`/api/user/icon/${storeMyUserinfo.id}`}/>
            </Avatar>
          </div>
        </CardHeader>
        
        <div class="mx-auto w-fit">
          <ChangeIcon/>
        </div>

        <CardContent class="mt-10">
          <div class="w-full mx-auto">
            {/* 名前部分 */}
            <Label>名前</Label>
            <Show
              when={nameEditMode()}
              fallback={
                <div class="flex flex-row items-center gap-2">
                  <p class="grow truncate">{storeMyUserinfo.name}</p>
                  <Button onClick={() => setNameEditMode(!nameEditMode())} size={"icon"}>
                    <IconPencil stroke="2"/>
                  </Button>
                </div>
              }
            >
              <div class="flex md:flex-row flex-col gap-2">
                <TextField class="grow">
                  <TextFieldInput
                    type="text"
                    placeholder="新しいユーザー名"
                    value={newName()}
                    onInput={(e) => setNewName(e.currentTarget.value)}
                  />
                </TextField>
                <div class="flex flex-row items-center gap-1">
                  <Button onClick={changeName} variant={"ghost"} size={"icon"}>
                    <IconCheck stroke="2"/>
                  </Button>
                  <Button
                    onClick={() => setNameEditMode(!nameEditMode())}
                    variant={"ghost"}
                    size={"icon"}
                  >
                    <IconCircleX stroke="2"/>
                  </Button>
                </div>
              </div>
            </Show>

            <hr class="my-3"/>

            {/* 自己紹介部分 */}
            <Label>自己紹介</Label>
            <Show
              when={selfIntroEditMode()}
              fallback={
                <div class="flex flex-row items-center gap-2">
                  <p class="grow truncate">
                    {storeMyUserinfo.selfIntroduction}
                  </p>
                  <Button
                    onClick={() => setSelfIntroEditMode(!selfIntroEditMode())}
                    size={"icon"}
                  >
                    <IconPencil stroke="2"/>
                  </Button>
                </div>
              }
            >
              <div class="flex md:flex-row flex-col gap-2">
                <TextField class="grow">
                  <TextFieldInput
                    type="text"
                    placeholder="新しい自己紹介文"
                    value={newSelfIntro()}
                    onInput={(e) => setNewSelfIntro(e.currentTarget.value)}
                  />
                </TextField>
                <div class="flex flex-row items-center gap-1">
                  <Button
                    onClick={changeSelfIntro}
                    variant={"ghost"}
                    size={"icon"}
                  >
                    <IconCheck stroke="2"/>
                  </Button>
                  <Button
                    onClick={() => setSelfIntroEditMode(!selfIntroEditMode())}
                    variant={"ghost"}
                    size={"icon"}
                  >
                    <IconCircleX stroke="2"/>
                  </Button>
                </div>
              </div>
            </Show>

            <hr class="my-3"/>

            {/* ロール一覧 */}
            <Label>ロール</Label>
            <p>Coming soon...</p>

            <hr class="my-3"/>

            <div class={"flex flex-col gap-2"}>
              <Label>テーマ</Label>
              <div class={"mx-auto"}>
                {colorMode() === "dark" && <IconMoonFilled onClick={()=>setColorMode("light")} />}
                {colorMode() === "light" && <IconSunFilled onClick={()=>setColorMode("dark")} />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="px-4 py-2 flex items-center mt-auto">
        <p>バージョン : </p>
        <p class="ml-auto">
          {
            //@ts-ignore: __VERSION__はvite.config.tsで定義されている
            __VERSION__
          }
        </p>
      </Card>
    </div>
  );
}
