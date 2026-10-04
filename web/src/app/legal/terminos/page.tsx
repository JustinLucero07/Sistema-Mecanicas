import type { Metadata } from "next";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = { title: "Términos y condiciones · MecánicaOS" };

export default function TerminosPage() {
  const e = EMPRESA;
  return (
    <>
      <h1>Términos y condiciones de uso</h1>
      <p>
        Estos términos regulan el uso de {e.nombreComercial} (el «Servicio»), un sistema en línea para gestionar talleres
        mecánicos, provisto por {e.razonSocial}, RUC {e.ruc}, con domicilio en {e.direccion} (el «Proveedor»). Al crear una
        cuenta o usar el Servicio, el taller que lo contrata (el «Cliente») y cada persona que entra con un usuario del
        Cliente aceptan estos términos.
      </p>

      <h2>1. El Servicio</h2>
      <p>
        El Servicio permite registrar clientes, vehículos, órdenes de trabajo, inventario, cobros, gastos y fotografías, desde
        la aplicación web y la aplicación móvil. El Proveedor puede mejorar o cambiar funciones; si un cambio quita una
        función que el Cliente usa de forma esencial, lo avisará con al menos 30 días de anticipación.
      </p>
      <p>
        La lectura automática de placas y cualquier función de inteligencia artificial son una ayuda. El resultado siempre
        debe ser confirmado por una persona; el Proveedor no garantiza que la lectura sea exacta.
      </p>

      <h2>2. Cuentas y seguridad</h2>
      <ul>
        <li>El Cliente es responsable de quiénes tienen usuario en su taller y de los permisos que les asigna.</li>
        <li>Cada usuario es personal. No se comparten contraseñas entre personas.</li>
        <li>El Cliente debe avisar de inmediato a {e.correoSoporte} si sospecha que una cuenta fue usada sin permiso.</li>
        <li>
          Las contraseñas se guardan cifradas con un algoritmo de un solo sentido (bcrypt): ni el Proveedor puede leerlas. Tras
          varios intentos fallidos, el acceso se bloquea temporalmente.
        </li>
      </ul>

      <h2>3. Uso aceptable</h2>
      <p>No está permitido:</p>
      <ul>
        <li>Intentar acceder a datos de otros talleres o eludir las restricciones de permisos.</li>
        <li>Cargar archivos con software malicioso o contenido ilegal.</li>
        <li>Usar el Servicio para enviar comunicaciones a personas que no dieron su consentimiento.</li>
        <li>Revender o sublicenciar el Servicio sin un acuerdo escrito con el Proveedor.</li>
      </ul>
      <p>El incumplimiento permite al Proveedor suspender la cuenta, avisando al Cliente de la causa.</p>

      <h2>4. Planes, pagos y cancelación</h2>
      <ul>
        <li>El precio y los límites de cada plan son los publicados al contratar o los del acuerdo comercial firmado.</li>
        <li>Los pagos son por período adelantado. Si un pago se atrasa más de 15 días, el Proveedor puede suspender el acceso hasta regularizarlo, sin borrar los datos.</li>
        <li>El Cliente puede cancelar en cualquier momento; el servicio sigue activo hasta el final del período pagado.</li>
        <li>Los cambios de precio se avisan con al menos 30 días de anticipación y no afectan el período ya pagado.</li>
      </ul>

      <h2>5. Datos del Cliente</h2>
      <p>
        Los datos que el Cliente registra (sus clientes, vehículos, órdenes, finanzas y fotos) son del Cliente. El Proveedor
        los trata solo para prestar el Servicio, según la sección 6 y la <a href="/legal/privacidad">Política de privacidad</a>.
      </p>
      <ul>
        <li>El Cliente puede exportar sus datos en cualquier momento mientras la cuenta esté activa.</li>
        <li>
          Al terminar el contrato, el Cliente tiene 30 días para pedir una exportación completa. Pasado ese plazo, el Proveedor
          elimina los datos de sus sistemas y, en un máximo de 90 días adicionales, de sus copias de respaldo, salvo lo que la
          ley obligue a conservar.
        </li>
      </ul>

      <h2>6. Encargo de tratamiento de datos personales</h2>
      <p>
        Respecto de los datos personales de los clientes del taller, el Cliente es el responsable del tratamiento y el
        Proveedor actúa como encargado del tratamiento, conforme a la Ley Orgánica de Protección de Datos Personales del
        Ecuador (LOPDP). En esa condición, el Proveedor se obliga a:
      </p>
      <ul>
        <li>Tratar los datos solo siguiendo las instrucciones del Cliente y para prestar el Servicio.</li>
        <li>Guardar confidencialidad y exigirla a su personal y a sus subencargados.</li>
        <li>
          Aplicar medidas de seguridad técnicas y organizativas: cifrado en tránsito (HTTPS), contraseñas cifradas, separación
          estricta de los datos de cada taller, registro de auditoría de cambios, fotos privadas con enlaces que vencen y
          copias de respaldo diarias.
        </li>
        <li>Ayudar al Cliente a atender los pedidos de acceso, rectificación, eliminación, oposición y portabilidad de los titulares.</li>
        <li>
          Notificar al Cliente sin dilación cualquier vulneración de seguridad que afecte sus datos, con la información
          necesaria para que el Cliente cumpla sus propias obligaciones de notificación ante la autoridad y los titulares.
        </li>
        <li>Usar solo los subencargados indicados en la Política de privacidad, y avisar antes de agregar uno nuevo.</li>
      </ul>
      <p>
        El Cliente declara que tiene una base legal para registrar los datos de sus clientes (por ejemplo, la ejecución del
        servicio de reparación) y que obtiene su consentimiento cuando hace falta, en particular para enviarles mensajes o
        recordatorios.
      </p>

      <h2>7. Disponibilidad y respaldos</h2>
      <p>
        El Proveedor procura que el Servicio esté disponible de forma continua, salvo mantenimientos programados, que se
        avisarán con anticipación cuando sea posible. Se hacen copias de respaldo diarias de la base de datos, guardadas fuera
        del servidor principal.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        El software, la marca y el diseño del Servicio son del Proveedor. El Cliente recibe una licencia de uso no exclusiva e
        intransferible mientras su contrato esté vigente.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        El Servicio es una herramienta de gestión: las decisiones técnicas, comerciales y tributarias del taller son del
        Cliente. El Servicio no reemplaza la facturación electrónica autorizada por el SRI ni la contabilidad formal del
        taller. En la medida que permita la ley, la responsabilidad total del Proveedor se limita al monto pagado por el
        Cliente en los 12 meses anteriores al hecho que la origina. Esta limitación no aplica a daños causados con dolo o
        culpa grave.
      </p>

      <h2>10. Cambios a estos términos</h2>
      <p>
        Si estos términos cambian, se avisará dentro del Servicio y se pedirá aceptar la nueva versión antes de seguir
        usándolo.
      </p>

      <h2>11. Ley aplicable y controversias</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Ecuador. Las partes intentarán resolver cualquier
        controversia de buena fe; si no lo logran, se someterán a mediación y, de no haber acuerdo, a los jueces competentes de
        {" "}
        {e.ciudadJurisdiccion}.
      </p>
    </>
  );
}
