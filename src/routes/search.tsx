import { IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For } from "solid-js";
import GET_MESSAGE_SEARCH from "~/api/MESSAGE/MESSAGE_SEARCH";
import MessageRender from "~/components/Channel/ChannelContent/MessageRender";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";
import { getterUserinfo } from "~/stores/Userinfo";
import type { IMessage } from "~/types/Message";

export default function Search() {
  const [query, setQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<IMessage[]>([]);
  const [searchedOnce, setSearchedOnce] = createSignal(false);

  const searchIt = () => {
    GET_MESSAGE_SEARCH({ _content: query() })
      .then((r) => {
        console.log("Search :: search :: r ->", r);
        setSearchResults(r.data);
        setSearchedOnce(true);
      })
      .catch((e) => console.error("Search :: search :: e ->", e));
  }

  return (
    <div class="h-svh pt-2 px-2 overflow-y-hidden flex flex-col">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>メッセージ検索</p>
      </Card>
      
      <span class="lg:w-4/5 mx-auto w-full flex items-center gap-2 mt-2">
        <TextField class="grow">
          <TextFieldInput
            value={query()}
            placeholder="メッセージ文を検索"
            onChange={(e) => setQuery(e.currentTarget.value)}
          ></TextFieldInput>
        </TextField>

        <Button onClick={searchIt} size={"icon"}><IconSearch /></Button>
      </span>

      <hr class="lg:w-4/5 mx-auto mt-2" />

      <div class="lg:w-4/5 mx-auto grow overflow-y-auto py-4">
        <span class="flex flex-col gap-2 overflow-y-auto">
          { !searchedOnce() && <p class="text-center">メッセージ文を検索してください。</p> }
          { searchedOnce() && searchResults().length === 0 && <p class="text-center">結果が見つかりませんでした...</p>}
          <For each={searchResults()}>
            {(message) => message.userId !== "SYSTEM" && (
              <Card class="p-2">
                <Avatar>
                  <AvatarImage src={"/api/user/icon/" + message.userId} />
                  <AvatarFallback>
                    { getterUserinfo(message.userId).name.slice(0,1) }
                  </AvatarFallback>
                </Avatar>
                <span class={"grow"}>
                  <MessageRender message={message} displayUserName={true} />
                </span>
              </Card>
            )}
          </For>
        </span>
      </div>
    </div>
  );
}