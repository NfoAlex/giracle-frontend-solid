import { IconSearch } from "@tabler/icons-solidjs";
import { createEffect, createMemo, createSignal, For } from "solid-js";
import GET_MESSAGE_SEARCH from "~/api/MESSAGE/MESSAGE_SEARCH.ts";
import MessageRender from "~/components/Channel/ChannelContent/MessageDisplay/MessageRender.tsx";
import { Avatar, AvatarImage } from "~/components/ui/avatar.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select.tsx";
import { TextField, TextFieldInput } from "~/components/ui/text-field.tsx";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import type { IMessage } from "~/types/Message.ts";

const SEARCH_PAGE_SIZE = 30;
const CHANNEL_FILTER_ALL = "__all__";

type SearchSortOrder = "asc" | "desc";
type SearchFileFilter = "any" | "with_file" | "without_file";
const sortOptions: SearchSortOrder[] = ["desc", "asc"];
const fileFilterOptions: SearchFileFilter[] = ["any", "with_file", "without_file"];
const sortLabels: Record<SearchSortOrder, string> = {
  desc: "新しい順",
  asc: "古い順",
};
const fileFilterLabels: Record<SearchFileFilter, string> = {
  any: "指定なし",
  with_file: "添付あり",
  without_file: "添付なし",
};

export default function Search() {
  const [query, setQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<IMessage[]>([]);
  const [searchedOnce, setSearchedOnce] = createSignal(false);
  const [loadIndex, setLoadIndex] = createSignal(1);
  const [processing, setProcessing] = createSignal(false);
  const [selectedChannelId, setSelectedChannelId] = createSignal(CHANNEL_FILTER_ALL);
  const [sortOrder, setSortOrder] = createSignal<SearchSortOrder>("desc");
  const [fileFilter, setFileFilter] = createSignal<SearchFileFilter>("any");
  const [lastFetchedRawCount, setLastFetchedRawCount] = createSignal(0);
  // 条件変更後に「もっと読み込む」で別条件を混ぜないため、直近検索条件を記録する
  const [lastSearchedConditionKey, setLastSearchedConditionKey] = createSignal("");

  const channelOptions = createMemo(
    () => [CHANNEL_FILTER_ALL, ...new Set(storeMyUserinfo.ChannelJoin.map((cj) => cj.channelId))],
  );

  createEffect(() => {
    if (!channelOptions().includes(selectedChannelId())) {
      setSelectedChannelId(CHANNEL_FILTER_ALL);
    }
  });

  const getChannelFilterLabel = (channelId: string): string => {
    if (channelId === CHANNEL_FILTER_ALL) return "すべてのチャンネル";
    return directGetterChannelInfo(channelId).name;
  };

  const currentSearchCondition = createMemo(() => {
    return {
      _content: query(),
      _channelId:
        selectedChannelId() === CHANNEL_FILTER_ALL ? undefined : selectedChannelId(),
      _sort: sortOrder(),
      _hasFileAttachment:
        fileFilter() === "any" ? undefined : fileFilter() === "with_file",
    };
  });

  const currentSearchConditionKey = createMemo(() => JSON.stringify(currentSearchCondition()));

  const buildSearchParams = (nextLoadIndex: number) => {
    return {
      ...currentSearchCondition(),
      _loadIndex: nextLoadIndex,
    };
  };

  const canLoadMore = () => {
    return (
      searchedOnce()
      && lastFetchedRawCount() === SEARCH_PAGE_SIZE
      && lastSearchedConditionKey() === currentSearchConditionKey()
    );
  };

  const searchIt = (insertMode: boolean = false) => {
    if (processing()) return;
    const nextLoadIndex = insertMode ? loadIndex() + 1 : 1;
    const searchConditionKey = currentSearchConditionKey();
    setProcessing(true);
    GET_MESSAGE_SEARCH(buildSearchParams(nextLoadIndex))
      .then((r) => {
        setLastFetchedRawCount(r.data.length);
        //システムメッセージを除外
        const result = r.data.filter((msg) => msg.userId !== "SYSTEM");

        //console.log("Search :: search :: r ->", r);
        //挿入かどうかで処理を分ける
        if (insertMode) {
          setSearchResults((prev) => [...prev, ...result]);
          setLoadIndex(nextLoadIndex);
        } else {
          setLoadIndex(1); //リセット
          setSearchResults(result);
        }
        setLastSearchedConditionKey(searchConditionKey);
        setSearchedOnce(true);
      })
      .catch((e) => console.error("Search :: search :: e ->", e))
      .finally(() => setProcessing(false));
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

        <Button
          onClick={() => searchIt(false)}
          size={"icon"}
          class="md:w-10 md:h-10 h-12 w-12"
          disabled={processing()}
        ><IconSearch /></Button>
      </span>

      <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select
          options={channelOptions()}
          value={selectedChannelId()}
          onChange={(value) => setSelectedChannelId(value ?? CHANNEL_FILTER_ALL)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {getChannelFilterLabel(props.item.rawValue)}
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="search-channel-filter">
            <SelectValue<string>>
              {(state) => <p>{getChannelFilterLabel(state.selectedOption() ?? CHANNEL_FILTER_ALL)}</p>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          options={sortOptions}
          value={sortOrder()}
          onChange={(value) => value && setSortOrder(value)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {sortLabels[props.item.rawValue]}
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="search-sort-order">
            <SelectValue<SearchSortOrder>>
              {(state) => <p>{sortLabels[state.selectedOption() ?? "desc"]}</p>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          options={fileFilterOptions}
          value={fileFilter()}
          onChange={(value) => value && setFileFilter(value)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {fileFilterLabels[props.item.rawValue]}
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="search-file-filter">
            <SelectValue<SearchFileFilter>>
              {(state) => <p>{fileFilterLabels[state.selectedOption() ?? "any"]}</p>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <hr class=" mt-2" />

      <div class="w-full grow overflow-y-auto pt-2 pb-4">
        <span class="flex flex-col gap-6 md:gap-2 overflow-y-auto overflow-x-hidden">
          { !searchedOnce() && <p class="text-center">メッセージ文を検索してください。</p> }
          { searchedOnce() && searchResults().length === 0 && <p class="text-center">結果が見つかりませんでした...</p>}
          <For each={searchResults()}>
            {(message) => (
              <Card class="p-2">
                <span>
                  <UserinfoModalWrapper userId={message.userId} class="flex flex-row items-center gap-2">
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

          {
            canLoadMore()
            &&
            <Button onClick={()=>searchIt(true)} variant={"secondary"} disabled={processing()}>もっと読み込む</Button>
          }
        </span>
      </div>
    </div>
  );
}
