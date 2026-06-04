# User mode architecture

Modes are configured in `constants/userModes.js` and `constants/modeExperience.js`.

Registry: `src/governance/registries/modes.js`

## Selectable modes

| Mode | Lending | Key engines | Isolated UI |
|------|---------|-------------|-------------|
| Salaried | Yes | survival, salaryBreakdown | RoleDashboardPanel |
| Business | Yes | modeBusiness | BusinessCashflowPanel |
| Freelancer | Yes | modeFreelancer | RoleDashboardPanel |
| Student | No | modeStudent | — |

## Legacy modes (migrated on load)

- **family** → household tooling via `modeFamily.js`, `familyCalendar.js`
- **power** → full tool set via `MODE_TOOL_IDS`

## Shared across modes

- Burden, forecast, pressure scoring
- Commitments & payments model
- Notification / reminder pipeline

## Isolation rules

- Mode-specific engines (`modeBusiness.js`, etc.) should only be imported from hooks, dashboard panels, or `modeExperience.js`.
- Avoid `mode === "…"` branches outside the allowlist in `modes.js` registry — audit: `npm run audit:modes`.

## Tools per mode

`MODE_TOOL_IDS` in `modeExperience.js` drives calculator tiles; each id must have `activeTool === "id"` handler in `DashboardTools.jsx`.
