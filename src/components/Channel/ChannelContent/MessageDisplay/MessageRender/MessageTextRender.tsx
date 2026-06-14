import { createMemo, For, type JSX } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";

export default function MessageTextRender(props: { content: string }) {
  // props.content や依存するストアの値が変わった時だけ再計算されるメモを作成
  const parsedContent = createMemo<JSX.Element[]>(() => {
    // console.log("Running linkify logic for content:", props.content); // デバッグ用

    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const messageLinkPattern = /&<([a-f0-9-]+):([a-f0-9-]+)>/g;
    const mentionPattern = /@<([a-f0-9-]+)>/g;
    const channelPattern = /#<([a-f0-9-]+)>/g;
    const inlineCodePattern = /`([^`]+)`/g;

    type MatchType = "link" | "messageLink" | "userId" | "channel" | "inlineCode";
    interface IMatchObject {
      context: string;
      type: MatchType;
      index: number;
      idOrValue: string; // パース後の値 (URL, ID, コード内容)
    }

    const contentObjectIndex: IMatchObject[] = [];

    // 表示コンテンツパターンのマッチを判別、追加するヘルパー関数
    const findMatches = (regex: RegExp, type: MatchType) => {
      let match;
      // lastIndexをリセットして最初から検索
      regex.lastIndex = 0;
      while ((match = regex.exec(props.content)) !== null) {
        let idOrValue: string;
        switch (type) {
          case "link":
            idOrValue = match[0]; // リンクはそのまま
            break;
          case "messageLink":
            idOrValue = match[1] + "/" + match[2]; // キャプチャグループ1 (チャンネルId) + "/" + キャプチャグループ2 (メッセージId)
            break;
          case "userId":
          case "channel":
            idOrValue = match[1]; // キャプチャグループ1 (チャンネルId)
            break;
          case "inlineCode":
            idOrValue = match[1]; // キャプチャグループ1 (コード内容)
            break;
          default:
            idOrValue = match[0]; // フォールバック
        }
        contentObjectIndex.push({
          context: match[0], // マッチした元の文字列
          type: type,
          index: match.index,
          idOrValue: idOrValue,
        });
      }
    };

    // パターンを検索
    findMatches(urlPattern, "link");
    findMatches(messageLinkPattern, "messageLink");
    findMatches(mentionPattern, "userId");
    findMatches(channelPattern, "channel");
    findMatches(inlineCodePattern, "inlineCode");

    // インデックスでソート
    contentObjectIndex.sort((a, b) => a.index - b.index);

    //レンダーするJSX用配列
    const messageRenderingFinal: JSX.Element[] = [];
    //処理をした文字位置
    let lastProcessedIndex = 0;

    // テキストとマッチ部分を交互に処理
    for (const obj of contentObjectIndex) {
      // マッチまでのテキスト部分を追加
      if (obj.index > lastProcessedIndex) {
        const textSegment = props.content.slice(lastProcessedIndex, obj.index);
        // textSegment を改行文字 (\n) で分割し、それぞれを span でラップするか、
        // 単一の span に white-space: pre-wrap を適用する
        messageRenderingFinal.push(
          <span class="whitespace-pre-wrap break-words">{textSegment}</span>
        );
      }

      // マッチ部分をタイプに応じてJSXに変換
      switch (obj.type) {
        case "link":
          messageRenderingFinal.push(
            <a href={obj.idOrValue} target="_blank" rel="noopener noreferrer" class="underline whitespace-pre-wrap break-words text-blue-500">
              {obj.idOrValue}
            </a>
          );
          break;

        case "messageLink":
          {
            const channelId = obj.idOrValue.split("/")[0];
            const messageId = obj.idOrValue.split("/")[1];
            const classesMessageLink = "cursor-pointer whitespace-pre-wrap break-words bg-border hover:underline my-auto mx-px align-baseline inline-flex rounded px-1";

            const nav = useNavigate();
            const loc = useLocation();
            const jump = (e: MouseEvent) => {
              e.preventDefault();
              if (loc.pathname.endsWith(`${channelId}/${messageId}`)) {
                nav(`/app/channel/${channelId}`);
                setTimeout(() => {
                  nav(`/app/channel/${channelId}/${messageId}`);
                }, 0);
                return;
              }
              nav(`/app/channel/${channelId}/${messageId}`);
            }

            messageRenderingFinal.push(
              <span onClick={jump} class={classesMessageLink}>
                #
                {
                  directGetterChannelInfo(obj.idOrValue.split("/")[0]).name.length > 18
                    ?
                    directGetterChannelInfo(obj.idOrValue.split("/")[0]).name.slice(0, 18) + "..."
                    :
                    directGetterChannelInfo(obj.idOrValue.split("/")[0]).name
                } のメッセージ
              </span>
            );
          }
          break;

        case "userId":
          // createMemo 内でリアクティブな値を参照すると、その値の変更時にメモが再計算される
          const userInfo = getterUserinfo(obj.idOrValue);
          const isMe = () => storeMyUserinfo.id === obj.idOrValue; // storeMyUserinfo.id もリアクティブに追跡
          messageRenderingFinal.push(
            <UserinfoModalWrapper userId={userInfo.id} class="cursor-pointer">
              <span class={`${isMe() ? "bg-primary text-primary-foreground" : "bg-border"} hover:underline my-auto mx-px align-baseline inline-flex rounded px-1`}>
                @{userInfo?.name ?? obj.idOrValue}
              </span>
            </UserinfoModalWrapper>
          );
          break;

        case "channel":
          const channelInfo = directGetterChannelInfo(obj.idOrValue);
          messageRenderingFinal.push(
            <span class="font-medium cursor-pointer hover:underline mx-px">
              #{channelInfo?.name ?? obj.idOrValue} {/* fallback */}
            </span>
          );
          break;

        case "inlineCode":
          messageRenderingFinal.push(
            <code class="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono mx-px">
              {obj.idOrValue}
            </code>
          );
          break;

      }
      lastProcessedIndex = obj.index + obj.context.length;
    }

    // 最後のマッチ以降の残りのテキストを追加
    if (lastProcessedIndex < props.content.length) {
      const remainingText = props.content.slice(lastProcessedIndex);
      messageRenderingFinal.push(
        <span class="whitespace-pre-wrap break-words">{remainingText}</span>
      );
    }

    // 空のコンテンツの場合のフォールバック
    if (messageRenderingFinal.length === 0 && props.content === "") {
      return []; // or [<span />] など、必要に応じて
    }

    // 計算結果（JSX要素の配列）を返す
    return messageRenderingFinal;
  });

  // biome-ignore lint/correctness/useJsxKeyInIterable: SolidのForは通常Keyなしで効率的
  return (
    <div class="py-1 w-full">
      <For each={parsedContent()}>{(el) => el}</For>
    </div>
  );
}
