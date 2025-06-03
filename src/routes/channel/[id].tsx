import { useParams } from "@solidjs/router";
import { IconEye, IconMail } from "@tabler/icons-solidjs";
import ChannelContents from "~/components/Channel/ChannelContents";
import ChannelHeader from "~/components/Channel/ChannelHeader";
import ChannelTextInput from "~/components/Channel/ChannelTextInput";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {storeAppStatus} from "~/stores/AppStatus";
import { storeMyUserinfo } from "~/stores/MyUserinfo";

export default function Channel() {
  const params = useParams();
  
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
            <Button class="ml-auto"><IconMail />参加する</Button>
          </Card>
      }
    </div>
  );
}
