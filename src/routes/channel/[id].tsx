import { useParams } from "@solidjs/router";
import { IconEye, IconMail } from "@tabler/icons-solidjs";
import { Show } from "solid-js";
import { api } from "~/api/index.ts";
import ChannelContents from "~/components/Channel/ChannelContents.tsx";
import ChannelHeader from "~/components/Channel/ChannelHeader.tsx";
import ChannelTextInputOld from "~/components/Channel/ChannelTextInput.old";
import ChannelTextInput from "~/components/Channel/ChannelTextInput.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { storeAppStatus } from "~/stores/AppStatus.store.ts";
import { storeChannelFetchStatus } from "~/stores/ChannelInfo.store.ts";
import { storeClientConfig } from "~/stores/ClientConfig.store";
import { storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";

export default function Channel() {
  const params = useParams<{ channelId: string }>();

  /**
   * チャンネルへ参加する
   * @param channelId 参加するチャンネルId
   */
  const joinChannel = () => {
    if (params.channelId === undefined) return;
    api.channel
      .join({ channelId: params.channelId })
      .then((r) => {
        //console.log("/channel/[id] :: joinChannel :: r ->", r);
      })
      .catch((err) =>
        console.error("/channel/[id] :: joinChannel :: err ->", err),
      );
  };

  /**
   * メッセージ入力部分を設定やチャンネル参加状態に合わせて切り替えるだけ
   */
  const inputComponentChooser = () => {
    //未参加だとプレビュー
    if (
      !storeMyUserinfo.ChannelJoin.some((c) => c.channelId === params.channelId,)
    ) {
      return (
        <Show
          when={storeChannelFetchStatus[params.channelId] === "AVAILABLE"}
        >
          <Card class="p-4 flex items-center gap-2">
            <IconEye />
            チャンネルプレビュー中
            <Button onClick={joinChannel} class="ml-auto">
              <IconMail />
              参加する
            </Button>
          </Card>
        </Show>
      );
    }

    //旧式を使う
    if (storeClientConfig.chat.useOldInput) {
      return (<ChannelTextInputOld />);
    }

    return (<ChannelTextInput />);
  }

  return (
    <div class="w-full h-screen mx-auto p-2 flex flex-col">
      <ChannelHeader />

      {storeAppStatus.loggedIn ? (
        <Show when={storeChannelFetchStatus[params.channelId] === "AVAILABLE"}>
          <ChannelContents />
        </Show>
      ) : (
        <p class={"text-center mt-5"}>Loading...</p>
      )}

      {
        //メッセージ入力部分と、チャンネル未参加時用のプレビュー表示
        inputComponentChooser()
      }
    </div>
  );
}
