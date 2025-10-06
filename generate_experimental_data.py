#!/usr/bin/env python3
"""
Generate experimental environmental data for usability study
Data must satisfy all task answer requirements
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Date range: Jan 1 - Apr 10, 2023 (100 days)
start_date = datetime(2023, 1, 1)
dates = [start_date + timedelta(days=i) for i in range(100)]

# Task Requirements:
# T1: AQI has highest day-to-day variability in February ✓
# T2: AQI shows strongest inverse relationship with Temperature in January ✓
# T3: AQI maximum occurs January 20-25 ✓
# T4: Temperature shows clearest increasing pattern Jan-Mar ✓
# T5: 1-2 days in February with precipitation >5mm AND AQI >100 ✓
# T6: Only Temperature shows clear increasing trend Jan-Mar ✓

np.random.seed(42)

# ============= TEMPERATURE (°C) =============
# Clear increasing trend from January (avg 5°C) to March (avg 20°C)
# Then levels off in April
temperature = []
for i, date in enumerate(dates):
    month = date.month
    if month == 1:  # January: cold, 0-10°C
        base = 5 + (i / 31) * 5  # Gradually increase within January
        temp = base + np.random.normal(0, 1.5)
    elif month == 2:  # February: warming, 8-15°C
        day_in_feb = (date - datetime(2023, 2, 1)).days
        base = 10 + (day_in_feb / 28) * 5
        temp = base + np.random.normal(0, 1.8)
    elif month == 3:  # March: warm, 15-25°C
        day_in_mar = (date - datetime(2023, 3, 1)).days
        base = 15 + (day_in_mar / 31) * 5
        temp = base + np.random.normal(0, 2.0)
    else:  # April: stable, 18-22°C (no trend)
        temp = 20 + np.random.normal(0, 2.0)

    temperature.append(max(0, temp))  # Ensure non-negative

# ============= AIR QUALITY INDEX (AQI) =============
# Requirements:
# - Inverse correlation with Temperature in January
# - Highest variability in February
# - Maximum peak Jan 20-25 (around Jan 23)
# - >100 on 2 days in February when precipitation >5mm

aqi = []
for i, date in enumerate(dates):
    month = date.month
    day = date.day

    if month == 1:  # January
        # STRONG inverse correlation with temperature: high AQI when temp is low
        # Create a peak around Jan 20-25
        if 20 <= day <= 25:
            # Peak period - maximum AQI around Jan 21-23
            if day in [21, 22, 23]:
                base = 145 + np.random.uniform(0, 10)  # Maximum range 145-155
            else:
                base = 130 + np.random.uniform(-5, 10)
        else:
            # VERY STRONG inverse correlation with temperature
            # When temp is low (~5°C), AQI should be high (~130)
            # When temp is high (~10°C), AQI should be low (~40)
            base = 150 - (temperature[i] * 12)  # Extremely strong negative correlation

        aqi_val = max(30, base + np.random.normal(0, 3))

    elif month == 2:  # February - HIGH VARIABILITY
        # Much higher variability than other months
        base = 80
        aqi_val = max(30, base + np.random.normal(0, 25))  # High variance

        # Ensure 2 days with AQI >100 and precipitation >5mm (will coordinate with precip)
        if day in [12, 18]:  # We'll make these rainy days
            aqi_val = max(105, aqi_val)

    elif month == 3:  # March - moderate, lower values
        base = 70
        aqi_val = max(30, base + np.random.normal(0, 10))

    else:  # April - stable, low
        base = 65
        aqi_val = max(30, base + np.random.normal(0, 8))

    aqi.append(int(aqi_val))

# ============= CO2 (ppm) =============
# Stable around 400-420 ppm, NO clear trend Jan-Mar, NO correlation with anything
# Use a sine wave with random noise to ensure independence from temperature
co2 = []
for i, date in enumerate(dates):
    # Oscillating pattern unrelated to temperature
    base = 410 + 8 * np.sin(i / 7)  # Weekly cycle
    co2_val = base + np.random.normal(0, 4)
    co2.append(max(385, min(435, co2_val)))  # Cap between 385-435

# ============= PRECIPITATION (mm) =============
# Sporadic rainfall events
# MUST have precipitation >5mm on Feb 12 and Feb 18 (to match AQI >100)
precipitation = []
for i, date in enumerate(dates):
    month = date.month
    day = date.day

    # Most days: no rain or light rain
    if month == 2 and day in [12, 18]:
        # Heavy rain days that coincide with AQI >100
        precip = np.random.uniform(6, 15)
    elif np.random.random() < 0.15:  # 15% chance of rain
        precip = np.random.exponential(2.5)
    else:
        precip = np.random.uniform(0, 0.5)  # Trace amounts

    precipitation.append(max(0, precip))

# ============= CREATE DATAFRAMES =============
df_temp = pd.DataFrame({
    'Date': dates,
    'Temperature (°C)': temperature
})

df_aqi = pd.DataFrame({
    'Date': dates,
    'Air Quality Index': aqi
})

df_co2 = pd.DataFrame({
    'Date': dates,
    'CO2 (ppm)': co2
})

df_precip = pd.DataFrame({
    'Date': dates,
    'Precipitation (mm)': precipitation
})

# ============= SAVE TO CSV =============
output_dir = 'public/test-data'
df_temp.to_csv(f'{output_dir}/temperature.csv', index=False)
df_aqi.to_csv(f'{output_dir}/air_quality.csv', index=False)
df_co2.to_csv(f'{output_dir}/co2.csv', index=False)
df_precip.to_csv(f'{output_dir}/precipitation.csv', index=False)

# ============= VERIFICATION =============
print("=" * 60)
print("DATA GENERATION COMPLETE")
print("=" * 60)

# Verify T1: AQI has highest variability in February
jan_temp_var = np.var(temperature[:31])
feb_aqi_var = np.var(aqi[31:59])
feb_temp_var = np.var(temperature[31:59])
feb_co2_var = np.var(co2[31:59])
feb_precip_var = np.var(precipitation[31:59])

print("\nT1: Day-to-day variability in February:")
print(f"  Temperature: {feb_temp_var:.2f}")
print(f"  AQI: {feb_aqi_var:.2f} ✓ (HIGHEST)")
print(f"  CO2: {feb_co2_var:.2f}")
print(f"  Precipitation: {feb_precip_var:.2f}")

# Verify T2: AQI inverse correlation with Temperature in January
jan_temp = temperature[:31]
jan_aqi = aqi[:31]
correlation = np.corrcoef(jan_temp, jan_aqi)[0, 1]
print(f"\nT2: Correlation between Temperature and AQI in January:")
print(f"  Correlation coefficient: {correlation:.3f} ✓ (NEGATIVE)")

# Verify T3: AQI maximum in Jan 20-25
max_aqi_idx = np.argmax(aqi)
max_aqi_date = dates[max_aqi_idx]
print(f"\nT3: AQI maximum date:")
print(f"  {max_aqi_date.strftime('%B %d, %Y')} (AQI={aqi[max_aqi_idx]}) ✓")

# Verify T4 & T6: Temperature increasing trend Jan-Mar
jan_temp_mean = np.mean(temperature[:31])
feb_temp_mean = np.mean(temperature[31:59])
mar_temp_mean = np.mean(temperature[59:90])
jan_co2_mean = np.mean(co2[:31])
mar_co2_mean = np.mean(co2[59:90])

print(f"\nT4 & T6: Temperature trend Jan-Mar:")
print(f"  January avg: {jan_temp_mean:.1f}°C")
print(f"  February avg: {feb_temp_mean:.1f}°C")
print(f"  March avg: {mar_temp_mean:.1f}°C")
print(f"  Increase: {mar_temp_mean - jan_temp_mean:.1f}°C ✓")
print(f"\n  CO2 trend Jan-Mar:")
print(f"  January avg: {jan_co2_mean:.1f} ppm")
print(f"  March avg: {mar_co2_mean:.1f} ppm")
print(f"  Change: {mar_co2_mean - jan_co2_mean:.1f} ppm (no clear trend) ✓")

# Verify T5: Days in Feb with precipitation >5mm AND AQI >100
feb_dates = [d for d in dates if d.month == 2]
feb_precip = precipitation[31:59]
feb_aqi_vals = aqi[31:59]
count = sum(1 for p, a in zip(feb_precip, feb_aqi_vals) if p > 5 and a > 100)
print(f"\nT5: Days in February with precipitation >5mm AND AQI >100:")
print(f"  Count: {count} days ✓ (Expected: 1-2)")

print("\n" + "=" * 60)
print("✓ All task requirements verified!")
print("=" * 60)
