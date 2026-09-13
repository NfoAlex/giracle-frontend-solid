import ConfigBotDetail from "./ConfigBot/ConfigBotDetail.tsx";
import ConfigBotList from "./ConfigBot/ConfigBotList.tsx";
import { createSignal } from "solid-js";

export default function ConfigBot() {
  const [displayMode, setDisplayMode] = createSignal<"list" | "detail">("list");
  const [activeBotId, setActiveBotId] = createSignal<string | undefined>(undefined);

  return (
    <div class="h-full flex flex-col gap-6 pb-2">

      <span class="flex flex-row items-center gap-2">
        <p class="font-bold text-2xl my-2">Bot管理</p>
      </span>

      {
        displayMode() === "list"
        ?
        <ConfigBotList
          setActiveBot={botId => { setActiveBotId(botId); setDisplayMode("detail"); }}
        />
        :
        <ConfigBotDetail returnToListProxy={() => setDisplayMode("list") } botId={activeBotId()} />
      }

    </div>
  )
}
