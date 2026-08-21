import sys
import os
import json
import time
import subprocess
import urllib.request

def main():
    csv_file = os.path.abspath('../backend/uploads/file-1787350314690-82514903.csv')
    print(f"Target CSV file: {csv_file}")

    # Start FastAPI server in background
    # Using sys.executable to run inside the same venv
    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000", "--host", "127.0.0.1"]
    print("Starting uvicorn server...")
    proc = subprocess.Popen(cmd, cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    # Wait for server to start up
    time.sleep(2.0)

    try:
        # Perform HTTP POST request to /profile
        url = "http://127.0.0.1:8000/profile"
        payload = {"file_path": csv_file}
        headers = {"Content-Type": "application/json"}
        
        print("\nSending POST request to /profile...")
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            res_json = json.loads(res_data)
            print("\nResponse Status:", response.status)
            print("Response Payload:")
            print(json.dumps(res_json, indent=2))
            
    except Exception as e:
        print(f"Error during API call: {e}")
    finally:
        print("\nStopping uvicorn server...")
        proc.terminate()
        proc.wait()
        print("Server stopped.")

if __name__ == '__main__':
    main()
