import type { IBot } from "~/types/Server";
import { Badge, type BadgeProps } from "../ui/badge";

const APPROVE_STATUS_LABEL: Record<
  IBot["approveStatus"],
  { label: string; variant: BadgeProps["variant"] }
> = {
  APPROVED: { label: "承認済み", variant: "success" },
  PENDING: { label: "承認待ち", variant: "warning" },
  BLOCKED: { label: "停止中", variant: "error" },
  DENIED: { label: "拒否", variant: "error" },
};

export default function BotApprovalBadge(props: { approveStatus: IBot["approveStatus"], class?: string }) {
  return (
    <Badge variant={APPROVE_STATUS_LABEL[props.approveStatus].variant} class={props.class}>
      {APPROVE_STATUS_LABEL[props.approveStatus].label}
    </Badge>
  );
}
