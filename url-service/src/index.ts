import express from "express";
import pool from "./poolConfig";
import urlRouter from "./service/urlservice";
import authRouter from "./service/authservice";
import { connectRabbit } from "./service/amqp/amqp";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/", urlRouter);
const initializeDatabase = async () => {
  await pool.connect();
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS urls (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            original_url TEXT NOT NULL,
            short_code VARCHAR(10) UNIQUE NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS url_counts (
            id SERIAL PRIMARY KEY,
            original_url TEXT NOT NULL,
            short_code VARCHAR(10) UNIQUE NOT NULL,
            visit_count INTEGER DEFAULT 0,
            last_visited TIMESTAMP NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS url_metadata (
            id SERIAL PRIMARY KEY,
            original_url TEXT NOT NULL,
            short_code VARCHAR(10) UNIQUE NOT NULL,
            ip VARCHAR(45) NOT NULL
        );
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

const startServer = async () => {
  try {
    initializeDatabase();
    console.log("Connected to PostgreSQL");
    await connectRabbit();
    console.log("Connected to RabbitMQ");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
