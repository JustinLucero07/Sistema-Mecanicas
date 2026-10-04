import Link from "next/link";
import { EMPRESA, FECHA_TERMINOS, VERSION_TERMINOS } from "@/lib/empresa";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-xl font-semibold">
            {EMPRESA.nombreComercial}
          </Link>
          <nav className="flex gap-5 text-[0.93rem] font-semibold text-ink-2">
            <Link href="/legal/terminos" className="hover:text-ink">
              Términos
            </Link>
            <Link href="/legal/privacidad" className="hover:text-ink">
              Privacidad
            </Link>
          </nav>
        </div>
      </header>

      {!EMPRESA.legalRevisado && (
        <div className="bg-warn-soft px-5 py-3 text-center text-[0.93rem] font-medium text-warn">
          Borrador pendiente de revisión legal. No lo publiques hasta que un abogado lo revise y completes los datos entre corchetes.
        </div>
      )}

      <article className="legal mx-auto max-w-3xl px-5 py-10">
        {children}
        <p className="mt-12 border-t border-line pt-5 text-[0.87rem] text-ink-3">
          Versión {VERSION_TERMINOS}, vigente desde el {FECHA_TERMINOS}. Consultas: {EMPRESA.correoSoporte}.
        </p>
      </article>
    </div>
  );
}
