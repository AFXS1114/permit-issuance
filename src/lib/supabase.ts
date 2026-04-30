import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BrokerInfo = {
  id: string;
  created_at: string;
  business_name: string;
  business_location: string;
  recipient_name: string;
  role: string;
  validity_start: string;
  validity_end: string;
  permit_id: string;
  user_id: string;
};

export type OutgoingRecord = {
  id: string;
  created_at: string;
  broker_id: string;
  issue_date: string;
  plate_no: string;
  driver_name: string;
  origin: string;
  destination: string;
  no_of_boxes: string;
  time_date: string;
  valid_until: string;
  remarks: string;
  user_id: string;
};
