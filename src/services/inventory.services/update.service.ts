import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const inventory_update = async (
  batchId: number,
  updateData: UpdateInventoryBatchRequest,
  userId: string
): Promise<UpdatedInventoryBatch> => {
  try {
    // Check if batch exists
    const existingBatch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: {
        items: true,
        supplier: true,
        district: true,
      },
    });

    if (!existingBatch) {
      throw new Error(`Inventory batch with ID ${batchId} not found`);
    }

    // Validate supplier exists if provided
    if (updateData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: updateData.supplierId, isActive: true },
      });
      if (!supplier) {
        throw new Error(
          `Supplier with ID ${updateData.supplierId} not found or inactive`
        );
      }
    }

    // Validate district exists if provided
    if (updateData.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: updateData.districtId, isActive: true },
      });
      if (!district) {
        throw new Error(
          `District with ID ${updateData.districtId} not found or inactive`
        );
      }
    }

    // Validate batch number uniqueness if it's being changed
    if (
      updateData.batchNumber &&
      updateData.batchNumber !== existingBatch.batchNumber
    ) {
      const supplierId = updateData.supplierId || existingBatch.supplierId;
      const duplicateBatch = await prisma.inventoryBatch.findFirst({
        where: {
          supplierId,
          batchNumber: updateData.batchNumber,
          id: { not: batchId },
        },
      });
      if (duplicateBatch) {
        throw new Error(
          `Batch number ${updateData.batchNumber} already exists for this supplier`
        );
      }
    }

    // Start transaction for batch and items update
    const result = await prisma.$transaction(async (tx) => {
      // Prepare batch update data
      const batchUpdateData: any = {};

      // Basic batch information
      if (updateData.batchNumber)
        batchUpdateData.batchNumber = updateData.batchNumber;
      if (updateData.supplierId)
        batchUpdateData.supplierId = updateData.supplierId;
      if (updateData.districtId)
        batchUpdateData.districtId = updateData.districtId;

      // Document information
      if (updateData.dt !== undefined) batchUpdateData.dt = updateData.dt;
      if (updateData.invoiceNumber !== undefined)
        batchUpdateData.invoiceNumber = updateData.invoiceNumber;

      // Dates
      if (updateData.invoiceDate)
        batchUpdateData.invoiceDate = new Date(updateData.invoiceDate);
      if (updateData.expiryDate)
        batchUpdateData.expiryDate = new Date(updateData.expiryDate);
      if (updateData.manufacturingDate !== undefined) {
        batchUpdateData.manufacturingDate = updateData.manufacturingDate
          ? new Date(updateData.manufacturingDate)
          : null;
      }

      // Status and accountability
      if (updateData.status) batchUpdateData.status = updateData.status;
      if (updateData.receivedBy !== undefined)
        batchUpdateData.receivedBy = updateData.receivedBy;
      if (updateData.verifiedBy !== undefined)
        batchUpdateData.verifiedBy = updateData.verifiedBy;
      if (updateData.verificationDate !== undefined) {
        batchUpdateData.verificationDate = updateData.verificationDate
          ? new Date(updateData.verificationDate)
          : null;
      }

      // User accountability - use direct field approach
      batchUpdateData.updatedById = updateData.updatedById;
      batchUpdateData.updatedAt = new Date();

      // Update the batch
      const updatedBatch = await tx.inventoryBatch.update({
        where: { id: batchId },
        data: batchUpdateData,
        include: {
          supplier: true,
          district: true,
          createdBy: { select: { id: true, fullname: true, email: true } },
          updatedBy: { select: { id: true, fullname: true, email: true } },
        },
      });

      // Update items if provided
      const updatedItems = [];
      if (updateData.items && updateData.items.length > 0) {
        for (const itemData of updateData.items) {
          // Validate product exists if provided
          if (itemData.productId) {
            const product = await tx.product.findUnique({
              where: { id: itemData.productId, isActive: true },
            });
            if (!product) {
              throw new Error(
                `Product with ID ${itemData.productId} not found or inactive`
              );
            }
          }

          // Check if item exists in this batch
          const existingItem = await tx.inventoryItem.findFirst({
            where: {
              id: itemData.id,
              batchId: batchId,
            },
            include: {
              product: {
                include: {
                  generic: { select: { name: true } },
                  brand: { select: { name: true } },
                },
              },
            },
          });

          if (!existingItem) {
            throw new Error(
              `Inventory item with ID ${itemData.id} not found in this batch`
            );
          }

          // Validate quantity constraints
          if (itemData.currentQuantity !== undefined) {
            if (itemData.currentQuantity < 0) {
              throw new Error("Current quantity cannot be negative");
            }
            if (
              itemData.currentQuantity >
              (itemData.initialQuantity || existingItem.initialQuantity)
            ) {
              throw new Error(
                "Current quantity cannot exceed initial quantity"
              );
            }
          }

          // Validate pricing
          if (itemData.costPrice !== undefined && itemData.costPrice < 0) {
            throw new Error("Cost price cannot be negative");
          }
          if (itemData.retailPrice !== undefined && itemData.retailPrice < 0) {
            throw new Error("Retail price cannot be negative");
          }

          // Validate retailPrice >= costPrice
          const newCostPrice =
            itemData.costPrice !== undefined
              ? itemData.costPrice
              : existingItem.costPrice.toNumber();

          const newRetailPrice =
            itemData.retailPrice !== undefined
              ? itemData.retailPrice
              : existingItem.retailPrice.toNumber();

          if (newRetailPrice < newCostPrice) {
            throw new Error("Retail price cannot be less than cost price");
          }

          // Prepare item update data
          const itemUpdateData: any = {};

          // Product reference
          if (itemData.productId) itemUpdateData.productId = itemData.productId;

          // Quantities
          if (itemData.initialQuantity !== undefined)
            itemUpdateData.initialQuantity = itemData.initialQuantity;
          if (itemData.currentQuantity !== undefined)
            itemUpdateData.currentQuantity = itemData.currentQuantity;

          // Pricing
          if (itemData.costPrice !== undefined)
            itemUpdateData.costPrice = itemData.costPrice;
          if (itemData.retailPrice !== undefined)
            itemUpdateData.retailPrice = itemData.retailPrice;

          // Status and tracking
          if (itemData.status) itemUpdateData.status = itemData.status;
          if (itemData.lastUpdateReason !== undefined)
            itemUpdateData.lastUpdateReason = itemData.lastUpdateReason;

          // User accountability - use direct field approach
          itemUpdateData.updatedById = updateData.updatedById;
          itemUpdateData.updatedAt = new Date();

          const updatedItem = await tx.inventoryItem.update({
            where: { id: itemData.id },
            data: itemUpdateData,
            include: {
              product: {
                include: {
                  generic: true,
                  brand: true,
                  company: true,
                },
              },
              createdBy: { select: { id: true, fullname: true, email: true } },
              updatedBy: { select: { id: true, fullname: true, email: true } },
            },
          });

          updatedItems.push(updatedItem);

          // Create inventory movement record for quantity changes
          if (
            itemData.currentQuantity !== undefined &&
            itemData.currentQuantity !== existingItem.currentQuantity
          ) {
            const quantityDifference =
              itemData.currentQuantity - existingItem.currentQuantity;
            await tx.inventoryMovement.create({
              data: {
                inventoryItemId: existingItem.id,
                movementType: quantityDifference > 0 ? "INBOUND" : "ADJUSTMENT",
                quantity: quantityDifference,
                reason:
                  itemData.lastUpdateReason || "Inventory update adjustment",
                previousQuantity: existingItem.currentQuantity,
                newQuantity: itemData.currentQuantity,
                createdById: updateData.updatedById,
                referenceId: existingBatch.referenceNumber,
              },
            });

            await tx.productTransaction.create({
              data: {
                referenceNumber: existingBatch.referenceNumber,
                productId: existingItem.productId,
                transactionType: "INVENTORY_ADJUSTMENT",
                userId: parseInt(userId), // Should be updateData.updatedById
                sourceModel: "InventoryItem", // Remove space
                sourceId: existingItem.id,
                description: `Inventory adjustment - Batch: ${existingBatch.batchNumber}, Product: ${existingItem.product.generic.name} ${existingItem.product.brand.name}`,
                // Fix the quantity logic - track the actual change
                quantityIn:
                  quantityDifference > 0 ? quantityDifference : undefined,
                quantityOut:
                  quantityDifference < 0
                    ? Math.abs(quantityDifference)
                    : undefined,
                costPrice: itemData.costPrice ?? existingItem.costPrice,
                retailPrice: itemData.retailPrice ?? existingItem.retailPrice,
              },
            });

            const product = await tx.product.findUnique({
              where: { id: existingItem.productId },
              select: {
                id: true,
                safetyStock: true,
                generic: { select: { name: true } },
                brand: { select: { name: true } },
              },
            });

            if (product && itemData.currentQuantity < product.safetyStock) {
              // Create LOW_STOCK transaction
              await tx.productTransaction.create({
                data: {
                  referenceNumber: existingBatch.referenceNumber,
                  productId: existingItem.productId,
                  transactionType: "LOW_STOCK",
                  userId: parseInt(userId),
                  sourceModel: "InventoryItem",
                  sourceId: existingItem.id,
                  description: `Low stock alert - Batch: ${existingBatch.batchNumber}, Product: ${product.generic.name} ${product.brand.name}, Current Stock: ${itemData.currentQuantity}, Safety Stock: ${product.safetyStock}`,
                  quantityIn: undefined,
                  quantityOut: undefined,
                  costPrice: itemData.costPrice ?? existingItem.costPrice,
                  retailPrice: itemData.retailPrice ?? existingItem.retailPrice,
                },
              });

              // Optional: Log the low stock event in activity log
              await tx.activityLog.create({
                data: {
                  userId: updateData.updatedById,
                  model: "Product",
                  recordId: product.id,
                  action: "UPDATE",
                  description: `Low stock alert triggered for ${product.generic.name} ${product.brand.name} - Current: ${itemData.currentQuantity}, Safety: ${product.safetyStock}`,
                },
              });
            }
          }

          // Create inventory price change history for price changes
          const priceChanged =
            (itemData.costPrice !== undefined &&
              itemData.costPrice !== existingItem.costPrice.toNumber()) ||
            (itemData.retailPrice !== undefined &&
              itemData.retailPrice !== existingItem.retailPrice.toNumber());

          if (priceChanged) {
            // Get the product to update its average prices
            const product = await tx.product.findUnique({
              where: { id: existingItem.productId },
              include: {
                inventoryItems: {
                  where: { status: "ACTIVE" },
                },
              },
            });

            if (product) {
              // Create price change history record
              await tx.inventoryPriceChangeHistory.create({
                data: {
                  inventoryItemId: existingItem.id,
                  previousCostPrice: existingItem.costPrice,
                  previousRetailPrice: existingItem.retailPrice,
                  averageCostPrice:
                    itemData.costPrice ?? existingItem.costPrice,
                  averageRetailPrice:
                    itemData.retailPrice ?? existingItem.retailPrice,
                  createdById: updateData.updatedById,
                  reason:
                    itemData.lastUpdateReason || "Inventory item price update",
                },
              });

              await tx.productTransaction.create({
                data: {
                  referenceNumber: existingBatch.referenceNumber,
                  productId: existingItem.productId,
                  transactionType: "PRICE_UPDATE_INVENTORY",
                  userId: parseInt(userId),
                  sourceModel: "InventoryItem",
                  sourceId: existingItem.id,
                  description: `Inventory price update - Batch: ${
                    existingBatch.batchNumber
                  }, Product: ${existingItem.product.generic.name} ${
                    existingItem.product.brand.name
                  }${
                    itemData.costPrice !== undefined &&
                    itemData.costPrice !== existingItem.costPrice.toNumber()
                      ? `, Cost: ₱${existingItem.costPrice.toNumber()} → ₱${
                          itemData.costPrice
                        }`
                      : ""
                  }${
                    itemData.retailPrice !== undefined &&
                    itemData.retailPrice !== existingItem.retailPrice.toNumber()
                      ? `, Retail: ₱${existingItem.retailPrice.toNumber()} → ₱${
                          itemData.retailPrice
                        }`
                      : ""
                  }`,
                  quantityIn: undefined,
                  quantityOut: undefined,
                  costPrice: itemData.costPrice ?? existingItem.costPrice,
                  retailPrice: itemData.retailPrice ?? existingItem.retailPrice,
                },
              });
            }
          }
        }
      }

      // Log the batch update activity
      await tx.activityLog.create({
        data: {
          userId: updateData.updatedById,
          model: "InventoryBatch",
          recordId: batchId,
          action: "UPDATE",
          description: `Updated inventory batch ${updatedBatch.batchNumber} with ${updatedItems.length} items modified`,
        },
      });

      // Log individual item updates
      for (const item of updatedItems) {
        await tx.activityLog.create({
          data: {
            userId: updateData.updatedById,
            model: "InventoryItem",
            recordId: item.id,
            action: "UPDATE",
            description: `Updated inventory item for product ${item.product.generic.name} ${item.product.brand.name} in batch ${updatedBatch.batchNumber}`,
          },
        });
      }

      for (const itemData of updateData.items || []) {
        const original = await tx.inventoryItem.findFirst({
          where: { id: itemData.id, batchId },
          include: { batch: { select: { referenceNumber: true } } },
        });
        if (
          itemData.currentQuantity !== undefined &&
          original &&
          itemData.currentQuantity !== original.currentQuantity
        ) {
          const qtyDiff = itemData.currentQuantity - original.currentQuantity;
          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: original.id,
              movementType: qtyDiff > 0 ? "INBOUND" : "ADJUSTMENT",
              quantity: qtyDiff,
              reason: itemData.lastUpdateReason || "Batch update adjustment",
              previousQuantity: original.currentQuantity,
              newQuantity: itemData.currentQuantity,
              createdById: updateData.updatedById,
              referenceId: original.batch.referenceNumber,
            },
          });
        }
      }

      return {
        batch: updatedBatch,
        items: updatedItems,
      };
    });

    return {
      success: true,
      data: result,
      message: `Inventory batch updated successfully with ${result.items.length} items modified`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update inventory batch: ${error.message}`);
    }
    throw new Error(
      "An unexpected error occurred while updating inventory batch"
    );
  } finally {
    await prisma.$disconnect();
  }
};

// ============================================
// TYPES (Add these to your inventory.types.ts)
// ============================================

export interface UpdateInventoryItemRequest {
  id: number;
  productId?: number;
  initialQuantity?: number;
  currentQuantity?: number;
  costPrice?: number;
  retailPrice?: number;
  status?: "ACTIVE" | "EXPIRED" | "DAMAGED" | "RECALLED" | "SOLD_OUT";
  lastUpdateReason?: string;
}

export interface UpdateInventoryBatchRequest {
  // Batch information
  batchNumber?: string;
  supplierId?: number;
  districtId?: number;

  // Document information
  dt?: string;
  invoiceNumber?: string;

  // Dates
  invoiceDate?: string;
  expiryDate?: string;
  manufacturingDate?: string;

  // Status and accountability
  status?: "ACTIVE" | "EXPIRED" | "DAMAGED" | "RECALLED" | "SOLD_OUT";
  receivedBy?: string;
  verifiedBy?: string;
  verificationDate?: string;

  // Items to update
  items?: UpdateInventoryItemRequest[];

  // User accountability (set by controller)
  updatedById: number;
}

export interface UpdatedInventoryBatch {
  success: boolean;
  data: {
    batch: any; // The updated batch with relations
    items: any[]; // The updated items with relations
  };
  message: string;
}
