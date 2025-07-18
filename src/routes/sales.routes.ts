import {
  create,
  createSalesReturn,
  read,
  read_SalesReturn,
  // update,
  // readById,
} from "@controllers/sales.controller/sales.controller";
import { authenticateToken } from "@middlewares/authMiddleware";
import { authorizeRoles } from "@middlewares/roleMiddleware";

import { Router } from "express";

const router = Router();

//Create
router.post(
  "/",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  create
);
//Create Sales Return
router.post(
  "/return",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  createSalesReturn
);
//Read
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read
);
router.get(
  "/return",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_SalesReturn
);

// //Read by id
// router.get(
//   "/:id",
//   authenticateToken,
//   authorizeRoles(["SUPERADMIN", "ADMIN"]),
//   readById
// );
// //Update
// router.put(
//   "/:id",
//   authenticateToken,
//   authorizeRoles(["SUPERADMIN", "ADMIN"]),
//   update
// );

// //Delete
// router.delete(
//   "/:id",
//   authenticateToken,
//   authorizeRoles(["SUPERADMIN", "ADMIN"]),
//   remove
// );

export default router;
