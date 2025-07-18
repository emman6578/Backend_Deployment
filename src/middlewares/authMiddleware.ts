import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";
import expressAsyncHandler from "express-async-handler";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface AuthRequest extends Request {
  user?: User & {
    roleName?: string;
    storeNames?: string[];
    positionName?: string;
  };
  prisma?: PrismaClient;
}

export const authenticateToken = expressAsyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get token from HTTP-only cookie instead of Authorization header
    const token = req.cookies.auth_token;

    if (!token) {
      throw new Error("Authentication failed: No token provided: UNAUTHORIZED");
    }

    // Decode JWT token
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        sessionId: number;
        userId: string;
        role: string;
      };

      // Verify session exists and is valid
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: {
          user: {
            include: {
              role: true,
              stores: true,
              position: true,
            },
          },
        },
      });

      if (!session || session.expires < new Date()) {
        // Clear the invalid cookie
        res.clearCookie("auth_token", {
          httpOnly: true,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        throw new Error("Session expired or invalid: SESSION_EXPIRED");
      }

      // Attach user to request with formatted data
      req.user = session.user;
      req.user.roleName = session.user.role.name;
      req.user.storeNames = session.user.stores.map((store) => store.name);
      req.user.positionName = session.user.position?.name;

      next();
    } catch (error) {
      console.error("JWT verification error:", error); // Debug log

      // Clear the invalid cookie
      res.clearCookie("auth_token", {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      throw new Error("Unauthorized: Invalid token: INVALID_TOKEN");
    }
  }
);

// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import { PrismaClient, User } from "@prisma/client";
// import expressAsyncHandler from "express-async-handler";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET;

// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET environment variable is required");
// }

// export interface AuthRequest extends Request {
//   user?: User & {
//     roleName?: string;
//     storeNames?: string[];
//     positionName?: string;
//   };
//   prisma?: PrismaClient;
// }

// export const authenticateToken = expressAsyncHandler(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     console.log("[auth] → Entering authenticateToken middleware");

//     // Get token from HTTP-only cookie
//     const token = req.cookies.auth_token;
//     console.log("[auth]   cookies:", req.cookies);

//     if (!token) {
//       console.log("[auth]   ✘ No token provided");
//       throw new Error("Authentication failed: No token provided: UNAUTHORIZED");
//     }
//     console.log("[auth]   ✓ Token found");

//     try {
//       // Verify JWT signature and extract payload
//       const payload = jwt.verify(token, JWT_SECRET) as {
//         sessionId: number;
//         userId: string;
//         role: string;
//       };
//       console.log("[auth]   ✓ JWT verified:", payload);

//       // Fetch session from DB
//       const session = await prisma.session.findUnique({
//         where: { id: payload.sessionId },
//         include: {
//           user: {
//             include: { role: true, stores: true, position: true },
//           },
//         },
//       });
//       console.log("[auth]   session lookup:", session);

//       // Check session validity
//       if (!session) {
//         console.log("[auth]   ✘ No session record found");
//       } else if (session.expires < new Date()) {
//         console.log("[auth]   ✘ Session expired at", session.expires);
//       }

//       if (!session || session.expires < new Date()) {
//         console.log(
//           "[auth]   → Clearing cookie due to invalid/expired session"
//         );
//         res.clearCookie("auth_token", {
//           httpOnly: true,
//           path: "/",
//           secure: process.env.NODE_ENV === "production",
//           sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//         });
//         throw new Error("Session expired or invalid: SESSION_EXPIRED");
//       }

//       // Attach user info
//       console.log("[auth]   ✓ Session valid, attaching user to request");
//       req.user = session.user;
//       req.user.roleName = session.user.role.name;
//       req.user.storeNames = session.user.stores.map((s) => s.name);
//       req.user.positionName = session.user.position?.name;

//       console.log("[auth] → Passing control to next()");
//       next();
//     } catch (error) {
//       console.error("[auth]   JWT/session error:", error);

//       console.log("[auth]   → Clearing cookie due to verification error");
//       res.clearCookie("auth_token", {
//         httpOnly: true,
//         path: "/",
//         secure: process.env.NODE_ENV === "production",
//         sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       });

//       throw new Error("Unauthorized: Invalid token: INVALID_TOKEN");
//     }
//   }
// );
