import ConfigBotDetail from "./ConfigBot/ConfigBotDetail.tsx";
import ConfigBotList from "./ConfigBot/ConfigBotList.tsx";
import { createSignal } from "solid-js";
import type { TBotListItem } from "~/types/Server.ts";

export default function ConfigBot() {
  const [displayMode, setDisplayMode] = createSignal<"list" | "detail">("list");
  const [activeBot, setActiveBot] = createSignal<TBotListItem | undefined>(
    undefined,
  );

  return (
    <div class="md:max-w-[950px] h-full mx-auto flex flex-col gap-2 pb-2">
      <p class="font-bold text-xl md:text-2xl my-1 md:my-0">Bot管理</p>

      {
        displayMode() === "list"
        ?
        <ConfigBotList
          setActiveBot={bot => { setActiveBot(bot); setDisplayMode("detail"); }}
        />
        :
        <ConfigBotDetail returnToListProxy={() => setDisplayMode("list") } bot={activeBot()} />
      }

    </div>
  )
}
