import {Card} from "~/components/ui/card";
import {For, Show} from "solid-js";
import {storeCustomEmoji} from "~/stores/CustomEmoji";
import CreateCustomEmoji from "~/components/ManageServer/ManageEmoji/CreateCustomEmoji";
import {getterUserinfo} from "~/stores/Userinfo";
import DELETE_SERVER_CUSTOM_EMOJI_DELETE from "~/api/SERVER/SERVER_CUSTOM_EMOJI_DELETE";
import {Table, TableBody, TableHead, TableHeader, TableRow} from "~/components/ui/table";
import {IconTrash} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";

export default function ManageEmoji() {

  /**
   * カスタム絵文字を削除する
   * @param emojiCode
   */
  const deleteEmoji = (emojiCode: string) => {
    DELETE_SERVER_CUSTOM_EMOJI_DELETE(emojiCode)
      .then((r) => {
        console.log("ManageEmoji :: deleteEmoji : r->", r);
      })
      .catch((e) => console.error("ManageEmoji :: deleteEmoji : e->", e));
  }

  return (
    <div class="flex flex-col overflow-y-auto h-full gap-2">

      <CreateCustomEmoji />

      <Card class={"p-2 max-h-full overflow-y-auto flex flex-col"}>
        <Show when={storeCustomEmoji.length === 0}>
          <div class={"text-center py-5"}>
            <p>カスタム絵文字がありません。</p>
          </div>
        </Show>

        <Table class={"h-full"}>
          <TableHeader class={"sticky top-0 z-50 bg-card"}>
            <TableRow>
              <TableHead>絵文字</TableHead>
              <TableHead>コード</TableHead>
              <TableHead>作成したユーザー</TableHead>
              <TableHead class="text-right">削除操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody class={"overflow-y-auto pb-80"}>
            <For each={storeCustomEmoji}>
              {
                (emoji) => (
                  <TableRow>
                    <td>
                      <img src={"/api/server/custom-emoji/" + emoji.code} alt={emoji.code} class={"my-1 w-8 h-8"}/>
                    </td>
                    <td><code>{emoji.code}</code></td>
                    <td>{getterUserinfo(emoji.uploadedUserId).name}</td>
                    <td class={"text-right"}>
                      <Button ondblclick={() => deleteEmoji(emoji.code)} class={"text-red-500 my-1"} size={"sm"} variant={"outline"}>
                        <IconTrash />
                        <p>削除</p>
                      </Button>
                    </td>
                  </TableRow>
                )
              }
            </For>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}