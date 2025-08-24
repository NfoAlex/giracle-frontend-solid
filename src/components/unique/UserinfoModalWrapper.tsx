import {createSignal, For, JSX, Show} from "solid-js";
import {Dialog, DialogContent, DialogTrigger} from "~/components/ui/dialog";
import {getterUserinfo, storeUserinfo, storeUserOnline} from "~/stores/Userinfo";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";
import {Badge} from "~/components/ui/badge";
import {IconCircleFilled, IconPencil, IconPlus} from "@tabler/icons-solidjs";
import {getRolePower, storeMyUserinfo} from "~/stores/MyUserinfo";
import {Button} from "~/components/ui/button";
import {A} from "@solidjs/router";
import {Label} from "~/components/ui/label";
import {Card} from "~/components/ui/card";
import RoleChip from "~/components/unique/RoleChip";
import {Popover, PopoverContent, PopoverTrigger} from "~/components/ui/popover";
import type {IRole} from "~/types/Role";
import {storeRoleInfo} from "~/stores/RoleInfo";
import POST_ROLE_LINK from "~/api/ROLE/ROLE_LINK";
import POST_ROLE_UNLINK from "~/api/ROLE/ROLE_UNLINK";
import POST_USER_BAN from "~/api/USER/USER_BAN";
import POST_USER_UNBAN from "~/api/USER/USER_UNBAN";

export default function UserinfoModalWrapper(props: {children: JSX.Element, userId: string, class?: string}) {
  const [user] = createSignal(getterUserinfo(props.userId));
  const [open, setOpen] = createSignal(false);

  // ロールリスト用
  const [, setOpenRoleList] = createSignal(false);
  const roles: IRole[] = Object.values(storeRoleInfo);

  /**
   * ロールを付与
   * @param roleId 付与するロールのId
   */
  const linkRole = (roleId: string) => {
    POST_ROLE_LINK(props.userId, roleId)
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

    POST_ROLE_UNLINK(props.userId, roleId)
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
      await POST_USER_BAN(props.userId)
        .then((r) => {
          //console.log("UserName :: controlBanState(BAN) :: r ->", r);
        })
        .catch((e) => console.error("UserName :: controlBanState :: err ->", e));
    } else {
      await POST_USER_UNBAN(props.userId)
        .then((r) => {
          //console.log("UserName :: controlBanState(UNBAN) :: r ->", r);
        })
        .catch((e) => console.error("UserName :: controlBanState :: err ->", e));
    }
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent class="p-0 max-h-[90vh] flex flex-col overflow-y-auto">
        <Show when={open() && user()}>
          <div class="h-[250px] shrink-0 grow w-full">
            <img
              alt="ユーザーバナー"
              src={`/api/user/banner/${storeUserinfo[props.userId].id}`}
              class="h-full w-full text-center object-cover"
            />
          </div>

          {/* ユーザーアイコンとオンライン表示 */}
          <div class="w-full -mt-12 flex items-center gap-4">
            <Avatar class="w-16 h-16 ml-4">
              <AvatarImage src={`/api/user/icon/${user().id}`} />
              <AvatarFallback class="w-full h-full">{user().name}</AvatarFallback>
            </Avatar>

            <Show when={storeUserOnline.includes(props.userId)}>
              <Badge variant={"secondary"} class={"flex ml-auto mr-4 items-center gap-2"}>
                <IconCircleFilled size={16} color={"green"} />
                <p>オンライン</p>
              </Badge>
            </Show>
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

            {/* 自己紹介 */}
            <div>
              <Label>自己紹介</Label>
              <Card class="px-4 py-2">{storeUserinfo[user().id].selfIntroduction}</Card>
            </div>

            {/* ロール */}
            <div>
              <Label>ロール</Label>
              <div class="flex flex-wrap gap-1">
                <For each={storeUserinfo[user().id].RoleLink}>
                  {(role) =>
                    <RoleChip
                      deletable={getRolePower("manageRole")}
                      roleId={role.roleId}
                      userId={props.userId}
                      onDelete={(roleId)=>unlinkRole(roleId)}
                    />
                  }
                </For>
              </div>
              <Show when={getRolePower("manageRole")}>
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
                            <span onclick={()=>linkRole(role.id)} class="cursor-pointer pr-2">
                              <RoleChip deletable={false} roleId={role.id} />
                            </span>
                        }
                      </For>
                    </div>
                  </PopoverContent>
                </Popover>
              </Show>
            </div>

            {/* 管理 */}
            <Show when={getRolePower("manageUser")}>
              <div>
                <Label>管理</Label>
                <Card class="p-2 flex flex-col gap-1">
                  {
                    !storeUserinfo[user().id].isBanned ?
                      <Button ondblclick={()=>controlBanState(true)} class={"w-full"} variant={"destructive"}>BANする</Button>
                      :
                      <Button ondblclick={()=>controlBanState(false)} class={"w-full"} variant={"default"}>BANを解除する</Button>
                  }
                  <Label class={"text-border"}>ダブルクリックで操作</Label>
                </Card>
              </div>
            </Show>
          </div>
        </Show>
      </DialogContent>

      <DialogTrigger>
        <div class={props.class}>
          {props.children}
        </div>
      </DialogTrigger>
    </Dialog>
  )
}