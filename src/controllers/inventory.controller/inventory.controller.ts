import { AuthRequest } from "@middlewares/authMiddleware";
import { ActionType, Prisma, PrismaClient } from "@prisma/client";
import { inventory_movement_list } from "@services/inventory.movement.services/read.service";
import { inventory_create } from "@services/inventory.services/create.service";
import { expired_products_list } from "@services/inventory.services/expired-products.service";
import { low_stock_products_list } from "@services/inventory.services/low-stock.service";
import { inventory_list } from "@services/inventory.services/read.service";
import { inventory_by_id } from "@services/inventory.services/read_by_id.service";
import {
  inventory_update,
  UpdateInventoryBatchRequest,
} from "@services/inventory.services/update.service";
import { getInventoryMovementsGroupedByBatch } from "@services/inventory.services/read_movements_grouped.service";
import { checkAndUpdateExpiredBatches } from "@utils/ExpiredChecker/expiredProducts";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { InventoryMovementQuery } from "src/types/inventory.types";

const prisma = new PrismaClient();

// CREATE Inventory
export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const batches = await inventory_create(req.body, req.user!.id);

    if (req.user?.id) {
      for (const batch of batches) {
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            model: "InventoryBatch",
            recordId: batch.id,
            action: ActionType.CREATE,
            description: `Created inventory batch #${batch.batchNumber} (ID ${batch.id})`,
            ipAddress: req.ip,
            userAgent: (req.headers["user-agent"] as string) || null,
          },
        });
      }
    }

    successHandler(
      null,
      res,
      "POST",
      `Successfully created ${batches.length} inventory batch(es) with their items`
    );
  }
);
// READ Inventorys (with pagination, filtering)
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string)?.toLowerCase() || "";

  // New filter inputs
  const sortField = req.query.sortField as string; // e.g., "invoice date"
  const sortOrder =
    (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc"; // default to desc

  const status = req.query.status as string;

  // Date filter inputs
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  // NEW: Check and update expired batches before fetching
  await checkAndUpdateExpiredBatches();

  const { inventories, pagination, summary } = await inventory_list(
    page,
    limit,
    search,
    sortField,
    sortOrder,
    status,
    dateFrom,
    dateTo
  );

  successHandler(
    { inventories, pagination, summary },
    res,
    "GET",
    "Inventorys fetched successfully"
  );
});
// READ Single Inventory by ID
export const readById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { id: idParam } = req.params;

    const {
      page = "1",
      limit = "10",
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const searchQuery = search as string;
    const sortFieldParam = sortField as string;
    const sortOrderParam = sortOrder as string;

    const result = await inventory_by_id(
      parseInt(idParam),
      pageNumber,
      limitNumber,
      searchQuery,
      sortFieldParam,
      sortOrderParam
    );

    successHandler(result, res, "GET", "Inventory fetched successfully");
  }
);
//Getting Info for Inventorys to be updated
export const readInventoryToUpdate = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { id: idParam } = req.params;

    successHandler(
      "Read Inventory to update by id",
      res,
      "GET",
      "Inventory fetched successfully"
    );
  }
);
// UPDATE Inventory
export const update = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const batchId = parseInt(id);
    const userId = req.user?.id;

    if (!batchId || isNaN(batchId)) {
      throw new Error("Invalid batch ID provided");
    }

    if (!userId) {
      throw new Error("User authentication required");
    }

    const updateData: UpdateInventoryBatchRequest = {
      ...req.body,
      updatedById: userId,
    };

    // Proceed with update if validation passes
    const result = await inventory_update(
      batchId,
      updateData,
      userId.toString()
    );

    successHandler(
      result,
      res,
      "UPDATE",
      "Inventory batch updated successfully"
    );
  }
);
// DELETE Inventory (Soft delete - set isActive to false)
//TODO: Add Activity log
export const remove = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    successHandler(
      "soft delete inventory",
      res,
      "DELETE",
      "Inventory deactivated successfully"
    );
  }
);
// RESTORE Inventory (Reactivate soft-deleted Inventory)
//TODO: Add Activity log
export const restore = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    successHandler(
      "restore inventory",
      res,
      "PUT",
      "Inventory restored successfully"
    );
  }
);
//=====================================END OF CRUD==================================================================================================================================================================
export const expiredProducts = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error("User not found");
    }

    // Parse pagination & search params
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const itemsPerPage = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const search = (req.query.search as string)?.trim() || "";

    // Parse date filter parameters
    const dateFrom = (req.query.dateFrom as string) || undefined;
    const dateTo = (req.query.dateTo as string) || undefined;

    // Validate date parameters if provided
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      throw new Error(
        "Invalid dateFrom format. Please use ISO date format (YYYY-MM-DD)"
      );
    }
    if (dateTo && isNaN(Date.parse(dateTo))) {
      throw new Error(
        "Invalid dateTo format. Please use ISO date format (YYYY-MM-DD)"
      );
    }

    // Call service function
    const result = await expired_products_list({
      page,
      itemsPerPage,
      search,
      userId,
      dateFrom,
      dateTo,
    });

    // Send back response
    successHandler(
      result,
      res,
      "GET",
      "Inventory expired products fetched successfully with loss analysis"
    );
  }
);
export const lowStockProducts = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      // Extract and parse query parameters
      const search = ((req.query.search as string) || "").toLowerCase();
      const sortField = (req.query.sortField as string) || "currentQuantity";
      const sortOrder =
        (req.query.sortOrder as string) === "desc" ? "desc" : "asc";
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "10", 10);

      // Extract date filter parameters
      const dateFrom = (req.query.dateFrom as string) || undefined;
      const dateTo = (req.query.dateTo as string) || undefined;

      // Validate date parameters if provided
      if (dateFrom && isNaN(Date.parse(dateFrom))) {
        throw new Error(
          "Invalid dateFrom format. Please use ISO date format (YYYY-MM-DD)"
        );
      }
      if (dateTo && isNaN(Date.parse(dateTo))) {
        throw new Error(
          "Invalid dateTo format. Please use ISO date format (YYYY-MM-DD)"
        );
      }

      // Call service function with date filters
      const responseData = await low_stock_products_list(
        page,
        limit,
        search,
        sortField,
        sortOrder,
        dateFrom,
        dateTo
      );

      // Send successful response
      successHandler(
        responseData,
        res,
        "GET",
        "Inventory low-stock (non-expired) products fetched successfully"
      );
    } catch (error: any) {
      throw new Error(error.message || error);
    }
  }
);
//===================================================================================================================================================================================================
//INVENTORY MOVEMENT CONTROLLER
export const inventoryMovementREAD = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Extract and parse query parameters
      const {
        search = "",
        sortField = "createdAt",
        sortOrder = "desc",
        page = "1",
        limit = "10",
        movementType,
        dateFrom,
        dateTo,
      } = req.query as InventoryMovementQuery;

      // Parse pagination parameters
      const currentPage = Math.max(1, parseInt(page));
      const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page

      // Call service function
      const responseData = await inventory_movement_list(
        currentPage,
        itemsPerPage,
        search,
        sortField,
        sortOrder as "asc" | "desc",
        movementType,
        dateFrom,
        dateTo
      );

      // Send successful response
      successHandler(
        responseData,
        res,
        "GET",
        "READ Inventory Movement successfully"
      );
    } catch (error: any) {
      throw new Error(error.message || error);
    }
  }
);
export const inventoryMovementGroupedByBatch = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        batchNumber,
        referenceNumber,
        batchAndReference,
        page,
        limit,
        dateFrom,
        dateTo,
      } = req.query;

      const result = await getInventoryMovementsGroupedByBatch({
        batchNumber: batchNumber as string,
        referenceNumber: referenceNumber as string,
        batchAndReference: batchAndReference as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      successHandler(
        result,
        res,
        "GET",
        "Read Inventory Movement grouped by batch successfully"
      );
    } catch (error: any) {
      throw new Error(error.message || error);
    }
  }
);

