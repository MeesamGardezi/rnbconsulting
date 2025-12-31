# R&B Construction Consulting
## Landing Page Technical Plan

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Server | Node.js + Express |
| Markup | HTML5 |
| Styling | CSS3 |
| Animations | GSAP |
| Hosting | cPanel (self-hosted) |

---

## Page Sections

### 1. Navigation

| Element | Position | Behavior |
|---------|----------|----------|
| Logo | Left | Links to home |
| Nav Links | Center | About, Services, Industries, FAQ, Careers |
| CTA Button | Right | "Request a Quote" |

**Interaction:** Sticky on scroll, subtle shadow fades in after scrolling past hero.

---

### 2. Hero Section

| Element | Content |
|---------|---------|
| Headline | Construction consulting focused on structure, control, and execution |
| Subtext | Estimating · Scheduling · Operations · Project Controls |
| Primary CTA | Request a Quote |
| Secondary CTA | Contact Us |
| Background | Dark gradient + subtle grain texture |

**Animation:** Text fades up on load, staggered timing.

---

### 3. What We Do

Five service cards displayed in a horizontal row (wraps on mobile).

| Card | Description |
|------|-------------|
| Estimating | Quantity takeoffs, budgets, bid support |
| Scheduling & Planning | Baseline schedules, look-aheads, updates |
| Operations Systems | Reporting, dashboards, meeting cadence |
| Project Controls | Change orders, cost tracking, narratives |
| Preconstruction Support | Coordination, sequencing, risk analysis |

**Animation:** Cards fade in and slide up on scroll.

---

### 4. Who We Work With

Four client types in a simple grid.

| Client Type |
|-------------|
| General Contractors |
| Subcontractors |
| Developers |
| Owners |

**Layout:** 4-column on desktop, 2x2 on tablet, stacked on mobile.

---

### 5. Why R&B

Three value propositions displayed side-by-side.

| Value Prop | Supporting Text |
|------------|-----------------|
| Experience-Driven | Real-world construction background |
| Systems-Focused | Structured processes that scale |
| Execution-Oriented | Practical solutions, not theory |

**Layout:** Three columns with subtle vertical dividers.

---

### 6. CTA Section

| Element | Content |
|---------|---------|
| Background | Dark block (contrasts with sections above) |
| Headline | Ready to get started? |
| Primary Button | Request a Quote |
| Secondary Button | Contact Us |

**Purpose:** Final conversion push before footer.

---

### 7. Footer

| Column | Content |
|--------|---------|
| Brand | Logo + one-line tagline |
| Quick Links | About, Services, Industries, Contact |
| Contact | Email, Phone |
| Legal | © 2025 R&B Construction Consulting |

---

## Color Palette

| Role | Color |
|------|-------|
| Primary Dark | #0a0a0a (near black) |
| Primary Light | #ffffff |
| Accent | #d4a853 (gold) |
| Text Muted | #6b7280 (gray) |
| Background Alt | #111111 |

---

## Typography

| Use | Font |
|-----|------|
| Headings | Inter (700) |
| Body | Inter (400) |
| Fallback | system-ui, sans-serif |

---

## Responsive Breakpoints

| Device | Width |
|--------|-------|
| Mobile | < 768px |
| Tablet | 768px - 1024px |
| Desktop | > 1024px |

---

## File Structure

```
rb-construction/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── assets/
│       └── images/
```

---

## Animation Specifications

| Section | Effect | Trigger |
|---------|--------|---------|
| Hero text | Fade up + stagger | Page load |
| Nav shadow | Fade in | Scroll past hero |
| Service cards | Fade up | Scroll into view |
| Client types | Fade in | Scroll into view |
| Value props | Slide in from sides | Scroll into view |
| CTA section | Subtle scale up | Scroll into view |

---

## External Dependencies

| Package | Purpose |
|---------|---------|
| express | Static file server |
| gsap | Scroll animations |
| Google Analytics | Traffic tracking (optional) |

---

## Notes

- All CTAs link to future "Request a Quote" and "Contact" pages (placeholder hrefs for now)
- Mobile nav becomes hamburger menu
- Animations respect `prefers-reduced-motion` for accessibility
- Images optimized for web (WebP format preferred)