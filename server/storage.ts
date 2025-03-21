import { 
  User, 
  InsertUser, 
  File, 
  InsertFile, 
  ExecutionLog, 
  InsertExecutionLog 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<Omit<InsertFile, "userId">>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  getExecutionLogsByUserId(userId: number): Promise<ExecutionLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private executionLogs: Map<number, ExecutionLog>;
  private userIdCounter: number;
  private fileIdCounter: number;
  private logIdCounter: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.executionLogs = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.logIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
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
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFilesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId,
    );
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = { 
      id, 
      userId: insertFile.userId,
      name: insertFile.name,
      content: insertFile.content || null,
      path: insertFile.path || '/',
      type: insertFile.type,
      createdAt: now, 
      updatedAt: now
    };
    this.files.set(id, file);
    return file;
  }
  
  async updateFile(id: number, updates: Partial<Omit<InsertFile, "userId">>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile: File = { 
      ...file, 
      ...updates, 
      updatedAt: new Date()
    };
    
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
  
  // Execution log methods
  async createExecutionLog(insertLog: InsertExecutionLog): Promise<ExecutionLog> {
    const id = this.logIdCounter++;
    const executedAt = new Date();
    const log: ExecutionLog = { 
      id, 
      userId: insertLog.userId,
      code: insertLog.code,
      fileId: insertLog.fileId || null,
      output: insertLog.output || null,
      error: insertLog.error || null,
      executedAt 
    };
    this.executionLogs.set(id, log);
    return log;
  }
  
  async getExecutionLogsByUserId(userId: number): Promise<ExecutionLog[]> {
    return Array.from(this.executionLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }
}

export const storage = new MemStorage();
