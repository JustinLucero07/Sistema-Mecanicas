"use client";

import { useEffect, useState } from "react";
import { Plus, UserCog } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { etiqueta, formatoFecha } from "@/lib/format";
import type { Rol } from "@/lib/types";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Td, Th } from "@/components/ui";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  cargo: string | null;
  especialidad: string | null;
  activo: boolean;
  creado_en: string | null;
}

const ROLES: { valor: Rol; label: string; descripcion: string }[] = [
  { valor: "admin_taller", label: "Administrador", descripcion: "Todo el taller: equipo, caja y configuración" },
  { valor: "gerente", label: "Gerente", descripcion: "Operación y finanzas" },
  { valor: "recepcionista", label: "Recepción", descripcion: "Clientes, vehículos y órdenes" },
  { valor: "mecanico", label: "Mecánico", descripcion: "Vehículos, órdenes y fotos; sin caja" },
  { valor: "inventario", label: "Bodega", descripcion: "Repuestos y proveedores" },
  { valor: "contabilidad", label: "Contabilidad", descripcion: "Caja, ingresos y egresos" },
];
const nombreRol = (rol: Rol) => ROLES.find((r) => r.valor === rol)?.label ?? etiqueta(rol);

const FORM_VACIO = { nombre: "", email: "", rol: "mecanico" as Rol, telefono: "", cargo: "", especialidad: "", password: "" };

export default function UsuariosPage() {
  const { sesion } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api
      .get<Usuario[]>("/api/usuarios")
      .then(setUsuarios)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el equipo."));
  }

  useEffect(cargar, []);

  async function guardar(accion: () => Promise<unknown>, cerrar: () => void) {
    setErrorForm(null);
    setGuardando(true);
    try {
      await accion();
      cerrar();
      cargar();
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  function abrirEdicion(u: Usuario) {
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, telefono: u.telefono ?? "", cargo: u.cargo ?? "", especialidad: u.especialidad ?? "", password: "" });
    setErrorForm(null);
    setEditando(u);
  }

  const set = (campo: keyof typeof FORM_VACIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const camposComunes = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <Input required value={form.nombre} onChange={set("nombre")} />
        </Field>
        <Field label="Teléfono">
          <Input type="tel" value={form.telefono} onChange={set("telefono")} />
        </Field>
        <Field label="Cargo">
          <Input value={form.cargo} onChange={set("cargo")} placeholder="Mecánico jefe" />
        </Field>
        <Field label="Especialidad">
          <Input value={form.especialidad} onChange={set("especialidad")} placeholder="Frenos y suspensión" />
        </Field>
      </div>
      <Field label="Rol" hint={ROLES.find((r) => r.valor === form.rol)?.descripcion}>
        <Select value={form.rol} onChange={set("rol")} disabled={editando?.id === sesion?.usuarioId}>
          {ROLES.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );

  const textoOpcional = (v: string) => v.trim() || null;

  return (
    <>
      <PageHeader
        title="Equipo"
        description="Cada persona del taller con su propio usuario. Lo que cada uno puede ver depende de su rol."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setForm(FORM_VACIO);
              setErrorForm(null);
              setNuevoOpen(true);
            }}
          >
            Agregar persona
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        {usuarios === null && !error ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : usuarios?.length === 0 ? (
          <EmptyState icon={UserCog} title="Aún no hay nadie en el equipo" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line">
                <tr>
                  <Th>Persona</Th>
                  <Th>Rol</Th>
                  <Th>Teléfono</Th>
                  <Th>Desde</Th>
                  <Th>Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usuarios?.map((u) => (
                  <tr key={u.id} className={u.activo ? "" : "opacity-60"}>
                    <Td>
                      <p className="font-semibold">
                        {u.nombre}
                        {u.id === sesion?.usuarioId && <span className="ml-2 text-[0.8rem] font-normal text-ink-3">(tú)</span>}
                      </p>
                      <p className="text-[0.87rem] text-ink-3">{u.email}</p>
                    </Td>
                    <Td>
                      <p>{nombreRol(u.rol)}</p>
                      {u.especialidad && <p className="text-[0.87rem] text-ink-3">{u.especialidad}</p>}
                    </Td>
                    <Td className="text-ink-2">{u.telefono ?? "—"}</Td>
                    <Td className="text-ink-2">{formatoFecha(u.creado_en)}</Td>
                    <Td>{u.activo ? <Badge tone="ok">Activo</Badge> : <Badge>Desactivado</Badge>}</Td>
                    <Td className="text-right">
                      <Button variant="secondary" size="sm" onClick={() => abrirEdicion(u)}>
                        Editar
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Agregar persona" description="Comparte el correo y la contraseña con la persona; podrá cambiarla en Mi cuenta." width="max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            guardar(
              () =>
                api.post("/api/usuarios", {
                  nombre: form.nombre.trim(),
                  email: form.email.trim(),
                  rol: form.rol,
                  telefono: textoOpcional(form.telefono),
                  cargo: textoOpcional(form.cargo),
                  especialidad: textoOpcional(form.especialidad),
                  password: form.password,
                }),
              () => setNuevoOpen(false),
            );
          }}
        >
          <Field label="Correo">
            <Input type="email" required autoComplete="off" value={form.email} onChange={set("email")} />
          </Field>
          {camposComunes}
          <Field label="Contraseña inicial" hint="Al menos 10 caracteres, con letras y números.">
            <Input type="text" required minLength={10} autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
          {errorForm && <Alert>{errorForm}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setNuevoOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Agregar persona"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={editando !== null} onClose={() => setEditando(null)} title={editando ? `Editar a ${editando.nombre}` : "Editar"} description={editando?.email} width="max-w-xl">
        {editando && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              guardar(
                () =>
                  api.patch(`/api/usuarios/${editando.id}`, {
                    nombre: form.nombre.trim(),
                    rol: form.rol,
                    telefono: textoOpcional(form.telefono),
                    cargo: textoOpcional(form.cargo),
                    especialidad: textoOpcional(form.especialidad),
                    ...(form.password ? { password: form.password } : {}),
                  }),
                () => setEditando(null),
              );
            }}
          >
            {camposComunes}
            <Field label="Nueva contraseña (opcional)" hint="Si la cambias, la persona deberá volver a iniciar sesión.">
              <Input type="text" minLength={10} autoComplete="new-password" value={form.password} onChange={set("password")} />
            </Field>
            {errorForm && <Alert>{errorForm}</Alert>}
            <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
              {editando.id !== sesion?.usuarioId ? (
                <Button
                  type="button"
                  variant={editando.activo ? "danger" : "secondary"}
                  disabled={guardando}
                  onClick={() =>
                    guardar(() => api.patch(`/api/usuarios/${editando.id}`, { activo: !editando.activo }), () => setEditando(null))
                  }
                >
                  {editando.activo ? "Desactivar acceso" : "Reactivar acceso"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
