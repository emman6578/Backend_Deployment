"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sales_controller_1 = require("@controllers/sales.controller/sales.controller");
const authMiddleware_1 = require("@middlewares/authMiddleware");
const csrfMiddleware_1 = require("@middlewares/csrfMiddleware");
const roleMiddleware_1 = require("@middlewares/roleMiddleware");
const express_1 = require("express");
const router = (0, express_1.Router)();
//Create
router.post("/", authMiddleware_1.authenticateToken, csrfMiddleware_1.validateCsrfToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), sales_controller_1.create);
//Create Sales Return
router.post("/return", authMiddleware_1.authenticateToken, csrfMiddleware_1.validateCsrfToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), sales_controller_1.createSalesReturn);
//Create Update Payment
router.post("/update-payment", authMiddleware_1.authenticateToken, csrfMiddleware_1.validateCsrfToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), sales_controller_1.create_update_payment);
//Read657812
router.get("/", authMiddleware_1.authenticateToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), sales_controller_1.read);
router.get("/return", authMiddleware_1.authenticateToken, (0, roleMiddleware_1.authorizeRoles)(["SUPERADMIN", "ADMIN"]), sales_controller_1.read_SalesReturn);
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
exports.default = router;
