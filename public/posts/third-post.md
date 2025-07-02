---
title: "My Third Post"
date: "2025-06-20"
slug: "third-post"
tags: ["typescript", "node", "backend"]
description: "Deep dive into backend development with Node.js and TypeScript."
---

# Building Scalable Backend Systems with Node.js and TypeScript

In this comprehensive guide, we'll explore how to build robust, scalable backend systems using Node.js and TypeScript. We'll cover everything from project setup to advanced patterns and deployment strategies.

## Table of Contents

1. [Project Setup and Architecture](#setup)
2. [Database Design and ORM](#database)
3. [API Design and Implementation](#api)
4. [Authentication and Authorization](#auth)
5. [Testing Strategies](#testing)
6. [Performance and Scalability](#performance)
7. [Deployment and DevOps](#deployment)

## Project Setup and Architecture {#setup}

Let's start by setting up a well-structured Node.js project with TypeScript.

### Project Structure

```
src/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── types/
├── config/
└── tests/
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Express Server Setup

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/posts', postRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await connectDatabase();
      
      this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

export default Server;
```

## Database Design and ORM {#database}

We'll use Prisma as our ORM for type-safe database operations.

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  firstName String?
  lastName  String?
  avatar    String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  comments  Comment[]
  likes     Like[]
  sessions  Session[]

  @@map("users")
}

model Post {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  content     String
  excerpt     String?
  coverImage  String?
  status      PostStatus  @default(DRAFT)
  tags        String[]
  readTime    Int?
  viewCount   Int         @default(0)
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  authorId    String
  author      User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  comments    Comment[]
  likes       Like[]
  categories  PostCategory[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  isApproved Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@map("comments")
}

model Category {
  id          String @id @default(cuid())
  name        String @unique
  slug        String @unique
  description String?
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       PostCategory[]

  @@map("categories")
}

model PostCategory {
  postId     String
  categoryId String
  
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
  @@map("post_categories")
}

model Like {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("likes")
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Database Service Layer

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    this.setupEventListeners();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private setupEventListeners(): void {
    this.prisma.$on('query', (e) => {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Duration: ${e.duration}ms`);
    });

    this.prisma.$on('error', (e) => {
      logger.error('Database error:', e);
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Database disconnected');
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export const prisma = databaseService.getClient();
```

## API Design and Implementation {#api}

Let's implement a RESTful API with proper error handling and validation.

### Base Controller

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors';
import { ApiResponse } from '../types/api';

export abstract class BaseController {
  protected validateRequest(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }
  }

  protected sendResponse<T>(
    res: Response,
    statusCode: number,
    data?: T,
    message?: string
  ): void {
    const response: ApiResponse<T> = {
      success: statusCode < 400,
      message: message || 'Success',
      data
    };

    if (statusCode >= 400) {
      delete response.data;
    }

    res.status(statusCode).json(response);
  }

  protected sendError(
    res: Response,
    statusCode: number,
    message: string,
    errors?: any[]
  ): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      errors
    };

    res.status(statusCode).json(response);
  }

  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
```

### User Controller

```typescript
import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserService } from '../services/UserService';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../types/user';
import { AuthenticatedRequest } from '../types/auth';

export class UserController extends BaseController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  public getUsers = this.asyncHandler(async (req: Request, res: Response) => {
    this.validateRequest(req);
    
    const query: UserQueryDto = req.query;
    const users = await this.userService.getUsers(query);
    
    this.sendResponse(res, 200, users, 'Users retrieved successfully');
  });

  public getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);
    
    if (!user) {
      this.sendError(res, 404, 'User not found');
      return;
    }
    
    this.sendResponse(res, 200, user, 'User retrieved successfully');
  });

  public createUser = this.asyncHandler(async (req: Request, res: Response) => {
    this.validateRequest(req);
    
    const userData: CreateUserDto = req.body;
    const user = await this.userService.createUser(userData);
    
    this.sendResponse(res, 201, user, 'User created successfully');
  });

  public updateUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    this.validateRequest(req);
    
    const { id } = req.params;
    const updateData: UpdateUserDto = req.body;
    
    // Check if user can update this profile
    if (req.user?.id !== id && req.user?.role !== 'ADMIN') {
      this.sendError(res, 403, 'Forbidden: Cannot update other user\'s profile');
      return;
    }
    
    const user = await this.userService.updateUser(id, updateData);
    
    if (!user) {
      this.sendError(res, 404, 'User not found');
      return;
    }
    
    this.sendResponse(res, 200, user, 'User updated successfully');
  });

  public deleteUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Check if user can delete this profile
    if (req.user?.id !== id && req.user?.role !== 'ADMIN') {
      this.sendError(res, 403, 'Forbidden: Cannot delete other user\'s profile');
      return;
    }
    
    const deleted = await this.userService.deleteUser(id);
    
    if (!deleted) {
      this.sendError(res, 404, 'User not found');
      return;
    }
    
    this.sendResponse(res, 200, null, 'User deleted successfully');
  });

  public getUserProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      this.sendError(res, 401, 'Unauthorized');
      return;
    }
    
    const user = await this.userService.getUserById(userId);
    this.sendResponse(res, 200, user, 'Profile retrieved successfully');
  });
}
```

### Service Layer

```typescript
import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../types/user';
import { ApiError } from '../utils/errors';
import { hashPassword } from '../utils/auth';
import { logger } from '../utils/logger';

