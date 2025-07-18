import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Category
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Create Category", res, "POST", "Created Category");
  }
);

// READ Category
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        name: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.category.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} Category values`
  );
});

// READ Single Category by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Read Single Category",
      res,
      "GET",
      "Category fetched successfully"
    );
  }
);

// UPDATE Category
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Updated Category",
      res,
      "PUT",
      "Category updated successfully"
    );
  }
);

// DELETE Category (Soft delete - set isActive to false)
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Category Deleted Successfully",
      res,
      "DELETE",
      "Category deactivated successfully"
    );
  }
);

// RESTORE Category (Reactivate soft-deleted Category)
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Category Restored Successfully",
      res,
      "PUT",
      "Category restored successfully"
    );
  }
);
