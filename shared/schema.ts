import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firebaseUid: varchar("firebase_uid", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  displayName: varchar("display_name", { length: 255 }),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Files schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content"),
  path: varchar("path", { length: 255 }).notNull().default('/'),
  type: varchar("type", { length: 20 }).notNull(), // 'file' or 'folder'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Python execution logs
export const executionLogs = pgTable("execution_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileId: integer("file_id").references(() => files.id),
  code: text("code").notNull(),
  output: text("output"),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  photoUrl: true,
  firebaseUid: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  userId: true,
  name: true,
  content: true,
  path: true,
  type: true,
});

export const insertExecutionLogSchema = createInsertSchema(executionLogs).pick({
  userId: true,
  fileId: true,
  code: true,
  output: true,
  error: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type ExecutionLog = typeof executionLogs.$inferSelect;
