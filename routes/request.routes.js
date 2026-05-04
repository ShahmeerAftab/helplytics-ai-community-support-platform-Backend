import express from "express";
import { createRequest, getRequests, getMyRequests, getRequestById, updateRequest, deleteRequest, addResponse, addHelper, markSolved } from "../controllers/requestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRequests);
router.post("/", protect, createRequest);
router.get("/my", protect, getMyRequests);
router.get("/:id", protect, getRequestById);
router.put("/:id", protect, updateRequest);
router.delete("/:id", protect, deleteRequest);
router.post("/:id/respond", protect, addResponse);
router.patch("/:id/help", protect, addHelper);
router.patch("/:id/solve", protect, markSolved);

export default router;
