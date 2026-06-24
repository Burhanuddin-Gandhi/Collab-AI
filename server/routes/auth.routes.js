const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile} = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");


router.get("/me", protect, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user
  });
});

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);       
router.put("/profile", protect, updateProfile);    


module.exports = router;
