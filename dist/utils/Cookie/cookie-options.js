"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_OPTIONS = void 0;
exports.COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Now typed correctly
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
    domain: undefined,
};
