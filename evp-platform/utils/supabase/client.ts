'use client';
import { createBrowserClient } from '@supabase/ssr';
import { SUPA_URL, SUPA_ANON } from './config';
export function createClient() { return createBrowserClient(SUPA_URL, SUPA_ANON); }
