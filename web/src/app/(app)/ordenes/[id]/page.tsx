import OrdenDetalle from "./OrdenDetalle";

export default async function OrdenPage(props: PageProps<"/ordenes/[id]">) {
  const { id } = await props.params;
  return <OrdenDetalle ordenId={Number(id)} />;
}
