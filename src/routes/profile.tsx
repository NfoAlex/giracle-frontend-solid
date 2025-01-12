import { IconCheck, IconCircleX, IconPencil } from "@tabler/icons-solidjs";
import { Show, createSignal } from "solid-js";
import POST_USER_PROFILE_UPDATE from "~/api/USER/USER_PROFILE_UPDATE";
import ChangeIcon from "~/components/Profile/ChangeIcon";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function Profile() {
  const [nameEditMode, setNameEditMode] = createSignal(false);
  const [newName, setNewName] = createSignal(storeMyUserinfo.name);
  const [selfIntroEditMode, setSelfIntroEditMode] = createSignal(false);
  const [newSelfIntro, setNewSelfIntro] = createSignal(
    storeMyUserinfo.selfIntroduction,
  );

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
    <div class="md:max-w-[450px] w-11/12 mx-auto">
      <span class="flex items-center gap-2">
        <SidebarTrigger />
        <p class="font-bold text-2xl my-2">プロフィール</p>
      </span>
      <Card class="w-full">
        <CardHeader>
          <Avatar class="mx-auto h-[75px] w-auto">
            <AvatarImage src={`/api/user/icon/${storeMyUserinfo.id}`} />
          </Avatar>
        </CardHeader>

        <div class="mx-auto w-fit">
          <ChangeIcon />
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
                  <Button onClick={() => setNameEditMode(!nameEditMode())}>
                    <IconPencil stroke="2" />
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
                  <Button class="w-1/2" onClick={changeName} variant={"ghost"}>
                    <IconCheck stroke="2" />
                  </Button>
                  <Button
                    class="w-1/2"
                    onClick={() => setNameEditMode(!nameEditMode())}
                    variant={"ghost"}
                  >
                    <IconCircleX stroke="2" />
                  </Button>
                </div>
              </div>
            </Show>

            <hr class="my-3" />

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
                  >
                    <IconPencil stroke="2" />
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
                    class="w-1/2"
                    onClick={changeSelfIntro}
                    variant={"ghost"}
                  >
                    <IconCheck stroke="2" />
                  </Button>
                  <Button
                    class="w-1/2"
                    onClick={() => setSelfIntroEditMode(!selfIntroEditMode())}
                    variant={"ghost"}
                  >
                    <IconCircleX stroke="2" />
                  </Button>
                </div>
              </div>
            </Show>

            <hr class="my-3" />

            {/* ロール一覧 */}
            <Label>ロール</Label>
            <p>Coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
