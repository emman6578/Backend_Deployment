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
exports.read = void 0;
const client_1 = require("@prisma/client");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const prisma = new client_1.PrismaClient();
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const whereClause = search
        ? {
            customerName: {
                contains: search,
            },
        }
        : {};
    const findCustomer = yield prisma.customer.findMany({
        where: whereClause,
        orderBy: {
            createdAt: "desc",
        },
    });
    (0, SuccessHandler_1.successHandler)(findCustomer, res, "GET", "Customer fetched successfully");
}));
// export const create = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("result", res, "POST", "Customer created successfully");
//   }
// );
// export const update = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Updated Customer", res, "PUT", "Customer updated successfully");
//   }
// );
// // DELETE Customer (Soft delete - set isActive to false)
// export const remove = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Customer Deleted Successfully",
//       res,
//       "DELETE",
//       "Customer deactivated successfully"
//     );
//   }
// );
// // RESTORE Customer (Reactivate soft-deleted Customer)
// export const restore = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Customer Restored Successfully",
//       res,
//       "PUT",
//       "Customer restored successfully"
//     );
//   }
// );
