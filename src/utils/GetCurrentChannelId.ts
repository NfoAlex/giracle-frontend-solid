/**
 * 現在のURLパス `/app/channel/:channelId/:messageId?` からチャンネルIDを取得する
 * @returns チャンネルID。チャンネル画面以外ならundefined
 */
export default function GetCurrentChannelId(): string | undefined {
  return document.location.pathname.match(
    /^\/app\/channel\/([A-Za-z0-9_-]+)(?:\/[^/]+)?$/,
  )?.[1];
}
