import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PurchaseReturnQueryParams {
  sortField?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

export interface PurchaseReturnListResponse {
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const read_purchaseReturnList_service = async (
  queryParams: PurchaseReturnQueryParams
): Promise<PurchaseReturnListResponse> => {
  const {
    sortField,
    sortOrder,
    page = "1",
    limit = "10",
    search,
    status,
  } = queryParams;

  // Parse pagination values
  const currentPage = Math.max(parseInt(page as string, 10), 1);
  const itemsPerPage = Math.max(parseInt(limit as string, 10), 1);
  const skip = (currentPage - 1) * itemsPerPage;

  // Define allowed sort fields and order
  const allowedSortFields = ["returnDate", "returnQuantity", "returnPrice"];

  let orderBy: any = undefined;
  if (sortField && allowedSortFields.includes(sortField as string)) {
    orderBy = {
      [sortField as string]: sortOrder === "desc" ? "desc" : "asc",
    };
  } else if (sortField === "expiryDate") {
    // Handle nested field sorting
    orderBy = {
      originalPurchase: { expiryDate: sortOrder === "desc" ? "desc" : "asc" },
    };
  }

  // Add default sorting
  if (!orderBy) {
    orderBy = { createdAt: "desc" };
  }

  // Build where clause for search
  let where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const searchTerm = String(search);
    where = {
      OR: [
        // Direct field search - convert to string for ID search
        { id: isNaN(Number(searchTerm)) ? undefined : Number(searchTerm) },

        // Nested originalPurchase fields
        {
          originalPurchase: {
            OR: [
              { dt: { contains: searchTerm } },
              {
                invoiceNumber: { contains: searchTerm },
              },
              { batchNumber: { contains: searchTerm } },
              {
                supplier: {
                  name: { contains: searchTerm },
                },
              },
            ],
          },
        },

        // Nested originalPurchaseItem.product fields
        {
          originalPurchaseItem: {
            product: {
              OR: [
                {
                  generic: {
                    name: { contains: searchTerm },
                  },
                },
                {
                  brand: {
                    name: { contains: searchTerm },
                  },
                },
                {
                  categories: {
                    some: {
                      name: { contains: searchTerm },
                    },
                  },
                },
              ],
            },
          },
        },

        // Return-specific fields
        { returnReason: { contains: searchTerm } },
        { notes: { contains: searchTerm } },
        { referenceNumber: { contains: searchTerm } },
      ].filter((condition) => {
        // Remove undefined conditions (like when ID search fails)
        return Object.values(condition).some((value) => value !== undefined);
      }),
    };
  }

  if (status) {
    where.status = status;
  }

  // Get total count for pagination
  const totalItems = await prisma.purchaseReturn.count({ where });
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Fetch paginated data
  const returns = await prisma.purchaseReturn.findMany({
    where,
    skip,
    take: itemsPerPage,
    orderBy,
    include: {
      originalPurchase: {
        include: {
          supplier: true,
          district: true,
        },
      },
      originalPurchaseItem: {
        include: {
          product: {
            include: {
              generic: true,
              brand: true,
              categories: true,
              company: true,
            },
          },
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
  });

  // Map to structured output
  const formattedReturns = returns.map((r) => ({
    id: r.id,
    dt: r.originalPurchase.dt,
    invoiceNumber: r.originalPurchase.invoiceNumber,
    batchNumber: r.originalPurchase.batchNumber,
    category: r.originalPurchaseItem.product.categories
      .map((c) => c.name)
      .join(", "),
    brand: r.originalPurchaseItem.product.brand.name,
    generic: r.originalPurchaseItem.product.generic.name,
    company: r.originalPurchaseItem.product.company.name,
    supplier: r.originalPurchase.supplier.name,
    district: r.originalPurchase.district.name,
    returnDate: r.returnDate,
    expiryDate: r.originalPurchase.expiryDate,
    returnQuantity: r.returnQuantity,
    returnPrice: r.returnPrice,
    returnReason: r.returnReason,
    returnNotes: r.notes,
    status: r.status,
    refNum: r.referenceNumber,
  }));

  // Format pagination metadata
  const pagination = {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };

  return {
    data: formattedReturns,
    pagination,
  };
};
