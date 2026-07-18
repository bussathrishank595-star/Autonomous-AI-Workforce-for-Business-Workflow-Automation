# Deployment Guide

This document describes how to deploy AgentOS to Vercel and connect Supabase database pipelines.

## Supabase Settings
1. Create a new PostgreSQL database on Supabase.
2. Enable `pgvector` inside the SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## Vercel Deployment
1. Connect your Github repository to Vercel.
2. Configure the required environment variables:
   - `DATABASE_URL` (Supabase Connection Pooler URI)
   - `GROQ_API_KEY` (Llama-3 API Key)
   - `VOYAGE_API_KEY` (Voyage AI API Key)
   - `NEXTAUTH_SECRET` (JWT session encoder secret)
   - `NEXTAUTH_URL` (Deployment URL)
   - `GOOGLE_CLIENT_ID` (Google OAuth Client ID)
   - `GOOGLE_CLIENT_SECRET` (Google OAuth Client Secret)
   - `GOOGLE_REDIRECT_URI` (Callback URL redirection)
3. Set the build command:
   ```bash
   prisma generate && next build
   ```
