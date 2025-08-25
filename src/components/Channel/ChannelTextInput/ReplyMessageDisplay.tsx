import { createMemo } from "solid-js";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { IconCornerUpLeft, IconX } from "@tabler/icons-solidjs";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { storeHistory } from "~/stores/History";
import storeReplyingMessageId from "~/stores/ReplyingMessageId";
import { getterUserinfo } from "~/stores/Userinfo";
import type { IMessage } from "~/types/Message";

export default function ReplyMessageDisplay(props: {messageId: string, channelId: string, onRemove: () => void}) {

  /**
   * 返信先メッセージの情報を取得するだけ
   */
  const getReplyingMessage = createMemo((): IMessage => {
    const msgHolder: IMessage = {
      id: "",
      channelId: "",
      userId: "",
      content: "存在しないメッセージ",
      isEdited: false,
      createdAt: "",
      isSystemMessage: false,
      MessageUrlPreview: [],
      MessageFileAttached: [],
      reactionSummary: []
    };
    try {
      const msg = storeHistory[props.channelId].history.find(m => m.id===storeReplyingMessageId[props.channelId]);
      if (msg === undefined) return msgHolder;
      return msg;
    }  catch(e) {
      return msgHolder;
    }
  });

  return (
    <Card class="w-full p-2 flex items-center gap-1">
      <div class="radius p-2 rounded-md">
        <IconCornerUpLeft class="shrink-0 w-4 h-4" />
      </div>
      <div class="p-2 shrink-0 cursor-pointer hover:bg-border rounded">
        <IconX onClick={props.onRemove} class="w-4 h-4" />
      </div>

      <div class="ml-2 grow flex items-center gap-2 truncate">

        <Avatar class="w-8 h-8">
          <AvatarImage src={`/api/user/icon/${getReplyingMessage().userId}`} />
          <AvatarFallback class="w-full h-full">{getReplyingMessage().userId}</AvatarFallback>
        </Avatar>
        <p class="truncate shrink-0 font-bold" style="max-width: 25%">
          { getterUserinfo(getReplyingMessage().userId).name || "不明なユーザー" }
        </p>
        {
          getReplyingMessage().MessageFileAttached.length > 0
          &&
          <Badge>{getReplyingMessage().MessageFileAttached.length}件の添付ファイル</Badge>
        }
        <p class="truncate grow shrink-0 text-left">
          { getReplyingMessage().content }
        </p>
      </div>
    </Card>
  )
}