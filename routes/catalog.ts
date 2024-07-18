import express from "express";
import { catalogController } from "../app/controllers/CatalogController";
import { createMulterStorage } from "../middleware/multer";

const upload = createMulterStorage("public/uploads/category");

const router = express.Router();

router.get("/:id", catalogController.detail);
router.patch("/:id", upload.single("imageUrl"), catalogController.update);
router.delete("/:id", catalogController.delete);
router.post("/save", upload.single("imageUrl"), catalogController.add);
router.get("/", catalogController.index);

export default router;
