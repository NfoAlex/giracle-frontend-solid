import { type NodeSpec, type Node as PMNode, Schema } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

/**
 * GiracleTextinput の ProseMirror スキーマ。
 * 段落とテキスト、メンション(atom)のみ。marks を定義しないことで
 * 書式流入を構造的に防ぐ(旧 PlainTextOnlyExtension の代替)。
 */

const USER_ID_PATTERN = /^[a-f0-9-]{1,64}$/;

/** 巨大ペーストによるノード肥大化防止: 制御文字除去+128文字上限 */
function sanitizeMentionName(raw: string, fallback: string): string {
  const name = [...raw]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join("")
    .slice(0, 128);
  return name || fallback;
}

const mentionSpec: NodeSpec = {
  inline: true,
  group: "inline",
  atom: true,
  selectable: false,
  attrs: { userId: {}, name: {} },
  toDOM: (node) => [
    "span",
    {
      class: "mention-node",
      "data-mention-user-id": node.attrs.userId,
      "data-mention-name": node.attrs.name,
    },
    `@${node.attrs.name}`,
  ],
  parseDOM: [
    {
      tag: "span[data-mention-user-id]",
      getAttrs: (dom) => {
        const userId = (dom as HTMLElement).getAttribute(
          "data-mention-user-id",
        );
        // 受信側 mentionPattern と同じ文字種のみ受け付ける(`>` 注入・偽装防止)
        if (!userId || !USER_ID_PATTERN.test(userId)) return false;
        const rawName =
          (dom as HTMLElement).getAttribute("data-mention-name") ?? userId;
        return { userId, name: sanitizeMentionName(rawName, userId) };
      },
    },
  ],
};

export const pmSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0],
    },
    text: { group: "inline" },
    mention: mentionSpec,
  },
});

/** 空の本文(空段落1個) */
export function createEmptyDoc(): PMNode {
  return pmSchema.node("doc", null, [pmSchema.node("paragraph")]);
}

/** 段落内の子を送信文字列へ変換する */
function serializeInline(block: PMNode): string {
  let out = "";
  for (let i = 0; i < block.childCount; i++) {
    const child = block.child(i);
    if (child.type === pmSchema.nodes.mention) {
      out += `@<${child.attrs.userId}>`;
      continue;
    }
    // Chrome はメンション隣の空白を NBSP に化けさせる。表示上は同じなので
    // 送信文字列では通常の空白へ戻す(`\b` のリンク境界が崩れるため)
    const text = (child.text ?? "").replaceAll("\u00a0", " ");
    // メンション直後にスペース無しで文字が続く場合、受信側は `@<id>` と本文の
    // リンク境界が崩れるため送信時だけ半角空白を補う
    if (
      i > 0 &&
      block.child(i - 1).type === pmSchema.nodes.mention &&
      !/^\s/.test(text)
    ) {
      out += " ";
    }
    // 素テキスト中の `@<` は受信側 mentionPattern に偽メンションとして解釈されるため、
    // ゼロ幅スペースを挟んでエスケープする(表示上は変化なし)
    out += text.replaceAll("@<", "@\u200B<");
  }
  return out;
}

/**
 * 送信用の本文文字列を取得する
 * エディタ上の表示(`@名前`)をサーバ保存形式(`@<user-id>`)へ変換する
 */
export function getMessageText(doc: PMNode): string {
  const lines: string[] = [];
  for (let i = 0; i < doc.childCount; i++) {
    lines.push(serializeInline(doc.child(i)));
  }
  return lines.join("\n");
}

export interface IMentionQuery {
  query: string;
  /** `@` の開始位置(doc 座標) */
  from: number;
  /** カーソル位置(doc 座標) */
  to: number;
}

/** カーソル直前の未確定 `@query` を取得する(確定済み `@<user-id>` は対象外) */
export function getMentionQuery(state: EditorState): IMentionQuery | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const $from = selection.$from;
  if (!$from.parent.isTextblock) return null;

  // メンション(atom)は 1 文字分の空白として扱う。
  // これにより `@` の後にチップが挟まる場合は \S* が途切れて検出されない
  // 段落全体ではなくカーソル直前の窓だけを見る(巨大ペーストで毎キー O(n)
  // の文字列確保が走るのを防ぐ)。128 文字超のクエリはユーザー名に一致しない
  const end = $from.parentOffset;
  const start = Math.max(0, end - 128);
  const before = $from.parent.textBetween(start, end, undefined, () => " ");
  const match = /@(\S*)$/.exec(before);
  if (!match || match[1].startsWith("<")) return null;
  // `$` は末尾の改行の直前にもマッチするため、真の末尾でなければ検出しない
  if (match.index + match[0].length !== before.length) return null;

  // `foo@bar` (メール/URL内の@) をメンション開始とみなさない。
  // CJKは \p{L} に含まれるためUnicodeクラスでなくASCII文字種判定にする
  // (日本語の「こんにちは@田中」のようなスペースなしメンションを殺さないため)
  const at = before.length - match[0].length;
  // 窓の先頭で切れている = 直前の文字が確認できない 128 文字超のクエリ
  if (at === 0 && start > 0) return null;
  if (at > 0 && /[A-Za-z0-9_]/.test(before[at - 1])) return null;

  const to = $from.pos;
  return { query: match[1], from: to - match[0].length, to };
}

/**
 * MessageTextRender.tsx の urlPattern と同一
 * (受信側のリンク描画範囲とエディタの下線範囲を一致させるため)。
 * g フラグは共有せず、複数マッチが必要な箇所ではソースから都度 RegExp を作る
 * (共有インスタンスの lastIndex 残留を避けるため)。
 */
export const URL_PATTERN_SOURCE =
  "(\\b(https?|ftp|file):\\/\\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])";

export type TUrlRange = [start: number, end: number];

/** 段落全文から URL の範囲を求める(受信側と同じパターン) */
export function findUrlRanges(text: string): TUrlRange[] {
  if (!text.includes("://")) return [];
  const ranges: TUrlRange[] = [];
  for (const match of text.matchAll(new RegExp(URL_PATTERN_SOURCE, "gi"))) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}
