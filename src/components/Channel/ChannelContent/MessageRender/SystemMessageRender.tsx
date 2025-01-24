import {Card} from "~/components/ui/card";
import type {ISystemMessage} from "~/types/Message";
import {getterUserinfo} from "~/stores/Userinfo";

export default function SystemMessageRender(props: { content: string }) {
  const systemMsg: ISystemMessage = JSON.parse(props.content);

  return (
    <Card class={"px-4 py-2"}>
      {systemMsg.messageTerm === "WELCOME" && (
        <p>{getterUserinfo(systemMsg.targetUserId).name}さんがGiracleに参加しました!ようこそ</p>
      )}
      {systemMsg.messageTerm === "CHANNEL_JOIN" && (
        <p>{getterUserinfo(systemMsg.targetUserId).name}さんがチャンネルへ参加しました！</p>
      )}
      {systemMsg.messageTerm === "CHANNEL_LEFT" && (
        <p>{getterUserinfo(systemMsg.targetUserId).name}さんがチャンネルを退出しました。</p>
      )}
    </Card>
  );
}