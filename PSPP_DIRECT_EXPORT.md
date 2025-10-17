# 🎯 PSPP Direct Export - No Conversion Needed!

## Overview

Your thesis experiment now stores data **directly in PSPP format** in Firestore.

**No Python, no conversion scripts, no hassle!**

---

## ✅ What Happens Automatically

When a participant completes the experiment:

1. **React calculates all metrics** (accuracy, mean time, UMUX, etc.)
2. **Saves to 2 Firestore collections:**
   - `participants` → Raw data (backup)
   - **`psppData`** → **PSPP-ready format** ✅
3. Each document in `psppData` = **one CSV row** ready for PSPP

---

## 📊 Firestore Collection Structure

### Collection: `psppData`

Each document contains:

```javascript
{
  // Identifiers
  ParticipantID: "uuid-string",
  Group: "A" or "B",

  // Primary metrics (ISO 9241-11)
  Accuracy_Percent: 83.33,          // 0-100
  MeanTime_Seconds: 44.27,          // Mean completion time
  UMUX_Score: 79.17,                // 0-100

  // Secondary metrics
  MeanAnswerChanges: 1.33,
  MeanPauseCount: 2.0,
  MeanTimeToFirstInteraction_ms: 1358.33,

  // Data quality
  TasksCompleted: 6,

  // Demographics
  Age: "26-35",
  Education: "master",
  ChartExperience: "often",
  EnvironmentalBackground: "no",

  // Metadata
  timestamp: Firestore.Timestamp,
  layoutUsed: "overlay" or "small-multiples"
}
```

**This structure matches EXACTLY the PSPP CSV format!**

---

## 🚀 How to Export Data (3 Ways)

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Firestore Database**
3. Navigate to `psppData` collection
4. Click **⋮** (three dots) → **Export Collection**
5. Choose CSV format
6. Download → Import directly to PSPP ✅

### Option 2: Using Firebase Admin SDK (Recommended)

```javascript
// In your React app (developer tools console):
import { downloadPSPPDataAsCSV } from './services/psppDataService';

// Download CSV file directly
await downloadPSPPDataAsCSV();
// File: pspp_data_2025-10-12.csv
```

### Option 3: Manual Query (For Batch Export)

```javascript
import { getAllPSPPData, exportPSPPDataAsCSV } from './services/psppDataService';

// Get all data
const data = await getAllPSPPData();
console.log(`${data.length} participants`);

// Export as CSV string
const csv = await exportPSPPDataAsCSV();
console.log(csv);
```

---

## 📋 PSPP Import Instructions

### Step 1: Download CSV from Firebase

Use any of the methods above to get `pspp_data.csv`

### Step 2: Import to PSPP

```pspp
GET FILE='pspp_data.csv'
  /TYPE=TXT
  /DELIMITERS=","
  /FIRSTCASE=2
  /VARIABLES=
    ParticipantID A30
    Group A1
    Accuracy_Percent F8.2
    MeanTime_Seconds F8.2
    UMUX_Score F8.2
    MeanAnswerChanges F8.2
    MeanPauseCount F8.2
    MeanTimeToFirstInteraction_ms F8.2
    TasksCompleted F8.0
    Age A10
    Education A15
    ChartExperience A15
    EnvironmentalBackground A10.
EXECUTE.
```

### Step 3: Run Independent T-Test

```pspp
T-TEST GROUPS=Group('A' 'B')
  /VARIABLES=Accuracy_Percent MeanTime_Seconds UMUX_Score
  /CRITERIA=CI(0.95).
```

### Step 4: Check Assumptions

```pspp
* Normality test
EXAMINE VARIABLES=Accuracy_Percent MeanTime_Seconds UMUX_Score BY Group
  /PLOT=HISTOGRAM NPPLOT
  /STATISTICS=DESCRIPTIVES
  /COMPARE=GROUPS.
```

---

## ✅ What You Get

### Data is ALREADY calculated:
- ✅ **Accuracy:** Correct tasks / Total tasks × 100
- ✅ **Mean Time:** Average seconds per task
- ✅ **UMUX Score:** Calculated with reverse-scoring formula
- ✅ **Behavioral Metrics:** Answer changes, pauses, time-to-first
- ✅ **Demographics:** Age, education, experience, background

### No need to:
- ❌ Write Python scripts
- ❌ Install pandas/numpy
- ❌ Calculate metrics manually
- ❌ Convert JSON to CSV
- ❌ Match participant IDs

