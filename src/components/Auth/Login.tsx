import { useNavigate } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import POST_USER_LOGIN from "~/api/USER/USER_LOGIN";
import InitLoad from "~/utils/InitLoad";
import { Button } from "../ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "../ui/text-field";
import { Callout, CalloutContent } from "../ui/callout";

export default function Login() {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [result, setResult] = createSignal<"success" | "error" | "">("");
  const navi = useNavigate();

  //ログインする
  const loginIt = async () => {
    POST_USER_LOGIN(username(), password())
      .then((r) => {
        setResult("success");
        console.log("r->", r);

        InitLoad(r.data.userId);

        //ページ移動
        navi("/");
      })
      .catch((e) => {
        setResult("error");
        console.log("e->", e);
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
          placeholder=")a{|s}f`@d"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
        />
      </TextField>

      <Show when={result() === "error"}>
        <Callout variant={"error"}>
          <CalloutContent>ログインエラー</CalloutContent>
        </Callout>
      </Show>

      <Button
        onClick={loginIt}
        class="w-full"
        disabled={password().length === 0}
      >
        ログイン
      </Button>
    </div>
  );
}
