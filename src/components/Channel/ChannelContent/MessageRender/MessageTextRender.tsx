import { createSignal, For, onMount, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { getterUserinfo } from "~/stores/Userinfo";

export default function MessageTextRender(props: { content: string }) {
  // biome-ignore lint/correctness/useJsxKeyInIterable: ??? need research
  const [text, setText] = createSignal<JSX.Element[]>([<span>{ props.content }</span>]);

  const linkify = () => {
    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const mentionPattern = /@<([a-f0-9-]+)>/g;
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const htmlTagPattern = /<\/?[^>]+(>|$)/g;
    const channelPattern = /#<([a-f0-9-]+)>/g;
    const codeSnippetPattern = /```([^`]+)```/g;
    const inlineCodePattern = /`([^`]+)`/g;
    const newlinePattern = /\n/g;
  
    //レンダーする要素用データ
    const ObjectIndex: {
      context: string;
      type: "link" | "userId" | "breakLine" | "channel";
      index: number;
    }[] = [];

    //メッセージ本文からRegexを使い要素データとテキストデータを分けて順番に追加する関数
    const addMatches = (
      regex: RegExp,
      type: "link" | "userId" | "breakLine" | "channel",
    ) => {
      let match = regex.exec(props.content);
      let lastIndex = 0;

      //Regex結果がある限りオブジェクト格納
      while (match !== null) {
        ObjectIndex.push({
          context: match[0],
          type: type,
          index: match.index,
        });
        lastIndex = regex.lastIndex;
        match = regex.exec(props.content);
      }
    };

    //ここでメッセージ本文から抜き出し処理
    addMatches(urlPattern, "link");
    addMatches(mentionPattern, "userId");
    addMatches(newlinePattern, "breakLine");
    addMatches(channelPattern, "channel");

    ObjectIndex.sort((a, b) => a.index - b.index);

    const content: string[] = [];
    let lastIndex = 0;
    for (const obj of ObjectIndex) {
      content.push(props.content.slice(lastIndex, obj.index));
      lastIndex = obj.index + obj.context.length;
    }
    content.push(props.content.slice(lastIndex));

    const MessageRenderingFinal: JSX.Element[] = [];
    //レンダーする要素配列をループしてVNodeへパース
    for (let i = 0; i < content.length; i++) {
      //まず最初のデータをパースする
      MessageRenderingFinal.push(<span>{ content[i] }</span>);
      if (i < ObjectIndex.length) {
        const obj = ObjectIndex[i];
        switch (obj.type) {
          case "link":
            MessageRenderingFinal.push(<a href={obj.context} target="_blank" rel="noreferrer" class="underline">{ obj.context }</a>);
            break;
          case "userId":
            MessageRenderingFinal.push(<span>@{ getterUserinfo(obj.context.replace(/[<>]/g, "")).name } : { obj.context.replace(/[<>]/g, "") }</span>);
            break;
          case "breakLine":
            MessageRenderingFinal.push(<br />);
            break;
          case "channel":
            MessageRenderingFinal.push(
              //h(ChannelChip, { channelId: obj.context }),
              <span>{ directGetterChannelInfo(obj.context).name }</span>
            );
            break;
        }
      }
    }

    //console.log("MessageRenderingFinal", MessageRenderingFinal);
    setText(MessageRenderingFinal);
  };

  onMount(() => {
    linkify();
  })

  return <p class="whitespace-pre-wrap break-all">
    { text() }
    <For each={text()}>
      {(el) => <Dynamic component={() => <>{el}</>} Fallback={<span>{el}</span>} />}
    </For>
  </p>;
}
