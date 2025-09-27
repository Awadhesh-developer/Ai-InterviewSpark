# 🎨 InterviewSpark Theme Guide

## Overview
InterviewSpark uses a comprehensive design system with consistent theming across light and dark modes. All components use CSS custom properties that automatically adapt to the selected theme.

## Theme Architecture

### CSS Custom Properties
The theme system is built on CSS custom properties defined in `globals.css`:

#### Light Mode Colors
- `--background`: Main background color
- `--foreground`: Primary text color
- `--card`: Card background color
- `--card-foreground`: Card text color
- `--primary`: Primary brand color
- `--primary-foreground`: Text on primary color
- `--secondary`: Secondary color
- `--muted`: Muted background color
- `--muted-foreground`: Muted text color
- `--accent`: Accent color for highlights
- `--destructive`: Error/danger color
- `--border`: Border color
- `--input`: Input field background
- `--ring`: Focus ring color

#### Dark Mode Colors
All colors automatically switch when `dark` class is applied to the HTML element.

## Theme-Aware Components

### ✅ Properly Themed Components
- **UI Components**: All components in `/components/ui/` use theme variables
- **Login Page**: Uses theme-aware colors and includes theme toggle
- **Dashboard Layout**: Sidebar and main content use proper theme colors
- **Landing Page Header**: Navigation and branding use theme colors

### 🔧 Theme Utilities

#### CSS Classes
```css
.theme-transition          /* Smooth theme transitions */
.text-gradient-primary     /* Primary color text gradient */
.gradient-primary          /* Primary color background gradient */
.gradient-mesh            /* Complex gradient mesh background */
.glass                    /* Glass morphism effect */
.shadow-elevation-low     /* Subtle shadow */
.shadow-elevation-medium  /* Medium shadow */
.shadow-elevation-high    /* Strong shadow */
```

#### Animation Classes
```css
.animate-fade-in          /* Fade in animation */
.animate-slide-in         /* Slide in animation */
.animate-pulse-slow       /* Slow pulse animation */
```

## Theme Toggle Implementation

### Components
- `SimpleThemeToggle`: Basic toggle button
- `ThemeToggle`: Dropdown with Light/Dark/System options

### Usage
```tsx
import { SimpleThemeToggle } from '@/components/theme-toggle'

// In your component
<SimpleThemeToggle />
```

## Color Usage Guidelines

### ✅ DO Use Theme Variables
```tsx
// Good - Uses theme variables
<div className="bg-background text-foreground">
<div className="text-primary border-border">
<div className="bg-card text-card-foreground">
```

### ❌ DON'T Use Hardcoded Colors
```tsx
// Bad - Hardcoded colors
<div className="bg-white text-black">
<div className="text-blue-600 border-gray-300">
<div className="bg-gray-100 text-gray-900">
```

## Component-Specific Guidelines

### Buttons
- Use Button component variants: `default`, `secondary`, `outline`, `ghost`, `destructive`
- All variants automatically adapt to theme

### Cards
- Use Card component with `bg-card` and `text-card-foreground`
- Borders use `border-border`

### Text Elements
- Primary text: `text-foreground`
- Secondary text: `text-muted-foreground`
- Links: `text-primary hover:text-primary/80`

### Backgrounds
- Main background: `bg-background`
- Card backgrounds: `bg-card`
- Muted backgrounds: `bg-muted`
- Accent backgrounds: `bg-accent`

### Borders
- Standard borders: `border-border`
- Input borders: `border-input`
- Focus rings: `ring-ring`

## Theme Testing Checklist

### Visual Consistency
- [ ] All text is readable in both light and dark modes
- [ ] Borders are visible but not harsh
- [ ] Interactive elements have proper hover states
- [ ] Focus states are clearly visible
- [ ] No hardcoded colors remain

### Functionality
- [ ] Theme toggle works on all pages
- [ ] Theme preference persists across sessions
- [ ] System theme detection works
- [ ] Smooth transitions between themes

### Components
- [ ] Login page fully themed
- [ ] Dashboard sidebar themed
- [ ] Landing page header themed
- [ ] All UI components themed
- [ ] Forms and inputs themed

## Advanced Features

### Glass Morphism
```tsx
<div className="glass">
  <!-- Content with glass effect -->
</div>
```

### Gradient Backgrounds
```tsx
<div className="gradient-primary">
  <!-- Primary gradient background -->
</div>
```

### Elevation Shadows
```tsx
<div className="shadow-elevation-medium">
  <!-- Card with medium elevation -->
</div>
```

## Browser Support

### Theme Features
- CSS Custom Properties: All modern browsers
- Dark mode media query: All modern browsers
- Backdrop filter (glass effect): Modern browsers with fallbacks

### Fallbacks
- Glass effect gracefully degrades
- Animations can be disabled via `prefers-reduced-motion`
- Colors have sensible fallbacks

## Performance Considerations

### Optimizations
- CSS custom properties are efficient
- Theme transitions use GPU acceleration
- Minimal JavaScript for theme switching
- No flash of unstyled content (FOUC)

### Best Practices
- Use `theme-transition` class for smooth changes
- Avoid inline styles that override theme colors
- Test with slow connections and devices
- Ensure accessibility in both themes

## Accessibility

### Color Contrast
- All color combinations meet WCAG AA standards
- High contrast mode support
- Reduced motion support

### Focus Management
- Clear focus indicators in both themes
- Keyboard navigation works consistently
- Screen reader compatibility maintained

## Future Enhancements

### Planned Features
- Custom theme creation
- More color scheme options
- Advanced animation controls
- Theme-aware illustrations

### Extensibility
The theme system is designed to be easily extended with new colors, components, and features while maintaining consistency and accessibility.
