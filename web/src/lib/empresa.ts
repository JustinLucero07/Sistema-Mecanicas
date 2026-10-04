/**
 * Datos del proveedor del servicio (quien vende MecánicaOS). Se configuran
 * con variables de entorno para no tocar los textos legales.
 */
export const EMPRESA = {
  nombreComercial: process.env.NEXT_PUBLIC_EMPRESA_NOMBRE || "MecánicaOS",
  razonSocial: process.env.NEXT_PUBLIC_EMPRESA_RAZON_SOCIAL || "[RAZÓN SOCIAL DEL PROVEEDOR]",
  ruc: process.env.NEXT_PUBLIC_EMPRESA_RUC || "[RUC]",
  direccion: process.env.NEXT_PUBLIC_EMPRESA_DIRECCION || "[DIRECCIÓN, CIUDAD], Ecuador",
  correoSoporte: process.env.NEXT_PUBLIC_EMPRESA_CORREO || "[soporte@tudominio.com]",
  correoPrivacidad: process.env.NEXT_PUBLIC_EMPRESA_CORREO_PRIVACIDAD || "[privacidad@tudominio.com]",
  ciudadJurisdiccion: process.env.NEXT_PUBLIC_EMPRESA_CIUDAD || "[CIUDAD]",
  proveedorHosting: process.env.NEXT_PUBLIC_EMPRESA_HOSTING || "[PROVEEDOR DEL SERVIDOR Y PAÍS]",
  /** Debe ponerse en "1" solo después de que un abogado revise los textos. */
  legalRevisado: process.env.NEXT_PUBLIC_LEGAL_REVISADO === "1",
};

/** Debe coincidir con TERMINOS_VERSION del backend. */
export const VERSION_TERMINOS = "2026-10";
export const FECHA_TERMINOS = "4 de octubre de 2026";
