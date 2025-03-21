import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExecutionLogSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  // Python code execution endpoint
  app.post("/api/execute", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ success: false, error: "No code provided" });
      }
      
      // Create a temporary directory for execution
      const tempDir = path.join(process.cwd(), "temp_python_executions");
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (error) {
        console.error("Error creating temp directory:", error);
      }
      
      // Create a temporary Python file
      const fileId = randomUUID();
      const pythonFile = path.join(tempDir, `${fileId}.py`);
      
      try {
        // Write code to file
        await fs.writeFile(pythonFile, code);
        
        // Execute Python code
        const { stdout, stderr } = await execAsync(`python ${pythonFile}`, {
          timeout: 10000, // 10 second timeout for execution
        });
        
        // Store execution log (if a user is authenticated)
        if (req.body.userId) {
          try {
            await storage.createExecutionLog({
              userId: req.body.userId,
              fileId: null, // This could be set if we're tracking the file in our DB
              code,
              output: stdout,
              error: stderr || null,
            });
          } catch (logError) {
            console.error("Error storing execution log:", logError);
          }
        }
        
        // Return execution result
        res.json({
          success: !stderr,
          output: stdout,
          error: stderr || null,
        });
      } catch (execError: any) {
        console.error("Python execution error:", execError);
        
        // Handle execution error
        res.json({
          success: false,
          output: "",
          error: execError.message || "Execution error occurred",
        });
      } finally {
        // Clean up the temporary file
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
        error: "Server error occurred during execution" 
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