export const inventoryMovementCREATE = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "Create",
      res,
      "POST",
      "Create Inventory Movement successfully"
    );
  }
);
export const inventoryMovementUPDATE = expressAsyncHandler(
  async (req: Request, res: Response) => {
    successHandler(
      "UPDATE",
      res,
      "GET",
      "UPDATE Inventory Movement successfully"
    );
  }
);
//INVENTORY ITEMS FETCH FUNCTION
export const read_Inventory_Items = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { search } = req.query;

    const whereClause = search
      ? {
          OR: [
            {
              product: {
                generic: {
                  name: {
                    contains: search as string,
                  },
                },
              },
            },
            {
              product: {
                brand: {
                  name: {
                    contains: search as string,
                  },
                },
              },
            },
          ],
        }
      : {};

    const items = await prisma.inventoryItem.findMany({
      where: {
        ...whereClause,
        status: "ACTIVE", // Only fetch active inventory items
      },
      orderBy: {
        createdAt: "desc", // Changed to desc to show newest items first
      },
      select: {
        id: true,
        currentQuantity: true,
        retailPrice: true,
        batch: { select: { batchNumber: true, expiryDate: true } },
        product: {
          select: {
            generic: {
              select: {
                name: true,
              },
            },
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    successHandler(
      items,
      res,
      "GET",
      "Reading all the items from the inventory"
    );
  }
);
// export const inventoryMovementDELETE = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     successHandler(
//       "DELETE",
//       res,
//       "GET",
//       "DELETE Inventory Movement successfully"
//     );
//   }
// );

//==========================================For Zyre MS Controller===========================================================================================
export const salesInventoryProducts = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const salesInventory = await prisma.inventoryBatch.findMany({
      select: {
        batchNumber: true,
        expiryDate: true,
        items: {
          select: {
            retailPrice: true,
            product: {
              select: {
                generic: {
                  select: {
                    name: true,
                  },
                },
                brand: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data to a cleaner format
    const cleanedData = salesInventory.flatMap((batch) =>
      batch.items.map((item) => ({
        genericName: item.product.generic.name,
        brandName: item.product.brand.name,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        retailPrice: item.retailPrice,
      }))
    );

    successHandler(
      cleanedData,
      res,
      "GET",
      "Inventory sales items stock products fetched successfully"
    );
  }
);
