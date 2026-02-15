import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "@/poolConfig";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
// const jwtSecret = process.env.JWT_SECRET || ""; //or instead of giving
//a default empty string value we can check jwtSecret! which tells typescript that we are sure that jwtSecret will not be undefined

const jwtSecret = process.env.JWT_SECRET;

router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );

    const userId = result.rows[0].id;
    return res
      .status(201)
      .json({ message: "User registered successfully", userId });
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret!, {
      expiresIn: "1h",
    });

    return res.json({ token });
  } catch (error) {
    console.log(error);
  }
});

export default router;
