import {type JSX} from "solid-js";

export default function MentionReadWrapper(props: {children: JSX.Element}) {
  return (
    <>
      {props.children}
    </>
  );
}