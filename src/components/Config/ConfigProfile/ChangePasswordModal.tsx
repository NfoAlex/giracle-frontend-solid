import { createSignal, Show } from "solid-js";
import POST_USER_CHANGE_PASSWORD from "~/api/USER/USER_CHANGE_PASSWORD";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { IconExclamationCircle, IconLockCode, IconKeyFilled, IconKey } from '@tabler/icons-solidjs';

export default function ChangePasswordModal() {
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [checkingPassword, setCheckingPassword] = createSignal("");
  const [processing, setProcessing] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const [displayError, setDisplayError] = createSignal<boolean>(false);

  const initialize = () => {
    setCurrentPassword("");
    setNewPassword("");
    setCheckingPassword("");
    setSuccess(false);
    setProcessing(false);
    setDisplayError(false);
  }

  /**
   * パスワードを変更
   */
  const changePassword = () => {
    setProcessing(true);
    setDisplayError(false);
    POST_USER_CHANGE_PASSWORD(currentPassword(), newPassword())
      .then((r) => {
        console.log("changePassword :: r->", r);
        setSuccess(true);
      })
      .catch((e) => {
        console.error("changePassword :: e->", e);
        setDisplayError(true);
      })
      .finally(() => {
        setProcessing(false);
      });
  }

  return (
    <Dialog>
      <DialogTrigger class="w-full">
        <Button onClick={initialize} class="w-full">パスワードを変更</Button>
      </DialogTrigger>

      <DialogContent>
        {
        success()
        ?
          <div class="text-center flex flex-col gap-4">
            <IconKeyFilled class="w-8 h-8 mx-auto" />
            <p>パスワードを変更しました。</p>
          </div>
          :
          <>
            <DialogHeader>
              パスワードを変更する
            </DialogHeader>

            <TextField class="flex flex-col gap-2">
              <Label class="flex items-center gap-2">
                <IconLockCode />
                現在のパスワード
              </Label>
              <TextFieldInput
                type="password"
                placeholder="現在のパスワード"
                value={currentPassword()}
                onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              />
            </TextField>

            <TextField class="flex flex-col gap-2 mt-4">
              <Label class="flex items-center gap-2">
                <IconKeyFilled />
                新しいパスワード
              </Label>
              <TextFieldInput
                type="password"
                placeholder="新しいパスワード"
                value={newPassword()}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
              />
            </TextField>

            <TextField class="flex flex-col gap-2">
              <Label class="flex items-center gap-2">
                <IconKey />
                新しいパスワードの確認
              </Label>
              <TextFieldInput
                type="password"
                placeholder="パスワード確認"
                value={checkingPassword()}
                onChange={(e) => setCheckingPassword(e.currentTarget.value)}
              />
            </TextField>

            <DialogFooter>
              <Button
                onClick={() => changePassword()}
                disabled={processing() || newPassword().length < 8 || newPassword() !== checkingPassword()}
              >更新</Button>
            </DialogFooter>

            <Show when={displayError()}>
              <Alert variant={"destructive"}>
                <IconExclamationCircle class="w-5 h-5" />
                <AlertTitle>
                  <p>エラーが発生しました。現在のパスワードが合っているか確認してください。</p>
                </AlertTitle>
              </Alert>
            </Show>
          </>
        }
      </DialogContent>
    </Dialog>
  );
}