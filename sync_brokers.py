import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EXCEL_FILE = 'list of broker and viajero for ai.xlsx'

def sync_brokers():
    print(f"--- Reading data from {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE)
    
    # Fill NaN values with empty strings
    df = df.fillna('')

    print("--- Fetching current brokers from Supabase...")
    existing_brokers = supabase.table('rec_brokers_info').select('id, recipient_name').execute()
    # Create mapping of Name -> ID
    broker_map = {b['recipient_name'].strip().upper(): b['id'] for b in existing_brokers.data}

    total_updated = 0
    total_inserted = 0

    print("--- Syncing records...")
    for index, row in df.iterrows():
        name = str(row['Name']).strip().upper()
        if not name:
            continue
            
        broker_data = {
            'recipient_name': name,
            'business_name': str(row['Business Name']).upper(),
            'business_location': str(row['Business Location']).upper(),
            'role': str(row['Role']).upper(),
            'validity_start': str(row['Validity Start']),
            'validity_end': str(row['Validity End']),
            'permit_id': str(row['permit id']).upper()
        }

        existing_id = broker_map.get(name)

        if existing_id:
            # UPDATE existing broker (only dates and permit id as requested)
            try:
                supabase.table('rec_brokers_info').update({
                    'validity_start': broker_data['validity_start'],
                    'validity_end': broker_data['validity_end'],
                    'permit_id': broker_data['permit_id']
                }).eq('id', existing_id).execute()
                total_updated += 1
            except Exception as e:
                print(f"!!! Error updating {name}: {e}")
        else:
            # INSERT new broker
            try:
                supabase.table('rec_brokers_info').insert(broker_data).execute()
                total_inserted += 1
            except Exception as e:
                print(f"!!! Error inserting {name}: {e}")

    print("\nDONE: SYNC COMPLETE!")
    print(f"--- Total Records Updated: {total_updated}")
    print(f"--- Total Records Inserted: {total_inserted}")

if __name__ == "__main__":
    sync_brokers()
