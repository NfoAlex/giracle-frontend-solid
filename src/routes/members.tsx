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
import {
  setStoreUserOnline,
  storeUserOnline,
  useStoreUserinfo,
} from "~/stores/Userinfo.store.ts";
import type { IUser } from "~/types/User.ts";

// 1回の取得で読み込むユーザー数
const PAGE_LENGTH = 30;
// getOnline の1回あたり上限（バックエンド ServiceUser.GetOnline が50件で打ち切る）
const ONLINE_PAGE_LENGTH = 50;

export default function Members() {
  const [users, setUsers] = createSignal<IUser[]>([]);
  const [cursorUserId, setCursorUserId] = createSignal<string | undefined>();
  const [hasMore, setHasMore] = createSignal(false);
  const [processing, setProcessing] = createSignal(false);
  const [query, setQuery] = createSignal("");

  // URLクエリ（?online=1）でオンラインのみ表示のフィルター状態を保持する
  const [searchParams, setSearchParams] = useSearchParams();
  const onlineOnly = () => searchParams.online === "1";

  // 取得の世代。モード切替などで新しい取得が始まったら古い応答は捨てる
  let requestSeq = 0;

  /**
   * ユーザー一覧を取得する
   * @param insert true なら既存一覧の末尾へ追記する
   * @param online 一覧ソース。省略時は URL クエリのオンライン絞り込み状態に従う
   */
  const fetchUsers = async (insert = false, filterOnline = onlineOnly()) => {
    const seq = ++requestSeq;
    let append = insert;
    setProcessing(true);

    try {
      if (filterOnline) {
        let ids: string[];
        try {
          ids = (await api.user.getOnline({ cursorUserId: cursorUserId() }))
            .data;
        } catch (e) {
          if (seq !== requestSeq) return;
          if (cursorUserId() === undefined) throw e;
          // カーソルにしたユーザーが切断済み(404)なら先頭から取り直す
          setCursorUserId(undefined);
          ids = (await api.user.getOnline()).data;
          append = false;
        }

        if (seq !== requestSeq) return;

        // 初回接続時の storeUserOnline は最大50件なので、取得したIDを先に反映して
        // 一覧・バッジ（storeUserOnline 参照）のオンライン判定を揃える
        setStoreUserOnline((prev) => [...new Set([...prev, ...ids])]);

        // getOnline はユーザーIDのみ返すため、ユーザー情報はキャッシュ優先で解決する。
        // 1件の取得失敗（レートリミットの429等）で一覧全体を失わないよう失敗行だけ落とす
        const fetched = (
          await Promise.all(
            ids.map((id) =>
              useStoreUserinfo.asyncGetterUserinfo(id).catch(() => undefined),
            ),
          )
        ).filter((u): u is IUser => u !== undefined);

        if (seq !== requestSeq) return;

        setUsers((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(ids.length === ONLINE_PAGE_LENGTH);
        const lastId = ids[ids.length - 1];
        if (lastId !== undefined) setCursorUserId(lastId);
        return;
      }

      const r = await api.user.list({
        length: PAGE_LENGTH,
        cursorUserId: cursorUserId(),
        username: query().trim() || undefined,
      });

      if (seq !== requestSeq) return;

      // 詳細モーダル表示用にユーザー情報をStoreへ格納
      for (const user of r.data) {
        useStoreUserinfo.updateUserinfo(user);
      }

      setUsers((prev) => (append ? [...prev, ...r.data] : r.data));

      // 1ページ分返ってきたら続きがあるとみなす
      setHasMore(r.data.length === PAGE_LENGTH);
      const lastUser = r.data[r.data.length - 1];
      if (lastUser) setCursorUserId(lastUser.id);
    } catch (e) {
      if (seq === requestSeq) {
        console.error("Members :: fetchUsers :: err ->", e);
      }
    } finally {
      if (seq === requestSeq) setProcessing(false);
    }
  };

  onMount(() => {
    fetchUsers();
  });

  // shortcut: getOnline はユーザー名検索に対応しないため、オンライン表示中の
  // 検索語は読み込み済みの一覧にのみ掛かる
  const filteredUsers = createMemo(() => {
    const online = onlineOnly();
    const keyword = online ? query().trim().toLowerCase() : "";

    return users().filter((user) => {
      // オンライン表示でも WS の切断通知を反映して行を消す
      if (online && !storeUserOnline.includes(user.id)) return false;
      if (keyword !== "" && !user.name.toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  });

  return (
    <div class="h-svh p-2 flex flex-col gap-4">
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

      <div class="flex flex-col gap-2 shrink-0">
        <TextField>
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
          class="flex items-center gap-2"
          checked={onlineOnly()}
          onChange={(checked) => {
            setSearchParams({ online: checked ? "1" : undefined });
            // 取得元が変わるので表示中の一覧とカーソルをリセットして取り直す
            setUsers([]);
            setCursorUserId(undefined);
            setHasMore(false);
            void fetchUsers(false, checked);
          }}
        >
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>オンラインユーザーのみ表示</SwitchLabel>
        </Switch>
      </div>

      <div class="grow overflow-y-auto flex flex-col gap-1 pb-2">
        <Show when={processing() && users().length === 0}>
          <p class="text-center text-muted-foreground">ロード中...</p>
        </Show>

        <Show when={!processing() && filteredUsers().length === 0}>
          <p class="text-center text-muted-foreground">
            {onlineOnly()
              ? "オンラインのユーザーが見つかりませんでした。"
              : "ユーザーが見つかりませんでした。"}
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
