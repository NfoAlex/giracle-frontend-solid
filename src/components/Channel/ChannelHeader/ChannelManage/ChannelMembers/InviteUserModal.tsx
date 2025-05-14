import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

export default function InviteUserModal(props: { channelId: string }) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button>ユーザーを招待する</Button>
      </DialogTrigger>

      <DialogContent>

      </DialogContent>
    </Dialog>
  );
}