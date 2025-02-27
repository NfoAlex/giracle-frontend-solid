import {Dialog, DialogContent} from "~/components/ui/dialog";
import {Card} from "~/components/ui/card";
import type {IMessage} from "~/types/Message";
import MessageTextRender from "~/components/Channel/ChannelContent/MessageRender/MessageTextRender";
import {createSignal, For, Show} from "solid-js";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import URLPreview from "~/components/Channel/ChannelContent/MessageRender/URLPreview";
import FilePreview from "~/components/Channel/ChannelContent/MessageRender/FilePreview";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import {Avatar, AvatarImage} from "~/components/ui/avatar";
import {getterUserinfo} from "~/stores/Userinfo";
import {IconBrowserMaximize} from "@tabler/icons-solidjs";
import {storeMyUserinfo} from "~/stores/MyUserinfo";
import RenderEmojiReactions from "~/components/Channel/ChannelContent/MessageRender/RenderEmojiReactions";

export default function LongTextDisplay(props: { message: IMessage }) {
  const [open, setOpen] = createSignal(false);

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
      <Card class={"w-full p-2 flex flex-col gap-2"}>
        <MessageTextRender content={props.message.content.slice(0,100) + "..."} />
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