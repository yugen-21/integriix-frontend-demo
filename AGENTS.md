# AGENTS.md — Integriix C-Suite Daily Brief Frontend Build Plan

## Project Context

Integriix is an AI-native healthcare governance platform for hospital leadership.  
This frontend MVP is a **C-suite Daily Brief** dashboard that shows the most important daily signals across safety, compliance, operations, finance, audits, and patient experience.

The goal is **not** to build the full platform at once.  
The goal is to build the frontend step by step using mock data, with each step producing a visible, reviewable UI section.

---

## Core Product Goal

Build a React.js dashboard that gives hospital executives a quick daily briefing:

- What happened today?
- What needs attention?
- What risks are rising?
- What actions should leadership take?
- Can this be summarized as a 5–10 minute video briefing?

The dashboard should feel like a professional healthcare command center: clean, premium, blue-themed, executive-friendly, and easy to scan.

---

## Suggested Tech Stack

- React.js
- Vite
- Tailwind CSS or CSS Modules
- React Router, if multiple pages are needed
- Recharts or Chart.js for charts
- Remotion for video briefing generation
- Mock JSON data initially
- Optional later: FastAPI / Node.js backend

---

## Important Build Rule

Do **not** generate the entire dashboard in one step.

Each step should be built independently, reviewed, and improved before moving to the next step.

Preferred workflow:

1. Build one section
2. Use mock data
3. Review design and spacing
4. Refactor into reusable components
5. Move to next section

---

# Step 1 — Base Dashboard Layout

## Goal

Create the basic dashboard shell before adding any real insights.

This step should only focus on layout, structure, spacing, theme, and navigation.

## Views / Sections to Cover

### 1. Sidebar / Navbar

Create a left sidebar or top navigation for the main dashboard areas.

Suggested nav items:

- Daily Brief
- Safety
- Compliance
- Operations
- Finance
- Audits
- Patient Experience
- Settings

For the MVP, only **Daily Brief** needs to be active.

### 2. Header

Create a top header for the daily brief page.

### 3. Main Content Base

Create the main content container with a clean grid layout.

Suggested structure:

- Top summary area
- Video briefing section placeholder
- Insights / alerts section placeholder
- Performance cards placeholder

At this stage, use placeholder cards only.

## Mock Data Needed

```js
const dashboardMeta = {
  hospitalName: "Al Noor Medical Center",
  date: "27 April 2026",
  overallStatus: "Moderate Risk",
  userRole: "Chief Quality Officer",
};
```

## Expected Output

A clean dashboard shell with:

- Sidebar / navbar
- Header
- Main content area
- Placeholder cards
- Responsive layout

## Do Not Build Yet

Do not build video logic, alerts, charts, or detailed cards in this step.

---

# Step 2 — Daily Video Briefing Section

## Goal

Add the main executive video briefing area.

This is the most important part of the dashboard. The video should feel like the C-suite can watch one short briefing instead of reading every dashboard detail.

## Views / Sections to Cover

### 1. Video Hero Card

Create a large card near the top of the dashboard.

It should include:

- Title: `Today’s Executive Briefing`
- Subtitle: `5–10 minute AI-generated governance summary`
- Video thumbnail or placeholder
- Play button
- Duration badge, for example `07:32`
- Last generated time, for example `Generated at 8:00 AM`

### 2. Briefing Summary Beside or Below Video

Add a compact summary of what the video covers.

Suggested bullets:

- Patient safety risks
- Compliance deadlines
- Operational bottlenecks
- Financial leakage signals
- Priority leadership actions

### 3. Video Actions

Buttons:

- Play Briefing
- Regenerate Briefing
- Download Summary
- View Script

Only UI is needed for now. Buttons do not need full functionality yet.

## Mock Data Needed

