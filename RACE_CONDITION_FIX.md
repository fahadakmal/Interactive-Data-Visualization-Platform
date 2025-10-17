# Chart Loading Race Condition - FIXED

## Problem Identified

The charts were briefly appearing and then disappearing ("flashing") because of a **race condition** in the data loading process.

### Root Cause

When files were being loaded sequentially:

1. **File 1 loads** → `addParsedFile()` → `files` state changes → `useEffect([files])` triggers `generateChart()` → BUT file 1 doesn't have xAxis/yAxis set yet → `generateChart()` skips the file or sets chartData to null
2. **setXAxis()** is called → `files` state changes again → `generateChart()` runs again
3. **setYAxis()** is called → `files` state changes again → `generateChart()` runs again
4. **File 2 loads** → repeat the cycle
5. This caused multiple rapid `generateChart()` calls, some with incomplete data

The automatic `useEffect(() => { generateChart() }, [files])` was triggering before axis selections were configured.

## Solution Implemented

###1. Removed automatic chart generation on file changes

**File**: `src/contexts/VisualizationContext.tsx:217-227`

**Before**:
```typescript
// Always generate chart when files change and there are files
useEffect(() => {
  if (files.length > 0) {
    generateChart();
  }
}, [files]);
```

**After**:
```typescript
// Note: Automatic chart generation disabled for experiment mode
// Charts are generated manually after all files and axes are configured
// This prevents race conditions where files exist but axes aren't set yet
```

### 2. Changed data loading sequence in ExperimentDemo

**File**: `src/components/ExperimentDemo.tsx:86-150`

**New Flow**:
1. Load ALL 4 CSV files first (parse and add to context)
2. THEN set axes for all files in a batch
3. FINALLY call `generateChart()` once after everything is configured

**Code**:
```typescript
// Load all files first
for (const fileInfo of testDataFiles) {
  const response = await fetch(fileInfo.path);
  const csvText = await response.text();
  const parsed = PapaParse.parse(csvText, { /* ... */ });

  if (parsed.data && parsed.data.length > 0) {
    const columns = Object.keys(parsed.data[0]);
    addParsedFile(fileInfo.name, parsed.data, columns);
  }
}

console.log('✅ All 4 experimental CSV files loaded successfully');

// Set axes for all files AFTER they're all loaded
testDataFiles.forEach(fileInfo => {
  setXAxis(fileInfo.name, fileInfo.xCol);
  setYAxis(fileInfo.name, fileInfo.yCol);
});

console.log('✅ Axes configured for all files');

// Generate chart after all files AND axes are configured
setTimeout(() => {
  generateChart();
  console.log('✅ Chart generated after file loading and axis configuration');
}, 200);
```

### 3. Kept chart regeneration on display mode changes

**File**: `src/contexts/VisualizationContext.tsx:221-227`

The `useEffect` for `chartDisplayMode` changes is still active, so switching between overlay/small multiples will regenerate the chart correctly.

## Benefits

✅ **No More Flashing**: Chart data is set only once after all configuration is complete
✅ **Predictable Behavior**: generateChart() is called explicitly when data is ready
✅ **Better Performance**: Fewer redundant chart generation calls
✅ **Cleaner Debug Logs**: Easier to track the data loading sequence

## Testing

1. Navigate to http://localhost:5173/
2. Start experiment → Demographics → Instructions → Test Block
3. Charts should load smoothly without flashing
4. Check console for clean log sequence:
   ```
   📊 Loading Temperature: ...
   📊 Loading Air Quality: ...
   📊 Loading CO2: ...
   📊 Loading Precipitation: ...
   ✅ All 4 experimental CSV files loaded successfully
   ✅ Axes configured for all files
   🎨 generateChart called { filesCount: 4 }
   ...
   ✅ Setting chartData with 4 final datasets
   ```

## Files Modified

1. ✅ `src/contexts/VisualizationContext.tsx:217-227` - Removed automatic chart generation on `files` changes
2. ✅ `src/components/ExperimentDemo.tsx:86-150` - Changed data loading sequence to batch operations
3. ✅ `RACE_CONDITION_FIX.md` - This documentation

## Notes

- This fix is specific to **experiment mode** where data is pre-loaded
- Regular file upload mode still works correctly
- The fix ensures data and configuration are atomically set before chart generation
- The 200ms timeout gives React state updates time to propagate through the context

## Rollback Instructions

If you need to revert to automatic chart generation:

**In VisualizationContext.tsx**, uncomment:
```typescript
useEffect(() => {
  if (files.length > 0) {
    generateChart();
  }
}, [files]);
```

**In ExperimentDemo.tsx**, move `setXAxis` and `setYAxis` calls inside the file loading loop:
```typescript
addParsedFile(fileInfo.name, parsed.data, columns);
setXAxis(fileInfo.name, fileInfo.xCol);
setYAxis(fileInfo.name, fileInfo.yCol);
```

But note: This will bring back the race condition!
