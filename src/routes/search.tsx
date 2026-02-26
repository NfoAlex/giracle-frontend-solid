import { IconSearch } from "@tabler/icons-solidjs";
import { createMemo, createSignal, For } from "solid-js";
import GET_MESSAGE_SEARCH from "~/api/MESSAGE/MESSAGE_SEARCH.ts";
import MessageRender from "~/components/Channel/ChannelContent/MessageDisplay/MessageRender.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar.tsx";
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
type SearchSelectOption = { value: string; label: string };

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

  const channelOptions = createMemo(
    () => [CHANNEL_FILTER_ALL, ...storeMyUserinfo.ChannelJoin.map((cj) => cj.channelId)],
  );

  const sortOptions: SearchSelectOption[] = [
    { value: "desc", label: "新しい順" },
    { value: "asc", label: "古い順" },
  ];
  const fileFilterOptions: SearchSelectOption[] = [
    { value: "any", label: "指定なし" },
    { value: "with_file", label: "添付あり" },
    { value: "without_file", label: "添付なし" },
  ];

  const getChannelFilterLabel = (channelId: string): string => {
    if (channelId === CHANNEL_FILTER_ALL) return "すべてのチャンネル";
    return directGetterChannelInfo(channelId).name;
  };

  const getFileFilterLabel = (value: SearchFileFilter): string => {
    return fileFilterOptions.find((option) => option.value === value)?.label ?? "指定なし";
  };

  const getSortLabel = (value: SearchSortOrder): string => {
    return sortOptions.find((option) => option.value === value)?.label ?? "新しい順";
  };

  const buildSearchParams = (nextLoadIndex: number) => {
    return {
      _content: query(),
      _channelId:
        selectedChannelId() === CHANNEL_FILTER_ALL ? undefined : selectedChannelId(),
      _sort: sortOrder(),
      _hasFileAttachment:
        fileFilter() === "any" ? undefined : fileFilter() === "with_file",
      _loadIndex: nextLoadIndex,
    };
  };

  const searchIt = (insertMode: boolean = false) => {
    const nextLoadIndex = insertMode ? loadIndex() + 1 : 1;
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
          optionValue={(option) => option.value}
          value={sortOptions.find((option) => option.value === sortOrder()) ?? sortOptions[0]}
          onChange={(option) => option && setSortOrder(option.value as SearchSortOrder)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {props.item.rawValue.label}
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="search-sort-order">
            <SelectValue<SearchSelectOption>>
              {(state) => <p>{state.selectedOption()?.label ?? getSortLabel(sortOrder())}</p>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          options={fileFilterOptions}
          optionValue={(option) => option.value}
          value={fileFilterOptions.find((option) => option.value === fileFilter()) ?? fileFilterOptions[0]}
          onChange={(option) => option && setFileFilter(option.value as SearchFileFilter)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {props.item.rawValue.label}
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="search-file-filter">
            <SelectValue<SearchSelectOption>>
              {(state) => <p>{state.selectedOption()?.label ?? getFileFilterLabel(fileFilter())}</p>}
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

          {
            searchedOnce() && lastFetchedRawCount() === SEARCH_PAGE_SIZE
            &&
            <Button onClick={()=>searchIt(true)} variant={"secondary"} disabled={processing()}>もっと読み込む</Button>
          }
        </span>
      </div>
    </div>
  );
}