import {useNavigate} from "@solidjs/router";

export default function Home() {
  const navi = useNavigate();

  navi("/app/channel-browser");

  return (
    <div class={"text-center mt-10"}>Loading...</div>
  );
}
