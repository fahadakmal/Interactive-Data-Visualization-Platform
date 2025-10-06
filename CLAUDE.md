# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context: Master's Thesis Research Platform

This is **not a production application** - it is a **research platform** for a Master's thesis (LUT University, 2025-2026) conducting usability evaluation of visualization layouts for environmental dashboards.

**Research Question:** How do overlay and small multiples layouts compare in terms of usability (effectiveness, efficiency, satisfaction) for environmental time-series pattern comparison?

**Study Design:** Quantitative usability laboratory experiment (10-15 participants, 6 tasks, counterbalanced, screen recording)

**Framework:** ISO 9241-11 + Benyon Table 10.3

**Key Constraints:**
- Must support **two visualization layouts**: overlay (combined) and small multiples (separate)
- Must work with **four specific environmental datasets**: temperature, air quality, CO2, precipitation (Jan-Apr 2023)
- Must record **usability metrics**: effectiveness (accuracy), efficiency (time, answer changes, pauses), satisfaction (Likert ratings)
- Must display **post-block satisfaction questionnaires** (5-point Likert scales)
- Sessions will be **screen recorded** (external via OBS Studio)
- Modifications should prioritize **usability evaluation validity** over feature richness

**DO NOT:**
- Add unnecessary features beyond thesis requirements
- Modify test datasets in test-data/ (these are verified for experimental tasks)
- Remove or significantly alter the core stepper workflow
- Add analytics or tracking beyond what's needed for the experiment

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check (no npm script, use directly)
npx tsc --noEmit
```

## Architecture Overview

This is a React-based data visualization platform built with Vite, TypeScript, and Material-UI. The application enables users to upload CSV files and create interactive line and scatter charts with extensive customization options.

### Core Technology Stack
- **React 18** with TypeScript for the UI framework
- **Vite** as the build tool and dev server
- **Material-UI (MUI)** for component library and theming
- **D3.js** for data visualization rendering
- **PapaParse** for CSV parsing
- **Context API** for global state management

### Application Structure

The application follows a step-based workflow pattern managed through `MainLayout`:

1. **File Upload Step** - Users upload CSV files via drag-and-drop
2. **Column Selection Step** - Select X and Y axes from CSV columns  
3. **Chart Configuration Step** - Customize visual appearance and settings
4. **Visualization Step** - Display and interact with generated charts

### State Management

Central state is managed via `VisualizationContext` (src/contexts/VisualizationContext.tsx) which provides:
- File management (add/remove CSV files)
- Chart configuration (axes, styles, colors)
- Chart generation and display mode control
- LocalStorage persistence

Key state includes:
- `files`: Array of uploaded CSV files with parsed data
- `chartData`: Processed data ready for visualization
- `chartOptions`: Global and per-file chart configurations
- `chartDisplayMode`: Controls how multiple files are displayed ('single', 'separate', 'hybrid')

### Component Architecture

```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx      # Application header
│   │   └── MainLayout.tsx     # Main stepper layout controller
│   ├── steps/
│   │   ├── FileUploadStep.tsx         # CSV upload interface
│   │   ├── ColumnSelectionStep.tsx    # Axis selection
│   │   ├── ChartConfigurationStep.tsx # Style customization
│   │   └── VisualizationStep.tsx      # Chart display
│   ├── ui/
│   │   ├── FileItem.tsx         # Individual file display
│   │   ├── SeriesStylePanel.tsx # Series style controls
│   │   └── AxisSettingsPanel.tsx # Axis configuration
│   └── visualization/
│       ├── D3LineChart.tsx     # D3-based chart renderer
│       └── MultiChartView.tsx  # Multiple chart container
├── contexts/
│   └── VisualizationContext.tsx # Global state provider
├── types/
│   └── visualization.ts        # TypeScript type definitions
└── utils/
    ├── csvParser.ts           # CSV parsing utilities
    └── downloadUtils.ts       # Chart export functionality
