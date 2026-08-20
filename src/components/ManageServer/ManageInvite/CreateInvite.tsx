import { IconPlus } from "@tabler/icons-solidjs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../../ui/dialog.tsx";
import { createSignal } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel } from "../../ui/text-field";
import { Button } from "~/components/ui/button.tsx";
import { api } from "~/api/index.ts";
import type { IInvite } from "~/types/Server.ts";
import { NumberField, NumberFieldDecrementTrigger, NumberFieldErrorMessage, NumberFieldGroup, NumberFieldIncrementTrigger, NumberFieldInput } from "~/components/ui/number-field.tsx";
import { Label } from "~/components/ui/label.tsx";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch.tsx";

export default function CreateInvite(props: { inviteActionTaken: (dat: IInvite) => void }) {
  const [code, setCode] = createSignal<string>("");
  const [open, setOpen] = createSignal(false); //ダイアログの開閉
  const [maxUsage, setMaxUsage] = createSignal(5);
  const [unlimitedInvites, setUnlimitedInvites] = createSignal(false);

  /**
   * 招待を作成する
   */
  const createInvite = () => {
    api.server.createInvite({ inviteCode: code(), maxUsage: unlimitedInvites() ? -1 : maxUsage() })
      .then((r) => {
        //console.log("CreateInvite :: createInvite :: r->", r);
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

          <Label class="-mb-2">コードの使用上限</Label>
          <NumberField
            class="flex w-36 flex-col gap-2"
            onRawValueChange={setMaxUsage}
            validationState={maxUsage() <= 0 ? "invalid" : "valid"}
            disabled={unlimitedInvites()}
          >
            <NumberFieldGroup>
              <NumberFieldInput />
              <NumberFieldIncrementTrigger />
              <NumberFieldDecrementTrigger />
            </NumberFieldGroup>
            <NumberFieldErrorMessage>1以上に設定してください</NumberFieldErrorMessage>
          </NumberField>
          <Switch
            checked={unlimitedInvites()}
            onChange={setUnlimitedInvites}
            class="flex items-center"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel class="ml-2">上限を設定しない</SwitchLabel>
          </Switch>

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
        <Button class="w-14 h-14">
          <IconPlus />
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
