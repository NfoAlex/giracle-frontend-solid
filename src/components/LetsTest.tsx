import { storeAppStatus } from "~/stores/AppStatus";
import { Button } from "./ui/button";

export default function LetsTest() {

  const testSendingMsg = async () => {
    const res = await fetch("/api/message/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: "01f3fdd2-7db8-4619-b625-a19ff9f62973",
        message: "this is a test message",
        fileIds: [],
      }),
    }).catch((err) => {
      throw new Error("testSendingMsg :: err->", err);
    });
  }

  return (
    <div>
      { storeAppStatus.wsConnected ? <p>WS接続済み</p> : <p>WS未接続</p> }
      <h1>Lets Test</h1>
      <p class=" text-red-600" > test </p>

      <Button onClick={testSendingMsg}>試す</Button>
    </div>
  );
}
