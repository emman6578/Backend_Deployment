import {
  create,
  read,
  update,
  remove,
  readById,
} from "@controllers/inventory.controller/district.controller";
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
//Read
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  read
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(["SUPERADMIN", "ADMIN"]),
  readById
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

// router.get("/", CheckApiKEY, read);
