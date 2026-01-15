# Design Guidelines: Self Coaching Matrix Lead Magnet Funnel

## Design Approach
**Reference-Based:** Drawing from high-converting lead magnet pages (ConvertKit, Gumroad, Notion signup flows) with emphasis on trust, clarity, and minimal friction.

**Core Principle:** Remove all barriers between visitor and conversion. Every element serves the singular goal of email capture.

## Layout System

**Spacing:** Use Tailwind units of 4, 6, 8, and 12 for consistent rhythm (p-4, mb-8, gap-6, py-12).

**Container Strategy:**
- Landing page: max-w-2xl centered container for focused attention
- Thank you page: max-w-xl for even tighter focus
- Viewport usage: Natural content height, no forced 100vh

## Typography Hierarchy

**Font Stack:** Google Fonts - Inter (body/UI) + Newsreader or Fraunces (headlines for warmth)

**Scale:**
- Hero headline: text-5xl md:text-6xl, font-bold
- Subheadline: text-xl md:text-2xl, font-normal, text-gray-600
- Body text: text-base md:text-lg
- Small print/consent: text-sm, text-gray-500
- Button text: text-lg, font-semibold

## Landing Page Structure

**Hero Section (Above Fold):**
- Clean, centered layout with generous vertical padding (py-20 md:py-32)
- Headline + Subheadline stack with mb-8 spacing
- Email form: Single input field + submit button in a focused card/container with subtle shadow
- Input styling: Large, comfortable touch targets (h-14), rounded-lg, border-2 focus state
- Primary CTA button: Full visual prominence, rounded-lg, px-8 py-4
- Trust indicator below form: Small consent text with checkbox or simple disclaimer
- Optional: Subtle badge or trust element ("Loved by 1000+ coaches" or similar)

**Supporting Section (Optional, Below Hero):**
- If adding credibility, include a compact "What's Inside" section with 3 benefits
- Simple icon + text layout, single column on mobile, can use grid-cols-3 on desktop
- Each benefit: Icon, short headline, 1-line description

**Images:**
- Hero: Use a professional photograph or illustration of someone coaching/journaling, positioned beside or behind the form on desktop (two-column layout: form left, image right)
- Image treatment: Soft rounded corners (rounded-2xl), subtle shadow
- Alternative: Abstract geometric shapes or gradient background if photography doesn't fit brand

## Thank You Page Structure

**Centered Success State:**
- Checkmark icon or success illustration at top
- Headline: "Check Your Email!"
- Subtext explaining next steps: "Your Self Coaching Matrix is on its way. Check your inbox (and spam folder)."
- Two prominent CTA buttons stacked vertically (gap-4):
  1. "Download Matrix Now" (if immediate access desired)
  2. "Get the App"
- Small text: "Didn't receive it? Check spam or contact [support email]"

## Component Specifications

**Form Input:**
- Email field: border-2, border-gray-300, focus:border-blue-500, focus:ring-4, focus:ring-blue-100
- Placeholder: "Enter your email address"
- Error state: border-red-500, text-red-600 error message below

**Primary Button:**
- Solid background, white text, generous padding (px-8 py-4)
- Rounded-lg, font-semibold
- Clear hover and active states (darker shade, slight scale transform)
- Full width on mobile, auto width on desktop

**Trust Elements:**
- Consent text: Subtle color, small size, include envelope icon
- Lock icon near email input for security suggestion

## Unsubscribe Page

**Minimal Confirmation:**
- Centered message in max-w-md container
- Headline: "You're Unsubscribed"
- Body: Confirmation message
- Optional: "Changed your mind?" resubscribe link

## Visual Treatment

**Whitespace:** Generous padding throughout - never cramped. Section padding: py-16 md:py-24
**Borders:** Use sparingly, border-2 for emphasis (form inputs), border for subtle separation
**Shadows:** Soft, subtle (shadow-lg on main form card, shadow-sm on buttons)
**Rounding:** Consistent rounded-lg throughout (buttons, inputs, cards)

## Interaction States

**Form Validation:**
- Real-time feedback on email format
- Clear error messaging below input field
- Success state before submission (green checkmark icon)

**Loading State:**
- Button shows spinner + "Sending..." text during submission
- Disable form during processing

**Mobile Optimization:**
- Form takes precedence: full width, centered
- Stack all elements vertically
- Comfortable touch targets (minimum 44px height)
- Image moves below form on mobile or hidden entirely

## Accessibility

- Proper label/input associations
- Clear focus indicators on all interactive elements
- Error messages announced to screen readers
- Sufficient contrast ratios throughout

This design creates a friction-free conversion path while building trust through professional polish and clarity.