import {createSignal, For, Show} from "solid-js";
import {IconPlus} from "@tabler/icons-solidjs";
import {Popover, PopoverContent, PopoverTrigger} from "~/components/ui/popover";
import {Badge} from "~/components/ui/badge";
import RoleChip from "~/components/unique/RoleChip";
import {storeRoleInfo} from "~/stores/RoleInfo";
import {Card} from "~/components/ui/card";

export default function RoleLinker(props: { roles: string[], onUpdate?: (roles: string[])=>void }) {
  const [newRoles, setNewRoles] = createSignal(props.roles);

  const updateRoles = (roleIdAdding: string) => {
    if (props.onUpdate === undefined) return;

    setNewRoles([...newRoles(), roleIdAdding]);
    props.onUpdate(newRoles());
  }

  const removeRole = (roleIdRemoving: string) => {
    if (props.onUpdate === undefined) return;

    setNewRoles(newRoles().filter((r) => r !== roleIdRemoving));
    props.onUpdate(newRoles());
  }

  return (
    <Card class={"p-2 flex flex-col gap-2"}>
      {/* ロール一覧表示 */}
      <div class={"flex flex-wrap gap-2"}>
        <For each={props.roles}>
          {
            (roleId) =>
              <RoleChip
                deletable={true}
                roleId={roleId}
                onDelete={(roleId)=>removeRole(roleId)}
              />
          }
        </For>
        <Show when={props.roles.length === 0}>
          <span class="text-sm text-center mx-auto italic">ロールの指定がありません</span>
        </Show>
      </div>

      {/* ロール追加ボタン */}
      <Popover>
        <PopoverTrigger class={"w-fit"}>
          <Badge
            variant={"outline"}
            class="cursor-pointer h-full"
            itemType={"button"}
          >
            <IconPlus size={16} />
          </Badge>
        </PopoverTrigger>
        <PopoverContent class="w-fit">
          <div class="max-h-[25vh] max-w-[75vw] overflow-y-auto flex flex-col gap-1">
            <For each={Object.values(storeRoleInfo).map((r) => r)}>
              {(role) => //ロールリンクされていないものだけ表示
                <span onClick={()=>updateRoles(role.id)} class="cursor-pointer pr-2">
                  <RoleChip deletable={false} roleId={role.id} />
                </span>
              }
            </For>
          </div>
        </PopoverContent>
      </Popover>
    </Card>
  )

}