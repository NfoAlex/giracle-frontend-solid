import { Show, createSignal } from "solid-js";
import POST_USER_REGISTER from "~/api/USER/USER_REGISTER";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "../ui/text-field";

export default function Register() {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [result, setResult] = createSignal("");

  const signUp = async () => {
    await POST_USER_REGISTER(username(), password())
      .then((res) => {
        console.log("Register :: signUp : res->", res);
        setResult("success");
      })
      .catch((err) => {
        console.log("Register :: signUp : err->", err);
        setResult("error");
      });
  };

  return (
    <div class="grid gap-4 py-4">
      <TextField class="grid w-full items-center gap-1.5">
        <TextFieldLabel for="username">ユーザー名</TextFieldLabel>
        <TextFieldInput
          type="text"
          placeholder="Member"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
        />
      </TextField>

      <TextField class="grid w-full items-center gap-1.5">
        <TextFieldLabel for="email">パスワード</TextFieldLabel>
        <TextFieldInput
          type="password"
          placeholder="#$%&@"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
        />
      </TextField>

      <Show when={result() === "error"}>
        <p>登録エラー</p>
      </Show>
      <Show when={result() === "success"}>
        <Alert>
          <AlertTitle>成功!</AlertTitle>
          <AlertDescription>
            {username()}でログインしてください
          </AlertDescription>
        </Alert>
      </Show>

      <Button
        onClick={signUp}
        class="w-full"
        disabled={password().length === 0 || result() === "success"}
      >
        登録する
      </Button>
    </div>
  );
}