```

### Chart Rendering

Charts are rendered using D3.js in `D3LineChart.tsx` with features:
- Dynamic scaling based on data ranges
- Interactive tooltips with data point details
- Legend filtering (click to show/hide series)
- Responsive sizing with configurable dimensions
- Support for time-series data with intelligent date formatting
- Combined or separate chart display modes

### Data Flow

1. CSV files are parsed via `parseCSV` utility using PapaParse
2. Parsed data is stored in context with metadata (columns, data types)
3. User selections (axes, styles) are applied to generate `ChartData`
4. D3LineChart consumes `ChartData` to render SVG visualizations
5. Charts can be exported as SVG or PNG via `downloadUtils`

### Testing Approach

**IMPORTANT:** The CSV files in `test-data/` are **experimental stimuli** with verified answers for the thesis study:
- `air_quality.csv` - Daily Air Quality Index readings (30-150 scale)
- `co2.csv` - Daily CO2 measurements in ppm (380-420 range)
- `precipitation.csv` - Daily precipitation in mm (0-80mm, sporadic)
- `temperature.csv` - Daily temperature in °C (5-25°C, seasonal)

**Time period:** January 1 - April 10, 2023 (~100 days)

**DO NOT modify these files** - task answers in `experiment-tasks-design.md` depend on their exact values.

**Manual testing workflow:**
1. Upload test CSVs through the UI
2. Select Date as X-axis, relevant metrics as Y-axis
3. Test both "single" (overlay) and "separate" (small multiples) display modes
4. Verify tasks from `experiment-tasks-design.md` can be completed accurately

Currently no automated tests are configured.

## Platform Features and Capabilities

### Data Processing
- **CSV Parsing**: Intelligent parsing with PapaParse library
  - Automatic data type detection (strings, numbers, dates)
  - ISO 8601 date format support (YYYY-MM-DD, timestamps with timezone)
  - Empty value handling
  - Dynamic typing with manual validation
- **Multi-File Support**: Upload and visualize multiple CSV files simultaneously
- **Column Detection**: Automatic identification of available columns for visualization
- **Data Persistence**: LocalStorage integration for saving uploaded files and configurations

### Visualization Features
- **Chart Types**: Line charts and scatter plots (points without lines)
- **Multiple Display Modes**:
  - `single`: Combine all datasets into one unified chart
  - `separate`: Display each file's chart independently
  - `hybrid`: Smart grouping - combine compatible files, separate incompatible ones
- **Interactive Elements**:
  - Hover tooltips showing exact data values with beautiful gradient design
  - Click legend items to show/hide specific series
  - Pan and zoom functionality for data exploration
  - Dynamic axis scaling with auto-range detection

### Customization Options

#### Visual Styling
- **Line Styles**: solid, dashed, or dotted lines
- **Point Styles**: circle, square, triangle, or none
- **Color Picker**: Custom colors for each data series
- **Show/Hide Controls**: Toggle visibility of lines and points independently
- **Series Renaming**: Rename data series for clearer legends

#### Axis Configuration
- **Custom Labels**: Rename X and Y axis labels
- **Manual Scaling**: Set min/max values or use auto-scaling
- **Tick Rotation**: Adjustable tick label rotation (especially useful for dates)
- **Grid Lines**: Toggle grid visibility for precise reading
- **Date Formatting**: Intelligent date axis formatting based on data density:
  - Milliseconds, seconds, minutes for high-frequency data
  - Hours, days for daily data
  - Months, years for long-term trends

#### Chart Layout
- **Dimensions**: Configurable width and height (default 800x500)
- **Margins**: Optimized margins for axis labels and legends
- **Title**: Custom chart titles for each file or combined view
- **Legend**: Show/hide and position control
- **Responsive**: Adapts to container width when not manually set

### Export Capabilities
- **SVG Export**: Vector format for high-quality prints and further editing
- **PNG Export**: Raster format with white background for presentations
- **Combined Export**: Export all charts as a single image
- **Individual Export**: Export each chart separately
- **Filename Control**: Custom filenames based on chart titles

### File Management
- **Drag & Drop Upload**: Intuitive file upload interface
- **File Preview**: View uploaded files with column information
- **Remove Files**: Delete individual files from the workspace
- **Batch Processing**: Handle multiple files simultaneously
- **File Validation**: Error handling for malformed CSV files

### Advanced Features
- **Time Series Support**: Special handling for temporal data
  - Automatic date detection and parsing
  - Intelligent axis formatting for different time scales
  - Support for various date formats
- **Data Normalization**: Optional normalization for comparing different scales
- **Warning System**: Alerts for potential data issues (e.g., non-numeric values)
- **Performance Optimization**:
  - Efficient D3.js rendering
  - Data clipping for large datasets
  - Debounced chart updates
- **State Persistence**: Maintains workflow state across sessions
  - Remembers current step
  - Preserves uploaded files
  - Retains chart configurations

### User Interface Features
- **Stepper Navigation**: Clear 4-step workflow guidance
- **Tab Navigation**: Easy switching between multiple files
- **Material-UI Components**: Professional, accessible UI elements
- **Responsive Design**: Works on desktop and tablet devices
- **Tooltips**: Contextual help throughout the interface
- **Error Handling**: Graceful error messages and recovery options

## Thesis-Specific Implementation Notes

### Current Status (Week 1, October 2025)
The platform is **functional** but requires refinements for usability evaluation (scheduled for Weeks 6-7, Nov 18-30).

### Critical Missing Features for Usability Evaluation
1. **Usability Metrics Tracking** - Must capture:
   - Effectiveness: Task accuracy (correct/incorrect)
   - Efficiency: Completion time, answer changes, time-to-first-click, pauses >5sec
   - Satisfaction: 5-point Likert ratings after each block, final preference
2. **Post-Block Questionnaires** - Two questions after Block 1 and Block 2:
   - "How easy was it to complete tasks with this layout?" (1-5)
   - "Would you use this layout in your work?" (1-5)
3. **Final Preference Question** - "Which layout did you prefer overall?" (overlay/small multiples/no preference)
4. **Layout Enforcement** - Must prevent participants from switching layouts mid-task
5. **Counterbalancing Logic** - Must implement automatic Group A/Group B assignment
6. **Data Export** - Must export all usability metrics in CSV/JSON format

See `implementation-refinement-plan.md` for detailed requirements.

### Experimental Tasks
Six tasks are defined in `experiment-tasks-design.md`:
- **T1:** Variability detection (identify highest day-to-day variability)
- **T2:** Correlation assessment (find inverse relationship)
- **T3:** Anomaly detection (find maximum AQI value)
- **T4:** Trend comparison (identify greatest change between periods)
- **T5:** Temporal analysis (count co-occurrence events)
- **T6:** Long-term trends (identify increasing variables)

Each task has verified correct answers based on the test datasets.

### Study Workflow
1. Participant demographics collection
2. Informed consent
3. Training/practice task
4. **Block 1:** 3 tasks with Layout A (overlay OR small multiples)
5. Brief break
6. **Block 2:** 3 tasks with Layout B (alternate layout)
7. Post-study questionnaire (NASA-TLX for subjective workload)

### Key References
- **Methods framework:** Wohlin et al. - Experimentation in Software Engineering
- **Cognitive principles:** Johnson - Mind in Mind (perception and visual processing)
- **Visualization theory:** Gleicher et al. (2011) - Visual comparison for information visualization
- **Environmental context:** Grainger et al. (2016) - Environmental data visualisation for non-scientific contexts




