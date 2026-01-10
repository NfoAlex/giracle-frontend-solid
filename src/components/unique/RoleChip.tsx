import { IconCircleFilled, IconX } from "@tabler/icons-solidjs";
import { Badge } from "../ui/badge.tsx";
import { getterRoleInfo } from "~/stores/RoleInfo.ts";
import { createSignal, Show } from "solid-js";

export default function RoleChip(props: {
  deletable: boolean,
  roleId: string,
  onDelete?: (roleId: string) => void,
  userId?: string
}) {
  const [hovered, setHovered] = createSignal(false);

  /**
   * ロールの削除ボタンアクション
   */
  const deleteIt = () => {
    //console.log("RoleChip :: deleteIt :: onDelete", props.onDelete);
    if (props.onDelete === undefined) return;

    props.onDelete(props.roleId);
  }

  return (
    <Badge variant="outline">
      <span class="flex items-center gap-1">
        <Show when={!hovered()}>
          <IconCircleFilled
            size={12}
            color={ getterRoleInfo(props.roleId).color }
            onMouseEnter={()=>{if(props.deletable) setHovered(true)}}
          />
        </Show>
        <Show when={hovered()}>
          <IconX
            size={12}
            color={ getterRoleInfo(props.roleId).color }
            onMouseLeave={()=>setHovered(false)}
            onclick={deleteIt}
          />
        </Show>
        <p>{ getterRoleInfo(props.roleId).name }</p>
      </span>
    </Badge>
  )
}
