import {Card} from "~/components/ui/card";
import type {ISystemMessage} from "~/types/Message";
import {getterUserinfo} from "~/stores/Userinfo";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";

export default function SystemMessageRender(props: { content: string }) {
  const systemMsg: ISystemMessage = JSON.parse(props.content);

  return (
    <Card class={"px-4 py-2 my-1"}>
      {systemMsg.messageTerm === "WELCOME" && (
        <p>
          <UserinfoModalWrapper userId={systemMsg.targetUserId} class={"hover:underline"}>
            {getterUserinfo(systemMsg.targetUserId).name}
          </UserinfoModalWrapper>さんがGiracleに参加しました!ようこそ
        </p>
      )}
      {systemMsg.messageTerm === "CHANNEL_JOIN" && (
        <p>
          <UserinfoModalWrapper userId={systemMsg.targetUserId} class={"hover:underline"}>
            {getterUserinfo(systemMsg.targetUserId).name}
          </UserinfoModalWrapper>さんがチャンネルへ参加しました！
        </p>
      )}
      {systemMsg.messageTerm === "CHANNEL_LEFT" && (
        <p>
          <UserinfoModalWrapper userId={systemMsg.targetUserId} class={"hover:underline"}>
            {getterUserinfo(systemMsg.targetUserId).name}
          </UserinfoModalWrapper>さんがチャンネルを退出しました。
        </p>
      )}
      {systemMsg.messageTerm === "CHANNEL_INVITED" && (
        <p>
          <UserinfoModalWrapper userId={systemMsg.targetUserId} class={"hover:underline"}>
            {getterUserinfo(systemMsg.targetUserId).name}
          </UserinfoModalWrapper>さんが招待されました!
        </p>
      )}
      {systemMsg.messageTerm === "CHANNEL_KICKED" && (
        <p>
          <UserinfoModalWrapper userId={systemMsg.targetUserId} class={"hover:underline"}>
            {getterUserinfo(systemMsg.targetUserId).name}
          </UserinfoModalWrapper>さんがチャンネルからキックされました。
        </p>
      )}
    </Card>
  );
}