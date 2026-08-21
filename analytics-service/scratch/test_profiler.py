import sys
import os
import json

# Add analytics-service root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.analyzers.profiler import profile_dataset

def main():
    csv_file = '../backend/uploads/file-1787350314690-82514903.csv'
    
    print("--- Profiling CSV File ---")
    if os.path.exists(csv_file):
        try:
            csv_profile = profile_dataset(csv_file)
            print(json.dumps(csv_profile, indent=2))
        except Exception as e:
            print(f"Error profiling CSV: {e}")
    else:
        print(f"CSV file not found at: {csv_file}")

    json_file = '../backend/uploads/file-1787350314708-573240293.json'
    print("\n--- Profiling JSON File (Expect error since format is unsupported) ---")
    if os.path.exists(json_file):
        try:
            json_profile = profile_dataset(json_file)
            print(json.dumps(json_profile, indent=2))
        except Exception as e:
            print(f"Expected error received: {e}")
    else:
        print(f"JSON file not found at: {json_file}")

if __name__ == '__main__':
    main()
