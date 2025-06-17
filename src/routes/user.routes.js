import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

const files = upload.fields([
  {
    name: "avatar",
    maxCount: 1
  },
  {
    name: "coverImage",
    maxCount: 1
  }
])

router.post("/register", files , registerUser)

router.post("/login", loginUser)

//secure route
router.post("/logout", verifyJWT, logoutUser)
router.post("/refresh-token", refreshAccessToken)

export default router;