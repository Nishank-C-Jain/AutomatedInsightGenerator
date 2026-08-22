import sys
import os
import json
import pandas as pd

# Add analytics-service root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.analyzers.data_quality import DataQualityAnalyzer

def main():
    # Create a synthetic dataset representing various quality issues
    data = {
        "id": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12],  # Duplicated row (12)
        "name": ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Hank", "Ivy", "Jack", "Karl", "Leo", "Leo"],
        "age": [25, 30, 22, 120, 28, None, 32, 29, 31, 27, 26, 28, 28],  # Outlier (120), Missing (None)
        "constant_col": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  # Constant column
        "high_card_col": ["A1", "B2", "C3", "D4", "E5", "F6", "G7", "H8", "I9", "J10", "K11", "L12", "M13"],  # High cardinality
        "bool_col": [True, False, True, True, False, None, True, False, True, True, False, False, False]
    }
    df = pd.DataFrame(data)
    
    print("--- Running Data Quality Analysis on Test Dataset ---")
    analyzer = DataQualityAnalyzer(df)
    results = analyzer.analyze()
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