export class UserService {
  async getUsers(query: UserQueryDto): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;
    
    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true,
              comments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true
          }
        }
      }
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username }
    });
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      throw new ApiError(409, 'User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    try {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info(`User created: ${user.id}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new ApiError(500, 'Failed to create user');
    }
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User | null> {
    // Check if user exists
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    // Check for email/username conflicts
    if (updateData.email || updateData.username) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updateData.email ? [{ email: updateData.email }] : []),
                ...(updateData.username ? [{ username: updateData.username }] : [])
              ]
            }
          ]
        }
      });

      if (conflictUser) {
        throw new ApiError(409, 'Email or username already in use');
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info(`User updated: ${user.id}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new ApiError(500, 'Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });

      logger.info(`User deleted: ${id}`);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // User not found
        }
      }
      logger.error('Error deleting user:', error);
      throw new ApiError(500, 'Failed to delete user');
    }
  }
}
```

## Authentication and Authorization {#auth}

Implementing secure authentication with JWT tokens and role-based access control.

### JWT Service

```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { ApiError } from '../utils/errors';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = config.jwt.accessTokenSecret;
    this.refreshTokenSecret = config.jwt.refreshTokenSecret;
    this.accessTokenExpiry = config.jwt.accessTokenExpiry;
    this.refreshTokenExpiry = config.jwt.refreshTokenExpiry;
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid access token');
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }
}

export const jwtService = new JWTService();
```

### Authentication Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/JWTService';
import { UserService } from '../services/UserService';
import { ApiError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/auth';

const userService = new UserService();

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    // Get user from database
    const user = await userService.getUserById(payload.userId);
    
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);
      const user = await userService.getUserById(payload.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't throw errors
    next();
  }
};
```

## Testing Strategies {#testing}

Comprehensive testing ensures code quality and reliability.

### Unit Tests

```typescript
import { UserService } from '../services/UserService';
import { prisma } from '../config/database';
import { ApiError } from '../utils/errors';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

describe('UserService', () => {
  let userService: UserService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object)
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const createdUser = {
        id: '2',
        ...userData,
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existing',
        password: 'password123'
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        username: 'existing'
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(ApiError);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import { jwtService } from '../services/JWTService';

describe('User API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN'
      }
    });

    testUserId = testUser.id;

    // Generate auth token
    authToken = jwtService.generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testUserId);
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', newUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 400 for invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        username: '',
        password: '123' // too short
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
```

## Performance and Scalability {#performance}

Optimizing backend performance for high-traffic applications.

### Caching Strategy

```typescript
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

class CacheService {
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}

export const cacheService = new CacheService();

// Cache decorator
export function Cache(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = cacheService.generateKey(
        target.constructor.name,
        propertyName,
        ...args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      );

      // Try to get from cache
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult !== null) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedResult;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, ttl);
      logger.debug(`Cache set for key: ${cacheKey}`);

      return result;
    };
  };
}
```

### Database Optimization

```typescript
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class OptimizedPostService {
  // Use database indexes for better performance
  @Cache(1800) // 30 minutes cache
  async getPopularPosts(limit: number = 10): Promise<any[]> {
    return prisma.post.findMany({
      take: limit,
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date()
        }
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        viewCount: true,
        readTime: true,
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });
  }

  // Batch operations for better performance
  async incrementViewCounts(postIds: string[]): Promise<void> {
    await prisma.$transaction(
      postIds.map(id =>
        prisma.post.update({
          where: { id },
          data: {
            viewCount: {
              increment: 1
            }
          }
        })
      )
    );
  }

  // Efficient pagination with cursor-based approach
  async getPostsCursor(
    cursor?: string,
    limit: number = 10,
    filters?: {
      authorId?: string;
      categoryId?: string;
      tags?: string[];
    }
  ): Promise<{
    posts: any[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const whereClause: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date()
      },
      ...(filters?.authorId && { authorId: filters.authorId }),
      ...(filters?.categoryId && {
        categories: {
          some: {
            categoryId: filters.categoryId
          }
        }
      }),
      ...(filters?.tags && {
        tags: {
          hasSome: filters.tags
        }
      })
    };

    const posts = await prisma.post.findMany({
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1 // Skip the cursor
      }),
      where: whereClause,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        readTime: true,
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    const hasMore = posts.length > limit;
    const returnPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? returnPosts[returnPosts.length - 1].id : undefined;

    return {
      posts: returnPosts,
      nextCursor,
      hasMore
    };
  }
}
```

## Deployment and DevOps {#deployment}

Setting up CI/CD pipelines and production deployment.

### Docker Configuration

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start the application
CMD ["npm", "start"]
```

### GitHub Actions CI/CD

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run tests
        run: npm run test:coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_ACCESS_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment script here
          # This could be AWS ECS, Kubernetes, or other deployment targets
```

## Conclusion

Building scalable backend systems requires careful attention to architecture, performance, security, and maintainability. Key takeaways:

- **TypeScript** provides type safety and better developer experience
- **Proper layering** (Controller → Service → Repository) separates concerns
- **Database optimization** with indexes, caching, and efficient queries
- **Comprehensive testing** ensures reliability and confidence in changes
- **Security best practices** protect against common vulnerabilities
- **Monitoring and logging** help identify and resolve issues quickly

This foundation provides a robust starting point for building production-ready backend systems that can scale with your application's growth.

Remember to continuously monitor performance, gather user feedback, and iterate on your architecture as requirements evolve.

Happy coding! 🚀
