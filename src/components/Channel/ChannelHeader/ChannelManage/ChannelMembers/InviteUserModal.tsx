import { IconSearch } from "@tabler/icons-solidjs";
import { createSignal } from "solid-js";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { IUser } from "~/types/User";

export default function InviteUserModal(props: { channelId: string }) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [userList, setUserList] = createSignal<IUser[]>([]);
  const [cursor, setCursor] = createSignal<number>(0);

  /**
   * ユーザーの検索をする
   * @param optionInsert 結果に追加挿入する形で検索するかどうか（cursorを進めて検索）
   */
  const searchIt = (optionInsert = false) => {
    GET_USER_SEARCH(searchQuery(), "", cursor())
      .then((r) => {
        if (optionInsert) {
          setUserList(r.data);
        } else {
          setUserList((u) => [...u, ...r.data]);
        }
      })
      .catch((e) => console.error("InviteUserModal :: searchIt : エラー -> ", e));
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button>ユーザーを招待する</Button>
      </DialogTrigger>

      <DialogContent>
        <div class="flex items-center gap-2">
          <TextField>
            <TextFieldInput
              value={searchQuery()}
              onInput={setSearchQuery}
              placeholder="招待するユーザー名を検索"
            />
          </TextField>

          <Button onclick={()=>searchIt(false)} size="icon"><IconSearch /></Button>
        </div>

        <hr class={"my-4"} />

        <div>ここで結果表示</div>
      </DialogContent>
    </Dialog>
  );
}