import { createResource, createSignal, For, Show } from "solid-js";
import { getterUserinfo } from "~/stores/Userinfo";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { IconPencil } from "@tabler/icons-solidjs";
import { A } from "@solidjs/router";

export default function UserName(props: { userId: string }) {
  const [user] = createResource(props.userId, getterUserinfo);
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent class="p-0 max-h-[90vh] flex flex-col overflow-y-auto">
        <Show when={open() && !user.loading}>
          <div class="h-[35%] w-full">
            <img
              alt="user banner"
              src={`/api/user/banner/${user()?.id}`}
              class="h-full w-full object-cover"
            />
          </div>
          <div class="w-full -mt-12">
            <Avatar class="w-16 h-16 ml-4">
              <AvatarImage src={`/api/user/icon/${user()?.id}`} />
              <AvatarFallback class="w-full h-full">{user()?.name}</AvatarFallback>
            </Avatar>
          </div>

          <div class="pb-2 px-4 flex flex-col gap-2">
            <span class="flex items-center">
              <p class="font-bold text-2xl w-min">{user()?.name}</p>

              <Button as={A} href="/app/profile" class="ml-auto">
                <IconPencil />
              </Button>
            </span>

            <div>
              <Label>自己紹介</Label>
              <Card class="px-4 py-2">{user()?.selfIntroduction}</Card>
            </div>

            <div>
              <Label>ロール</Label>
              <Card class="px-4 py-2">
                <For each={user()?.RoleLink}>
                  {(role) => <p>{role.roleId}</p>}
                </For>
              </Card>
            </div>

            <div>
              <Label>管理</Label>
              <Card class="px-4 py-2">ここでBANとかする</Card>
            </div>
          </div>
        </Show>
      </DialogContent>
      <DialogTrigger>
        <p class="font-bold">{user.loading ? props.userId : user()?.name}</p>
      </DialogTrigger>
    </Dialog>
  );
}
