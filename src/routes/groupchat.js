// routes/groupRoutes.js

import express from "express";
import {
  getGroups,
  getGroupBySlug,
  createGroup,
} from "../controllers/groupController.js";

const router = express.Router();

// 🔍 Filters + Search + Pagination
router.get("/", getGroups);

// 📄 Single group
router.get("/:slug", getGroupBySlug);

// ➕ Create
router.post("/", createGroup);

export default router;