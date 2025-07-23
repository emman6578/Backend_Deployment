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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create_update_payment = exports.read_SalesReturn = exports.createSalesReturn = exports.read = exports.create = void 0;
const client_1 = require("@prisma/client");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const read_service_1 = require("@services/sales.services/read.service");
const create_bulk_service_1 = require("@services/sales.services/create_bulk.service");
const create_sales_return_service_1 = require("@services/sales.services/create_sales_return.service");
const prisma = new client_1.PrismaClient();
exports.create = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const result = yield (0, create_bulk_service_1.createSale)(req.body, {
        userId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
    });
    (0, SuccessHandler_1.successHandler)(result, res, "POST", "Sale created successfully");
}));
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responseData = yield (0, read_service_1.getSalesData)(req.query);
        (0, SuccessHandler_1.successHandler)(responseData, res, "GET", "Sales fetched successfully");
    }
    catch (error) {
        console.error("Error fetching sales:", error);
        throw new Error("Failed to fetch sales data");
    }
}));
exports.createSalesReturn = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { originalSaleId, returnQuantity, returnReason, notes, restockable = true, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (typeof userId !== "number") {
        throw new Error("User not authenticated");
    }
    try {
        const result = yield (0, create_sales_return_service_1.createSalesReturnService)({
            originalSaleId,
            returnQuantity,
            returnReason,
            notes,
            restockable,
            userId,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });
        (0, SuccessHandler_1.successHandler)(result, res, "POST", "Sales Return Created Successfully");
    }
    catch (error) {
        throw new Error(error); // Let expressAsyncHandler handle the error
    }
}));
exports.read_SalesReturn = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search = "", sortField = "createdAt", sortOrder = "desc", status, dateFrom, dateTo, processedById, approvedById, returnReason, restockable, } = req.query;
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Build search conditions for searchable fields
    const searchConditions = search
        ? {
            OR: [
                { transactionID: { contains: search } }, // ← was referenceNumber
                { returnReason: { contains: search } },
                { notes: { contains: search } },
                {
                    originalSale: {
                        OR: [
                            { transactionID: { contains: search } }, // ← was referenceNumber
                            { genericName: { contains: search } },
                            { brandName: { contains: search } },
                            { companyName: { contains: search } },
                            { customerName: { contains: search } },
                            { batchNumber: { contains: search } },
                            { supplierName: { contains: search } },
                        ],
                    },
                },
            ],
        }
        : {};
    // Build filter conditions
    const filterConditions = {};
    // Status filter
    if (status) {
        filterConditions.status = status;
    }
    // Date range filter
    if (dateFrom || dateTo) {
        filterConditions.returnDate = {};
        if (dateFrom) {
            filterConditions.returnDate.gte = new Date(dateFrom);
        }
        if (dateTo) {
            filterConditions.returnDate.lte = new Date(dateTo);
        }
    }
    // User filters
    if (processedById) {
        filterConditions.processedById = parseInt(processedById, 10);
    }
    if (approvedById) {
        filterConditions.approvedById = parseInt(approvedById, 10);
    }
    // Return reason filter
    if (returnReason) {
        filterConditions.returnReason = {
            contains: returnReason,
        };
    }
    // Restockable filter
    if (restockable !== undefined) {
        filterConditions.restockable = restockable === "true";
    }
    // Combine all conditions
    const whereConditions = Object.assign(Object.assign({}, searchConditions), filterConditions);
    // Build sort conditions
    const orderBy = {};
    if (sortField === "createdAt" ||
        sortField === "updatedAt" ||
        sortField === "returnDate") {
        orderBy[sortField] = sortOrder;
    }
    else if (sortField === "referenceNumber" ||
        sortField === "returnReason" ||
        sortField === "status") {
        orderBy[sortField] = sortOrder;
    }
    else if (sortField === "returnQuantity" ||
        sortField === "returnPrice" ||
        sortField === "refundAmount") {
        orderBy[sortField] = sortOrder;
    }
    else {
        // Default sort
        orderBy.createdAt = "desc";
    }
    try {
        // Get total count for pagination
        const totalItems = yield prisma.salesReturn.count({
            where: Object.assign(Object.assign({}, searchConditions), filterConditions),
        });
        // Fetch paginated results with relations
        const salesReturns = yield prisma.salesReturn.findMany({
            where: whereConditions,
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
                                        district: true,
                                    },
                                },
                            },
                        },
                        customer: true,
                        psr: true,
                        district: true,
                    },
                },
                processedBy: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    },
                },
                approvedBy: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limitNum,
        });
        // Calculate pagination metadata
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPreviousPage = pageNum > 1;
        const summaryStats = yield prisma.salesReturn.aggregate({
            where: Object.assign(Object.assign({}, searchConditions), filterConditions),
            _sum: {
                refundAmount: true,
                returnQuantity: true,
            },
            _count: {
                id: true,
            },
        });
        // Get status-specific counts
        const statusCounts = yield prisma.salesReturn.groupBy({
            by: ["status"],
            where: Object.assign(Object.assign({}, searchConditions), filterConditions),
            _count: {
                id: true,
            },
        });
        // Get restockable items count
        const restockableCount = yield prisma.salesReturn.count({
            where: Object.assign(Object.assign(Object.assign({}, searchConditions), filterConditions), { restockable: true }),
        });
        // Process status counts into a more usable format
        const statusMap = statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
        }, {});
        // Create summary object
        const summary = {
            totalReturns: summaryStats._count.id || 0,
            totalRefunds: summaryStats._sum.refundAmount || 0,
            pendingReturns: statusMap["PENDING"] || 0,
            restockableItems: restockableCount || 0,
            completedReturns: (statusMap["APPROVED"] || 0) + (statusMap["COMPLETED"] || 0),
        };
        const response = {
            data: salesReturns,
            summary,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                itemsPerPage: limitNum,
                hasNextPage,
                hasPreviousPage,
            },
            filters: {
                search: search || null,
                status: status || null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
                processedById: processedById || null,
                approvedById: approvedById || null,
                returnReason: returnReason || null,
                restockable: restockable || null,
            },
            sort: {
                field: sortField,
                order: sortOrder,
            },
        };
        (0, SuccessHandler_1.successHandler)(response, res, "GET", "Sales Returns fetched successfully");
    }
    catch (error) {
        console.error("Error fetching sales returns:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching sales returns",
        });
    }
}));
exports.create_update_payment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Create Update Payment", res, "POST", "Payment Updated Successfully");
}));
// export const update = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Updated Sales", res, "PUT", "Sales updated successfully");
//   }
// );
// // DELETE Sales (Soft delete - set isActive to false)
// export const remove = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Sales Deleted Successfully",
//       res,
//       "DELETE",
//       "Sales deactivated successfully"
//     );
//   }
// );
// // RESTORE Sales (Reactivate soft-deleted Sales)
// export const restore = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Sales Restored Successfully",
//       res,
//       "PUT",
//       "Sales restored successfully"
//     );
//   }
// );
