import { IconSearch } from "@tabler/icons-solidjs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import {Avatar, AvatarImage} from "~/components/ui/avatar";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";
import {getterUserinfo, storeUserOnline} from "~/stores/Userinfo";
import {For, createSignal, createMemo} from "solid-js";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";

export default function Search() {
  const [query, setQuery] = createSignal("");
  
  const searchResults = createMemo(() => {
    const q = query().trim();

    if (!q) {
      return storeUserOnline;
    }

    return storeUserOnline.filter(userId => {
      const userInfo = getterUserinfo(userId);      
      return userInfo.name.includes(q);
    });
  });
  
  return (
    <div class="h-svh pt-2 px-2 overflow-y-hidden flex flex-col">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>おんらいんゆーざー</p>
        <Badge class={"ml-auto"}>{storeUserOnline.length}</Badge>
      </Card>
      
      <span class="mx-auto w-full flex items-center gap-2 mt-2">
        <TextField class="grow">
          <TextFieldInput
            placeholder="ユーザーを検索"
            class="h-12 md:h-10"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)} 
          />
        </TextField>

        <Button
          size={"icon"}
          class="md:w-10 md:h-10 h-12 w-12"
        ><IconSearch /></Button>
      </span>

      <hr class=" mt-2" />

      <div class={"max-h-96 overflow-y-auto flex flex-col"}>
        <For each={searchResults()}>
          {(userId) => (
            <UserinfoModalWrapper userId={userId} class={"p-2 rounded-md flex items-center gap-2 hover:bg-accent"}>
              <Avatar class={"w-8 h-auto"}>
                <AvatarImage src={`/api/user/icon/${userId}`}/>
              </Avatar>
              <p class={"truncate"}>
                {getterUserinfo(userId).name}
              </p>
            </UserinfoModalWrapper>
          )}
        </For>
      </div>
    </div>
  );
}