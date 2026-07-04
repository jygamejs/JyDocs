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

## Palettes (curated combinations)

Handpicked color palettes, each containing colors that work well together. Imported from `Palettes`.

```js
import { Palettes } from 'jygame'

const palette = Palettes.WineSpice
// [
//   { name: 'WinePlum', hex: '#5B2333', family: 'violet' },
//   { name: 'WhiteSmoke', hex: '#F7F4F3', family: 'white' },
//   { name: 'StoneBrown', hex: '#564D4A', family: 'gray' },
//   { name: 'Cinnabar', hex: '#F24333', family: 'orange' },
//   { name: 'MahoganyRed', hex: '#BA1B1D', family: 'red' },
// ]
```

Each entry has a `name`, `hex` color code, and `family` for filtering. Available palettes:

| Palette | Colors |
|---------|--------|
| `Palettes.WineSpice` | 5 |
| `Palettes.DesertBloom` | 5 |
| `Palettes.ForestCookie` | 5 |
| `Palettes.HoneyFern` | 5 |
| `Palettes.MossyStone` | 5 |
| `Palettes.SpringGarden` | 5 |
| `Palettes.Terracotta` | 5 |
| `Palettes.JadeGarden` | 5 |
| `Palettes.DeepForest` | 6 |
| `Palettes.PinkCitron` | 2 |
| `Palettes.WarmClay` | 5 |
| `Palettes.DeepTeal` | 5 |
| `Palettes.AlaskanMist` | 5 |
| `Palettes.CrimsonWhite` | 2 |
| `Palettes.NavyCream` | 2 |
| `Palettes.GardenPair` | 2 |
| `Palettes.JadeYellow` | 2 |
| `Palettes.BloodMoon` | 5 |
| `Palettes.BlushButter` | 2 |
| `Palettes.WisteriaField` | 2 |
| `Palettes.ChimneySmoke` | 5 |
| `Palettes.TropicalPunch` | 6 |
| `Palettes.SageGarden` | 3 |
| `Palettes.SunsetSurf` | 2 |
| `Palettes.Peacock` | 2 |
| `Palettes.PeachMint` | 2 |
| `Palettes.SoftDune` | 2 |
| `Palettes.CoralCove` | 2 |
| `Palettes.LotusNight` | 2 |
| `Palettes.TwilightPurple` | 3 |
| `Palettes.AmethystSun` | 2 |
| `Palettes.MorningBerry` | 2 |
| `Palettes.Sunburst` | 2 |
| `Palettes.Mimosa` | 2 |
| `Palettes.AvocadoLemon` | 2 |
| `Palettes.SalmonRun` | 2 |
| `Palettes.MustardBay` | 2 |
| `Palettes.CoralSun` | 2 |
| `Palettes.VanillaPunch` | 2 |
| `Palettes.Cypress` | 2 |
| `Palettes.DeepCyan` | 3 |
| `Palettes.JadeJet` | 2 |
| `Palettes.RaspberryGold` | 2 |
| `Palettes.GrapeSky` | 2 |
| `Palettes.HoneyLeaf` | 2 |
| `Palettes.DenimApricot` | 2 |
| `Palettes.Mulberry` | 2 |
| `Palettes.StormVanilla` | 2 |
| `Palettes.OceanLime` | 2 |
| `Palettes.RaspberrySky` | 1 |
| `Palettes.VanillaMist` | 3 |
| `Palettes.MangoFire` | 5 |
| `Palettes.Chartreuse` | 4 |
| `Palettes.PantoneGreen` | 1 |
| `Palettes.RussianSage` | 5 |
| `Palettes.SummerSlice` | 2 |
| `Palettes.ForestEarth` | 5 |
| `Palettes.BerryWash` | 5 |
| `Palettes.MintMood` | 2 |
| `Palettes.RoyalCream` | 2 |
| `Palettes.AuraViolet` | 1 |
| `Palettes.SeaFlamingo` | 2 |
| `Palettes.CactusDesert` | 2 |
| `Palettes.DenimWash` | 2 |
| `Palettes.GoldenBlue` | 2 |
| `Palettes.GambogeNavy` | 2 |
| `Palettes.VanillaMoon` | 2 |
| `Palettes.CustardGreen` | 3 |
| `Palettes.SilkRose` | 2 |
| `Palettes.VioletTea` | 2 |
| `Palettes.BurgundyNight` | 2 |
| `Palettes.PurpleHaze` | 2 |
| `Palettes.AubergineSky` | 2 |
| `Palettes.GreenButter` | 2 |
| `Palettes.MidnightRose` | 2 |
| `Palettes.RubyFoam` | 2 |
| `Palettes.OatOrange` | 2 |
| `Palettes.MilkyMantis` | 2 |
| `Palettes.ForestCork` | 5 |
| `Palettes.BeigeCookie` | 3 |
| `Palettes.LavenderGraphite` | 2 |
| `Palettes.PertorlSand` | 2 |
| `Palettes.PeriwinkleHunt` | 2 |
| `Palettes.DragonSea` | 4 |
| `Palettes.SandSea` | 8 |
| `Palettes.MidnightHerb` | 5 |
| `Palettes.PeachBlues` | 4 |
| `Palettes.JellySide` | 4 |
| `Palettes.GreenRufous` | 3 |
| `Palettes.PearTomato` | 4 |
| `Palettes.PastequeMelon` | 4 |
| `Palettes.SaffronPeacock` | 3 |
| `Palettes.LavenderGold` | 5 |
| `Palettes.FloralPearl` | 5 |
| `Palettes.CosmicSangria` | 3 |
| `Palettes.TanMidnight` | 5 |
| `Palettes.IceCoral` | 3 |
| `Palettes.FogBerry` | 5 |
| `Palettes.DelftOlivine` | 5 |
| `Palettes.TropicalNero` | 5 |
| `Palettes.CaramelBaby` | 3 |
| `Palettes.ChocolateSakura` | 5 |

```js
// Pick a random color from a palette
const palette = Palettes.MangoFire
const randomColor = palette[Math.floor(Math.random() * palette.length)]

// Filter palette by family
const greens = Palettes.DeepForest.filter(c => c.family === 'green')

// Use in a sprite
sprite.style.fill = palette[0].hex
```
