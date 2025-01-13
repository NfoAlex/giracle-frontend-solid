import { useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal } from "solid-js";
import { getterChannelInfo } from "~/stores/ChannelInfo";
import { Card } from "../ui/card";
import { SidebarTrigger } from "../ui/sidebar";

export default function ChannelHeader() {
  const params = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal(params.id);
  const [channel] = createResource(() => currentChannelId(), getterChannelInfo);

  createEffect(() => {
    setCurrentChannelId(params.channelId);
    console.log(
      "ChannelHeader :: createEffect : id->",
      params.id,
      currentChannelId(),
    );
  });

  return (
    <Card class="w-full py-3 px-5 flex items-center gap-2">
      <SidebarTrigger />
      <p>{!channel.loading ? channel()?.name : "loading..."}</p>
      <p class="text-gray-400 mx-1"> | </p>
      <p>{!channel.loading ? channel()?.description : ""}</p>
    </Card>
  );
}
