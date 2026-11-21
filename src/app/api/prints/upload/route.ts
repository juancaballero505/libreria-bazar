import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { calcularPrecioImpresion, Paper } from "@/lib/print";

const MAX_BYTES = 5 * 1024 * 1024;
const CARPETA = path.join(process.cwd(), "storage", "prints");

type Tipo = "pdf" | "jpg" | "png";

// Mira los primeros bytes, no el nombre del archivo, para saber qué es de verdad
function detectarTipo(bytes: Buffer): Tipo | null {
  if (bytes.subarray(0, 4).toString("ascii") === "%PDF") return "pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "png";
  return null;
}

// POST /api/prints/upload
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 5 MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const tipo = detectarTipo(bytes);
  if (!tipo) {
    return NextResponse.json({ error: "Solo se aceptan PDF, JPG o PNG" }, { status: 400 });
  }

  const paper = (form.get("paper") ?? "a4") as Paper;
  if (paper !== "a4" && paper !== "foto") {
    return NextResponse.json({ error: "Tipo de papel inválido" }, { status: 400 });
  }
  const copies = Number(form.get("copies") ?? 1);
  const duplex = form.get("duplex") === "true";
  const color = form.get("color") === "true" || paper === "foto";

  // Imágenes: una página. PDF: se cuentan las páginas reales
  let pages = 1;
  if (tipo === "pdf") {
    try {
      const doc = await PDFDocument.load(bytes);
      pages = doc.getPageCount();
    } catch {
      return NextResponse.json(
        { error: "No se pudo leer el PDF (puede estar protegido con contraseña)" },
        { status: 400 }
      );
    }
  }

  let price: number;
  try {
    price = calcularPrecioImpresion({ pages, copies, color, duplex, paper });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Opciones inválidas" },
      { status: 400 }
    );
  }

  // El archivo queda fuera de la carpeta pública: solo el admin puede verlo
  const nombreGuardado = `${randomUUID()}.${tipo}`;
  await mkdir(CARPETA, { recursive: true });
  await writeFile(path.join(CARPETA, nombreGuardado), bytes);

  const job = await prisma.printJob.create({
    data: {
      originalName: file.name,
      storagePath: nombreGuardado,
      pages,
      copies,
      color,
      duplex,
      paper,
      price,
    },
  });

  return NextResponse.json(
    { id: job.id, pages, copies, color, duplex, paper, price },
    { status: 201 }
  );
}

