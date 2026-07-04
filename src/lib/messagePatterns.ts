/**
 * メッセージ本文/入力欄で共通利用する記法の正規表現群。
 * MessageTextRender.tsx(表示側)とRichTextInput(入力側)でズレると
 * 「入力時はチップ化されるが表示は素通り」等の不整合が起きるため共有する。
 */
export const urlPattern =
  /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
export const messageLinkPattern = /&<([a-f0-9-]+):([a-f0-9-]+)>/g;
export const mentionPattern = /@<([a-f0-9-]+)>/g;
export const channelPattern = /#<([a-f0-9-]+)>/g;
export const inlineCodePattern = /`([^`]+)`/g;
