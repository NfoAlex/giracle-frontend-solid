import { ClipboardDOMImportExtension } from "@lexical/clipboard";
import { RichTextExtension } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getPreviousSelection,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  defineExtension,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  mergeRegister,
  type PointType,
  SELECTION_CHANGE_COMMAND,
  type TextNode,
} from "lexical";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";
import {
  $createMentionNode,
  $isMentionNode,
  MentionNode,
} from "./MentionNode.ts";

export interface MentionExtensionOptions {
  channelId?: string | (() => string | undefined);
}

export interface MentionState {
  isEnabled: boolean;
  query: string;
  users: IUser[];
  selectIndex: number;
  /** 候補を検索した時点の channelId(切替検出用) */
  channelId: string | undefined;
  /** debounce 検索が未完了の間 true(Enter の誤送信防止) */
  isSearching: boolean;
}

export const EMPTY_MENTION_STATE: MentionState = {
  isEnabled: false,
  query: "",
  users: [],
  selectIndex: 0,
  channelId: undefined,
  isSearching: false,
};

/** カーソル直前の未確定 `@query` を取得する(確定済み `@<user-id>` は対象外) */
function $getMentionQuery(): {
  anchorNode: TextNode;
  offset: number;
  query: string;
  matchLength: number;
} | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode) || $isMentionNode(anchorNode)) return null;
  const offset = selection.anchor.offset;
  const match = /@(\S*)$/.exec(anchorNode.getTextContent().slice(0, offset));
  if (!match || match[1].startsWith("<")) return null;
  // `foo@bar` (メール/URL内の@) をメンション開始とみなさない。
  // CJKは \p{L} に含まれるためUnicodeクラスでなくASCII文字種判定にする
  // (日本語の「こんにちは@田中」のようなスペースなしメンションを殺さないため)
  const at = offset - match[0].length;
  if (at > 0 && /[A-Za-z0-9_]/.test(anchorNode.getTextContent()[at - 1])) {
    return null;
  }
  return { anchorNode, offset, query: match[1], matchLength: match[0].length };
}

/**
 * メンションユーザーの挿入
 * カーソル直前の `@query` をMentionNodeへ置換し、直後にスペースを挿入する
 */
export function $insertMention(editor: LexicalEditor, user: IUser): void {
  editor.update(() => {
    const found = $getMentionQuery();
    if (!found) return;
    const { anchorNode, offset, matchLength } = found;

    // `@query` 部分だけを切り出す(前後のテキストは残す)
    const start = offset - matchLength;
    let target = start === 0 ? anchorNode : anchorNode.splitText(start)[1];
    if (!target) return;
    if (target.getTextContentSize() > matchLength) {
      target = target.splitText(matchLength)[0];
    }

    const mentionNode = $createMentionNode(user.id, user.name);
    mentionNode.setFormat(target.getFormat());
    mentionNode.setStyle(target.getStyle());
    target.replace(mentionNode);

    const spaceNode = $createTextNode(" ");
    mentionNode.insertAfter(spaceNode);
    spaceNode.select(1, 1);
  });
}

/** ノード単位の変換: メンションだけ `@<user-id>` へ置き換える */
function $serializeNode(node: LexicalNode): string {
  if ($isMentionNode(node)) return `@<${node.getUserId()}>`;
  if ($isElementNode(node)) {
    return node.getChildren().map($serializeNode).join("");
  }
  // 素テキスト中の `@<` は受信側mentionPatternに偽メンションとして解釈されるため、
  // ゼロ幅スペースを挟んでエスケープする(表示上は変化なし)
  return node.getTextContent().replaceAll("@<", "@\u200B<");
}

/**
 * 送信用の本文文字列を取得する
 * エディタ上の表示(`@名前`)をサーバ保存形式(`@<user-id>`)へ変換する
 */
export function getMessageText(editor: LexicalEditor): string {
  return editor
    .getEditorState()
    .read(() => $getRoot().getChildren().map($serializeNode).join("\n"));
}

