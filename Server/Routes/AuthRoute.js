import express from "express";
const router = express.Router();

// Auth routes
router.get("/", (req, res) => {
  res.json({ message: "Auth route working" });
});

export default router;
