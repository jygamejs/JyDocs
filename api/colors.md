# Color / Colors

Jygame includes **458 named colors** from [colorhunt.co](https://colorhunt.co), organized for easy access.

## Color (flat lookup)

Direct property access by name:

```js
import { Color } from 'jygame'

Color.Black              // '#000000'
Color.SuperSilver        // '#eeeeee'
Color.CyberYellow        // '#ffd400'
Color.C64Blue            // '#3d3bf3'
Color.NeonRose           // '#ff0080'
Color.MagicalMalachite   // '#00c68d'
Color.VampireFangs       // '#cb2957'
Color.FrostedBlueberries // '#6c6eb2'
// ... 450+ more
```

## Colors (organized palette)

Colors grouped by color family, each with a primary color and named shades:

| Family | Primary | Example Shade |
|---|---|---|
| `Colors.Red` | `'#cb2957'` | `Colors.RedShades.VampireFangs` |
| `Colors.Orange` | `'#f6850c'` | `Colors.OrangeShades.AtomicOrange` |
| `Colors.Yellow` | `'#ffd400'` | `Colors.YellowShades.CyberYellow` |
| `Colors.Green` | `'#d6fb61'` | `Colors.GreenShades.MagicalMalachite` |
| `Colors.Teal` | `'#39b1d1'` | `Colors.TealShades.EmperorJade` |
| `Colors.Blue` | `'#443199'` | `Colors.BlueShades.FrostedBlueberries` |
| `Colors.Purple` | `'#792ca2'` | `Colors.PurpleShades.PurplePristine` |
| `Colors.Pink` | `'#c13383'` | `Colors.PinkShades.VeryBerry` |
| `Colors.Brown` | `'#c66e52'` | `Colors.BrownShades.Handmade` |
| `Colors.Grey` | `'#dddddd'` | `Colors.GreyShades.Steam` |
| `Colors.Black` | `'#000000'` | `Colors.BlackShades.BlackWash` |
| `Colors.White` | `'#eeeeee'` | `Colors.WhiteShades.DrWhite` |

```js
import { Colors } from 'jygame'

// Use a family primary
sprite.style.fill = Colors.Green

// Use a specific shade
sprite.style.fill = Colors.GreenShades.MagicalMalachite

// Browse other families
ctx.fillStyle = Colors.BlueShades.FrostedBlueberries
ctx.fillStyle = Colors.PinkShades.Bordeaux
```

## Usage

```js
import { Color, Colors } from 'jygame'

// Direct color lookup
const c = Color.CyberYellow  // '#ffd400'

// Organized by family
const primary = Colors.Blue
const shade = Colors.BlueShades.FrostedBlueberries

// With sprites
sprite.style.fill = Colors.GreenShades.MagicalMalachite
sprite.style.fill = Color.NeonRose
```
