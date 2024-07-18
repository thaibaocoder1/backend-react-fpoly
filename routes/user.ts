import express from "express";
import { userController } from "../app/controllers/UserController";
import { createMulterStorage } from "../middleware/multer";
const upload = createMulterStorage("public/uploads/account");

const router = express.Router();

router.post("/login", userController.login);
router.post("/register", userController.register);
router.post("/logout/:id", userController.logout);

router.post("/active", userController.active);
router.post("/forgot", userController.forgot);
router.post("/change", userController.reset);
router.post("/recover", userController.recover);
router.post("/confirm-recover", userController.confirm);

router.post("/create", upload.single("imageUrl"), userController.create);
router.patch("/update/:id", upload.single("imageUrl"), userController.update);
router.patch("/restore", userController.restore);
router.delete("/soft/:id", userController.softDelete);
router.delete("/:id", userController.delete);
router.patch("/update-fields/:id", userController.updateFields);
router.get("/trash", userController.trash);
router.get("/:id", userController.detail);
router.get("/", userController.index);

export default router;
