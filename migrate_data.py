import os
import re
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
load_dotenv('.env.local')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

SQL_FILE = 'old_tbl_outgoing_rec.sql'
BATCH_SIZE = 500

def get_broker_mapping():
    print("🔄 Fetching broker mapping from Supabase...")
    brokers = supabase.table('rec_brokers_info').select('id, recipient_name, business_name').execute()
    mapping = {}
    for b in brokers.data:
        # Map both names to ID for better matching
        mapping[b['recipient_name'].strip().upper()] = b['id']
        mapping[b['business_name'].strip().upper()] = b['id']
        # Also map without spaces for fuzzy matching
        mapping[b['recipient_name'].replace(' ', '').upper()] = b['id']
    return mapping

def parse_sql_line(line):
    # Regex to find values inside (id, 'name', 'plate', boxes, ...)
    # This handles escaped quotes and various data types
    pattern = re.compile(r"\((.*)\),?")
    match = pattern.search(line)
    if not match:
        return None
    
    # Split by comma but respect quotes
    raw_values = re.findall(r"'(?:''|[^'])*'|[^,]+", match.group(1))
    values = [v.strip().strip("'").replace("''", "'") for v in raw_values]
    
    if len(values) < 12:
        return None
        
    return {
        'old_id': values[0],
        'broker_name': values[1].upper(),
        'plate_no': values[2].upper(),
        'boxes': values[3],
        'specie': values[4].upper(),
        'ticket_no': values[5],
        'origin': values[6] if values[6] else 'PFDA-BFPC',
        'destination': values[7].upper(),
        'time_date': values[8],
        'p1': values[9],
        'p2': values[10],
        'p3': values[11]
    }

def format_remarks(p1, p2, p3):
    # Same logic as your frontend
    has_p2 = p2 and '--' not in p2 and p2 != '-' and p2 != ''
    has_p3 = p3 and '--' not in p3 and p3 != '-' and p3 != ''
    
    if not has_p2 and not has_p3:
        return "SOLO DRIVER ONLY"
    if not has_p3:
        return "2 PERSONS ARE IN THIS TRIP"
    return "3 PERSONS ARE IN THIS TRIP"

def migrate():
    broker_map = get_broker_mapping()
    records_to_insert = []
    total_processed = 0
    total_migrated = 0
    skipped_brokers = set()

    print(f"🚀 Starting migration from {SQL_FILE}...")

    with open(SQL_FILE, 'r', encoding='latin1') as f:
        for line in f:
            if not line.startswith('('):
                continue
                
            data = parse_sql_line(line)
            if not data:
                continue
            
            total_processed += 1
            
            # Find Broker ID
            broker_id = broker_map.get(data['broker_name'])
            if not broker_id:
                # Try fuzzy match (no spaces)
                broker_id = broker_map.get(data['broker_name'].replace(' ', ''))
            
            if not broker_id:
                skipped_brokers.add(data['broker_name'])
                continue

            # Convert Date (MM/DD/YYYY| ...) to (YYYY-MM-DD)
            try:
                date_str = data['time_date'].split('|')[0].strip()
                issue_date = datetime.strptime(date_str, '%m/%d/%Y').strftime('%Y-%m-%d')
            except:
                issue_date = datetime.now().strftime('%Y-%m-%d')

            records_to_insert.append({
                'broker_id': broker_id,
                'issue_date': issue_date,
                'plate_no': data['plate_no'],
                'driver_name': data['p1'].upper(),
                'origin': data['origin'],
                'destination': data['destination'],
                'no_of_boxes': str(data['boxes']),
                'time_date': data['time_date'].upper(),
                'remarks': format_remarks(data['p1'], data['p2'], data['p3']),
                'ticket_no': data['ticket_no'],
                'specie': data['specie']
            })

            # Batch Insert
            if len(records_to_insert) >= BATCH_SIZE:
                print(f"📦 Uploading batch... (Total Migrated: {total_migrated})")
                try:
                    supabase.table('rec_outgoing').insert(records_to_insert).execute()
                    total_migrated += len(records_to_insert)
                    records_to_insert = []
                except Exception as e:
                    print(f"❌ Batch error: {e}")
                    records_to_insert = []

        # Final batch
        if records_to_insert:
            supabase.table('rec_outgoing').insert(records_to_insert).execute()
            total_migrated += len(records_to_insert)

    print("\n✅ MIGRATION COMPLETE!")
    print(f"📊 Total Records in SQL: {total_processed}")
    print(f"🎉 Total Records Migrated: {total_migrated}")
    
    if skipped_brokers:
        print(f"⚠️ Skipped {len(skipped_brokers)} brokers (Names didn't match current records):")
        print(list(skipped_brokers)[:10], "...")

if __name__ == "__main__":
    migrate()
