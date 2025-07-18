import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Supplier
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Create Supplier", res, "POST", "Created Supplier");
  }
);

// READ Supplier
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        name: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.supplier.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} Supplier values`
  );
});

// READ Single Supplier by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Read Single Supplier",
      res,
      "GET",
      "Supplier fetched successfully"
    );
  }
);

// UPDATE Supplier
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Updated Supplier",
      res,
      "PUT",
      "Supplier updated successfully"
    );
  }
);

// DELETE Supplier (Soft delete - set isActive to false)
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Supplier Deleted Successfully",
      res,
      "DELETE",
      "Supplier deactivated successfully"
    );
  }
);

// RESTORE Supplier (Reactivate soft-deleted Supplier)
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Supplier Restored Successfully",
      res,
      "PUT",
      "Supplier restored successfully"
    );
  }
);
