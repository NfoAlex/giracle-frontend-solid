import { IconPlus, IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For } from "solid-js";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { getterUserinfo } from "~/stores/Userinfo";
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
        <Button class="w-full">ユーザーを招待する</Button>
      </DialogTrigger>

      <DialogContent>
        <div class="mt-9 w-full flex items-center gap-2">
          <TextField class="w-full">
            <TextFieldInput
              value={searchQuery()}
              onInput={(e)=>setSearchQuery(e.currentTarget.value)}
              placeholder="招待するユーザー名を検索"
            />
          </TextField>

          <Button onclick={()=>searchIt(false)} size="icon"><IconSearch /></Button>
        </div>

        <hr class={"my-2"} />

        <For each={userList()}>
          {
            (user) => (
              <UserinfoModalWrapper userId={user.id}>
                <div class="p-2 w-full flex flex-row items-center gap-2 hover:bg-border rounded cursor-pointer">
                  <Avatar class="w-8 h-8">
                    <AvatarFallback >{ user.id.slice(0,2) }</AvatarFallback>
                    <AvatarImage src={"/api/user/icon/" + user.id} alt={user.id} />
                  </Avatar>
                  { getterUserinfo(user.id).name }

                  <Button class="ml-auto" size="icon"><IconPlus /></Button>
                </div>
              </UserinfoModalWrapper>
            )
          }
        </For>
      </DialogContent>
    </Dialog>
  );
}