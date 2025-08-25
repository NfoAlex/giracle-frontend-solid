import { createMutable } from "solid-js/store";

//返信先メッセージIDを格納するプロキシmutable
const storeReplyingMessageId = createMutable<{[channelId: string]: string}>({ });

export default storeReplyingMessageId;