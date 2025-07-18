"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const collections_controller_1 = require("@controllers/collections.controller/collections.controller");
const authMiddleware_1 = require("@middlewares/authMiddleware");
const roleMiddleware_1 = require("@middlewares/roleMiddleware");
const express_1 = require("express");
const router = (0, express_1.Router)();
//Create
router.post("/", authMiddleware_1.authenticateToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), collections_controller_1.create);
//Read
router.get("/", authMiddleware_1.authenticateToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), collections_controller_1.read);
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
exports.default = router;