```js
const videoBrief = {
  title: "Today’s Executive Briefing",
  duration: "07:32",
  generatedAt: "8:00 AM",
  status: "Ready",
  summary: [
    "Medication incidents increased in ICU and Emergency.",
    "Two compliance evidence items are overdue.",
    "Bed discharge delays are affecting patient flow.",
    "Revenue leakage risk detected in rejected claims.",
    "Three leadership actions are recommended today.",
  ],
};
```

## Remotion Planning

For this step, only prepare the frontend UI for video.

Do not fully implement Remotion yet unless specifically requested.

Later Remotion flow:

1. Dashboard insights are converted into a narrative JSON
2. Narrative JSON is passed into a Remotion composition
3. Remotion renders scenes like title, summary, risks, trends, and actions
4. Rendered video is shown in the dashboard

Example narrative JSON:

```json
{
  "scene": "title",
  "text": "Medication Errors Increased in March"
}
```

## Expected Output

The dashboard should now clearly show the video briefing as the main product feature.

## Do Not Build Yet

Do not build complex Remotion rendering, backend APIs, or real video generation in this step.

---

# Step 3 — Critical Alerts Beneath Video

## Goal

Add the first set of insight components below the video: alerts and urgent items.

These should help the C-suite quickly understand what needs attention today.

## Views / Sections to Cover

### 1. Critical Alerts Card

Create a section called:

`Critical Alerts Requiring Attention`

Each alert should show:

- Alert title
- Severity: High / Medium / Low
- Department
- Source system
- Short description
- Recommended action
- Owner
- Due time

Example alerts:

- Medication errors increased in ICU
- Infection control threshold crossed
- Claims denial spike detected
- Audit evidence overdue

### 2. Alert Severity Design

Use visual badges:

- High: red tone
- Medium: amber tone
- Low: blue or green tone

Keep it professional and not too loud.

### 3. Action-Oriented Layout

Each alert should answer:

- What happened?
- Why does it matter?
- What should be done next?

## Mock Data Needed

```js
const criticalAlerts = [
  {
    title: "Medication incidents increased",
    severity: "High",
    department: "ICU",
    source: "Incident Reporting",
    description: "Medication-related incidents rose above the daily threshold.",
    action: "Review medication administration process and close overdue CAPAs.",
    owner: "Chief Nursing Officer",
    due: "Today, 4:00 PM",
  },
  {
    title: "Audit evidence overdue",
    severity: "Medium",
    department: "Quality & Compliance",
    source: "Audit Tools",
    description:
      "Two accreditation evidence items are still pending submission.",
    action: "Assign owners and upload missing evidence documents.",
    owner: "Compliance Lead",
    due: "Tomorrow, 10:00 AM",
  },
];
```

## Expected Output

A clear alerts section below the video briefing that makes the dashboard feel operational and useful.

---

# Step 4 — Executive KPI Cards

## Goal

Add a row of high-level daily KPI cards for quick C-suite scanning.

## Views / Sections to Cover

Suggested KPI cards:

1. Overall Governance Score
2. Patient Safety Risk
3. Compliance Readiness
4. Operational Flow
5. Financial Risk
6. Audit Readiness

Each card should include:

- KPI name
- Score or metric
- Trend direction
- Small explanation
- Status badge

## Mock Data Needed

```js
const executiveKpis = [
  {
    label: "Governance Score",
    value: "82%",
    trend: "-3%",
    status: "Moderate Risk",
    note: "Safety and audit gaps reduced today’s score.",
  },
  {
    label: "Compliance Readiness",
    value: "76%",
    trend: "+2%",
    status: "Watch",
    note: "Evidence completion improved, but two items remain overdue.",
  },
];
```

## Expected Output

A concise KPI strip that gives an executive summary at a glance.

---

# Step 5 — Insight Story Cards

## Goal

Add narrative insight cards that explain the story behind important trends.

These are not just charts. They should explain why something matters.

## Views / Sections to Cover

Each insight card should include:

- Insight title
- Source systems
- What changed
- Possible root cause
- Business / safety impact
- Recommended action

Example cards:

