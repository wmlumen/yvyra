/**
 * TypeScript definitions for the EnlaceHub server (JS with JSDoc).
 * These augment the Prisma-generated types.
 */

import type { Request, Response, NextFunction } from 'express';

// ============================================================
// Express extensions
// ============================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        workspaceId: string;
        role: string;
      };
      workspace?: {
        workspaceId: string;
        hostname: string;
      };
    }
  }
}

// ============================================================
// Agent System types
// ============================================================

export interface AgentStep {
  step: number;
  type: string;
  params: Record<string, unknown>;
}

export interface AgentStepResult {
  success: boolean;
  result: unknown;
  snapshot: {
    action: 'create' | 'update' | 'delete';
    entity: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    data?: unknown;
  } | null;
}

export interface AgentExecutionResult {
  status: 'running' | 'completed' | 'rolled_back' | 'failed';
  plan: AgentStep[];
  steps: (AgentStep & { result: AgentStepResult })[];
  audit: {
    score: number;
    verdict: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    details: { step: number; status: string; note: string }[];
  };
  rollback: {
    step: number;
    reverted: boolean;
    error?: string;
  }[] | null;
}

// ============================================================
// Validation schema types
// ============================================================

export type FieldType = 'string' | 'email' | 'url' | 'number' | 'boolean' | 'any' | 'string?' | 'number?';

export interface ValidationRule {
  type: FieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

export type ValidationSchema = Record<string, ValidationRule>;

// ============================================================
// AppError
// ============================================================

export class AppError extends Error {
  public status: number;
  public code?: string;
  constructor(message: string, status?: number, code?: string);
}
