"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const SuccessHandler_1 = require("@utils/SuccessHandler/SuccessHandler");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
//Services Imports
const register_service_1 = require("@services/auth.services/register.service");
const login_service_1 = require("@services/auth.services/login.service");
const cookie_options_1 = require("@utils/Cookie/cookie-options");
exports.register = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body;
    const createdUser = yield (0, register_service_1.registerUser)(user);
    if (!createdUser) {
        throw new Error("Error creating user.");
    }
    (0, SuccessHandler_1.successHandler)(createdUser, res, "POST", "User Created Successfully");
}));
exports.login = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const authData = yield (0, login_service_1.loginUser)(email, password);
    // Set JWT in HTTP-only cookie
    res.cookie("auth_token", authData.token, cookie_options_1.COOKIE_OPTIONS);
    // Return user data without the token
    (0, SuccessHandler_1.successHandler)(authData.user, res, "POST", "Login successful");
}));
exports.logout = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Clear the auth cookie
    res.clearCookie("auth_token", {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    (0, SuccessHandler_1.successHandler)(null, res, "POST", "Logout successful");
}));
