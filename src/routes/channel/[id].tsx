import { useParams } from "@solidjs/router";
import { IconEye, IconMail } from "@tabler/icons-solidjs";
import POST_CHANNEL_JOIN from "~/api/CHANNEL/CHANNEL_JOIN.ts";
import ChannelContents from "~/components/Channel/ChannelContents.tsx";
import ChannelHeader from "~/components/Channel/ChannelHeader.tsx";
import ChannelTextInput from "~/components/Channel/ChannelTextInput.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import {storeAppStatus} from "~/stores/AppStatus.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";

export default function Channel() {
  const params = useParams();

  /**
   * チャンネルへ参加する
   * @param channelId 参加するチャンネルId
   */
    const joinChannel = () => {
      if (params.channelId === undefined) return;
      POST_CHANNEL_JOIN(params.channelId)
        .then((r) => {
          //console.log("/channel/[id] :: joinChannel :: r ->", r);
        })
        .catch((err) => console.error("/channel/[id] :: joinChannel :: err ->", err));
    }
  
  return (
    <div class="w-full h-screen mx-auto p-2 flex flex-col">
      <ChannelHeader />

      {
        storeAppStatus.loggedIn ? (
          <ChannelContents />
        ) : (
          <p class={"text-center mt-5"}>Loading...</p>
        )
      }

      { //メッセージ入力部分と、チャンネル未参加時用のプレビュー表示
        storeMyUserinfo.ChannelJoin.some((c) => c.channelId === params.channelId)
        ?
          <ChannelTextInput />
        :
          <Card class="p-4 flex items-center gap-2">
            <IconEye />チャンネルプレビュー中
            <Button onClick={joinChannel} class="ml-auto"><IconMail />参加する</Button>
          </Card>
      }
    </div>
  );
}
