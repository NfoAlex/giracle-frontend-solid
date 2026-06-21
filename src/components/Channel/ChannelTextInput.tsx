import { createMemo, createSignal, For, Match, Show, Switch as SolidSwitch } from "solid-js";
import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND.ts";
import storeReplyingMessageId from "~/stores/ReplyingMessageId.ts";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.ts";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay.tsx";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview.tsx";
import { Button } from "../ui/button.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Card } from "../ui/card.tsx";
import { IChannel } from "~/types/Channel.ts";
import { IUser } from "~/types/User.ts";
import RichTextInput, { IInputSections, parseSectionsToText } from "./ChannelTextInput/RichTextInput.tsx";

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  const currentChannelId = createMemo(() => params.channelId ?? "");

  const [inp, setInp] = createSignal<IInputSections[]>([]);
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルID of string array

  const sendMsg = () => {
    const rawText = parseSectionsToText(inp());
    if (rawText.trim() === "" && fileIds().length === 0) return;

    POST_MESSAGE_SEND(currentChannelId(), rawText, fileIds(), undefined)
      .then(() => { })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });

    //初期化処理
    setInp([]);
    setFileIds([]);
    delete storeReplyingMessageId[currentChannelId()];
  };

  return (
    <div class={"flex flex-col gap-2 pb-1"}>
      <div class="w-full relative flex items-center gap-1">
        <RichTextInput
          value={inp()}
          onInput={setInp}
          onSubmit={sendMsg}
          placeholder="メッセージを送信"
        />
        <Button onClick={sendMsg} size={"icon"} class={"shrink-0"}><IconSend /></Button>
      </div>
    </div>
  );
}
