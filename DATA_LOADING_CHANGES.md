# Data Loading Changes - Experiment Mode

## Problem

Previously, the system was loading chart data from localStorage, which meant:
- Old cached data would persist across sessions
- Fresh CSV data wasn't always displayed
- Participants might see stale data from previous sessions

## Solution

Modified the data loading behavior to **load fresh data from CSV files** on each experiment session.

## Changes Made

### 1. Disabled localStorage Loading for Experiment Mode

**File**: `src/contexts/VisualizationContext.tsx:197-215`

```typescript
// Only load localStorage data if we're NOT in the experiment flow
const isExperimentMode = window.location.pathname.includes('/experiment') ||
                         window.location.pathname === '/' ||
                         window.location.pathname === '/index.html';

if (!isExperimentMode) {
  // Regular mode - load from localStorage for normal usage
  loadFilesFromLocalStorage();
}
```

### 2. Disabled localStorage Saving for Experiment Data

**Modified functions**:
- `addParsedFile()` - No longer saves to localStorage
- `setXAxis()` - No longer saves to localStorage
- `setYAxis()` - No longer saves to localStorage

These functions are used by `ExperimentDemo` to load the 4 experimental CSV files.

### 3. Data Loading Flow

**Current Flow**:
1. Participant opens experiment
2. System does NOT load old localStorage data
3. `ExperimentDemo` loads fresh CSV files from `/test-data/`
4. Data is parsed and displayed
5. Charts are generated from fresh data
6. No localStorage caching of chart data

**CSV Files Loaded**:
- `/test-data/temperature.csv`
- `/test-data/air_quality.csv`
- `/test-data/co2.csv`
- `/test-data/precipitation.csv`

## Benefits

✅ **Fresh Data Every Time**: Participants always see the correct experimental data
✅ **No Cache Issues**: Previous sessions don't interfere
✅ **Consistent Experience**: All participants see identical data
✅ **Easy Updates**: CSV files can be updated without cache problems

## Important Notes

1. **Experiment Data is NOT Cached**: Chart data is loaded fresh from CSV files each time
2. **Responses ARE Cached**: Task responses, satisfaction ratings, and participant info are still saved to localStorage (needed for data collection)
3. **Firebase Still Works**: Data is still synced to Firebase on completion
4. **Regular Mode Unaffected**: Non-experiment routes still use localStorage for chart data

## Testing

To verify the changes:

1. **Start experiment**: `npm run dev`
2. **Complete tasks**: Note the charts displayed
3. **Clear localStorage**: Open browser console and run:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. **Start new session**: Charts should look identical to step 2
5. **Modify CSV file**: Change a value in `/public/test-data/temperature.csv`
6. **Reload page**: The change should be immediately visible

## Reverting to Old Behavior

If you need to restore localStorage caching:

1. Uncomment the `saveFilesToLocalStorage()` calls in:
   - `addParsedFile()`
   - `setXAxis()`
   - `setYAxis()`

2. Remove the conditional check in the `useEffect` that loads files

## Related Files

- `src/contexts/VisualizationContext.tsx` - Data management context
- `src/components/ExperimentDemo.tsx` - Experiment orchestration
- `public/test-data/*.csv` - Experimental data files

## For Future Development

If you add new experimental CSV files:
1. Place them in `/public/test-data/`
2. Add them to the `testDataFiles` array in `ExperimentDemo.tsx:88-93`
3. No localStorage changes needed - they'll load fresh automatically
