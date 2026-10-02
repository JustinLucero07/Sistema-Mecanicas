import 'package:flutter/material.dart';
import 'models/models.dart';
import 'theme.dart';
import 'utils/format.dart';

/// Placa ecuatoriana: identifica a cada vehículo en toda la app.
class PlateBadge extends StatelessWidget {
  final String placa;
  final double scale;
  const PlateBadge(this.placa, {super.key, this.scale = 1});

  @override
  Widget build(BuildContext context) {
    const borde = Color(0xFF1D242B);
    return Semantics(
      label: 'Placa $placa',
      // IntrinsicWidth: la placa mide lo que su texto, no todo el ancho libre.
      child: IntrinsicWidth(
        child: Container(
          constraints: BoxConstraints(minWidth: 96 * scale),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6 * scale),
            border: Border.all(color: borde, width: 2 * scale),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                color: borde,
                padding: EdgeInsets.symmetric(vertical: 1.5 * scale),
                child: Text(
                  'ECUADOR',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 7 * scale,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 2 * scale,
                    height: 1.1,
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(
                  8 * scale,
                  1 * scale,
                  8 * scale,
                  2 * scale,
                ),
                child: Text(
                  placa,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  style: TextStyle(
                    fontFamily: kDisplayFont,
                    color: const Color(0xFF11161B),
                    fontSize: 22 * scale,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2 * scale,
                    height: 1.1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class Etiqueta extends StatelessWidget {
  final String texto;
  final Tono tono;
  const Etiqueta(this.texto, {super.key, this.tono = Tono.neutral});

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final (fondo, color) = switch (tono) {
      Tono.brand => (c.brandSoft, c.brandText),
      Tono.ok => (c.okSoft, c.ok),
      Tono.warn => (c.warnSoft, c.warn),
      Tono.bad => (c.badSoft, c.bad),
      Tono.info => (c.infoSoft, c.info),
      Tono.neutral => (c.raised, c.ink2),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        texto,
        style: TextStyle(
          color: color,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class EtiquetaEstado extends StatelessWidget {
  final String estado;
  const EtiquetaEstado(this.estado, {super.key});

  @override
  Widget build(BuildContext context) {
    final (label, tono) = estadoOrden(estado);
    return Etiqueta(label, tono: tono);
  }
}

class Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Material(
      color: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: c.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class Aviso extends StatelessWidget {
  final String texto;
  final Tono tono;
  const Aviso(this.texto, {super.key, this.tono = Tono.bad});

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final (fondo, color) = switch (tono) {
      Tono.warn => (c.warnSoft, c.warn),
      Tono.ok => (c.okSoft, c.ok),
      _ => (c.badSoft, c.bad),
    };
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        texto,
        style: TextStyle(
          color: color,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class Vacio extends StatelessWidget {
  final IconData icono;
  final String titulo;
  final String? descripcion;
  final Widget? accion;
  const Vacio({
    super.key,
    required this.icono,
    required this.titulo,
    this.descripcion,
    this.accion,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: c.raised,
            child: Icon(icono, color: c.ink3),
          ),
          const SizedBox(height: 14),
          Text(
            titulo,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          if (descripcion != null) ...[
            const SizedBox(height: 4),
            Text(
              descripcion!,
              textAlign: TextAlign.center,
              style: TextStyle(color: c.ink3, fontSize: 15),
            ),
          ],
          if (accion != null) ...[const SizedBox(height: 18), accion!],
        ],
      ),
    );
  }
}

class Dato extends StatelessWidget {
  final String label;
  final String valor;
  const Dato(this.label, this.valor, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: context.c.ink3, fontSize: 13)),
        const SizedBox(height: 2),
        Text(
          valor,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

/// Fila de una orden en las listas del taller.
class OrdenTile extends StatelessWidget {
  final OrdenTrabajo orden;
  final VoidCallback onTap;
  const OrdenTile({super.key, required this.orden, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PlateBadge(orden.vehiculo?.placa ?? '—', scale: 0.8),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      orden.vehiculo?.nombre ?? 'Vehículo',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      orden.nombreCliente,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: c.ink3, fontSize: 14),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: c.ink3),
            ],
          ),
          if ((orden.motivoIngreso ?? '').isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              orden.motivoIngreso!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: c.ink2, fontSize: 15),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              EtiquetaEstado(orden.estado),
              Text(
                '${orden.mecanicoNombre ?? "Sin mecánico"} · ${diasEnTaller(orden.fechaIngreso)}',
                style: TextStyle(color: c.ink3, fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
