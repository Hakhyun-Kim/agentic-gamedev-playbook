## 7. Game Feel (Juice) & Controls Checklist

Low-cost, high-impact polish features to make games feel responsive and tactile.

- [ ] **Ghost Health Bar:** Primary HP bar decreases instantly; trailing yellow bar follows after a 0.5s delay.
- [ ] **Hit Flash:** Flash unit white + subtle scale-up upon taking damage.
- [ ] **Combo Pop:** Spring easing (`cubic-bezier(0.2,1.6,0.4,1)`) pop-up text chips for combo streaks.
- [ ] **Edge Screen Flash:** Red vignette pulse on base or player damage.
- [ ] **Low HP Pulse & Heartbeat:** Synchronized screen pulse with low-frequency heartbeat audio.
- [ ] **Floating Damage & Gold Numbers:** Numbers float upward and fade out.
- [ ] **Range Circles & Boss Health Bars:** Standard UI indicators (range indicators, upcoming wave previews).
- [ ] **First-Time Coach Chips:** Single-use coach tips with immediate start buttons.
- [ ] **Shareable Result Cards:** Canvas-rendered summary card PNG generator for social sharing.

### 7.1 Centralizing Feedback Dispatchers

Attach sound effects, visual popups, and toast notifications to a **centralized action queue** rather than scattering invocations across individual feature modules.

### 7.2 Keyboard-First & Predictive UI Standards

1. **Keyboard Binding Standards:** Support standard navigation (Enter to confirm, Space for primary action, Esc to close/cancel, Arrow/Tab to cycle selection).
2. **Predictive Auto-Advancement:** Automatically advance screens after displaying positive outcomes (0.8–1.2s delay). Do not auto-advance failure screens to allow players time to review errors.
3. **Robust Input Handling:** Ensure global key listeners process primary actions even when text inputs lose focus, correctly filtering IME composition states (`ev.isComposing`).

### 7.3 Pointer Precision Media Queries

Detect mobile touch input using `matchMedia('(pointer: coarse)')` instead of User-Agent string parsing. Unify virtual joystick rendering and UI hint text under a single detection constant.
