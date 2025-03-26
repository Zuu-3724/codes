import { mysql } from "../db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptPassword() {
  return new Promise((resolve) => {
    rl.question("Enter admin password: ", (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function createAdmin() {
  try {
    console.log("Connecting to MySQL...");

    // Get password from user input
    const password = await promptPassword();

    // Validate password strength
    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters long");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await mysql.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["admin", hashedPassword, "Admin"]
    );

    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
