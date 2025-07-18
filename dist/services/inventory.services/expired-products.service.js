"use strict";
// import { PrismaClient, Prisma } from "@prisma/client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expired_products_list = void 0;
// const prisma = new PrismaClient();
// interface ExpiredProductsParams {
//   page: number;
//   itemsPerPage: number;
//   search: string;
//   userId: number;
// }
// interface ExpiredProductsResult {
//   expired: any[];
//   pagination: {
//     currentPage: number;
//     totalPages: number;
//     totalItems: number;
//     itemsPerPage: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
//   };
//   analysis: {
//     totalCostLoss: number;
//     totalPotentialRevenueLoss: number;
//     totalExpiredQuantity: number;
//     totalExpiredBatches: number;
//     averageCostLossPerBatch: number;
//     averagePotentialRevenueLossPerBatch: number;
//     profitLoss: number;
//   };
// }
// export const expired_products_list = async (
//   params: ExpiredProductsParams
// ): Promise<ExpiredProductsResult> => {
//   const { page, itemsPerPage, search } = params;
//   const today = new Date();
//   // Build dynamic `where` filter
//   const where: Prisma.InventoryBatchWhereInput = {
//     expiryDate: { lt: today, not: undefined },
//     // only add OR search if user provided a non-empty `search`
//     ...(search && {
//       OR: [{ batchNumber: { contains: search } }],
//     }),
//   };
//   // Run both count and paginated query in a transaction
//   const [totalItems, expired] = await prisma.$transaction([
//     prisma.inventoryBatch.count({ where }),
//     prisma.inventoryBatch.findMany({
//       where,
//       skip: (page - 1) * itemsPerPage,
//       take: itemsPerPage,
//       include: {
//         supplier: { select: { id: true, name: true } },
//         district: { select: { id: true, name: true } },
//         items: {
//           select: {
//             id: true,
//             product: {
//               select: {
//                 id: true,
//                 generic: { select: { name: true } },
//                 brand: { select: { name: true } },
//                 company: { select: { name: true } },
//               },
//             },
//             lastUpdateReason: true,
//             costPrice: true,
//             retailPrice: true,
//             currentQuantity: true,
//           },
//         },
//       },
//     }),
//   ]);
//   // Create transaction records for expired products
//   const transactionPromises = expired.flatMap((batch) =>
//     batch.items
//       .map((item) => {
//         if (item.currentQuantity > 0) {
//           return prisma.productTransaction.create({
//             data: {
//               referenceNumber: batch.referenceNumber,
//               productId: item.product.id,
//               transactionType: "EXPIRED",
//               quantityOut: item.currentQuantity,
//               costPrice: item.costPrice,
//               retailPrice: item.retailPrice,
//               userId: params.userId,
//               sourceModel: "InventoryItem",
//               sourceId: item.id,
//               description: `Product expired from batch ${batch.batchNumber} - ${item.product.generic.name} (${item.product.brand.name})`,
//             },
//           });
//         }
//         return null;
//       })
//       .filter(Boolean)
//   );
//   // Execute all transaction creations
//   await Promise.all(transactionPromises);
//   // Update inventory batch status to EXPIRED
//   await prisma.inventoryBatch.updateMany({
//     where: {
//       id: { in: expired.map((batch) => batch.id) },
//     },
//     data: {
//       status: "EXPIRED",
//     },
//   });
//   // Calculate pagination metadata
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const pagination = {
//     currentPage: page,
//     totalPages,
//     totalItems,
//     itemsPerPage,
//     hasNextPage: page < totalPages,
//     hasPreviousPage: page > 1,
//   };
//   // Calculate financial loss analysis for ALL expired products (not just paginated)
//   const allExpiredProducts = await prisma.inventoryBatch.findMany({
//     where,
//     include: {
//       items: {
//         select: {
//           costPrice: true,
//           retailPrice: true,
//           currentQuantity: true,
//         },
//       },
//     },
//   });
//   const analysis = allExpiredProducts.reduce(
//     (acc, batch) => {
//       batch.items.forEach((item) => {
//         const quantity = item.currentQuantity || 0;
//         const costPrice = item.costPrice || 0;
//         const retailPrice = item.retailPrice || 0;
//         // Calculate losses
//         const costLoss = Number(quantity) * Number(costPrice);
//         const potentialRevenueLoss = Number(quantity) * Number(retailPrice);
//         acc.totalCostLoss += costLoss;
//         acc.totalPotentialRevenueLoss += potentialRevenueLoss;
//         acc.totalExpiredQuantity += quantity;
//         acc.totalExpiredBatches += 1;
//       });
//       return acc;
//     },
//     {
//       totalCostLoss: 0,
//       totalPotentialRevenueLoss: 0,
//       totalExpiredQuantity: 0,
//       totalExpiredBatches: 0,
//     }
//   );
//   // Add additional calculated metrics
//   const finalAnalysis = {
//     ...analysis,
//     averageCostLossPerBatch:
//       analysis.totalExpiredBatches > 0
//         ? analysis.totalCostLoss / analysis.totalExpiredBatches
//         : 0,
//     averagePotentialRevenueLossPerBatch:
//       analysis.totalExpiredBatches > 0
//         ? analysis.totalPotentialRevenueLoss / analysis.totalExpiredBatches
//         : 0,
//     profitLoss: analysis.totalPotentialRevenueLoss - analysis.totalCostLoss,
//   };
//   return {
//     expired,
//     pagination,
//     analysis: finalAnalysis,
//   };
// };
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const expired_products_list = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, itemsPerPage, search } = params;
    const today = new Date();
    // Build dynamic `where` filter
    const where = Object.assign({ expiryDate: { lt: today, not: undefined } }, (search && {
        OR: [{ batchNumber: { contains: search } }],
    }));
    // Run both count and paginated query in a transaction
    const [totalItems, expired] = yield prisma.$transaction([
        prisma.inventoryBatch.count({ where }),
        prisma.inventoryBatch.findMany({
            where,
            skip: (page - 1) * itemsPerPage,
            take: itemsPerPage,
            include: {
                supplier: { select: { id: true, name: true } },
                district: { select: { id: true, name: true } },
                items: {
                    select: {
                        id: true,
                        product: {
                            select: {
                                id: true,
                                generic: { select: { name: true } },
                                brand: { select: { name: true } },
                                company: { select: { name: true } },
                                categories: { select: { name: true } },
                            },
                        },
                        lastUpdateReason: true,
                        costPrice: true,
                        retailPrice: true,
                        currentQuantity: true,
                    },
                },
            },
        }),
    ]);
    // Check for existing transactions to avoid duplicates
    const existingTransactions = yield prisma.productTransaction.findMany({
        where: {
            transactionType: "EXPIRED",
            sourceModel: "InventoryItem",
            sourceId: {
                in: expired.flatMap((batch) => batch.items.map((item) => item.id)),
            },
        },
        select: {
            sourceId: true,
        },
    });
    const existingTransactionSourceIds = new Set(existingTransactions.map((t) => t.sourceId));
    // Create transaction records only for items that don't already have expired transactions
    const transactionPromises = expired.flatMap((batch) => batch.items
        .map((item) => {
        // Only create transaction if:
        // 1. Item has quantity > 0
        // 2. No existing expired transaction for this inventory item
        if (item.currentQuantity > 0 &&
            !existingTransactionSourceIds.has(item.id)) {
            return prisma.productTransaction.create({
                data: {
                    referenceNumber: batch.referenceNumber,
                    productId: item.product.id,
                    transactionType: "EXPIRED",
                    quantityOut: item.currentQuantity,
                    costPrice: item.costPrice,
                    retailPrice: item.retailPrice,
                    userId: params.userId,
                    sourceModel: "InventoryItem",
                    sourceId: item.id,
                    description: `Product expired from batch ${batch.batchNumber} - ${item.product.generic.name} (${item.product.brand.name})`,
                },
            });
        }
        return null;
    })
        .filter(Boolean));
    // Execute all transaction creations
    yield Promise.all(transactionPromises);
    // Filter out batches that are already expired to avoid unnecessary updates
    const batchesToUpdate = expired.filter((batch) => batch.status !== "EXPIRED");
    // Update inventory batch status to EXPIRED only for batches that aren't already expired
    if (batchesToUpdate.length > 0) {
        yield prisma.inventoryBatch.updateMany({
            where: {
                id: { in: batchesToUpdate.map((batch) => batch.id) },
            },
            data: {
                status: "EXPIRED",
            },
        });
    }
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
    // Calculate financial loss analysis for ALL expired products (not just paginated)
    const allExpiredProducts = yield prisma.inventoryBatch.findMany({
        where,
        include: {
            items: {
                select: {
                    costPrice: true,
                    retailPrice: true,
                    currentQuantity: true,
                },
            },
        },
    });
    const analysis = allExpiredProducts.reduce((acc, batch) => {
        batch.items.forEach((item) => {
            const quantity = item.currentQuantity || 0;
            const costPrice = item.costPrice || 0;
            const retailPrice = item.retailPrice || 0;
            // Calculate losses
            const costLoss = Number(quantity) * Number(costPrice);
            const potentialRevenueLoss = Number(quantity) * Number(retailPrice);
            acc.totalCostLoss += costLoss;
            acc.totalPotentialRevenueLoss += potentialRevenueLoss;
            acc.totalExpiredQuantity += quantity;
            acc.totalExpiredBatches += 1;
        });
        return acc;
    }, {
        totalCostLoss: 0,
        totalPotentialRevenueLoss: 0,
        totalExpiredQuantity: 0,
        totalExpiredBatches: 0,
    });
    // Add additional calculated metrics
    const finalAnalysis = Object.assign(Object.assign({}, analysis), { averageCostLossPerBatch: analysis.totalExpiredBatches > 0
            ? analysis.totalCostLoss / analysis.totalExpiredBatches
            : 0, averagePotentialRevenueLossPerBatch: analysis.totalExpiredBatches > 0
            ? analysis.totalPotentialRevenueLoss / analysis.totalExpiredBatches
            : 0, profitLoss: analysis.totalPotentialRevenueLoss - analysis.totalCostLoss });
    return {
        expired,
        pagination,
        analysis: finalAnalysis,
    };
});
exports.expired_products_list = expired_products_list;
