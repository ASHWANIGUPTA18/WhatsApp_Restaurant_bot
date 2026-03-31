import { Router } from "express";
import { adminAuth } from "./auth.middleware.js";
import { adminRateLimiter } from "../middleware/rate-limiter.js";
import { menuController } from "./menu.controller.js";
import { orderController } from "./order.controller.js";
import { dashboardController } from "./dashboard.controller.js";

export const adminRouter = Router();

adminRouter.use(adminRateLimiter);
adminRouter.use(adminAuth);

adminRouter.use("/menu", menuController);
adminRouter.use("/orders", orderController);
adminRouter.use("/dashboard", dashboardController);
