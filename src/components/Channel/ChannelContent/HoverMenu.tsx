import {Card} from "~/components/ui/card";
import {IconTrash} from "@tabler/icons-solidjs";
import {Button} from "@kobalte/core/button";

export default function HoverMenu(props: { messageId: string }) {

  /**
   * メッセージの削除
   */
  const deleteMessage = () => {

  }
  return (
    <Card class={"p-2 flex items-center"}>
      <Button><IconTrash /></Button>
    </Card>
  )
}