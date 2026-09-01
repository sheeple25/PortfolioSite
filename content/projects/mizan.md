---
title: Mizan
subtitle: A flatpack aluminium shelf with no hardware in it.
description: An all-metal, zero-hardware shelving system that slide-fits together by hand and carries over 100kg on sheet aluminium.
date: 2022-11-30
rank: 5
category: furniture
place: CEPT University
term: Fall 2022
role: Solo — design, simulation, fabrication
skills:
  - Furniture Design
  - CAD Modelling
  - Fabrication
  - Structural Design
# Confirmed from the body text below ("Solidworks simulation drove the rest").
tools:
  - Solidworks
cover: /archive/mizan-hero.webp
coverAlt: The Mizan shelf, an aluminium slide-fit shelving system.
titleEffect: assemble
expandable: false
tags:
  - Furniture
  - Making
  - Academic
  - Physical Product
---

A flatpack shelf for homes, in metal, that the buyer assembles without tools or fasteners.

## The Constraints

Metal only. Flats only — sheet much longer than it is wide. Flatpackable. Assembled by the user. And buildable as a 1:1 prototype with workshop processes, nothing exotic.

That last one killed more ideas than the rest combined.

## Starting Simple

The simplest way to join two perpendicular pieces is a slot. So that's where I started, and the design worked backwards from it.

Two things got dropped early.

**Perforating the horizontal member** to save weight. Unadvisable in aluminium at the sheet thickness I was working to.

**Push-in joinery** to hold the flats at the joints. The 3D-printed pieces failed repeatedly — either too stiff to push home, or flimsy enough to snap.

Both failures pointed the same way: stop adding parts. The joint had to come out of the sheet itself.

## The Thin Span

I wanted an unaided span along the length of the shelf, on as thin a sheet as possible. The reference was Junya Ishigami's *Impossibly Thin Table*.

That goal narrowed the iteration to one question: how do you stiffen an edge without adding material or thickness?

The answer was **teardrop hemming** on the edges, and **tab-and-slot joinery** at the joints. Hemming folds the edge back on itself into a closed curve, which raises bending stiffness where the span needs it, at no weight cost and no extra part.

Solidworks simulation drove the rest. Load-test, find where it deflects, add geometry there, test again.

## No Wobble

A zero-hardware shelf's real failure mode isn't collapse. It's racking — the whole frame leaning as a parallelogram.

Three things fix it, all of them geometry.

**A bent vertical member**, which resists deflection along the axis a flat one folds on.

**Arrowhead indents** on the shelf.

**Flange tabs** that lock the shelf to the leg.

Assembled, the shelf holds square with nothing but its own shapes.

## The Prototype

1005 × 300 × 1000mm. 12-gauge 7075 aluminium for shelf and legs, PLA feet. 11.5kg, carrying up to around 110kg.

Wire brushed, anodised, then lacquered to a gloss.

Making it meant learning sheet metal fabrication from the beginning, and adjusting dimensions to what the workshop could actually hold and bend.

## What I Learned

How to develop an idea by iteration rather than by decision, and how to fabricate in metal at full scale.

The design improved most when a part was removed. Every fastener I designed out made the object both simpler to assemble and stiffer once assembled.
