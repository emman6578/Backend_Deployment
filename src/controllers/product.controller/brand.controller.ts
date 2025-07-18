import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Brands
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Create Brands", res, "POST", "Created Brands");
  }
);

// READ Brands
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        name: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.brand.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} Brands values`
  );
});

// READ Single Brands by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Read Single Brands",
      res,
      "GET",
      "Brands fetched successfully"
    );
  }
);

// UPDATE Brands
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Updated Brands", res, "PUT", "Brands updated successfully");
  }
);

// DELETE Brands (Soft delete - set isActive to false)
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Brands Deleted Successfully",
      res,
      "DELETE",
      "Brands deactivated successfully"
    );
  }
);

// RESTORE Brands (Reactivate soft-deleted Brands)
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Brands Restored Successfully",
      res,
      "PUT",
      "Brands restored successfully"
    );
  }
);
