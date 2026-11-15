-- Migration: 001_otp_attempts.sql
-- Add otp_attempts column to users table to support attempt limiting (max 5 attempts per 2FA code)
ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0;
