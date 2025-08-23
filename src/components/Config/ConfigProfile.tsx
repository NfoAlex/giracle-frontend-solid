import {IconCheck, IconCircleX, IconPencil} from "@tabler/icons-solidjs";
import { For, Show, createSignal } from "solid-js";
import POST_USER_PROFILE_UPDATE from "~/api/USER/USER_PROFILE_UPDATE";
import ChangeIcon from "~/components/Profile/ChangeIcon";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { getRolePower, setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";
import ChangeBanner from "~/components/Profile/ChangeBanner";
import RoleChip from "../unique/RoleChip";
import POST_ROLE_UNLINK from "~/api/ROLE/ROLE_UNLINK";

export default function ConfigProfile() {
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
        console.error("profile :: changeName : e->", e);
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
        console.error("profile :: changeSelfIntro : e->", e);
      });
  };

  /**
     * ロールを解除
     */
  const unlinkRole = (roleId: string) => {
    POST_ROLE_UNLINK(storeMyUserinfo.id, roleId)
      .then(() => {
        //console.log("RoleChip :: unlinkRole :: r ->", r);
      })
      .catch((e) => console.error("ConfigProfile :: unlinkRole :: err ->", e));
  }

  return (
    <div class="md:max-w-[750px] w-11/12 h-full overflow-y-auto mx-auto flex flex-col gap-2">
      <span class="flex items-center gap-2">
        <p class="font-bold text-2xl my-2">プロフィール</p>
      </span>
      <Card class="w-full">
        <CardHeader>
          <div class={"relative"}>
            <img alt={"バナー画像"} src={"/api/user/banner/" + storeMyUserinfo.id} class="w-full rounded" />
            <span class={"absolute bottom-2 right-2 z-50"}>
              <ChangeBanner />
            </span>
          </div>
        </CardHeader>

        <CardContent>

          <div class="w-full mx-auto flex flex-col gap-4">
            <span class="w-full flex md:flex-row flex-col gap-2 items-center">
              <Avatar
                class="w-16 h-16 z-50 mx-auto md:mx-0"
              >
                <AvatarImage src={`/api/user/icon/${storeMyUserinfo.id}`}/>
              </Avatar>
              <span class="md:ml-auto md:mr-0 mx-auto">
                <ChangeIcon />
              </span>
            </span>

            <hr />

            {/* 名前部分 */}
            <span>
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
            </span>

            <hr />

            {/* 自己紹介部分 */}
            <span>
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
            </span>

            <hr />

            {/* ロール一覧 */}
            <span>
              <Label>ロール</Label>
              <div class="flex flex-wrap gap-1 mt-2">
                <For each={storeMyUserinfo.RoleLink}>
                  {(role) =>
                    <RoleChip
                      deletable={getRolePower("manageRole")}
                      roleId={role.roleId}
                      onDelete={(roleId) => unlinkRole(roleId)}
                    />
                  }
                </For>
              </div>
            </span>
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
