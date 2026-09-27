import { createSignal, For, JSX, Show } from "solid-js";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog.tsx";
import { useStoreUserinfo, storeUserinfo, storeUserOnline } from "~/stores/Userinfo.store.ts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { IconCircleFilled, IconPencil, IconPlus } from "@tabler/icons-solidjs";
import { useStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import { Button } from "~/components/ui/button.tsx";
import { A } from "@solidjs/router";
import { Label } from "~/components/ui/label.tsx";
import { Card } from "~/components/ui/card.tsx";
import RoleChip from "~/components/unique/RoleChip";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import type { IRole } from "~/types/Role.ts";
import { storeRoleInfo } from "~/stores/RoleInfo.store.ts";
import { api } from "~/api/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { IBot } from "~/types/Server";
import { createMutable } from "solid-js/store";

//Bot取得ハンドラの返り値そのまま
type TBotInfoFetch = Omit<IBot, "tokenCode" | "user"> & { user: Pick<IBot["user"], "id"> };
// createMutable は Map 等の組み込みクラスをラップできない（メソッド呼出時にProxy不一致エラー）ので、キーをBotのidにしたプレーンオブジェクトで保持する
const BOT_INFO_CACHE = createMutable<Record<IBot["id"], TBotInfoFetch>>({});

export default function UserinfoModalWrapper(props: { children: JSX.Element, userId: string, class?: string }) {
  const user = () => useStoreUserinfo.getterUserinfo(props.userId);
  const [open, setOpen] = createSignal(false);

  // ロールリスト用
  const [, setOpenRoleList] = createSignal(false);
  const roles: IRole[] = Object.values(storeRoleInfo);

  /**
   * ロールを付与
   * @param roleId 付与するロールのId
   */
  const linkRole = (roleId: string) => {
    api.role.link({ userId: props.userId, roleId })
      .then(() => {
        //console.log("UserName :: linkRole :: r ->", r);
      })
      .catch((e) => console.error("UserName :: linkRole :: err ->", e));
  }

  /**
   * ロールを解除
   */
  const unlinkRole = (roleId: string) => {
    if (props.userId === undefined) return;

    api.role.unlink({ userId: props.userId, roleId })
      .then(() => {
        //console.log("RoleChip :: unlinkRole :: r ->", r);
      })
      .catch((e) => console.error("UserName :: unlinkRole :: err ->", e));
  }

  /**
   * ユーザーのBAN状態制御
   */
  const controlBanState = async (banState: boolean) => {
    if (banState) {
      await api.user.ban({ userId: props.userId })
        .then((r) => {
          //console.log("UserName :: controlBanState(BAN) :: r ->", r);
        })
        .catch((e) => console.error("UserName :: controlBanState :: err ->", e));
    } else {
      await api.user.unban({ userId: props.userId })
        .then((r) => {
          //console.log("UserName :: controlBanState(UNBAN) :: r ->", r);
        })
        .catch((e) => console.error("UserName :: controlBanState :: err ->", e));
    }
  }

  /**
   * Botユーザーだった時用の取得ハンドラ
   */
  const botInfoGetter = () => {
    const cached = BOT_INFO_CACHE[user().id];
    if (cached) return cached;

    api.server.getBotByRemoteUserId({ remoteUserId: user().id })
      .then((res) => {
        BOT_INFO_CACHE[user().id] = res.data;
        // 上限150件を超えたら挿入順（＝古い順）の先頭を1件削除
        const keys = Object.keys(BOT_INFO_CACHE);
        if (keys.length > 150) delete BOT_INFO_CACHE[keys[0]];
      })
      .catch((err) => console.error("UserinfoModalWrapper :: fetchBotInfo : e", err));

  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent class="p-0 max-h-[90vh] flex flex-col overflow-y-auto">
        <Show when={open() && user()}>
          {
            user().isBot
            ?
            <div class="h-[75px] shrink-0 grow w-full"></div>
            :
            <div class="h-[250px] shrink-0 grow w-full">
              <img
                alt="ユーザーバナー"
                src={`/api/user/banner/${storeUserinfo[props.userId].id}`}
                class="h-full w-full text-center object-cover"
              />
            </div>
          }

          {/* ユーザーアイコンとオンライン表示 */}
          <div class="w-full px-2 -mt-12 flex items-center gap-4">
            <Avatar class="w-16 h-16 ml-4">
              <AvatarImage src={`/api/user/icon/${user().id}`} />
              <AvatarFallback class="w-full h-full">{user().name}</AvatarFallback>
            </Avatar>

            <div class="flex items-center ml-auto gap-2">
              <Show when={user().isBot}>
                <Badge variant={"secondary"} class={"flex items-center gap-2"}>
                  <IconCircleFilled size={12} color={"blue"} />
                  <p>Bot</p>
                </Badge>
              </Show>
              <Show when={storeUserOnline.includes(props.userId)}>
                <Badge variant={"secondary"} class={"flex items-center gap-2"}>
                  <IconCircleFilled size={12} color={"green"} />
                  <p>オンライン</p>
                </Badge>
              </Show>
            </div>
          </div>

          <div class="pb-4 px-4 flex flex-col gap-2">
            {/* 名前 */}
            <span class="flex items-center">
              <p class="font-bold text-2xl w-min">{storeUserinfo[user().id].name}</p>

              {
                storeUserinfo[user().id].isBanned
                &&
                <Badge class="ml-auto" variant={"error"}>BANされたユーザー</Badge>
              }
              {
                storeMyUserinfo.id === user().id && !storeUserinfo[user().id].isBanned
                &&
                <Button size="icon" as={A} href="/app/config" class="ml-auto">
                  <IconPencil />
                </Button>
              }
            </span>

            {/* タブ */}
            <Tabs defaultValue="overview">
              <Show when={useStoreMyUserinfo.getRolePower("manageUser")}>
                <TabsList class="w-full">
                  <TabsTrigger value="overview" class="w-full">概要</TabsTrigger>
                  <TabsTrigger value="manage" class="w-full">管理</TabsTrigger>
                </TabsList>
              </Show>

              {/* 概要 */}
              <TabsContent value="overview" class="flex flex-col gap-2">
                {/* 自己紹介 */}
                <div>
                  <Label>自己紹介</Label>
                  <Card class="px-4 py-2">{storeUserinfo[user().id].selfIntroduction}</Card>
                </div>

                {/* Botユーザー用の作成者 */}
                <Show when={user().isBot}>
                  <Card class="p-2">
                      作成者: {(() => {
                        const info = botInfoGetter();
                        return info
                          ?
                          (<UserinfoModalWrapper userId={info.createdBy}>{useStoreUserinfo.getterUserinfo(info.createdBy).name}</UserinfoModalWrapper>)
                          :
                          "...";
                      })()}
                  </Card>
                </Show>

                {/* ロール */}
                <Show when={!user().isBot}>
                  <div>
                    <Label>ロール</Label>
                    <div class="flex flex-wrap gap-1">
                      <For each={storeUserinfo[user().id].RoleLink}>
                        {(role) =>
                          <RoleChip
                            deletable={useStoreMyUserinfo.getRolePower("manageRole")}
                            roleId={role.roleId}
                            userId={props.userId}
                            onDelete={(roleId) => unlinkRole(roleId)}
                          />
                        }
                      </For>
                    </div>
                    <Show when={useStoreMyUserinfo.getRolePower("manageRole")}>
                      {/* ロール追加ボタン */}
                      <Popover onOpenChange={setOpenRoleList}>
                        <PopoverTrigger>
                          <Badge
                            variant={"outline"}
                            class="cursor-pointer h-full mt-1"
                          >
                            <IconPlus size={16} />
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent class="w-fit">
                          <div class="max-h-[25vh] max-w-[75vw] overflow-y-auto flex flex-col gap-1">
                            <For each={roles}>
                              {(role) => //ロールリンクされていないものだけ表示
                                !storeUserinfo[user().id].RoleLink.some((rl) => rl.roleId === role.id)
                                &&
                                <span onclick={() => linkRole(role.id)} class="cursor-pointer pr-2">
                                  <RoleChip deletable={false} roleId={role.id} />
                                </span>
                              }
                            </For>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Show>
                  </div>
                </Show>
              </TabsContent>

              {/* 管理 */}
              <TabsContent value="manage">
                {
                  user().isBot
                  ?
                  <Card class="p-2 flex flex-col gap-1">
                    {
                      useStoreMyUserinfo.getRolePower("manageServer")
                      ?
                      <Button
                        as={A}
                        href={
                          "/app/manage-server?botName=" +
                          // 検索キーはBot名。botName改名後も外れないようbotNameを使う
                          encodeURIComponent(
                            botInfoGetter()?.botName ?? user().name,
                          )
                        }
                        class="w-full"
                      >このBot管理ページへ飛ぶ</Button>
                      :
                      <p>サーバーの管理権限がありません</p>
                    }
                  </Card>
                  :
                  <Card class="p-2 flex flex-col gap-1">
                    {
                      !storeUserinfo[user().id].isBanned ?
                        <Button ondblclick={() => controlBanState(true)} class={"w-full"} variant={"destructive"}>BANする</Button>
                        :
                        <Button ondblclick={() => controlBanState(false)} class={"w-full"} variant={"default"}>BANを解除する</Button>
                    }
                    <Label class={"text-border"}>ダブルクリックで操作</Label>
                  </Card>
                }
              </TabsContent>
            </Tabs>
          </div>
        </Show>
      </DialogContent>

      {/* ボタンはshrink-to-fitのため、長い名前で親からはみ出さないよう幅を制限 */}
      <DialogTrigger class="max-w-full">
        <div class={props.class}>
          {props.children}
        </div>
      </DialogTrigger>
    </Dialog>
  )
}
