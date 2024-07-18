import express from "express";
import { productController } from "../app/controllers/ProductController";
import { createMulterStorage } from "../middleware/multer";

const upload = createMulterStorage("public/uploads/product");
const router = express.Router();

router.post("/save", upload.array("imageUrl", 5), productController.add);
router.post("/review", productController.addReview);
router.patch(
  "/update/:id",
  upload.array("imageUrl", 5),
  productController.update
);
router.patch("/update-fields", productController.updateField);
router.get("/list/:id", productController.listRelated);
router.get("/all", productController.list);
router.get("/:id", productController.detail);
router.get("/", productController.index);

export default router;
