require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const inventoryData = {
  "FECHADO": [
    { name: "Absolut vodka 1L", qty: 2 },
    { name: "Absolut vodka 750ml", qty: 1 },
    { name: "Água de coco", qty: 5 },
    { name: "Água s/ gás", qty: 84 },
    { name: "Água tônica Schweppes", qty: 12 },
    { name: "Aperol", qty: 7 },
    { name: "Ballena", qty: 1 },
    { name: "Bocrorny bananinha", qty: 2 },
    { name: "Campari", qty: 2 },
    { name: "Cointreau", qty: 2 },
    { name: "Fanta guaraná zero", qty: 12 },
    { name: "Gin Gordons", qty: 3 },
    { name: "Sake hakushika", qty: 1 },
    { name: "Senor Weber rum", qty: 1 },
    { name: "Sprite zero", qty: 6 }
  ],
  "BAR DA FRENTE": [
    { name: "Absolut", qty: 1 },
    { name: "Água com gás", qty: 30 },
    { name: "Água sem gás", qty: 30 },
    { name: "Alkermes", qty: 3 },
    { name: "Alma Negra", qty: 4 },
    { name: "Altosur malbec", qty: 6 },
    { name: "Aperol", qty: 0.5 },
    { name: "Balena", qty: 1 },
    { name: "Bananinha", qty: 2 },
    { name: "Buchanans", qty: 1 },
    { name: "Cabernet sauvignon", qty: 2 },
    { name: "Campari", qty: 2.4 },
    { name: "Coca trad", qty: 34 },
    { name: "Coca zero", qty: 6 },
    { name: "Cointreau", qty: 2 },
    { name: "Cynar", qty: 4 },
    { name: "Estrela Galícia", qty: 12 },
    { name: "Fanta", qty: 10 },
    { name: "Fernet", qty: 1.5 },
    { name: "Gold", qty: 3 },
    { name: "Gordon’s", qty: 6.6 },
    { name: "Jack", qty: 2.5 },
    { name: "Jeager", qty: 2 },
    { name: "Jim beam", qty: 2 },
    { name: "Licor 43", qty: 1 },
    { name: "Limoncelo", qty: 2 },
    { name: "Luxardo", qty: 1.2 },
    { name: "Monster manga", qty: 2 },
    { name: "Monster trad", qty: 5 },
    { name: "Passaporte", qty: 3 },
    { name: "Petirrojo cabernet sauvignon", qty: 6 },
    { name: "Ramazoti", qty: 0 },
    { name: "Smirnoff", qty: 4 },
    { name: "Sol", qty: 12 },
    { name: "Sprite zero", qty: 5 },
    { name: "Suco de uva", qty: 10 },
    { name: "Tequila", qty: 1.5 },
    { name: "Terra Nova brut", qty: 3 },
    { name: "Terrazas malbec", qty: 2 },
    { name: "Tônica trad", qty: 15 },
    { name: "Tônica zero", qty: 8 },
    { name: "Vermute", qty: 4 }
  ],
  "BAR DE TRÁS": [
    { name: "Água com gás", qty: 8 },
    { name: "Água sem gás", qty: 8 },
    { name: "Beleza", qty: 3 },
    { name: "Bernadi brut", qty: 3 },
    { name: "Cerpa", qty: 29 },
    { name: "Chandon brut", qty: 5 },
    { name: "Claudeval (Branco)", qty: 2 },
    { name: "Claudeval (Rosé)", qty: 4 },
    { name: "Coca trad", qty: 18 },
    { name: "Coca zero", qty: 9 },
    { name: "Doce de leite", qty: 1 },
    { name: "Estrela", qty: 15 },
    { name: "Fanta zero", qty: 9 },
    { name: "Garzon pinot", qty: 3 },
    { name: "Guapu brut", qty: 1 },
    { name: "Licor 43", qty: 0.6 },
    { name: "Mango", qty: 5 },
    { name: "Monster trad", qty: 7 },
    { name: "Petirrojo bisquertt blanc", qty: 5 },
    { name: "Redbull pomelo", qty: 6 },
    { name: "Redbull trad", qty: 13 },
    { name: "Redbull zero", qty: 24 },
    { name: "Sol", qty: 33 },
    { name: "Sprite", qty: 12 },
    { name: "Sprite zero", qty: 1 },
    { name: "Tanqueray", qty: 0.6 },
    { name: "Terranova brut", qty: 5 },
    { name: "Tônica", qty: 9 },
    { name: "Tônica zero", qty: 4 },
    { name: "Val da Ucha (Vinho Verde)", qty: 4 },
    { name: "Veuve ambal brut", qty: 6 }
  ]
};

async function main() {
  const establishment = await prisma.establishments.findFirst({
    where: { name: { contains: 'COMMERCIAL', mode: 'insensitive' } }
  });

  if (!establishment) {
    console.log("Establishment 'COMMERCIAL' not found");
    return;
  }
  console.log("Establishment:", establishment.name);

  const products = await prisma.product.findMany({
    where: { establishmentId: establishment.id }
  });
  
  console.log(`Found ${products.length} products.`);

  const fs = require('fs');
  fs.writeFileSync('products.json', JSON.stringify(products.map(p => ({ id: p.id, name: p.name })), null, 2));
  console.log('Saved products to products.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
