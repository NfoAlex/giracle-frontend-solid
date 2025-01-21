import { IconCircleFilled, IconCircleXFilled, IconX } from "@tabler/icons-solidjs";
import { Badge } from "../ui/badge";
import { getterRoleInfo } from "~/stores/RoleInfo";
import { createSignal, Show } from "solid-js";
import POST_ROLE_UNLINK from "~/api/ROLE/ROLE_UNLINK";

export default function RoleChip(props: { deletable: boolean, roleId: string, userId?: string }) {
  const [hovered, setHovered] = createSignal(false);

  /**
   * ロールを解除
   */
  const unlinkRole = () => {
    console.log("RoleChip :: unlinkRole :: props ->", props);
    if (props.userId === undefined) return;

    POST_ROLE_UNLINK(props.userId, props.roleId)
      .then((r) => {
        console.log("RoleChip :: unlinkRole :: r ->", r);
      })
      .catch((e) => console.error("RoleChip :: unlinkRole :: err ->", e));
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
            onclick={unlinkRole}
          />
        </Show>
        <p>{ getterRoleInfo(props.roleId).name }</p>
      </span>
    </Badge>
  )
}
