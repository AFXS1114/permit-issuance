import os
import re
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

SQL_FILE = 'old_tbl_outgoing_rec.sql'

def analyze_missing():
    print("--- Fetching current brokers...")
    brokers = supabase.table('rec_brokers_info').select('recipient_name, business_name').execute()
    existing = set()
    for b in brokers.data:
        existing.add(b['recipient_name'].strip().upper())
        existing.add(b['business_name'].strip().upper())
        # Add a version without spaces for fuzzy matching
        existing.add(b['recipient_name'].replace(' ', '').upper())
        existing.add(b['business_name'].replace(' ', '').upper())

    missing_counts = {}
    
    print(f"--- Analyzing {SQL_FILE}...")
    with open(SQL_FILE, 'r', encoding='latin1') as f:
        for line in f:
            if not line.startswith('('):
                continue
            
            # Simple split to get the broker name (it's the second value)
            parts = line.split("'")
            if len(parts) < 2:
                continue
                
            name = parts[1].strip().upper()
            
            if name and name not in existing and name.replace(' ', '') not in existing:
                missing_counts[name] = missing_counts.get(name, 0) + 1

    # Sort by number of records affected (highest first)
    sorted_missing = sorted(missing_counts.items(), key=lambda x: x[1], reverse=True)
    
    print("\n" + "="*50)
    print(f"{'MISSING BROKER NAME':<40} | {'RECORDS'}")
    print("="*50)
    for name, count in sorted_missing:
        # Clean non-ascii characters for terminal display
        safe_name = "".join(i for i in name if ord(i) < 128)
        print(f"{safe_name:<40} | {count}")
    print("="*50)
    print(f"Total Unique Missing Brokers: {len(sorted_missing)}")

if __name__ == "__main__":
    analyze_missing()
