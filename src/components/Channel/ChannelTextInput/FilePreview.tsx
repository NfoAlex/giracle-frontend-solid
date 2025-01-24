import {Card} from "~/components/ui/card";

export default function FilePreview(props: { file: File }) {
  return (
    <div>
      <Card class={"p-2 w-fit"}>
        { props.file.name }
      </Card>
    </div>
  );
}