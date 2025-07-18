import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Districts
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler("Create Districts", res, "POST", "Created Districts");
  }
);

// READ Districts
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        name: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.district.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} Districts values`
  );
});

// READ Single Districts by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Read Single Districts",
      res,
      "GET",
      "Districts fetched successfully"
    );
  }
);

// UPDATE Districts
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Updated Districts",
      res,
      "PUT",
      "Districts updated successfully"
    );
  }
);

// DELETE Districts (Soft delete - set isActive to false)
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Districts Deleted Successfully",
      res,
      "DELETE",
      "Districts deactivated successfully"
    );
  }
);

// RESTORE Districts (Reactivate soft-deleted Districts)
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Districts Restored Successfully",
      res,
      "PUT",
      "Districts restored successfully"
    );
  }
);
