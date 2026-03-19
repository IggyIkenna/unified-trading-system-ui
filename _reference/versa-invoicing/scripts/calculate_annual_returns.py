#!/usr/bin/env python3
"""
Calculate annual returns with:
- Simple monthly compounding
- Continuous (hourly) compounding within each month
"""

import pandas as pd
import numpy as np
from datetime import datetime

START_DATE = datetime(2020, 1, 1, 0, 0)

def calculate_annual_returns(df, label):
    df['datetime'] = START_DATE + pd.to_timedelta(df['minutes'], unit='m')
    df['year'] = df['datetime'].dt.year
    df['month'] = df['datetime'].dt.month
    df['year_month'] = df['datetime'].dt.to_period('M')
    
    # Calculate continuous returns (log returns) for each hour
    df['log_return'] = np.log(df['equity'] / df['equity'].shift(1))
    
    # Group by month and sum log returns (continuous compounding within month)
    monthly_returns = df.groupby('year_month').agg({
        'equity': ['first', 'last'],
        'log_return': 'sum'
    }).reset_index()
    
    monthly_returns.columns = ['year_month', 'equity_start', 'equity_end', 'log_return_sum']
    
    # Convert continuous monthly return to simple monthly return
    # Simple return = e^(log_return) - 1
    monthly_returns['monthly_return'] = np.exp(monthly_returns['log_return_sum']) - 1
    
    # Group by year and compound monthly returns simply
    monthly_returns['year'] = monthly_returns['year_month'].dt.year
    
    annual_returns = []
    for year in sorted(monthly_returns['year'].unique()):
        year_data = monthly_returns[monthly_returns['year'] == year]
        # Simple compounding: (1+r1) * (1+r2) * ... * (1+r12) - 1
        annual_return = (1 + year_data['monthly_return']).prod() - 1
        annual_returns.append({
            'year': year,
            'annual_return': annual_return * 100,
            'months': len(year_data)
        })
    
    return pd.DataFrame(annual_returns), monthly_returns

# Load data
print('='*80)
print('ANNUAL RETURNS: Simple Monthly Compounding with Continuous (Hourly) Compounding Within Month')
print('='*80)

df_old = pd.read_csv('balance_and_equity (Latest_since_1st_Jan_2020_to_late_september_old_settings).csv')
df_old.columns = ['minutes', 'balance', 'equity']

df_new = pd.read_csv('balance_and_equity (since 2020_new_settings).csv')
df_new.columns = ['minutes', 'balance', 'equity']

# Calculate annual returns
annual_old, monthly_old = calculate_annual_returns(df_old.copy(), 'Old Settings')
annual_new, monthly_new = calculate_annual_returns(df_new.copy(), 'New Settings')

print('\nOLD SETTINGS:')
print('-'*80)
print(f"{'Year':<8} {'Annual Return (%)':<20} {'Months':<10}")
print('-'*80)
for _, row in annual_old.iterrows():
    print(f"{int(row['year']):<8} {row['annual_return']:>18.2f}% {int(row['months']):<10}")
print(f'\nAverage Annual Return: {annual_old["annual_return"].mean():.2f}%')
print(f'CAGR (geometric mean): {((annual_old["annual_return"]/100 + 1).prod() ** (1/len(annual_old)) - 1) * 100:.2f}%')

print('\n\nNEW SETTINGS:')
print('-'*80)
print(f"{'Year':<8} {'Annual Return (%)':<20} {'Months':<10}")
print('-'*80)
for _, row in annual_new.iterrows():
    print(f"{int(row['year']):<8} {row['annual_return']:>18.2f}% {int(row['months']):<10}")
print(f'\nAverage Annual Return: {annual_new["annual_return"].mean():.2f}%')
print(f'CAGR (geometric mean): {((annual_new["annual_return"]/100 + 1).prod() ** (1/len(annual_new)) - 1) * 100:.2f}%')

# Compare
print('\n\nCOMPARISON:')
print('-'*80)
merged = pd.merge(annual_old[['year', 'annual_return']], 
                  annual_new[['year', 'annual_return']], 
                  on='year', 
                  suffixes=('_old', '_new'))
print(f"{'Year':<8} {'Old (%)':<15} {'New (%)':<15} {'Difference':<15}")
print('-'*80)
for _, row in merged.iterrows():
    diff = row['annual_return_old'] - row['annual_return_new']
    print(f"{int(row['year']):<8} {row['annual_return_old']:>13.2f}% {row['annual_return_new']:>13.2f}% {diff:>13.2f}%")

print('\n' + '='*80)



