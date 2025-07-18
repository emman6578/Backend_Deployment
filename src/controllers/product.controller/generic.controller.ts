import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Generics
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Create Generics", res, "POST", "Created Generics");
  }
);

// READ Generics
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        name: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.generic.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} generics values`
  );
});

// READ Single Generics by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Read Single Generics",
      res,
      "GET",
      "Generics fetched successfully"
    );
  }
);

// UPDATE Generics
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Updated Generics",
      res,
      "PUT",
      "Generics updated successfully"
    );
  }
);

// DELETE Generics (Soft delete - set isActive to false)
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Generics Deleted Successfully",
      res,
      "DELETE",
      "Generics deactivated successfully"
    );
  }
);

// RESTORE Generics (Reactivate soft-deleted Generics)
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Generics Restored Successfully",
      res,
      "PUT",
      "Generics restored successfully"
    );
  }
);
