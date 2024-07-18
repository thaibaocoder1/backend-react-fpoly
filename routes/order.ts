import express from "express";
import { orderController } from "../app/controllers/OrderController";

const router = express.Router();

router.post("/save", orderController.add);
router.post("/create-checkout-session", orderController.session);
router.patch("/update/:id", orderController.updateFields);
router.get("/invoice/:id", orderController.invoice);
router.get("/:id", orderController.detail);
router.get("/user/:id", orderController.order);
router.get("/", orderController.index);

export default router;
