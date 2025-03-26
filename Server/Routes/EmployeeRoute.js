import express from "express";
const router = express.Router();

// Employee routes
router.get("/", (req, res) => {
  res.json({ message: "Employee route working" });
});

export default router;
