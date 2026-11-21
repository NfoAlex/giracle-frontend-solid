import { ClipboardDOMImportExtension } from "@lexical/clipboard";
import { RichTextExtension } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
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
  mergeRegister,
} from "lexical";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";
import {
  $createMentionNode,
  $isMentionNode,
  MentionNode,
} from "./MentionNode.ts";

export interface MentionExtensionOptions {
  channelId?: string;
}

export interface MentionState {
  isEnabled: boolean;
  query: string;
  users: IUser[];
  selectIndex: number;
}

export const EMPTY_MENTION_STATE: MentionState = {
  isEnabled: false,
  query: "",
  users: [],
  selectIndex: 0,
};

/**
 * メンションユーザーの挿入
 * カーソル直前の `@query` をMentionNodeへ置換し、直後にスペースを挿入する
 */
export function $insertMention(editor: LexicalEditor, user: IUser): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;

    const anchorNode = selection.anchor.getNode();
    if (!$isTextNode(anchorNode) || $isMentionNode(anchorNode)) return;

    const offset = selection.anchor.offset;
    const match = /@(\S*)$/.exec(anchorNode.getTextContent().slice(0, offset));
    // 確定済みの `@<user-id>` は置換対象にしない
    if (!match || match[1].startsWith("<")) return;

    // `@query` 部分だけを切り出す(前後のテキストは残す)
    const start = offset - match[0].length;
    let target = start === 0 ? anchorNode : anchorNode.splitText(start)[1];
    if (!target) return;
    if (target.getTextContentSize() > match[0].length) {
      target = target.splitText(match[0].length)[0];
    }

    const mentionNode = $createMentionNode(user.id);
    mentionNode.setFormat(target.getFormat());
    mentionNode.setStyle(target.getStyle());
    target.replace(mentionNode);

    const spaceNode = $createTextNode(" ");
    mentionNode.insertAfter(spaceNode);
    spaceNode.select(1, 1);
  });
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

      // 入力毎のAPI発火を避けるため200msでdebounceする
      const searchUser = (query: string) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          api.user
            .list({ username: query, joinedChannel: options.channelId })
            .then((r) => {
              // 古いクエリの応答で新しい結果を上書きしない
              const current = state.signal();
              if (current.query !== query) return;
              state.set({ ...current, users: r.data, selectIndex: 0 });
            })
            .catch((e) => console.error("MENTION_USER_SEARCH :: e->", e));
        }, 200);
      };

      return mergeRegister(
        // カーソル直前の `@query` を検出してメニュー状態を更新
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            const prev = state.signal();
            const selection = $getSelection();
            if (
              !$isRangeSelection(selection) ||
              !selection.isCollapsed() ||
              !$isTextNode(selection.anchor.getNode())
            ) {
              if (prev.isEnabled) reset();
              return;
            }

            const anchorNode = selection.anchor.getNode();
            // メンションノード自身は検出対象外
            if (
              !$isTextNode(anchorNode) ||
              anchorNode.getType() === "mention"
            ) {
              if (prev.isEnabled) reset();
              return;
            }

            const before = anchorNode
              .getTextContent()
              .slice(0, selection.anchor.offset);
            const match = /@(\S*)$/.exec(before);
            // 確定済みの `@<user-id>` は検出しない
            if (!match || match[1].startsWith("<")) {
              if (prev.isEnabled) reset();
              return;
            }

            const query = match[1];
            // 同じクエリなら検索結果や選択位置をそのまま維持する
            if (prev.isEnabled && prev.query === query) return;
            state.set({ isEnabled: true, query, users: [], selectIndex: 0 });
            searchUser(query);
          });
        }),
        editor.registerCommand(
          KEY_ENTER_COMMAND,
          (event) => {
            const current = state.signal();
            const user = current.users[current.selectIndex];
            if (!current.isEnabled || !user) return false;
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
              const range = $createRangeSelection();
              range.anchor.set(anchorNode.getKey(), 0, "text");
              range.focus.set(
                anchorNode.getKey(),
                anchorNode.getTextContentSize(),
                "text",
              );
              $setSelection(range);
              range.removeText();
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
            const range = $createRangeSelection();
            range.anchor.set(prevNode.getKey(), 0, "text");
            range.focus.set(anchorNode.getKey(), anchor.offset, "text");
            $setSelection(range);
            range.removeText();
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