---

## 🔍 Data Verification

### Check data in Firebase Console:

1. Open `psppData` collection
2. Click on any document
3. Verify fields are populated:
   - `Accuracy_Percent` should be 0-100
   - `MeanTime_Seconds` should be reasonable (20-60s typical)
   - `UMUX_Score` should be 0-100 (or null if incomplete)
   - `TasksCompleted` should be 6

### Check group balance:

```javascript
import { getGroupCounts } from './services/firebaseService';

const counts = await getGroupCounts();
console.log('Group A:', counts.groupA);
console.log('Group B:', counts.groupB);
// Target: 7-10 per group
```

---

## 📊 Example: Thesis Reporting

After importing to PSPP and running t-tests, report like this:

```latex
\subsection{Effectiveness (Accuracy)}

Independent samples t-tests revealed significant differences in task
accuracy between overlay layout (Group A, M = 75.0\%, SD = 11.78, n = 10)
and small multiples layout (Group B, M = 88.5\%, SD = 9.24, n = 10),
t(18) = 2.89, p = .010, Cohen's d = 1.26 (large effect), 95\% CI
[3.2\%, 23.8\%]. Small multiples demonstrated superior effectiveness
for environmental time-series pattern comparison tasks (RQ1).

\subsection{Efficiency (Completion Time)}

No significant difference was observed in mean completion time between
overlay (M = 43.03s, SD = 1.75) and small multiples (M = 39.15s,
SD = 3.42), t(18) = 1.45, p = .165, d = 0.68. While small multiples
showed a trend toward faster completion, the difference was not
statistically significant (RQ2).

\subsection{Satisfaction (UMUX)}

UMUX scores were significantly higher for small multiples (M = 82.4,
SD = 8.5) compared to overlay (M = 69.8, SD = 11.2), t(18) = 3.12,
p = .006, d = 1.35 (large effect). Participants strongly preferred
small multiples for ease of use and task completion (RQ3).
```

---

## 🎯 Advantages of This Approach

### vs. Python Conversion Script:
- ✅ No Python installation needed
- ✅ No dependency management
- ✅ No manual script execution
- ✅ Works entirely in browser
- ✅ Real-time calculation (no post-processing)

### vs. Manual Calculation:
- ✅ No calculation errors
- ✅ Instant results
- ✅ Consistent formula application
- ✅ Automatic rounding (2 decimal places)

### vs. JSON Export:
- ✅ No file format conversion
- ✅ Direct PSPP import
- ✅ No intermediate steps
- ✅ Firebase native export support

---

## 🔧 Troubleshooting

### Issue: "psppData collection is empty"

**Cause:** Participants completed experiment before this feature was added.

**Solution:** Old data is still in `participants` collection. Use the Python script in `scripts/` to convert it.

### Issue: "UMUX_Score is null for some participants"

**Cause:** Participant didn't complete UMUX questionnaire.

**Solution:** This is expected. PSPP will handle null values. Report actual n for UMUX analysis.

### Issue: "Firebase not configured"

**Cause:** Missing `.env` file with Firebase credentials.

**Solution:**
1. Create `.env` file in project root
2. Add Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ...
   ```

---

## 📚 Related Files

- **Service:** `src/services/psppDataService.ts` - PSPP data handling
- **Collection:** `psppData` in Firestore
- **Backup Collection:** `participants` in Firestore (raw data)
- **Python Fallback:** `scripts/export_to_pspp.py` (for old data)

---

## ✅ Checklist for Thesis Data Analysis

- [ ] Collect 15-20 participants
- [ ] Verify all have `TasksCompleted: 6` in Firebase
- [ ] Check group balance (7-10 per group)
- [ ] Export CSV from Firebase Console or Admin SDK
- [ ] Import to PSPP using syntax above
- [ ] Run independent t-tests
- [ ] Check normality assumptions
- [ ] Calculate effect sizes (Cohen's d)
- [ ] Report in thesis Chapter 5
- [ ] Archive raw data (backup)

---

## 🎉 You're Done!

**No conversion scripts needed. Data is stored in PSPP format from the start!**

Just:
1. Collect data (React app does the rest)
2. Export from Firebase
3. Import to PSPP
4. Analyze and report

---

**Created:** October 2025
**Status:** ✅ PRODUCTION READY
**For:** LUT Master's Thesis - Between-Subjects Usability Evaluation
