# Chart Loading Debug Instructions

## Current Status

I've added comprehensive debug logging to track the chart data generation process. The development server has restarted with the new logging in place.

## What Was Added

### Debug Logging in `generateChart()` (VisualizationContext.tsx:595-724)

The following debug information is now logged to the browser console:

1. **Initial Call**: `🎨 generateChart called { filesCount: X }`
2. **Per File Processing**:
   - `📊 Processing file "FileName": { selected, dataRows, columnStyles }`
   - `⚠️ Skipping "FileName" - missing axis selection` (if axes not set)
3. **Per Y-Axis Processing**:
   - `➡️ Points generated for "FileName" - YAxis: { pointsCount, isDateXAxis, isDateYAxis, firstPoint, lastPoint, hasColumnStyles }`
   - `✅ Dataset added for "FileName" - YAxis` (when dataset is created)
   - `⚠️ No points for "FileName" - YAxis, skipping dataset` (when points array is empty)
4. **Summary**:
   - `📈 Total datasets generated: X`
   - `🔄 Chart display mode: separate/single/hybrid`
   - `✅ Setting chartData with X final datasets`
   - `❌ No datasets generated, setting chartData to null`

## Testing Instructions

### Step 1: Clear Browser Cache
Open your browser's DevTools console and run:
```javascript
localStorage.clear();
location.reload();
```

### Step 2: Navigate to Test Block
1. Open http://localhost:5174/
2. Click "Start Experiment"
3. Fill in demographics form
4. Continue through instructions
5. **Watch the console output** during data loading

### Step 3: Analyze Console Output

Look for the following patterns:

#### ✅ **SUCCESS Pattern** (Expected)
```
📊 Loading Temperature: { rows: 100, columns: ['Date', 'Temperature (°C)'], ... }
🔧 addParsedFile called for "Temperature": { ... }
✅ Files array updated. Total files: 1
🎨 generateChart called { filesCount: 1 }
📊 Processing file "Temperature": { selected: { xAxis: 'Date', yAxes: ['Temperature (°C)'] }, dataRows: 100, columnStyles: [...] }
  ➡️ Points generated for "Temperature" - Temperature (°C): { pointsCount: 100, isDateXAxis: true, isDateYAxis: false, firstPoint: {x: 1672531200000, y: 5.74}, lastPoint: {...}, hasColumnStyles: true }
  ✅ Dataset added for "Temperature" - Temperature (°C)
📈 Total datasets generated: 1
🔄 Chart display mode: separate
✅ Setting chartData with 1 final datasets
```

#### ⚠️ **PROBLEM Patterns** (What to look for)

**Pattern A: No Points Generated**
```
  ➡️ Points generated for "Temperature" - Temperature (°C): { pointsCount: 0, ... }
  ⚠️ No points for "Temperature" - Temperature (°C), skipping dataset
```
→ This means data filtering is removing all points. Check if dates are actually Date objects or if values are being filtered out.

**Pattern B: Missing Axis Selection**
```
📊 Processing file "Temperature": { ... }
⚠️ Skipping "Temperature" - missing axis selection
```
→ This means `selected.xAxis` or `selected.yAxes` is not set correctly.

**Pattern C: Empty columnStyles**
```
  ➡️ Points generated for "Temperature" - Temperature (°C): { ..., hasColumnStyles: false }
```
→ This shouldn't prevent chart rendering but indicates columnStyles initialization might have issues.

**Pattern D: generateChart Not Called**
```
🔧 addParsedFile called for "Temperature": { ... }
✅ Files array updated. Total files: 1
(no generateChart logs follow)
```
→ This means the useEffect that triggers generateChart isn't running.

### Step 4: Report Back

Please share the **complete console output** from when you:
1. Clear localStorage
2. Reload the page
3. Navigate through to the test block
4. See the "No Data Available" message

Focus on:
- The 📊 Loading messages from ExperimentDemo
- The 🔧 addParsedFile messages
- The 🎨 generateChart sequence
- Any ⚠️ warning messages
- The final ✅ or ❌ result

## Expected Results (When Working)

After all 4 files load, you should see:
- 4 sets of "📊 Loading..." messages
- 4 sets of "🔧 addParsedFile..." messages
- 4 "✅ Files array updated" messages (count increasing: 1, 2, 3, 4)
- Multiple "🎨 generateChart called" messages (triggered by files changing)
- Final message: "✅ Setting chartData with 4 final datasets"

## Common Issues and Solutions

### Issue: generateChart returns early due to missing selected.xAxis
**Symptom**: `⚠️ Skipping "FileName" - missing axis selection`
**Solution**: Check if `setXAxis()` and `setYAxis()` are being called correctly in ExperimentDemo

### Issue: Points array is empty after filtering
**Symptom**: `pointsCount: 0` in the logs
**Solution**: Check if:
- Date values are actually Date objects (not strings)
- Numeric values are numbers (not strings)
- Data isn't being filtered out by the validation checks

### Issue: columnStyles not initialized
**Symptom**: `hasColumnStyles: false`
**Solution**: Check if columnStyles initialization in addParsedFile is working correctly

### Issue: generateChart not triggered
**Symptom**: No generateChart logs after addParsedFile
**Solution**: Check useEffect dependencies in VisualizationContext (lines 218-229)

## Files Modified

- `src/contexts/VisualizationContext.tsx:595-724` - Added comprehensive debug logging to generateChart()

## Next Steps

Based on the console output you provide, I can:
1. Identify exactly where the chart generation is failing
2. Add targeted fixes to resolve the issue
3. Verify the fix works with the debug logging

The logging is designed to pinpoint the exact step where chart data generation fails.
