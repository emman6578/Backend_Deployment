import {
  create,
  expiredProducts,
  inventoryMovementREAD,
  lowStockProducts,
  read,
  read_Inventory_Items,
  readById,
  readInventoryToUpdate,
  remove,
  restore,
  salesInventoryProducts,
  update,
} from "@controllers/inventory.controller/inventory.controller";
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
//Read
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read
);

router.get(
  "/items",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_Inventory_Items
);

router.get(
  "/expired",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  expiredProducts
);

router.get(
  "/low-stock-products",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  lowStockProducts
);

//Inventory Movement Routes========================================================================================================================
router.get(
  "/inventory-movement",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  inventoryMovementREAD
);
//=================================================================================================================================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  readById
);
router.get(
  "/product/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  readInventoryToUpdate
);

//Update
router.put(
  "/:id",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  update
);

//Delete
router.delete(
  "/:id",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  remove
);

//Delete
router.post(
  "/:id",
  authenticateToken,
  validateCsrfToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  restore
);

//========================================================================================Zyre MS Route
router.get(
  "/sales-inventory-products",
  // authenticateToken,
  // authorizeRoles(["SUPERADMIN", "ADMIN"]),
  salesInventoryProducts
);
//========================================================================================

export default router;