- Medication errors increased due to lower training completion
- Bed discharge delays increased average length of stay
- Claims denials rose due to documentation gaps
- Patient complaints show recurring wait-time sentiment

## Mock Data Needed

```js
const insightStories = [
  {
    title: "Medication errors increased in high-acuity units",
    sources: ["Incident Reporting", "ICU Systems", "Training Logs"],
    change: "Medication incidents increased by 18% compared to yesterday.",
    rootCause: "Training completion dropped in ICU and Emergency departments.",
    impact: "Higher patient safety and accreditation risk.",
    action: "Run focused retraining and review medication safety CAPAs.",
  },
];
```

## Expected Output

Cards that make the dashboard feel intelligent and executive-ready.

---

# Step 6 — Data Source Health Panel

## Goal

Show that the dashboard is powered by multiple hospital systems.

This helps explain the platform’s integrated value.

## Views / Sections to Cover

Create a section called:

`Connected Data Sources`

Group sources into:

- Clinical Systems
- Operational Systems
- Quality & Safety Systems
- Financial & Supply Chain Systems
- External & Unstructured Data
- Audit & Compliance Data

Each source group should show:

- Number of connected systems
- Last synced time
- Health status
- Example outputs

## Mock Data Needed

```js
const dataSources = [
  {
    category: "Clinical Systems",
    systems: [
      "EMR/EHR",
      "ICU Systems",
      "Laboratory Systems",
      "Radiology Systems",
    ],
    status: "Healthy",
    lastSync: "7:45 AM",
    outputs: ["Risk signals", "LOS indicators", "Readmission indicators"],
  },
];
```

## Expected Output

A professional source-health panel that supports the idea of a 360-degree hospital governance view.

---

# Step 7 — Priority Actions Panel

## Goal

Convert insights into action.

This section should show what leadership needs to do today.

## Views / Sections to Cover

Create a section called:

`Recommended Leadership Actions`

Each action should include:

- Action title
- Reason
- Owner
- Due date / time
- Linked alert or insight
- Status

Example actions:

- Close overdue CAPAs
- Review claims denial documentation
- Assign audit evidence owner
- Increase staffing in overloaded department

## Mock Data Needed

```js
const priorityActions = [
  {
    title: "Close overdue medication safety CAPAs",
    reason: "Medication incidents crossed the high-risk threshold.",
    owner: "Chief Nursing Officer",
    due: "Today",
    linkedTo: "Medication incidents increased",
    status: "Open",
  },
];
```

## Expected Output

The dashboard should now move from passive reporting to action-oriented governance.

---

# Step 8 — Optional Charts and Trends

## Goal

Add lightweight visual trends after the main executive sections are stable.

Charts should support the story, not dominate the dashboard.

## Views / Sections to Cover

Suggested charts:

- Medication incidents trend
- Compliance readiness over time
- Bed occupancy / discharge delay trend
- Claims denial trend
- Patient sentiment trend

Use simple line charts, bar charts, or mini sparklines.

## Expected Output

Small, clean charts that add credibility and make trends easier to understand.

---

# Step 9 — Remotion Video Generation Integration

## Goal

Connect the dashboard insight data to a Remotion video composition.

This can be done after the dashboard UI is stable.

## Views / Sections to Cover

### 1. Narrative JSON Builder

Create a function that converts mock dashboard data into scenes.

Example scenes:

- Title scene
- Executive summary scene
- Critical alerts scene
- Risk drivers scene
- Recommended actions scene
- Closing scene

### 2. Remotion Composition

Create video scenes using React components.

Suggested scenes:

1. Opening title
2. Today’s overall status
3. Top 3 risks
4. Root causes
5. Financial / operational impact
6. Recommended leadership actions
7. Closing summary

### 3. Dashboard Integration

The dashboard should show:

- Generated video preview
- Script preview
- Regenerate button
- Video status

## Example Narrative JSON

