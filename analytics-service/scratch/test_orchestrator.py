import pandas as pd
import json

from app.services.analysis_services import analyze_dataset

def main():
    # Create a dummy dataset
    data = {
        'date': pd.date_range(start='2023-01-01', periods=10, freq='D'),
        'sales': [100, 110, 105, 120, 130, 90, 140, 150, 160, 200],
        'customers': [10, 12, 11, 14, 15, 9, 16, 17, 18, 25],
        'category': ['A', 'A', 'B', 'B', 'A', 'C', 'B', 'A', 'C', 'B']
    }
    df = pd.DataFrame(data)
    
    print("Running orchestrator...")
    results = analyze_dataset(df)
    
    # Check if results generated without error
    print("Orchestrator finished successfully!")
    print("\nKeys generated:")
    for k in results.keys():
        print(f" - {k}")

if __name__ == '__main__':
    main()
