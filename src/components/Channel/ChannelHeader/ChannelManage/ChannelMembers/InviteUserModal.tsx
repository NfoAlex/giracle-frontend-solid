import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput } from "~/components/ui/text-field";

export default function InviteUserModal(props: { channelId: string }) {
  const [searchQuery, setSearchQuery] = createSignal("");

  return (
    <Dialog>
      <DialogTrigger>
        <Button>ユーザーを招待する</Button>
      </DialogTrigger>

      <DialogContent>
        <TextField>
          <TextFieldInput
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder="招待するユーザー名を検索"
          />

          <hr class={"my-4"} />

          <div>ここで結果表示</div>
        </TextField>
      </DialogContent>
    </Dialog>
  );
}