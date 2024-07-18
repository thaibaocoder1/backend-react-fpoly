import express from "express";
import { detailController } from "../app/controllers/DetailController";

const router = express.Router();

router.get("/statistical", detailController.statistical);
router.post("/save", detailController.add);
router.get("/:id", detailController.index);
router.get("/", detailController.list);

export default router;
