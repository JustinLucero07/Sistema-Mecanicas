import VehiculoDetalle from "./VehiculoDetalle";

export default async function VehiculoDetallePage(props: PageProps<"/vehiculos/[id]">) {
  const { id } = await props.params;
  return <VehiculoDetalle vehiculoId={Number(id)} />;
}
