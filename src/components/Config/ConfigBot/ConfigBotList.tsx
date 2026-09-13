import { createSignal, For, onMount } from "solid-js";
import { api } from "~/api";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { IBot } from "~/types/Server";
import SubmitBotCreation from "./ConfigBotList/SubmitBotCreation";

export default function ConfigBotList(props: { setActiveBot: (botId: string) => void }) {
  const [myBots, setMyBots] = createSignal<Pick<IBot, "id" | "botName" | "approveStatus" | "createdAt" | "createdBy">[]>([]);
  const [processing, setProcessing] = createSignal(false);

  const fetchList = async () => {
    setProcessing(true);
    api.server.getBot()
      .then((res) => {
        setMyBots(res.data);
      })
      .catch(e => {
        console.error("ConfigBotList :: fetchList : ", e);
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  /**
   * 作ったBotを一覧に追加するためだけのもの
   * @param botCreated
   */
  const myBotsBinder = (botCreated: IBot) => {
    setMyBots(b => [botCreated, ...b])
  };

  onMount(fetchList);

  return (
    <div class="grow h-full flex flex-col gap-2">

      <div class="flex items-center justify-end gap-2">
        <Button variant={"outline"}>ボット一覧を再取得</Button>
        <SubmitBotCreation dataBinder={myBotsBinder} />
      </div>

      <Card class="grow p-2">
        { //取得中表示
          processing()
          &&
          <div class="mt-5 text-center">
            取得中...
          </div>
        }
        { //ボットが無いときの表示
          (myBots().length === 0 && !processing())
          &&
          <div class="mt-5 text-center">
            ボットがありません。
          </div>
        }

        <For each={myBots()}>
          {
            (bot) => (
              <div onClick={()=>props.setActiveBot(bot.id)}>
                { bot.botName }
              </div>
            )
          }
        </For>
      </Card>
    </div>
  );
}
