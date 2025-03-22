// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  files;
  executionLogs;
  userIdCounter;
  fileIdCounter;
  logIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.files = /* @__PURE__ */ new Map();
    this.executionLogs = /* @__PURE__ */ new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.logIdCounter = 1;
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByFirebaseUid(firebaseUid) {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }
  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const createdAt = /* @__PURE__ */ new Date();
    const user = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      firebaseUid: insertUser.firebaseUid || null,
      email: insertUser.email || null,
      displayName: insertUser.displayName || null,
      photoUrl: insertUser.photoUrl || null,
      createdAt
    };
    this.users.set(id, user);
    return user;
  }
  // File methods
  async getFile(id) {
    return this.files.get(id);
  }
  async getFilesByUserId(userId) {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }
  async createFile(insertFile) {
    const id = this.fileIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const file = {
      id,
      userId: insertFile.userId,
      name: insertFile.name,
      content: insertFile.content || null,
      path: insertFile.path || "/",
      type: insertFile.type,
      createdAt: now,
      updatedAt: now
    };
    this.files.set(id, file);
    return file;
  }
  async updateFile(id, updates) {
    const file = this.files.get(id);
    if (!file) return void 0;
    const updatedFile = {
      ...file,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  async deleteFile(id) {
    return this.files.delete(id);
  }
  // Execution log methods
  async createExecutionLog(insertLog) {
    const id = this.logIdCounter++;
    const executedAt = /* @__PURE__ */ new Date();
    const log2 = {
      id,
      userId: insertLog.userId,
      code: insertLog.code,
      fileId: insertLog.fileId || null,
      output: insertLog.output || null,
      error: insertLog.error || null,
      executedAt
    };
    this.executionLogs.set(id, log2);
    return log2;
  }
  async getExecutionLogsByUserId(userId) {
    return Array.from(this.executionLogs.values()).filter(
      (log2) => log2.userId === userId
    );
  }
};
var storage = new MemStorage();

// server/routes.ts
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
var execAsync = promisify(exec);
async function registerRoutes(app2) {
  app2.post("/api/execute", async (req, res) => {
    try {
      const { code, userId } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: "No code provided" });
      }
      const tempDir = path.join(process.cwd(), "temp_python_executions");
      await fs.mkdir(tempDir, { recursive: true });
      const fileId = randomUUID();
      const pythonFile = path.join(tempDir, `${fileId}.py`);
      try {
        await fs.writeFile(pythonFile, code, "utf-8");
        try {
          await fs.access(pythonFile);
        } catch (fileError) {
          console.error("Error: Python file was not created:", pythonFile);
          return res.status(500).json({ success: false, error: "Failed to create Python script" });
        }
        console.log("Executing:", pythonFile);
        const pythonCommand = process.platform === "win32" ? "python" : "python3";
        const { stdout, stderr } = await execAsync(`${pythonCommand} "${pythonFile}"`, { timeout: 1e4 });
        if (userId) {
          try {
            await storage.createExecutionLog({
              userId,
              fileId: null,
              code,
              output: stdout,
              error: stderr || null
            });
          } catch (logError) {
            console.error("Error storing execution log:", logError);
          }
        }
        res.json({
          success: !stderr,
          output: stdout,
          error: stderr || null
        });
      } catch (execError) {
        console.error("Python execution error:", execError);
        res.json({
          success: false,
          output: "",
          error: execError.message || "Execution error occurred"
        });
      } finally {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
