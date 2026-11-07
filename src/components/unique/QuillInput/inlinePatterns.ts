import type Quill from "quill";

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

/**
 * 指定 index が属する行だけに行内パターン（URL 装飾など）を適用する。
 * テキスト長は変えないのでカーソル位置は維持される。
 */
export function applyInlinePatterns(
  quill: Quill,
  index: number,
  patterns: IQuillInputInlinePattern[] = DEFAULT_INLINE_PATTERNS,
): void {
  //該当箇所のBlockを取得
  const bounded = Math.max(0, Math.min(index, quill.getLength() - 1));
  const [line] = quill.getLine(bounded);
  if (!line) return;

  //該当行の開始位置と文字数
  const lineStart = quill.getIndex(line);
  const lineLength = line.length() - 1; // Block の長さは末尾 "\n" を含む
  if (lineLength <= 0) return;

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

    // Phase 1: 一致範囲に完全包含されない既存装飾を除去
    for (const seg of segments) {
      if (!seg.attributes?.[format]) continue;
      const covered = ranges.some(
        (r) => r.start <= seg.start && seg.end <= r.end,
      );
      if (!covered) {
        quill.formatText(
          lineStart + seg.start,
          seg.end - seg.start,
          format,
          false,
          "api",
        );
      }
    }

    // Phase 2: 未適用の一致範囲へ付与
    for (const range of ranges) {
      const current = quill.getFormat(
        lineStart + range.start,
        range.end - range.start,
      )[format];
      if (current !== true) {
        quill.formatText(
          lineStart + range.start,
          range.end - range.start,
          format,
          true,
          "api",
        );
      }
    }
  }
}
