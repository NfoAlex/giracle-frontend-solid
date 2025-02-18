import ChannelContents from "~/components/Channel/ChannelContents";
import ChannelHeader from "~/components/Channel/ChannelHeader";
import ChannelTextInput from "~/components/Channel/ChannelTextInput";
import {storeAppStatus} from "~/stores/AppStatus";

export default function Channel() {
  return (
    <div class="w-full h-screen mx-auto p-1 flex flex-col">
      <ChannelHeader />
      {
        storeAppStatus.loggedIn ? (
          <ChannelContents />
        ) : (
          <p class={"text-center mt-5"}>Loading...</p>
        )
      }
      <ChannelTextInput />
    </div>
  );
}
