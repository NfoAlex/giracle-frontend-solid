import {Card} from "~/components/ui/card";
import {IconTrash} from "@tabler/icons-solidjs";
import {Button} from "@kobalte/core/button";
import DELETE_MESSAGE_DELETE from "~/api/MESSAGE/MESSAGE_DELETE";
import {getRolePower, storeMyUserinfo} from "~/stores/MyUserinfo";
import type {IMessage} from "~/types/Message";

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
    <Card class={"p-2 flex items-center"}>
      {
        (getRolePower("manageUser") || storeMyUserinfo.id === props.message.userId)
        &&
        <Button ondblclick={deleteMessage}><IconTrash color={"red"} /></Button>
      }
    </Card>
  )
}