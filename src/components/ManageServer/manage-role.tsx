import { createSignal, For, onMount } from "solid-js";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import type { IRole } from "~/types/Role";
import { GET_ROLE_LIST } from "~/api/ROLE/ROLE_LIST";
import { Button } from "../ui/button";
import { SidebarMenuButton } from "../ui/sidebar";
import { TextField, TextFieldInput, TextFieldLabel } from "../ui/text-field";
import { IconCircle, IconList, IconPlus } from "@tabler/icons-solidjs";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "../ui/switch";
import POST_ROLE_UPDATE from "~/api/ROLE/ROLE_UPDATE";
import DELETE_ROLE_DELETE from "~/api/ROLE/ROLE_DELETE";
import POST_ROLE_CREATE from "~/api/ROLE/ROLE_CREATE";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
    manageUser: false,
    manageEmoji: false,
  });
  const roleChanged = () => {
    return JSON.stringify(roleEditing()) !== JSON.stringify(roles().find((r)=>r.id === roleEditing().id))
  };

  /**
   * ロールの更新を保存する
   */
  const saveRole = () => {
    POST_ROLE_UPDATE(roleEditing().id, roleEditing())
      .then((r) => {
        //console.log("ManageRole :: saveRole :: r->", r);
        setRoles(roles().map((role) => role.id === roleEditing().id ? roleEditing() : role));
      })
      .catch((err) => console.error("ManageRole :: saveRole :: err->", err));
  }

  /**
   * ロールを削除する
   */
  const deleteRole = () => {
    DELETE_ROLE_DELETE(roleEditing().id)
      .then((r) => {
        //console.log("ManageRole :: deleteRole :: r->", r);
        setRoles(roles().filter((role) => role.id !== roleEditing().id));
        setRoleEditing(roles()[1]);
      })
      .catch((err) => console.error("ManageRole :: deleteRole :: err->", err));
  }

  /**
   * ロールを作成する
   */
  const createRole = () => {
    POST_ROLE_CREATE(`ロール : ${new Date().toLocaleString()}`)
      .then((r) => {
        //console.log("ManageRole :: createRole :: r->", r);
        setRoles([...roles(), r.data]);
        setRoleEditing(r.data);
      })
      .catch((err) => console.error("ManageRole :: createRole :: err->", err));
  }

  /**
   * ロール一覧を取得する
   */
  const fetchRole = () => {
    GET_ROLE_LIST()
      .then((r) => {
        setRoles(r.data);
        setRoleEditing(r.data[1]);
      })
      .catch((err) => console.error("ManageRole :: fetchRole :: err->", err));
  }

  onMount(() => {
    fetchRole();
  });

  return (
    <div class="flex flex-col md:flex-row overflow-y-auto h-full gap-2">
      {/* PCUI用ロール選択 */}
      <Card class="w-52 hidden h-full flex-col md:flex">
        <CardHeader>
          <CardTitle class="flex items-center gap-1">
            <IconList />
            ロール一覧
          </CardTitle>
        </CardHeader>
        <CardContent class="overflow-y-auto grow h-full pt-1 pb-3">
          <HoverCard>
            <HoverCardTrigger>
              <SidebarMenuButton ondblclick={createRole} variant={"outline"} class="truncate">
                <IconPlus />
                <p>ロールを作成</p>
              </SidebarMenuButton>
            </HoverCardTrigger>
            <HoverCardContent>
              <p>ダブルクリックでロールを作成</p>
            </HoverCardContent>
          </HoverCard>
          
          <hr class="my-2" />

          <For each={roles()}>
            {(role, index) => (
              <SidebarMenuButton
                onclick={()=>setRoleEditing(role)}
                variant={roleEditing().id === role.id ? "outline" : "default"}
                tabIndex={index()}
                class="w-full truncate"
                disabled={role.id === "HOST"}
              >
                <IconCircle style={`color: ${role.color}`} />
                {role.name}
              </SidebarMenuButton>
            )}
          </For>
        </CardContent>
      </Card>

      {/* スマホUI用ロール選択 */}
      <Card class="md:hidden">
        <Select
          value={roleEditing()}
          onChange={(role) => role ? setRoleEditing(role) : null}
          options={roles()}
          optionValue={(role) => role.name}
          placeholder="ロールを選択..."
          itemComponent={
            (props) =>
            <SelectItem item={props.item}>
              <span class="flex items-center gap-1">
                <IconCircle style={`color: ${props.item.rawValue.color}`} />
                <p>{props.item.rawValue.name}</p>
              </span>
            </SelectItem>
          }
        >
          <SelectTrigger aria-label="role-select">
            <SelectValue<IRole>>
              {
                (state) => <span class="flex items-center">
                  <IconCircle style={`color: ${state.selectedOption()?.color}`} />
                  {state.selectedOption()?.name}
                </span>
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </Card>
      
      <Card class="grow h-fit">
        <CardHeader>
          <CardTitle>ロール編集</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <TextField>
            <TextFieldLabel>ロール名</TextFieldLabel>
            <TextFieldInput
              value={roleEditing().name}
              onchange={e=>setRoleEditing({...roleEditing(), name: e.currentTarget.value})}
            />
          </TextField>
          <TextField>
            <TextFieldLabel class="flex items-center gap-3">
              <p>ロールカラー</p>
              <p style={`color: ${roleEditing().color}`}>●</p>
            </TextFieldLabel>
            <TextFieldInput
              value={roleEditing().color}
              onchange={e=>setRoleEditing({...roleEditing(), color: e.currentTarget.value})}
            />
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

          <Switch
            checked={roleEditing().manageEmoji}
            onChange={(e) => setRoleEditing({...roleEditing(), manageEmoji: e.valueOf()})}
            class="flex items-center space-x-4"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>絵文字の管理</SwitchLabel>
          </Switch>
        </span>

        <hr class="my-3" />

        <CardFooter class="flex flex-row-reverse items-center gap-2">
          <Button
            onclick={()=>setRoleEditing(roles().find((r)=>r.id === roleEditing().id) || roleEditing())}
            variant={"outline"}
            disabled={!roleChanged()}
          >復元</Button>
          <Button onClick={saveRole} disabled={!roleChanged() || roleEditing().name === ""}>保存</Button>
          <span class="mr-auto">
            <HoverCard>
              <HoverCardTrigger>
                <Button ondblclick={deleteRole} variant={"destructive"}>削除</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p>ダブルクリックでロールを削除</p>
              </HoverCardContent>
            </HoverCard>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
