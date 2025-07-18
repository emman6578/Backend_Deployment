import { PrismaClient } from "@prisma/client";
import { generateRefNumber } from "@utils/reference number/generateRefNumber";

const prisma = new PrismaClient();

export interface CreateSalesReturnRequest {
  originalSaleId: number;
  returnQuantity: number;
  returnPrice: number;
  returnReason: string;
  notes?: string;
  restockable?: boolean;
}

export interface CreateSalesReturnParams {
  originalSaleId: number;
  returnQuantity: number;
  returnReason: string;
  notes?: string;
  restockable?: boolean;
  userId: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SalesReturnResult {
  salesReturn: {
    id: number;
    referenceNumber: string;
    originalSale: {
      referenceNumber: string;
      productName: string;
      batchNumber: string;
    };
    returnQuantity: number;
    returnPrice: number;
    returnReason: string;
    status: string;
    restockable: boolean;
    processedBy: string;
    createdAt: Date;
  };
}

export const createSalesReturnService = async (
  params: CreateSalesReturnParams
): Promise<SalesReturnResult> => {
  const {
    originalSaleId,
    returnQuantity,
    returnReason,
    notes,
    restockable = true,
    userId,
    ipAddress,
    userAgent,
  } = params;

  // Validation (unchanged)
  if (!userId) {
    throw new Error("User authentication required");
  }

  if (!originalSaleId || !returnQuantity || !returnReason) {
    throw new Error(
      "Original sale ID, return quantity, and return reason are required"
    );
  }

  if (returnQuantity <= 0) {
    throw new Error("Return quantity must be greater than 0");
  }

  // Get original sale with all necessary details
  const originalSale = await prisma.sales.findUnique({
    where: { id: originalSaleId },
    include: {
      returns: {
        where: {
          status: {
            in: ["PENDING", "APPROVED", "PROCESSED"],
          },
        },
      },
      inventoryItem: true,
    },
  });

  if (!originalSale) {
    throw new Error("Original sale not found");
  }

  if (originalSale.status !== "ACTIVE") {
    throw new Error("Cannot create return for inactive sale");
  }

  // Calculate total quantity already returned
  const totalReturnedQuantity = originalSale.returns.reduce(
    (sum, returnItem) => sum + returnItem.returnQuantity,
    0
  );

  // Check if return quantity exceeds available quantity
  const availableQuantity = originalSale.quantity - totalReturnedQuantity;
  if (returnQuantity > availableQuantity) {
    throw new Error(
      `Return quantity (${returnQuantity}) exceeds available quantity (${availableQuantity})`
    );
  }

  // Calculate return price and refund amount
  const returnPrice = originalSale.unitFinalPrice; // Use the final price from the sale
  const refundAmount =
    returnQuantity *
    (typeof returnPrice === "number" ? returnPrice : returnPrice.toNumber()); // Calculate refund automatically

  // Generate unique reference number
  const referenceNumber = await generateRefNumber(prisma, 6, "SR");

  // Create the sales return (updated with automatic price/refund)
  const salesReturn = await prisma.salesReturn.create({
    data: {
      transactionID: referenceNumber,
      originalSaleId,
      returnQuantity,
      returnPrice, // Now using the sale's unitFinalPrice
      returnReason,
      notes,
      refundAmount, // Now automatically calculated
      restockable,
      processedById: userId,
      status: "PENDING",
    },
    include: {
      originalSale: {
        include: {
          inventoryItem: {
            include: {
              product: {
                include: {
                  generic: true,
                  brand: true,
                  company: true,
                },
              },
              batch: {
                include: {
                  supplier: true,
                },
              },
            },
          },
          customer: true,
          psr: true,
        },
      },
      processedBy: {
        select: {
          id: true,
          fullname: true,
          email: true,
        },
      },
    },
  });

  // Update the original sale status if partially returned
  if (totalReturnedQuantity + returnQuantity < originalSale.quantity) {
    await prisma.sales.update({
      where: { id: originalSaleId },
      data: {
        status: "PARTIALLY_RETURNED",
        updatedBy: { connect: { id: userId } },
      },
    });
  } else if (totalReturnedQuantity + returnQuantity === originalSale.quantity) {
    await prisma.sales.update({
      where: { id: originalSaleId },
      data: {
        status: "RETURNED",
        updatedBy: { connect: { id: userId } },
      },
    });
  }

  // Log the activity
  await prisma.activityLog.create({
    data: {
      userId,
      model: "SalesReturn",
      recordId: salesReturn.id,
      action: "CREATE",
      description: `Created sales return ${referenceNumber} for sale ${originalSale.transactionID}`,
      ipAddress,
      userAgent,
    },
  });

  // Create product transaction for tracking
  await prisma.productTransaction.create({
    data: {
      referenceNumber,
      productId: originalSale.productId,
      transactionType: "SALES_RETURN",
      quantityIn: returnQuantity, // Returning items back to inventory
      costPrice: originalSale.unitCostPrice,
      retailPrice: originalSale.unitRetailPrice,
      userId,
      sourceModel: "SalesReturn",
      sourceId: salesReturn.id,
      description: `Sales return: ${returnReason}`,
    },
  });

  // If restockable, create inventory movement to add back to stock
  if (restockable) {
    await prisma.inventoryMovement.create({
      data: {
        inventoryItemId: originalSale.inventoryItemId,
        movementType: "RETURN",
        quantity: returnQuantity,
        reason: `Sales return: ${returnReason}`,
        referenceId: referenceNumber,
        createdById: userId,
        previousQuantity: originalSale.inventoryItem.currentQuantity,
        newQuantity:
          originalSale.inventoryItem.currentQuantity + returnQuantity,
        ipAddress,
        userAgent,
      },
    });

    // Update inventory item quantity
    await prisma.inventoryItem.update({
      where: { id: originalSale.inventoryItemId },
      data: {
        currentQuantity: {
          increment: returnQuantity,
        },
        updatedBy: { connect: { id: userId } },
        lastUpdateReason: `Sales return: ${returnReason}`,
      },
    });
  }

  // Return the formatted result
  return {
    salesReturn: {
      id: salesReturn.id,
      referenceNumber: salesReturn.transactionID,
      originalSale: {
        referenceNumber: salesReturn.originalSale.transactionID,
        productName: `${salesReturn.originalSale.genericName} ${salesReturn.originalSale.brandName}`,
        batchNumber: salesReturn.originalSale.batchNumber,
      },
      returnQuantity: salesReturn.returnQuantity,
      returnPrice: salesReturn.returnPrice.toNumber(),
      returnReason: salesReturn.returnReason,
      status: salesReturn.status,
      restockable: salesReturn.restockable,
      processedBy: salesReturn.processedBy.fullname,
      createdAt: salesReturn.createdAt,
    },
  };
};
