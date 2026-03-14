# CLAUDE.md — Wolfman Website Project

## Who is Wolfman?

Wolfman is a mindful living brand built on outward truth and inner 
honesty. Through mindfulness, self-exploration, and gratitude, Wolfman 
shows that life's smallest moments can become its greatest joys. 
Purpose is found in the doing. Joy is meant to be shared.

The Wolfman brand is the personal expression of Matthew Wolfman — 
a data engineer, mountain biker, photographer, wood carver, and 
mindful human being based in the UK. Everything on this site is 
authentic, personal, and real.

---

## The Website

**Domain:** wolfman.blog  
**Deployment:** Git → GitHub → Netlify (auto-deploys on push)  
**Local folder:** C:\Users\matth\wolfman-website  
**Stack:** HTML, CSS, JavaScript (vanilla to start, expanding as needed)

---

## Site Structure

### Blog — Morning Intentions
The heart of the site. Matthew writes a daily morning intention post 
and shares it here first, then links to it from LinkedIn, Facebook, 
and Instagram.

Each post has three sections:
- **Today's Intention** — a story, observation or reflection that 
leads to a lesson or intention for the day
- **I'm Grateful For** — something specific, vivid and personal. 
Could be a Honda engine, a walk, a moment. Never generic.
- **Something I'm Great At** — a strength, owned with confidence 
and without apology

**Reading experience — this is critical:**
- When a post opens, the reader sees NOTHING but the text
- No navigation, no header, no logo, no clutter
- Pure text, like opening a book
- At the very bottom, AFTER the text: "You have been reading... 
[post title]"
- Below that: the animated Wolfman wolf logo — gently pulsing, 
inviting a click
- Clicking the logo returns the reader to the home page
- This experience is sacred. Never compromise it.

### Home Page
- Minimal. Almost empty.
- A beautiful script font displays: "Hello, I'm Matthew Wolfman"
- Nothing else above the fold
- Below: gentle navigation to Blog, About, Shop

### About
- Matthew's story — who he is, how he lives, what Wolfman means
- Warm, personal, honest

### Shop
- Photography canvases and prints — Matthew's own photography
- Wellbeing themed clothing
- Print-on-demand via Printful or Printify API integration
- Stripe for payments

---

## Brand & Design

### Primary Palette (from the logo)
- **Steel Blue:** `#4A7FA5` — navigation, structural elements
- **Copper/Bronze:** `#A0622A` — accents, highlights
- **Charcoal:** `#4A4A4A` — body text, dark backgrounds
- **White:** `#FFFFFF` — reading backgrounds, reversed text
- **Black:** `#000000` — wolf illustration, strong contrast moments

### Statement / CTA Colour
- **Deep Navy:** `#214459` — primary call-to-action buttons and high-impact actions only
  - Always paired with **white text**
  - Use sparingly — reserve for the most important action on a page
  - This colour commands attention; don't dilute it by overusing it

### Extended Palette (supporting / accent use)
- **Emerald Green:** `#3AB87A`
- **Royal Blue:** `#2A6AB0`
- **Mustard/Gold:** `#C8B020`
- **Cornflower Blue:** `#6090C0`
- **Crimson Red:** `#A82020`
- **Teal:** `#70C0C8`
- **Powder Blue:** `#A8D0E0`
- **Mid Grey:** `#909090`
- **Copper/Terracotta:** `#C87840`

### Logo
- The Wolfman wolf mark — a howling wolf across three panels 
(blue, copper, grey)
- Used as a round icon at the bottom of blog posts
- Should animate gently — a pulse or subtle glow — to invite 
interaction
- Never cluttered around. Give it space.

### Typography
- **Headings / Hero:** Script or serif font — warm, human, personal
- **Body / Blog text:** Clean, highly readable serif — like reading 
a book. Generous line height. Comfortable margins.
- **Navigation:** Minimal sans-serif — understated, never dominant

### Design Principles
- Minimalism above everything
- Photography and words are the heroes — never compete with them
- White space is not empty — it is intentional
- Every element must earn its place on the page
- Never add UI chrome that distracts from the reading experience
- Mobile first — the morning posts will be read on phones

---

## Tone of Voice

Matthew's writing voice is:
- **Honest** — he examines himself without flinching
- **Warm** — never cold or corporate
- **Self-aware** — finds humour in his own contradictions
- **Philosophical** — goes deep, but always comes back to 
something real and practical
- **Energetic** — ends with forward momentum, never defeat
- **Never preachy** — shares experience, never lectures

When writing any copy for this site — navigation labels, 
button text, error messages, about page, product descriptions — 
always match this voice. Nothing generic. Nothing corporate.

---

## Content Guidelines

- Blog posts are written by Matthew and pasted in — never 
AI-generated
- Product descriptions should feel like Matthew wrote them
- Image alt text should be descriptive and warm, not mechanical
- SEO matters but never at the expense of the reading experience

---

## Technical Rules

- Always maintain the Git workflow: add → commit → push
- Commit messages should be descriptive and human
- Never break the mobile reading experience
- Images should be optimised before adding to the repo
- Keep the folder structure clean:
  - `/images` — site images and logos
  - `/images/site_images` — product and photography images
  - `/posts` — blog post HTML files (to be created)
  - `/css` — stylesheets
  - `/js` — javascript files

---

## What Wolfman is NOT

- Not corporate
- Not cluttered
- Not generic
- Not preachy
- Not trying to be everything to everyone
- Not compromising the reading experience for any reason

---

## The Vision

A reader finds a Wolfman post on LinkedIn during their lunch break. 
They click the link. The words fill their screen. They read. They 
feel something. They finish. They see "You have been reading..." 
They smile. They click the wolf. They arrive at "Hello, I'm Matthew 
Wolfman." They want to know more. They find the shop. They buy a 
canvas that reminds them of how they felt reading that post.

That is the Wolfman journey. Every decision we make should serve it.