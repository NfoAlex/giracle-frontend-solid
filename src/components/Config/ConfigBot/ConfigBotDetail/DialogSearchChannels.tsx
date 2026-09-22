import { IconCheck, IconHash, IconPlus, IconSearch, IconX } from "@tabler/icons-solidjs";
import { Accessor, createSignal, For } from "solid-js";
import { api } from "~/api";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import { useStoreChannelInfo } from "~/stores/ChannelInfo.store";
import { IChannel } from "~/types/Channel";

export default function DialogSearchChannels (props: {
  currentChannelIdsSignal: Accessor<IChannel["id"][]>,
  applyChannelIds: (channelIds: IChannel["id"][]) => void,
  disabled?: boolean
}) {
  const [displayDialog, setDisplayDialog] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [result, setResult] = createSignal<Omit<IChannel, "ChannelViewableRole">[]>([]);
  const [processing, setProcessing] = createSignal(false);
  //ダイアログ内の選択状態。開くたびにpropsの反映済みチャンネルIdから作り直す
  const [selectedChannelIds, setSelectedChannelIds] = createSignal<IChannel["id"][]>([]);
  const [hasMoreResult, setHasMoreResult] = createSignal(false);
  const [latestSearchedQuery, setLatestSearchedQuery] = createSignal("");

  //開いた時点のprops値をスナップショット。閉じてる間のprops更新に引きずられないようにする
  const openDialog = (open: boolean) => {
    if (open) setSelectedChannelIds([...props.currentChannelIdsSignal()]);
    setDisplayDialog(open);
  };

  const searchIt = (continuous: boolean = false) => {
    setProcessing(true);
    api.channel.search({ query: query() })
      .then(r => {
        if (continuous && latestSearchedQuery() === query()) {
          setResult(prev => [...prev, ...r.data]);
        } else {
          setResult(r.data);
        }

        if (r.data.length === 50) {
          setHasMoreResult(true);
        } else {
          setHasMoreResult(false);
        }

        setLatestSearchedQuery(query());
      })
      .catch((err) => {
        console.error("err", err);
      })
      .finally(() => {
        setProcessing(false);
      })
  };

  const applyChannels = () => {
    props.applyChannelIds(selectedChannelIds());
    setDisplayDialog(false);
  };

  return (
    <div class="w-full md:w-fit">
      <Button
        onClick={()=>setDisplayDialog(true)}
        variant={"secondary"}
        class="w-full"
        disabled={props.disabled}
      >使用チャンネルを管理する</Button>
      <Dialog open={displayDialog()} onOpenChange={openDialog}>
        <DialogContent>
          <DialogHeader class="min-w-0">
            <DialogTitle>チャンネル検索</DialogTitle>
            <div class="h-full py-2 flex flex-col">
              <div class="w-full flex items-center gap-2">
                <TextField class="grow">
                  <TextFieldInput value={query()} onInput={(e)=>setQuery(e.currentTarget.value)} />
                </TextField>
                <Button
                  onClick={()=>searchIt()}
                  disabled={processing()}
                  class="shrink-0"
                  variant={"secondary"}
                >
                  <IconSearch />
                  検索
                </Button>
              </div>

              <hr class="mt-4" />

              {/* 結果表示 */}
              <div class="w-full max-h-96 py-2 grow overflow-y-auto">
                { //初回検索
                  (latestSearchedQuery() === "")
                  &&
                  <p class="text-center text-secondary my-6">検索してください</p>
                }
                { //結果が無いとき
                  (result().length === 0 && latestSearchedQuery() !== "")
                  &&
                  <p class="text-center text-secondary my-6">結果が見つかりませんでした</p>
                }

                <For each={result()}>
                  {
                    (c) => (
                      <div class="w-full flex items-center justify-start h-8 md:h-fit">
                        <span class="grow truncate text-left">{ c.name }</span>
                        <Checkbox
                          checked={selectedChannelIds().includes(c.id)}
                          onChange={(isChecked) => setSelectedChannelIds(prev =>
                            isChecked
                            ?
                            [...prev, c.id]
                            :
                            prev.filter(item => item !== c.id)
                          )}
                          class="mr-4"
                        />
                      </div>
                    )
                  }
                </For>
                {
                  hasMoreResult()
                  &&
                  <Button onClick={()=>searchIt(true)}>
                    <IconPlus />
                  </Button>
                }
              </div>

              <hr class="mb-2" />

              <div class="flex flex-wrap justify-start max-h-6 overflow-y-auto gap-1">
                <For each={selectedChannelIds()}>
                  {
                    channelId => (
                      <Badge
                        variant={"secondary"}
                        class="group flex items-center cursor-pointer"
                        onClick={() => setSelectedChannelIds(prev => prev.filter(id => id !== channelId))}
                      >
                        <span class="relative size-4 shrink-0">
                          <IconHash size={16} class="absolute inset-0 transition-opacity group-hover:opacity-0" />
                          <IconX size={16} class="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <p>{ useStoreChannelInfo.directGetterChannelInfo(channelId).name }</p>
                      </Badge>
                    )
                  }
                </For>
              </div>

              <div class="flex items-center mt-2">
                <p class="hidden md:inline">{ selectedChannelIds().length }  件のチャンネル</p>
                <Button
                  onClick={applyChannels}
                  class="ml-auto w-full md:w-fit"
                >
                  <IconCheck />
                  選択チャンネルを適用
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
