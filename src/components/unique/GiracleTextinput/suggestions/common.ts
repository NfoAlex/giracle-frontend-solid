import type { Node as PMNode } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { IChannel } from "~/types/Channel.ts";
import type { IUser } from "~/types/User.ts";
import { getTriggerQuery, pmSchema, type TTriggerKind } from "../pmSchema.ts";

/** 候補メニューの状態。kind ごとに候補配列を分けて持つ */
export interface ISuggestionState {
  isEnabled: boolean;
  kind: TTriggerKind | null;
  query: string;
  users: IUser[];
  channels: IChannel[];
  emojiCodes: string[];
  selectIndex: number;
  /** 候補を検索した時点の channelId(切替検出用) */
  channelId: string | undefined;
  /** 非同期検索(user)が未完了の間 true(Enter の誤送信防止) */
  isSearching: boolean;
}

export const EMPTY_SUGGESTION_STATE: ISuggestionState = {
  isEnabled: false,
  kind: null,
  query: "",
  users: [],
  channels: [],
  emojiCodes: [],
  selectIndex: 0,
  channelId: undefined,
  isSearching: false,
};

/** 現在のトリガー種別の候補件数 */
export function candidateCount(state: ISuggestionState): number {
  if (state.kind === "channel") return state.channels.length;
  if (state.kind === "emoji") return state.emojiCodes.length;
  return state.users.length;
}

/** ドメイン検索が（非同期解決後も含めて）結果を state へ反映するための口 */
export interface ISearchContext {
  /** 現在のチャンネル ID(切替検出用) */
  channelId(): string | undefined;
  /**
   * 種別・クエリ・チャンネルが現在の state と一致するときだけ patch を反映する
   * (チャンネル切替後や古い応答の結果は捨てる)
   */
  apply(
    kind: TTriggerKind,
    query: string,
    patch: Partial<ISuggestionState>,
  ): void;
}

/** カーソル直前のトリガーをチップ(atom) + NBSP へ置換する */
export function insertChip(view: EditorView, node: PMNode): void {
  if (view.composing) return;
  const found = getTriggerQuery(view.state);
  if (!found) return;
  // 直後の空白は NBSP で入れる。通常の空白を段落末に置くと Chrome が折り畳み、
  // 次の入力でその1文字が置き換わる(表示上チップと本文がくっつく)。
  // 送信時に通常の空白へ戻す(serializeInline)
  const tr = view.state.tr.replaceWith(found.from, found.to, [
    node,
    pmSchema.text("\u00a0"),
  ]);
  tr.setSelection(TextSelection.create(tr.doc, found.from + 2));
  view.dispatch(tr);
}
