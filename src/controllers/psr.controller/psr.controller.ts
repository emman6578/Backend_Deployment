import { PrismaClient } from "@prisma/client";
import {
  closeMySQLPool,
  getMySQLPool,
  withConnection,
} from "@utils/Database/HRMS/connection";
import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();

export const read_PSR_from_HRMS = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const [rows] = await withConnection(async (connection) => {
        return connection.query(`
          SELECT 
            u.id, 
            u.name, 
            u.usercode, 
            u.district_id,
            d.name AS district_name  
          FROM 
            users u
          LEFT JOIN 
            districts d ON u.district_id = d.id  
          WHERE 
            u.position = 'PSR';
        `);
      });

      const formattedUsers = (rows as any[]).map((user) => ({
        id: user.id,
        name: user.name,
        userCode: user.usercode,
        district: user.district_name,
      }));

      successHandler(formattedUsers, res, "GET", "Success");
    } catch (error: any) {
      // Log the error properly
      console.error("Database error:", error);
      throw new Error("Error fetching PSR from MySQL: " + error.message);
    }
  }
);

// READ PSR
export const read = expressAsyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        fullName: {
          contains: search as string,
        },
      }
    : {};

  const response = await prisma.pSR.findMany({
    where: whereClause,
    orderBy: {
      fullName: "asc",
    },
  });

  successHandler(
    response,
    res,
    "GET",
    `Getting ${search ? "filtered" : "all"} PSR values`
  );
});

// // CREATE PSR
// export const create = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Create PSR", res, "POST", "Created PSR");
//   }
// );

// // READ Single PSR by ID
// export const readById = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     successHandler("Read Single PSR", res, "GET", "PSR fetched successfully");
//   }
// );

// // UPDATE PSR
// export const update = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler("Updated PSR", res, "PUT", "PSR updated successfully");
//   }
// );

// // DELETE PSR (Soft delete - set isActive to false)
// export const remove = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "PSR Deleted Successfully",
//       res,
//       "DELETE",
//       "PSR deactivated successfully"
//     );
//   }
// );

// // RESTORE PSR (Reactivate soft-deleted PSR)
// export const restore = expressAsyncHandler(
//   async (req: AuthRequest, res: Response) => {
//     successHandler(
//       "PSR Restored Successfully",
//       res,
//       "PUT",
//       "PSR restored successfully"
//     );
//   }
// );
