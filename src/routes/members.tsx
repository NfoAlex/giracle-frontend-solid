import { IconCircleFilled, IconReload, IconSearch } from "@tabler/icons-solidjs";
import { useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch.tsx";
import { TextField, TextFieldInput } from "~/components/ui/text-field.tsx";
import RoleChip from "~/components/unique/RoleChip.tsx";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";
import { storeUserOnline, updateUserinfo } from "~/stores/Userinfo.ts";
import type { IUser } from "~/types/User.ts";

// 1回の取得で読み込むユーザー数
const PAGE_LENGTH = 30;

export default function Members() {
  const [users, setUsers] = createSignal<IUser[]>([]);
  const [cursorUserId, setCursorUserId] = createSignal<string | undefined>();
  const [hasMore, setHasMore] = createSignal(false);
  const [processing, setProcessing] = createSignal(false);
  const [query, setQuery] = createSignal("");

  // URLクエリ（?online=1）でオンラインのみ表示のフィルター状態を保持する
  const [searchParams, setSearchParams] = useSearchParams();
  const onlineOnly = () => searchParams.online === "1";

  /**
   * ユーザー一覧を取得する
   * @param insert true なら既存一覧の末尾へ追記する
   */
  const fetchUsers = async (insert = false) => {
    if (processing()) return;
    setProcessing(true);

    try {
      const r = await api.user.list({
        length: PAGE_LENGTH,
        cursorUserId: cursorUserId(),
        username: query().trim() || undefined,
      });

      // 詳細モーダル表示用にユーザー情報をStoreへ格納
      for (const user of r.data) {
        updateUserinfo(user);
      }

      setUsers((prev) => (insert ? [...prev, ...r.data] : r.data));

      // 1ページ分返ってきたら続きがあるとみなす
      setHasMore(r.data.length === PAGE_LENGTH);
      const lastUser = r.data[r.data.length - 1];
      if (lastUser) setCursorUserId(lastUser.id);
    } catch (e) {
      console.error("Members :: fetchUsers :: err ->", e);
    } finally {
      setProcessing(false);
    }
  };

  onMount(() => {
    fetchUsers();
  });

  // オンラインのみ表示フィルター（クライアント側）
  const filteredUsers = createMemo(() => {
    if (!onlineOnly()) return users();

    return users().filter((user) => storeUserOnline.includes(user.id));
  });

  return (
    <div class="h-svh p-2 flex flex-col gap-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2 shrink-0">
        <SidebarTriggerWithDot />
        <p>メンバー一覧</p>
        <Button
          onClick={() => {
            setCursorUserId(undefined);
            fetchUsers();
          }}
          disabled={processing()}
          class="ml-auto"
          size="icon"
          variant="outline"
        >
          <IconReload />
        </Button>
      </Card>

      <TextField class="shrink-0">
        <span class="flex items-center gap-2">
          <TextFieldInput
            placeholder="ユーザー名で検索"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCursorUserId(undefined);
                fetchUsers();
              }
            }}
          />
          <Button
            onClick={() => {
              setCursorUserId(undefined);
              fetchUsers();
            }}
            size="icon"
            class="shrink-0"
          >
            <IconSearch />
          </Button>
        </span>
      </TextField>

      <Switch
        class="flex items-center gap-2 shrink-0"
        checked={onlineOnly()}
        onChange={(checked) =>
          setSearchParams({ online: checked ? "1" : undefined })
        }
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>オンラインユーザーのみ表示</SwitchLabel>
      </Switch>

      <div class="grow overflow-y-auto flex flex-col gap-1 pb-2">
        <Show when={processing() && users().length === 0}>
          <p class="text-center text-muted-foreground">ロード中...</p>
        </Show>

        <Show when={!processing() && filteredUsers().length === 0}>
          <p class="text-center text-muted-foreground">
            ユーザーが見つかりませんでした。
          </p>
        </Show>

        <For each={filteredUsers()}>
          {(user) => (
            <UserinfoModalWrapper
              userId={user.id}
              class="p-2 rounded-md flex items-center gap-3 hover:bg-accent cursor-pointer"
            >
              <Avatar class="w-10 h-10 shrink-0">
                <AvatarImage src={`/api/user/icon/${user.id}`} />
                <AvatarFallback class="w-full h-full">
                  {user.name}
                </AvatarFallback>
              </Avatar>

              <div class="flex flex-col min-w-0">
                <span class="flex items-center gap-2">
                  <p class="truncate font-semibold">{user.name}</p>
                  <Show when={storeUserOnline.includes(user.id)}>
                    <Badge
                      variant="secondary"
                      class="flex items-center gap-1 shrink-0"
                    >
                      <IconCircleFilled size={12} color="green" />
                      <p>オンライン</p>
                    </Badge>
                  </Show>
                  <Show when={user.isBanned}>
                    <Badge variant="error" class="shrink-0">
                      BAN
                    </Badge>
                  </Show>
                </span>
                <Show when={user.selfIntroduction}>
                  <p class="truncate text-sm text-muted-foreground">
                    {user.selfIntroduction}
                  </p>
                </Show>
              </div>

              <div class="ml-auto flex items-center gap-1 shrink-0">
                <For each={user.RoleLink}>
                  {(role) => <RoleChip deletable={false} roleId={role.roleId} />}
                </For>
              </div>
            </UserinfoModalWrapper>
          )}
        </For>

        <Show when={hasMore() && !processing()}>
          <Button
            onClick={() => fetchUsers(true)}
            variant="secondary"
            class="w-full mt-2"
          >
            さらに読み込む
          </Button>
        </Show>
      </div>
    </div>
  );
}
