"""La base de datos debe coincidir con el código: una instalación nueva
(solo migraciones) tiene que aceptar todo lo que la aplicación escribe."""

from sqlalchemy import Enum, text

import app.models  # noqa: F401
from app.database import Base, engine


def test_todos_los_valores_enumerados_existen_en_la_base():
    with engine.connect() as cx:
        en_base = {
            nombre: set(valores.split(","))
            for nombre, valores in cx.execute(
                text("SELECT t.typname, string_agg(e.enumlabel, ',') FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid GROUP BY t.typname")
            )
        }
    faltantes = {
        col.type.name: sorted(set(col.type.enums) - en_base.get(col.type.name, set()))
        for tabla in Base.metadata.tables.values()
        for col in tabla.columns
        if isinstance(col.type, Enum) and set(col.type.enums) - en_base.get(col.type.name, set())
    }
    assert not faltantes, f"Falta una migración para estos valores: {faltantes}"


def test_ninguna_tabla_asigna_taller_por_defecto():
    with engine.connect() as cx:
        con_defecto = cx.execute(
            text("SELECT table_name FROM information_schema.columns WHERE column_name = 'organizacion_id' AND column_default IS NOT NULL")
        ).scalars().all()
    assert not con_defecto, f"organizacion_id no debe tener valor por defecto: {con_defecto}"
