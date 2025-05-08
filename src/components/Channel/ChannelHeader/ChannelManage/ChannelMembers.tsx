import { IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For, onMount } from "solid-js";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { getterUserinfo } from "~/stores/Userinfo";
import type { IUser } from "~/types/User";

export default function ChannelMembers(props: {channelId: string}) {
  const [users, setUsers] = createSignal<IUser[]>([]);
  const [searchQuery, setSearchQuery] = createSignal<string>("");

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    GET_USER_SEARCH(
      searchQuery(),
      props.channelId,
      0
    )
    .then((r) => {
      console.log(r);
      // const userIdArr = r.map((u) => u.userId);
      setUsers(r.data);
    })
    .catch((e) => console.error("ChannelMembers :: fetchUsers : e", e));
  };

  onMount(() => {
    fetchUsers();
  });
  
  return (
    <div class="max-h-[400px] flex flex-col gap-3 mt-2">
      <TextField>
        <span class="flex items-center gap-2">
          <TextFieldInput
            value={searchQuery()}
            onInput={(e)=>setSearchQuery(e.currentTarget.value)}
            placeholder="ユーザー名検索"
          />
          <Button onClick={fetchUsers} size={"icon"} class="shrink-0"><IconSearch /></Button>
        </span>
      </TextField>

      <Card class="p-1 overflow-y-auto flex flex-col grow">
        <For each={users()}>
          {
            (user) => (
              <UserinfoModalWrapper userId={user.id}>
                <div class="p-2 w-full flex flex-row items-center gap-2 hover:bg-border rounded cursor-pointer">
                  <Avatar class="w-8 h-8">
                    <AvatarFallback >{ user.id.slice(0,2) }</AvatarFallback>
                    <AvatarImage src={"/api/user/icon/" + user.id} alt={user.id} />
                  </Avatar>
                  { getterUserinfo(user.id).name }
                </div>
              </UserinfoModalWrapper>
            )
          }
        </For>
      </Card>
    </div>
  );
}