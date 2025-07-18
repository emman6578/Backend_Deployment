import { readInventoryToUpdate } from "@controllers/inventory.controller/inventory.controller";
import {
  create,
  read,
  update,
  remove,
  readById,
  read_purchaseToInventory,
  read_purchaseToUpdate,
  create_purchase_return,
  verify,
  read_purchaseReturnList,
  read_purchaseEditLists,
  update_status_purchase_return,
} from "@controllers/purchase.controller/purchase.controller";
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
//Create Purchase Return
router.post(
  "/return",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  create_purchase_return
);
//Update Purchase Return STATUS
router.put(
  "/return/status",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  update_status_purchase_return
);
//Read
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read
);
//READ Purchase to be added to inventory
router.get(
  "/toInventory",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_purchaseToInventory
);
router.get(
  "/purchaseToUpdate/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_purchaseToUpdate
);
router.get(
  "/return",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_purchaseReturnList
);
router.get(
  "/edit",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read_purchaseEditLists
);
//READ by id
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  readById
);
//Update
router.put(
  "/verify/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  verify
);
//Update
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  update
);
//Delete
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  remove
);

export default router;
