"use strict";
// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import { PrismaClient, User } from "@prisma/client";
// import expressAsyncHandler from "express-async-handler";
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
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
exports.authenticateToken = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("[auth] → Entering authenticateToken middleware");
    // Get token from HTTP-only cookie
    const token = req.cookies.auth_token;
    console.log("[auth]   cookies:", req.cookies);
    if (!token) {
        console.log("[auth]   ✘ No token provided");
        throw new Error("Authentication failed: No token provided: UNAUTHORIZED");
    }
    console.log("[auth]   ✓ Token found");
    try {
        // Verify JWT signature and extract payload
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log("[auth]   ✓ JWT verified:", payload);
        // Fetch session from DB
        const session = yield prisma.session.findUnique({
            where: { id: payload.sessionId },
            include: {
                user: {
                    include: { role: true, stores: true, position: true },
                },
            },
        });
        console.log("[auth]   session lookup:", session);
        // Check session validity
        if (!session) {
            console.log("[auth]   ✘ No session record found");
        }
        else if (session.expires < new Date()) {
            console.log("[auth]   ✘ Session expired at", session.expires);
        }
        if (!session || session.expires < new Date()) {
            console.log("[auth]   → Clearing cookie due to invalid/expired session");
            res.clearCookie("auth_token", {
                httpOnly: true,
                path: "/",
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            });
            throw new Error("Session expired or invalid: SESSION_EXPIRED");
        }
        // Attach user info
        console.log("[auth]   ✓ Session valid, attaching user to request");
        req.user = session.user;
        req.user.roleName = session.user.role.name;
        req.user.storeNames = session.user.stores.map((s) => s.name);
        req.user.positionName = (_a = session.user.position) === null || _a === void 0 ? void 0 : _a.name;
        console.log("[auth] → Passing control to next()");
        next();
    }
    catch (error) {
        console.error("[auth]   JWT/session error:", error);
        console.log("[auth]   → Clearing cookie due to verification error");
        res.clearCookie("auth_token", {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        throw new Error("Unauthorized: Invalid token: INVALID_TOKEN");
    }
}));
