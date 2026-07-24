require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const inventoryMapping = [
  // FECHADO -> 'estoque fechado'
  { loc: 'estoque fechado', id: 'bcfe0d82-3e31-4788-bff3-b773626ce6a6', qty: 2 }, // Absolut vodka 1L
  { loc: 'estoque fechado', id: 'd390cadd-d992-4640-bc0a-618a6de5cd86', qty: 1 }, // Absolut vodka 750ml
  { loc: 'estoque fechado', id: '9ce6b9c6-a8ef-43b3-a2df-c81b8eddb33d', qty: 5 }, // Água de coco
  { loc: 'estoque fechado', id: '56f0262f-4cbf-4ae1-ad68-77bdb6070eb1', qty: 84 }, // Água s/ gás
  { loc: 'estoque fechado', id: 'f64d6289-ebdf-4512-94a2-608fd08fc0b2', qty: 12 }, // Água tônica Schweppes
  { loc: 'estoque fechado', id: '32741c81-9e3b-4d43-ba20-59d4d88c8c8d', qty: 7 }, // Aperol
  { loc: 'estoque fechado', id: 'cd840f16-d15e-45bc-b33b-35081367fb85', qty: 1 }, // Ballena
  { loc: 'estoque fechado', id: 'd4cd72ef-626a-4e78-bad8-d109202e1e01', qty: 2 }, // Bocrorny bananinha
  { loc: 'estoque fechado', id: '2bd6a07e-c54f-4428-810f-f333082b8141', qty: 2 }, // Campari
  { loc: 'estoque fechado', id: '141c7a74-7012-4991-ac6c-276e1a4f9c0b', qty: 2 }, // Cointreau
  { loc: 'estoque fechado', id: '187d9f8b-824a-4095-8f2f-dde72edbcb32', qty: 12 }, // Fanta guaraná zero
  { loc: 'estoque fechado', id: '655816c6-95fc-4bdd-bfde-357b90b22c45', qty: 3 }, // Gin Gordons
  { loc: 'estoque fechado', id: 'e7b62a40-8427-474d-a8c9-984db8455667', qty: 1 }, // Sake hakushika
  { loc: 'estoque fechado', id: 'ca61c744-61e1-4657-b913-a9688a394869', qty: 1 }, // Senor Weber rum
  { loc: 'estoque fechado', id: 'b4c3dd28-6592-444c-8ba0-fdf45d714dff', qty: 6 }, // Sprite zero

  // BAR DA FRENTE -> 'bar da frente'
  { loc: 'bar da frente', id: 'bcfe0d82-3e31-4788-bff3-b773626ce6a6', qty: 1 }, // Absolut
  { loc: 'bar da frente', id: '2e0a2697-2fdd-4840-b133-d809c40e8f38', qty: 30 }, // Água com gás
  { loc: 'bar da frente', id: '56f0262f-4cbf-4ae1-ad68-77bdb6070eb1', qty: 30 }, // Água sem gás
  { loc: 'bar da frente', id: 'd1eb9113-a211-48d5-bb18-e89a2b8b0eff', qty: 3 }, // Alkermes
  { loc: 'bar da frente', id: '19e33756-db52-42e4-98f8-39002fc1a500', qty: 4 }, // Alma Negra
  { loc: 'bar da frente', id: '9ef3f14c-18da-4d4f-bcf4-75315320c689', qty: 6 }, // Altosur malbec
  { loc: 'bar da frente', id: '32741c81-9e3b-4d43-ba20-59d4d88c8c8d', qty: 0.5 }, // Aperol
  { loc: 'bar da frente', id: 'cd840f16-d15e-45bc-b33b-35081367fb85', qty: 1 }, // Balena
  { loc: 'bar da frente', id: 'd4cd72ef-626a-4e78-bad8-d109202e1e01', qty: 2 }, // Bananinha
  { loc: 'bar da frente', id: '94802fa7-ffdf-4552-9229-008c84f192df', qty: 1 }, // Buchanans
  { loc: 'bar da frente', id: '5c9e9e24-2f0e-410c-bcaf-76ad0eeeec26', qty: 2 }, // Cabernet sauvignon
  { loc: 'bar da frente', id: '2bd6a07e-c54f-4428-810f-f333082b8141', qty: 2.4 }, // Campari
  { loc: 'bar da frente', id: 'd7715f4f-58fb-4b0e-8cdf-9ff1c98eacb3', qty: 34 }, // Coca trad
  { loc: 'bar da frente', id: '3010830c-1490-4303-adab-f614aa985d5d', qty: 6 }, // Coca zero
  { loc: 'bar da frente', id: '141c7a74-7012-4991-ac6c-276e1a4f9c0b', qty: 2 }, // Cointreau
  { loc: 'bar da frente', id: 'e579fc3d-3f81-4ccc-9475-8e90caf09120', qty: 4 }, // Cynar
  { loc: 'bar da frente', id: '41112953-e8e1-4046-8bdc-e602cb43563b', qty: 12 }, // Estrela Galícia
  { loc: 'bar da frente', id: '187d9f8b-824a-4095-8f2f-dde72edbcb32', qty: 10 }, // Fanta
  { loc: 'bar da frente', id: '5656d31e-e075-4ec3-8dde-470db6b7ccb1', qty: 1.5 }, // Fernet
  { loc: 'bar da frente', id: 'db8d47df-f3a0-48d4-a250-672cb3ba8c08', qty: 3 }, // Gold (Tequila reposado)
  { loc: 'bar da frente', id: '655816c6-95fc-4bdd-bfde-357b90b22c45', qty: 6.6 }, // Gordon’s
  { loc: 'bar da frente', id: 'c7b2a929-2f07-42a2-adf9-897d551dcf54', qty: 2.5 }, // Jack
  { loc: 'bar da frente', id: '5033a5c8-a992-4c21-9c79-10167e5f862d', qty: 2 }, // Jeager
  { loc: 'bar da frente', id: '5bf41adf-a2eb-487a-a2d3-a362b58d5563', qty: 2 }, // Jim beam
  { loc: 'bar da frente', id: '29e2ce4d-4329-4b4c-be1b-7dbca285d4d0', qty: 1 }, // Licor 43
  { loc: 'bar da frente', id: '43620ae2-8118-4202-8585-317b2c84baaf', qty: 2 }, // Limoncelo
  { loc: 'bar da frente', id: '29876006-4327-428b-b10e-d493042f46b7', qty: 1.2 }, // Luxardo
  { loc: 'bar da frente', id: 'ac25b4ac-6573-4ddb-844f-94630b92b815', qty: 2 }, // Monster manga
  { loc: 'bar da frente', id: '760a207d-9817-4364-a945-6d92b7651b5e', qty: 5 }, // Monster trad
  { loc: 'bar da frente', id: '7f22984a-72fa-40e1-9ae0-062a4bada8d3', qty: 3 }, // Passaporte
  { loc: 'bar da frente', id: '5c9e9e24-2f0e-410c-bcaf-76ad0eeeec26', qty: 6 }, // Petirrojo cabernet sauvignon
  { loc: 'bar da frente', id: '275c1666-3c81-4f68-9227-178a8133e36e', qty: 0 }, // Ramazoti
  { loc: 'bar da frente', id: '03cc6ffc-c9c6-4ce3-a8f7-29f480990011', qty: 4 }, // Smirnoff
  { loc: 'bar da frente', id: '27a9b7d0-39d8-4aca-ab94-053681a8e395', qty: 12 }, // Sol
  { loc: 'bar da frente', id: 'b4c3dd28-6592-444c-8ba0-fdf45d714dff', qty: 5 }, // Sprite zero
  { loc: 'bar da frente', id: '4bbc5f82-842d-446c-9db3-bdf296e8f30c', qty: 10 }, // Suco de uva (using suco del vale)
  { loc: 'bar da frente', id: 'db8d47df-f3a0-48d4-a250-672cb3ba8c08', qty: 1.5 }, // Tequila
  { loc: 'bar da frente', id: 'a2345705-efce-44d0-a6f8-724c17153837', qty: 3 }, // Terra Nova brut (moscatel)
  { loc: 'bar da frente', id: 'c9e4a323-f346-4d6a-b7ad-97f9b044fc75', qty: 2 }, // Terrazas malbec
  { loc: 'bar da frente', id: 'f64d6289-ebdf-4512-94a2-608fd08fc0b2', qty: 15 }, // Tônica trad
  { loc: 'bar da frente', id: '1325d3db-9448-4500-ad2d-9e50ce7e4843', qty: 8 }, // Tônica zero
  { loc: 'bar da frente', id: 'db7dd556-02ce-493a-a936-f82e6de8eabf', qty: 4 }, // Vermute

  // BAR DE TRÁS -> 'bar de tras'
  { loc: 'bar de tras', id: '2e0a2697-2fdd-4840-b133-d809c40e8f38', qty: 8 }, // Água com gás
  { loc: 'bar de tras', id: '56f0262f-4cbf-4ae1-ad68-77bdb6070eb1', qty: 8 }, // Água sem gás
  // { loc: 'bar de tras', name: 'Beleza', qty: 3 }, // ignoring for now
  { loc: 'bar de tras', id: '99b49006-d3d1-4738-91c6-1717b97eb2ea', qty: 3 }, // Bernadi brut
  { loc: 'bar de tras', id: '2a6b8dbe-4fc0-4aa4-83af-9669c1c23bd5', qty: 29 }, // Cerpa
  { loc: 'bar de tras', id: '07a0e522-e678-4bce-acfb-cbd2ed6b6e33', qty: 5 }, // Chandon brut
  { loc: 'bar de tras', id: '9a20680c-6bec-4ee6-a0aa-83303afb269a', qty: 2 }, // Claudeval (Branco)
  { loc: 'bar de tras', id: '39751f77-8287-4c39-84e9-cf92eee8f674', qty: 4 }, // Claudeval (Rosé)
  { loc: 'bar de tras', id: 'd7715f4f-58fb-4b0e-8cdf-9ff1c98eacb3', qty: 18 }, // Coca trad
  { loc: 'bar de tras', id: '3010830c-1490-4303-adab-f614aa985d5d', qty: 9 }, // Coca zero
  { loc: 'bar de tras', id: 'a62c90ba-a83f-4202-993a-484236446ca2', qty: 1 }, // Doce de leite
  { loc: 'bar de tras', id: '41112953-e8e1-4046-8bdc-e602cb43563b', qty: 15 }, // Estrela
  { loc: 'bar de tras', id: '187d9f8b-824a-4095-8f2f-dde72edbcb32', qty: 9 }, // Fanta zero
  { loc: 'bar de tras', id: '28b04cfb-2095-491d-8c87-d500aca4b4b7', qty: 3 }, // Garzon pinot
  { loc: 'bar de tras', id: '7d063690-f310-4b64-8052-dfd044cee427', qty: 1 }, // Guapu brut
  { loc: 'bar de tras', id: '29e2ce4d-4329-4b4c-be1b-7dbca285d4d0', qty: 0.6 }, // Licor 43
  { loc: 'bar de tras', id: 'ac25b4ac-6573-4ddb-844f-94630b92b815', qty: 5 }, // Mango
  { loc: 'bar de tras', id: '760a207d-9817-4364-a945-6d92b7651b5e', qty: 7 }, // Monster trad
  { loc: 'bar de tras', id: 'e06f7968-0841-4293-9e54-9bb92b7a152b', qty: 5 }, // Petirrojo bisquertt blanc
  { loc: 'bar de tras', id: 'c9f4d85a-191e-4701-85dd-d56916c20289', qty: 6 }, // Redbull pomelo
  { loc: 'bar de tras', id: 'fc5b8f05-cf0b-4f0d-bd53-e194152c7bb0', qty: 13 }, // Redbull trad
  { loc: 'bar de tras', id: '275e5f23-a00a-4fd7-a649-fbb03277afc4', qty: 24 }, // Redbull zero
  { loc: 'bar de tras', id: '27a9b7d0-39d8-4aca-ab94-053681a8e395', qty: 33 }, // Sol
  { loc: 'bar de tras', id: 'e3beae50-7b26-47db-82d8-5ffad62a33e5', qty: 12 }, // Sprite
  { loc: 'bar de tras', id: 'b4c3dd28-6592-444c-8ba0-fdf45d714dff', qty: 1 }, // Sprite zero
  { loc: 'bar de tras', id: 'de7e83fa-b0bc-4c04-b4ae-760f042f4611', qty: 0.6 }, // Tanqueray
  { loc: 'bar de tras', id: 'a2345705-efce-44d0-a6f8-724c17153837', qty: 5 }, // Terranova brut
  { loc: 'bar de tras', id: 'f64d6289-ebdf-4512-94a2-608fd08fc0b2', qty: 9 }, // Tônica
  { loc: 'bar de tras', id: '1325d3db-9448-4500-ad2d-9e50ce7e4843', qty: 4 }, // Tônica zero
  { loc: 'bar de tras', id: 'de04617c-0e77-4cef-b371-e90d95fe7c88', qty: 4 }, // Val da Ucha (Vinho Verde)
  { loc: 'bar de tras', id: 'f1ec8c95-44bd-44c1-8470-2359dc93cf91', qty: 6 }, // Veuve ambal brut
];

