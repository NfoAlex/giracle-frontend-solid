import { IconPlus } from "@tabler/icons-solidjs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { createSignal } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel } from "../../ui/text-field";
import { Button } from "~/components/ui/button";
import PUT_SERVER_CREATE_INVITE from "~/api/SERVER/SERVER_CREATE_INVITE";
import type { IInvite } from "~/types/Server";

export default function CreateInvite(props: { inviteActionTaken: (dat: IInvite) => void }) {
  const [code, setCode] = createSignal<string>("");
  const [open, setOpen] = createSignal(false); //ダイアログの開閉

  /**
   * 招待を作成する
   */
  const createInvite = () => {
    PUT_SERVER_CREATE_INVITE(code())
      .then((r) => {
        console.log("CreateInvite :: createInvite :: r->", r);
        setCode("");
        props.inviteActionTaken(r.data); //親に伝える
        setOpen(false); //ダイアログを閉じる
      })
      .catch((e) => {
        console.error("CreateInvite :: createInvite :: e->", e);
      });
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent id="dialogCreateInvite">
        <DialogTitle>
          招待を作成する
        </DialogTitle>
        <DialogDescription class="flex flex-col gap-4">
          <TextField class="grid w-full items-center gap-2">
            <TextFieldLabel for="email">招待コード</TextFieldLabel>
            <TextFieldInput
              type="text"
              placeholder="abc123!@*"
              value={code()}
              onInput={(e)=>setCode(e.currentTarget.value)}
            />
          </TextField>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={createInvite}
            disabled={code() === ""}
            type="submit"
          >作成</Button>
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
