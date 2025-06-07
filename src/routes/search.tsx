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

  const searchIt = () => {
    GET_MESSAGE_SEARCH({ _content: query() })
      .then((r) => {
        console.log("Search :: search :: r ->", r);
        setSearchResults(r.data);
      });
  }

  return (
    <div class="h-svh pt-2 px-2 overflow-y-hidden flex flex-col">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>メッセージ検索</p>
      </Card>
      
      <div class="lg:w-4/5 mx-auto w-full h-full mt-2 flex flex-col gap-2">
        <span class="w-full flex items-center gap-2">
          <TextField class="grow">
            <TextFieldInput
              value={query()}
              onChange={(e) => setQuery(e.currentTarget.value)}
            ></TextFieldInput>
          </TextField>

          <Button onClick={searchIt} size={"icon"}><IconSearch /></Button>
        </span>

        <div class="grow overflow-y-auto">
          <span class="flex flex-col gap-2 overflow-y-auto">
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
    </div>
  );
}