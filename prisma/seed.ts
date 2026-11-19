import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Completar con los productos reales
const PRODUCTS = [
  {
    sku: "LIB-001",
    name: "Lapicera BIC azul y negra",
    description: "Azul 1 y negro 2 comun",
    price: 1200,
    stock: 800,
    minStock: 50,
    category: "librería",
  },
  {
    sku: "BAZ-001",
    name: "Taza para regalo",
    description: "edicion para regalos",
    price: 3000,
    stock: 50,
    minStock: 2,
    category: "bazar",
  },
  {
    sku: "LIB-002",
    name: "Bloc A4 Triunfante",
    description: "Cuadriculados 1, rayados 2",
    price: 4000,
    stock: 200,
    minStock: 10,
    category: "librería",
  },
  {
    sku: "LIB-003",
    name: "Lápiz BIC",
    description: "Azul 1 y negro 2 comun",
    price: 600,
    stock: 500,
    minStock: 50,
    category: "librería",
  },
  {
    sku: "LIB-004",
    name: "Corrector SDX",
    description: "comun",
    price: 2000,
    stock: 100,
    minStock: 5,
    category: "librería",
  },
  {
    sku: "BAZ-002",
    name: "Jarrón de vidrio",
    description: "comun",
    price: 5000,
    stock: 20,
    minStock: 2,
    category: "bazar",
  },
];

// Productos de prueba que hay que ocultar (no se borran: los pedidos viejos los usan)
const TEST_SKUS = ["CUA-A4-001", "LAP-AZ-001"];

async function main() {
  await prisma.product.updateMany({
    where: { sku: { in: TEST_SKUS } },
    data: { active: false },
  });

  for (const p of PRODUCTS) {
    let categoryId: string | null = null;
    if (p.category) {
      const existing = await prisma.category.findFirst({ where: { name: p.category } });
      categoryId = existing
        ? existing.id
        : (await prisma.category.create({ data: { name: p.category } })).id;
    }

    // Si el sku ya existe, actualiza nombre, precio y descripción.
    // No toca el stock: el stock cambia con las ventas, no con el seed.
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        minStock: p.minStock,
        categoryId,
        active: true,
      },
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        minStock: p.minStock,
        categoryId,
        active: true,
      },
    });
  }

  console.log(`Listo: ${PRODUCTS.length} productos cargados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());




  