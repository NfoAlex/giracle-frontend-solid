import { createResource, createSignal } from "solid-js";
import { getterChannelInfo } from "~/stores/ChannelInfo";

export default function ChannelName(props: { channelId: string }) {
  const [channel] = createResource(props.channelId, getterChannelInfo);

  return <p>{channel.loading ? props.channelId : channel()?.name}</p>;
}
