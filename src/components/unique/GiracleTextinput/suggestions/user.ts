import type { EditorView } from "prosemirror-view";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";
import type { IMentionMenuItem } from "../MentionMenu.tsx";
import { pmSchema } from "../pmSchema.ts";
import { type ISearchContext, insertChip } from "./common.ts";

/**
 * ユーザー候補の検索器を作る
 * debounce・watchdog のタイマーをインスタンスごとに閉じ込めるためファクトリにする
 */
export const createUserSearch = (ctx: ISearchContext) => {
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

  // 入力毎のAPI発火を避けるため200msでdebounceする
  const search = (query: string, channelId: string | undefined) => {
    clearTimeout(searchTimer);
    clearTimeout(watchdogTimer);
    searchTimer = setTimeout(() => {
      // 切替後の channelId と異なる = 古いチャンネル向けの検索なので破棄
      if (ctx.channelId() !== channelId) return;
      // 応答が永遠に来ない場合に Enter を復帰させる安全弁。
      // ハンドルはリクエスト毎に分離し、共有変数は最新分だけ保持する
      const wid = setTimeout(() => {
        // 同じクエリのままなら isSearching を戻す(判定は ctx.apply)
        ctx.apply("user", query, { isSearching: false });
      }, 3000);
      watchdogTimer = wid;
      api.user
        .list({ username: query, joinedChannel: channelId })
        .then((r) => {
          const users = r.data;
          clearTimeout(wid);
          if (watchdogTimer === wid) watchdogTimer = undefined;
          // 古いクエリ・古いチャンネル向けの応答で新しい結果を上書きしない
          ctx.apply("user", query, {
            users,
            selectIndex: 0,
            isSearching: false,
          });
        })
        .catch((e) => {
          clearTimeout(wid);
          if (watchdogTimer === wid) watchdogTimer = undefined;
          console.error("MENTION_USER_SEARCH :: e->", e);
          // 失敗時も isSearching を戻さないと Enter が握りつぶされ続ける
          ctx.apply("user", query, { isSearching: false });
        });
    }, 200);
  };

  const dispose = () => {
    clearTimeout(searchTimer);
    clearTimeout(watchdogTimer);
  };

  return { search, dispose };
};

export const userMenuItem = (user: IUser): IMentionMenuItem => ({
  id: user.id,
  name: user.name,
  iconUrl: `/api/user/icon/${encodeURIComponent(user.id)}`,
});

export const insertUserMention = (view: EditorView, user: IUser): void => {
  insertChip(
    view,
    pmSchema.nodes.mention.create({ userId: user.id, name: user.name }),
  );
};