```js
const briefingNarrative = [
  {
    scene: "title",
    text: "Daily Governance Brief for Al Noor Medical Center",
  },
  {
    scene: "summary",
    text: "Today’s hospital status is moderate risk due to safety incidents, audit evidence delays, and operational discharge bottlenecks.",
  },
  {
    scene: "alerts",
    bullets: [
      "Medication incidents increased in ICU.",
      "Two compliance evidence items are overdue.",
      "Claims denial risk increased due to documentation gaps.",
    ],
  },
  {
    scene: "actions",
    bullets: [
      "Close overdue medication CAPAs.",
      "Assign owners for missing audit evidence.",
      "Review claims documentation gaps.",
    ],
  },
];
```

## Expected Output

A working mock flow where dashboard data can become a structured briefing script and eventually a Remotion video.

---

# Step 10 — Final Demo Polish

## Goal

Make the MVP look polished enough for a product demo or investor presentation.

## Final Polish Checklist

- Consistent spacing
- Professional blue theme
- Clear hierarchy
- Strong video briefing hero section
- Clean mock data
- No clutter
- Responsive layout
- Empty states where needed
- Smooth hover states
- Reusable components
- Executive-friendly language

---

# Recommended File Structure

```txt
src/
  components/
    layout/
      Sidebar.jsx
      Header.jsx
      DashboardShell.jsx

    briefing/
      VideoBriefCard.jsx
      BriefingSummary.jsx
      BriefingActions.jsx

    alerts/
      CriticalAlerts.jsx
      AlertCard.jsx

    kpis/
      ExecutiveKpiCard.jsx
      ExecutiveKpiGrid.jsx

    insights/
      InsightStoryCard.jsx
      InsightStories.jsx

    data-sources/
      DataSourceHealthPanel.jsx

    actions/
      PriorityActionsPanel.jsx

  data/
    mockDashboardData.js
    mockVideoBriefData.js

  remotion/
    compositions/
      DailyBriefComposition.jsx
    scenes/
      TitleScene.jsx
      SummaryScene.jsx
      AlertsScene.jsx
      ActionsScene.jsx
    narrativeBuilder.js

  pages/
    DailyBriefDashboard.jsx

  App.jsx
  main.jsx
```

---

# Suggested Linear Task Groups

## Group 1 — Layout Foundation

- Create React app with Vite
- Configure styling system
- Build dashboard shell
- Build sidebar navigation
- Build top header
- Add base responsive layout

## Group 2 — Video Briefing

- Build video briefing hero card
- Add mock video metadata
- Add briefing summary bullets
- Add video action buttons
- Add script preview modal placeholder

## Group 3 — Alerts and Executive Signals

- Add critical alerts mock data
- Build alert card component
- Add severity badges
- Build alerts section below video

## Group 4 — KPI and Insight Layer

- Build executive KPI cards
- Add insight story cards
- Add mock root cause / impact / action data

## Group 5 — Data Source Visibility

- Build connected data sources panel
- Add source health status
- Add last sync and output labels

## Group 6 — Action Layer

- Build recommended leadership actions panel
- Add owners, due dates, statuses
- Link actions to alerts or insights

## Group 7 — Remotion Planning and Integration

- Create narrative JSON builder
- Create Remotion composition structure
- Build title, summary, alerts, and actions scenes
- Connect mock narrative to video composition

## Group 8 — Demo Polish

- Improve spacing and colors
- Add responsive behavior
- Add hover states
- Clean copy
- Prepare demo-ready mock scenario

---

# Build Priority

Start with this order:

1. Layout shell
2. Video briefing hero
3. Critical alerts
4. KPI cards
5. Insight story cards
6. Priority actions
7. Data source health
8. Remotion narrative builder
9. Remotion video composition
10. Demo polish

---

# Design Direction

Use a premium healthcare SaaS look:

- Deep navy / blue base
- White cards
- Soft borders
- Rounded corners
- Executive-friendly typography
- Minimal clutter
- Clear risk badges
- Strong visual focus on the video briefing

The dashboard should feel less like a technical analytics tool and more like a daily executive command brief.
