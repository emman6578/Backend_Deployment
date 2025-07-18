"use strict";
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
exports.readByid = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const readByid = (productId_1, ...args_1) => __awaiter(void 0, [productId_1, ...args_1], void 0, function* (productId, page = 1, limit = 10) {
    if (!productId || isNaN(productId)) {
        throw new Error("Valid product ID is required");
    }
    // Validate pagination parameters
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, Math.min(100, limit)); // Max 100 items per page
    const skip = (pageNumber - 1) * limitNumber;
    // Get basic product information (without transactions first)
    const product = yield prisma.product.findUnique({
        where: { id: productId },
        include: {
            generic: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            company: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
            createdBy: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: { select: { name: true } },
                },
            },
            updatedBy: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: { select: { name: true } },
                },
            },
        },
    });
    if (!product) {
        return null;
    }
    // Get transactions with pagination
    const [transactions, totalTransactions] = yield Promise.all([
        prisma.productTransaction.findMany({
            where: { productId: productId },
            include: {
                user: { select: { id: true, fullname: true } },
            },
            skip: (page - 1) * limit, // Fix: Calculate skip properly
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.productTransaction.count({
            where: { productId: productId },
        }),
    ]);
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    // Combine product data with paginated transactions
    const productWithPaginatedTransactions = Object.assign(Object.assign({}, product), { transactions: {
            data: transactions,
            pagination: {
                currentPage: pageNumber,
                totalPages: totalPages,
                totalItems: totalTransactions,
                itemsPerPage: limitNumber,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage,
            },
        } });
    return productWithPaginatedTransactions;
});
exports.readByid = readByid;
