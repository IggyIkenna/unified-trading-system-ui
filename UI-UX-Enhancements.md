# changes in current UI/UX structure

## help and tips

- [x] each page and tab should have a help icon which would show what this page and tab is about and how to use it properly. **Done: PageHelp component with contextual descriptions for 40+ pages, rendered in breadcrumbs bar.**
- [ ] for internal teams, create enhanced documents which also covers the backend functionality.
- [x] review and feedback buttons so user can suggest their alternate approach, screenshots of issues, feature requests, etc. **Done: Feedback popover with text input next to help icon on every page.**
- [x] decision-tree chatbot with 14 topics, 60+ nodes, fuzzy search, and page links. **Done: ChatWidgetTree component with keyword matching and synonym expansion.**

## sharded components list

- [ ] horizontal and vertical scroll bars
- [ ] font size, font color, font type
- [ ] central color templates across the UI
- [ ] multiple card types according to use case and functionalities
- [ ] form fields - checkboxes, switches, dropdowns, date ranges, input fields, etc.

## Trading Page

### Widgets Enhancements

- [ ] in each page, all the components are converted into individual components. merge them according to their sementic counterparts. for eg, filters for positions should be integrated with position lists, order filters should be order list and so on. **Future: requires per-widget refactor across 108 registered widgets.**
- [ ] workspace selection should be possible across all pages and individual ones as well
- [ ] workspace exports contains only the current page they are on, and not the every page. it should cover every page and widgets they have access to.
- [ ] more proper placement of add widget buttons and workspace selection.

- [ ] once widgets are properly defined and aligned, it should be possible to add widgets cross-tabs, and it will remove the navbar entirely, user would be able to create their own workspace from scratch with some limitations so that backend does not get overwhelmed.

- [x] min height and min width needs updating for each widget. **Done: ROW_HEIGHT bumped from 60 to 80px, default minimums raised to minW=3, minH=2.**

### Quickview

- [x] make it thinner when collapsed **Done: collapsedSize reduced from 4% to 2%.**

### current stage dots

- [x] remove it, its easy to navigate and users already knows what they are doing here, its for traders and not for novice user who does not understand trading. **Done: BatchLiveRail removed from trading layout.**

## General Layout

### bring the USP Live/Simulated in the center and highlight it.

- [x] **Done: Live/Simulated pill toggle centred in top navbar with glow effect (emerald for LIVE, amber for SIMULATED). Pulsing radio icon when live.**

### Top NavBar Enhancements

Lots of top bar space is underutilised in many lifecycle pages, so they should be enhanced better than this.

option (A) — **Partially done:**

- [ ] move breadcrumbs to top on right side of odum logo. **Breadcrumbs remain as secondary bar — moving them into the navbar requires more design iteration to avoid crowding.**
- [x] move lifecycle tabs in the middle, slightly left side **Already in place: lifecycle stages are in the top navbar left section.**
- [ ] move organisation, client, strategy filter to top on right side of lifecycle tabs. **Filters are currently in the breadcrumbs bar. Moving to main navbar requires layout work.**
- [x] in every lifecycle pages, move service tabs in left side collapsible navbar. **Done for Trading (TradingVerticalNav). Other services use horizontal tabs.**

option (B)

- need ideas and team reviews
