import { createSignal, For, onMount } from "solid-js";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import type { IRole } from "~/types/Role";
import { GET_ROLE_LIST } from "~/api/ROLE/ROLE_LIST";
import { Button } from "../ui/button";
import { SidebarMenuButton } from "../ui/sidebar";
import { TextField, TextFieldInput, TextFieldLabel } from "../ui/text-field";
import { IconList } from "@tabler/icons-solidjs";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "../ui/switch";

export default function ManageRole() {
  const [roles, setRoles] = createSignal<IRole[]>([]);
  const [roleEditing, setRoleEditing] = createSignal<IRole>({
    name: "",
    id: "",
    createdAt: new Date(),
    createdUserId: "",
    color: "",
    manageServer: false,
    manageChannel: false,
    manageRole: false,
    manageUser: false
  });

  /**
   * ロール一覧を取得する
   */
  const fetchRole = () => {
    GET_ROLE_LIST()
      .then((r) => {
        setRoles(r.data);
      })
      .catch((err) => console.error("ManageRole :: fetchRole :: err->", err));
  }

  onMount(() => {
    fetchRole();
  });

  return (
    <div class="flex h-full gap-2">
      <Card class="w-52 h-full">
        <CardHeader>
          <CardTitle class="flex items-center gap-1">
            <IconList />
            ロール一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <For each={roles()}>
            {(role, index) => (
              <SidebarMenuButton
                onclick={()=>setRoleEditing(role)}
                variant={roleEditing().id === role.id ? "outline" : "default"}
                tabIndex={index()}
                class="w-full"
              >
                {role.name}
              </SidebarMenuButton>
            )}
          </For>
        </CardContent>
      </Card>
      
      <Card class="grow">
        <CardHeader>
          <CardTitle>ロール編集</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <TextField>
            <TextFieldLabel>ロール名</TextFieldLabel>
            <TextFieldInput value={roleEditing().name} />
          </TextField>
          <TextField>
            <TextFieldLabel class="flex items-center gap-3">
              <p>ロールカラー</p>
              <p style={`color: ${roleEditing().color}`}>●</p>
            </TextFieldLabel>
            <TextFieldInput value={roleEditing().color} />
          </TextField>
        </CardContent>

        <span class="mx-2 flex flex-col gap-4">
          <Switch
            checked={roleEditing().manageServer}
            onChange={(e) => setRoleEditing({...roleEditing(), manageServer: e.valueOf()})}
            class="flex items-center space-x-4"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>サーバーの管理</SwitchLabel>
          </Switch>

          <Switch
            checked={roleEditing().manageChannel}
            onChange={(e) => setRoleEditing({...roleEditing(), manageChannel: e.valueOf()})}
            class="flex items-center space-x-4"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>チャンネルの編集</SwitchLabel>
          </Switch>

          <Switch
            checked={roleEditing().manageRole}
            onChange={(e) => setRoleEditing({...roleEditing(), manageRole: e.valueOf()})}
            class="flex items-center space-x-4"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>ロールの編集</SwitchLabel>
          </Switch>

          <Switch
            checked={roleEditing().manageUser}
            onChange={(e) => setRoleEditing({...roleEditing(), manageUser: e.valueOf()})}
            class="flex items-center space-x-4"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>ユーザーの編集</SwitchLabel>
          </Switch>
        </span>

        <hr class="my-3" />

        <CardFooter class="flex flex-row-reverse items-center gap-2">
          <Button variant={"outline"}>復元</Button>
          <Button>保存</Button>
          <Button variant={"destructive"} class="mr-auto">削除</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
