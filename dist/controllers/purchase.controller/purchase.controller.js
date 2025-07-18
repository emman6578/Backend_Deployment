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
exports.verify = exports.restore = exports.remove = exports.update = exports.readById = exports.read_purchaseEditLists = exports.read_purchaseReturnList = exports.read_purchaseToUpdate = exports.read_purchaseToInventory = exports.read = exports.update_status_purchase_return = exports.create_purchase_return = exports.create = void 0;
const client_1 = require("@prisma/client");
const create_purchase_return_service_1 = require("@services/purchase.services/create.purchase.return.service");
const create_service_1 = require("@services/purchase.services/create.service");
const read_service_1 = require("@services/purchase.services/read.service");
const read_purchaseToInventory_service_1 = require("@services/purchase.services/read_purchaseToInventory.service");
const update_service_1 = require("@services/purchase.services/update.service");
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const puchase_validator_1 = require("./puchase.validator");
const read_purchaseReturnList_service_1 = require("@services/purchase.services/read_purchaseReturnList.service");
const read_purchaseEditLists_service_1 = require("@services/purchase.services/read_purchaseEditLists.service");
const verify_purchase_service_1 = require("@services/purchase.services/verify.purchase.service");
const update_status_purchase_return_service_1 = require("@services/purchase.services/update_status_purchase_return.service");
const prisma = new client_1.PrismaClient();
// CREATE Purchase
exports.create = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const batches = yield (0, create_service_1.purchase_create)(req.body, req.user.id);
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) {
        for (const batch of batches) {
            yield prisma.activityLog.create({
                data: {
                    userId: req.user.id,
                    model: "Purchase",
                    recordId: batch.id,
                    action: client_1.ActionType.CREATE,
                    description: `Created pruchase batch #${batch.batchNumber} (ID ${batch.id})`,
                    ipAddress: req.ip,
                    userAgent: req.headers["user-agent"] || null,
                },
            });
        }
    }
    (0, SuccessHandler_1.successHandler)(batches, res, "POST", `Successfully created ${batches.length} purchase batch(es) with their items`);
}));
//Create Purchase Return
exports.create_purchase_return = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const purchaseReturn = yield (0, create_purchase_return_service_1.purchase_return_create)(req.body, req.user.id);
    (0, SuccessHandler_1.successHandler)({ purchaseReturn }, res, "POST", "Purchase return created successfully");
}));
exports.update_status_purchase_return = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { returnId, status, notes } = req.body;
    const userId = req.user.id;
    try {
        const result = yield (0, update_status_purchase_return_service_1.update_status_purchase_return_service)({
            returnId,
            status,
            notes,
            userId,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });
        (0, SuccessHandler_1.successHandler)(result, res, "PUT", `Purchase return status updated to ${status} successfully`);
    }
    catch (error) {
        throw new Error(error.message || "Failed to update purchase return status");
    }
}));
// READ Purchase
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
    // New filter inputs
    const sortField = req.query.sortField; // e.g., "invoice date"
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc"; // default to desc
    const status = req.query.status || "ALL";
    const { purchases, pagination, summary } = yield (0, read_service_1.purchase_list)(page, limit, search, sortField, sortOrder, status);
    (0, SuccessHandler_1.successHandler)({ purchases, pagination, summary }, res, "GET", "Purchases fetched successfully");
}));
//READ Purchase to be added to inventory
exports.read_purchaseToInventory = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
    // New filter inputs
    const sortField = req.query.sortField; // e.g., "invoice date"
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc"; // default to desc
    const { purchases, pagination } = yield (0, read_purchaseToInventory_service_1.purchase_list_to_inventory)(page, limit, search, sortField, sortOrder);
    (0, SuccessHandler_1.successHandler)({ purchases, pagination }, res, "GET", "Unconverted purchases fetched successfully");
}));
//READ Purchase Updated
exports.read_purchaseToUpdate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Validate ID parameter
    const purchaseId = parseInt(id);
    if (isNaN(purchaseId) || purchaseId <= 0) {
        throw new Error("Invalid purchase ID provided");
    }
    // Fetch purchase with optimized query
    const purchase = yield prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: {
            id: true,
            batchNumber: true,
            supplierId: true,
            districtId: true,
            dt: true,
            invoiceNumber: true,
            invoiceDate: true,
            expiryDate: true,
            manufacturingDate: true,
            createdById: true,
            status: true,
            receivedBy: true,
            verifiedBy: true,
            verificationDate: true,
            district: {
                select: {
                    id: true,
                    name: true,
                },
            },
            supplier: {
                select: {
                    id: true,
                    name: true,
                },
            },
            items: {
                select: {
                    id: true,
                    initialQuantity: true,
                    currentQuantity: true,
                    costPrice: true,
                    retailPrice: true,
                    lastUpdateReason: true,
                    product: {
                        select: {
                            id: true,
                            generic: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                            brand: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    // Handle case where purchase is not found
    if (!purchase) {
        throw new Error("Purchase not found");
    }
    // Check if this purchase batch exists in inventory
    const inventoryBatch = yield prisma.inventoryBatch.findFirst({
        where: {
            batchNumber: purchase.batchNumber,
            supplierId: purchase.supplierId,
        },
        select: {
            id: true,
            batchNumber: true,
            items: {
                select: {
                    id: true,
                    productId: true,
                    initialQuantity: true,
                    currentQuantity: true,
                    costPrice: true,
                    retailPrice: true,
                },
            },
        },
    });
    // Helper function to compare purchase items with inventory items
    const getInventoryComparison = () => {
        if (!inventoryBatch) {
            return {
                exists: false,
                message: "This purchase batch has not been transferred to inventory yet.",
                changes: [],
            };
        }
        const changes = [];
        purchase.items.forEach((purchaseItem) => {
            const inventoryItem = inventoryBatch.items.find((invItem) => invItem.productId === purchaseItem.product.id);
            if (inventoryItem) {
                const itemChanges = {
                    productName: `${purchaseItem.product.brand.name} (${purchaseItem.product.generic.name})`,
                    changes: [],
                };
                // Compare quantities
                if (purchaseItem.initialQuantity !== inventoryItem.initialQuantity) {
                    itemChanges.changes.push({
                        field: "Initial Quantity",
                        purchase: purchaseItem.initialQuantity,
                        inventory: inventoryItem.initialQuantity,
                        difference: inventoryItem.initialQuantity - purchaseItem.initialQuantity,
                    });
                }
                if (purchaseItem.currentQuantity !== inventoryItem.currentQuantity) {
                    itemChanges.changes.push({
                        field: "Current Quantity",
                        purchase: purchaseItem.currentQuantity,
                        inventory: inventoryItem.currentQuantity,
                        difference: inventoryItem.currentQuantity - purchaseItem.currentQuantity,
                    });
                }
                // Compare prices
                const purchaseCostPrice = parseFloat(purchaseItem.costPrice.toString());
                const inventoryCostPrice = parseFloat(inventoryItem.costPrice.toString());
                if (purchaseCostPrice !== inventoryCostPrice) {
                    itemChanges.changes.push({
                        field: "Cost Price",
                        purchase: purchaseCostPrice,
                        inventory: inventoryCostPrice,
                        difference: inventoryCostPrice - purchaseCostPrice,
                    });
                }
                const purchaseRetailPrice = parseFloat(purchaseItem.retailPrice.toString());
                const inventoryRetailPrice = parseFloat(inventoryItem.retailPrice.toString());
                if (purchaseRetailPrice !== inventoryRetailPrice) {
                    itemChanges.changes.push({
                        field: "Retail Price",
                        purchase: purchaseRetailPrice,
                        inventory: inventoryRetailPrice,
                        difference: inventoryRetailPrice - purchaseRetailPrice,
                    });
                }
                // Only add to changes if there are actual differences
                if (itemChanges.changes.length > 0) {
                    changes.push(itemChanges);
                }
            }
            else {
                // Product exists in purchase but not in inventory
                changes.push({
                    productName: `${purchaseItem.product.brand.name} (${purchaseItem.product.generic.name})`,
                    status: "Missing from inventory",
                });
            }
        });
        // Check for products in inventory that don't exist in purchase
        inventoryBatch.items.forEach((inventoryItem) => {
            const purchaseItem = purchase.items.find((pItem) => pItem.product.id === inventoryItem.productId);
            if (!purchaseItem) {
                changes.push({
                    productId: inventoryItem.productId,
                    status: "Added to inventory (not in original purchase)",
                });
            }
        });
        return {
            exists: true,
            message: changes.length > 0
                ? `This purchase batch exists in inventory with ${changes.length} difference(s).`
                : "This purchase batch exists in inventory with no changes.",
            changes,
        };
    };
    const inventoryComparison = getInventoryComparison();
    // Transform the data for cleaner output
    const transformedPurchase = {
        id: purchase.id,
        batchNumber: purchase.batchNumber,
        invoiceDetails: {
            number: purchase.invoiceNumber,
            date: purchase.invoiceDate,
        },
        dates: {
            manufacturing: purchase.manufacturingDate,
            expiry: purchase.expiryDate,
        },
        location: {
            district: purchase.district,
            supplier: purchase.supplier,
        },
        verification: {
            receivedBy: purchase.receivedBy,
            verifiedBy: purchase.verifiedBy,
            status: purchase.status,
            verification: purchase.verificationDate,
        },
        documentType: purchase.dt,
        items: purchase.items.map((item) => ({
            id: item.id,
            product: {
                id: item.product.id,
                name: `${item.product.brand.name} (${item.product.generic.name})`,
                generic: item.product.generic,
                brand: item.product.brand,
            },
            quantity: {
                initial: item.initialQuantity,
                current: item.currentQuantity,
                available: item.currentQuantity, // Alias for clarity
            },
            pricing: {
                cost: parseFloat(item.costPrice.toString()),
                retail: parseFloat(item.retailPrice.toString()),
            },
            lastUpdateReason: item.lastUpdateReason,
        })),
        inventoryStatus: inventoryComparison,
    };
    (0, SuccessHandler_1.successHandler)(transformedPurchase, res, "GET", "Purchase details retrieved successfully");
}));
//================================================================================================================================================================
//READ Purchase Return Lists
exports.read_purchaseReturnList = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Call the service with query parameters
        const result = yield (0, read_purchaseReturnList_service_1.read_purchaseReturnList_service)(req.query);
        // Send response using successHandler
        (0, SuccessHandler_1.successHandler)(result, res, "GET", "Purchase returns retrieved successfully");
    }
    catch (error) {
        throw new Error(error); // Let the error handler middleware handle it
    }
}));
//READ Purchase Edit Logs
exports.read_purchaseEditLists = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = "1", limit = "10", search = "", sortField = "editedAt", sortOrder = "desc", } = req.query;
    const result = yield (0, read_purchaseEditLists_service_1.read_purchaseEditLists_service)({
        page,
        limit,
        search,
        sortField,
        sortOrder,
    });
    (0, SuccessHandler_1.successHandler)(result, res, "GET", "Purchase edit retrieved successfully");
}));
// READ Single Purchase by ID
exports.readById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Read Single Purchase", res, "GET", "Purchase fetched successfully");
}));
// UPDATE Purchase
exports.update = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Extract and validate IDs and body
    const purchaseId = parseInt(req.params.id, 10);
    const updateData = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new Error("Unauthorized access");
    }
    if (!purchaseId || isNaN(purchaseId)) {
        throw new Error("Invalid purchase ID");
    }
    try {
        yield (0, puchase_validator_1.validatePurchaseUpdateRequest)(purchaseId, updateData, userId);
        // 2. Delegate all business logic to service
        const result = yield (0, update_service_1.updatePurchase)(purchaseId, updateData, userId, req.ip || "unknown", req.get("User-Agent") || "");
        //When Update is successful, reset verification fields
        yield prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                verifiedBy: null,
                verificationDate: null,
            },
        });
        // 3. Return standardized success response
        (0, SuccessHandler_1.successHandler)(result, res, "PUT", "Purchase and related items updated successfully");
    }
    catch (error) {
        console.error("Purchase update error:", error);
        // 4. Preserve your existing error messages
        if (error.message === "Purchase not found") {
            throw new Error("Purchase not found");
        }
        if (error.code === "P2002") {
            throw new Error("Duplicate entry: Batch number already exists for this supplier");
        }
        if (error.code === "P2003") {
            throw new Error("Invalid reference: Check supplier, district, or product IDs");
        }
        // 5. Fallback
        throw new Error(error.message || "Failed to update purchase");
    }
}));
// DELETE Purchase (Soft delete - set isActive to false)
exports.remove = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Purchase Deleted Successfully", res, "DELETE", "Purchase deactivated successfully");
}));
// RESTORE Purchase (Reactivate soft-deleted Purchase)
exports.restore = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Purchase Restored Successfully", res, "PUT", "Purchase restored successfully");
}));
exports.verify = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const purchaseId = parseInt(req.params.id, 10);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new Error("Unauthorized access");
    }
    if (!purchaseId || isNaN(purchaseId)) {
        throw new Error("Invalid purchase ID");
    }
    const result = yield (0, verify_purchase_service_1.verifyPurchase_service)({
        purchaseId,
        userId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
    });
    (0, SuccessHandler_1.successHandler)(result, res, "PUT", `Purchase batch #${result.batchNumber} verified successfully by ${result.verification.verifiedBy}`);
}));
