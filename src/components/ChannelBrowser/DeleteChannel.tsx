import {IconTrash} from "@tabler/icons-solidjs";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../ui/dialog";
import { createSignal } from "solid-js";
import DELETE_CHANNEL_DELETE from "~/api/CHANNEL/CHANNEL_DELETE";
import type { IChannel } from "~/types/Channel";
import {Label} from "~/components/ui/label";

export default function DeleteChannel(props: {channel: IChannel}) {
  const [open, setOpen] = createSignal(false); //ダイアログの開閉

  /**
   * チャンネル削除
   */
  const deleteChannel = () => {
    DELETE_CHANNEL_DELETE(props.channel.id)
      .then((r) => {
        console.log("DeleteChannel :: deleteChannel :: r ->", r);
        setOpen(false); //ダイアログを閉じる
      })
      .catch((err) => {
        console.error("DeleteChannel :: deleteChannel :: err ->", err);
      });
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>
          チャンネルの削除
        </DialogTitle>
        <DialogDescription class="flex flex-col gap-4">
          次のチャンネルを本当に削除しますか？
          <p class={"text-center text-3xl font-bold"}>{ props.channel.name }</p>
        </DialogDescription>
        <DialogFooter class={"flex items-center gap-2"}>
          <Label>ダブルクリックで削除</Label>
          <Button
            ondblclick={deleteChannel}
            type="submit"
            variant={"destructive"}
          >削除する</Button>
        </DialogFooter>
      </DialogContent>
      <DialogTrigger>
        <Button variant={"destructive"}>
          <IconTrash /> 削除
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
