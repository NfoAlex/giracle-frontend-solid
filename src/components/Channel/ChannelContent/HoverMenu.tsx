import {Card} from "~/components/ui/card";
import {IconPencil, IconTrash} from "@tabler/icons-solidjs";
import DELETE_MESSAGE_DELETE from "~/api/MESSAGE/MESSAGE_DELETE";
import {getRolePower, storeMyUserinfo} from "~/stores/MyUserinfo";
import type {IMessage} from "~/types/Message";
import {Button} from "~/components/ui/button";
import EmojiPicker from "~/components/Channel/ChannelContent/HoverMenu/EmojiPicker";
import {createSignal} from "solid-js";

export default function HoverMenu(props: { message: IMessage, onEditMode: (id: string) => void }) {
  const [openEmoji, setOpenEmoji] = createSignal(false);

  /**
   * メッセージの削除
   */
  const deleteMessage = () => {
    DELETE_MESSAGE_DELETE(props.message.id)
      .then(() => {
        //console.log("DELETE_MESSAGE_DELETE :: r->", r);
      })
      .catch((e) => {
        console.error("DELETE_MESSAGE_DELETE :: e->", e);
      });
  }

  /**
   * 編集モードに入る
   */
  const enterEditMode = () => {
    props.onEditMode(props.message.id);
  }

  return (
    <Card class={"p-2 flex items-center"}>
      <p class={"text-sm font-extralight mr-2"}>{ new Date(props.message.createdAt).toLocaleString() }</p>

      <div class={"relative"}>
        <Button onClick={()=>setOpenEmoji(true)}>えもじ</Button>
        { openEmoji() && <EmojiPicker /> }
      </div>
      {
        storeMyUserinfo.id === props.message.userId
        &&
        <Button onclick={enterEditMode} variant={"ghost"} class={"w-8 h-8"}><IconPencil /></Button>
      }
      { //削除ボタン
        (getRolePower("manageUser") || storeMyUserinfo.id === props.message.userId)
        &&
        <Button ondblclick={deleteMessage} variant={"ghost"} class={"w-8 h-8"}><IconTrash color={"hsl(var(--destructive))"} /></Button>
      }
    </Card>
  )
}