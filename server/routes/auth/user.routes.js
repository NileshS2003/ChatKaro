import { Router } from "express";
import {
  forgotPasswordRequest,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetForgottenPassword,
  verifyEmail,
} from "../../controllers/auth/user.controllers.js";
import {
  verifyJWT,
  // verifyPermission,
} from "../../middlewares/auth.middlewares.js";
import "../../passport/index.js"; // import the passport config
import {
  userForgotPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  userResetForgottenPasswordValidator,
} from "../../validators/auth/user.validators.js";
import { validate } from "../../validators/validate.js";

const router = Router();

// Unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:verificationToken").get(verifyEmail);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(
    userResetForgottenPasswordValidator(),
    validate,
    resetForgottenPassword
  );

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);


export default router;
