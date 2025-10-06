import urllib.request
import json
import csv
from datetime import datetime

# Lappeenranta coordinates
lat = 61.06
lon = 28.19
start = "20250101"
end = "20250430"

variables = {
    "T2M": ("temperature_2025.csv", "Temperature (°C)"),
    "RH2M": ("humidity_2025.csv", "Relative Humidity (%)"),
    "WS10M": ("wind_speed_2025.csv", "Wind Speed (m/s)"),
    "PRECTOTCORR": ("precipitation_2025.csv", "Precipitation (mm)")
}

print("🌍 NASA POWER Data Download")
print(f"📍 Location: Lappeenranta, Finland ({lat}°N, {lon}°E)")
print(f"📅 Period: January 1 - April 30, 2025 (120 days)\n")

for var_code, (filename, var_name) in variables.items():
    print(f"⬇️  Fetching {var_name}...", end=" ", flush=True)
    
    url = (f"https://power.larc.nasa.gov/api/temporal/daily/point"
           f"?parameters={var_code}&community=AG&longitude={lon}"
           f"&latitude={lat}&start={start}&end={end}&format=JSON")
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as response:
            data = json.loads(response.read().decode())
        
        param_data = data['properties']['parameter'][var_code]
        
        # Write CSV
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', var_name])
            for date_str, value in sorted(param_data.items()):
                date_obj = datetime.strptime(date_str, '%Y%m%d')
                formatted_date = date_obj.strftime('%Y-%m-%d')
                writer.writerow([formatted_date, value])
        
        print(f"✅ {len(param_data)} days → {filename}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n✅ Download complete! Files saved in project/test-data/")
