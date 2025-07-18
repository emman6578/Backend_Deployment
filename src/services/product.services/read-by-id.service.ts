import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const readByid = async (
  productId: number,
  page: number = 1,
  limit: number = 10
) => {
  if (!productId || isNaN(productId)) {
    throw new Error("Valid product ID is required");
  }

  // Validate pagination parameters
  const pageNumber = Math.max(1, page);
  const limitNumber = Math.max(1, Math.min(100, limit)); // Max 100 items per page
  const skip = (pageNumber - 1) * limitNumber;

  // Get basic product information (without transactions first)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      generic: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true } },
      createdBy: {
        select: {
          id: true,
          fullname: true,
          email: true,
          role: { select: { name: true } },
        },
      },
      updatedBy: {
        select: {
          id: true,
          fullname: true,
          email: true,
          role: { select: { name: true } },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  // Get transactions with pagination
  const [transactions, totalTransactions] = await Promise.all([
    prisma.productTransaction.findMany({
      where: { productId: productId },
      include: {
        user: { select: { id: true, fullname: true } },
      },
      skip: (page - 1) * limit, // Fix: Calculate skip properly
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.productTransaction.count({
      where: { productId: productId },
    }),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalTransactions / limit);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  // Combine product data with paginated transactions
  const productWithPaginatedTransactions = {
    ...product,
    transactions: {
      data: transactions,
      pagination: {
        currentPage: pageNumber,
        totalPages: totalPages,
        totalItems: totalTransactions,
        itemsPerPage: limitNumber,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
      },
    },
  };

  return productWithPaginatedTransactions;
};
