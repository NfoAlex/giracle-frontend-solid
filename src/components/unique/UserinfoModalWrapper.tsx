import { createSignal, For, JSX, Show } from "solid-js";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog.tsx";
import { useStoreUserinfo, storeUserinfo, storeUserOnline } from "~/stores/Userinfo.store.ts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { IconCheck, IconCircleFilled, IconCopy, IconPencil, IconPlus } from "@tabler/icons-solidjs";
import { useStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import { Button } from "~/components/ui/button.tsx";
import { A } from "@solidjs/router";
import { Label } from "~/components/ui/label.tsx";
import { Card } from "~/components/ui/card.tsx";
import RoleChip from "~/components/unique/RoleChip";
import BotBadge from "~/components/unique/BotBadge.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import type { IRole } from "~/types/Role.ts";
import { storeRoleInfo } from "~/stores/RoleInfo.store.ts";
import { api } from "~/api/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { IBot } from "~/types/Server";
import { createMutable } from "solid-js/store";

// createMutable は Map 等の組み込みクラスをラップできない（メソッド呼出時にProxy不一致エラー）ので、キーをBotのidにしたプレーンオブジェクトで保持する
// undefined=未取得/取得中, null=取得失敗（Bot削除後は GET /bot/:remoteUserId が恒久的に404）
const BOT_INFO_CACHE = createMutable<Record<IBot["id"], IBot | null | undefined>>({});
// レンダー中に呼ばれる取得処理の二重発火を防ぐため、飛んでいるリクエストのIDを保持する
const BOT_INFO_PENDING = new Set<IBot["id"]>();

export default function UserinfoModalWrapper(props: { children: JSX.Element, userId: string, class?: string }) {
  const user = () => useStoreUserinfo.getterUserinfo(props.userId);
  const [open, setOpen] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

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
   * @returns undefined=取得中 / null=取得失敗 / IBot=取得成功
   */
  const botInfoGetter = () => {
    const botUserId = user().id;
    const cached = BOT_INFO_CACHE[botUserId];
    if (cached !== undefined) return cached;
    if (BOT_INFO_PENDING.has(botUserId)) return;

    BOT_INFO_PENDING.add(botUserId);
    api.bot.getByRemoteUserId({ remoteUserId: botUserId })
      .then((res) => {
        BOT_INFO_CACHE[botUserId] = res.data;
        // 上限150件を超えたら挿入順（＝古い順）の先頭を1件削除
        const keys = Object.keys(BOT_INFO_CACHE);
        if (keys.length > 150) delete BOT_INFO_CACHE[keys[0]];
      })
      .catch((err) => {
        console.error("UserinfoModalWrapper :: fetchBotInfo : e", err);
        // 失敗をキャッシュし、表示が「...」のまま固まらないようにする
        BOT_INFO_CACHE[botUserId] = null;
      })
      .finally(() => BOT_INFO_PENDING.delete(botUserId));
  }

  /**
   * ユーザーIDをクリップボードへコピー
   */
  const copyUserId = () => {
    navigator.clipboard.writeText(props.userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /** モーダル開閉。開いた時に前回の取得失敗マーカーを消して再取得させる */
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && BOT_INFO_CACHE[props.userId] === null) {
      delete BOT_INFO_CACHE[props.userId];
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
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
                <BotBadge variant={"secondary"} class={"gap-2"} />
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
              <TabsList class="w-full">
                <TabsTrigger value="overview" class="w-full">概要</TabsTrigger>
                <Show
                  when={
                    user().isBot
                      // Botの管理はサーバー管理者のみ可能。manageUserでは承認できない
                      ? useStoreMyUserinfo.getRolePower("manageServer")
                      : useStoreMyUserinfo.getRolePower("manageUser")
                  }
                >
                  <TabsTrigger value="manage" class="w-full">管理</TabsTrigger>
                </Show>
                <TabsTrigger value="id" class="w-full">ID</TabsTrigger>
              </TabsList>

              {/* 概要 */}
              <TabsContent value="overview" class="flex flex-col gap-2">
                {/* 自己紹介 */}
                <div>
                  <Label>自己紹介</Label>
                  <Card class="px-4 py-2">
                    {
                      storeUserinfo[user().id].selfIntroduction.length !== 0
                      ?
                        storeUserinfo[user().id].selfIntroduction
                      :
                        <span class="text-border">自己紹介文がありません</span>
                    }
                  </Card>
                </div>

                {/* Botユーザー用の作成者 */}
                <Show when={user().isBot}>
                  <Card class="p-2">
                      作成者: {(() => {
                        const info = botInfoGetter();
                        if (info === undefined) return "...";
                        if (info === null) return "取得できませんでした";
                        return (
                          <UserinfoModalWrapper userId={info.createdBy}>
                            {useStoreUserinfo.getterUserinfo(info.createdBy).name}
                          </UserinfoModalWrapper>
                        );
                      })()}
                  </Card>
                </Show>

                {/* ロール */}
                <div>
                  <Label>ロール</Label>
                  <div class="flex flex-wrap gap-1">
                    { //ロールが無いとき用表示
                      storeUserinfo[user().id].RoleLink.length === 0
                      &&
                      <span class="text-border">ロールがありません</span>
                    }

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
              </TabsContent>

              {/* 管理 */}
              <TabsContent value="manage">
                {
                  user().isBot
                  ?
                  <Card class="p-2 flex flex-col gap-1">
                    <Button
                      as={A}
                      href={
                        "/app/manage-server?botName=" +
                        // 検索キーはBot名。Bot名はusers.nameなのでuser().nameを使う
                        encodeURIComponent(user().name)
                      }
                      class="w-full"
                    >このBot管理ページへ飛ぶ</Button>
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

              {/* ID */}
              <TabsContent value="id" class="flex flex-col gap-2">
                <div>
                  <Label>ユーザーID</Label>
                  <Card class="px-4 py-2 flex items-center gap-2">
                    <code class="grow min-w-0 break-all text-sm">{props.userId}</code>
                    <Button
                      size="icon"
                      variant={"outline"}
                      class="shrink-0"
                      title="ユーザーIDをコピー"
                      onclick={copyUserId}
                    >
                      <Show when={copied()} fallback={<IconCopy size={16} />}>
                        <IconCheck size={16} />
                      </Show>
                    </Button>
                  </Card>
                </div>
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
