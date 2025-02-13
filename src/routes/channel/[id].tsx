import ChannelContents from "~/components/Channel/ChannelContents";
import ChannelHeader from "~/components/Channel/ChannelHeader";
import ChannelTextInput from "~/components/Channel/ChannelTextInput";

export default function Channel() {
  return (
    <div class="w-full h-screen mx-auto px-1 py-2 flex flex-col">
      <ChannelHeader />
      <ChannelContents />
      <ChannelTextInput />
    </div>
  );
}
