import {Card} from "~/components/ui/card";
import {IconTrash} from "@tabler/icons-solidjs";
import {Button} from "@kobalte/core/button";
import DELETE_MESSAGE_DELETE from "~/api/MESSAGE/MESSAGE_DELETE";

export default function HoverMenu(props: { messageId: string }) {

  /**
   * メッセージの削除
   */
  const deleteMessage = () => {
    DELETE_MESSAGE_DELETE(props.messageId)
      .then(() => {
        //console.log("DELETE_MESSAGE_DELETE :: r->", r);
      })
      .catch((e) => {
        console.error("DELETE_MESSAGE_DELETE :: e->", e);
      });
  }
  return (
    <Card class={"p-2 flex items-center"}>
      <Button ondblclick={deleteMessage}><IconTrash color={"red"} /></Button>
    </Card>
  )
}