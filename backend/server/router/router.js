import {
  addNewsController,
  getNewsController,
  searchController,
} from "../controller/newsController.js";
import express from "express";

const router = express.Router();

router.post("/news", addNewsController);
router.get("/search", searchController);
router.get("/news", getNewsController);

export default router;
