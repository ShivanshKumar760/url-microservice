import { Router, type Request, type Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { publishLinkVisited } from "./publisher/publisher";
import pool from "@/poolConfig";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

interface CustomerRequest extends Request {
  user?: any;
}

function auth(req: CustomerRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized");

  req.user = jwt.verify(token, process.env.JWT_SECRET!);
  next();
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

router.post("/shorten", auth, async (req: CustomerRequest, res: Response) => {
  const { url } = req.body;
  const shortCode = generateCode();

  // Here you would save the code and URL to your database
  await pool.query(
    "INSERT INTO urls(user_id, original_url, short_code) VALUES($1,$2,$3)",
    [req.user.userId, url, shortCode]
  );

  res.json({ shortUrl: `http://localhost:3000/${shortCode}` });
});

router.post("/:code", async (req: Request, res: Response) => {
  const { code } = req.params;

  const result = await pool.query("SELECT * FROM urls WHERE short_code = $1", [
    code,
  ]);

  if (!result.rows.length) return res.status(404).send("Not found");

  await publishLinkVisited({
    event: "link_visited",
    original_url: result.rows[0].original_url,
    shortCode: code,
    ip: req.ip,
    timestamp: new Date(),
  });

  res.redirect(result.rows[0].original_url);
});

export default router;
