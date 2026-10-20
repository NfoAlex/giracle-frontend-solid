import { IconCheck, IconCopy } from "@tabler/icons-solidjs";
import { createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
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
    <div class="flex flex-col gap-2">
      <div>
        <Label>チャンネルID</Label>
        <Card class="px-4 py-2 flex items-center gap-2">
          <code class="grow min-w-0 break-all text-sm">{props.channelId}</code>
          <Button
            size="icon"
            variant={"outline"}
            class="shrink-0"
            title="チャンネルIDをコピー"
            onclick={copyChannelId}
          >
            <Show when={copied()} fallback={<IconCopy size={16} />}>
              <IconCheck size={16} />
            </Show>
          </Button>
        </Card>
      </div>
    </div>
  );
}
