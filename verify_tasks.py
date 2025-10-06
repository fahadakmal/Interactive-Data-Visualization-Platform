#!/usr/bin/env python3
"""Verify that generated data satisfies all task requirements"""

import pandas as pd
import numpy as np

# Load data
temp_df = pd.read_csv('public/test-data/temperature.csv')
aqi_df = pd.read_csv('public/test-data/air_quality.csv')
co2_df = pd.read_csv('public/test-data/co2.csv')
precip_df = pd.read_csv('public/test-data/precipitation.csv')

# Convert dates
temp_df['Date'] = pd.to_datetime(temp_df['Date'])
aqi_df['Date'] = pd.to_datetime(aqi_df['Date'])
co2_df['Date'] = pd.to_datetime(co2_df['Date'])
precip_df['Date'] = pd.to_datetime(precip_df['Date'])

print("="*60)
print("TASK VERIFICATION REPORT")
print("="*60)

# T1: Which variable shows highest day-to-day variability in February?
feb_mask = (temp_df['Date'].dt.month == 2)
feb_temp_var = temp_df[feb_mask]['Temperature (°C)'].var()
feb_aqi_var = aqi_df[feb_mask]['Air Quality Index'].var()
feb_co2_var = co2_df[feb_mask]['CO2 (ppm)'].var()
feb_precip_var = precip_df[feb_mask]['Precipitation (mm)'].var()

print("\nT1: Variability in February 2023")
print(f"  A) Temperature: {feb_temp_var:.2f}")
print(f"  B) AQI: {feb_aqi_var:.2f} <- HIGHEST")
print(f"  C) CO2: {feb_co2_var:.2f}")
print(f"  D) Precipitation: {feb_precip_var:.2f}")
print(f"  Correct Answer: B) AQI")
if feb_aqi_var > max(feb_temp_var, feb_co2_var, feb_precip_var):
    print("  Status: PASS")
else:
    print("  Status: FAIL")

# T2: Which shows strongest inverse relationship with Temperature in January?
jan_mask = (temp_df['Date'].dt.month == 1)
jan_temp = temp_df[jan_mask]['Temperature (°C)']
jan_aqi = aqi_df[jan_mask]['Air Quality Index']
jan_co2 = co2_df[jan_mask]['CO2 (ppm)']
jan_precip = precip_df[jan_mask]['Precipitation (mm)']

corr_aqi = np.corrcoef(jan_temp, jan_aqi)[0,1]
corr_co2 = np.corrcoef(jan_temp, jan_co2)[0,1]
corr_precip = np.corrcoef(jan_temp, jan_precip)[0,1]

print("\nT2: Correlation with Temperature in January 2023")
print(f"  A) AQI: {corr_aqi:.3f} <- MOST NEGATIVE")
print(f"  B) CO2: {corr_co2:.3f}")
print(f"  C) Precipitation: {corr_precip:.3f}")
print(f"  Correct Answer: A) AQI")
if corr_aqi < min(corr_co2, corr_precip):
    print("  Status: PASS")
else:
    print("  Status: FAIL")

# T3: When did AQI reach maximum between Jan-Apr?
jan_apr_mask = (aqi_df['Date'].dt.month <= 4)
max_aqi_idx = aqi_df[jan_apr_mask]['Air Quality Index'].idxmax()
max_aqi_date = aqi_df.loc[max_aqi_idx, 'Date']
max_aqi_value = aqi_df.loc[max_aqi_idx, 'Air Quality Index']

print(f"\nT3: AQI Maximum Date")
print(f"  Maximum AQI: {max_aqi_value} on {max_aqi_date.strftime('%B %d, %Y')}")
if max_aqi_date.month == 1 and 20 <= max_aqi_date.day <= 25:
    print(f"  Correct Answer: B) January 20-25")
    print("  Status: PASS")
else:
    print(f"  Status: FAIL (expected Jan 20-25)")

# T4 & T6: Which variable shows clearest increasing trend Jan-Mar?
jan_mean = temp_df[jan_mask]['Temperature (°C)'].mean()
feb_mean = temp_df[feb_mask]['Temperature (°C)'].mean()
mar_mask = (temp_df['Date'].dt.month == 3)
mar_mean = temp_df[mar_mask]['Temperature (°C)'].mean()
temp_increase = mar_mean - jan_mean

jan_co2_mean = co2_df[jan_mask]['CO2 (ppm)'].mean()
mar_co2_mean = co2_df[mar_mask]['CO2 (ppm)'].mean()
co2_change = mar_co2_mean - jan_co2_mean

print(f"\nT4 & T6: Trend from January to March 2023")
print(f"  Temperature: {jan_mean:.1f}°C -> {mar_mean:.1f}°C (change: +{temp_increase:.1f}°C)")
print(f"  CO2: {jan_co2_mean:.1f} ppm -> {mar_co2_mean:.1f} ppm (change: {co2_change:+.1f} ppm)")
print(f"  Correct Answers: T4=A, T6=A (Temperature only)")
if temp_increase > 10 and abs(co2_change) < 5:
    print("  Status: PASS")
else:
    print("  Status: FAIL")

# T5: Days in Feb with precipitation >5mm AND AQI >100
feb_precip_high = precip_df[feb_mask]['Precipitation (mm)'] > 5
feb_aqi_high = aqi_df[feb_mask]['Air Quality Index'] > 100
both_high = feb_precip_high & feb_aqi_high
count = both_high.sum()

print(f"\nT5: Days in February with precipitation >5mm AND AQI >100")
print(f"  Count: {count} days")
if count in [1, 2]:
    print(f"  Correct Answer: B) 1-2 days")
    print("  Status: PASS")
else:
    print(f"  Status: FAIL (expected 1-2 days)")

print("\n" + "="*60)
print("VERIFICATION COMPLETE")
print("="*60)
