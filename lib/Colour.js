// homebridge-lib/lib/Colour.js
//
// Library for Homebridge plugins.
// Copyright © 2016-2022 Erik Baauw. All rights reserved.

'use strict'

// Return point in color gamut closest to p.
function closestInGamut (p, gamut) {
  // Return cross product of two points.
  function crossProduct (p1, p2) {
    return p1.x * p2.y - p1.y * p2.x
  }

  // Return distance between two points.
  function distance (p1, p2) {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Return point on line a,b closest to p.
  function closest (a, b, p) {
    const ap = { x: p.x - a.x, y: p.y - a.y }
    const ab = { x: b.x - a.x, y: b.y - a.y }
    let t = (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y)
    t = t < 0.0 ? 0.0 : t > 1.0 ? 1.0 : t
    return { x: a.x + t * ab.x, y: a.y + t * ab.y }
  }

  const r = { x: gamut.r[0], y: gamut.r[1] }
  const g = { x: gamut.g[0], y: gamut.g[1] }
  const b = { x: gamut.b[0], y: gamut.b[1] }
  const v1 = { x: g.x - r.x, y: g.y - r.y }
  const v2 = { x: b.x - r.x, y: b.y - r.y }
  const v = crossProduct(v1, v2)
  const q = { x: p.x - r.x, y: p.y - r.y }
  const s = crossProduct(q, v2) / v
  const t = crossProduct(v1, q) / v
  if (s >= 0.0 && t >= 0.0 && s + t <= 1.0) {
    return p
  }
  const pRG = closest(r, g, p)
  const pGB = closest(g, b, p)
  const pBR = closest(b, r, p)
  const dRG = distance(p, pRG)
  const dGB = distance(p, pGB)
  const dBR = distance(p, pBR)
  let min = dRG
  p = pRG
  if (dGB < min) {
    min = dGB
    p = pGB
  }
  if (dBR < min) {
    p = pBR
  }
  return p
}

/** Colour conversions.
  * @class
  * @hideconstructor
  */
class Colour {
  /** [sRGB](https://en.wikipedia.org/wiki/SRGB) colour in
    * [HSV](https://en.wikipedia.org/wiki/HSL_and_HSV).
    * @typedef
    * @property {integer} h - Hue, between 0˚ and 360˚.
    * @property {integer} s - Saturation, between 0% and 100%.
    * @property {integer} v - Value, between 0% and 100%.
    */
  static get HSV () {}

  /** [sRGB](https://en.wikipedia.org/wiki/SRGB) colour in
    * [RGB color model](https://en.wikipedia.org/wiki/RGB_color_model).
    * @typedef
    * @property {number} r - Red, between 0.0 and 1.0.
    * @property {number} g - Green, between 0.0 and 1.0.
    * @property {number} b - Blue, between 0.0 and 1.0.
    */
  static get RGB () {}

  /** Convert {@link Colour.HSV HSV} to {@link Colour.RGB RGB}.
    *
    * See [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV).
    * @param {integer} h - Hue, between 0˚ and 360˚.
    * @param {integer} s - Saturation, between 0% and 100%.
    * @param {integer} [v=100] - Value, between 0% and 100%.
    * @return {RGB} rgb - The corresponding {@link Colour.RGB RGB} value.
    */
  static hsvToRgb (h, s, v = 100) {
    h /= 60.0
    s /= 100.0
    v /= 100.0
    const C = v * s
    const m = v - C
    let x = (h % 2) - 1.0
    if (x < 0) {
      x = -x
    }
    x = C * (1.0 - x)
    let r, g, b
    switch (Math.floor(h) % 6) {
      case 0: r = C + m; g = x + m; b = m; break
      case 1: r = x + m; g = C + m; b = m; break
      case 2: r = m; g = C + m; b = x + m; break
      case 3: r = m; g = x + m; b = C + m; break
      case 4: r = x + m; g = m; b = C + m; break
      case 5: r = C + m; g = m; b = x + m; break
    }
    return { r, g, b }
  }

  /** Convert {@link Colour.RGB RGB} to {@link Colour.HSV HSV}.
    *
    * See [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV).
    * @param {number} r - Red, between 0.0 and 1.0.
    * @param {number} g - Green, between 0.0 and 1.0.
    * @param {number} b - Blue, between 0.0 and 1.0.
    * @return {HSV} hsv - The corresponding {@link Colour.HSV HSV} value.
    */
  static rgbToHsv (r, g, b) {
    const M = Math.max(r, g, b)
    const m = Math.min(r, g, b)
    const C = M - m
    const S = (M === 0.0) ? 0.0 : C / M
    let H
    switch (M) {
      case m:
        H = 0.0
        break
      case r:
        H = (g - b) / C
        if (H < 0) {
          H += 6.0
        }
        break
      case g:
        H = (b - r) / C
        H += 2.0
        break
      case b:
        H = (r - g) / C
        H += 4.0
        break
    }
    return {
      h: Math.round(H * 60.0),
      s: Math.round(S * 100.0),
      v: Math.round(M * 100.0)
    }
  }

  /** Colour [gamut](https://en.wikipedia.org/wiki/Gamut).
    * @typedef
    * @property {number[]} r - `xy` coordinates for red,
    * x, y between 0.0000 and 1.0000.
    * @property {number[]} g - `xy` coordinates for green,
    * x, y between 0.0000 and 1.0000..
    * @property {number[]} b - `xy` coordinates for blue,
    * x, y between 0.0000 and 1.0000.
    */
  static get Gamut () {}

  /** Default gamut.
    * @type {Gamut}
    * @readonly
    */
  static get defaultGamut () {
    // Safe default gamut taking into account:
    // - The maximum value for CurrentX and  CurrentY, 65279 (0xfeff),
    //   as defined by the ZCL spec;
    // - A potential division by zero error for CurrentY, when translating the
    //   xy values back to hue/sat.
    return {
      r: [0.9961, 0.0001],
      g: [0, 0.9961],
      b: [0, 0.0001]
    }
  }

  /** Transform [sRGB](https://en.wikipedia.org/wiki/SRGB)
    * {@link Colour.HSV HSV} to
    * [CIE 1931](https://en.wikipedia.org/wiki/CIE_1931_color_space) `xy`.
    *
    * See [Hue developer portal](https://developers.meethue.com/develop/application-design-guidance/color-conversion-formulas-rgb-to-xy-and-back/).
    * @param {integer} h - Hue, between 0˚ and 360˚.
    * @param {integer} s - Saturation, between 0% and 100%.
    * @param {Gamut} [gamut=defaultGamut] - The gamut supported by the light.
    * @return {number[]} xy - The closest matching CIE 1931 colour,
    * x, y between 0.0000 and 1.0000.
    */
  static hsvToXy (h, s, gamut = Colour.defaultGamut) {
    // Gamma correction (inverse sRGB Companding).
    function invCompand (v) {
      return v > 0.04045 ? Math.pow((v + 0.055) / (1.0 + 0.055), 2.4) : v / 12.92
    }

    let { r, g, b } = Colour.hsvToRgb(h, s)

    // RGB to XYZ to xyY
    r = invCompand(r)
    g = invCompand(g)
    b = invCompand(b)
    const X = r * 0.664511 + g * 0.154324 + b * 0.162028
    const Y = r * 0.283881 + g * 0.668433 + b * 0.047685
    const Z = r * 0.000088 + g * 0.072310 + b * 0.986039
    const sum = X + Y + Z
    const p = sum === 0.0 ? { x: 0.0, y: 0.0 } : { x: X / sum, y: Y / sum }
    const q = closestInGamut(p, gamut)
    return [Math.round(q.x * 10000) / 10000, Math.round(q.y * 10000) / 10000]
  }

  /** Transform [CIE 1931](https://en.wikipedia.org/wiki/CIE_1931_color_space)
    * `xy` to [sRGB](https://en.wikipedia.org/wiki/SRGB)
    * {@link Colour.HSV HSV}.
    *
    * See [Hue developer portal](https://developers.meethue.com/develop/application-design-guidance/color-conversion-formulas-rgb-to-xy-and-back/).
    * @param {number[]} xy - The CIE 1931 xy colour,
    * x, y between 0.0000 and 1.0000.
    * @param {Gamut} [gamut=defaultGamut] - The gamut supported by the light.
    * @return {HSV} hsv - The closest matching sRGB colour.
    */
  static xyToHsv (xy, gamut = Colour.defaultGamut) {
    // Inverse Gamma correction (sRGB Companding).
    function compand (v) {
      return v <= 0.0031308
        ? 12.92 * v
        : (1.0 + 0.055) * Math.pow(v, (1.0 / 2.4)) - 0.055
    }

    // Correction for negative values is missing from Philips' documentation.
    function correctNegative () {
      const m = Math.min(r, g, b)
      if (m < 0.0) {
        r -= m
        g -= m
        b -= m
      }
    }

    function rescale () {
      const M = Math.max(r, g, b)
      if (M > 1.0) {
        r /= M
        g /= M
        b /= M
      }
    }

    // xyY to XYZ to RGB
    const p = closestInGamut({ x: xy[0], y: xy[1] }, gamut)
    const x = p.x
    const y = p.y === 0.0 ? 0.000001 : p.y
    const z = 1.0 - x - y
    const Y = 1.0
    const X = (Y / y) * x
    const Z = (Y / y) * z
    let r = X * 1.656492 + Y * -0.354851 + Z * -0.255038
    let g = X * -0.707196 + Y * 1.655397 + Z * 0.036152
    let b = X * 0.051713 + Y * -0.121364 + Z * 1.011530
    correctNegative()
    rescale()
    r = compand(r)
    g = compand(g)
    b = compand(b)
    rescale()
    return Colour.rgbToHsv(r, g, b)
  }

  /** Transform
    * [colour temperature](https://en.wikipedia.org/wiki/Color_temperature) to
    * [CIE 1931](https://en.wikipedia.org/wiki/CIE_1931_color_space) `xy`.
    *
    * Source: [deCONZ REST API plugin](https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/colorspace.cpp).
    * The results don't match exactly the `xy` values as returned by a Hue
    * LCT015 light, but seem to be close enough.
    * @param {integer} ct - The colour temperature
    * in [mired](https://en.wikipedia.org/wiki/Mired).
    * @return {number[]} xy - The closest matching CIE 1931 colour,
    * x, y between 0.0000 and 1.0000.
    */
  static ctToXy (ct) {
    const kelvin = 1000000 / ct
    let x, y

    if (kelvin < 4000) {
      x = 11790 +
          57520658 / kelvin +
          -15358885888 / kelvin / kelvin +
          -17440695910400 / kelvin / kelvin / kelvin
    } else {
      x = 15754 +
          14590587 / kelvin +
          138086835814 / kelvin / kelvin +
          -198301902438400 / kelvin / kelvin / kelvin
    }
    if (kelvin < 2222) {
      y = -3312 +
          35808 * x / 0x10000 +
          -22087 * x * x / 0x100000000 +
          -18126 * x * x * x / 0x1000000000000
    } else if (kelvin < 4000) {
      y = -2744 +
          34265 * x / 0x10000 +
          -22514 * x * x / 0x100000000 +
          -15645 * x * x * x / 0x1000000000000
    } else {
      y = -6062 +
          61458 * x / 0x10000 +
          -96229 * x * x / 0x100000000 +
          50491 * x * x * x / 0x1000000000000
    }
    y *= 4
    x /= 0xFFFF
    y /= 0xFFFF

    return [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]
  }
}

module.exports = Colour
