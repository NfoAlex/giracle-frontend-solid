import { createResource, createSignal } from "solid-js";
import { getterUserinfo } from "~/stores/Userinfo";

export default function UserName(props: { userId: string }) {
  const [user] = createResource(props.userId, getterUserinfo);

  return <p class="font-bold">{user.loading ? props.userId : user()?.name}</p>;
}
