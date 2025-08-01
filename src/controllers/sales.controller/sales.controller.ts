import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import expressAsyncHandler from "express-async-handler";
import { AuthRequest } from "@middlewares/authMiddleware";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import {
  getSalesData,
  SalesQueryParams,
} from "@services/sales.services/read.service";
import { createSale } from "@services/sales.services/create_bulk.service";
import {
  CreateSalesReturnRequest,
  createSalesReturnService,
} from "@services/sales.services/create_sales_return.service";
import {
  UpdateSalesReturnStatusRequest,
  updateSalesReturnStatusService,
} from "@services/sales.services/update_sales_return_status.service";

const prisma = new PrismaClient();

export const create = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const result = await createSale(req.body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    successHandler(result, res, "POST", "Sale created successfully");
  }
);

export const read = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const responseData = await getSalesData(req.query as SalesQueryParams);
      successHandler(responseData, res, "GET", "Sales fetched successfully");
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw new Error("Failed to fetch sales data");
    }
  }
);

export const createSalesReturn = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      originalSaleId,
      returnQuantity,
      returnReason,
      notes,
      restockable = true,
    }: CreateSalesReturnRequest = req.body;

    const userId = req.user?.id;
    if (typeof userId !== "number") {
      throw new Error("User not authenticated");
    }

    try {
      const result = await createSalesReturnService({
        originalSaleId,
        returnQuantity,
        returnReason,
        notes,
        restockable,
        userId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      successHandler(result, res, "POST", "Sales Return Created Successfully");
    } catch (error: any) {
      throw new Error(error); // Let expressAsyncHandler handle the error
    }
  }
);

export const read_SalesReturn = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      status,
      dateFrom,
      dateTo,
      processedById,
      approvedById,
      returnReason,
      restockable,
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search conditions for searchable fields
    const searchConditions = search
      ? {
          OR: [
            { transactionID: { contains: search as string } }, // ← was referenceNumber
            { returnReason: { contains: search as string } },
            { notes: { contains: search as string } },
            {
              originalSale: {
                OR: [
                  { transactionID: { contains: search as string } }, // ← was referenceNumber
                  { genericName: { contains: search as string } },
                  { brandName: { contains: search as string } },
                  { companyName: { contains: search as string } },
                  { customerName: { contains: search as string } },
                  { classification: { contains: search as string } },
                  { batchNumber: { contains: search as string } },
                  { supplierName: { contains: search as string } },
                ],
              },
            },
          ],
        }
      : {};

    // Build filter conditions
    const filterConditions: any = {};

    // Status filter
    if (status) {
      filterConditions.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filterConditions.returnDate = {};
      if (dateFrom) {
        filterConditions.returnDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        filterConditions.returnDate.lte = new Date(dateTo as string);
      }
    }

    // User filters
    if (processedById) {
      filterConditions.processedById = parseInt(processedById as string, 10);
    }

    if (approvedById) {
      filterConditions.approvedById = parseInt(approvedById as string, 10);
    }

    // Return reason filter
    if (returnReason) {
      filterConditions.returnReason = {
        contains: returnReason as string,
      };
    }

    // Restockable filter
    if (restockable !== undefined) {
      filterConditions.restockable = restockable === "true";
    }

    // Combine all conditions
    const whereConditions = {
      ...searchConditions,
      ...filterConditions,
    };

    // Build sort conditions
    const orderBy: any = {};
    if (
      sortField === "createdAt" ||
      sortField === "updatedAt" ||
      sortField === "returnDate"
    ) {
      orderBy[sortField as string] = sortOrder as string;
    } else if (
      sortField === "referenceNumber" ||
      sortField === "returnReason" ||
      sortField === "status"
    ) {
      orderBy[sortField as string] = sortOrder as string;
    } else if (
      sortField === "returnQuantity" ||
      sortField === "returnPrice" ||
      sortField === "refundAmount"
    ) {
      orderBy[sortField as string] = sortOrder as string;
    } else {
      // Default sort
      orderBy.createdAt = "desc";
    }

    try {
      // Get total count for pagination
      const totalItems = await prisma.salesReturn.count({
        where: {
          ...searchConditions,
          ...filterConditions,
        },
      });
      // Fetch paginated results with relations
      const salesReturns = await prisma.salesReturn.findMany({
        where: whereConditions,
        include: {
          originalSale: {
            include: {
              inventoryItem: {
                include: {
                  product: {
                    include: {
                      generic: true,
                      brand: true,
                      company: true,
                    },
                  },
                  batch: {
                    include: {
                      supplier: true,
                      district: true,
                    },
                  },
                },
              },
              customer: true,
              psr: true,
              district: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPreviousPage = pageNum > 1;

      const summaryStats = await prisma.salesReturn.aggregate({
        where: {
          ...searchConditions,
          ...filterConditions,
        },
        _sum: {
          refundAmount: true,
          returnQuantity: true,
        },
        _count: {
          id: true,
        },
      });

      // Get status-specific counts
      const statusCounts = await prisma.salesReturn.groupBy({
        by: ["status"],
        where: {
          ...searchConditions,
          ...filterConditions,
        },
        _count: {
          id: true,
        },
      });

      // Get restockable items count
      const restockableCount = await prisma.salesReturn.count({
        where: {
          ...searchConditions,
          ...filterConditions,
          restockable: true,
        },
      });

      // Process status counts into a more usable format
      const statusMap = statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Create summary object
      const summary = {
        totalReturns: summaryStats._count.id || 0,
        totalRefunds: summaryStats._sum.refundAmount || 0,
        pendingReturns: statusMap["PENDING"] || 0,
        restockableItems: restockableCount || 0,
        completedReturns:
          (statusMap["APPROVED"] || 0) + (statusMap["COMPLETED"] || 0),
      };

      const response = {
        data: salesReturns,
        summary,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          search: search || null,
          status: status || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          processedById: processedById || null,
          approvedById: approvedById || null,
          returnReason: returnReason || null,
          restockable: restockable || null,
        },
        sort: {
          field: sortField,
          order: sortOrder,
        },
      };

      successHandler(
        response,
        res,
        "GET",
        "Sales Returns fetched successfully"
      );
    } catch (error) {
      console.error("Error fetching sales returns:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching sales returns",
      });
    }
  }
);

export const create_update_payment = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    successHandler(
      "Create Update Payment",
      res,
      "POST",
      "Payment Updated Successfully"
    );
  }
);

export const updateSalesReturnStatus = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { salesReturnId, newStatus, notes }: UpdateSalesReturnStatusRequest =
      req.body;

    const userId = req.user?.id;
    if (typeof userId !== "number") {
      throw new Error("User not authenticated");
    }

    try {
      const result = await updateSalesReturnStatusService({
        salesReturnId,
        newStatus,
        notes,
        userId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      successHandler(
        result,
        res,
        "PUT",
        `Sales Return Status Updated to ${newStatus} Successfully`
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update sales return status");
    }
  }
);

// export const update = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Updated Sales", res, "PUT", "Sales updated successfully");
//   }
// );

// // DELETE Sales (Soft delete - set isActive to false)
// export const remove = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Sales Deleted Successfully",
//       res,
//       "DELETE",
//       "Sales deactivated successfully"
//     );
//   }
// );

// // RESTORE Sales (Reactivate soft-deleted Sales)
// export const restore = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "Sales Restored Successfully",
//       res,
//       "PUT",
//       "Sales restored successfully"
//     );
//   }
// );
