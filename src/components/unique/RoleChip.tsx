import { IconCircleFilled } from "@tabler/icons-solidjs";
import { Badge } from "../ui/badge";
import { getterRoleInfo } from "~/stores/RoleInfo";

export default function RoleChip(props: { deltable: boolean, roleId: string }) {
  return (
    <Badge variant="outline">
      <span class="flex items-center gap-1">
        <IconCircleFilled size={12} color={ getterRoleInfo(props.roleId).color } />
        <p>{ getterRoleInfo(props.roleId).name }</p>
      </span>
    </Badge>
  )
}
