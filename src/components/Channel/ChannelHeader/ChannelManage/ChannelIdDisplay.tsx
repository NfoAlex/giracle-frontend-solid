import { IconCheck, IconCopy } from "@tabler/icons-solidjs";
import { createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button.tsx";
import { Label } from "~/components/ui/label.tsx";

export default function ChannelId(props: { channelId: string }) {
  const [copied, setCopied] = createSignal(false);

  /**
   * チャンネルIDをクリップボードへコピー
   */
  const copyChannelId = () => {
    navigator.clipboard.writeText(props.channelId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div class="text-muted-foreground mt-auto justify-self-end flex items-center gap-1">
      <Label class="shrink-0">チャンネルID: </Label>
      <code class="shrink truncate grow min-w-0 break-all text-sm">{props.channelId}</code>
      <Button
        size={"icon"}
        variant={"ghost"}
        class="shrink-0 ml-auto"
        title="チャンネルIDをコピー"
        onclick={copyChannelId}
      >
        <Show when={copied()} fallback={<IconCopy size={16} />}>
          <IconCheck size={16} />
        </Show>
      </Button>
    </div>
  );
}
