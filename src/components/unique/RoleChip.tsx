import { IconCircleFilled } from "@tabler/icons-solidjs";
import { Badge } from "../ui/badge";
import { getterRoleInfo } from "~/stores/RoleInfo";

export default function RoleChip(props: { deltable: boolean, roleId: string }) {
  const role = getterRoleInfo(props.roleId);
  
  return (
    <div>
      <Badge variant="outline">
        <span class="flex items-center gap-1">
          <IconCircleFilled size={12} color={ role.color } />
          <p>{ role.name }</p>
        </span>
      </Badge>
    </div>
  )
}
