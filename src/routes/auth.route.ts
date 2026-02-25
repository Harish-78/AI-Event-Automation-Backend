import { Router } from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/verify-email", authController.verifyEmail);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerification);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);


authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${frontendUrl()}/login?error=google_failed` }),
  authController.googleCallback
);

authRouter.post("/change-password", authenticate, authController.changePassword);
authRouter.get("/me", authenticate, authController.me);
authRouter.post("/logout", authController.logout);

export default authRouter;
