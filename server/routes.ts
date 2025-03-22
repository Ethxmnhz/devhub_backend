import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/execute", async (req, res) => {
    try {
      const { code, userId } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, error: "No code provided" });
      }

      // ✅ Create temp directory if not exists
      const tempDir = path.join(process.cwd(), "temp_python_executions");
      await fs.mkdir(tempDir, { recursive: true });

      // ✅ Generate unique filename
      const fileId = randomUUID();
      const pythonFile = path.join(tempDir, `${fileId}.py`);

      try {
        // ✅ Write code to Python file
        await fs.writeFile(pythonFile, code, "utf-8");

        // ✅ Verify that file exists before execution
        try {
          await fs.access(pythonFile);
        } catch (fileError) {
          console.error("Error: Python file was not created:", pythonFile);
          return res.status(500).json({ success: false, error: "Failed to create Python script" });
        }

        console.log("Executing:", pythonFile);

        // ✅ Use absolute Python path for Windows/Linux compatibility
        const pythonCommand = process.platform === "win32" ? "python" : "python3";

        // ✅ Execute Python script with a timeout
        const { stdout, stderr } = await execAsync(`${pythonCommand} "${pythonFile}"`, { timeout: 10000 });

        // ✅ Store execution log (optional, if userId is provided)
        if (userId) {
          try {
            await storage.createExecutionLog({
              userId,
              fileId: null,
              code,
              output: stdout,
              error: stderr || null,
            });
          } catch (logError) {
            console.error("Error storing execution log:", logError);
          }
        }

        // ✅ Return execution result
        res.json({
          success: !stderr,
          output: stdout,
          error: stderr || null,
        });
      } catch (execError: any) {
        console.error("Python execution error:", execError);
        res.json({
          success: false,
          output: "",
          error: execError.message || "Execution error occurred",
        });
      } finally {
        // ✅ Ensure file is deleted after execution
        try {
          await fs.unlink(pythonFile);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      }
    } catch (error) {
      console.error("API execution error:", error);
      res.status(500).json({
        success: false,
        error: "Server error occurred during execution",
      });
    }
  });

  // ✅ Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
