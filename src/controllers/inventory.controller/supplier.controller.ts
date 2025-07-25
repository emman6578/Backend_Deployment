import { AuthRequest } from "@middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

// CREATE Supplier
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    let { name, contact, address, isActive = true } = req.body;
    if (!name) {
      res.status(400);
      throw new Error("Supplier name is required");
    }
    name = name.toUpperCase();
    try {
      const supplier = await prisma.supplier.create({
        data: { name, contact, address, isActive },
      });
      successHandler(supplier, res, "POST", "Created Supplier successfully");
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409);
        throw new Error("Supplier name must be unique");
      }
      res.status(500);
      throw new Error(error.message || "Failed to create supplier");
    }
  }
);

// READ Supplier
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search, page = 1, limit = 100 } = req.query;

  const pageNumber = parseInt(page as string, 10) || 1;
  const itemsPerPage = parseInt(limit as string, 10) || 100;
  const skip = (pageNumber - 1) * itemsPerPage;

  const whereClause: any = {
    isActive: true,
  };

  if (search) {
    whereClause.name = {
      contains: search as string,
    };
  }

  const [totalItems, suppliers] = await Promise.all([
    prisma.supplier.count({ where: whereClause }),
    prisma.supplier.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip,
      take: itemsPerPage,
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const pagination = {
    currentPage: pageNumber,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: pageNumber < totalPages,
    hasPreviousPage: pageNumber > 1,
  };

  successHandler(
    { suppliers, pagination },
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
    const { id } = req.params;
    let { name, contact, address, isActive } = req.body;
    if (!id) {
      res.status(400);
      throw new Error("Supplier id is required");
    }
    try {
      const existing = await prisma.supplier.findUnique({
        where: { id: Number(id) },
      });
      if (!existing) {
        res.status(404);
        throw new Error("Supplier not found");
      }
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.toUpperCase();
      if (contact !== undefined) updateData.contact = contact;
      if (address !== undefined) updateData.address = address;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (Object.keys(updateData).length === 0) {
        res.status(400);
        throw new Error("No update fields provided");
      }
      const updated = await prisma.supplier.update({
        where: { id: Number(id) },
        data: updateData,
      });
      successHandler(updated, res, "PUT", "Supplier updated successfully");
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409);
        throw new Error("Supplier name must be unique");
      }
      res.status(500);
      throw new Error(error.message || "Failed to update supplier");
    }
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
