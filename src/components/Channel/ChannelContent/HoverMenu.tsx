import {Card} from "~/components/ui/card";
import {IconTrash} from "@tabler/icons-solidjs";
import DELETE_MESSAGE_DELETE from "~/api/MESSAGE/MESSAGE_DELETE";
import {getRolePower, storeMyUserinfo} from "~/stores/MyUserinfo";
import type {IMessage} from "~/types/Message";
import {Button} from "~/components/ui/button";

export default function HoverMenu(props: { message: IMessage }) {

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
  return (
    <Card class={"p-2 flex items-center gap-1"}>
      <p class={"text-sm font-extralight"}>{ new Date(props.message.createdAt).toLocaleString() }</p>
      {
        (getRolePower("manageUser") || storeMyUserinfo.id === props.message.userId)
        &&
        <Button ondblclick={deleteMessage} variant={"ghost"} class={"w-8 h-8"}><IconTrash color={"hsl(var(--destructive))"} /></Button>
      }
    </Card>
  )
}