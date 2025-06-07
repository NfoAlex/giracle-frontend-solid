import { IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For } from "solid-js";
import GET_MESSAGE_SEARCH from "~/api/MESSAGE/MESSAGE_SEARCH";
import MessageRender from "~/components/Channel/ChannelContent/MessageRender";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
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
      
      <span class="mx-auto w-full flex items-center gap-2 mt-2">
        <TextField class="grow">
          <TextFieldInput
            value={query()}
            placeholder="メッセージ文を検索"
            onChange={(e) => setQuery(e.currentTarget.value)}
            class="h-12 md:h-10"
          ></TextFieldInput>
        </TextField>

        <Button onClick={searchIt} size={"icon"} class="md:w-10 md:h-10 h-12 w-12"><IconSearch /></Button>
      </span>

      <hr class=" mt-2" />

      <div class="w-full grow overflow-y-auto pt-2 pb-4">
        <span class="flex flex-col gap-6 md:gap-2 overflow-y-auto overflow-x-hidden">
          { !searchedOnce() && <p class="text-center">メッセージ文を検索してください。</p> }
          { searchedOnce() && searchResults().length === 0 && <p class="text-center">結果が見つかりませんでした...</p>}
          <For each={searchResults()}>
            {(message) => message.userId !== "SYSTEM" && (
              <Card class="p-2">
                <span>
                  <UserinfoModalWrapper userId={message.userId} class="flex flex-row iterms-center gap-2">
                    <Avatar>
                      <AvatarImage src={"/api/user/icon/" + message.userId} />
                    </Avatar>
                    <p style="padding-top: 0.45rem;">{ getterUserinfo(message.userId).name }</p>
                  </UserinfoModalWrapper>
                </span>
                <span class={"grow"}>
                  <MessageRender message={message} displayUserName={false} />
                </span>
              </Card>
            )}
          </For>
        </span>
      </div>
    </div>
  );
}