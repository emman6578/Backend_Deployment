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
exports.salesInventoryProducts = exports.read_Inventory_Items = exports.inventoryMovementUPDATE = exports.inventoryMovementCREATE = exports.inventoryMovementREAD = exports.lowStockProducts = exports.expiredProducts = exports.restore = exports.remove = exports.update = exports.readInventoryToUpdate = exports.readById = exports.read = exports.create = void 0;
const client_1 = require("@prisma/client");
const read_service_1 = require("@services/inventory.movement.services/read.service");
const create_service_1 = require("@services/inventory.services/create.service");
const expired_products_service_1 = require("@services/inventory.services/expired-products.service");
const low_stock_service_1 = require("@services/inventory.services/low-stock.service");
const read_service_2 = require("@services/inventory.services/read.service");
const read_by_id_service_1 = require("@services/inventory.services/read_by_id.service");
const update_service_1 = require("@services/inventory.services/update.service");
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma = new client_1.PrismaClient();
// CREATE Inventory
exports.create = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const batches = yield (0, create_service_1.inventory_create)(req.body, req.user.id);
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) {
        for (const batch of batches) {
            yield prisma.activityLog.create({
                data: {
                    userId: req.user.id,
                    model: "InventoryBatch",
                    recordId: batch.id,
                    action: client_1.ActionType.CREATE,
                    description: `Created inventory batch #${batch.batchNumber} (ID ${batch.id})`,
                    ipAddress: req.ip,
                    userAgent: req.headers["user-agent"] || null,
                },
            });
        }
    }
    (0, SuccessHandler_1.successHandler)(batches, res, "POST", `Successfully created ${batches.length} inventory batch(es) with their items`);
}));
// READ Inventorys (with pagination, filtering)
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
    // New filter inputs
    const sortField = req.query.sortField; // e.g., "invoice date"
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc"; // default to desc
    const status = req.query.status;
    const { inventories, pagination, summary } = yield (0, read_service_2.inventory_list)(page, limit, search, sortField, sortOrder, status);
    (0, SuccessHandler_1.successHandler)({ inventories, pagination, summary }, res, "GET", "Inventorys fetched successfully");
}));
// READ Single Inventory by ID
exports.readById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: idParam } = req.params;
    const { page = "1", limit = "10", search = "", sortField = "createdAt", sortOrder = "desc", } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const searchQuery = search;
    const sortFieldParam = sortField;
    const sortOrderParam = sortOrder;
    const result = yield (0, read_by_id_service_1.inventory_by_id)(parseInt(idParam), pageNumber, limitNumber, searchQuery, sortFieldParam, sortOrderParam);
    (0, SuccessHandler_1.successHandler)(result, res, "GET", "Inventory fetched successfully");
}));
//Getting Info for Inventorys to be updated
exports.readInventoryToUpdate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: idParam } = req.params;
    (0, SuccessHandler_1.successHandler)("Read Inventory to update by id", res, "GET", "Inventory fetched successfully");
}));
// UPDATE Inventory
exports.update = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const batchId = parseInt(id);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!batchId || isNaN(batchId)) {
        throw new Error("Invalid batch ID provided");
    }
    if (!userId) {
        throw new Error("User authentication required");
    }
    const updateData = Object.assign(Object.assign({}, req.body), { updatedById: userId });
    // Proceed with update if validation passes
    const result = yield (0, update_service_1.inventory_update)(batchId, updateData, userId.toString());
    (0, SuccessHandler_1.successHandler)(result, res, "UPDATE", "Inventory batch updated successfully");
}));
// DELETE Inventory (Soft delete - set isActive to false)
//TODO: Add Activity log
exports.remove = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    (0, SuccessHandler_1.successHandler)("soft delete inventory", res, "DELETE", "Inventory deactivated successfully");
}));
// RESTORE Inventory (Reactivate soft-deleted Inventory)
//TODO: Add Activity log
exports.restore = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    (0, SuccessHandler_1.successHandler)("restore inventory", res, "PUT", "Inventory restored successfully");
}));
//=====================================END OF CRUD==================================================================================================================================================================
exports.expiredProducts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new Error("User not found");
    }
    // Parse pagination & search params
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const itemsPerPage = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = ((_b = req.query.search) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    // Call service function
    const result = yield (0, expired_products_service_1.expired_products_list)({
        page,
        itemsPerPage,
        search,
        userId,
    });
    // Send back response
    (0, SuccessHandler_1.successHandler)(result, res, "GET", "Inventory expired products fetched successfully with loss analysis");
}));
exports.lowStockProducts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract and parse query parameters
        const search = (req.query.search || "").toLowerCase();
        const sortField = req.query.sortField || "currentQuantity";
        const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "10", 10);
        // Call service function
        const responseData = yield (0, low_stock_service_1.low_stock_products_list)(page, limit, search, sortField, sortOrder);
        // Send successful response
        (0, SuccessHandler_1.successHandler)(responseData, res, "GET", "Inventory low-stock (non-expired) products fetched successfully");
    }
    catch (error) {
        throw new Error(error.message || error);
    }
}));
//===================================================================================================================================================================================================
//INVENTORY MOVEMENT CONTROLLER
exports.inventoryMovementREAD = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract and parse query parameters
        const { search = "", sortField = "createdAt", sortOrder = "desc", page = "1", limit = "10", movementType, dateFrom, dateTo, } = req.query;
        // Parse pagination parameters
        const currentPage = Math.max(1, parseInt(page));
        const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
        // Call service function
        const responseData = yield (0, read_service_1.inventory_movement_list)(currentPage, itemsPerPage, search, sortField, sortOrder, movementType, dateFrom, dateTo);
        // Send successful response
        (0, SuccessHandler_1.successHandler)(responseData, res, "GET", "READ Inventory Movement successfully");
    }
    catch (error) {
        throw new Error(error.message || error);
    }
}));
exports.inventoryMovementCREATE = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Create", res, "POST", "Create Inventory Movement successfully");
}));
exports.inventoryMovementUPDATE = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("UPDATE", res, "GET", "UPDATE Inventory Movement successfully");
}));
//INVENTORY ITEMS FETCH FUNCTION
exports.read_Inventory_Items = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const whereClause = search
        ? {
            OR: [
                {
                    product: {
                        generic: {
                            name: {
                                contains: search,
                            },
                        },
                    },
                },
                {
                    product: {
                        brand: {
                            name: {
                                contains: search,
                            },
                        },
                    },
                },
            ],
        }
        : {};
    const items = yield prisma.inventoryItem.findMany({
        where: Object.assign(Object.assign({}, whereClause), { status: "ACTIVE" }),
        orderBy: {
            createdAt: "desc", // Changed to desc to show newest items first
        },
        select: {
            id: true,
            currentQuantity: true,
            retailPrice: true,
            batch: { select: { batchNumber: true, expiryDate: true } },
            product: {
                select: {
                    generic: {
                        select: {
                            name: true,
                        },
                    },
                    brand: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });
    (0, SuccessHandler_1.successHandler)(items, res, "GET", "Reading all the items from the inventory");
}));
// export const inventoryMovementDELETE = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     successHandler(
//       "DELETE",
//       res,
//       "GET",
//       "DELETE Inventory Movement successfully"
//     );
//   }
// );
//==========================================For Zyre MS Controller===========================================================================================
exports.salesInventoryProducts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const salesInventory = yield prisma.inventoryBatch.findMany({
        select: {
            batchNumber: true,
            expiryDate: true,
            items: {
                select: {
                    retailPrice: true,
                    product: {
                        select: {
                            generic: {
                                select: {
                                    name: true,
                                },
                            },
                            brand: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    // Transform the data to a cleaner format
    const cleanedData = salesInventory.flatMap((batch) => batch.items.map((item) => ({
        genericName: item.product.generic.name,
        brandName: item.product.brand.name,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        retailPrice: item.retailPrice,
    })));
    (0, SuccessHandler_1.successHandler)(cleanedData, res, "GET", "Inventory sales items stock products fetched successfully");
}));
