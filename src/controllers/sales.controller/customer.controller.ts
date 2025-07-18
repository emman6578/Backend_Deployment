import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import expressAsyncHandler from "express-async-handler";
import { AuthRequest } from "@middlewares/authMiddleware";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";

const prisma = new PrismaClient();

export const read = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { search } = req.query;

    const whereClause = search
      ? {
          customerName: {
            contains: search as string,
          },
        }
      : {};

    const findCustomer = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    successHandler(findCustomer, res, "GET", "Customer fetched successfully");
  }
);

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
