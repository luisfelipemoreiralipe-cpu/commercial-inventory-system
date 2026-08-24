const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStockLocations = async (req, res) => {
  try {
    const establishmentId = req.user.establishmentId;

    const locations = await prisma.stockLocation.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(locations);
  } catch (error) {
    console.error('Error fetching stock locations:', error);
    res.status(500).json({ error: 'Erro ao buscar locais de estoque' });
  }
};

const createStockLocation = async (req, res) => {
  try {
    const establishmentId = req.user.establishmentId;
    const { name, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome do local é obrigatório' });
    }

    const newLocation = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.stockLocation.updateMany({
          where: { establishmentId },
          data: { isDefault: false },
        });
      }

      return tx.stockLocation.create({
        data: { name, isDefault: isDefault || false, establishmentId },
      });
    });

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating stock location:', error);
    res.status(500).json({ error: 'Erro ao criar local de estoque' });
  }
};

const updateStockLocation = async (req, res) => {
  try {
    const establishmentId = req.user.establishmentId;
    const { id } = req.params;
    const { name, isDefault } = req.body;

    const location = await prisma.stockLocation.findFirst({ where: { id, establishmentId } });
    if (!location) return res.status(404).json({ error: 'Local de estoque não encontrado.' });

    const updatedLocation = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.stockLocation.updateMany({
          where: { establishmentId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.stockLocation.update({
        where: { id },
        data: { name, ...(isDefault !== undefined && { isDefault }) },
      });
    });

    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating stock location:', error);
    res.status(500).json({ error: 'Erro ao atualizar local de estoque' });
  }
};

const deleteStockLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const establishmentId = req.user.establishmentId;

    const location = await prisma.stockLocation.findFirst({ where: { id, establishmentId } });
    if (!location) return res.status(404).json({ error: 'Local de estoque não encontrado.' });

    // Verificar se existe estoque neste local
    const stockCount = await prisma.productStock.count({
      where: { locationId: id, NOT: { quantity: 0 } },
    });

    if (stockCount > 0) {
      return res.status(400).json({ error: 'Não é possível excluir um local que possui produtos com saldo.' });
    }

    if (location.isDefault) {
       return res.status(400).json({ error: 'Não é possível excluir o local padrão.' });
    }

    await prisma.stockLocation.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stock location:', error);
    res.status(500).json({ error: 'Erro ao excluir local de estoque' });
  }
};

const internalTransfer = async (req, res) => {
  try {
    const establishmentId = req.user.establishmentId;
    const { productId, fromLocationId, toLocationId, quantity } = req.body;

    if (!productId || !fromLocationId || !toLocationId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Dados inválidos para transferência.' });
    }

    if (fromLocationId === toLocationId) {
      return res.status(400).json({ error: 'Os locais de origem e destino devem ser diferentes.' });
    }

    await prisma.$transaction(async (tx) => {
      const [product, sourceLocation, destinationLocation] = await Promise.all([
        tx.product.findFirst({ where: { id: productId, establishmentId } }),
        tx.stockLocation.findFirst({ where: { id: fromLocationId, establishmentId } }),
        tx.stockLocation.findFirst({ where: { id: toLocationId, establishmentId } })
      ]);

      if (!product || !sourceLocation || !destinationLocation) {
        throw new Error('Produto ou local de estoque não encontrado neste estabelecimento.');
      }

      // Verifica saldo na origem
      const sourceStock = await tx.productStock.findUnique({
        where: { productId_locationId: { productId, locationId: fromLocationId } }
      });

      if (!sourceStock || Number(sourceStock.quantity) < Number(quantity)) {
        throw new Error('Saldo insuficiente no local de origem.');
      }

      // Desconta da origem
      await tx.productStock.update({
        where: { id: sourceStock.id },
        data: { quantity: { decrement: quantity } }
      });

      // Adiciona no destino
      const destinationStock = await tx.productStock.upsert({
        where: { productId_locationId: { productId, locationId: toLocationId } },
        create: { productId, locationId: toLocationId, quantity: Number(quantity) },
        update: { quantity: { increment: quantity } }
      });

      // Cria log de movimento interno (duplo: saída e entrada, ou apenas log textual, mas aqui faremos um log genérico de ajuste para manter rastreabilidade)
      await tx.stockMovement.create({
        data: {
          productId,
          productName: product.name,
          type: 'TRANSFER',
          quantity,
          previousQuantity: Number(sourceStock.quantity),
          newQuantity: Number(sourceStock.quantity) - quantity,
          reference: `Transferência Interna`,
          reason: 'INTERNAL_TRANSFER',
          establishmentId,
          unitCost: 0,
          totalCost: 0,
          locationId: fromLocationId
        }
      });
      
      await tx.stockMovement.create({
        data: {
          productId,
          productName: product.name,
          type: 'TRANSFER',
          quantity,
          previousQuantity: Number(destinationStock.quantity) - Number(quantity),
          newQuantity: Number(destinationStock.quantity),
          reference: `Transferência Interna (Recebido)`,
          reason: 'INTERNAL_TRANSFER',
          establishmentId,
          unitCost: 0,
          totalCost: 0,
          locationId: toLocationId
        }
      });
    });

    res.json({ message: 'Transferência concluída com sucesso!' });
  } catch (error) {
    console.error('Error in internal transfer:', error);
    res.status(400).json({ error: error.message || 'Erro ao transferir estoque' });
  }
};

module.exports = {
  getStockLocations,
  createStockLocation,
  updateStockLocation,
  deleteStockLocation,
  internalTransfer,
};
