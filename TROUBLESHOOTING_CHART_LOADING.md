# Troubleshooting: Chart Not Loading Data

## Issue
Charts are not displaying data after removing localStorage caching.

## Investigation Steps

### 1. Check if CSV files are being loaded
- Open browser console
- Navigate through experiment to test block
- Look for console logs:
  - `📊 Loading Temperature:` (should show data)
  - `🔧 addParsedFile called for "Temperature"` (should show file added)
  - `✅ Files array updated. Total files: X`

### 2. Check if data is in the files array
In browser console, run:
```javascript
// Access the context via React DevTools or:
localStorage.clear(); // Clear any old data
location.reload(); // Reload page
// Then navigate to test block and check console logs
```

### 3. Common Issues

#### Issue A: Dates not parsed correctly
**Symptom**: Charts show "No Data Available" even though files loaded
**Cause**: PapaParse `dynamicTyping: true` doesn't parse dates as Date objects
**Solution**: Need to manually parse date strings

#### Issue B: localStorage interference
**Symptom**: Old cached data overrides fresh data
**Solution**: Already fixed by disabling localStorage loading

#### Issue C: generateChart() not called
**Symptom**: Files load but charts don't render
**Solution**: Check if `generateChart()` is being called after data loads

## Current Implementation

### Data Flow:
1. `ExperimentDemo.loadExperimentalData()` - Fetches CSV files
2. `PapaParse.parse()` - Parses CSV with `dynamicTyping: true`
3. `addParsedFile()` - Adds parsed data to context
4. `setXAxis()` / `setYAxis()` - Sets axis selections
5. `generateChart()` - Generates chart data from files
6. `VisualizationStep` - Displays charts

### Current Status:
- ✅ localStorage loading disabled for experiment mode
- ✅ localStorage saving disabled for `addParsedFile()`, `setXAxis()`, `setYAxis()`
- ✅ CSV files exist in `/public/test-data/`
- ⚠️ Need to verify date parsing

## Debug Commands

Open browser console and run these commands:

### Check files in context:
```javascript
// This requires React DevTools or exposing context
// For now, check console logs during load
```

### Check localStorage:
```javascript
// Should NOT have csvFiles or csvData_* keys
Object.keys(localStorage).filter(k => k.startsWith('csv') || k === 'chartOptions')
// Should return: []
```

### Clear all data and reload:
```javascript
localStorage.clear();
location.reload();
```

## Next Steps

1. **Add date parsing** - Dates need to be explicitly converted to Date objects
2. **Test with console open** - Navigate to test block and check logs
3. **Verify chart generation** - Check if `generateChart()` creates datasets

## Solution Options

### Option 1: Parse dates in addParsedFile
Modify `addParsedFile()` to detect and parse date columns:

```typescript
const addParsedFile = (name: string, data: any[], columns: string[]) => {
  // Parse dates if column name is "Date"
  const processedData = data.map(row => {
    const newRow = { ...row };
    for (const col of columns) {
      if (col === 'Date' && typeof newRow[col] === 'string') {
        newRow[col] = new Date(newRow[col]);
      }
    }
    return newRow;
  });

  // Continue with processedData...
}
```

### Option 2: Parse dates in ExperimentDemo
Parse dates immediately after PapaParse:

```typescript
const parsed = PapaParse.parse(csvText, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transform: (value, column) => {
    // If column is 'Date', parse as Date object
    if (column === 'Date' && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  }
});
```

## Testing

After implementing fix:
1. Clear localStorage: `localStorage.clear()`
2. Reload page
3. Navigate through experiment
4. Verify charts display correctly
5. Check console for errors

## Success Criteria

✅ Charts display with 4 datasets (Temperature, Air Quality, CO2, Precipitation)
✅ Overlay layout shows single chart with 4 lines
✅ Small multiples layout shows 2x2 grid with 4 separate charts
✅ No localStorage data for chart files
✅ Fresh data loads on every session
