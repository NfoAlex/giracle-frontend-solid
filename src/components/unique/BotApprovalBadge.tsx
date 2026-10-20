import { Badge, type BadgeProps } from "../ui/badge";

// props は getter なので、この定数引きを JSX 内(リアクティブ文脈)で行う
const APPROVE_STATUS_LABEL: Record<
  "true" | "false",
  { label: string; variant: BadgeProps["variant"] }
> = {
  true: { label: "承認済み", variant: "success" },
  false: { label: "未承認", variant: "warning" },
};

export default function BotApprovalBadge(props: {
  isApproved: boolean;
  class?: string;
}) {
  return (
    <Badge
      variant={APPROVE_STATUS_LABEL[String(props.isApproved) as "true" | "false"].variant}
      class={props.class}
    >
      {APPROVE_STATUS_LABEL[String(props.isApproved) as "true" | "false"].label}
    </Badge>
  );
}
