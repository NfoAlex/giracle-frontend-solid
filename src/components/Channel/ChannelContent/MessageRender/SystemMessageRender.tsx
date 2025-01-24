import {Card} from "~/components/ui/card";
import type {ISystemMessage} from "~/types/Message";

export default function SystemMessageRender(props: { content: string }) {
  const systemMsg: ISystemMessage = JSON.parse(props.content);

  return (
    <Card class={"px-4 py-2"}>
      {systemMsg.messageTerm === "WELCOME" && (<p>ようこそ</p>)}
      {systemMsg.messageTerm === "CHANNEL_JOIN" && (<p>がチャンネルへ参加しました！</p>)}
      {systemMsg.messageTerm === "CHANNEL_LEFT" && (<p>がチャンネルを退出しました。</p>)}
    </Card>
  );
}