async function main() {
  const establishment = await prisma.establishments.findFirst({
    where: { name: { contains: 'COMMERCIAL', mode: 'insensitive' } }
  });

  if (!establishment) {
    console.log("Establishment 'COMMERCIAL' not found");
    return;
  }

  const locations = await prisma.stockLocation.findMany({
    where: { establishmentId: establishment.id }
  });

  const locationMap = {};
  for (const l of locations) {
    locationMap[l.name.toLowerCase()] = l.id;
  }

  const targetLocations = ['estoque fechado', 'bar da frente', 'bar de tras'];

  console.log("Resetting stock in target locations to 0...");
  for (const locName of targetLocations) {
    const locId = locationMap[locName];
    if (locId) {
      await prisma.productStock.updateMany({
        where: { locationId: locId },
        data: { quantity: 0 }
      });
    }
  }

  console.log("Applying new quantities...");
  for (const item of inventoryMapping) {
    const locId = locationMap[item.loc];
    if (!locId) {
      console.log(`Location ${item.loc} not found!`);
      continue;
    }

    const existingStock = await prisma.productStock.findUnique({
      where: {
        productId_locationId: {
          productId: item.id,
          locationId: locId
        }
      }
    });

    if (existingStock) {
      await prisma.productStock.update({
        where: { id: existingStock.id },
        data: { quantity: item.qty }
      });
    } else {
      await prisma.productStock.create({
        data: {
          productId: item.id,
          locationId: locId,
          quantity: item.qty
        }
      });
    }
  }

  console.log("Recomputing product total quantities...");
  // Now update Product.quantity for all products in establishment based on sum of their ProductStock
  const allProducts = await prisma.product.findMany({
    where: { establishmentId: establishment.id }
  });

  for (const prod of allProducts) {
    const stocks = await prisma.productStock.findMany({
      where: { productId: prod.id }
    });
    const totalQty = stocks.reduce((acc, curr) => acc + parseFloat(curr.quantity), 0);
    
    await prisma.product.update({
      where: { id: prod.id },
      data: { quantity: totalQty }
    });
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
