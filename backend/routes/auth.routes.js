import express from "express";
import customerRouter from "./customer.routes.js";

/**
 * Auth Routes (Alias for Customer Authentication routes)
 */
const router = express.Router();

router.use("/", customerRouter);

export default router;
