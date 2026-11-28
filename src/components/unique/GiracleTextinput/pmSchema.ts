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
      //0x00〜0x1F の制御文字と、0x7F（DEL）を除去する(表示に影響しない可視文字だけを許可)
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

const channelMentionSpec: NodeSpec = {
  inline: true,
  group: "inline",
  atom: true,
  selectable: false,
  attrs: { channelId: {}, name: {} },
  toDOM: (node) => [
    "span",
    {
      class: "mention-node",
      "data-channel-id": node.attrs.channelId,
      "data-channel-name": node.attrs.name,
    },
    `#${node.attrs.name}`,
  ],
  parseDOM: [
    {
      tag: "span[data-channel-id]",
      getAttrs: (dom) => {
        const channelId = (dom as HTMLElement).getAttribute("data-channel-id");
        // 受信側 channelPattern と同じ文字種のみ受け付ける(`>` 注入・偽装防止)
        if (!channelId || !USER_ID_PATTERN.test(channelId)) return false;
        const rawName =
          (dom as HTMLElement).getAttribute("data-channel-name") ?? channelId;
        return { channelId, name: sanitizeMentionName(rawName, channelId) };
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
    channelMention: channelMentionSpec,
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
    if (child.type === pmSchema.nodes.channelMention) {
      out += `#<${child.attrs.channelId}>`;
      continue;
    }
    // NBSP は送信文字列でも保持する。通常の空白へ戻すと改行機会が生まれ、
    // 入力欄(NBSP は改行不可)とメッセージ表示で折り返し位置がずれる。
    // NBSP は非単語文字のため直後 URL への `\b` 境界は保たれる
    const text = child.text ?? "";
    // 素テキスト中の `@<` / `#<` は受信側の mentionPattern / channelPattern に
    // 偽メンションとして解釈されるため、ゼロ幅スペースを挟んでエスケープする
    // (表示上は変化なし)
    out += text.replaceAll("@<", "@\u200B<").replaceAll("#<", "#\u200B<");
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

export type TTriggerKind = "user" | "channel" | "emoji";

export interface ITriggerQuery {
  kind: TTriggerKind;
  query: string;
  /** トリガー文字を含む開始位置(doc 座標) */
  from: number;
  /** カーソル位置(doc 座標) */
  to: number;
}

/**
 * トリガー文字ごとの検出パターン。
 * boundary はトリガー直前の ASCII 英数字を除外するか(`foo@bar` を除く)
 */
const TRIGGER_PATTERNS: {
  kind: TTriggerKind;
  pattern: RegExp;
  boundary: boolean;
}[] = [
  { kind: "user", pattern: /@(\S*)$/, boundary: true },
  { kind: "channel", pattern: /#(\S*)$/, boundary: true },
  // 絵文字コードは英数字のみ。直前が ASCII 英数字/`_` のコロン
  // (時刻 `12:30`・URL `https://`・`foo:bar`)は候補にしない。
  // CJK の直後は `@` / `#` と同じく検出する
  { kind: "emoji", pattern: /:([A-Za-z0-9_+-]*)$/, boundary: true },
];

/** カーソル直前の未確定トリガー(`@user` / `#channel` / `:emoji`)を取得する */
export function getTriggerQuery(
  state: EditorState,
  disabledSuggests?: TTriggerKind[],
): ITriggerQuery | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const $from = selection.$from;
  if (!$from.parent.isTextblock) return null;

  // メンション(atom)は 1 文字分の空白として扱う。
  // これによりトリガー文字の後にチップが挟まる場合は \S* が途切れて検出されない
  // 段落全体ではなくカーソル直前の窓だけを見る(巨大ペーストで毎キー O(n)
  // の文字列確保が走るのを防ぐ)。128 文字超のクエリは候補名に一致しない
  const end = $from.parentOffset;
  const start = Math.max(0, end - 128);
  const before = $from.parent.textBetween(start, end, undefined, () => " ");
  const to = $from.pos;

  // 複数トリガーが窓内にあっても、カーソルに最も近い(末尾にマッチした)1 件だけを返す
  let best: {
    kind: TTriggerKind;
    query: string;
    index: number;
    length: number;
  } | null = null;
  for (const { kind, pattern, boundary } of TRIGGER_PATTERNS) {
    //もし無効化されているならスキップ
    if (disabledSuggests?.includes(kind)) {
      continue;
    }

    const match = pattern.exec(before);
    if (!match) continue;
    // `$` は末尾の改行の直前にもマッチするため、真の末尾でなければ検出しない
    if (match.index + match[0].length !== before.length) continue;
    // 確定済みの `@<user-id>` / `#<channel-id>` は対象外
    if (match[1].startsWith("<")) continue;
    if (boundary) {
      // `foo@bar` (メール/URL内の@)・時刻や URL のコロンを開始とみなさない。
      // CJKは \p{L} に含まれるためUnicodeクラスでなくASCII文字種判定にする
      // (日本語の「こんにちは@田中」のようなスペースなしメンションを殺さないため)
      // 窓の先頭で切れている = 直前の文字が確認できない 128 文字超のクエリ
      if (match.index === 0 && start > 0) continue;
      if (match.index > 0 && /[A-Za-z0-9_]/.test(before[match.index - 1]))
        continue;
    }
    if (best && best.index >= match.index) continue;
    best = {
      kind,
      query: match[1],
      index: match.index,
      length: match[0].length,
    };
  }
  if (!best) return null;
  return { kind: best.kind, query: best.query, from: to - best.length, to };
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
