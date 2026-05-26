-- DevSchool Pro - Database Schema Setup
-- Run this in your Supabase SQL Editor to make everything fully working.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'STUDENT',
  isVerified BOOLEAN DEFAULT false,
  verificationOtp TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT UNIQUE,
  avatar TEXT,
  bio TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Wallets Table (Reward Points)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  walletId UUID REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL, -- 'CREDIT' or 'DEBIT'
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Courses & Enrollments
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  courseId TEXT REFERENCES courses(id),
  progress INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helper: Function to handle new user creation automatically (optional but good)
-- For now, the backend handles insertion manually.
