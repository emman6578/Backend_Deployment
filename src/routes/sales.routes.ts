import {
  create,
  create_update_payment,
  createSalesReturn,
  read,
  read_SalesReturn,
  updateSalesReturnStatus,
  // update,
  // readById,
} from "@controllers/sales.controller/sales.controller";
import { authenticateToken } from "@middlewares/authMiddleware";
import { validateCsrfToken } from "@middlewares/csrfMiddleware";
import { authorizeRoles } from "@middlewares/roleMiddleware";

import { Router } from "express";

const router = Router();

//Create
router.post(
  "/",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  create
);
//Create Sales Return
router.post(
  "/return",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  createSalesReturn
);
//Create Update Payment
router.post(
  "/update-payment",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  create_update_payment
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

// Update Sales Return Status
router.put(
  "/return/status",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  updateSalesReturnStatus
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
// validateCsrfToken,
//   authorizeRoles(["SUPERADMIN", "ADMIN"]),
//   update
// );

// //Delete
// router.delete(
//   "/:id",
//   authenticateToken,
//   validateCsrfToken,
//   authorizeRoles(["SUPERADMIN", "ADMIN"]),
//   remove
// );

export default router;
