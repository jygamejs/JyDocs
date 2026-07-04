# Audio Effects

Audio effects process audio signals in real time. Built-in effects use the Web Audio API and require a `WebAudioBackend`. Effects are added to `EffectChain` instances on the manager, groups, or individual sounds.

## AudioEffect

Abstract base class for all audio effects.

### Methods

| Method | Description |
|--------|-------------|
| `connect(inputNode, context)` | Connect to an AudioNode, return the output node |
| `disconnect()` | Disconnect and release the internal node |
| `update(params)` | Update multiple parameters at once: `effect.update({ frequency: 2000, Q: 2 })` |

---

## EffectChain

An ordered collection of effects. Applied to the master output, a group, or a sound.

### Constructor

```js
const chain = new EffectChain()
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `length` | `number` | Number of effects in the chain |

### Methods

| Method | Description |
|--------|-------------|
| `add(effect)` | Append an effect, triggers `onChange` |
| `remove(effect)` | Remove and disconnect an effect |
| `clear()` | Remove and disconnect all effects |
| `forEach(fn)` | Iterate effects |

### Callbacks

| Setter | Description |
|--------|-------------|
| `onChange` | Called when the chain is modified (used internally by AudioManager) |

### Connecting Chain

Two standalone utility functions for manual chain management:

#### `connectEffectChain(effects, inputNode, context)`

Connects an array of effects in series, returning the last output node.

#### `disconnectEffectChain(effects)`

Disconnects all effects in an array.

```js
import { EffectChain, connectEffectChain, disconnectEffectChain } from 'jygame'
```

---

## LowPassEffect

A low-pass biquad filter. Attenuates frequencies above the cutoff.

### Constructor

```js
new LowPassEffect({ frequency, Q })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frequency` | `number` | `2000` | Cutoff frequency in Hz |
| `Q` | `number` | `1` | Quality factor (resonance) |

---

## HighPassEffect

A high-pass biquad filter. Attenuates frequencies below the cutoff.

### Constructor

```js
new HighPassEffect({ frequency, Q })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frequency` | `number` | `500` | Cutoff frequency in Hz |
| `Q` | `number` | `1` | Quality factor |

---

## BandPassEffect

A band-pass biquad filter. Attenuates frequencies outside a band.

### Constructor

```js
new BandPassEffect({ frequency, Q })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frequency` | `number` | `1000` | Center frequency in Hz |
| `Q` | `number` | `1` | Quality factor (bandwidth) |

---

## DelayEffect

Creates an echo / delay effect with feedback.

### Constructor

```js
new DelayEffect({ time, feedback, wet })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `time` | `number` | `0.3` | Delay time in seconds (max 5s) |
| `feedback` | `number` | `0.3` | Feedback amount 0–1 |
| `wet` | `number` | `0.5` | Wet/dry mix 0–1 |

---

## CompressorEffect

A dynamics compressor. Reduces the volume of loud sounds and boosts quiet ones.

### Constructor

```js
new CompressorEffect({ threshold, ratio, attack, release, knee })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `-24` | Threshold in dB |
| `ratio` | `number` | `12` | Compression ratio |
| `attack` | `number` | `0.003` | Attack time in seconds |
| `release` | `number` | `0.25` | Release time in seconds |
| `knee` | `number` | `30` | Knee width in dB |

---

## DistortionEffect

A wave-shaping distortion effect.

### Constructor

```js
new DistortionEffect({ amount })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `amount` | `number` | `0.5` | Distortion amount 0–1 |

Generates a wave-shaping curve using the formula `((3 + k) * x) / (PI + k * |x|)` where `k = amount * 100`.

---

## ReverbEffect

A convolution reverb with procedurally generated impulse response.

### Constructor

```js
new ReverbEffect(impulseResponse)
new ReverbEffect({ decay, reverse })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `impulseResponse` | `AudioBuffer` | `null` | Custom impulse response buffer |
| `decay` | `number` | `2` | Reverb decay time in seconds |
| `reverse` | `boolean` | `false` | Reverse the impulse response |

If passed an `AudioBuffer`, uses it directly as the impulse response. Otherwise generates a random noise impulse response with exponential decay.

## Usage

```js
import { AudioManager, WebAudioBackend, LowPassEffect, ReverbEffect, DelayEffect, EffectChain } from 'jygame'

const audio = new AudioManager({ backend: new WebAudioBackend() })

// Master effects
audio.master.effects.add(new LowPassEffect({ frequency: 5000 }))

// Group effects
audio.group('sfx').effects.add(new ReverbEffect({ decay: 1.5 }))

// Per-sound effects
const chain = new EffectChain()
chain.add(new DelayEffect({ time: 0.5, feedback: 0.4, wet: 0.3 }))
chain.add(new LowPassEffect({ frequency: 3000 }))

// Live effect updates (not supported by ReverbEffect — recreate instead)
const filter = new LowPassEffect({ frequency: 5000 })
filter.update({ frequency: 2000, Q: 2 })
```
