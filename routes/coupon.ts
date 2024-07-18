import express from "express";
import { couponController } from "../app/controllers/CouponController";

const router = express.Router();

router.delete("/:id", couponController.delete);
router.patch("/:id", couponController.update);
router.post("/save", couponController.add);
router.post("/check", couponController.check);
router.get("/:id", couponController.detail);
router.get("/", couponController.index);

export default router;
