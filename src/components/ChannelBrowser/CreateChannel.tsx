import { IconPlus } from "@tabler/icons-solidjs";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../ui/dialog";

export default function CreateChannel() {
  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>
          チャンネル作成
        </DialogTitle>
        <DialogDescription>
          <p>テスト</p>
        </DialogDescription>
        <DialogFooter>
          <Button type="submit">作成</Button>
        </DialogFooter>
      </DialogContent>
      <DialogTrigger>
        <Button class="fixed z-50 w-14 h-14 bottom-5 right-5 md:bottom-10 md:right-10">
          <IconPlus />
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
