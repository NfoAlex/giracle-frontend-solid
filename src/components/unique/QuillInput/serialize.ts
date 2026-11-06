import type { Delta } from "quill";
import type { IMentionValue } from "./blots.ts";

export function deltaToPlainText(
  delta: Delta,
  mentionToText: (value: IMentionValue) => string,
): string {
  let text = "";
  for (const op of delta.ops) {
    if (typeof op.insert === "string") {
      text += op.insert;
    } else if (op.insert && typeof op.insert === "object") {
      const embed = op.insert as Record<string, unknown>;
      if ("mention" in embed) {
        text += mentionToText(embed.mention as IMentionValue);
      }
      // メンション以外の embed はテキストに落とさない
    }
  }
  // Quill は常に末尾に "\n" を持つ
  return text.replace(/\n$/, "");
}
