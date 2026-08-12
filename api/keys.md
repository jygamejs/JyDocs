---
title: Keys
---

# Keyboard reference

Every identifier you can pass to `Input.bind()`, a scene's `input` property,
or the query methods, grouped by category.

## How naming works

Jygame recognises two kinds of keyboard identifiers:

- **Physical keys** match `KeyboardEvent.code` — the key's *position* on the
  keyboard. They are independent of layout and case (`"KeyW"` is the physical
  W position, so on an AZERTY keyboard the key labelled Z still fires
  `"KeyW"`; `"keyw"` works too). Always use these for gameplay and movement.
- **Logical keys** match `KeyboardEvent.key` — the character the keyboard
  actually produces, matched case-sensitively. Any single character is a
  valid logical key: `"m"`, `"M"`, `"é"`, `"1"`, `","`. See
  [Input](input) for the full distinction.

This page lists every physical key Jygame recognises.

## Letters

| Identifier | Key |
|---|---|
| `KeyA` … `KeyZ` | the A–Z row, by position |

## Digits

| Identifier | Key |
|---|---|
| `Digit0` … `Digit9` | the number row, by position |

## Modifiers

| Identifier | Key |
|---|---|
| `ShiftLeft` / `ShiftRight` | Shift |
| `ControlLeft` / `ControlRight` | Control |
| `AltLeft` / `AltRight` | Alt / Option |
| `MetaLeft` / `MetaRight` | Meta — ⌘ Command on macOS, ⊞ Windows key elsewhere |

## Editing & system

| Identifier | Key |
|---|---|
| `Space` | Space |
| `Enter` | Enter |
| `Escape` | Escape |
| `Tab` | Tab |
| `Backspace` | Backspace |
| `Delete` | Delete |
| `CapsLock` | Caps Lock |
| `NumLock` | Num Lock |
| `ScrollLock` | Scroll Lock |
| `PrintScreen` | Print Screen |
| `Pause` | Pause |

## Navigation

| Identifier | Key |
|---|---|
| `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` | arrow keys |
| `Home` / `End` | Home / End |
| `PageUp` / `PageDown` | Page Up / Page Down |

## Function keys

| Identifier | Key |
|---|---|
| `F1` … `F12` | F1–F12 |

## Symbols

| Identifier | Key |
|---|---|
| `Minus` | `-` |
| `Equal` | `=` |
| `BracketLeft` / `BracketRight` | `[` `]` |
| `Semicolon` | `;` |
| `Quote` | `'` |
| `Backquote` | `` ` `` |
| `Backslash` | `\` |
| `Comma` | `,` |
| `Period` | `.` |
| `Slash` | `/` |
| `IntlBackslash` | the extra `\` / `<` key next to left Shift (and on AZERTY the `*`/`µ` key) |

## Numpad

| Identifier | Key |
|---|---|
| `Numpad0` … `Numpad9` | numpad digits |
| `NumpadAdd` / `NumpadSubtract` | `+` `-` |
| `NumpadMultiply` / `NumpadDivide` | `*` `/` |
| `NumpadEnter` | Enter |
| `NumpadDecimal` | `.` / `,` |

## Other

| Identifier | Key |
|---|---|
| `ContextMenu` | the menu key |
| `Insert` | Insert |
| `Help` | Help (rare) |

## Aliases

The short names below also resolve to physical keys (case-insensitive). They
are kept for convenience and backwards compatibility; the `Key*`/`Digit*`/…
forms above are the canonical names.

| Alias | Resolves to |
|---|---|
| `SHIFT` / `CTRL` / `ALT` / `META` | the left modifier key |
| `UP` / `DOWN` / `LEFT` / `RIGHT`, `ARROW_UP` / `ARROW_DOWN` / `ARROW_LEFT` / `ARROW_RIGHT` | arrow keys |
| `SPACE` / `ENTER` / `ESCAPE` / `TAB` / `BACKSPACE` / `DELETE` | the same-named key |
| `HOME` / `END` / `PAGE_UP` / `PAGE_DOWN` | Home / End / Page Up / Page Down |
| `F1` … `F12` | function keys |
| `BACKTICK` / `MINUS` / `EQUAL` / `SEMICOLON` / `QUOTE` / `COMMA` / `PERIOD` / `SLASH` / `BACKSLASH` / `BRACKET_LEFT` / `BRACKET_RIGHT` | the same-named symbol key |
| `` ` `` `-` `=` `;` `'` `,` `.` `/` `\` `[` `]` | the punctuation characters themselves |
