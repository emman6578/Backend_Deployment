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
exports.read = exports.read_PSR_from_HRMS = void 0;
const client_1 = require("@prisma/client");
const connection_1 = require("@utils/Database/HRMS/connection");
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma = new client_1.PrismaClient();
exports.read_PSR_from_HRMS = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield (0, connection_1.withConnection)((connection) => __awaiter(void 0, void 0, void 0, function* () {
            return connection.query(`
          SELECT 
            u.id, 
            u.name, 
            u.usercode, 
            u.district_id,
            d.name AS district_name  
          FROM 
            users u
          LEFT JOIN 
            districts d ON u.district_id = d.id  
          WHERE 
            u.position = 'PSR';
        `);
        }));
        const formattedUsers = rows.map((user) => ({
            id: user.id,
            name: user.name,
            userCode: user.usercode,
            district: user.district_name,
        }));
        (0, SuccessHandler_1.successHandler)(formattedUsers, res, "GET", "Success");
    }
    catch (error) {
        // Log the error properly
        console.error("Database error:", error);
        throw new Error("Error fetching PSR from MySQL: " + error.message);
    }
}));
// READ PSR
exports.read = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const whereClause = search
        ? {
            fullName: {
                contains: search,
            },
        }
        : {};
    const response = yield prisma.pSR.findMany({
        where: whereClause,
        orderBy: {
            fullName: "asc",
        },
    });
    (0, SuccessHandler_1.successHandler)(response, res, "GET", `Getting ${search ? "filtered" : "all"} PSR values`);
}));
// // CREATE PSR
// export const create = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Create PSR", res, "POST", "Created PSR");
//   }
// );
// // READ Single PSR by ID
// export const readById = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     successHandler("Read Single PSR", res, "GET", "PSR fetched successfully");
//   }
// );
// // UPDATE PSR
// export const update = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Updated PSR", res, "PUT", "PSR updated successfully");
//   }
// );
// // DELETE PSR (Soft delete - set isActive to false)
// export const remove = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "PSR Deleted Successfully",
//       res,
//       "DELETE",
//       "PSR deactivated successfully"
//     );
//   }
// );
// // RESTORE PSR (Reactivate soft-deleted PSR)
// export const restore = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "PSR Restored Successfully",
//       res,
//       "PUT",
//       "PSR restored successfully"
//     );
//   }
// );
