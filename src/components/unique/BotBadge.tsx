import { Badge, type BadgeProps } from "~/components/ui/badge.tsx";
import { IconCircleFilled } from "@tabler/icons-solidjs";
import { cn } from "~/lib/utils.ts";

export default function BotBadge(props: {
  variant?: BadgeProps["variant"];
  class?: string;
}) {
  return (
    <Badge
      variant={props.variant ?? "outline"}
      class={cn("shrink-0 flex items-center gap-1", props.class)}
    >
      <IconCircleFilled size={12} color={"blue"} />
      <span>Bot</span>
    </Badge>
  );
}
