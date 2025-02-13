import { createSignal, For, Show } from "solid-js";
import { getterUserinfo, storeUserinfo } from "~/stores/Userinfo";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { IconPencil, IconPlus } from "@tabler/icons-solidjs";
import { A } from "@solidjs/router";
import {getRolePower, storeMyUserinfo} from "~/stores/MyUserinfo";
import RoleChip from "./RoleChip";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import POST_ROLE_LINK from "~/api/ROLE/ROLE_LINK";
import { storeRoleInfo } from "~/stores/RoleInfo";
import type { IRole } from "~/types/Role";
import POST_ROLE_UNLINK from "~/api/ROLE/ROLE_UNLINK";

export default function UserName(props: { userId: string }) {
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
          <div class="w-full -mt-12">
            <Avatar class="w-16 h-16 ml-4">
              <AvatarImage src={`/api/user/icon/${user().id}`} />
              <AvatarFallback class="w-full h-full">{user().name}</AvatarFallback>
            </Avatar>
          </div>

          <div class="pb-2 px-4 flex flex-col gap-2">
            {/* 名前 */}
            <span class="flex items-center">
              <p class="font-bold text-2xl w-min">{storeUserinfo[user().id].name}</p>

              {
                !user().isBanned
                &&
                <Badge class="ml-auto" variant={"error"}>BANされたユーザー</Badge>
              }
              {
                storeMyUserinfo.id === user().id && !user().isBanned
                &&
                <Button as={A} href="/app/profile" class="ml-auto">
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
                      onclick={()=>console.log("asdf")}
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
            <div>
              <Label>管理</Label>
              <Card class="px-4 py-2 flex flex-col gap-2">
                {
                  !user().isBanned ?
                    <Button class={"w-full"} variant={"destructive"}>BANする</Button>
                    :
                    <Button class={"w-full"} variant={"default"}>BANを解除する</Button>
                }
                <Label>ダブルクリックで操作</Label>
              </Card>
            </div>
          </div>
        </Show>
      </DialogContent>

      <DialogTrigger>
        <p class="font-bold hover:underline">{!user() ? props.userId : getterUserinfo(props.userId).name}</p>
      </DialogTrigger>
    </Dialog>
  );
}
