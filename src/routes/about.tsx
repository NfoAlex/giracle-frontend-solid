import { A } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { storeAppStatus } from "~/stores/AppStatus";

export default function About() {
  return (
    <div>
      <p>ここはAbout</p>
      {storeAppStatus.loggedIn.toString()}

      <Button
        onClick={() => {
          storeAppStatus.loggedIn = !storeAppStatus.loggedIn;
        }}
      >
        切り替えてみる
      </Button>
      <A href="/">
        <Button>Indexへ</Button>
      </A>
    </div>
  );
}