export function defineMentionExtension(
  options: MentionExtensionOptions,
  state: { signal: () => MentionState; set: (s: MentionState) => void },
) {
  return defineExtension({
    name: "@giracle/mention",
    nodes: [MentionNode],
    // テキスト入力・書式まわりはRichTextExtensionに任せる
    dependencies: [ClipboardDOMImportExtension, RichTextExtension],
    $initialEditorState() {
      $getRoot().append($createParagraphNode());
    },
    register(editor) {
      let searchTimer: ReturnType<typeof setTimeout> | undefined;

      const reset = () => state.set(EMPTY_MENTION_STATE);

      const resolveChannelId = () =>
        typeof options.channelId === "function"
          ? options.channelId()
          : options.channelId;

      const removeRange = (
        anchorKey: string,
        anchorOffset: number,
        focusKey: string,
        focusOffset: number,
      ) => {
        const range = $createRangeSelection();
        range.anchor.set(anchorKey, anchorOffset, "text");
        range.focus.set(focusKey, focusOffset, "text");
        $setSelection(range);
        range.removeText();
      };

      // 入力毎のAPI発火を避けるため200msでdebounceする
      const searchUser = (query: string, channelId: string | undefined) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          // 切替後の channelId と異なる = 古いチャンネル向けの検索なので破棄
          if (resolveChannelId() !== channelId) return;
          api.user
            .list({ username: query, joinedChannel: channelId })
            .then((r) => {
              // 古いクエリの応答で新しい結果を上書きしない
              const current = state.signal();
              if (current.query !== query) return;
              state.set({
                ...current,
                users: r.data,
                selectIndex: 0,
                isSearching: false,
              });
            })
            .catch((e) => {
              console.error("MENTION_USER_SEARCH :: e->", e);
              // 失敗時も isSearching を戻さないと Enter が握りつぶされ続ける
              const current = state.signal();
              if (current.query === query) {
                state.set({ ...current, isSearching: false });
              }
            });
        }, 200);
      };

      return mergeRegister(
        // カーソル直前の `@query` を検出してメニュー状態を更新
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            const found = $getMentionQuery();
            const prev = state.signal();
            if (!found) {
              if (prev.isEnabled) reset();
              return;
            }
            const query = found.query;
            const channelId = resolveChannelId();
            // 同じクエリかつ同一チャンネルなら検索結果や選択位置をそのまま維持する
            if (
              prev.isEnabled &&
              prev.query === query &&
              prev.channelId === channelId
            )
              return;
            state.set({
              isEnabled: true,
              query,
              users: [],
              selectIndex: 0,
              channelId,
              isSearching: true,
            });
            searchUser(query, channelId);
          });
        }),
        // メンションの内部にカーソルが入らないよう、前後どちらかの端へスナップする
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            // IME変換中の選択変更には触らない
            if (editor.isComposing()) return false;
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false;
            const prev = $getPreviousSelection();
            const points: [PointType, PointType | null][] = [
              [selection.anchor, $isRangeSelection(prev) ? prev.anchor : null],
              [selection.focus, $isRangeSelection(prev) ? prev.focus : null],
            ];
            for (const [point, prevAnchor] of points) {
              const node = point.getNode();
              if (!$isMentionNode(node) || point.type !== "text") continue;
              const size = node.getTextContentSize();
              if (point.offset <= 0 || point.offset >= size) continue;
              // 直前の位置がメンションの前後どちらだったかで、抜ける方向を決める
              const target =
                prevAnchor?.key === node.getPreviousSibling()?.getKey()
                  ? size
                  : prevAnchor?.key === node.getNextSibling()?.getKey()
                    ? 0
                    : prevAnchor?.key === point.key
                      ? prevAnchor.offset > point.offset
                        ? 0
                        : size
                      : point.offset < size / 2
                        ? 0
                        : size;
              point.set(point.key, target, "text");
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ENTER_COMMAND,
          (event) => {
            const current = state.signal();
            if (!current.isEnabled) return false;
            const user = current.users[current.selectIndex];
            if (!user) {
              // debounce 検索が未完了の間は、確定も送信もせず Enter を消費する
              if (current.isSearching) {
                event?.preventDefault();
                return true;
              }
              return false;
            }
            event?.preventDefault();
            // コマンド実行中のupdate内で入れ子にeditor.updateを呼ぶとDOM選択が
            // 壊れるため、コマンド処理後に挿入する
            setTimeout(() => $insertMention(editor, user), 0);
            reset();
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ARROW_DOWN_COMMAND,
          (event) => {
            const current = state.signal();
            if (!current.isEnabled || current.users.length === 0) return false;
            event.preventDefault();
            const next = Math.min(
              current.selectIndex + 1,
              current.users.length - 1,
            );
            state.set({ ...current, selectIndex: next });
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ARROW_UP_COMMAND,
          (event) => {
            const current = state.signal();
            if (!current.isEnabled || current.users.length === 0) return false;
            event.preventDefault();
            const next = Math.max(current.selectIndex - 1, 0);
            state.set({ ...current, selectIndex: next });
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        // tokenノード境界のBackspaceはLexical既定だと何も消えないため自前で処理する
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          (event) => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
              return false;
            }
            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();

            // メンションノード上にカーソルがある場合はノード全体を削除
            if ($isMentionNode(anchorNode)) {
              event.preventDefault();
              removeRange(
                anchorNode.getKey(),
                0,
                anchorNode.getKey(),
                anchorNode.getTextContentSize(),
              );
              return true;
            }
            if (!$isTextNode(anchorNode)) return false;

            // 直後(offset 0)や直後のスペーサー(空白のみ)にカーソルがあるときは
            // 直前のメンションノードをノードごと削除する
            const prevNode = anchorNode.getPreviousSibling();
            if (!$isMentionNode(prevNode)) return false;
            const isAtTokenEnd =
              anchor.offset === 0 && anchorNode.getTextContentSize() > 0;
            const isOnSpacer =
              anchor.offset === anchorNode.getTextContentSize() &&
              anchorNode.getTextContent().trim() === "";
            if (!isAtTokenEnd && !isOnSpacer) return false;

            event.preventDefault();
            removeRange(
              prevNode.getKey(),
              0,
              anchorNode.getKey(),
              anchor.offset,
            );
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          (event) => {
            if (!state.signal().isEnabled) return false;
            event.preventDefault();
            reset();
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        () => clearTimeout(searchTimer),
      );
    },
  });
}
