import type Quill from "quill";
import { Delta } from "quill";

export interface IQuillInputInlinePattern {
  /** Quill の format 名（blot 登録名と一致） */
  format: string;
  /** 行内テキストを走査する正規表現（g フラグ必須） */
  pattern: RegExp;
}

export const DEFAULT_INLINE_PATTERNS: IQuillInputInlinePattern[] = [
  {
    format: "url",
    pattern:
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi,
  },
];

interface ILineSegment {
  start: number;
  end: number;
  attributes?: Record<string, unknown>;
}

interface IFormatOp {
  start: number;
  length: number;
  format: string;
  value: boolean | null;
}

/**
 * 指定 index が属する行だけの装飾差分を求める（ドキュメントは変更しない）。
 */
function lineFormatOps(
  quill: Quill,
  index: number,
  patterns: IQuillInputInlinePattern[],
): IFormatOp[] {
  //該当箇所のBlockを取得
  const bounded = Math.max(0, Math.min(index, quill.getLength() - 1));
  const [line] = quill.getLine(bounded);
  if (!line) return [];

  //該当行の開始位置と文字数
  const lineStart = quill.getIndex(line);
  const lineLength = line.length() - 1; // Block の長さは末尾 "\n" を含む
  if (lineLength <= 0) return [];

  // embed は 1 文字プレースホルダとして平坦化する（getText は embed を落とすため使わない）
  const segments: ILineSegment[] = [];
  let text = "";
  for (const op of quill.getContents(lineStart, lineLength).ops) {
    // \uFFFC はオブジェクトのプレイスホルダーを示すUnicode文字
    const str = typeof op.insert === "string" ? op.insert : "\uFFFC";
    segments.push({
      start: text.length,
      end: text.length + str.length,
      attributes: op.attributes, //formatオブジェクト。 { url: true } や { mention: { trigger: ... } } など
    });
    text += str;
  }

  const ops: IFormatOp[] = [];
  for (const { format, pattern } of patterns) {
    // g フラグ必須。未指定でも無限ループしないよう強制する
    const re = pattern.flags.includes("g")
      ? pattern
      : new RegExp(pattern.source, `${pattern.flags}g`);
    //gがつくことによりlastIndex開始にできる
    re.lastIndex = 0;
    const ranges: ILineSegment[] = [];
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }

    // segment ごとに一致範囲との重なりを「付与 / 除去 / 対象外」へ振り分ける
    // （segment は属性が一様なので、重なり方だけで最終状態が決まる）
    for (const seg of segments) {
      const formatted = seg.attributes?.[format];
      let cursor = seg.start;
      for (const r of ranges) {
        if (r.end <= cursor || r.start >= seg.end) continue;
        const insideStart = Math.max(cursor, r.start);
        const insideEnd = Math.min(seg.end, r.end);
        if (insideStart > cursor && formatted)
          ops.push({
            start: lineStart + cursor,
            length: insideStart - cursor,
            format,
            value: null,
          });
        if (!formatted)
          ops.push({
            start: lineStart + insideStart,
            length: insideEnd - insideStart,
            format,
            value: true,
          });
        cursor = insideEnd;
      }
      if (cursor < seg.end && formatted)
        ops.push({
          start: lineStart + cursor,
          length: seg.end - cursor,
          format,
          value: null,
        });
    }
  }
  return ops;
}

/**
 * 指定 index 群の行にだけ行内パターン（URL 装飾など）を適用する。
 * 複数行を 1 回の updateContents にまとめるので、行数が増えても
 * ドキュメント更新サイクルの回数は 1 フレーム 1 回のまま。
 * テキスト長は変えないのでカーソル位置は維持される。
 */
export function applyInlinePatterns(
  quill: Quill,
  indexes: Iterable<number>,
  patterns: IQuillInputInlinePattern[] = DEFAULT_INLINE_PATTERNS,
): void {
  const ops: IFormatOp[] = [];
  for (const index of indexes)
    ops.push(...lineFormatOps(quill, index, patterns));
  if (ops.length === 0) return;
  ops.sort((a, b) => a.start - b.start);

  const delta = new Delta();
  let pos = 0;
  for (const op of ops) {
    // shortcut: 同一位置の重複は先勝ちで切り詰める（format をまたいで重なる
    // パターンを渡す場合は要調整。現状 url 1 種のみで重複は起きない）
    if (op.length <= 0 || op.start < pos) continue;
    if (op.start > pos) delta.retain(op.start - pos);
    delta.retain(op.length, { [op.format]: op.value });
    pos = op.start + op.length;
  }
  if (delta.ops.length === 0) return;
  quill.updateContents(delta, "api");
}
