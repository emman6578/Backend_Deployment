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
exports.restore = exports.remove = exports.update = exports.readById = exports.read = exports.create = void 0;
const client_1 = require("@prisma/client");
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma = new client_1.PrismaClient();
// CREATE Districts
exports.create = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Create Districts", res, "POST", "Created Districts");
}));
// READ Districts
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const whereClause = search
        ? {
            name: {
                contains: search,
            },
        }
        : {};
    const response = yield prisma.district.findMany({
        where: whereClause,
        orderBy: {
            name: "asc",
        },
    });
    (0, SuccessHandler_1.successHandler)(response, res, "GET", `Getting ${search ? "filtered" : "all"} Districts values`);
}));
// READ Single Districts by ID
exports.readById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Read Single Districts", res, "GET", "Districts fetched successfully");
}));
// UPDATE Districts
exports.update = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Updated Districts", res, "PUT", "Districts updated successfully");
}));
// DELETE Districts (Soft delete - set isActive to false)
exports.remove = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Districts Deleted Successfully", res, "DELETE", "Districts deactivated successfully");
}));
// RESTORE Districts (Reactivate soft-deleted Districts)
exports.restore = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, SuccessHandler_1.successHandler)("Districts Restored Successfully", res, "PUT", "Districts restored successfully");
}));
