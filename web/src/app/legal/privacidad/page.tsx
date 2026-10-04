import type { Metadata } from "next";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = { title: "Política de privacidad · MecánicaOS" };

export default function PrivacidadPage() {
  const e = EMPRESA;
  return (
    <>
      <h1>Política de privacidad</h1>
      <p>
        Esta política explica qué datos personales trata {e.nombreComercial}, para qué y con qué derechos, conforme a la Ley
        Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
      </p>

      <h2>1. Quién es quién</h2>
      <ul>
        <li>
          <strong>Datos de los usuarios del sistema</strong> (dueños, recepcionistas, mecánicos): el responsable es{" "}
          {e.razonSocial}, RUC {e.ruc}, {e.direccion}. Contacto de privacidad: {e.correoPrivacidad}.
        </li>
        <li>
          <strong>Datos de los clientes de cada taller</strong> (dueños de los vehículos): el responsable es el taller que los
          registra. {e.razonSocial} solo los trata por encargo del taller. Si eres cliente de un taller y quieres ejercer tus
          derechos, escribe primero al taller; si no te responde, escríbenos a {e.correoPrivacidad} y lo trasladaremos.
        </li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <table>
        <thead>
          <tr>
            <th>Titular</th>
            <th>Datos</th>
            <th>Para qué</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Usuarios del sistema</td>
            <td>Nombre, correo, teléfono, cargo, contraseña cifrada, registros de acceso e IP</td>
            <td>Dar acceso, proteger la cuenta y llevar la auditoría de cambios</td>
          </tr>
          <tr>
            <td>Clientes del taller</td>
            <td>Nombre, cédula o RUC, teléfono, correo, ciudad, dirección</td>
            <td>Identificar al dueño del vehículo y contactarlo sobre su reparación</td>
          </tr>
          <tr>
            <td>Vehículos</td>
            <td>Placa, VIN, marca, modelo, kilometraje, fotografías, historial de reparaciones</td>
            <td>Llevar el historial técnico y dejar evidencia del estado del vehículo</td>
          </tr>
          <tr>
            <td>Pagos</td>
            <td>Montos, forma de pago, saldos</td>
            <td>Llevar la caja y las cuentas por cobrar del taller</td>
          </tr>
        </tbody>
      </table>
      <p>
        No pedimos datos sensibles. Las fotos se procesan para quitarles la ubicación GPS y otros metadatos antes de
        guardarlas.
      </p>

      <h2>3. Base legal</h2>
      <ul>
        <li>Ejecución del contrato: para prestar el servicio al taller y a sus usuarios.</li>
        <li>Obligación legal: para conservar registros contables y tributarios el tiempo que exige la ley.</li>
        <li>Interés legítimo: para la seguridad del sistema (registros de acceso y auditoría).</li>
        <li>Consentimiento: para enviar recordatorios o mensajes a los clientes del taller. El taller registra si el cliente lo dio y el cliente puede retirarlo en cualquier momento.</li>
      </ul>

      <h2>4. Con quién se comparten</h2>
      <p>No vendemos ni alquilamos datos personales. Solo los procesan estos proveedores, que nos ayudan a prestar el servicio:</p>
      <ul>
        <li>Alojamiento del servidor y de la base de datos: {e.proveedorHosting}.</li>
        <li>Envío de correos del sistema, cuando se active: se informará aquí antes de usarlo.</li>
      </ul>
      <p>
        Si un proveedor está fuera del Ecuador, la transferencia se hace con las garantías que exige la LOPDP. También
        entregamos datos a una autoridad cuando una ley o una orden judicial lo exige.
      </p>

      <h2>5. Cuánto tiempo se guardan</h2>
      <ul>
        <li>Mientras el taller tenga contrato vigente.</li>
        <li>Al terminar, 30 días para que el taller pida su exportación; luego se eliminan, y de las copias de respaldo en un máximo de 90 días adicionales.</li>
        <li>Los registros de órdenes y pagos que el taller debe conservar por ley tributaria se mantienen anonimizados cuando el titular pide su eliminación.</li>
      </ul>

      <h2>6. Cómo los protegemos</h2>
      <ul>
        <li>Conexión cifrada (HTTPS) en la web y la app.</li>
        <li>Contraseñas guardadas con bcrypt; bloqueo temporal tras intentos fallidos.</li>
        <li>Separación estricta de los datos de cada taller, verificada en cada escritura.</li>
        <li>Permisos por rol: por ejemplo, un mecánico no ve la caja del taller.</li>
        <li>Bitácora de auditoría: quién creó, cambió o eliminó cada dato, cuándo y desde qué IP.</li>
        <li>Fotos en almacenamiento privado, accesibles solo con enlaces que vencen.</li>
        <li>Copias de respaldo diarias guardadas fuera del servidor principal.</li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir acceso a tus datos, su rectificación o actualización, su eliminación, la oposición o suspensión de su
        tratamiento y su portabilidad, y a no ser objeto de decisiones basadas solo en tratamientos automatizados. El sistema
        permite al taller exportar todos los datos de un cliente y anonimizarlo. Respondemos los pedidos dentro de los plazos
        que fija la LOPDP. Si no estás conforme con la respuesta, puedes acudir a la Superintendencia de Protección de Datos
        Personales.
      </p>

      <h2>8. Cambios a esta política</h2>
      <p>Si esta política cambia, lo avisaremos dentro del sistema antes de que el cambio entre en vigencia.</p>
    </>
  );
}
