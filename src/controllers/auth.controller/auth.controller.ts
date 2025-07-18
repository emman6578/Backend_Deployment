import { successHandler } from "@utils/SuccessHandler/SuccessHandler";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";

//Services Imports
import { registerUser } from "@services/auth.services/register.service";
import { loginUser } from "@services/auth.services/login.service";
import { COOKIE_OPTIONS } from "@utils/Cookie/cookie-options";

export const register = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const user = req.body;
    const createdUser = await registerUser(user);
    if (!createdUser) {
      throw new Error("Error creating user.");
    }
    successHandler(createdUser, res, "POST", "User Created Successfully");
  }
);

export const login = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const authData = await loginUser(email, password);

    // Set JWT in HTTP-only cookie
    res.cookie("auth_token", authData.token, COOKIE_OPTIONS);

    // Return user data without the token
    successHandler(authData.user, res, "POST", "Login successful");
  }
);

export const logout = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // Clear the auth cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    successHandler(null, res, "POST", "Logout successful");
  }
);
