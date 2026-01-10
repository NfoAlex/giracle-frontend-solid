import {Card} from "~/components/ui/card.tsx";
import type {IMessage} from "~/types/Message.ts";
import {createSignal, For, Show} from "solid-js";
import {Button} from "~/components/ui/button.tsx";
import {Badge} from "~/components/ui/badge.tsx";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";
import {Avatar, AvatarImage} from "~/components/ui/avatar.tsx";
import {getterUserinfo} from "~/stores/Userinfo.ts";
import {IconBrowserMaximize} from "@tabler/icons-solidjs";
import {storeMyUserinfo} from "~/stores/MyUserinfo.ts";
import MessageTextRender from "./MessageTextRender.tsx";
import URLPreview from "./URLPreview.tsx";
import { Dialog, DialogContent } from "~/components/ui/dialog.tsx";
import FilePreview from "./FilePreview.tsx";
import RenderEmojiReactions from "./RenderEmojiReactions.tsx";

export default function LongTextDisplay(props: { message: IMessage }) {
  const [open, setOpen] = createSignal(false);

  /**
   * 改行の数計算(長文表示用)
   */
  const breakLinesNum = () => {
    const breakLines = props.message.content.match(/\n/g);
    if (breakLines === null) return 0;
    return breakLines.length;
  };

  return (
    <>
      {/* メッセージ展開の表示 */}
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent class={"overflow-y-auto w-[100vw] md:w-[75vw]"} style={"max-width:750px;"}>
          {/* アバターの名前表示 */}
          <span class={"mt-5 flex items-center gap-3 truncate"}>
            <UserinfoModalWrapper userId={props.message.userId} >
              <Avatar class="mx-auto w-8 h-8">
                <AvatarImage src={`/api/user/icon/${props.message.userId}`} />
              </Avatar>
            </UserinfoModalWrapper>
            <p class={"line-clamp-1 truncate"}>{ getterUserinfo(props.message.userId).name }</p>
            <Badge variant={"secondary"} class={"ml-auto"}>{ new Date(props.message.createdAt).toLocaleString() }</Badge>
          </span>
          <hr />

          {/* ここから内容 */}
          <MessageTextRender content={props.message.content} />

          { //URLプレビュー
            (props.message.MessageUrlPreview?.length > 0) && <URLPreview MessageUrlPreview={props.message.MessageUrlPreview} />
          }

          { //ファイルプレビュー
            props.message.MessageFileAttached?.length > 0
            &&
            (
              <For each={props.message.MessageFileAttached}>
                {(f) => <FilePreview file={f} />}
              </For>
            )
          }

          {/* 編集済み表示 */}
          <Show when={props.message.isEdited}>
            <p class={"text-muted-foreground text-xs"}>編集済み</p>
          </Show>

          {/* 絵文字リアクション表示 */}
          <Show when={props.message.reactionSummary && props.message.reactionSummary.length > 0}>
            <RenderEmojiReactions reaction={props.message.reactionSummary} messageId={props.message.id} channelId={props.message.channelId} />
          </Show>
        </DialogContent>
      </Dialog>

      {/* 通常表示 */}
      <Card class={"w-full p-3 my-1 flex flex-col gap-2"}>
        {/* メッセージレンダー、改行が多ければ省略表示する文字数を減らす */}
        <MessageTextRender
          content={breakLinesNum() > 5 ? props.message.content.slice(0,10) + "..." : props.message.content.slice(0,100) + "..."}
        />
        <hr />
        <span class={"flex items-center"}>
          <Button onClick={()=>setOpen(true)} size={"sm"}>
            <IconBrowserMaximize />
            長文メッセージを展開する
          </Button>

          <span class={"ml-auto flex items-center gap-2"}>
            {/* 自分宛てのメンションがあったときのバッジ表示 */}
            <Show when={props.message.content.includes("@<" + storeMyUserinfo.id + ">")}>
              <Badge>
                @メンションされています
              </Badge>
            </Show>

            <Badge variant={"secondary"}>
              { props.message.content.length }文字
            </Badge>
          </span>
        </span>
      </Card>
    </>
  );
}