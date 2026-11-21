export type Paper = "a4" | "foto";

export type PrintOptions = {
  pages: number;
  copies: number;
  color: boolean;
  duplex: boolean;
  paper: Paper;
};

export const PRECIOS = {
  bnSimple: 100,
  bnDoble: 150,
  color: 200,
  foto: 300,
} as const;

// Se calcula en el servidor. Nunca se confía en un precio que mande el cliente
export function calcularPrecioImpresion(o: PrintOptions): number {
  if (!Number.isInteger(o.pages) || o.pages < 1) throw new Error("Cantidad de páginas inválida");
  if (!Number.isInteger(o.copies) || o.copies < 1) throw new Error("Cantidad de copias inválida");

  if (o.paper === "foto") {
    if (o.duplex) throw new Error("El papel foto solo se imprime a simple faz");
    return o.pages * o.copies * PRECIOS.foto;
  }

  if (o.color) {
    if (o.duplex) throw new Error("El color solo se imprime a simple faz");
    return o.pages * o.copies * PRECIOS.color;
  }

  if (o.duplex) {
    // Se cobra por hoja física: un PDF impar cuenta la última hoja completa
    return Math.ceil(o.pages / 2) * o.copies * PRECIOS.bnDoble;
  }

  return o.pages * o.copies * PRECIOS.bnSimple;
}