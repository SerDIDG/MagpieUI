/*! ************ MagpieUI v3.22.17 (2016-11-08 17:59) ************ */
// TinyColor v1.3.0
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function() {

var trimLeft = /^\s+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    math = Math,
    mathRound = math.round,
    mathMin = math.min,
    mathMax = math.max,
    mathRandom = math.random;

function tinycolor (color, opts) {

    color = (color) ? color : '';
    opts = opts || { };

    // If input is already a tinycolor, return itself
    if (color instanceof tinycolor) {
       return color;
    }
    // If we are called as a function, call using new instead
    if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
    }

    var rgb = inputToRGB(color);
    this._originalInput = color,
    this._r = rgb.r,
    this._g = rgb.g,
    this._b = rgb.b,
    this._a = rgb.a,
    this._roundA = mathRound(100*this._a) / 100,
    this._format = opts.format || rgb.format;
    this._gradientType = opts.gradientType;

    // Don't let the range of [0,255] come back in [0,1].
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1
    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    if (this._r < 1) { this._r = mathRound(this._r); }
    if (this._g < 1) { this._g = mathRound(this._g); }
    if (this._b < 1) { this._b = mathRound(this._b); }

    this._ok = rgb.ok;
    this._tc_id = tinyCounter++;
}

tinycolor.prototype = {
    isDark: function() {
        return this.getBrightness() < 128;
    },
    isLight: function() {
        return !this.isDark();
    },
    isValid: function() {
        return this._ok;
    },
    getOriginalInput: function() {
      return this._originalInput;
    },
    getFormat: function() {
        return this._format;
    },
    getAlpha: function() {
        return this._a;
    },
    getBrightness: function() {
        //http://www.w3.org/TR/AERT#color-contrast
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    },
    getLuminance: function() {
        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        var rgb = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G, B;
        RsRGB = rgb.r/255;
        GsRGB = rgb.g/255;
        BsRGB = rgb.b/255;

        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    },
    setAlpha: function(value) {
        this._a = boundAlpha(value);
        this._roundA = mathRound(100*this._a) / 100;
        return this;
    },
    toHsv: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    },
    toHsvString: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
        return (this._a == 1) ?
          "hsv("  + h + ", " + s + "%, " + v + "%)" :
          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    },
    toHsl: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    },
    toHslString: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
        return (this._a == 1) ?
          "hsl("  + h + ", " + s + "%, " + l + "%)" :
          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    },
    toHex: function(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
    },
    toHexString: function(allow3Char) {
        return '#' + this.toHex(allow3Char);
    },
    toHex8: function() {
        return rgbaToHex(this._r, this._g, this._b, this._a);
    },
    toHex8String: function() {
        return '#' + this.toHex8();
    },
    toRgb: function() {
        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    },
    toRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    },
    toPercentageRgb: function() {
        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    },
    toPercentageRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    },
    toName: function() {
        if (this._a === 0) {
            return "transparent";
        }

        if (this._a < 1) {
            return false;
        }

        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    },
    toFilter: function(secondColor) {
        var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";

        if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = s.toHex8String();
        }

        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    },
    toString: function(format) {
        var formatSet = !!format;
        format = format || this._format;

        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === "name" && this._a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === "rgb") {
            formattedString = this.toRgbString();
        }
        if (format === "prgb") {
            formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
        }
        if (format === "hex3") {
            formattedString = this.toHexString(true);
        }
        if (format === "hex8") {
            formattedString = this.toHex8String();
        }
        if (format === "name") {
            formattedString = this.toName();
        }
        if (format === "hsl") {
            formattedString = this.toHslString();
        }
        if (format === "hsv") {
            formattedString = this.toHsvString();
        }

        return formattedString || this.toHexString();
    },
    clone: function() {
        return tinycolor(this.toString());
    },

    _applyModification: function(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
    },
    lighten: function() {
        return this._applyModification(lighten, arguments);
    },
    brighten: function() {
        return this._applyModification(brighten, arguments);
    },
    darken: function() {
        return this._applyModification(darken, arguments);
    },
    desaturate: function() {
        return this._applyModification(desaturate, arguments);
    },
    saturate: function() {
        return this._applyModification(saturate, arguments);
    },
    greyscale: function() {
        return this._applyModification(greyscale, arguments);
    },
    spin: function() {
        return this._applyModification(spin, arguments);
    },

    _applyCombination: function(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
    },
    analogous: function() {
        return this._applyCombination(analogous, arguments);
    },
    complement: function() {
        return this._applyCombination(complement, arguments);
    },
    monochromatic: function() {
        return this._applyCombination(monochromatic, arguments);
    },
    splitcomplement: function() {
        return this._applyCombination(splitcomplement, arguments);
    },
    triad: function() {
        return this._applyCombination(triad, arguments);
    },
    tetrad: function() {
        return this._applyCombination(tetrad, arguments);
    }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function(color, opts) {
    if (typeof color == "object") {
        var newColor = {};
        for (var i in color) {
            if (color.hasOwnProperty(i)) {
                if (i === "a") {
                    newColor[i] = color[i];
                }
                else {
                    newColor[i] = convertToPercentage(color[i]);
                }
            }
        }
        color = newColor;
    }

    return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {

    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var ok = false;
    var format = false;

    if (typeof color == "string") {
        color = stringInputToObject(color);
    }

    if (typeof color == "object") {
        if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
            color.s = convertToPercentage(color.s);
            color.v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, color.s, color.v);
            ok = true;
            format = "hsv";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
            color.s = convertToPercentage(color.s);
            color.l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, color.s, color.l);
            ok = true;
            format = "hsl";
        }

        if (color.hasOwnProperty("a")) {
            a = color.a;
        }
    }

    a = boundAlpha(a);

    return {
        ok: ok,
        format: color.format || format,
        r: mathMin(255, mathMax(rgb.r, 0)),
        g: mathMin(255, mathMax(rgb.g, 0)),
        b: mathMin(255, mathMax(rgb.b, 0)),
        a: a
    };
}


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b){
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
    };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;

    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
 function hsvToRgb(h, s, v) {

    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);

    var i = math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    // Return a 3 character hex if possible
    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }

    return hex.join("");
}

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b and a are contained in the set [0, 255]
// Returns an 8 character hex
function rgbaToHex(r, g, b, a) {

    var hex = [
        pad2(convertDecimalToHex(a)),
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    return hex.join("");
}

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) { return false; }
    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};

tinycolor.random = function() {
    return tinycolor.fromRatio({
        r: mathRandom(),
        g: mathRandom(),
        b: mathRandom()
    });
};


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function desaturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s -= amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function saturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s += amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function greyscale(color) {
    return tinycolor(color).desaturate(100);
}

function lighten (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l += amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

function brighten(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var rgb = tinycolor(color).toRgb();
    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    return tinycolor(rgb);
}

function darken (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l -= amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function spin(color, amount) {
    var hsl = tinycolor(color).toHsl();
    var hue = (mathRound(hsl.h) + amount) % 360;
    hsl.h = hue < 0 ? 360 + hue : hue;
    return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function complement(color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + 180) % 360;
    return tinycolor(hsl);
}

function triad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
}

function tetrad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
}

function splitcomplement(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
}

function analogous(color, results, slices) {
    results = results || 6;
    slices = slices || 30;

    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices;
    var ret = [tinycolor(color)];

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
}

function monochromatic(color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
    var modification = 1 / results;

    while (results--) {
        ret.push(tinycolor({ h: h, s: s, v: v}));
        v = (v + modification) % 1;
    }

    return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function(color1, color2, amount) {
    amount = (amount === 0) ? 0 : (amount || 50);

    var rgb1 = tinycolor(color1).toRgb();
    var rgb2 = tinycolor(color2).toRgb();

    var p = amount / 100;
    var w = p * 2 - 1;
    var a = rgb2.a - rgb1.a;

    var w1;

    if (w * a == -1) {
        w1 = w;
    } else {
        w1 = (w + a) / (1 + w * a);
    }

    w1 = (w1 + 1) / 2;

    var w2 = 1 - w1;

    var rgba = {
        r: rgb2.r * w1 + rgb1.r * w2,
        g: rgb2.g * w1 + rgb1.g * w2,
        b: rgb2.b * w1 + rgb1.b * w2,
        a: rgb2.a * p  + rgb1.a * (1 - p)
    };

    return tinycolor(rgba);
};


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
tinycolor.readability = function(color1, color2) {
    var c1 = tinycolor(color1);
    var c2 = tinycolor(color2);
    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
};

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
tinycolor.isReadable = function(color1, color2, wcag2) {
    var readability = tinycolor.readability(color1, color2);
    var wcag2Parms, out;

    out = false;

    wcag2Parms = validateWCAG2Parms(wcag2);
    switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
            out = readability >= 4.5;
            break;
        case "AAlarge":
            out = readability >= 3;
            break;
        case "AAAsmall":
            out = readability >= 7;
            break;
    }
    return out;

};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
tinycolor.mostReadable = function(baseColor, colorList, args) {
    var bestColor = null;
    var bestScore = 0;
    var readability;
    var includeFallbackColors, level, size ;
    args = args || {};
    includeFallbackColors = args.includeFallbackColors ;
    level = args.level;
    size = args.size;

    for (var i= 0; i < colorList.length ; i++) {
        readability = tinycolor.readability(baseColor, colorList[i]);
        if (readability > bestScore) {
            bestScore = readability;
            bestColor = tinycolor(colorList[i]);
        }
    }

    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
        return bestColor;
    }
    else {
        args.includeFallbackColors=false;
        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
    }
};


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    rebeccapurple: "663399",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
    var flipped = { };
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            flipped[o[i]] = i;
        }
    }
    return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
    a = parseFloat(a);

    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }

    return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));

    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    // Handle floating point rounding errors
    if ((math.abs(n - max) < 0.000001)) {
        return 1;
    }

    // Convert into [0, 1] range if it isn't already
    return (n % max) / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
    return mathMin(1, mathMax(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
    return c.length == 1 ? '0' + c : '' + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
    if (n <= 1) {
        n = (n * 100) + "%";
    }

    return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
    return (parseIntFromHex(h) / 255);
}

var matchers = (function() {

    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";

    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    return {
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
})();

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color == 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }

    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hsva.exec(color))) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    if ((match = matchers.hex8.exec(color))) {
        return {
            a: convertHexToDecimal(match[1]),
            r: parseIntFromHex(match[2]),
            g: parseIntFromHex(match[3]),
            b: parseIntFromHex(match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? "name" : "hex"
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            format: named ? "name" : "hex"
        };
    }

    return false;
}

function validateWCAG2Parms(parms) {
    // return valid WCAG2 parms for isReadable.
    // If input parms are invalid, return {"level":"AA", "size":"small"}
    var level, size;
    parms = parms || {"level":"AA", "size":"small"};
    level = (parms.level || "AA").toUpperCase();
    size = (parms.size || "small").toLowerCase();
    if (level !== "AA" && level !== "AAA") {
        level = "AA";
    }
    if (size !== "small" && size !== "large") {
        size = "small";
    }
    return {"level":level, "size":size};
}

// Node: Export function
if (typeof module !== "undefined" && module.exports) {
    module.exports = tinycolor;
}
// AMD/requirejs: Define the module
else if (typeof define === 'function' && define.amd) {
    define(function () {return tinycolor;});
}
// Browser: Expose to window
else {
    window.tinycolor = tinycolor;
}

})();

/*

 Running the following code before any other code will create if it's not natively available.
 https://developer.mozilla.org/

*/

window.URL = window.URL || window.webkitURL;

if(!Array.prototype.forEach){
    Array.prototype.forEach = function(fn, scope){
        for(var i = 0, len = this.length; i < len; ++i){
            fn.call(scope || this, this[i], i, this);
        }
    }
}

if(!Array.prototype.filter){
    Array.prototype.filter = function(fun /*, thisp */){
        "use strict";

        if(this == null){
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if(typeof fun != "function"){
            throw new TypeError();
        }
        var res = [];
        var thisp = arguments[1];
        for(var i = 0; i < len; i++){
            if(i in t){
                var val = t[i]; // in case fun mutates this
                if(fun.call(thisp, val, i, t)){
                    res.push(val);
                }
            }
        }
        return res;
    };
}


if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }
        return A;
    };
}

if(!Array.prototype.indexOf){
    Array.prototype.indexOf = function(searchElement /*, fromIndex */){
        "use strict";
        if(this == null){
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if(len === 0){
            return -1;
        }
        var n = 0;
        if(arguments.length > 1){
            n = Number(arguments[1]);
            if(n != n){
                n = 0;
            }else if(n != 0 && n != Infinity && n != -Infinity){
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if(n >= len){
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for(; k < len; k++){
            if(k in t && t[k] === searchElement){
                return k;
            }
        }
        return -1;
    };
}

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

if ( 'function' !== typeof Array.prototype.reduce ) {
    Array.prototype.reduce = function( callback /*, initialValue*/ ) {
        'use strict';
        if ( null === this || 'undefined' === typeof this ) {
            throw new TypeError('Array.prototype.reduce called on null or undefined' );
        }
        if ( 'function' !== typeof callback ) {
            throw new TypeError( callback + ' is not a function' );
        }
        var t = Object( this ), len = t.length >>> 0, k = 0, value;
        if ( arguments.length >= 2 ) {
            value = arguments[1];
        } else {
            while ( k < len && ! k in t ) k++;
            if ( k >= len )
                throw new TypeError('Reduce of empty array with no initial value');
            value = t[ k++ ];
        }
        for ( ; k < len ; k++ ) {
            if ( k in t ) {
                value = callback( value, t[k], k, t );
            }
        }
        return value;
    };
}

if ( 'function' !== typeof Array.prototype.reduceRight ) {
    Array.prototype.reduceRight = function( callback /*, initialValue*/ ) {
        'use strict';
        if ( null === this || 'undefined' === typeof this ) {
            throw new TypeError(
                'Array.prototype.reduce called on null or undefined' );
        }
        if ( 'function' !== typeof callback ) {
            throw new TypeError( callback + ' is not a function' );
        }
        var t = Object( this ), len = t.length >>> 0, k = len - 1, value;
        if ( arguments.length >= 2 ) {
            value = arguments[1];
        } else {
            while ( k >= 0 && ! k in t ) k--;
            if ( k < 0 )
                throw new TypeError('Reduce of empty array with no initial value');
            value = t[ k-- ];
        }
        for ( ; k >= 0 ; k-- ) {
            if ( k in t ) {
                value = callback( value, t[k], k, t );
            }
        }
        return value;
    };
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}

if(!String.prototype.trim) {
    String.prototype.trim = function(){
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

if(!Date.now){
    Date.now = function now(){
        return new Date().getTime();
    };
}

(function(){
    if('undefined' == typeof JSON){
        window.JSON = {};
    }
    if(!JSON.parse || !JSON.stringify){
        JSON.parse = function(str){
            return eval('(' + str + ')');
        };
        JSON.stringify = function(){
            throw new Error('JSON.stringify is not supported by this browser.');
        };
    }
})();

// /* ************************************************ */
// /* ******* MAGPIE UI: COMMON ******* */
// /* ************************************************ */

/* ******* INFO ******* */

/* *******

    Objects and Arrays:             56
    Events:                         339
    Nodes:                          703
    Forms:                          1006
    Strings:                        1282
    Date and Time:                  1379
    Styles:                         1506
    Animation:                      2168
    Cookie and Local Storage:       2372
    Ajax:                           2439
    Hash (?):                       2717
    Graphics:                       2737
    Class Fabric                    2747

    -------

    Custom Events:
        scrollSizeChange
        pageSizeChange

 ******* */

var cm = {
        '_version' : '3.22.17',
        '_loadTime' : Date.now(),
        '_debug' : true,
        '_debugAlert' : false,
        '_deviceType' : 'desktop',
        '_deviceOrientation' : 'landscape',
        '_baseUrl': [window.location.protocol, window.location.hostname].join('//'),
        '_assetsUrl' : null,
        '_scrollSize' : 0,
        '_pageSize' : {},
        '_clientPosition' : {'left' : 0, 'top' : 0},
        '_config' : {
            'animDuration' : 250,
            'animDurationShort' : 150,
            'animDurationLong' : 500,
            'loadDelay' : 350,
            'hideDelay' : 250,
            'hideDelayShort' : 150,
            'hideDelayLong' : 500,
            'requestDelay' : 300,
            'adaptiveFrom' : 768,
            'screenTablet' : 1024,
            'screenTabletPortrait' : 768,
            'screenMobile' : 640,
            'screenMobilePortrait' : 480,
            'dateFormat' : '%Y-%m-%d',
            'dateTimeFormat' : '%Y-%m-%d %H:%i:%s',
            'timeFormat' : '%H:%i:%s',
            'displayDateFormat' : '%F %j, %Y',
            'displayDateTimeFormat' : '%F %j, %Y, %H:%i',
            'tooltipTop' : 'targetHeight + 4'
        }
    },
    Mod = {},
    Part = {},
    Com = {
        'Elements' : {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window.localStorage !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;

/* ******* OBJECTS AND ARRAYS ******* */

cm.top = (function(){
    try {
        return window.top.cm;
    }catch(e){
        return window.cm;
    }
})();

cm.isType = function(o, types){
    if(cm.isString(types)){
        return Object.prototype.toString.call(o) === '[object ' + types +']';
    }
    if(cm.isRegExp(types)){
        return types.test(Object.prototype.toString.call(o));
    }
    if(cm.isObject(types)){
        var match = false;
        cm.forEach(types, function(type){
            if(!match){
                match = Object.prototype.toString.call(o) === '[object ' + type +']';
            }
        });
        return match;
    }
    return false;
};

cm.isBoolean = function(o){
    return Object.prototype.toString.call(o) === '[object Boolean]';
};

cm.isString = function(o){
    return Object.prototype.toString.call(o) === '[object String]';
};

cm.isNumber = function(o){
    return Object.prototype.toString.call(o) === '[object Number]';
};

cm.isArray = Array.isArray || function(o){
    return Object.prototype.toString.call(o) === '[object Array]';
};

cm.isObject = function(o){
    return Object.prototype.toString.call(o) === '[object Object]';
};

cm.isArguments = function(o){
    return Object.prototype.toString.call(o) === '[object Arguments]';
};

cm.isFunction = function(o){
    return Object.prototype.toString.call(o) === '[object Function]';
};

cm.isRegExp = function(o){
    return Object.prototype.toString.call(o) === '[object RegExp]';
};

cm.isDate = function(o){
    return Object.prototype.toString.call(o) === '[object Date]';
};

cm.isFile = function(o){
    return Object.prototype.toString.call(o) === '[object File]';
};

cm.isWindow = function(o){
    return Object.prototype.toString.call(o) === '[object Window]' || Object.prototype.toString.call(o) === '[object global]';
};

cm.isNode = function(node){
    try{
        return !!(node && node.nodeType);
    }catch(e){}
    return false;
};

cm.isTextNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType == 3);
    }catch(e){}
    return false;
};

cm.isElementNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType == 1);
    }catch(e){}
    return false;
};

cm.isPlainObject = function(obj) {
    if (typeof obj == 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf == 'function') {
            var proto = Object.getPrototypeOf(obj);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(obj) == '[object Object]';
    }
    return false;
};

cm.forEach = function(o, callback){
    if(!o || !(callback && typeof callback == 'function')){
        return o;
    }
    var i, l;
    // Objects
    if(cm.isObject(o)){
        for(var key in o){
            if(o.hasOwnProperty(key)){
                callback(o[key], key, o);
            }
        }
        return o;
    }
    // Arrays
    if(cm.isArray(o)){
        o.forEach(callback);
        return o;
    }
    // Numbers
    if(cm.isNumber(o)){
        for(i = 0; i < o; i++){
            callback(i);
        }
        return o;
    }
    // Default
    try{
        Array.prototype.forEach.call(o, callback);
    }catch(e){
        try{
            for(i = 0, l = o.length; i < l; i++){
                callback(o[i], i, o);
            }
        }catch(e){}
    }
    return o;
};

cm.forEachReverse = function(o, callback){
    if(!o){
        return null;
    }
    if(!callback){
        return o;
    }
    o.reverse();
    cm.forEach(o, callback);
    o.reverse();
    return o;
};

cm.merge = function(o1, o2){
    var o;
    if(!o2){
        if(cm.isArray(o1)){
            o2 = [];
        }else{
            o2 = {};
        }
    }
    if(!o1){
        if(cm.isArray(o2)){
            o1 = [];
        }else{
            o1 = {};
        }
    }
    if(cm.isObject(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item, key){
            try{
                if(item === undefined){
                    o[key] = item;
                }else if(item._isComponent){
                    o[key] = item;
                }else if(cm.isObject(item)){
                    if(cm.isObject(o[key])){
                        o[key] = cm.merge(o[key], item);
                    }else{
                        o[key] = cm.clone(item);
                    }
                }else if(cm.isArray(item)){
                    o[key] = cm.clone(item);
                }else{
                    o[key] = item;
                }
            }catch(e){
                o[key] = item;
            }
        });
    }else if(cm.isArray(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item){
            if(!cm.inArray(o, item)){
                o.push(item);
            }
        });
    }
    return o;
};

cm.extend = function(o1, o2){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    if(cm.isArray(o1)){
        o = o1.concat(o2);
        return o;
    }
    if(cm.isObject(o1)){
        o = {};
        cm.forEach(o1, function(item, key){
            o[key] = item;
        });
        cm.forEach(o2, function(item, key){
            o[key] = item;
        });
        return o;
    }
    return null;
};

cm.clone = function(o, cloneNode){
    var newO;
    if(!o){
        return o;
    }
    // Arrays
    if(cm.isType(o, /Array|Arguments|StyleSheetList|CSSRuleList|HTMLCollection|NodeList|DOMTokenList|FileList/)){
        newO = [];
        cm.forEach(o, function(item){
            newO.push(cm.clone(item, cloneNode));
        });
        return newO;
    }
    // Objects
    if(cm.isObject(o) && !o._isComponent){
        newO = {};
        cm.forEach(o, function(item, key){
            newO[key] = cm.clone(item, cloneNode);
        });
        return newO;
    }
    // Dates
    if(cm.isDate(o)){
        newO = new Date();
        newO.setTime(o.getTime());
        return newO;
    }
    // Nodes
    if(cm.isNode(o)){
        if(cloneNode){
            newO = o.cloneNode(true);
        }else{
            newO = o;
        }
        return newO;
    }
    // Other (make links)
    return o;
};

cm.getLength = function(o){
    var i = 0;
    cm.forEach(o, function(){
        i++;
    });
    return i;
};

cm.inArray = function(a, item){
    if(typeof a == 'string'){
        return a === item;
    }else{
        return a.indexOf(item) > -1;
    }
};

cm.arrayRemove = function(a, item){
    a.splice(a.indexOf(item), 1);
    return a;
};

cm.arrayIndex = function(a, item){
    return Array.prototype.indexOf.call(a, item);
};

cm.objectToArray = function(o){
    if(typeof(o) != 'object'){
        return [o];
    }
    var a = [];
    cm.forEach(o, function(item){
        a.push(item);
    });
    return a;
};

cm.arrayToObject = function(a){
    var o = {};
    a.forEach(function(item, i){
        if(typeof item == 'object'){
            o[i] = item;
        }else{
            o[item] = item;
        }
    });
    return o;
};

cm.objectReplace = function(o, vars){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(cm.isObject(value)){
            newO[key] = cm.objectReplace(value, vars);
        }else if(cm.isString(value)){
            newO[key] = cm.strReplace(value, vars);
        }
    });
    return newO;
};

cm.isEmpty = function(el){
    if(!el){
        return true;
    }else if(typeof el == 'string' || cm.isArray(el)){
        return el.length === 0;
    }else if(cm.isObject(el)){
        return cm.getLength(el) === 0;
    }else if(typeof el == 'number'){
        return el === 0;
    }else{
        return false;
    }
};

cm.objectPath = function(name, obj){
    obj = typeof obj == 'undefined'? window : obj;
    name = name.toString().split('.');
    var findObj = obj,
        length = name.length;
    cm.forEach(name, function(item, key){
        if(findObj){
            findObj = findObj[item];
        }
    });
    return findObj;
};

cm.objectSelector = function(name, obj, apply){
    obj = typeof obj == 'undefined'? window : obj;
    name = name.toString().split('.');
    var findObj = obj,
        length = name.length;
    cm.forEach(name, function(item, key){
        if(!findObj[item]){
            findObj[item] = {};
        }
        if(apply && key == length -1){
            findObj[item] = apply;
        }
        findObj = findObj[item];
    });
    return findObj;
};

cm.sort = function(o){
    var a = [];
    cm.forEach(o, function(item, key){
        a.push({'key' : key, 'value' : item});
    });
    a.sort(function(a, b){
        return (a['key'] < b['key']) ? -1 : ((a['key'] > b['key']) ? 1 : 0);
    });
    o = {};
    a.forEach(function(item){
        o[item['key']] = item['value'];
    });
    return o;
};

cm.replaceDeep = function(o, from, to){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(typeof value == 'object'){
            newO[key] = cm.replaceDeep(value, from, to);
        }else{
            newO[key] = value.replace(from, to);
        }
    });
    return newO;
};

/* ******* EVENTS ******* */

cm.log = (function(){
    var results = [],
        log;
    if(cm._debug && Function.prototype.bind && window.console){
        log = Function.prototype.bind.call(console.log, console);
        return function(){
            log.apply(console, arguments);
        };
    }else if(cm._debug && cm._debugAlert){
        return function(){
            cm.forEach(arguments, function(arg){
                results.push(arg);
            });
            alert(results.join(', '));
        };
    }else{
        return function(){};
    }
})();

cm.errorLog = function(o){
    var config = cm.merge({
            'type' : 'error',
            'name' : '',
            'message' : '',
            'langs' : {
                'error' : 'Error!',
                'success' : 'Success!',
                'attention' : 'Attention!',
                'common' : 'Common'
            }
        }, o),
        str = [
            config['langs'][config['type']],
            config['name'],
            config['message']
        ];
    cm.log(str.join(' > '));
};

cm.getEvent = function(e){
    return e || window.event;
};

cm.stopPropagation = function(e){
    return e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
};

cm.preventDefault = function(e){
    return e.preventDefault ? e.preventDefault() : e.returnValue = false;
};

cm.getObjFromEvent = cm.getEventObject = cm.getEventTarget = function(e){
    return  e.target || e.srcElement;
};

cm.getObjToEvent = cm.getRelatedTarget = function(e){
    return e.relatedTarget || e.srcElement;
};

cm.getEventClientPosition = function(e){
    var o = {
        'left' : 0,
        'top' : 0
    };
    if(e){
        try{
            o['left'] = e.clientX;
            o['top'] = e.clientY;
            if(e.touches && e.touches.length){
                o['left'] = e.touches[0].clientX;
                o['top'] = e.touches[0].clientY;
            }else if(e.changedTouches && e.changedTouches.length){
                o['left'] = e.changedTouches[0].clientX;
                o['top'] = e.changedTouches[0].clientY;
            }
        }catch(e){}
    }
    return o;
};

cm.addEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = typeof useCapture == 'undefined' ? false : useCapture;
        try{
            el.addEventListener(type, handler, useCapture);
        }catch(e){
            el.attachEvent('on' + type, handler);
        }
    }
    return el;
};

cm.removeEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = typeof useCapture == 'undefined' ? false : useCapture;
        try{
            el.removeEventListener(type, handler, useCapture);
        }catch(e){
            el.detachEvent('on' + type, handler);
        }
    }
    return el;
};

cm.triggerEvent = function(el, type, params){
    var event;
    if(document.createEvent){
        event = document.createEvent('Event');
        event.initEvent(type, true, true);
    }else if(document.createEventObject){
        event = document.createEventObject();
        event.eventType = type;
    }
    event.eventName = type;
    if(el.dispatchEvent){
        el.dispatchEvent(event);
    }else if(el.fireEvent){
        el.fireEvent('on' + event.eventType, event);
    }
    return el;
};

cm.customEventsStack = [
    /* {'el' : node, 'type' : 'customEventType', 'handler' : function, 'misc' : {'eventType' : [function]}} */
];

cm.addCustomEvent = function(el, type, handler, useCapture, preventDefault){
    useCapture = typeof(useCapture) == 'undefined' ? true : useCapture;
    preventDefault = typeof(preventDefault) == 'undefined' ? false : preventDefault;

    var events = {
        'tap' : function(){
            var x = 0,
                fault = 4,
                y = 0;
            // Generate events
            return {
                'click' : [
                    function(e){
                        if(preventDefault){
                            e.preventDefault();
                        }
                    }
                ],
                'touchstart' : [
                    function(e){
                        x = e.changedTouches[0].screenX;
                        y = e.changedTouches[0].screenY;
                        if(preventDefault){
                            e.preventDefault();
                        }
                    }
                ],
                'touchend' : [
                    function(e){
                        if(
                            Math.abs(e.changedTouches[0].screenX - x) > fault ||
                            Math.abs(e.changedTouches[0].screenY - y) > fault
                        ){
                            return;
                        }
                        if(preventDefault){
                            e.preventDefault();
                        }
                        handler(e);
                    }
                ]
            };
        }
    };
    // Process custom event
    if(events[type]){
        var miscEvents = events[type]();
        // Push generated events to stack
        cm.customEventsStack.push({
            'el' : el,
            'type' : type,
            'handler' : handler,
            'misc' : miscEvents
        });
        // Bind generated events
        cm.forEach(miscEvents, function(miscFunctions, eventType){
            cm.forEach(miscFunctions, function(miscFunction){
                el.addEventListener(eventType, miscFunction, useCapture);
            });
        });
    }
    return el;
};

cm.removeCustomEvent = function(el, type, handler, useCapture){
    cm.customEventsStack = cm.customEventsStack.filter(function(item){
        if(item['el'] === el && item['type'] == type && item['handler'] === handler){
            cm.forEach(item['misc'], function(miscFunctions, eventType){
                cm.forEach(miscFunctions, function(miscFunction){
                    el.removeEventListener(eventType, miscFunction, useCapture);
                });
            });
            return false;
        }
        return true;
    });
    return el;
};

cm.customEvent = (function(){
    var _stack = {};

    return {
        'add' : function(node, type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            _stack[type].push({
                'node' : node,
                'type' : type,
                'handler' : typeof handler == 'function' ? handler : function(){}
            });
            return node;
        },
        'remove' : function(node, type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            _stack[type] = _stack[type].filter(function(item){
                return item['node'] != node && item['handler'] != handler;
            });
            return node;
        },
        'trigger' : function(node, type, params){
            var stopPropagation = false;
            params = cm.merge({
                'target' : node,
                'type' : 'all',            // child | parent | all
                'self' : true,
                'stopPropagation' : function(){
                    stopPropagation = true;
                }
            }, params);
            if(_stack[type]){
                _stack[type].sort(function(a, b){
                    if(params['type'] == 'parent'){
                        return cm.getNodeOffsetIndex(b['node']) > cm.getNodeOffsetIndex(a['node']);
                    }
                    return cm.getNodeOffsetIndex(a['node']) - cm.getNodeOffsetIndex(b['node']);
                });
                cm.forEach(_stack[type], function(item){
                    if(!stopPropagation){
                        if(params['self'] && node === item['node']){
                            item['handler'](params);
                        }
                        switch(params['type']){
                            case 'child':
                                if(cm.isParent(node, item['node'], false)){
                                    item['handler'](params);
                                }
                                break;
                            case 'parent':
                                if(cm.isParent(item['node'], node, false)){
                                    item['handler'](params);
                                }
                                break;
                            default:
                                if(node !== item['node']){
                                    item['handler'](params);
                                }
                                break;
                        }
                    }
                });
            }
            return node;
        }
    };
})();

cm.onLoad = function(handler, isMessage){
    isMessage = typeof isMessage == 'undefined'? true : isMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(isMessage){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.onLoad',
                'message' : ['Load time', (Date.now() - cm._loadTime), 'ms.'].join(' ')
            });
        }
        handler();
    };
    try{
        cm.addEvent(window, 'load', execute);
    }catch(e){}
};

cm.onReady = function(handler, isMessage){
    isMessage = typeof isMessage == 'undefined'? true : isMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(isMessage){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.onReady',
                'message' : ['Ready time', (Date.now() - cm._loadTime), 'ms.'].join(' ')
            });
        }
        handler();
    };
    cm.addEvent(document, 'DOMContentLoaded', execute);
    try{
        cm.addEvent(window, 'load', execute);
    }catch(e){}
};

cm.addScrollEvent = function(node, callback, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    if(cm.isWindow(node)){
        cm.addEvent(node, 'scroll', callback, useCapture);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.addEvent(cm.getOwnerWindow(node), 'scroll', callback, useCapture);
        }else{
            cm.addEvent(node, 'scroll', callback, useCapture);
        }
    }
    return node;
};

cm.removeScrollEvent = function(node, callback, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    if(cm.isWindow(node)){
        cm.removeEvent(node, 'scroll', callback, useCapture);
    }if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.removeEvent(cm.getOwnerWindow(node), 'scroll', callback, useCapture);
        }else{
            cm.removeEvent(node, 'scroll', callback, useCapture);
        }
    }
    return node;
};

cm.isolateScrolling = function(e){
    var that = this;
    if(e.deltaY > 0 && that.clientHeight + that.scrollTop >= that.scrollHeight){
        that.scrollTop = that.scrollHeight - that.clientHeight;
        cm.stopPropagation(e);
        cm.preventDefault(e);
        return false;
    }else if (e.deltaY < 0 && that.scrollTop <= 0){
        that.scrollTop = 0;
        cm.stopPropagation(e);
        cm.preventDefault(e);
        return false;
    }
    return true;
};

cm.addIsolateScrolling = function(node){
    cm.addEvent(node, 'wheel', cm.isolateScrolling);
    return node;
};

cm.removeIsolateScrolling = function(node){
    cm.removeEvent(node, 'wheel', cm.isolateScrolling);
    return node;
};

cm.isCenterButton = function(e){
    return e.button == ((cm.is('IE') && cm.isVersion() < 9) ? 4 : 1);
};

cm.debounce = function(func, wait, immediate){
    var timeout, result;
    return function(){
        var context = this, args = arguments;
        var later = function(){
            timeout = null;
            if(!immediate){
                result = func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if(callNow){
            result = func.apply(context, args);
        }
        return result;
    };
};

cm.onScrollStart = function(node, handler){
    var worked = false,
        scrollEnd = function(){
            worked = false;
        },
        helper = cm.debounce(scrollEnd, 300),
        scrollEvent = function(){
            !worked && handler();
            worked = true;
            helper();
        };
    cm.addEvent(node, 'scroll', scrollEvent);
    return {
        'remove' : function(){
            cm.removeEvent(node, 'scroll', scrollEvent);
        }
    };
};

cm.onScrollEnd = function(node, handler){
    var helper = cm.debounce(handler, 300);
    cm.addEvent(node, 'scroll', helper);
    return {
        'remove' : function(){
            cm.removeEvent(node, 'scroll', helper);
        }
    };
};

cm.onImageLoad = function(src, handler, delay){
    delay = delay || 0;
    var nodes = [],
        isMany = cm.isArray(src),
        images = isMany ? src : [src],
        imagesLength = images.length,
        isLoad = 0,
        timeStart = Date.now(),
        timePassed = 0;

    images.forEach(function(item, i){
        nodes[i] = cm.Node('img', {'alt' : ''});
        nodes[i].onload = function(){
            isLoad++;
            if(isLoad == imagesLength){
                timePassed = Date.now() - timeStart;
                delay = timePassed < delay ? delay - timePassed : 0;

                if(delay){
                    setTimeout(function(){
                        handler(isMany ? nodes : nodes[0]);
                    }, delay);
                }else{
                    handler(isMany ? nodes : nodes[0]);
                }
            }
        };
        nodes[i].src = item;
    });

    return isMany ? nodes : nodes[0];
};

/* ******* NODES ******* */

cm.getOwnerWindow = function(node){
    return node.ownerDocument.defaultView;
};

cm.addScript = function(src, async, callback){
    var vars = {
        '%baseUrl%' : cm._baseUrl,
        '%assetsUrl%' : cm._assetsUrl || cm._baseUrl,
        '%version%' : cm._version
    };
    // Config
    src = cm.isArray(src) ? cm.objectReplace(src, vars) : cm.strReplace(src, vars);
    async = typeof async != 'undefined' ? async : false;
    callback = typeof callback != 'undefined' ? callback : function(){};
    // Handler
    var script = document.createElement('script');
    script.src = src;
    script.async = async;
    cm.addEvent(script, 'load', callback);
    cm.addEvent(script, 'error', callback);
    cm.appendChild(script, cm.getDocumentHead());
    return script;
};

cm.loadScript = function(o){
    o = cm.merge({
        'path' : '',
        'src' : '',
        'async' : true,
        'callback' : function(){}
    }, o);
    var path = cm.objectSelector(o['path'], window);
    if(!cm.isEmpty(path)){
        o['callback'](path);
    }else{
        cm.addScript(o['src'], o['async'], function(){
            path = cm.objectSelector(o['path'], window);
            if(!cm.isEmpty(path)){
                o['callback'](path);
            }else{
                cm.errorLog({
                    'type' : 'error',
                    'name' : 'cm.loadScript',
                    'message' : [o['path'], 'does not loaded.'].join(' ')
                });
                o['callback'](null);
            }
        });
    }
};

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    node = node || document;
    if(node.getElementsByClassName){
        return node.getElementsByClassName(str);
    }
    var els = node.getElementsByTagName('*'),
        arr = [];
    for(var i = 0, l = els.length; i < l; i++){
        cm.isClass(els[i], str) && arr.push(els[i]);
    }
    return arr;
};

cm.getByAttr = function(attr, value, element){
    var p = element || document;
    if(p.querySelectorAll){
        return p.querySelectorAll("[" + attr + "='" + value + "']");
    }
    var elements = p.getElementsByTagName('*');
    var stack = [];
    for(var i = 0, ln = elements.length; i < ln; i++){
        if(elements[i].getAttribute(attr) == value){
            stack.push(elements[i]);
        }
    }
    return stack;
};

cm.getByName = function(name, node){
    if(node){
        var arr = [],
            els = node.getElementsByTagName('*');
        for(var i = 0, l = els.length; i < l; i++){
            if(els[i].name == name){
                arr.push(els[i]);
            }
        }
        return arr;
    }else{
        return document.getElementsByName(name);
    }
};

cm.getParentByTagName = function(tagName, node){
    if(!tagName || !node || !node.parentNode){
        return null;
    }
    var el = node.parentNode;
    do{
        if(el.tagName && el.tagName.toLowerCase() == tagName.toLowerCase()){
            return el;
        }
    }while(el = el.parentNode);
    return null;
};

cm.getIFrameDOM = function(o){
    return o.contentDocument || o.document;
};

cm.getDocumentHead = function(){
    return document.getElementsByTagName('head')[0];
};

cm.getDocumentHtml = function(){
    return document.documentElement;
};

cm.getNodeOffsetIndex = function(node){
    if(!cm.isNode(node)){
        return 0;
    }
    var o = node,
        i = 0;
    while(o.parentNode){
        o = o.parentNode;
        i++;
    }
    return i;
};

cm.node = cm.Node = function(){
    var args = arguments,
        el = document.createElement(args[0]),
        i = 0;
    if(cm.isObject(args[1])){
        cm.forEach(args[1], function(value, key){
            if(cm.isObject(value)){
                value = JSON.stringify(value);
            }
            if(key == 'style'){
                el.style.cssText = value;
            }else if(key == 'class'){
                el.className = value;
            }else if(key == 'innerHTML'){
                el.innerHTML = value;
            }else{
                el.setAttribute(key, value);
            }
        });
        i = 2;
    }else{
        i = 1;
    }
    for(var ln = args.length; i < ln; i++){
        if(typeof args[i] != 'undefined'){
            if(typeof args[i] == 'string' || typeof args[i] == 'number'){
                cm.appendChild(cm.textNode(args[i]), el);
            }else{
                cm.appendChild(args[i], el);
            }
        }
    }
    return el;
};

cm.textNode = function(text){
    return document.createTextNode(text);
};

cm.wrap = function(target, node){
    if(!target || !node){
        return null;
    }
    if(node.parentNode){
        cm.insertBefore(target, node);
    }
    target.appendChild(node);
    return target;
};

cm.inDOM = function(o){
    if(o){
        var el = o.parentNode;
        while(el){
            if(el == document){
                return true;
            }
            el = el.parentNode;
        }
    }
    return false;
};

cm.hasParentNode = function(o){
    if(o){
        return !!o.parentNode;
    }
    return false;
};

cm.isParent = function(p, o, flag){
    if(cm.isNode(o) && o.parentNode){
        if(cm.isWindow(p) && cm.inDOM(o)){
            return true;
        }

        var el = o.parentNode;
        do{
            if(el == p){
                return true;
            }
        }while(el = el.parentNode);
    }
    return (flag) ? p === o : false;
};

cm.isParentByClass = function(parentClass, o){
    if(o && o.parentNode){
        var el = o.parentNode;
        do{
            if(cm.isClass(el, parentClass)){
                return true;
            }
        }while(el = el.parentNode);
    }
    return false;
};

cm.getData = function(node, name){
    if(!node){
        return null;
    }
    if(node.dataset){
        return node.dataset[name];
    }else{
        return node.getAttribute(['data', name].join('-'));
    }
};

cm.getTextValue = cm.getTxtVal = function(o){
    return o.nodeType == 1 && o.firstChild ? o.firstChild.nodeValue : '';
};

cm.getTextNodesStr = function(node){
    var str = '',
        childs;
    if(node){
        if(cm.isArray(node)){
            cm.forEach(node, function(child){
                str += cm.getTextNodesStr(child);
            });
        }else if(cm.isNode(node)){
            childs = node.childNodes;
            cm.forEach(childs, function(child){
                if(child.nodeType == 1){
                    str += cm.getTextNodesStr(child);
                }else{
                    str += child.nodeValue;
                }
            });
        }
    }
    return str;
};

cm.remove = function(node){
    if(node && node.parentNode){
        node.parentNode.removeChild(node);
    }
};

cm.clearNode = function(node){
    while(node.childNodes.length){
        node.removeChild(node.firstChild);
    }
    return node;
};

cm.prevEl = function(node){
    node = node.previousSibling;
    if(node && node.nodeType && node.nodeType != 1){
        node = cm.prevEl(node);
    }
    return node;
};

cm.nextEl = function(node){
    node = node.nextSibling;
    if(node && node.nodeType && node.nodeType != 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.firstEl = function(node){
    if(!node || !node.firstChild){
        return null;
    }
    node = node.firstChild;
    if(node.nodeType != 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.insertFirst = function(node, target){
    if(cm.isNode(node) && cm.isNode(target)){
        if(target.firstChild){
            cm.insertBefore(node, target.firstChild);
        }else{
            cm.appendChild(node, target);
        }
    }
    return node;
};

cm.insertLast = cm.appendChild = function(node, target){
    if(cm.isNode(node) && cm.isNode(target)){
        target.appendChild(node);
    }
    return node;
};

cm.insertBefore = function(node, target){
    if(cm.isNode(node) && cm.isNode(target) && target.parentNode){
        target.parentNode.insertBefore(node, target);
    }
    return node;
};

cm.insertAfter = function(node, target){
    if(cm.isNode(node) && cm.isNode(target) && target.parentNode){
        var before = target.nextSibling;
        if(before){
            cm.insertBefore(node, before);
        }else{
            target.parentNode.appendChild(node);
        }
    }
    return node;
};

cm.replaceNode = function(node, target){
    cm.insertBefore(node, target);
    cm.remove(target);
    return node;
};

cm.appendNodes = function(nodes, target){
    if(cm.isEmpty(nodes)){
        return target;
    }
    if(cm.isNode(nodes)){
        target.appendChild(nodes);
    }else{
        while(nodes.length){
            if(cm.isNode(nodes[0])){
                target.appendChild(nodes[0]);
            }else{
                cm.remove(nodes[0]);
            }
        }
    }
    return target;
};

cm.hideSpecialTags = function(){
    var els;
    if(document.querySelectorAll){
        els = document.querySelectorAll('iframe,object,embed');
        cm.forEach(els, function(item){
            item.style.visibility = 'hidden';
        });
    }else{
        els = document.getElementsByTagName('*');
        cm.forEach(els, function(item){
            if(item.tagName && /iframe|object|embed/.test(item.tagName)){
                item.style.visibility = 'hidden';
            }
        });
    }
};

cm.showSpecialTags = function(){
    var els;
    if(document.querySelectorAll){
        els = document.querySelectorAll('iframe,object,embed');
        cm.forEach(els, function(item){
            item.style.visibility = 'visible';
        });
    }else{
        els = document.getElementsByTagName('*');
        cm.forEach(els, function(item){
            if(item.tagName && /iframe|object|embed/.test(item.tagName)){
                item.style.visibility = 'visible';
            }
        });
    }
};

cm.strToHTML = function(str){
    if(!str || cm.isNode(str)){
        return str;
    }
    var node = cm.Node('div');
    node.insertAdjacentHTML('beforeend', str);
    return node.childNodes.length == 1? node.firstChild : node.childNodes;
};

cm.getNodes = function(container, marker){
    container = container || document.body;
    marker = marker || 'data-node';
    var nodes = {},
        processedNodes = [];

    var separation = function(node, obj, processedObj){
        var attrData = node.getAttribute(marker),
            separators = attrData? attrData.split('|') : [],
            altProcessedObj;

        cm.forEach(separators, function(separator){
            altProcessedObj = [];
            if(separator.indexOf('.') == -1){
                process(node, separator, obj, altProcessedObj);
            }else{
                pathway(node, separator, altProcessedObj);
            }
            cm.forEach(altProcessedObj, function(node){
                processedObj.push(node);
            });
        });
    };

    var pathway = function(node, attr, processedObj){
        var separators = attr? attr.split('.') : [],
            obj = nodes;
        cm.forEach(separators, function(separator, i){
            if(i === 0 && cm.isEmpty(separator)){
                obj = nodes;
            }else if((i + 1) == separators.length){
                process(node, separator, obj, processedObj);
            }else{
                if(!obj[separator]){
                    obj[separator] = {};
                }
                obj = obj[separator];
            }
        });
    };

    var process = function(node, attr, obj, processedObj){
        var separators = attr? attr.split(':') : [],
            arr;
        if(separators.length == 1){
            obj[separators[0]] = node;
        }else if(separators.length == 2 || separators.length == 3){
            if(separators[1] == '[]'){
                if(!obj[separators[0]]){
                    obj[separators[0]] = [];
                }
                arr = {};
                if(separators[2]){
                    arr[separators[2]] = node;
                }
                find(node, arr, processedObj);
                obj[separators[0]].push(arr);
            }else if(separators[1] == '{}'){
                if(!obj[separators[0]]){
                    obj[separators[0]] = {};
                }
                if(separators[2]){
                    obj[separators[0]][separators[2]] = node;
                }
                find(node, obj[separators[0]], processedObj);
            }
        }
        processedObj.push(node);
    };

    var find = function(container, obj, processedObj){
        var sourceNodes = container.querySelectorAll('[' + marker +']');
        cm.forEach(sourceNodes, function(node){
            if(!cm.inArray(processedObj, node)){
                separation(node, obj, processedObj);
            }
        });
    };

    separation(container, nodes, processedNodes);
    find(container, nodes, processedNodes);

    return nodes;
};

cm.processDataAttributes = function(node, name, vars){
    vars = typeof vars != 'undefined' ? vars : {};
    var marker = ['data-attributes', name].join('-'),
        nodes = node.querySelectorAll('[' + marker + ']'),
        value;

    var process = function(node){
        if(value = node.getAttribute(marker)){
            node.setAttribute(name, cm.strReplace(value, vars));
        }
    };

    process(node);
    cm.forEach(nodes, process);
};

/* ******* FORM ******* */

cm.setFDO = function(o, form){
    cm.forEach(o, function(item, name){
        var el = cm.getByAttr('name', name, form);

        for(var i = 0, ln = el.length; i < ln; i++){
            var type = (el[i].type || '').toLowerCase();
            switch(type){
                case 'radio':
                    if(item == el[i].value){
                        el[i].checked = true;
                    }
                    break;

                case 'checkbox':
                    el[i].checked = !!item;
                    break;

                default:
                    if(el[i].tagName.toLowerCase() == 'select'){
                        cm.setSelect(el[i], item);
                    }else{
                        el[i].value = item;
                    }
                    break;
            }
        }
    });
    return form;
};

cm.getFDO = function(o, chbx){
    var data = {};

    if(!cm.isNode(o)){
        return data;
    }

    var elements = [
        o.getElementsByTagName('input'),
        o.getElementsByTagName('textarea'),
        o.getElementsByTagName('select')
    ];

    var setValue = function(name, value){
        if(/\[.*\]$/.test(name)){
            var indexes = [];
            var re = /\[(.*?)\]/g;
            var results = null;
            while(results = re.exec(name)){
                indexes.push(results[1]);
            }
            name = name.replace(/\[.*\]$/, '');
            data[name] = (function(i, obj){
                var index = indexes[i];
                var next = typeof(indexes[i + 1]) != 'undefined';
                if(index === ''){
                    if(obj && obj instanceof Array){
                        obj.push(next ? arguments.callee(i + 1, obj) : value);
                    }else{
                        obj = [next? arguments.callee(i+1, obj) : value];
                    }
                }else{
                    if(!obj || !(obj instanceof Object)){
                        obj = {};
                    }
                    obj[index] = next ? arguments.callee(i + 1, obj[index]) : value;
                }
                return obj;
            })(0, data[name]);
        }else{
            data[name] = value;
        }
        return 1;
    };

    for(var d = 0, lnd = elements.length; d < lnd; d++){
        for(var i = 0, ln = elements[d].length; i < ln; i++){
            if(!elements[d][i].name.length){
                continue;
            }
            switch(elements[d][i].tagName.toLowerCase()){
                case 'input':
                    switch(elements[d][i].type.toLowerCase()){
                        case 'radio':
                            if(elements[d][i].checked){
                                setValue(elements[d][i].name, elements[d][i].value || 1);
                            }
                            break;

                        case 'checkbox':
                            if(elements[d][i].checked){
                                setValue(elements[d][i].name, elements[d][i].value || 1);
                            }else if(typeof(chbx) != 'undefined' && chbx !== false){
                                setValue(elements[d][i].name, chbx);
                            }
                            break;

                        case 'password':
                        case 'hidden':
                        case 'text':
                        default:
                            setValue(elements[d][i].name, elements[d][i].value);
                            break;
                    }
                    break;

                case 'textarea':
                case 'select':
                    if(elements[d][i].multiple){
                        var opts = elements[d][i].getElementsByTagName('option');
                        for(var j in opts){
                            if(opts[j].selected){
                                setValue(elements[d][i].name, opts[j].value);
                            }
                        }
                    }else{
                        setValue(elements[d][i].name, elements[d][i].value);
                    }
                    break;
            }
        }
    }
    return data;
};

cm.clearForm = function(o){
    var formEls = cm.getByClass('formData', o);
    for(var i = 0, ln = formEls.length; i < ln; i++){
        if(formEls[i].tagName.toLowerCase() == 'input'){
            if(formEls[i].type.toLowerCase() == 'checkbox' || formEls[i].type.toLowerCase() == 'radio'){
                formEls[i].checked = false;
            }else{
                formEls[i].value = '';
            }
        }else if(formEls[i].tagName.toLowerCase() == 'textarea'){
            formEls[i].value = '';
        }else if(formEls[i].tagName.toLowerCase() == 'select'){
            var opts = formEls[i].getElementsByTagName('option');
            for(var d = 0, lnd = opts.length; d < lnd; d++){
                opts[d].selected = false;
            }
        }
    }
    return o;
};

cm.setSelect = function(o, value){
    if(!o || !cm.isNode(o)){
        return null;
    }
    var options = o.getElementsByTagName('option');
    cm.forEach(options, function(node){
        node.selected = (typeof value == 'object'? cm.inArray(node.value, value) : node.value == value);
    });
    return o;
};

cm.toggleRadio = function(name, value, node){
    node = node || document.body;
    var els = cm.getByName(name, node);
    for(var i = 0; i < els.length; i++){
        if(els[i].value == value){
            els[i].checked = true;
        }
    }
};

cm.getValue = function(name, node){
    node = node || document.body;
    var nodes = cm.getByName(name, node),
        value;
    for(var i = 0, l = nodes.length; i < l; i++){
        if(nodes[i].checked){
            value = nodes[i].value;
        }
    }
    return value;
};

/* ******* STRINGS ******* */

cm.toFixed = function(n, x){
    return parseFloat(n).toFixed(x);
};

cm.toNumber = function(str){
    return parseInt(str.replace(/\s+/, ''));
};

cm.is = function(str){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.is()" returns false.');
        return false;
    }
    return Com.UA.is(str);
};

cm.isVersion = function(){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isVersion()" returns null.');
        return null;
    }
    return Com.UA.isVersion();
};

cm.isMobile = function(){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isMobile()" returns false.');
        return false;
    }
    return Com.UA.isMobile();
};

cm.decode = (function(){
    var node = document.createElement('textarea');
    return function(str){
        if(str){
            node.innerHTML = str;
            return node.value;
        }else{
            return '';
        }

    };
})();

cm.strWrap = function(str, symbol){
    str = str.toString();
    return ['', str, ''].join(symbol);
};

cm.strReplace = function(str, vars){
    if(vars && cm.isObject(vars)){
        str = str.toString();
        cm.forEach(vars, function(item, key){
            if(cm.isObject(item)){
                item = JSON.stringify(item);
            }
            str = str.replace(new RegExp(key, 'g'), item);
        });
    }
    return str;
};

cm.reduceText = function(str, length, points){
    points = typeof points == 'undefined' ? false : points;
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '...' : '');
    }else{
        return str;
    }
};

cm.removeDanger = function(str){
    return str.replace(/(<|>|&lt;|&gt;)/gim, '');
};

cm.removeSpaces = function(str){
    return str.replace(/[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+/g, '');
};

cm.cutHTML = function(str){
    return str.replace(/<[^>]*>/g, '');
};

cm.splitNumber = function(str){
    return str.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
};

cm.rand = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

cm.isEven = function(num){
    return /^(.*)(0|2|4|6|8)$/.test(num);
};

cm.addLeadZero = function(x){
    x = parseInt(x, 10);
    return x < 10 ? '0' + x : x;
};

cm.getNumberDeclension = function(number, titles){
    var cases = [2, 0, 1, 1, 1, 2];
    return titles[
        (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
};

cm.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

cm.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

/* ******* DATE AND TIME ******* */

cm.isDateValid = function(date){
    return (cm.isDate(date) && !isNaN(date.valueOf()));
};

cm.getCurrentDate = function(format){
    format = format || cm._config.dateTimeFormat;
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs){
    //date = !date ? new Date() : new Date(+date);
    date = date ? new Date(+date) : null;
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    langs = cm.merge({
        'months' : [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        'days' : [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ]
    }, langs);

    var formats = function(date){
        return {
            '%Y' : function(){
                return date ? date.getFullYear() : '0000';
            },
            '%m' : function(){
                return date ? cm.addLeadZero(date.getMonth() + 1) : '00';
            },
            '%n' : function(){
                return date ? (date.getMonth() + 1) : '00';
            },
            '%F' : function(){
                return date ? langs['months'][date.getMonth()] : '00';
            },
            '%d' : function(){
                return date ? cm.addLeadZero(date.getDate()) : '00';
            },
            '%j' : function(){
                return date ? date.getDate() : '00';
            },
            '%l' : function(){
                return date ? langs['days'][date.getDay()] : '00';
            },
            '%a' : function(){
                return date ? (date.getHours() >= 12? 'pm' : 'am') : '';
            },
            '%A' : function(){
                return date ? (date.getHours() >= 12? 'PM' : 'AM') : '';
            },
            '%g' : function(){
                return date ? (date.getHours() % 12 || 12) : '00';
            },
            '%G' : function(){
                return date ? date.getHours() : '00';
            },
            '%h' : function(){
                return date ? cm.addLeadZero(date.getHours() % 12 || 12) : '00';
            },
            '%H' : function(){
                return date ? cm.addLeadZero(date.getHours()) : '00';
            },
            '%i' : function(){
                return date ? cm.addLeadZero(date.getMinutes()) : '00';
            },
            '%s' : function(){
                return date ? cm.addLeadZero(date.getSeconds()) : '00';
            }
        };
    };

    cm.forEach(formats(date), function(item, key){
        format = format.replace(key, item);
    });
    return format;
};

cm.parseDate = function(str, format){
    if(!str){
        return null;
    }

    var date = new Date(),
        convertFormats = {
            '%Y' : 'YYYY',
            '%m' : 'mm',
            '%d' : 'dd',
            '%H' : 'HH',
            '%i' : 'ii',
            '%s' : 'ss'
        },
        formats = {
            'YYYY' : function(value){
                if(value != '0000'){
                    date.setFullYear(value);
                }
            },
            'mm' : function(value){
                if(value != '00'){
                    date.setMonth(value - 1);
                }
            },
            'dd' : function(value){
                if(value != '00'){
                    date.setDate(value);
                }
            },
            'HH' : function(value){
                date.setHours(value);
            },
            'ii' : function(value){
                date.setMinutes(value);
            },
            'ss' : function(value){
                date.setSeconds(value);
            }
        },
        fromIndex = 0;

    format = format || cm._config['dateTimeFormat'];

    cm.forEach(convertFormats, function(item, key){
        format = format.replace(key, item);
    });

    cm.forEach(formats, function(item, key){
        fromIndex = format.indexOf(key);
        while(fromIndex != -1){
            item(str.substr(fromIndex, key.length));
            fromIndex = format.indexOf(key, fromIndex + 1);
        }
    });

    return date;
};

cm.getWeek = function(date){
    date = !date ? new Date() : new Date(+date);
    var d = new Date(+date);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

cm.getWeeksInYear = function(year){
    year = !year ? new Date().getFullYear() : year;
    var date = new Date(year, 11, 31),
        week = cm.getWeek(date);
    return week == 1 ? cm.getWeek(date.setDate(24)) : week;
};

/* ******* STYLES ******* */

cm.addClass = function(node, str, useHack){
    if(!cm.isNode(node) || cm.isEmpty(str)){
        return null;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(node.classList){
        cm.forEach(str.split(/\s+/), function(item){
            if(!cm.isEmpty(item)){
                node.classList.add(item);
            }
        });
    }else{
        var add = cm.arrayToObject(typeof(str) == 'object' ? str : str.split(/\s+/)),
            current = cm.arrayToObject(node && node.className ? node.className.split(/\s+/) : []);
        current = cm.merge(current, add);
        node.className = cm.objectToArray(current).join(' ');
    }
    return node;
};

cm.removeClass = function(node, str, useHack){
    if(!cm.isNode(node) || cm.isEmpty(str)){
        return null;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(node.classList){
        cm.forEach(str.split(/\s+/), function(item){
            if(!cm.isEmpty(item)){
                node.classList.remove(item);
            }
        });
    }else{
        var remove = cm.arrayToObject(typeof(str) == 'object' ? str : str.split(/\s+/)),
            current = node && node.className ? node.className.split(/\s+/) : [],
            ready = [];
        current.forEach(function(item){
            if(!remove[item]){
                ready.push(item);
            }
        });
        node.className = ready.join(' ');
    }
    return node;
};

cm.replaceClass = function(node, oldClass, newClass, useHack){
    if(!cm.isNode(node)){
        return null;
    }
    return cm.addClass(cm.removeClass(node, oldClass, useHack), newClass, useHack);
};

cm.hasClass = cm.isClass = function(node, cssClass){
    var hasClass, classes;
    if(!cm.isNode(node)){
        return false;
    }
    if(node.classList){
        return node.classList.contains(cssClass);
    }else{
        classes = node.className ? node.className.split(/\s+/) : [];
        hasClass = false;
        cm.forEach(classes, function(item){
            if(item == cssClass){
                hasClass = true;
            }
        });
        return hasClass;
    }
};

cm.getPageSize = function(key){
    var d = document,
        de = d.documentElement,
        b = d.body,
        o = {
            'height' : Math.max(
                Math.max(b.scrollHeight, de.scrollHeight),
                Math.max(b.offsetHeight, de.offsetHeight),
                Math.max(b.clientHeight, de.clientHeight)
            ),
            'width' : Math.max(
                Math.max(b.scrollWidth, de.scrollWidth),
                Math.max(b.offsetWidth, de.offsetWidth),
                Math.max(b.clientWidth, de.clientWidth)
            ),
            'winHeight' : de.clientHeight,
            'winWidth' : de.clientWidth
        };
    o['scrollHeight'] = o['height'] - o['winHeight'];
    o['scrollWidth'] = o['width'] - o['winWidth'];
    return o[key] || o;
};

cm.getScrollBarSize = (function(){
    var node;
    return function(){
        if(!node){
            node = cm.node('div', {'class' : 'cm__scroll-bar-size-checker'});
            cm.insertFirst(node, document.body);
        }
        return Math.max(node.offsetWidth - node.clientWidth, 0);
    };
})();

cm.setOpacity = function(node, value){
    if(node){
        if(cm.is('ie') && cm.isVersion() < 9){
            node.style.filter = "alpha(opacity=" + (Math.floor(value * 100)) + ")";
        }else{
            node.style.opacity = value;
        }
    }
    return node;
};

cm.getX = function(o){
    var x = 0, p = o;
    try{
        while(p){
            x += p.offsetLeft;
            if(p != o){
                x += cm.getStyle(p, 'borderLeftWidth', true) || 0;
            }
            p = p.offsetParent;
        }
    }catch(e){
        return x;
    }
    return x;
};

cm.getY = function(o){
    var y = 0, p = o;
    try{
        while(p){
            y += p.offsetTop;
            if(p != o){
                y += cm.getStyle(p, 'borderTopWidth', true) || 0;
            }
            p = p.offsetParent;
        }
    }catch(e){
        return y;
    }
    return y;
};

cm.getRealX = function(node){
    if(cm.isNode(node)){
        return node.getBoundingClientRect()['left'];
    }
    return 0;
};

cm.getRealY = function(node){
    if(cm.isNode(node)){
        return node.getBoundingClientRect()['top'];
    }
    return 0;
};

cm.getRect = function(node){
    var docEl, o, rect;
    if(cm.isWindow(node)){
        docEl = node.document.documentElement;
        return {
            'top' : 0,
            'right' : docEl.clientWidth,
            'bottom' : docEl.clientHeight,
            'left' : 0,
            'width' : docEl.clientWidth,
            'height' : docEl.clientHeight
        };
    }
    if(cm.isNode(node)){
        o = node.getBoundingClientRect();
        rect = {
            'top' : Math.round(o['top']),
            'right' : Math.round(o['right']),
            'bottom' : Math.round(o['bottom']),
            'left' : Math.round(o['left'])
        };
        rect['width'] = typeof o['width'] != 'undefined' ? Math.round(o['width']) : o['right'] - o['left'];
        rect['height'] = typeof o['height'] != 'undefined' ? Math.round(o['height']) : o['bottom'] - o['top'];
        return rect;
    }
    return {
        'top' : 0,
        'right' : 0,
        'bottom' : 0,
        'left' : 0,
        'width' : 0,
        'height' : 0
    };
};

cm.getFullRect = function(node, styleObject){
    if(!cm.isNode(node)){
        return null;
    }
    var dimensions = {};
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    // Get size and position
    dimensions['width'] = node.offsetWidth;
    dimensions['height'] = node.offsetHeight;
    dimensions['x1'] = cm.getRealX(node);
    dimensions['y1'] = cm.getRealY(node);
    dimensions['x2'] = dimensions['x1'] + dimensions['width'];
    dimensions['y2'] = dimensions['y1'] + dimensions['height'];
    // Calculate Padding and Inner Dimensions
    dimensions['padding'] = {
        'top' :     cm.getCSSStyle(styleObject, 'paddingTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'paddingRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'paddingBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'paddingLeft', true)
    };
    dimensions['innerWidth'] = dimensions['width'] - dimensions['padding']['left'] - dimensions['padding']['right'];
    dimensions['innerHeight'] = dimensions['height'] - dimensions['padding']['top'] - dimensions['padding']['bottom'];
    dimensions['innerX1'] = dimensions['x1'] + dimensions['padding']['left'];
    dimensions['innerY1'] = dimensions['y1'] + dimensions['padding']['top'];
    dimensions['innerX2'] = dimensions['innerX1'] + dimensions['innerWidth'];
    dimensions['innerY2'] = dimensions['innerY1'] + dimensions['innerHeight'];
    // Calculate Margin and Absolute Dimensions
    dimensions['margin'] = {
        'top' :     cm.getCSSStyle(styleObject, 'marginTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'marginRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'marginBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'marginLeft', true)
    };
    dimensions['absoluteWidth'] = dimensions['width'] + dimensions['margin']['left'] + dimensions['margin']['right'];
    dimensions['absoluteHeight'] = dimensions['height'] + dimensions['margin']['top'] + dimensions['margin']['bottom'];
    dimensions['absoluteX1'] = dimensions['x1'] - dimensions['margin']['left'];
    dimensions['absoluteY1'] = dimensions['y1'] - dimensions['margin']['top'];
    dimensions['absoluteX2'] = dimensions['x2'] + dimensions['margin']['right'];
    dimensions['absoluteY2'] = dimensions['y2'] + dimensions['margin']['bottom'];
    return dimensions;
};

cm.getNodeIndents = function(node, styleObject){
    if(!cm.isNode(node)){
        return null;
    }
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    // Get size and position
    var o = {};
    o['margin'] = {
        'top' :     cm.getCSSStyle(styleObject, 'marginTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'marginRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'marginBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'marginLeft', true)
    };
    o['padding'] = {
        'top' :     cm.getCSSStyle(styleObject, 'paddingTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'paddingRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'paddingBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'paddingLeft', true)
    };
    return o;
};

cm.getNodeOffset = function(node, styleObject, o, offsets){
    if(!cm.isNode(node)){
        return null;
    }
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    o = !o || typeof o == 'undefined' ? cm.getNodeIndents(node, styleObject) : o;
    // Get size and position
    o['offset'] = cm.getRect(node);
    if(offsets){
        o['offset']['top'] += offsets['top'];
        o['offset']['right'] += offsets['left'];
        o['offset']['bottom'] += offsets['top'];
        o['offset']['left'] += offsets['left'];
    }
    o['inner'] = {
        'width' : o['offset']['width'] - o['padding']['left'] - o['padding']['right'],
        'height' : o['offset']['height'] - o['padding']['top'] - o['padding']['bottom'],
        'top' : o['offset']['top'] + o['padding']['top'],
        'right' : o['offset']['right'] - o['padding']['right'],
        'bottom' : o['offset']['bottom'] - o['padding']['bottom'],
        'left': o['offset']['left'] + o['padding']['left']
    };
    o['outer'] = {
        'width' : o['offset']['width'] + o['margin']['left'] + o['margin']['right'],
        'height' : o['offset']['height'] + o['margin']['top'] + o['margin']['bottom'],
        'top' : o['offset']['top'] - o['margin']['top'],
        'right' : o['offset']['right'] + o['margin']['right'],
        'bottom' : o['offset']['bottom'] + o['margin']['bottom'],
        'left': o['offset']['left'] - o['margin']['left']
    };
    return o;
};

cm.getRealWidth = function(node, applyWidth){
    var nodeWidth = 0,
        width = 0;
    nodeWidth = node.offsetWidth;
    node.style.width = 'auto';
    width = node.offsetWidth;
    node.style.width = typeof applyWidth == 'undefined' ? [nodeWidth, 'px'].join('') : applyWidth;
    return width;
};

cm.getRealHeight = function(node, type, applyType){
    var types = ['self', 'current', 'offset', 'offsetRelative'],
        height = {},
        styles,
        styleObject;
    // Check parameters
    if(!node || !cm.isNode(node)){
        return 0;
    }
    styleObject = cm.getStyleObject(node);
    type = typeof type == 'undefined' || !cm.inArray(types, type)? 'offset' : type;
    applyType = typeof applyType == 'undefined' || !cm.inArray(types, applyType) ? false : applyType;
    cm.forEach(types, function(type){
        height[type] = 0;
    });
    // Get inline styles
    styles = {
        'display': node.style.display,
        'height': node.style.height,
        'position' : node.style.position
    };
    node.style.display = 'block';
    height['current'] = node.offsetHeight;
    node.style.height = 'auto';

    height['offset'] = node.offsetHeight;
    height['self'] = height['offset']
        - cm.getStyle(styleObject, 'borderTopWidth', true)
        - cm.getStyle(styleObject, 'borderBottomWidth', true)
        - cm.getStyle(styleObject, 'paddingTop', true)
        - cm.getStyle(styleObject, 'paddingBottom', true);

    node.style.position = 'relative';
    height['offsetRelative'] = node.offsetHeight;
    // Set default styles
    node.style.display = styles['display'];
    node.style.height = styles['height'];
    node.style.position = styles['position'];
    if(applyType){
        node.style.height = [height[applyType], 'px'].join('');
    }
    return height[type];
};

cm.getIndentX = function(node){
    if(!node){
        return null;
    }
    return cm.getStyle(node, 'paddingLeft', true)
        + cm.getStyle(node, 'paddingRight', true)
        + cm.getStyle(node, 'borderLeftWidth', true)
        + cm.getStyle(node, 'borderRightWidth', true);
};

cm.getIndentY = function(node){
    if(!node){
        return null;
    }
    return cm.getStyle(node, 'paddingTop', true)
        + cm.getStyle(node, 'paddingBottom', true)
        + cm.getStyle(node, 'borderTopWidth', true)
        + cm.getStyle(node, 'borderBottomWidth', true);
};

cm.addStyles = function(node, str){
    var arr = str.replace(/\s/g, '').split(';'),
        style;

    arr.forEach(function(item){
        if(item.length > 0){
            style = item.split(':');
            // Add style to element
            style[2] = cm.styleStrToKey(style[0]);
            if(style[0] == 'float'){
                node.style[style[2][0]] = style[1];
                node.style[style[2][1]] = style[1];
            }else{
                node.style[style[2]] = style[1];
            }
        }
    });
    return node;
};

cm.getStyleObject = (function(){
    if(window.getComputedStyle){
        return function(node){
            return document.defaultView.getComputedStyle(node, null);
        };
    }else{
        return function(node){
            return node.currentStyle;
        };
    }
})();

cm.getCSSStyle = cm.getStyle = function(node, name, number){
    var obj, raw, data;
    if(cm.isNode(node)){
        obj = cm.getStyleObject(node);
    }else{
        obj = node;
    }
    if(!obj){
        return 0;
    }
    raw = obj[name];
    // Parse
    if(number){
        data = cm.styleToNumber(raw);
    }else{
        data = raw;
    }
    return data;
};

cm.getCurrentStyle = function(obj, name, dimension){
    switch(name){
        case 'width':
        case 'height':
        case 'top':
        case 'left':
            var Name = name.charAt(0).toUpperCase() + name.substr(1, name.length - 1);
            if(dimension == '%' && !obj.style[name].match(/%/)){
                var el = (/body/i.test(obj.parentNode.tagName) || /top|left/i.test(Name)) ? 'client' : 'offset';
                var pv = (/width|left/i.test(Name)) ? obj.parentNode[el + 'Width'] : obj.parentNode[el + 'Height'];
                return 100 * ( obj['offset' + Name] / pv );
            }else if(dimension == '%' && /%/.test(obj.style[name])){
                var display = obj.style.display;
                obj.style.display = 'none';
                var style = cm.getCSSStyle(obj, name, true) || 0;
                obj.style.display = display;
                return style;
            }else if(dimension == 'px' && /px/.test(obj.style[name])){
                return cm.getCSSStyle(obj, name, true) || 0;
            }
            return obj['offset' + Name];
            break;
        case 'opacity':
            if(cm.is('ie') && cm.isVersion() < 9){
                var reg = /alpha\(opacity=(.*)\)/;
                var res = reg.exec(obj.style.filter || cm.getCSSStyle(obj, 'filter'));
                return (res) ? res[1] / 100 : 1;
            }else{
                var val = parseFloat(obj.style.opacity || cm.getCSSStyle(obj, 'opacity'));
                return (!isNaN(val)) ? val : 1;
            }
            break;
        case 'color':
        case 'backgroundColor':
        case 'borderColor':
            var val = cm.getCSSStyle(obj, name);
            if(val.match(/rgb/i)){
                return val = val.match(/\d+/g), [parseInt(val[0]), parseInt(val[1]), parseInt(val[2])];
            }
            return cm.hex2rgb(val.match(/[\w\d]+/)[0]);
            break;
        case 'docScrollTop':
            return cm.getBodyScrollTop();
            break;
        case 'scrollLeft':
        case 'scrollTop':
            return obj[name];
            break;
        case 'x1':
        case 'x2':
        case 'y1':
        case 'y2':
            return parseInt(obj.getAttribute(name));
            break;
        default:
            return cm.getCSSStyle(obj, name, true) || 0;
    }
};

cm.getStyleDimension = function(value){
    var pure = value.toString().match(/\d+(\D*)/);
    return pure ? pure[1] : '';
};

cm.styleToNumber = function(data){
    data = parseFloat(data.toString().replace(/(pt|px|%)/g, ''));
    data = isNaN(data)? 0 : data;
    return data;
};

cm.hex2rgb = function(hex){
    return(function(v){
        return [v >> 16 & 255, v >> 8 & 255, v & 255];
    })(parseInt(hex, 16));
};

cm.rgb2hex = function(r, g, b){
    var rgb = [r, g, b];
    for(var i in rgb){
        rgb[i] = Number(rgb[i]).toString(16);
        if(rgb[i] == '0'){
            rgb[i] = '00';
        }else if(rgb[i].length == 1){
            rgb[i] = '0' + rgb[i];
        }
    }
    return '#' + rgb.join('');
};

cm.styleStrToKey = function(line){
    line = line.replace(/\s/g, '');
    if(line == 'float'){
        line = ['cssFloat', 'styleFloat'];
    }else if(line.match('-')){
        var st = line.split('-');
        line = st[0] + st[1].replace(st[1].charAt(0), st[1].charAt(0).toUpperCase());
    }
    return line;
};

cm.getScrollTop = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollTop();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollTop();
        }
        return node.scrollTop;
    }
    return 0;
};

cm.getScrollLeft = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollLeft();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollLeft();
        }
        return node.scrollLeft;
    }
    return 0;
};

cm.setScrollTop = function(node, num){
    if(cm.isWindow(node)){
        cm.setBodyScrollTop(num);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.setBodyScrollTop(num);
        }else{
            node.scrollTop = num;
        }
    }
    return node;
};

cm.setScrollLeft = function(node, num){
    if(cm.isWindow(node)){
        cm.setBodyScrollLeft(num);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.setBodyScrollLeft(num);
        }else{
            node.scrollLeft = num;
        }
    }
    return node;
};

cm.getScrollHeight = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollHeight();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollHeight();
        }
        return node.scrollHeight;
    }
    return 0;
};

cm.setBodyScrollTop = function(num){
    document.documentElement.scrollTop = num;
    document.body.scrollTop = num;
};

cm.setBodyScrollLeft = function(num){
    document.documentElement.scrollLeft = num;
    document.body.scrollLeft = num;
};

cm.getBodyScrollTop = function(){
    return Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop,
        0
    );
};

cm.getBodyScrollLeft = function(){
    return Math.max(
        document.documentElement.scrollLeft,
        document.body.scrollLeft,
        0
    );
};

cm.getBodyScrollHeight = function(){
    return Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        0
    );
};

cm.getSupportedStyle = function(style){
    var upper = cm.styleStrToKey(style).replace(style.charAt(0), style.charAt(0).toUpperCase()),
        styles = [
            cm.styleStrToKey(style),
            ['Webkit', upper].join(''),
            ['Moz', upper].join(''),
            ['O', upper].join(''),
            ['ms', upper].join('')
        ];
    style = false;
    cm.forEach(styles, function(item){
        if(typeof document.createElement('div').style[item] != 'undefined' && !style){
            style = item;
        }
    });
    return style;
};

cm.getTransitionDurationFromRule = function(rule){
    var openDurationRule = cm.getCSSRule(rule)[0],
        openDurationProperty;
    if(
        openDurationRule
        && (openDurationProperty = openDurationRule.style[cm.getSupportedStyle('transitionDuration')])
    ){
        return cm.parseTransitionDuration(openDurationProperty);
    }
    return 0;
};

cm.getTransitionDurationFromLESS = function(name, defaults){
    var variable = cm.getLESSVariable(name, defaults, false);
    return cm.parseTransitionDuration(variable);
};

cm.parseTransitionDuration = function(value){
    if(!cm.isEmpty(value)){
        value = value.toString();
        if(value.match('ms')){
            return parseFloat(value);
        }else if(value.match('s')){
            return (value) / 1000;
        }else{
            return parseFloat(value);
        }
    }
    return 0;
};

cm.getLESSVariable = function(name, defaults, parse){
    name = name.replace(/^@/, '');
    var variable = window.LESS && window.LESS[name] ? window.LESS[name] : defaults;
    return parse ? cm.styleToNumber(variable) : variable;
};

cm.createStyleSheet = function(){
    var style = document.createElement('style');
    // Fix for WebKit
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    return style.sheet;
};

cm.getCSSRule = function(ruleName){
    var matchedRules = [],
        cssRules;
    if(document.styleSheets){
        cm.forEach(document.styleSheets, function(styleSheet){
            if(styleSheet.cssRules){
                cssRules = styleSheet.cssRules;
            }else{
                cssRules = styleSheet.rules;
            }
            cm.forEach(cssRules, function(cssRule){
                if(cssRule.selectorText == ruleName){
                    matchedRules.push(cssRule);
                }
            });
        });
    }
    return matchedRules;
};

cm.addCSSRule = function(sheet, selector, rules, index){
    if(document.styleSheets){
        sheet = typeof sheet == 'undefined' || !sheet ? document.styleSheets[0] : sheet;
        rules = typeof rules == 'undefined' || !rules ? '' : rules;
        index = typeof index == 'undefined' || !index ? -1 : index;
        if('insertRule' in sheet){
            sheet.insertRule(selector + '{' + rules + '}', index);
        }else if('addRule' in sheet){
            sheet.addRule(selector, rules, index);
        }
    }
};

cm.removeCSSRule = function(ruleName){
    var cssRules;
    if(document.styleSheets){
        cm.forEach(document.styleSheets, function(styleSheet){
            if(styleSheet.cssRules){
                cssRules = styleSheet.cssRules;
            }else{
                cssRules = styleSheet.rules;
            }
            cm.forEachReverse(cssRules, function(cssRule, i){
                if(cssRule.selectorText == ruleName){
                    if(styleSheet.cssRules){
                        styleSheet.deleteRule(i);
                    }else{
                        styleSheet.removeRule(i);
                    }
                }
            });
        });
    }
};

cm.setCSSTranslate = (function(){
    var transform = cm.getSupportedStyle('transform');
    if(transform){
        return function(node, x, y, z, additional){
            x = typeof x != 'undefined' && x != 'auto' ? x : 0;
            y = typeof y != 'undefined' && y != 'auto' ? y : 0;
            z = typeof z != 'undefined' && z != 'auto' ? z : 0;
            additional = typeof additional != 'undefined' ? additional : '';
            node.style[transform] = ['translate3d(', x, ',', y, ',', z,')', additional].join(' ');
            return node;
        };
    }else{
        return function(node, x, y, z, additional){
            x = typeof x != 'undefined' ? x : 0;
            y = typeof y != 'undefined' ? y : 0;
            node.style.left = x;
            node.style.top = y;
            return node;
        };
    }
})();

cm.clearCSSTranslate = (function(){
    var transform = cm.getSupportedStyle('transform');
    if(transform){
        return function(node){
            node.style[transform] = '';
        }
    }else{
        return function(node){
            node.style.left = '';
            node.style.top = '';
        }
    }
})();

cm.setCSSTransitionDuration = (function(){
    var rule = cm.getSupportedStyle('transition-duration');

    return function(node, time){
        if(!rule){
            return node;
        }
        if(cm.isNumber(time)){
            time = [time, 'ms'].join('');
        }
        node.style[rule] = time;
        return node;
    };
})();

cm.inRange = function(a1, b1, a2, b2){
    return a1 >= a2 && a1 <= b2 || b1 >= a2 && b1 <= b2 || a2 >= a1 && a2 <= b1
};

cm.CSSValuesToArray = function(value){
    if(cm.isEmpty(value)){
        return [0, 0, 0, 0];
    }
    value = value.replace(/[^\d\s-]/g , '').split(/\s+/);
    cm.forEach(value, function(item, key){
        value[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    switch(value.length){
        case 0:
            value = [0, 0, 0, 0];
            break;
        case 1:
            value = [value[0], value[0], value[0], value[0]];
            break;
        case 2:
            value = [value[0], value[1], value[0], value[1]];
            break;
        case 3:
            value = [value[0], value[1], value[2], value[1]];
            break;
    }
    return value;
};

cm.arrayToCSSValues = function(a, units){
    units = typeof units != 'undefined' ? units : 'px';
    cm.forEach(a, function(item, key){
        a[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    return a.reduce(function(prev, next, index, a){
        return [prev + units, next + ((index == a.length - 1) ? units : '')].join(' ');
    });
};

cm.URLToCSSURL = function(url){
    return !cm.isEmpty(url) ? 'url("' + url + '")' : 'none';
};

/* ******* VALIDATORS ******* */

cm.keyCodeTable = {
    8  : 'delete',
    9  : 'tab',
    13 : 'enter',
    27 : 'escape',
    32 : 'space',
    35 : 'home',
    36 : 'end',
    37 : 'left',
    38 : 'top',
    39 : 'right',
    40 : 'bottom',
    46 : 'backspace'
};

cm.isKey = function(e, rules){
    var keyCode = e.keyCode;
    return cm.isKeyCode(keyCode, rules);
};

cm.isKeyCode = function(code, rules){
    var isMath = false;
    if(cm.isString(rules)){
        rules = rules.split(/\s+/);
    }
    cm.forEach(rules, function(rule){
        if(cm.keyCodeTable[code] == rule){
            isMath = true;
        }
    });
    return isMath;
};

cm.allowKeyCode = function(code, rules){
    var codes = [];
    cm.forEach(cm.keyCodeTable, function(item, key){
        if(cm.inArray(rules, item)){
            codes.push(key);
        }
    });
    return cm.inArray(codes, code.toString());
};

cm.disallowKeyCode = function(code, rules){
    var codes = [];
    cm.forEach(cm.keyCodeTable, function(item, key){
        if(!cm.inArray(rules, item)){
            codes.push(key);
        }
    });
    return cm.inArray(codes, code.toString());
};

cm.charCodeIsDigit = function(code){
    var codeString = String.fromCharCode(code);
    return /^\d$/.test(codeString);
};

cm.allowOnlyDigitInputEvent = function(input, callback){
    var value;
    cm.addEvent(input, 'input', function(e){
        value = input.value.replace(/[^\d]/g, '');
        if(input.type == 'number'){
            input.value = Math.min(parseFloat(value), parseFloat(input.max));
        }else{
            input.value = cm.reduceText(value, parseInt(input.maxlength));
        }
        callback && callback(e, input.value);
    });
    return input;
};

cm.allowOnlyNumbersInputEvent = function(input, callback){
    var value;
    cm.addEvent(input, 'input', function(e){
        value = input.value.replace(/[^\d-]/g, '');
        if(input.type == 'number'){
            input.value = Math.min(parseFloat(value), parseFloat(input.max));
        }else{
            input.value = cm.reduceText(value, parseInt(input.maxlength));
        }
        callback && callback(e, input.value);
    });
    return input;
};

/* ******* ANIMATION ******* */

var animFrame = (function(){
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback, element){
                return window.setTimeout(callback, 1000 / 60);
            };
})();

cm.Animation = function(o){
    var that = this,
        obj = o,
        processes = [],
        animationMethod = {
            'random' : function(progress){
                return (function(min, max){
                    return Math.random() * (max - min) + min;
                })(progress, 1);
            },
            'simple' : function(progress){
                return progress;
            },
            'acceleration' : function(progress){
                return Math.pow(progress, 3);
            },
            'inhibition' : function(progress){
                return 1 - animationMethod.acceleration(1 - progress);
            },
            'smooth' : function(progress){
                return (progress < 0.5) ? animationMethod.acceleration(2 * progress) / 2 : 1 - animationMethod.acceleration(2 * (1 - progress)) / 2;
            }
        };

    var setProperties = function(progress, delta, properties, duration){
        if(progress <= 1){
            properties.forEach(function(item){
                var val = item['old'] + (item['new'] - item['old']) * delta(progress);

                if(item['name'] == 'opacity'){
                    cm.setOpacity(obj, val);
                }else if(/color/i.test(item['name'])){
                    var r = parseInt((item['new'][0] - item['old'][0]) * delta(progress) + item['old'][0]);
                    var g = parseInt((item['new'][1] - item['old'][1]) * delta(progress) + item['old'][1]);
                    var b = parseInt((item['new'][2] - item['old'][2]) * delta(progress) + item['old'][2]);
                    obj.style[properties[i]['name']] = cm.rgb2hex(r, g, b);
                }else if(/scrollLeft|scrollTop/.test(item['name'])){
                    obj[item['name']] = val;
                }else if(/x1|x2|y1|y2/.test(item['name'])){
                    obj.setAttribute(item['name'], Math.round(val));
                }else if(item['name'] == 'docScrollTop'){
                    cm.setBodyScrollTop(val);
                }else{
                    obj.style[item['name']] = Math.round(val) + item['dimension'];
                }
            });
            return false;
        }
        properties.forEach(function(item){
            if(item['name'] == 'opacity'){
                cm.setOpacity(obj, item['new']);
            }else if(/color/i.test(item['name'])){
                obj.style[item['name']] = cm.rgb2hex(item['new'][0], item['new'][1], item['new'][2]);
            }else if(/scrollLeft|scrollTop/.test(item['name'])){
                obj[item['name']] = item['new'];
            }else if(/x1|x2|y1|y2/.test(item['name'])){
                obj.setAttribute(item['name'], item['new']);
            }else if(item['name'] == 'docScrollTop'){
                cm.setBodyScrollTop(item['new']);
            }else{
                obj.style[item['name']] = item['new'] + item['dimension'];
            }
        });
        return true;
    };

    var prepareEndPosition = function(name, value){
        if(name.match(/color/i)){
            if(/rgb/i.test(value)){
                var rgb = value.match(/\d+/g);
                return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
            }else{
                return cm.hex2rgb(value.match(/[\w\d]+/)[0]);
            }
        }
        return value.replace(/[^\-0-9\.]/g, '');
    };

    that.getTarget = function(){
        return obj;
    };

    that.go = function(){
        var params = arguments[0],
            args = cm.merge({
                'style' : '',
                'duration' : '',
                'anim' : 'simple',
                'onStop' : function(){}
            }, params),
            pId = 'animation_process_' + Math.random(),
            delta = animationMethod[args.anim] || animationMethod['simple'],
            properties = [],
            start = Date.now();
        for(var name in args.style){
            var value = args.style[name].toString();
            var dimension = cm.getStyleDimension(value);
            properties.push({
                'name' : name,
                'new' : prepareEndPosition(name, value),
                'dimension' : dimension,
                'old' : cm.getCurrentStyle(obj, name, dimension)
            });
        }
        for(var i in processes){
            processes[i] = false;
        }
        processes[pId] = true;
        // Run process
        (function process(){
            var processId = pId;
            if(!processes[processId]){
                delete processes[processId];
                return false;
            }
            var now = Date.now() - start;
            var progress = now / args.duration;
            if(setProperties(progress, delta, properties, args['duration'])){
                delete processes[processId];
                args.onStop && args.onStop();
            }else{
                animFrame(process);
            }
        })();
        return that;
    };

    that.stop = function(){
        for(var i in processes){
            processes[i] = false;
        }
        return that;
    };
};

cm.transition = function(node, params){
    var rule = cm.getSupportedStyle('transition'),
        transitions = [],
        dimension;

    var init = function(){
        // Merge params
        params = cm.merge({
            'properties' : {},
            'duration' : 0,
            'easing' : 'ease-in-out',
            'delayIn' : 0,
            'delayOut' : 0,
            'clear' : false,
            'onStop' : function(){}
        }, params);
        // Prepare styles
        cm.forEach(params['properties'], function(value, key){
            key = cm.styleStrToKey(key);
            transitions.push([key, params['duration'] + 'ms', params['easing']].join(' '));
        });
        transitions = transitions.join(', ');
        start();
    };

    var start = function(){
        // Prepare
        cm.forEach(params['properties'], function(value, key){
            key = cm.styleStrToKey(key);
            dimension = cm.getStyleDimension(value);
            node.style[key] = cm.getCurrentStyle(node, key, dimension) + dimension;
        });
        // Set
        setTimeout(function(){
            node.style[rule] = transitions;
            // Set new styles
            cm.forEach(params['properties'], function(value, key){
                key = cm.styleStrToKey(key);
                node.style[key] = value;
            });
        }, params['delayIn']);
        // End
        setTimeout(function(){
            node.style[rule]  = '';
            if(params['clear']){
                cm.forEach(params['properties'], function(value, key){
                    key = cm.styleStrToKey(key);
                    node.style[key] = '';
                });
            }
            params['onStop'](node);
        }, params['duration'] + params['delayIn'] + params['delayOut']);
    };

    init();
};

/* ******* COOKIE & LOCAL STORAGE ******* */

cm.storageSet = function(key, value, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        try{
            window.localStorage.setItem(key, value);
        }catch(e){
        }
    }else if(cookie){
        cm.cookieSet(key, value);
    }
};

cm.storageGet = function(key, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        return window.localStorage.getItem(key);
    }else if(cookie){
        return cm.cookieGet(key);
    }
    return null;
};

cm.storageRemove = function(key, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        localStorage.removeItem(key);
    }else if(cookie){
        cm.cookieRemove(key);
    }
};

cm.cookieSet = function(name, value, expires){
    document.cookie = encodeURI(name) + "=" + encodeURI(value) + ';' + (expires ? cm.cookieDate(expires) : '');
};

cm.cookieGet = function(name){
    var cookie = " " + document.cookie;
    var search = " " + encodeURI(name) + "=";
    var setStr = null;
    var offset = 0;
    var end = 0;
    if(cookie.length > 0){
        offset = cookie.indexOf(search);
        if(offset != -1){
            offset += search.length;
            end = cookie.indexOf(";", offset);
            if(end == -1){
                end = cookie.length;
            }
            setStr = encodeURI(cookie.substring(offset, end));
        }
    }
    return setStr;
};

cm.cookieRemove = function(name){
    var date = new Date();
    date.setDate(date.getDate() - 1);
    document.cookie = encodeURI(name) + '=;expires=' + date;
};

cm.cookieDate = function(num){
    return 'expires=' + (new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * num)).toUTCString() + ';';
};

/* ******* AJAX ******* */

cm.ajax = function(o){
    var config = cm.merge({
            'debug' : true,
            'type' : 'json',                                         // text | xml | json | jsonp
            'method' : 'post',                                       // post | get | put | delete
            'params' : '',
            'url' : '',
            'modifier' : '',
            'modifierParams' : {},
            'formData'  : false,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'X-Requested-With' : 'XMLHttpRequest'
            },
            'withCredentials' : false,
            'onStart' : function(){},
            'onEnd' : function(){},
            'onSuccess' : function(){},
            'onError' : function(){},
            'onAbort' : function(){},
            'handler' : false
        }, o),
        responseType,
        response,
        callbackName,
        callbackSuccessName,
        callbackErrorName,
        scriptNode,
        returnObject;

    var init = function(){
        validate();
        if(config['type'] == 'jsonp'){
            returnObject = {
                'abort' : abortJSONP
            };
            sendJSONP();
        }else{
            returnObject = config['httpRequestObject'];
            send();
        }
    };

    var validate = function(){
        config['httpRequestObject'] = cm.createXmlHttpRequestObject();
        config['type'] = config['type'].toLowerCase();
        responseType =  /text|json/.test(config['type']) ? 'responseText' : 'responseXML';
        config['method'] = config['method'].toLowerCase();
        // Convert params object to URI string
        if(config['params'] instanceof FormData) {
            delete config['headers']['Content-Type'];
        }else if(config['formData']){
            config['params'] = cm.obj2FormData(config['params']);
            delete config['headers']['Content-Type'];
        }else if(cm.isObject(config['params'])){
            config['params'] = cm.objectReplace(config['params'], {
                '%baseUrl%' : cm._baseUrl
            });
            config['params'] = cm.obj2URI(config['params']);
        }
        // Build request link
        if(!cm.isEmpty(config['modifier']) && !cm.isEmpty(config['modifierParams'])){
            config['modifier'] = cm.strReplace(config['modifier'], config['modifierParams']);
            config['url'] += config['modifier'];
        }else{
            delete config['modifier'];
        }
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        if(!/post|put/.test(config['method'])){
            if(!cm.isEmpty(config['params'])){
                config['url'] = [config['url'], config['params']].join('?');
            }
        }
    };

    var send = function(){
        config['httpRequestObject'].open(config['method'], config['url'], true);
        // Set Headers
        if('withCredentials' in config['httpRequestObject']){
            config['httpRequestObject'].withCredentials = config['withCredentials'];
        }
        cm.forEach(config['headers'], function(value, name){
            config['httpRequestObject'].setRequestHeader(name, value);
        });
        // Add response events
        cm.addEvent(config['httpRequestObject'], 'load', loadHandler);
        cm.addEvent(config['httpRequestObject'], 'error', errorHandler);
        cm.addEvent(config['httpRequestObject'], 'abort', abortHandler);
        // Send
        config['onStart']();
        if(/post|put/.test(config['method'])){
            config['httpRequestObject'].send(config['params']);
        }else{
            config['httpRequestObject'].send(null);
        }
    };

    var loadHandler = function(e){
        if(config['httpRequestObject'].readyState == 4){
            response = config['httpRequestObject'][responseType];
            if(config['type'] == 'json'){
                response = cm.parseJSON(response);
            }
            if(config['httpRequestObject'].status == 200){
                config['onSuccess'](response, e);
            }else{
                config['onError'](e);
            }
            deprecatedHandler(response);
            config['onEnd'](e);
        }
    };

    var successHandler = function(){
        config['onSuccess'].apply(config['onSuccess'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var errorHandler = function(){
        config['onError'].apply(config['onError'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var abortHandler = function(){
        config['onAbort'].apply(config['onAbort'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var deprecatedHandler = function(){
        if(typeof config['handler'] == 'function'){
            cm.errorLog({'type' : 'attention', 'name' : 'cm.ajax', 'message' : 'Parameter "handler" is deprecated. Use "onSuccess", "onError" or "onAbort" callbacks instead.'});
            config['handler'].apply(config['handler'], arguments);
        }
    };

    var sendJSONP = function(){
        // Generate unique callback name
        callbackName = ['cmAjaxJSONP', Date.now()].join('__');
        callbackSuccessName = [callbackName, 'Success'].join('__');
        callbackErrorName = [callbackName, 'Error'].join('__');
        // Generate events
        window[callbackSuccessName] = function(){
            successHandler.apply(successHandler, arguments);
            removeJSONP();
        };
        window[callbackErrorName] = function(){
            errorHandler.apply(errorHandler, arguments);
            removeJSONP();
        };
        // Prepare url and attach events
        scriptNode = cm.Node('script', {'type' : 'application/javascript'});
        if(/%callback%|%25callback%25/.test(config['url'])){
            config['url'] = cm.strReplace(config['url'], {
                '%callback%' : callbackSuccessName,
                '%25callback%25' : callbackSuccessName
            });
        }else{
            cm.addEvent(scriptNode, 'load', window[callbackSuccessName]);
        }
        cm.addEvent(scriptNode, 'error', window[callbackErrorName]);
        // Embed
        config['onStart']();
        scriptNode.setAttribute('src', config['url']);
        document.getElementsByTagName('head')[0].appendChild(scriptNode);
    };

    var removeJSONP = function(){
        cm.removeEvent(scriptNode, 'load', window[callbackSuccessName]);
        cm.removeEvent(scriptNode, 'error', window[callbackErrorName]);
        cm.remove(scriptNode);
        delete window[callbackSuccessName];
        delete window[callbackErrorName];
    };

    var abortJSONP = function(){
        window[callbackSuccessName] = function(){
            abortHandler();
            removeJSONP();
        };
    };

    init();
    return returnObject;
};

cm.parseJSON = function(str){
    var o;
    if(str){
        try{
            o = JSON.parse(str);
        }catch(e){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.parseJSON',
                'message' : ['Error while parsing JSON. Input string:', str].join(' ')
            });
        }
    }
    return o;
};

cm.obj2URI = function(obj, prefix){
    var str = [];
    cm.forEach(obj, function(item, key){
        var k = prefix ? prefix + "[" + key + "]" : key,
            v = item;
        str.push(typeof v == "object" ? cm.obj2URI(v, k) : k + "=" + encodeURIComponent(v));
    });
    return str.join("&");
};

cm.obj2FormData = function(o){
    var fd = new FormData();
    cm.forEach(o, function(value, key){
        fd.append(key, value);
    });
    return fd;
};

cm.formData2Obj = function(fd){
    var o = {},
        data;
    if(fd.entries && (data = fd.entries())){
        cm.forEach(data, function(item){
            o[item[0]] = item[1];
        });
    }
    return o;
};

cm.formData2URI = function(fd){
    return cm.obj2URI(cm.formData2Obj(fd));
};

cm.xml2arr = function(o){
    o = o.nodeType == 9 ? cm.firstEl(o) : o;
    if(o.nodeType == 3 || o.nodeType == 4){
        //Need to be change
        var n = cm.nextEl(o);
        if(!n){
            return o.nodeValue;
        }
        o = n;
    }
    if(o.nodeType == 1){
        var res = {};
        res[o.tagName] = {};
        var els = o.childNodes;
        for(var i = 0, ln = els.length; i < ln; i++){
            var childs = arguments.callee(els[i]);
            if(typeof(childs) == 'object'){
                for(var key in childs){
                    if(!res[o.tagName][key]){
                        res[o.tagName][key] = childs[key];
                    }else if(res[o.tagName][key]){
                        if(!res[o.tagName][key].push){
                            res[o.tagName][key] = [res[o.tagName][key], childs[key]];
                        }else{
                            res[o.tagName][key].push(childs[key]);
                        }
                    }
                }
            }else{
                res[o.tagName] = childs;
            }
        }
        res[o.tagName] = ln ? res[o.tagName] : '';
        return res;
    }
    return null;
};

cm.responseInArray = function(xmldoc){
    var response = xmldoc.getElementsByTagName('response')[0];
    var data = [];
    var els = response.childNodes;
    for(var i = 0; els.length > i; i++){
        if(els[i].nodeType != 1){
            continue;
        }
        var kids = els[i].childNodes;
        var tmp = [];
        for(var k = 0; kids.length > k; k++){
            if(kids[k].nodeType == 1){
                tmp[kids[k].tagName] = kids[k].firstChild ? kids[k].firstChild.nodeValue : '';
            }
        }
        data.push(tmp);
    }
    return data;
};

cm.createXmlHttpRequestObject = function(){
    var xmlHttp;
    try{
        xmlHttp = new XMLHttpRequest();
    }catch(e){
        var XmlHttpVersions = [
            "MSXML2.XMLHTTP.6.0",
            "MSXML2.XMLHTTP.5.0",
            "MSXML2.XMLHTTP.4.0",
            "MSXML2.XMLHTTP.3.0",
            "MSXML2.XMLHTTP",
            "Microsoft.XMLHTTP"
        ];
        cm.forEach(XmlHttpVersions, function(item){
            try{
                xmlHttp = new ActiveXObject(item);
            }catch(e){}
        });
    }
    if(!xmlHttp){
        return null;
    }
    return xmlHttp;
};

/* ******* HASH ******* */

cm.loadHashData = function(){
    var hash = document.location.hash.replace('#', '').split('&');
    window.userRequest = {};
    hash.forEach(function(item){
        window.userRequest[item.split('=')[0]] = item.split('=')[1];
    });
    return true;
};

cm.reloadHashData = function(){
    var hash = '#';
    cm.forEach(window.userRequest, function(item, key){
        hash += key + '=' + item;
    });
    document.location.hash = hash;
    return true;
};

/* ******* GRAPHICS ******* */

cm.createSvg = function(){
    var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    node.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    node.setAttribute('version', '1.1');
    return node;
};

/* ******* CLASS FABRIC ******* */

cm._defineStack = {};
cm._defineExtendStack = {};

cm.defineHelper = function(name, data, handler){
    var that = this;
    // Process config
    data = cm.merge({
        'modules' : [],
        'require' : [],
        'params' : {},
        'events' : [],
        'extend' : false
    }, data);
    // Create class extend object
    that.build = {
        'constructor' : handler,
        '_raw' : cm.clone(data),
        '_update' : {},
        '_name' : {
            'full' : name,
            'short' : name.replace('.', ''),
            'split' : name.split('.')
        },
        '_className' : name,
        '_constructor' : handler,
        '_modules' : {},
        'params' : data['params']
    };
    // Inheritance
    if(data['extend']){
        cm.getConstructor(data['extend'], function(classConstructor, className){
            handler.prototype = Object.create(classConstructor.prototype);
            that.build._inheritName = className;
            that.build._inherit = classConstructor;
            // Merge modules
            that.build._raw['modules'] = cm.merge(that.build._inherit.prototype._raw['modules'], that.build._raw['modules']);
            // Add to extend stack
            if(cm._defineExtendStack[className]){
                cm._defineExtendStack[className].push(name);
            }
        });
    }
    // Extend class by predefine modules
    cm.forEach(Mod, function(module, name){
        if(module._config && module._config['predefine']){
            Mod['Extend']._extend.call(that, name, module);
        }
    });
    // Extend class by class specific modules
    cm.forEach(that.build._raw['modules'], function(module){
        if(Mod[module]){
            Mod['Extend']._extend.call(that, module, Mod[module]);
        }
    });
    // Prototype class methods
    cm.forEach(that.build, function(value, key){
        handler.prototype[key] = value;
    });
    // Add to stack
    if(!cm._defineExtendStack[name]){
        cm._defineExtendStack[name] = [];
    }
    cm._defineStack[name] = handler;
    // Extend Window object
    cm.objectSelector(name, window, handler);
};

cm.define = (function(){
    var definer = Function.prototype.call.bind(cm.defineHelper, arguments);
    return function(){
        definer.apply(cm.defineHelper, arguments);
    };
})();

cm.getConstructor = function(className, callback){
    var classConstructor;
    callback = typeof callback != 'undefined' ? callback : function(){};
    if(!className || className == '*'){
        cm.forEach(cm._defineStack, function(classConstructor){
            callback(classConstructor, className, classConstructor.prototype);
        });
        return cm._defineStack;
    }else{
        classConstructor = cm._defineStack[className];
        if(!classConstructor){
            if(cm._debug){
                cm.errorLog({
                    'type' : 'attention',
                    'name' : 'cm.getConstructor',
                    'message' : ['Class', cm.strWrap(className, '"'), 'does not exists or define.'].join(' ')
                });
            }
            return false;
        }else{
            callback(classConstructor, className, classConstructor.prototype);
            return classConstructor;
        }
    }
};

cm.find = function(className, name, parentNode, callback, params){
    var items = [],
        processed = {};
    // Config
    callback = typeof callback == 'function' ? callback : function(){};
    params = cm.merge({
        'childs' : false
    }, params);
    // Process
    if(!className || className == '*'){
        cm.forEach(cm._defineStack, function(classConstructor){
            if(classConstructor.prototype.findInStack){
                items = cm.extend(items, classConstructor.prototype.findInStack(name, parentNode, callback));
            }
        });
    }else{
        var classConstructor = cm._defineStack[className];
        if(!classConstructor){
            cm.errorLog({
                'type' : 'error',
                'name' : 'cm.find',
                'message' : ['Class', cm.strWrap(className, '"'), 'does not exist.'].join(' ')
            });
        }else if(!classConstructor.prototype.findInStack){
            cm.errorLog({
                'type' : 'error',
                'name' : 'cm.find',
                'message' : ['Class', cm.strWrap(className, '"'), 'does not support Module Stack.'].join(' ')
            });
        }else{
            // Find instances of current constructor
            items = cm.extend(items, classConstructor.prototype.findInStack(name, parentNode, callback));
            // Find child instances, and stack processed parent classes to avoid infinity loops
            if(params['childs'] && cm._defineExtendStack[className] && !processed[className]){
                processed[className] = true;
                cm.forEach(cm._defineExtendStack[className], function(childName){
                    items = cm.extend(items, cm.find(childName, name, parentNode, callback, params));
                });
            }
        }
    }
    return items;
};

cm.Finder = function(className, name, parentNode, callback, params){
    var that = this,
        isEventBind = false;

    var init = function(){
        var finder;
        // Merge params
        parentNode = parentNode || document.body;
        callback = typeof callback == 'function' ? callback : function(){};
        params = cm.merge({
            'event' : 'onRender',
            'multiple' : false,
            'childs' : false
        }, params);
        // Search in constructed classes
        finder = cm.find(className, name, parentNode, callback);
        // Bind event when no one constructed class found
        if(!finder || !finder.length || params['multiple']){
            isEventBind = true;
            cm.getConstructor(className, function(classConstructor){
                classConstructor.prototype.addEvent(params['event'], watcher);
            });
        }
    };

    var watcher = function(classObject){
        classObject.removeEvent(params['event'], watcher);
        var isSame = classObject.isAppropriateToStack(name, parentNode, callback);
        if(isSame && !params['multiple'] && isEventBind){
            that.remove(classObject._constructor);
        }
    };

    that.remove = function(classConstructor){
        if(classConstructor){
            classConstructor.prototype.removeEvent(params['event'], watcher);
        }else{
            cm.getConstructor(className, function(classConstructor){
                classConstructor.prototype.removeEvent(params['event'], watcher);
            });
        }
        return that;
    };

    init();
};
/* ******* EXTEND ******* */

Mod['Extend'] = {
    '_config' : {
        'extend' : true,
        'predefine' : true
    },
    '_construct' : function(){
        var that = this;
    },
    '_extend' : function(name, o){
        var that = this;
        if(!that.build._modules[name]){
            // Merge Config
            o._config = cm.merge({
                'extend' : false,
                'predefine' : false,
                'require' : []
            }, o._config);
            // Check Requires
            cm.forEach(o._config['require'], function(module){
                if(Mod[module]){
                    Mod['Extend']._extend.call(that, module, Mod[module]);
                }
            });
            // Extend class by module's methods
            if(o._config['extend']){
                cm.forEach(o, function(item, key){
                    if(!/^(_)/.test(key)){
                        that.build[key] = item;
                    }
                });
            }
            // Construct module
            if(typeof o._construct == 'function'){
                // Construct
                o._construct.call(that);
            }else{
                cm.errorLog({
                    'type' : 'error',
                    'name' : that.build._name['full'],
                    'message' : ['Module', cm.strWrap(name, '"'), 'does not have "_construct" method.'].join(' ')
                });
            }
            // Add into stack of class's modules
            that.build._modules[name] = o;
        }
    },
    'extend' : function(name, o){
        var that = this;
        if(!o){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Trying to extend the class by non-existing module.'
            });
        }else if(!name){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Module should have a name.'
            });
        }else if(that._modules[name]){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : ['Module with name', cm.strWrap(name, '"'), 'already constructed.'].join(' ')
            });
        }else{
            // Merge Config
            o._config = cm.merge({
                'extend' : false,
                'predefine' : false,
                'require' : []
            }, o._config);
            // Check Requires
            cm.forEach(o._config['require'], function(module){
                if(Mod[module]){
                    Mod['Extend']._extend.call(that, module, Mod[module]);
                }
            });
            // Extend class by module's methods
            if(o._config['extend']){
                cm.forEach(o, function(item, key){
                    if(!/^(_)/.test(key)){
                        cm._defineStack[that._name['full']].prototype[key] = item;
                    }
                });
            }
            // Construct module
            if(typeof o._construct == 'function'){
                // Construct
                o._construct.call(that);
            }else{
                cm.errorLog({
                    'type' : 'error',
                    'name' : that._name['full'],
                    'message' : ['Module', cm.strWrap(name, '"'), 'does not have "_construct" method.'].join(' ')
                });
            }
            // Add into stack of class's modules
            that._modules[name] = o;
        }
    }
};

/* ******* COMPONENTS ******* */

Mod['Component'] = {
    '_config' : {
        'extend' : true,
        'predefine' : true
    },
    '_construct' : function(){
        var that = this;
        that.build._isComponent = true;
        if(typeof that.build['params']['consoleLogErrors'] == 'undefined'){
            that.build['params']['consoleLogErrors'] = true;
        }
    },
    'cloneComponent' : function(params){
        var that = this,
            component;
        cm.getConstructor(that._name['full'], function(classConstructor){
            component = new classConstructor(
                cm.merge(that.params, params)
            );
        });
        return component;
    }
};

/* ******* PARAMS ******* */

Mod['Params'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']){
            that.build['params'] = {};
        }
        if(!that.build._update['params']){
            that.build._update['params'] = {};
        }
        if(that.build._inherit){
            that.build['params'] = cm.merge(that.build._inherit.prototype['params'], that.build['params']);
        }
    },
    'setParams' : function(params, replace){
        var that = this;
        replace = typeof replace == 'undefined'? false : replace;
        that.params = cm.merge(replace ? that._raw.params : that.params, params);
        that._update = cm.clone(that._update);
        that._update.params = cm.merge(that._update.params, that.params);
        // Validate params
        cm.forEach(that.params, function(item, key){
            switch(item){
                case 'document.window':
                    that.params[key] = window;
                    break;

                case 'document.html':
                    if(cm.getDocumentHtml()){
                        that.params[key] = cm.getDocumentHtml();
                    }
                    break;

                case 'document.body':
                    if(document.body){
                        that.params[key] = document.body;
                    }
                    break;

                case 'top.document.body':
                    if(window.top.document.body){
                        that.params[key] = window.top.document.body;
                    }
                    break;

                case 'document.head':
                    if(cm.getDocumentHead()){
                        that.params[key] = cm.getDocumentHead();
                    }
                    break;

                default:
                    if(/cm._config./i.test(item)){
                        that.params[key] = cm._config[item.replace('cm._config.', '')];
                    }
                    break;
            }
        });
        return that;
    },
    'getParams' : function(){
        var that = this;
        return that.params;
    }
};

/* ******* EVENTS ******* */

Mod['Events'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        that.build['events'] = {};
        cm.forEach(that.build._raw['events'], function(item){
            that.build['events'][item] = [];
        });
        if(!that.build['params']['events']){
            that.build['params']['events'] = {};
        }
        if(that.build._inherit){
            that.build['params']['events'] = cm.merge(that.build._inherit.prototype['params']['events'], that.build['params']['events']);
            that.build['events'] = cm.merge(that.build._inherit.prototype['events'], that.build['events']);
        }
    },
    'addEvent' : function(event, handler){
        var that = this;
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(typeof handler == 'function'){
                that.events[event].push(handler);
            }else{
                cm.errorLog({
                    'name' : that._name['full'],
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'addEvents' : function(o){
        var that = this;
        if(o){
            that.convertEvents(o);
        }
        return that;
    },
    'removeEvent' : function(event, handler){
        var that = this;
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(typeof handler == 'function'){
                that.events[event] = that.events[event].filter(function(item){
                    return item != handler;
                });
            }else{
                cm.errorLog({
                    'name' : that._name['full'],
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'triggerEvent' : function(event, params){
        var that = this;
        if(that.events[event]){
            cm.forEach(that.events[event], function(item){
                item(that, params);
            });
        }else{
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'hasEvent' : function(event){
        var that = this;
        return !!that.events[event];
    },
    'convertEvents' : function(o){
        var that = this;
        cm.forEach(o, function(item, key){
            that.addEvent(key, item);
        });
        return that;
    }
};

/* ******* LANGS ******* */

Mod['Langs'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['langs']){
            that.build['params']['langs'] = {};
        }
        if(!that.build._update['params']['langs']){
            that.build._update['params']['langs'] = {};
        }
        if(that.build._inherit){
            that.build['params']['langs'] = cm.merge(
                that.build._inherit.prototype['params']['langs'],
                that.build['params']['langs']
            );
        }
    },
    'lang' : function(str, vars){
        var that = this,
            langStr;
        if(typeof str == 'undefined'){
            return that.params['langs'];
        }
        if(!str || cm.isEmpty(str)){
            return '';
        }
        // Get language string from path
        langStr = cm.objectPath(str, that.params['langs']);
        // Process variables
        if(typeof langStr == 'undefined'){
            langStr = str;
        }else if(cm.isEmpty(langStr)){
            langStr = '';
        }else{
            langStr = cm.strReplace(langStr, vars);
        }
        return langStr;
    },
    'updateLangs' : function(){
        var that = this;
        if(cm.isFunction(that)){
            that.prototype.params['langs'] = cm.merge(that.prototype._raw.params['langs'], that.prototype._update.params['langs']);
            if(that.prototype._inherit){
                that.prototype._inherit.prototype.updateLangs.call(that.prototype._inherit);
                that.prototype.params['langs'] = cm.merge(that.prototype._inherit.prototype.params['langs'], that.prototype.params['langs']);
            }
        }else{
            that.params['langs'] = cm.merge(that._raw.params['langs'], that._update.params['langs']);
            if(that._inherit){
                that._inherit.prototype.updateLangs.call(that._inherit);
                that.params['langs'] = cm.merge(that._inherit.prototype.params['langs'], that.params['langs']);
            }
        }
        return that;
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            if(cm.isFunction(that)){
                that.prototype.updateLangs.call(that.prototype);
                that.prototype.params['langs'] = cm.merge(that.prototype.params['langs'], o);
                that.prototype._update.params['langs'] = cm.merge(that.prototype._update.params['langs'], o);
            }else{
                that.updateLangs();
                that.params['langs'] = cm.merge(that.params['langs'], o);
                that._update = cm.clone(that._update);
                that._update.params['langs'] = cm.merge(that._update.params['langs'], o);
            }
        }
        return that;
    }
};

Mod['__Langs__'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['langs']){
            that.build['params']['langs'] = {};
        }
        if(!that.build._update['params']['langs']){
            that.build._update['params']['langs'] = {};
        }
        if(that.build._inherit){
            that.build['params']['langs'] = cm.merge(
                that.build._inherit.prototype['params']['langs'],
                that.build['params']['langs']
            );
        }
    },
    'lang' : function(str, vars){
        var that = this,
            langStr;
        if(typeof str == 'undefined'){
            return that.params['langs'];
        }
        if(!str || cm.isEmpty(str)){
            return '';
        }
        // Get language string from path
        langStr = cm.objectPath(str, that.params['langs']);
        // Process variables
        if(typeof langStr == 'undefined'){

            langStr = str;
        }else if(cm.isEmpty(langStr)){
            langStr = '';
        }else{
            langStr = cm.strReplace(langStr, vars);
        }
        return langStr;
    },
    'updateLangs' : function(){
        var that = this;
        if(cm.isFunction(that)){
            that.prototype.params['langs'] = cm.merge(that.prototype._raw.params['langs'], that.prototype._update.params['langs']);
            if(that.prototype._inherit){
                that.prototype._inherit.prototype.updateLangs.call(that.prototype._inherit);
                that.prototype.params['langs'] = cm.merge(that.prototype._inherit.prototype.params['langs'], that.prototype.params['langs']);
            }
        }else{
            that.params['langs'] = cm.merge(that._raw.params['langs'], that._update.params['langs']);
            if(that._inherit){
                that._inherit.prototype.updateLangs.call(that._inherit);
                that.params['langs'] = cm.merge(that._inherit.prototype.params['langs'], that.params['langs']);
            }
        }
        return that;
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            if(cm.isFunction(that)){
                that.prototype.updateLangs.call(that.prototype);
                that.prototype.params['langs'] = cm.merge(that.prototype.params['langs'], o);
                that.prototype._update.params['langs'] = cm.merge(that.prototype._update.params['langs'], o);
            }else{
                that.updateLangs();
                that.params['langs'] = cm.merge(that.params['langs'], o);
                that._update = cm.clone(that._update);
                that._update.params['langs'] = cm.merge(that._update.params['langs'], o);
            }
        }
        return that;
    }
};

/* ******* DATA CONFIG ******* */

Mod['DataConfig'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['configDataMarker'] == 'undefined'){
            that.build['params']['configDataMarker'] = 'data-config';
        }
    },
    'getDataConfig' : function(container, dataMarker){
        var that = this,
            sourceConfig;
        if(cm.isNode(container)){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = container.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = cm.parseJSON(sourceConfig))){
                that.setParams(sourceConfig);
            }
        }
        return that;
    },
    'getNodeDataConfig' : function(node, dataMarker){
        var that = this,
            sourceConfig;
        if(cm.isNode(node)){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = node.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = cm.parseJSON(sourceConfig))){
                return sourceConfig;
            }
        }
        return {};
    }
};

/* ******* DATA NODES ******* */

Mod['DataNodes'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['nodes']){
            that.build['params']['nodes'] = {};
        }
        that.build['params']['nodesDataMarker'] = 'data-node';
        that.build['params']['nodesMarker'] = that.build._name['short'];
        if(!that.build['nodes']){
            that.build['nodes'] = {};
        }
        if(that.build._inherit){
            that.build['params']['nodes'] = cm.merge(that.build._inherit.prototype['params']['nodes'], that.build['params']['nodes']);
            that.build['nodes'] = cm.merge(that.build._inherit.prototype['nodes'], that.build['nodes']);
        }
    },
    'getDataNodes' : function(container, dataMarker, className){
        var that = this,
            sourceNodes = {};
        container = typeof container == 'undefined'? document.body : container;
        if(container){
            dataMarker = typeof dataMarker == 'undefined'? that.params['nodesDataMarker'] : dataMarker;
            className = typeof className == 'undefined'? that.params['nodesMarker'] : className;
            if(className){
                sourceNodes = cm.getNodes(container, dataMarker)[className] || {};
            }else{
                sourceNodes = cm.getNodes(container, dataMarker);
            }
            that.nodes = cm.merge(that.nodes, sourceNodes);
        }
        that.nodes = cm.merge(that.nodes, that.params['nodes']);
        return that;
    },
    'getDataNodesObject' : function(container, dataMarker, className){
        var that = this,
            sourceNodes = {};
        container = typeof container == 'undefined'? document.body : container;
        dataMarker = typeof dataMarker == 'undefined'? that.params['nodesDataMarker'] : dataMarker;
        className = typeof className == 'undefined'? that.params['nodesMarker'] : className;
        if(className){
            sourceNodes = cm.getNodes(container, dataMarker)[className] || {};
        }else{
            sourceNodes = cm.getNodes(container, dataMarker);
        }
        return sourceNodes;
    }
};

/* ******* LOCAL STORAGE ******* */

Mod['Storage'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['name']){
            that.build['params']['name'] = '';
        }
    },
    'storageRead' : function(key){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return null;
        }
        if(!storage[that.params['name']] || typeof storage[that.params['name']][key] == 'undefined'){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set in component with name', cm.strWrap(that.params['name'], '"'), '.'].join(' ')
            });
            return null;
        }
        return storage[that.params['name']][key];
    },
    'storageReadAll' : function(){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : 'Storage is empty.'
            });
            return {};
        }
        return storage[that.params['name']];
    },
    'storageWrite' : function(key, value){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            storage[that.params['name']] = {};
        }
        storage[that.params['name']][key] = value;
        cm.storageSet(that._name['full'], JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageWriteAll' : function(data){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        storage[that.params['name']] = data;
        cm.storageSet(that._name['full'], JSON.stringify(storage));
        return storage[that.params['name']];
    }
};

/* ******* CALLBACKS ******* */

Mod['Callbacks'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['callbacks']){
            that.build['params']['callbacks'] = {};
        }
        that.build['callbacks'] = {};
        that.build['_callbacks'] = {};
    },
    'callbacksProcess' : function(){
        var that = this;
        that.callbacks = cm.clone(that.callbacks);
        // Save default callbacks
        cm.forEach(that.callbacks, function(callback, name){
            that._callbacks[name] = callback;
        });
        // Replace callbacks
        cm.forEach(that.params['callbacks'], function(callback, name){
            that.callbacks[name] = callback;
        });
        return that;
    },
    'callbacksRestore' : function(){
        var that = this;
        that.callbacks = cm.clone(that.callbacks);
        cm.forEach(that._callbacks, function(callback, name){
            that.callbacks[name] = callback;
        });
        return that;
    }
};

/* ******* STACK ******* */

Mod['Stack'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['name']){
            that.build['params']['name'] = '';
        }
        that.build['_stack'] = [];
    },
    'addToStack' : function(node){
        var that = this;
        if(!that._stackItem){
            that._stackItem = {
                'name' : that.params['name'],
                'node' : node,
                'class' : that,
                'className' : that._name['full']
            };
            that._stack.push(that._stackItem);
        }else if(cm.isNode(node)){
            that._stackItem['node'] = node;
        }
        return that;
    },
    'removeFromStack' : function(){
        var that = this;
        cm.arrayRemove(that._stack, that._stackItem);
        that._stackItem = null;
        return that;
    },
    'isAppropriateToStack' : function(name, parent, callback){
        var that = this,
            item = that._stackItem;
        if((cm.isEmpty(name) || item['name'] == name) && cm.isParent(parent, item['node'], true)){
            callback(item['class'], item, name);
            return true;
        }
        return false;
    },
    'findInStack' : function(name, parent, callback){
        var that = this,
            items = [];
        callback = typeof callback == 'function' ? callback : function(){};
        cm.forEach(that._stack, function(item){
            if((cm.isEmpty(name) || item['name'] == name) && (cm.isEmpty(parent) || cm.isParent(parent, item['node'], true))){
                items.push(item);
                callback(item['class'], item, name);
            }
        });
        return items;
    },
    'getStackNode' : function(){
        var that = this;
        return that._stackItem['node'];
    }
};

/* ****** STRUCTURE ******* */

Mod['Structure'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['renderStructure'] == 'undefined'){
            that.build['params']['renderStructure'] = true;
        }
        if(typeof that.build['params']['embedStructure'] == 'undefined'){
            that.build['params']['embedStructure'] = 'append';
        }
    },
    'embedStructure' : function(node){
        var that = this;
        switch(that.params['embedStructure']){
            case 'replace':
                that.replaceStructure(node);
                break;
            case 'append':
                that.appendStructure(node, 'insertLast');
                break;
            case 'first':
                that.appendStructure(node, 'insertFirst');
                break;
        }
        return that;
    },
    'appendStructure' : function(node, type){
        var that = this;
        var container = that.params['container'] || that.params['node'];
        container && cm[type](node, container);
        return that;
    },
    'replaceStructure' : function(node){
        var that = this;
        if(that.params['container']){
            if(that.params['container'] === that.params['node']){
                cm.insertBefore(node, that.params['node']);
            }else{
                that.params['container'].appendChild(node);
            }
        }else if(that.params['node'].parentNode){
            cm.insertBefore(node, that.params['node']);
        }
        cm.remove(that.params['node']);
        return that;
    }
};

/* ******* CONTROLLER ******* */

Mod['Controller'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['removeOnDestruct'] == 'undefined'){
            that.build['params']['removeOnDestruct'] = true;
        }
        if(that.build['params']['customEvents'] !== false){
            that.build['params']['customEvents'] = cm.merge({
                'destruct' : true,
                'redraw' : true,
                'refresh' : true,
                'resume' : true,
                'suspend' : true
            }, that.build['params']['customEvents']);
        }
        if(that.build['params']['triggerCustomEvents'] !== false){
            that.build['params']['triggerCustomEvents'] = cm.merge({
                'destruct' : true,
                'redraw' : true,
                'refresh' : true,
                'resume' : true,
                'suspend' : true
            }, that.build['params']['triggerCustomEvents']);
        }
        that.build._isConstructed = false;
        that.build._isDestructed = false;
        that.build._isSuspended = false;
    },
    'construct' : function(){
        var that = this;
        var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
        if(!that._isConstructed){
            that._isConstructed = true;
            that._isDestructed = false;
            that._isSuspended = false;
            if(that.params['customEvents']){
                if(that.params['customEvents'] === true){
                    cm.customEvent.add(node, 'destruct', that.destruct);
                    cm.customEvent.add(node, 'redraw', that.redraw);
                    cm.customEvent.add(node, 'refresh', that.refresh);
                    cm.customEvent.add(node, 'resume', that.resume);
                    cm.customEvent.add(node, 'suspend', that.suspend);
                }else{
                    cm.forEach(that.params['customEvents'], function(bool, key){
                        bool && cm.customEvent.add(node, 'destruct', that[key]);
                    });
                }
            }
            that.constructHook(node);
        }
        return that;
    },
    'destruct' : function(){
        var that = this;
        if(that._isConstructed && !that._isDestructed){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isConstructed = false;
            that._isDestructed = true;
            that.destructHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['destruct'])){
                cm.customEvent.trigger(node, 'destruct', {
                    'type' : 'child',
                    'self' : false
                });
            }
            if(that.params['customEvents']){
                if(that.params['customEvents'] === true){
                    cm.customEvent.remove(node, 'destruct', that.destruct);
                    cm.customEvent.remove(node, 'redraw', that.redraw);
                    cm.customEvent.remove(node, 'refresh', that.refresh);
                    cm.customEvent.remove(node, 'resume', that.resume);
                    cm.customEvent.remove(node, 'suspend', that.suspend);
                }else{
                    cm.forEach(that.params['customEvents'], function(bool, key){
                        bool && cm.customEvent.remove(node, 'destruct', that[key]);
                    });
                }
            }
            that._modules['Stack'] && that.removeFromStack();
            that.params['removeOnDestruct'] && cm.remove(node);
        }
        return that;
    },
    'resume' : function(){
        var that = this;
        if(that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isSuspended = false;
            that.resumeHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['resume'])){
                cm.customEvent.trigger(node, 'resume', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'suspend' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isSuspended = true;
            that.suspendHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['suspend'])){
                cm.customEvent.trigger(node, 'suspend', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'refresh' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that.refreshHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['refresh'])){
                cm.customEvent.trigger(node, 'refresh', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'redraw' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that.redrawHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['redraw'])){
                cm.customEvent.trigger(node, 'redraw', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'constructHook' : function(node){
        var that = this;
        return that;
    },
    'destructHook' : function(node){
        var that = this;
        return that;
    },
    'resumeHook' : function(node){
        var that = this;
        return that;
    },
    'suspendHook' : function(node){
        var that = this;
        return that;
    },
    'refreshHook' : function(node){
        var that = this;
        return that;
    },
    'redrawHook' : function(node){
        var that = this;
        return that;
    }
};
Part['Menu'] = (function(){
    var processedNodes = [],
        pageSize;

    var checkPosition = function(item){
        pageSize = cm.getPageSize();
        var dropWidth = item['drop'].offsetWidth,
            parentLeft = cm.getX(item['node']),
            parentWidth = item['node'].parentNode && cm.isClass(item['node'].parentNode, 'pt__menu-dropdown') ? item['node'].parentNode.offsetWidth : 0;
        if(dropWidth + parentWidth + parentLeft >= pageSize['winWidth']){
            cm.replaceClass(item['drop'], 'pull-left', 'pull-right');
        }else{
            cm.replaceClass(item['drop'], 'pull-right', 'pull-left');
        }
    };

    var checkPositionHandler = function(e, item){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(item['drop'], target, true)){
            checkPosition(item);
        }
    };

    var clickHandler = function(e, item){
        if(cm._pageSize['winWidth'] > cm._config.adaptiveFrom && !item['_show']){
            item['_interval'] && clearTimeout(item['_interval']);
            item['_interval'] = setTimeout(function(){
                item['_show'] = false;
            }, 500);
            item['_show'] = true;
            var target = cm.getEventTarget(e);
            if(!cm.isParent(item['drop'], target, true)){
                if(cm.isClass(item['node'], 'is-show')){
                    cm.removeClass(item['node'], 'is-show');
                }else{
                    cm.preventDefault(e);
                    cm.addClass(item['node'], 'is-show');
                }
            }
        }
    };

    var cancelHandler = function(e, item){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(item['node'], target, true)){
            cm.removeClass(item['node'], 'is-show');
        }
    };

    var setEvents = function(item){
        cm.addEvent(item['node'], 'pointerenter', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'touchenter', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'mouseover', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'pointerdown', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(item['node'], 'touchstart', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(item['node'], 'mousedown', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(document.body, 'pointerdown', function(e){
            cancelHandler(e, item);
        });
        cm.addEvent(document.body, 'touchstart', function(e){
            cancelHandler(e, item);
        });
        cm.addEvent(document.body, 'mousedown', function(e){
            cancelHandler(e, item);
        });
        checkPosition(item);
    };

    return function(container){
        container = typeof container == 'undefined'? document.body : container;
        var menus = cm.getByClass('pt__menu', container),
            items = [],
            item;
        cm.forEach(menus, function(node){
            if(!cm.inArray(processedNodes, node)){
                item = {
                    'node' : node,
                    'drop' : cm.getByClass('pt__menu-dropdown', node)[0]
                };
                if(item['drop']){
                    setEvents(item);
                }
                items.push(item);
                processedNodes.push(node);
            }
        });
        cm.addEvent(window, 'resize', function(){
            cm.forEach(items, function(item){
                checkPosition(item);
            });
        });
    };
})();

Part['Autoresize'] = (function(){
    var processedNodes = [],
        nodes;

    var process = function(node){
        if(!cm.inArray(processedNodes, node)){
            if(cm.isNode(node) && node.tagName.toLowerCase() == 'textarea'){
                var resizeInt,
                    rows,
                    oldRows,
                    matches,
                    lineHeight = cm.getStyle(node, 'lineHeight', true),
                    padding = cm.getStyle(node, 'paddingTop', true)
                        + cm.getStyle(node, 'paddingBottom', true)
                        + cm.getStyle(node, 'borderTopWidth', true)
                        + cm.getStyle(node, 'borderBottomWidth', true);
                cm.addEvent(node, 'scroll', function(){
                    node.scrollTop = 0;
                });
                resizeInt = setInterval(function(){
                    if(!node || !cm.inDOM(node)){
                        clearInterval(resizeInt);
                    }
                    oldRows = rows;
                    matches = node.value.match(/\n/g);
                    rows = matches? matches.length : 0;
                    if(rows !== oldRows){
                        node.style.height = [(rows + 1) * lineHeight + padding, 'px'].join('');
                    }
                }, 5);
            }
            processedNodes.push(node);
        }
    };

    return function(container){
        container = typeof container == 'undefined'? document.body : container;
        nodes = cm.getByClass('cm-autoresize', container);
        cm.forEach(nodes, process);
    };
})();
cm.init = function(){
    var init = function(){
        checkBrowser();
        checkType();
        checkScrollSize();
        checkPageSize();
        // Events
        cm.addEvent(window, 'mousemove', getClientPosition);
        cm.addEvent(window, 'resize', resizeAction);
        setInterval(checkAction, 50);
        //cm.addEvent(window, 'scroll', disableHover);
    };

    // Actions

    var checkAction = function(){
        animFrame(function(){
            checkScrollSize();
            checkPageSize();
        });
    };

    var resizeAction = function(){
        animFrame(function(){
            checkType();
            checkScrollSize();
            checkPageSize();
        });
    };

    // Set browser class

    var checkBrowser = function(){
        if(typeof Com.UA != 'undefined'){
            Com.UA.setBrowserClass();
        }
    };

    // Get device type

    var checkType = (function(){
        var html = cm.getDocumentHtml(),
            sizes,
            width,
            height;

        return function(){
            sizes = cm.getPageSize();
            width = sizes['winWidth'];
            height = sizes['winHeight'];

            cm.removeClass(html, ['is', cm._deviceType].join('-'));
            cm.removeClass(html, ['is', cm._deviceOrientation].join('-'));

            cm._deviceOrientation = width < height? 'portrait' : 'landscape';
            if(width > cm._config['screenTablet']){
                cm._deviceType = 'desktop';
            }
            if(width <= cm._config['screenTablet'] && width > cm._config['screenMobile']){
                cm._deviceType = 'tablet';
            }
            if(width <= cm._config['screenMobile']){
                cm._deviceType = 'mobile';
            }

            cm.addClass(html, ['is', cm._deviceType].join('-'));
            cm.addClass(html, ['is', cm._deviceOrientation].join('-'));
        };
    })();

    // Get device scroll bar size

    var checkScrollSize = (function(){
        var size;
        return function(){
            cm._scrollSize = cm.getScrollBarSize();
            if(size != cm._scrollSize){
                size = cm._scrollSize;
                cm.customEvent.trigger(window, 'scrollSizeChange', {
                    'type' : 'all',
                    'self' : true,
                    'scrollSize' : cm._scrollSize
                });
            }
        };
    })();

    var checkPageSize = (function(){
        var size, sizeNew;
        return function(){
            cm._pageSize = cm.getPageSize();
            sizeNew = JSON.stringify(cm._pageSize);
            if(size != sizeNew){
                size = sizeNew;
                cm.customEvent.trigger(window, 'pageSizeChange', {
                    'type' : 'all',
                    'self' : true,
                    'pageSize' : cm._pageSize
                });
            }
        };
    })();

    // Disable hover on scroll

    var disableHover = (function(){
        var body = document.body,
            timer;

        return function(){
            timer && clearTimeout(timer);
            if(!cm.hasClass(body, 'disable-hover')){
                cm.addClass(body, 'disable-hover');
            }
            timer = setTimeout(function(){
                cm.removeClass(body, 'disable-hover');
            }, 100);
        };
    })();

    // Get client cursor position

    var getClientPosition = function(e){
        cm._clientPosition = cm.getEventClientPosition(e);
    };

    init();
};

cm.onReady(cm.init, false);
cm.define('Com.AbstractController', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onConstructStart',
        'onConstructProcess',
        'onConstructEnd',
        'onInitComponentsStart',
        'onInitComponentsEnd',
        'onGetLESSVariablesStart',
        'onGetLESSVariablesProcess',
        'onGetLESSVariablesEnd',
        'onValidateParamsStart',
        'onValidateParamsProcess',
        'onValidateParamsEnd',
        'onRenderStart',
        'onRender',
        'onDestructStart',
        'onDestructProcess',
        'onDestructEnd',
        'onRedraw',
        'onSetEventsStart',
        'onSetEventsProcess',
        'onSetEventsEnd',
        'onUnsetEventsStart',
        'onUnsetEventsProcess',
        'onUnsetEventsEnd',
        'onSetCustomEvents',
        'onUnsetCustomEvents',
        'onRenderViewStart',
        'onRenderViewProcess',
        'onRenderViewEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'getDataNodes' : true,
        'getDataConfig' : true,
        'embedStructure' : 'append',
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'customEvents' : true,
        'removeOnDestruct' : false,
        'className' : '',
        'collector' : null,
        'constructCollector' : false,
        'destructCollector' : false
    }
},
function(params){
    var that = this;
    that.isDestructed = false;
    that.nodes = {};
    that.components = {};
    that.construct(params);
});

cm.getConstructor('Com.AbstractController', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        // Bind context to methods
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.constructCollectorHandler = that.constructCollector.bind(that);
        that.destructCollectorHandler = that.destructCollector.bind(that);
        // Configure class
        that.triggerEvent('onConstructStart');
        that.initComponents();
        that.getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.params['getDataNodes'] && that.getDataNodes(that.params['node']);
        that.params['getDataConfig'] && that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.setEvents();
        that.triggerEvent('onConstructProcess');
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.triggerEvent('onDestructStart');
            that.isDestructed = true;
            that.triggerEvent('onDestructProcess');
            cm.customEvent.trigger(that.getStackNode(), 'destruct', {
                'type' : 'child',
                'self' : false
            });
            that.unsetEvents();
            that.params['removeOnDestruct'] && cm.remove(that.getStackNode());
            that.removeFromStack();
            that.triggerEvent('onDestructEnd');
        }
        return that;
    };

    classProto.redraw = function(){
        var that = this;
        animFrame(function(){
            that.triggerEvent('onRedraw');
        });
        return that;
    };

    classProto.initComponents = function(){
        var that = this;
        that.triggerEvent('onInitComponentsStart');
        that.triggerEvent('onInitComponentsEnd');
        return that;
    };

    classProto.getLESSVariables = function(){
        var that = this;
        that.triggerEvent('onGetLESSVariablesStart');
        that.triggerEvent('onGetLESSVariablesProcess');
        that.triggerEvent('onGetLESSVariablesEnd');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsProcess');
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.params['renderStructure'] && that.renderView();
        that.renderViewModel();
        that.setAttributes();
        // Append
        that.params['embedStructureOnRender'] && that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__abstract'});
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        cm.addClass(that.nodes['container'], that.params['className']);
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        that.triggerEvent('onSetEventsStart');
        // Windows events
        cm.addEvent(window, 'resize', that.redrawHandler);
        that.triggerEvent('onSetEventsProcess');
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.getStackNode(), 'redraw', that.redrawHandler);
            cm.customEvent.add(that.getStackNode(), 'destruct', that.destructHandler);
            that.triggerEvent('onSetCustomEvents');
        }
        that.triggerEvent('onSetEventsEnd');
        return that;
    };

    classProto.unsetEvents = function(){
        var that = this;
        that.triggerEvent('onUnsetEventsStart');
        // Windows events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        that.triggerEvent('onUnsetEventsProcess');
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.getStackNode(), 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.getStackNode(), 'destruct', that.destructHandler);
            that.triggerEvent('onUnsetCustomEvents');
        }
        that.triggerEvent('onUnsetEventsEnd');
        return that;
    };

    classProto.constructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].construct(that.getStackNode());
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.construct(that.getStackNode());
                });
            }
        }
        return that;
    };

    classProto.destructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].destruct(that.getStackNode());
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.destruct(that.getStackNode());
                });
            }
        }
        return that;
    };
});
cm.define('Com.AbstractContainer', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onOpen',
        'onClose',
        'onRenderControllerStart',
        'onRenderControllerProcess',
        'onRenderControllerEnd',
        'onRenderPlaceholderStart',
        'onRenderPlaceholderProcess',
        'onRenderPlaceholderEnd',
        'onRenderPlaceholderViewStart',
        'onRenderPlaceholderViewProcess',
        'onRenderPlaceholderViewEnd'
    ],
    'params' : {
        'embedStructure' : 'none',
        'constructor' : null,
        'params' : {},
        'placeholder' : false,
        'placeholderConstructor' : null,
        'placeholderParams' : {},
        'destructOnClose' : true,
        'openOnConstruct' : false,
        'langs' : {
            'title' : 'Container',
            'close' : 'Close',
            'save' : 'Save'
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.destructProcessHandler = that.destructProcess.bind(that);
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.afterOpenControllerHandler = that.afterOpenController.bind(that);
        that.afterCloseControllerHandler = that.afterCloseController.bind(that);
        that.afterOpenPlaceholderHandler = that.afterOpenPlaceholder.bind(that);
        that.afterClosePlaceholderHandler = that.afterClosePlaceholder.bind(that);
        // Add events
        that.addEvent('onDestructProcess', that.destructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.open = function(e){
        e && cm.preventDefault(e);
        var that = this;
        if(that.params['placeholder']){
            that.openPlaceholder();
        }else{
            that.openController();
        }
        return that;
    };

    classProto.close = function(e){
        e && cm.preventDefault(e);
        var that = this;
        if(that.params['placeholder']){
            that.closePlaceholder();
        }else{
            that.closeController();
        }
        return that;
    };

    classProto.getController = function(){
        var that = this;
        return that.components['controller'];
    };

    classProto.getPlaceholder = function(){
        var that = this;
        return that.components['placeholder'];
    };

    classProto.destructProcess = function(){
        var that = this;
        that.destructPlaceholder();
        that.destructController();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsProcess');
        that.params['params']['node'] = that.params['node'];
        that.params['params']['container'] = that.params['container'];
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Add Event
        if(that.nodes['button']){
            cm.addEvent(that.nodes['button'], 'click', that.openHandler);
        }else{
            cm.addEvent(that.params['node'], 'click', that.openHandler);
        }
        // Open on construct
        that.params['openOnConstruct'] && that.open();
        return that;
    };

    /* *** CONTROLLER *** */

    classProto.renderController = function(){
        var that = this;
        cm.getConstructor(that.params['constructor'], function(classObject){
            that.triggerEvent('onRenderControllerStart', arguments);
            // Construct
            that.renderControllerView();
            that.components['controller'] = that.constructController(classObject);
            // Events
            that.triggerEvent('onRenderControllerProcess', that.components['controller']);
            that.renderControllerEvents();
            that.triggerEvent('onRenderControllerEnd', that.components['controller']);
        });
        return that;
    };

    classProto.renderControllerView = function(){
        var that = this;
        return that;
    };

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'container' : that.params['placeholder'] ? that.nodes['placeholder']['content'] : that.params['container'],
                'content' : that.params['params']['content'] || that.params['content']
            })
        );
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpen', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onClose', that.afterCloseControllerHandler);
        return that;
    };

    classProto.destructController = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].destruct && that.components['controller'].destruct();
        return that;
    };

    classProto.openController = function(){
        var that = this;
        if(!that.components['controller'] || that.components['controller'].isDestructed){
            that.renderController();
        }
        if(that.components['controller'] && that.components['controller'].open){
            that.components['controller'].open();
        }else{
            that.afterOpenController();
        }
        return that;
    };

    classProto.closeController = function(){
        var that = this;
        if(that.components['controller'] && that.components['controller'].close){
            that.components['controller'].close();
        }else{
            that.afterCloseController();
        }
        return that;
    };

    classProto.afterOpenController = function(){
        var that = this;
        that.triggerEvent('onOpen', that.components['controller']);
        return that;
    };

    classProto.afterCloseController = function(){
        var that = this;
        if(that.params['destructOnClose']){
            that.destructController();
        }
        that.triggerEvent('onClose', that.components['controller']);
        return that;
    };

    /* *** PLACEHOLDER *** */

    classProto.renderPlaceholder = function(){
        var that = this;
        cm.getConstructor(that.params['placeholderConstructor'], function(classObject){
            that.triggerEvent('onRenderPlaceholderStart', arguments);
            // Construct
            that.renderPlaceholderView();
            that.components['placeholder'] = that.constructPlaceholder(classObject);
            that.renderPlaceholderButtons();
            // Events
            that.triggerEvent('onRenderPlaceholderProcess', that.components['placeholder']);
            that.renderPlaceholderEvents();
            that.triggerEvent('onRenderPlaceholderEnd', that.components['placeholder']);
        });
        return that;
    };

    classProto.constructPlaceholder = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['placeholderParams'], {
                'content' : that.nodes['placeholder']
            })
        );
    };

    classProto.renderPlaceholderView = function(){
        var that = this;
        that.triggerEvent('onRenderPlaceholderViewStart');
        // Structure
        that.nodes['placeholder'] = {};
        that.nodes['placeholder']['title'] = cm.textNode(that.lang('title'));
        that.nodes['placeholder']['content'] = cm.node('div', {'class' : 'com__container__content'});
        // Events
        that.triggerEvent('onRenderPlaceholderViewProcess');
        that.triggerEvent('onRenderPlaceholderViewEnd');
        return that;
    };

    classProto.renderPlaceholderButtons = function(){
        var that = this;
        that.components['placeholder'].addButton({
            'name' : 'close',
            'label' : that.lang('close'),
            'style' : 'button-primary',
            'callback' : that.closeHandler
        });
        return that;
    };

    classProto.renderPlaceholderEvents = function(){
        var that = this;
        that.components['placeholder'].addEvent('onOpen', that.afterOpenPlaceholderHandler);
        that.components['placeholder'].addEvent('onClose', that.afterClosePlaceholderHandler);
        return that;
    };

    classProto.destructPlaceholder = function(){
        var that = this;
        that.components['placeholder'] && that.components['placeholder'].destruct && that.components['placeholder'].destruct();
        return that;
    };

    classProto.openPlaceholder = function(){
        var that = this;
        if(!that.components['placeholder'] || that.components['placeholder'].isDestructed){
            that.renderPlaceholder();
        }
        if(that.components['placeholder'] && that.components['placeholder'].open){
            that.components['placeholder'].open();
        }else{
            that.afterOpenPlaceholder();
        }
        return that;
    };

    classProto.closePlaceholder = function(){
        var that = this;
        if(that.components['placeholder'] && that.components['placeholder'].close){
            that.components['placeholder'].close();
        }else{
            that.afterClosePlaceholder();
        }
        return that;
    };

    classProto.afterOpenPlaceholder = function(){
        var that = this;
        that.openController();
        that.constructCollector();
        that.triggerEvent('onOpen', that.components['placeholder']);
        return that;
    };

    classProto.afterClosePlaceholder = function(){
        var that = this;
        that.closeController();
        if(that.params['destructOnClose']){
            that.destructPlaceholder();
            that.destructCollector();
        }
        that.triggerEvent('onClose', that.components['placeholder']);
        return that;
    };
});
cm.define('Com.AbstractInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onDisable',
        'onEnable',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'value' : '',
        'defaultValue' : '',
        'title' : '',
        'placeholder' : '',
        'disabled' : false,
        'className' : '',
        'ui' : true,
        'size' : 'full',                // default | full
        'justify' : 'left',
        'maxlength' : 0,                // 0 - infinity
        'setHiddenInput' : true
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.previousValue = null;
        that.value = null;
        that.disabled = false;
        // Bind context to methods
        that.setHandler = that.set.bind(that);
        that.getHandler = that.get.bind(that);
        that.clearHandler = that.clear.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        that.clearEventHandler = that.clearEvent.bind(that);
        that.setActionHandler = that.setAction.bind(that);
        that.selectActionHandler = that.selectAction.bind(that);
        that.constructProcessHandler = that.constructProcess.bind(that);
        // Add events
        that.addEvent('onConstructProcess', that.constructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        value = that.validateValue(value);
        that.selectAction(value, triggerEvents);
        that.setAction(value, triggerEvents);
        that.changeAction(triggerEvents);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.value;
    };

    classProto.clear = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onClear');
        that.set(that.params['defaultValue'], triggerEvents);
        return that;
    };

    classProto.enable = function(){
        var that = this;
        if(!that.disabled){
            that.disabled = false;
            cm.removeClass(that.nodes['container'], 'disabled');
            cm.removeClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        if(that.disabled){
            that.disabled = true;
            cm.addClass(that.nodes['container'], 'disabled');
            cm.addClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onDisable');
        }
        return that;
    };

    classProto.clearEvent = function(e){
        var that = this;
        cm.preventDefault(e);
        that.clear();
        return that;
    };

    classProto.validateParams = function(){
        var that = this,
            value;
        that.triggerEvent('onValidateParamsStart');
        // Get parameters from provided input
        if(cm.isNode(that.params['node'])){
            // In WebKit and Blink engines js value is cutoff, use DOM value instead.
            value = that.params['node'].getAttribute('value');
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['value'] = !cm.isEmpty(value) ?  value : that.params['value'];
            that.params['maxlength'] = that.params['node'].getAttribute('maxlength') || that.params['maxlength'];
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
        }
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
        that.disabled = that.params['disabled'];
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.constructProcess = function(){
        var that = this;
        that.set(that.params['value'], false);
        return that;
    };

    /* *** VIEW - VIEW MODEL *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            that.nodes['content'] = that.renderContent()
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        var node = cm.node('div', {'class' : 'input__content'});
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        return node;
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Data attributes
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-(?!node|element|config)/.test(item.name)){
                that.nodes['hidden'].setAttribute(item.name, item.value);
                that.nodes['container'].setAttribute(item.name, item.value);
            }
        });
        if(that.params['title']){
            that.nodes['container'].setAttribute('title', that.lang(that.params['title']));
        }
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Classes
        if(!cm.isEmpty(that.params['size'])){
            cm.addClass(that.nodes['container'], ['size', that.params['size']].join('-'));
        }
        if(!cm.isEmpty(that.params['justify'])){
            cm.addClass(that.nodes['container'], ['pull', that.params['justify']].join('-'));
        }
        return that;
    };

    /* *** DATA VALUE *** */

    classProto.validateValue = function(value){
        return value;
    };

    classProto.saveValue = function(value){
        var that = this;
        that.previousValue = that.value;
        that.value = value;
        if(that.params['setHiddenInput']){
            that.nodes['hidden'].value = value;
        }
        return that;
    };

    classProto.setData = function(){
        var that = this;
        return that;
    };

    /* *** ACTIONS *** */

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onSelect', value);
        return that;
    };

    classProto.setAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.saveValue(value);
        that.setData();
        triggerEvents && that.triggerEvent('onSet', that.value);
        return that;
    };

    classProto.changeAction = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(triggerEvents && that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
        return that;
    };
});
cm.define('Com.AbstractFileManager', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect',
        'onComplete',
        'onGet',
        'onRenderHolderStart',
        'onRenderHolderProcess',
        'onRenderHolderEnd',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'showStats' : true,
        'max' : 0,                                                        // 0 - infinity
        'lazy' : false,
        'fullSize' : false,
        'Com.FileStats' : {
            'embedStructure' : 'append',
            'toggleBox' : false,
            'inline' : true
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.items = [];
    that.isMultiple = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.completeHandler = that.complete.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        return that;
    };

    classProto.get = function(){
        var that = this;
        that.triggerEvent('onGet', that.items);
        return that;
    };

    classProto.load = function(){
        var that = this;
        if(!that.isLoaded){
            that.renderController();
        }
        return that;
    };

    classProto.complete = function(){
        var that = this;
        that.triggerEvent('onComplete', that.items);
        return that
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-manager'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.renderHolder(),
                that.renderContent()
            )
        );
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderHolder = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderHolderStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__holder is-hidden'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        // Events
        that.triggerEvent('onRenderHolderProcess');
        that.nodes['holder'] = nodes;
        that.triggerEvent('onRenderHolderEnd');
        return nodes['container'];
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__content is-hidden'});
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentEnd');
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        if(that.params['showStats']){
            cm.getConstructor('Com.FileStats', function(classObject, className){
                cm.removeClass(that.nodes['content']['container'], 'is-hidden');
                that.components['stats'] = new classObject(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['content']['container']
                    })
                );
            });
        }
        if(!that.params['lazy']){
            that.renderController();
        }
        return that;
    };

    classProto.renderController = function(){
        var that = this;
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Attributes
        that.params['fullSize'] && cm.addClass(that.nodes['container'], 'is-fullsize');
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.processFiles = function(data){
        var that = this,
            files = [],
            max;
        if(cm.isArray(data)){
            files = data.map(function(file){
                return that.convertFile(file);
            });
        }else if(cm.isObject(data)){
            files.push(that.convertFile(data));
        }
        if(!that.params['max']){
            that.items = files;
        }else if(files.length){
            max = Math.min(that.params['max'], files.length);
            that.items = files.slice(0, max);
        }else{
            that.items = [];
        }
        that.triggerEvent('onSelect', that.items);
        return that;
    };

    classProto.convertFile = function(data){
        return data;
    };
});
cm.define('Com.AbstractFileManagerContainer', {
    'extend' : 'Com.AbstractContainer',
    'events' : [
        'onComplete',
        'onGet'
    ],
    'params' : {
        'constructor' : 'Com.AbstractFileManager',
        'params' : {
            'embedStructure' : 'append'
        },
        'placeholder' : true,
        'placeholderConstructor' : 'Com.DialogContainer',
        'placeholderParams' : {
            'renderButtons' : true,
            'params' : {
                'width' : 900
            }
        },
        'langs' : {
            'title_single' : 'Please select file',
            'title_multiple' : 'Please select files',
            'close' : 'Cancel',
            'save' : 'Select'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFileManagerContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.renderControllerProcessHandler = that.renderControllerProcess.bind(that);
        that.getHandler = that.get.bind(that);
        that.selectHandler = that.select.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onRenderControllerProcess', that.renderControllerProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].get && that.components['controller'].get();
        return that;
    };

    classProto.complete = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].complete && that.components['controller'].complete();
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            'title' : !that.params['params']['max'] || that.params['params']['max'] > 1 ? that.lang('title_multiple') : that.lang('title_single')
        });
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.renderControllerEvents.apply(that, arguments);
        // Add specific events
        that.components['controller'].addEvent('onGet', function(my, data){
            that.afterGet(data);
        });
        that.components['controller'].addEvent('onComplete', function(my, data){
            that.afterComplete(data);
        });
        return that;
    };

    classProto.renderPlaceholderButtons = function(){
        var that = this;
        that.components['placeholder'].addButton({
            'name' : 'close',
            'label' : that.lang('close'),
            'style' : 'button-transparent',
            'callback' : that.closeHandler
        });
        that.components['placeholder'].addButton({
            'name' : 'save',
            'label' : that.lang('save'),
            'style' : 'button-primary',
            'callback' : that.completeHandler
        });
        return that;
    };

    /* *** AFTER EVENTS *** */

    classProto.afterGet = function(data){
        var that = this;
        that.triggerEvent('onGet', data);
        return that;
    };

    classProto.afterComplete = function(data){
        var that = this;
        that.triggerEvent('onComplete', data);
        that.close();
        return that;
    };
});
cm.define('Com.AbstractRange', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'isInput' : true,
        'content' : null,
        'drag' : null,
        'className' : '',
        'theme' : 'theme--arrows',
        'min' : 0,
        'max' : 100,
        'value' : 0,
        'direction' : 'horizontal',
        'showCounter' : true,
        'customEvents' : true,
        'Com.Draggable' : {}
    }
},
function(params){
    var that = this;
    that.isDestructed = false;
    that.previousValue = null;
    that.value = null;
    that.nodes = {};
    that.components = {};
    that.construct(params);
});

cm.getConstructor('Com.AbstractRange', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.set(that.params['value'], false);
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        value = that.validateValue(value);
        that.setCounter(value);
        that.setDraggable();
        that.selectAction(value, triggerEvents);
        that.setAction(value, triggerEvents);
        that.changeAction(triggerEvents);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.value;
    };

    classProto.redraw = function(){
        var that = this;
        that.setDraggable();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        if(that.params['isInput'] && cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['value'] = that.params['node'].getAttribute('value') || that.params['value'];
        }
        that.params['Com.Draggable']['direction'] = that.params['direction'];
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Draggable
        cm.getConstructor('Com.Draggable', function(classConstructor, className){
            that.components['draggable'] = new classConstructor(
                cm.merge(that.params[className], {
                    'target' : that.nodes['inner'],
                    'node' : that.nodes['drag'],
                    'limiter' : that.nodes['inner'],
                    'events' : {
                        'onStart' : function(){
                            switch(that.params['direction']){
                                case 'horizontal':
                                    cm.addClass(document.body, 'cm__cursor--col-resize');
                                    break;

                                case 'vertical':
                                    cm.addClass(document.body, 'cm__cursor--row-resize');
                                    break;
                            }
                            that.showCounter();
                        },
                        'onStop' : function(){
                            switch(that.params['direction']){
                                case 'horizontal':
                                    cm.removeClass(document.body, 'cm__cursor--col-resize');
                                    break;

                                case 'vertical':
                                    cm.removeClass(document.body, 'cm__cursor--row-resize');
                                    break;
                            }
                            that.hideCounter();
                        },
                        'onSelect' : function(my, data){
                            var value = that.getRangeValue(data);
                            value = that.validateValue(value);
                            that.setCounter(value);
                            that.selectAction(value);
                        },
                        'onSet' : function(my, data){
                            var value = that.getRangeValue(data);
                            value = that.validateValue(value);
                            that.setCounter(value);
                            that.setAction(value);
                            that.changeAction();
                        }
                    }
                })
            );
        });
        // Events
        that.setEvents();
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        // Windows events
        cm.addEvent(window, 'resize', that.redrawHandler);
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.add(that.nodes['container'], 'destruct', that.destructHandler);
        }
        return that;
    };

    classProto.unsetEvents = function(){
        var that = this;
        // Windows events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes['container'], 'destruct', that.destructHandler);
        }
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__range'},
            that.nodes['range'] = cm.node('div', {'class' : 'pt__range'},
                that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                    that.nodes['drag'] = cm.node('div', {'class' : 'drag'},
                        that.nodes['dragContent'] = that.renderDraggable()
                    ),
                    that.nodes['range'] = cm.node('div', {'class' : 'range'},
                        that.nodes['rangeContent'] = that.renderContent()
                    )
                )
            )
        );
        // Counter
        that.nodes['counter'] = that.renderCounter();
        if(that.params['showCounter']){
            cm.insertFirst(that.nodes['counter'], that.nodes['drag']);
        }
        // Hidden input
        that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'});
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        if(that.params['isInput']){
            cm.insertFirst(that.nodes['hidden'], that.nodes['container']);
        }
        // Classes
        if(that.params['isInput']){
            cm.addClass(that.nodes['container'], 'is-input');
            cm.addClass(that.nodes['range'], 'is-input');
        }
        cm.addClass(that.nodes['container'], that.params['theme']);
        cm.addClass(that.nodes['range'], that.params['theme']);
        cm.addClass(that.nodes['container'], that.params['className']);
        cm.addClass(that.nodes['rangeContent'], 'range-helper');
        // Direction classes
        switch(that.params['direction']){
            case 'horizontal':
                cm.addClass(that.nodes['container'], 'is-horizontal');
                cm.addClass(that.nodes['range'], 'is-horizontal');
                cm.addClass(that.nodes['dragContent'], 'is-horizontal');
                cm.addClass(that.nodes['rangeContent'], 'is-horizontal');
                break;

            case 'vertical':
                cm.addClass(that.nodes['container'], 'is-vertical');
                cm.addClass(that.nodes['range'], 'is-vertical');
                cm.addClass(that.nodes['dragContent'], 'is-vertical');
                cm.addClass(that.nodes['rangeContent'], 'is-vertical');
                break;
        }
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        return that.params['content'] || cm.node('div', {'class' : 'range__content'});
    };

    classProto.renderDraggable = function(){
        var that = this;
        return that.params['drag'] || cm.node('div', {'class' : 'drag__content'});
    };

    classProto.renderCounter = function(){
        var that = this;
        return that.params['counter'] || cm.node('div', {'class' : 'counter'});
    };

    classProto.showCounter = function(){
        var that = this;
        cm.addClass(that.nodes['counter'], 'is-show');
        return that;
    };

    classProto.hideCounter = function(){
        var that = this;
        cm.removeClass(that.nodes['counter'], 'is-show');
        return that;
    };

    classProto.getRangeValue = function(data){
        var that = this,
            dimensions = that.components['draggable'].getDimensions(),
            xn = that.params['max'] - that.params['min'],
            yn,
            zn,
            value;
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['limiter']['absoluteWidth'];
                zn = (xn / yn) * data['left'];
                value = Math.floor(zn) + that.params['min'];
                break;

            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (xn / yn) * data['top'];
                value = Math.floor(zn) + that.params['min'];
                break;
        }
        return value;
    };

    classProto.setDraggable = function(){
        var that = this,
            dimensions = that.components['draggable'].getDimensions(),
            value = that.value - that.params['min'],
            xn = that.params['max'] - that.params['min'],
            yn,
            zn,
            position = {
                'top' : 0,
                'left' : 0
            };
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['limiter']['absoluteWidth'];
                zn = (yn / xn) * value;
                position['left'] = Math.floor(zn);
                break;

            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (yn / xn ) * value;
                position['top'] = Math.floor(zn);
                break;
        }
        that.components['draggable'].setPosition(position, false);
        return that;
    };

    classProto.setCounter = function(value){
        var that = this;
        that.nodes['counter'].innerHTML = value;
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        if(that.params['max'] > that.params['min']){
            value = Math.min(Math.max(value, that.params['min']), that.params['max']);
        }else{
            value = Math.max(Math.min(value, that.params['min']), that.params['max']);
        }
        return value;
    };

    classProto.setHelper = function(value, eventName){
        var that = this;
        value = that.validateValue(value);
        that.setCounter(value);
        // Trigger Events
        that.triggerEvent(eventName, value);
        if(eventName == 'onSelect'){
            that.selectAction(value);
            that.changeAction();
        }
        return that;
    };

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(triggerEvents){
            that.triggerEvent('onSelect', value);
        }
        return that;
    };

    classProto.setAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = value;
        that.nodes['hidden'].value = that.value;
        if(triggerEvents){
            that.triggerEvent('onSet', that.value);
        }
        return that;
    };

    classProto.changeAction = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(triggerEvents && that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
        return that;
    };
});
cm.define('Com.Form', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : true,
        'embedStructure' : 'append',
        'renderButtons' : true,
        'renderButtonsSeparator' : true,
        'buttonsAlign' : 'right',
        'showLoader' : true,
        'loaderCoverage' : 'fields',                                // fields, all
        'loaderDelay' : 'cm._config.loadDelay',
        'showNotifications' : true,
        'responseErrorsKey': 'errors',
        'data' : {},
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'formData' : true,
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %callback% for JSONP.
        },
        'Com.Notifications' : {},
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.fields = {};
    that.buttons = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['buttonsAlign'] = cm.inArray(['left', 'center', 'right', 'justify'], that.params['buttonsAlign']) ? that.params['buttonsAlign'] : 'right';
        that.params['loaderCoverage'] = cm.inArray(['fields', 'all'], that.params['loaderCoverage']) ? that.params['loaderCoverage'] : 'all';
    };

    var render = function(){
        var overlayContainer;
        // Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__form'},
                that.nodes['fieldsContainer'] = cm.node('div', {'class' : 'com__form__fields'},
                    that.nodes['fields'] = cm.node('div', {'class' : 'inner'})
                )
            );
            // Notifications
            that.nodes['notifications'] = cm.node('div', {'class' : 'com__form__notifications'});
            // Buttons
            that.nodes['buttonsSeparator'] = cm.node('hr');
            that.nodes['buttonsContainer'] = cm.node('div', {'class' : 'com__form__buttons'},
                that.nodes['buttons'] = cm.node('div', {'class' : 'btn-wrap'})
            );
            cm.addClass(that.nodes['buttons'], ['pull', that.params['buttonsAlign']].join('-'));
            // Embed
            that.params['renderButtonsSeparator'] && cm.insertFirst(that.nodes['buttonsSeparator'], that.nodes['buttonsContainer']);
            that.params['renderButtons'] && cm.appendChild(that.nodes['buttonsContainer'], that.nodes['container']);
            that.params['showNotifications'] && cm.insertFirst(that.nodes['notifications'], that.nodes['container']);
            that.embedStructure(that.nodes['container']);
        }
        // Notifications
        if(that.params['showNotifications']){
            cm.getConstructor('Com.Notifications', function(classConstructor, className){
                that.components['notifications'] = new classConstructor(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['notifications']
                    })
                );
                that.components['notifications'].addEvent('onAdd', function(my){
                    cm.addClass(that.nodes['notifications'], 'is-show', true);
                });
                that.components['notifications'].addEvent('onRemove', function(my){
                    if(that.components['notifications'].getLength() === 0){
                        cm.removeClass(that.nodes['notifications'], 'is-show', true);
                    }
                });
            });
        }
        // Overlay Loader
        if(that.params['showLoader']){
            cm.getConstructor('Com.Overlay', function(classConstructor, className){
                switch(that.params['loaderCoverage']){
                    case 'fields':
                        overlayContainer = that.nodes['fieldsContainer'];
                        break;
                    case 'all':
                    default:
                        overlayContainer = that.nodes['container'];
                        break;
                }
                that.components['loader'] = new classConstructor(
                    cm.merge(that.params[className], {
                        'container' : overlayContainer
                    })
                );
            });
        }
    };

    var renderField = function(type, params){
        var field, controller;
        // Merge params
        params = cm.merge({
            'name' : '',
            'label' : '',
            'options' : [],
            'container' : that.nodes['fields'],
            'form' : that
        }, params);
        field = Com.FormFields.get(type);
        params = cm.merge(cm.clone(field, true), params);
        // Get value
        params['value'] = that.params['data'][params['name']];
        params['dataValue'] = that.params['data'][params['dataName']];
        // Render
        if(field && !that.fields[params['name']]){
            cm.getConstructor('Com.FormField', function(classConstructor){
                controller = new classConstructor(params);
                if(params['field']){
                    that.fields[params['name']] = controller;
                }
            });
        }
    };

    var renderButton = function(params){
        params = cm.merge({
            'name' : '',
            'label' : '',
            'class' : '',
            'action' : 'submit',          // submit | reset | clear | custom
            'handler' : function(){}
        }, params);
        // Render
        if(!that.buttons[params['name']]){
            params['node'] = cm.node('button', {'name' : params['name']}, params['label']);
            switch(params['action']){
                case 'submit':
                    params['node'].type = 'submit';
                    cm.addClass(params['node'], 'button-primary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(that.isProcess){
                            that.abort();
                        }else{
                            that.send();
                        }
                    });
                    break;

                case 'reset':
                    params['node'].type = 'reset';
                    cm.addClass(params['node'], 'button-secondary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(!that.isProcess){
                            that.reset();
                        }
                    });
                    break;

                case 'clear':
                    cm.addClass(params['node'], 'button-secondary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(!that.isProcess){
                            that.clear();
                        }
                    });
                    break;

                case 'custom':
                default:
                    cm.addClass(params['node'], params['class']);
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        cm.isFunction(params['handler']) && params['handler'](that, params, e);
                    });
                    break;
            }
            cm.appendChild(params['node'], that.nodes['buttons']);
        }
    };

    var renderSeparator = function(){
        var node = cm.node('hr');
        cm.appendChild(node, that.nodes['fields']);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl
        });
        // Get Params
        config['params'] = cm.merge(config['params'], that.getAll());
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that, config);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that, config);
                }
            })
        );
    };

    that.callbacks.start = function(that, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onSendEnd');
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            var errors = cm.objectSelector(that.params['responseErrorsKey'], response);
            if(!cm.isEmpty(errors)){
                that.callbacks.error(that, config, errors);
            }else{
                that.callbacks.success(that, response);
            }
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config, message){
        that.callbacks.renderError(that, config, message);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderError = function(that, config, errors){
        var field;
        // Clear old errors messages
        if(that.params['showNotifications']){
            cm.removeClass(that.nodes['notifications'], 'is-show', true);
            that.components['notifications'].clear();
        }
        cm.forEach(that.fields, function(field){
            field.clearError();
        });
        // Render new errors messages
        if(cm.isArray(errors)){
            cm.forEach(errors, function(item){
                if(that.params['showNotifications']){
                    cm.addClass(that.nodes['notifications'], 'is-show', true);
                    that.components['notifications'].add({
                        'label' : that.lang(item['message']),
                        'type' : 'danger'
                    });
                }
                if(field = that.getField(item['field'])){
                    field.renderError(item['message']);
                }
            });
        }else{
            if(that.params['showNotifications']){
                cm.addClass(that.nodes['notifications'], 'is-show', true);
                that.components['notifications'].add({
                    'label' : that.lang('server_error'),
                    'type' : 'danger'
                });
            }
        }
    };

    /* ******* PUBLIC ******* */

    that.destruct = function(){
        if(!that._isDestructed){
            that._isDestructed = true;
            cm.forEach(that.fields, function(field){
                field.destruct();
            });
            that.removeFromStack();
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.add = function(type, params){
        renderField(type, params);
        return that;
    };

    that.addButton = function(o){
        renderButton(o);
        return that;
    };

    that.addButtons = function(o){
        if(cm.isArray(o)){
            cm.forEach(o, function(item){
                renderButton(item);
            });
        }
        return that;
    };

    that.addSeparator = function(){
        renderSeparator();
        return that;
    };

    that.appendChild = function(node){
        cm.appendChild(node, that.nodes['fields']);
        return that;
    };

    that.getField = function(name){
        return that.fields[name];
    };

    that.getAll = function(){
        var o = {},
            value;
        cm.forEach(that.fields, function(field, name){
            value = field.get();
            if(value !== null){
                o[name] = value;
            }
        });
        return o;
    };

    that.getButtonsContainer = function(){
        return that.nodes['buttonsContainer'];
    };

    that.clear = function(){
        cm.forEach(that.fields, function(field){
            field.destruct();
        });
        that.fields = {};
        cm.clearNode(that.nodes['fields']);
        cm.forEach(that.buttons, function(button){
            cm.remove(button.node);
        });
        that.buttons = {};
        cm.clearNode(that.nodes['buttons']);
        return that;
    };

    that.reset = function(){
        cm.removeClass(that.nodes['notificationsContainer'], 'is-show');
        cm.forEach(that.fields, function(field){
            field.reset();
        });
        return that;
    };

    that.send = function(){
        that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.setAction = function(o, mode, update){
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['ajax'] = cm.merge(that._raw.params['ajax'], o);
                break;
            case 'current':
                that.params['ajax'] = cm.merge(that.params['ajax'], o);
                break;
            case 'update':
                that.params['ajax'] = cm.merge(that._update.params['ajax'], o);
                break;
        }
        if(update){
            that._update.params['ajax'] = cm.clone(that.params['ajax']);
        }
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD ******* */

Com.FormFields = (function(){
    var stack = {};

    return {
        'add' : function(type, params){
            stack[type] = cm.merge({
                'node' : cm.node('div'),
                'type' : type,
                'field' : true
            }, params);
        },
        'get' : function(type){
            return stack[type]? cm.clone(stack[type], true) : null;
        }
    };
})();

cm.define('Com.FormField', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack',
        'Callbacks'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : cm.node('div'),
        'form' : false,
        'name' : '',
        'value' : null,
        'dataValue' : null,
        'type' : false,
        'label' : '',
        'help' : null,
        'placeholder' : '',
        'visible' : true,
        'options' : [],
        'className' : '',                   // is-box
        'constructor' : false,
        'constructorParams' : {
            'formData' : true
        },
        'Com.HelpBubble' : {
            'renderStructure' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.form = null;
    that.controller = null;
    that.value = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params['constructor']){
            cm.getConstructor(that.params['constructor'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
        that.params['constructorParams']['node'] = that.params['node'];
        that.params['constructorParams']['name'] = that.params['name'];
        that.params['constructorParams']['options'] = that.params['options'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.form = that.params['form'];
    };

    var render = function(){
        // Render structure
        that.nodes = that.callbacks.render(that) || {};
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        // Construct
        that.callbacks.construct(that);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.construct = function(that){
        that.controller = that.callbacks.controller(that, that.params['constructorParams']);
    };

    that.callbacks.controller = function(that, params){
        if(that.params['constructor']){
            return new that.params['constructor'](params);
        }
    };

    that.callbacks.render = function(that){
        var nodes = {};
        // Structure
        nodes['container'] = cm.node('dl', {'class' : 'pt__field'},
            nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        !that.params['visible'] && cm.addClass(nodes['container'], 'is-hidden');
        // Style
        cm.addClass(nodes['container'], that.params['className']);
        // Attributes
        if(!cm.isEmpty(that.params['name'])){
            that.params['node'].setAttribute('name', that.params['name']);
        }
        if(!cm.isEmpty(that.params['value'])){
            that.params['node'].setAttribute('value', that.params['value']);
        }
        if(!cm.isEmpty(that.params['dataValue'])){
            that.params['node'].setAttribute('data-value', JSON.stringify(that.params['dataValue']));
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.params['node'].setAttribute('placeholder', that.params['placeholder']);
        }
        if(!cm.isEmpty(that.params['help'])){
            cm.getConstructor('Com.HelpBubble', function(classConstructor){
                that.components['help'] = new classConstructor(
                    cm.merge(that.params['Com.HelpBubble'], {
                        'container' : nodes['label']
                    })
                );
            });
        }
        return nodes;
    };

    that.callbacks.clearError = function(that){
        cm.removeClass(that.nodes['container'], 'error');
        cm.remove(that.nodes['errors']);
    };

    that.callbacks.renderError = function(that, message){
        that.callbacks.clearError(that);
        cm.addClass(that.nodes['container'], 'error');
        that.nodes['errors'] = cm.node('ul', {'class' : 'pt__field__hint'},
            cm.node('li', {'class' : 'error'}, message)
        );
        cm.appendChild(that.nodes['errors'], that.nodes['value']);
    };

    that.callbacks.set = function(that, value){
        that.controller && cm.isFunction(that.controller.set) && that.controller.set(value);
        return value;
    };

    that.callbacks.get = function(that){
        return that.controller && cm.isFunction(that.controller.get) ? that.controller.get() : null;
    };

    that.callbacks.reset = function(that){
        that.controller && cm.isFunction(that.controller.reset) && that.controller.reset();
    };

    that.callbacks.destruct = function(that){
        that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
    };

    /* ******* PUBLIC ******* */

    that.set = function(value){
        that.value = that.callbacks.set(that, value);
        return that;
    };

    that.get = function(){
        that.value = that.callbacks.get(that);
        return that.value;
    };

    that.reset = function(){
        that.callbacks.reset(that);
        return that;
    };

    that.destruct = function(){
        that.callbacks.destruct(that);
        that.removeFromStack();
        return that;
    };

    that.renderError = function(message){
        that.callbacks.renderError(that, message);
        return that;
    };

    that.clearError = function(){
        that.callbacks.clearError(that);
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD: DECORATORS ******* */

Com.FormFields.add('input', {
    'node' : cm.node('input', {'type' : 'text'}),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('hidden', {
    'node' : cm.node('input', {'type' : 'hidden'}),
    'visible' : false,
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('textarea', {
    'node' : cm.node('textarea'),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('select', {
    'node' : cm.node('select'),
    'callbacks' : {
        'controller' : function(that){
            var nodes,
                items = [];
            cm.forEach(that.params['options'], function(item){
                nodes = {};
                nodes['container'] = cm.node('option', {'value' : item['value']}, item['text']);
                that.params['node'].appendChild(nodes['container']);
                items.push(nodes);
            });
            return items;
        },
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'controller' : function(that){
            var items = [],
                item;
            cm.forEach(that.params['options'], function(option){
                item = {
                    'config' : option,
                    'nodes' : {}
                };
                item.nodes['container'] = cm.node('label',
                    item.nodes['input'] = cm.node('input', {'type' : 'radio', 'name' : that.params['name'], 'value' : option['value']}),
                    item.nodes['label'] = cm.node('span', {'class' : 'label'}, option['text'])
                );
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = item.config['value'] == value;
            });
            return value;
        },
        'get' : function(that){
            var value = null;
            cm.forEach(that.controller, function(item){
                if(item.nodes['input'].checked){
                    value = item.config['value'];
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'controller' : function(that){
            var items = [],
                item;
            cm.forEach(that.params['options'], function(option){
                item = {
                    'config' : option,
                    'nodes' : {}
                };
                item.nodes['container'] = cm.node('label',
                    item.nodes['input'] = cm.node('input', {'type' : 'checkbox', 'name' : that.params['name'], 'value' : option['value']}),
                    item.nodes['label'] = cm.node('span', {'class' : 'label'}, option['text'])
                );
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = cm.inArray(value, item.config['value']);
            });
            return value;
        },
        'get' : function(that){
            var value = [];
            cm.forEach(that.controller, function(item){
                if(item.nodes['input'].checked){
                    value.push(item.config['value']);
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('buttons', {
    'node' : cm.node('div', {'class' : 'btn-wrap'}),
    'field' : false,
    'callbacks' : {
        'render' : function(that){
            var nodes = {};
            nodes['container'] = that.params['node'];
            return nodes;
        },
        'controller' : function(that){
            var buttons = {},
                node;
            cm.forEach(that.params['options'], function(item){
                node = cm.node('button', item['text']);
                switch(item['value']){
                    case 'submit':
                        node.type = 'submit';
                        cm.addClass(node, 'button-primary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.send();
                        });
                        break;

                    case 'reset':
                        node.type = 'reset';
                        cm.addClass(node, 'button-secondary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.reset();
                        });
                        break;

                    case 'clear':
                        cm.addClass(node, 'button-secondary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.clear();
                        });
                        break;

                    default:
                        break;
                }
                buttons[item['value']] = node;
                that.params['node'].appendChild(node);
            });
            return buttons;
        }
    }
});
cm.define('Com.MultipleInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onDisable',
        'onEnable',
        'onItemAddStart',
        'onItemAddProcess',
        'onItemAddEnd',
        'onItemRemoveStart',
        'onItemRemoveProcess',
        'onItemRemoveEnd',
        'onItemSortStart',
        'onItemSortProcess',
        'onItemSortEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-input',
        'value' : [],
        'defaultValue' : [],
        'max' : 0,
        'sortable' : false,
        'showControls' : true,
        'showToolbar' : false,
        'focusInput' : false,
        'duration' : 'cm._config.animDurationShort',
        'inputConstructor' : 'Com.AbstractInput',
        'inputParams' : {},
        'multiFieldConstructor' : 'Com.MultiField',
        'multiFieldParams' : {
            'embedStructure' : 'first',
            'renderStructure' : true,
            'embedStructureOnRender' : true,
            'template' : false,
            'templateAttributeReplace' : false
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultipleInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.items = [];
        that.isToolbarVisible = true;
        // Bind context to methods
        that.setHandler = that.set.bind(that);
        that.getHandler = that.get.bind(that);
        that.clearHandler = that.clear.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        that.addItemHandler = that.addItem.bind(that);
        that.removeItemHandler = that.removeItem.bind(that);
        that.constructProcessHandler = that.constructProcess.bind(that);
        // Add events
        that.addEvent('onConstructProcess', that.constructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.constructProcess = function(){
        var that = this;
        // Render inputs provided in DOM
        cm.forEach(that.nodes['inputs'], function(item){
            that.addItem({'input' : item['input']}, false);
        });
        // Render inputs provided in parameters
        if(cm.isArray(that.params['value'])){
            cm.forEach(that.params['value'], function(item){
                that.addItem({'value' : item}, false);
            });
        }
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Configure MultiField
        that.params['multiFieldParams']['max'] = that.params['max'];
        that.params['multiFieldParams']['sortable'] = that.params['sortable'];
        that.params['multiFieldParams']['showControls'] = that.params['showControls'];
        return that;
    };

    /* *** SYSTEM *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multiple-input'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['holder'] = cm.node('div', {'class' : 'com__multiple-input__holder'})
            )
        );
        if(that.params['showToolbar']){
            that.nodes['toolbarContainer'] = that.renderToolbarView();
            cm.appendChild(that.nodes['toolbarContainer'], that.nodes['holder']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multiple-input__toolbar'});
        // Push
        that.nodes['toolbar'] = nodes;
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Multi Field
        that.renderMultiField();
        return that;
    };

    classProto.renderMultiField = function(){
        var that = this;
        cm.getConstructor(that.params['multiFieldConstructor'], function(classObject){
            that.components['multiField'] = new classObject(
                cm.merge(that.params['multiFieldParams'], {
                    'container' : that.nodes['holder']
                })
            );
            that.renderMultiFieldEvents();
        });
        return that;
    };

    classProto.renderMultiFieldEvents = function(){
        var that = this;
        that.components['multiField'].addEvent('onItemAdd', function(my, field){
            that.addItemProcess({}, field, true);
        });
        that.components['multiField'].addEvent('onItemRemove', function(my, field){
            var index = field['index'];
            var item = that.items[index];
            that.removeItemProcess(item, field, true);
        });
        that.components['multiField'].addEvent('onItemSort', function(my, field){
            var previousIndex = field['previousIndex'];
            var item = that.items[previousIndex];
            that.sortItemProcess(item, field, true);
        });
        return that;
    };

    classProto.renderInputView = function(item){
        var that = this;
        item['input'] = cm.node('input', {'type' : 'text'});
        return item['input'];
    };

    /* *** ITEMS *** */

    classProto.addItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(!that.params['max'] || that.items.length < that.params['max']){
            // Render Fields
            that.components['multiField'].addItem({}, {
                'triggerEvents' : false,
                'callback' : function(field){
                    that.addItemProcess(item, field, triggerEvents);
                }
            });
        }
        return null;
    };

    classProto.addItemProcess = function(item, field, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Merge config
        item = cm.merge({
            'input' : null,
            'container' : null,
            'name' : that.params['name'],
            'value' : '',
            'constructor' : that.params['inputConstructor'],
            'nodes' : {}
        }, item);
        item['field'] = field;
        item['container'] = item['field']['content'];
        // Push
        that.items.push(item);
        // Start
        that.triggerEvent('onItemAddStart', item);
        // Render views
        if(!item['input']){
            item['input'] = that.renderInputView(item);
        }
        cm.appendChild(item['input'], item['container']);
        // Process
        cm.getConstructor(item['constructor'], function(classConstructor){
            item['controller'] = new classConstructor(
                cm.merge(that.params['inputParams'], {
                    'node' : item['input'],
                    'name' : item['name'],
                    'value' : item['value']
                })
            );
            that.triggerEvent('onItemAddProcess', item);
            that.params['focusInput'] && item['controller'].focus && item['controller'].focus();
            // Trigger set events
            triggerEvents && that.triggerEvent('onSelect');
            triggerEvents && that.triggerEvent('onSet');
            triggerEvents && that.triggerEvent('onChange');
        });
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Complete event
        that.triggerEvent('onItemAddEnd', item);
        return item;
    };

    classProto.removeItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Remove Field
        that.components['multiField'].removeItem(item['field'], {
            'triggerEvents' : false,
            'callback' : function(field){
                that.removeItemProcess(item, field, triggerEvents);
            }
        });
        return that;
    };

    classProto.removeItemProcess = function(item, field, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.triggerEvent('onItemRemoveStart', item);
        that.items = cm.arrayRemove(that.items, item);
        that.triggerEvent('onItemRemoveProcess', item);
        item['controller'] && item['controller'].destruct();
        that.triggerEvent('onItemRemoveEnd', item);
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Trigger set events
        triggerEvents && that.triggerEvent('onSelect');
        triggerEvents && that.triggerEvent('onSet');
        triggerEvents && that.triggerEvent('onChange');
        return that;
    };

    classProto.sortItemProcess = function(item, field){
        var that = this,
            index = field['index'];
        that.triggerEvent('onItemSortStart', item);
        that.triggerEvent('onItemSortProcess', item);
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        // Trigger event
        that.triggerEvent('onItemSortEnd', item);
    };

    /* *** TOOLBAR *** */

    classProto.toggleToolbarVisibility = function(){
        var that = this;
        if(that.params['showToolbar']){
            if(that.params['max'] > 0 && that.items.length == that.params['max']){
                that.hideToolbar();
            }else{
                that.showToolbar();
            }
        }
        return that;
    };

    classProto.showToolbar = function(){
        var that = this,
            height = 0;
        if(!that.isToolbarVisible){
            that.isToolbarVisible = true;
            // Prepare
            that.nodes['toolbarContainer'].style.height = '';
            height = that.nodes['toolbarContainer'].offsetHeight;
            that.nodes['toolbarContainer'].style.height = '0px';
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : height + 'px', 'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'clear' : true,
                'onStop' : function(){
                    that.nodes['toolbarContainer'].style.overflow = '';
                    that.nodes['toolbarContainer'].style.height = '';
                }
            });
        }
        return that;
    };

    classProto.hideToolbar = function(){
        var that = this;
        if(that.isToolbarVisible){
            that.isToolbarVisible = false;
            // Prepare
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : '0px', 'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out'
            });
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        cm.forEach(that.items, function(item){
            that.removeItem(item, false);
        });
        cm.forEach(value, function(item){
            that.addItem({'value' : item}, false);
        });
        // Trigger set events
        triggerEvents && that.triggerEvent('onSelect');
        triggerEvents && that.triggerEvent('onSet');
        triggerEvents && that.triggerEvent('onChange');
        return that;
    };

    classProto.get = function(){
        var that = this,
            data = [],
            value;
        cm.forEach(that.items, function(item){
            value = (item['controller'] && item['controller'].get) ? item['controller'].get() : null;
            value && data.push(value);
        });
        return data;
    };

    classProto.clear = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onClear');
        that.set(that.params['defaultValue'], triggerEvents);
        return that;
    };

    classProto.enable = function(){
        var that = this;
        if(!that.disabled){
            that.disabled = false;
            cm.removeClass(that.nodes['container'], 'disabled');
            cm.removeClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        if(that.disabled){
            that.disabled = true;
            cm.addClass(that.nodes['container'], 'disabled');
            cm.addClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onDisable');
        }
        return that;
    };
});
cm.define('Com.BoxTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__box-tools',
        'maxlength' : 3,
        'units' : 'px',
        'allowNegative' : false,
        'inputs' : [
            {'name' : 'top', 'icon' : 'icon svg__indent-top small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'right', 'icon' : 'icon svg__indent-right small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'bottom', 'icon' : 'icon svg__indent-bottom small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'left', 'icon' : 'icon svg__indent-left small linked', 'iconPosition' : 'insideRight'}
        ],
        'langs' : {
            'link' : 'Link',
            'unlink' : 'Unlink'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.BoxTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.myNodes = {};
        that.inputs = [];
        that.rawValue = null;
        that.isInputsLinked = false;
        that.lastInput = null;
        // Bind context to methods
        that.linkInputsHandler = that.linkInputs.bind(that);
        that.setValuesHandler = that.setValues.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        _inherit.prototype.set.apply(that, arguments);
        that.setInputs();
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        that.rawValue = cm.CSSValuesToArray(value);
        return cm.arrayToCSSValues(that.rawValue, that.params['units']);
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][0], 0)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][3], 3),
                cm.node('div', {'class' : 'b-link-container'},
                    that.myNodes['link'] = cm.node('div', {'class' : 'b-link', 'title' : that.lang('link')},
                        cm.node('div', {'class' : 'icon'})
                    )
                ),
                that.renderInput(that.params['inputs'][1], 1)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][2], 2)
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['link'], 'click', that.linkInputsHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderInput = function(item, i){
        var that = this;
        item = cm.merge({
            'i' : i,
            'icon' : 'small',
            'iconPosition' : 'leftInside',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes'] = that.renderInputContainer(item);
        item['input'] = item['nodes']['input'];
        // Attributes
        if(that.params['maxlength']){
            item['input'].setAttribute('maxlength', that.params['maxlength']);
        }
        // Events
        cm.addEvent(item['nodes']['icon'], 'click', function(e){
            cm.preventDefault(e);
            item['input'].setSelectionRange(0, item['input'].value.length);
            item['input'].focus();
        });
        cm.addEvent(item['input'], 'focus', function(){
            that.lastInput = item;
        });
        cm.addEvent(item['input'], 'blur', that.setValuesHandler);
        // Keypress events
        cm.addEvent(item['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValues();
                item['input'].blur();
            }
        });
        // Input events
        if(that.params['allowNegative']){
            cm.allowOnlyNumbersInputEvent(item['input'], function(e, value){
                that.inputOnInputEvent(e, value, item);
            });
        }else{
            cm.allowOnlyDigitInputEvent(item['input'], function(e, value){
                that.inputOnInputEvent(e, value, item);
            });
        }
        // Push
        that.inputs.push(item);
        return item['nodes']['container'];
    };

    classProto.inputOnInputEvent = function(e, value, item){
        var that = this;
        if(that.isInputsLinked){
            that.rawValue = [value, value, value, value];
            that.setInputs();
        }else{
            that.rawValue[item['i']] = value;
        }
        that.selectAction(cm.arrayToCSSValues(that.rawValue, that.params['units']), true);
        return that;
    };

    classProto.renderInputContainer = function(item){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'b-container'},
            nodes['inner'] = cm.node('div', {'class' : 'pt__input'},
                nodes['input'] = cm.node('input', {'type' : 'text'})
            )
        );
        if(!cm.isEmpty(item['title'])){
            nodes['inner'].setAttribute('title', item['title']);
        }
        nodes['icon'] = cm.node('div', {'class' : item['icon']});
        switch(item['iconPosition']){
            case 'insideLeft':
                cm.addClass(nodes['inner'], 'is-less-indent');
                cm.insertFirst(nodes['icon'], nodes['inner']);
                break;
            case 'insideRight':
                cm.addClass(nodes['inner'], 'is-less-indent');
                cm.insertLast(nodes['icon'], nodes['inner']);
                break;
            case 'outsideLeft':
                cm.addClass(nodes['inner'], 'is-icon-outside');
                cm.insertFirst(nodes['icon'], nodes['inner']);
                break;
            case 'outsideRight':
                cm.addClass(nodes['inner'], 'is-icon-outside');
                cm.insertLast(nodes['icon'], nodes['inner']);
                break;
        }
        return nodes;
    };

    classProto.setInputs = function(){
        var that = this;
        cm.forEach(that.inputs, function(item){
            item['input'].value = that.rawValue[item['i']];
        });
        return that;
    };

    classProto.setValues = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(cm.arrayToCSSValues(that.rawValue, that.params['units']), triggerEvents);
        return that;
    };

    classProto.linkInputs = function(){
        var that = this;
        if(!that.isInputsLinked){
            that.isInputsLinked = true;
            cm.addClass(that.myNodes['link'], 'active');
            that.myNodes['link'].title = that.lang('unlink');
            if(that.lastInput){
                that.set(that.lastInput['input'].value);
            }else{
                var value = 0;
                cm.forEach(that.inputs, function(item){
                    value = Math.max(value, parseInt(item['input'].value));
                });
                that.set(value);
            }
        }else{
            that.isInputsLinked = false;
            cm.removeClass(that.myNodes['link'], 'active');
            that.myNodes['link'].title = that.lang('link');
        }
        return that;
    };
});
cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Callbacks',
        'Stack'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onClear',
        'onSelect',
        'onChange',
        'onClickSelect',
        'onAbort',
        'onError'
    ],
    'params' : {
        'input' : null,                                             // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),               // Html input node to decorate.
        'target' : false,                                           // HTML node.
        'container' : 'document.body',
        'name' : '',
        'minLength' : 3,
        'delay' : 'cm._config.requestDelay',
        'clearOnEmpty' : true,                                      // Clear input and value if item didn't selected from tooltip
        'showListOnEmpty' : false,                                  // Show options list, when input is empty
        'showLoader' : true,                                        // Show ajax spinner in tooltip, for ajax mode only.
        'data' : [],                                                // Examples: [{'value' : 'foo', 'text' : 'Bar'}] or ['Foo', 'Bar'].
        'value' : {},
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %query%, %callback%.
            'params' : ''                                           // Params object. Variables: %baseUrl%, %query%, %callback%.
        },
        'langs' : {
            'loader' : 'Searching for: %query%.'                    // Variable: %query%.
        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__ac-tooltip',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 4'
        }
    }
},
function(params){
    var that = this;
    
    that.components = {};

    that.isDestructed = false;
    that.ajaxHandler = null;
    that.isOpen = false;
    that.isAjax = false;
    that.requestDelay = null;

    that.registeredItems = [];
    that.selectedItemIndex = null;
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['node'];
        }
        // If URL parameter exists, use ajax data
        that.isAjax = !cm.isEmpty(that.params['ajax']['url']);
        // Prepare data
        that.params['data'] = that.convertData(that.params['data']);
        that.params['value'] = that.convertDataItem(that.params['value']);
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['container'],
                'target' : that.params['target'],
                'events' : {
                    'onShowStart' : function(){
                        that.isOpen = true;
                        cm.addEvent(document, 'mousedown', bodyEvent);
                    },
                    'onHideStart' : function(){
                        that.isOpen = false;
                        cm.removeEvent(document, 'mousedown', bodyEvent);
                    }
                }
            })
        );
        // Set input
        that.setInput(that.params['node']);
        // Set
        !cm.isEmpty(that.params['value']) && that.set(that.params['value'], false);
    };

    var setListItem = function(index){
        var previousItem = that.registeredItems[that.selectedItemIndex],
            item = that.registeredItems[index];
        if(previousItem){
            cm.removeClass(previousItem['node'], 'active');
        }
        if(item){
            cm.addClass(item['node'], 'active');
            that.components['tooltip'].scrollToNode(item['node']);
        }
        that.selectedItemIndex = index;
        // Set input data
        set(that.selectedItemIndex);
    };

    var inputHandler = function(e){
        var listLength,
            listIndex;
        e = cm.getEvent(e);

        switch(e.keyCode){
            // Enter
            case 13:
                clear();
                that.hide();
                break;
            // Arrow Up
            case 38:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex === null){
                        listIndex = listLength - 1;
                    }else if(that.selectedItemIndex - 1 >= 0){
                        listIndex = that.selectedItemIndex - 1;
                    }else{
                        listIndex = listLength - 1;
                    }
                    setListItem(listIndex);
                }
                break;
            // Arrow Down
            case 40:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex === null){
                        listIndex = 0;
                    }else if(that.selectedItemIndex + 1 < listLength){
                        listIndex = that.selectedItemIndex + 1;
                    }else{
                        listIndex = 0;
                    }
                    setListItem(listIndex);
                }
                break;
        }
    };

    var requestHandler = function(){
        var query = that.params['node'].value,
            config = cm.clone(that.params['ajax']);
        // Clear tooltip ajax/static delay and filtered items list
        that.requestDelay && clearTimeout(that.requestDelay);
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();
        // Request
        if(that.params['showListOnEmpty'] || query.length >= that.params['minLength']){
            that.requestDelay = setTimeout(function(){
                if(that.isAjax){
                    if(that.params['showLoader']){
                        that.callbacks.loader(that, config, query);
                    }
                    that.ajaxHandler = that.callbacks.request(that, config, query);
                }else{
                    that.callbacks.data(that, query, that.params['data']);
                }
            }, that.params['delay']);
        }else{
            that.hide();
        }
    };

    var set = function(index){
        var item = that.registeredItems[index];
        if(item){
            that.setRegistered(item, true);
        }
    };

    var clear = function(){
        var item;
        // Kill timeout interval and ajax request
        that.requestDelay && clearTimeout(that.requestDelay);
        that.abort();
        // Clear input
        if(that.params['clearOnEmpty']){
            cm.log(that.value);
            item = that.getRegisteredItem(that.value);
            if(!item || item['data']['text'] != that.params['node'].value){
                that.clear();
            }
        }
    };

    var onChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
    };

    var blurHandler = function(){
        if(!that.isOpen){
            clear();
        }
    };

    var clickHandler = function(){
        if(that.params['showListOnEmpty']){
            requestHandler();
        }
    };

    var bodyEvent = function(e){
        e = cm.getEvent(e);
        var target = cm.getEventTarget(e);
        if(!that.isOwnNode(target)){
            clear();
            that.hide();
        }
    };

    var setEvents = function(){
        cm.addEvent(that.params['node'], 'input', requestHandler);
        cm.addEvent(that.params['node'], 'keydown', inputHandler);
        cm.addEvent(that.params['node'], 'blur', blurHandler);
        cm.addEvent(that.params['node'], 'click', clickHandler);
    };

    var unsetEvents = function(){
        cm.removeEvent(that.params['node'], 'input', requestHandler);
        cm.removeEvent(that.params['node'], 'keydown', inputHandler);
        cm.removeEvent(that.params['node'], 'blur', blurHandler);
        cm.removeEvent(that.params['node'], 'click', clickHandler);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config, query){
        config = that.callbacks.beforePrepare(that, config, query);
        config['url'] = cm.strReplace(config['url'], {
            '%query%' : query,
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%query%' : query,
            '%baseUrl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config, query);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config, query){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config, query){
        return config;
    };

    that.callbacks.request = function(that, config, query){
        config = that.callbacks.prepare(that, config, query);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, query, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config, query);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, query, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, config, query, response){
        if(response){
            response = that.callbacks.filter(that, config, query, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.render(that, that.convertData(response));
        }else{
            that.callbacks.render(that, []);
        }
    };

    that.callbacks.error = function(that, config, query){
        that.hide();
        that.triggerEvent('onError');
    };

    that.callbacks.loader = function(that, config, query){
        var nodes = {};
        // Render Structure
        nodes['container'] = cm.Node('div', {'class' : 'pt__listing-items disabled'},
            cm.Node('ul',
                cm.Node('li',
                    cm.Node('a',
                        cm.Node('span', {'class' : 'icon small loader-circle'}),
                        cm.Node('span', that.lang('loader', {'%query%' : query}))
                    )
                )
            )
        );
        // Embed nodes to Tooltip
        that.callbacks.embed(that, nodes['container']);
        // Show Tooltip
        that.show();
    };

    /* *** STATIC DATA *** */

    that.callbacks.data = function(that, query, items){
        // Filter data
        items = that.callbacks.query(that, query, items);
        that.callbacks.render(that, items);
    };

    /* *** HELPERS *** */

    that.callbacks.query = function(that, query, items){
        var filteredItems = [];
        cm.forEach(items, function(item){
            if(item && item['text'].toLowerCase().indexOf(query.toLowerCase()) > -1){
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };

    that.callbacks.render = function(that, items){
        if(items.length){
            // Render List Nodes
            that.callbacks.renderList(that, items);
            // Show menu
            that.show();
        }else{
            that.hide();
        }
    };

    that.callbacks.renderList = function(that, items){
        var nodes = {};
        // Render structure
        nodes['container'] = cm.Node('div', {'class' : 'pt__listing-items'},
            nodes['items'] = cm.Node('ul')
        );
        // Render List Items
        cm.forEach(items, function(item, i){
            that.callbacks.renderItem(that, nodes['items'], item, i);
        });
        // Embed nodes to Tooltip
        that.callbacks.embed(that, nodes['container']);
    };

    that.callbacks.renderItem = function(that, container, item, i){
        var nodes = {};
        // Render Structure of List Item
        nodes['container'] = cm.Node('li',
            cm.Node('a', {'innerHTML' : item['text']})
        );
        // Highlight selected option
        if(that.value == item['value']){
            cm.addClass(nodes['container'], 'active');
            that.selectedItemIndex = i;
        }
        // Register item
        that.callbacks.registerItem(that, nodes['container'], item, i);
        // Embed Item to List
        cm.appendChild(nodes['container'], container);
    };

    that.callbacks.registerItem = function(that, node, item, i){
        var regItem = {
            'data' : item,
            'node' : node,
            'i' : i
        };
        cm.addEvent(regItem['node'], 'click', function(){
            that.setRegistered(regItem, true);
            that.triggerEvent('onClickSelect', that.value);
            that.hide();
        });
        that.registeredItems.push(regItem);
    };

    that.callbacks.embed = function(that, container){
        that.components['tooltip'].setContent(container);
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.set = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = typeof item['value'] != 'undefined'? item['value'] : item['text'];
        that.params['node'].value = item['text'];
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
        return that;
    };

    that.setRegistered = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(item['data'], triggerEvents);
        return that;
    };

    that.setInput = function(node){
        if(cm.isNode(node)){
            unsetEvents();
            that.params['node'] = node;
            setEvents();
        }
        return that;
    };

    that.setTarget = function(node){
        if(cm.isNode(node)){
            that.params['target'] = node;
            that.components['tooltip'].setTarget(node);
        }
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.getItem = function(value){
        var item;
        if(value){
            cm.forEach(that.params['data'], function(dataItem){
                if(dataItem['value'] == value){
                    item = dataItem;
                }
            });
        }
        return item;
    };

    that.getRegisteredItem = function(value){
        var item;
        if(value){
            cm.forEach(that.registeredItems, function(regItem){
                if(regItem['data']['value'] == value){
                    item = regItem;
                }
            });
        }
        return item;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        if(that.params['clearOnEmpty']){
            that.params['node'].value = '';
        }
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    that.show = function(){
        that.components['tooltip'].show();
        return that;
    };

    that.hide = function(){
        that.components['tooltip'].hide();
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.focus = function(){
        that.params['node'].focus();
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(that.params['target'], node, true) || that.components['tooltip'].isOwnNode(node);
    };

    init();
});

cm.getConstructor('Com.Autocomplete', function(classConstructor, className, classProto){
    classProto.convertData = function(data){
        var that = this;
        return data.map(function(item){
            return that.convertDataItem(item);
        });
    };

    classProto.convertDataItem = function(item){
        if(cm.isEmpty(item)){
            return null
        }else if(!cm.isObject(item)){
            return {'text' : item, 'value' : item};
        }else{
            return item;
        }
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('autocomplete', {
    'node' : cm.node('input', {'type' : 'text'}),
    'constructor' : 'Com.Autocomplete'
});
/* ******* COMPONENTS: BIG CALENDAR ******* */

cm.define('Com.BigCalendar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'defaultView' : 'agenda',                                   // agenda | week | month
        'isViewPreloaded' : false,
        'animateDuration' : 'cm._config.animDuration',
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
            'params' : {                                            // Params object. %baseUrl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
                'view' : '%view%',
                'week' : '%week%',
                'month' : '%month%',
                'year' : '%year%',
                'query' : '%query%'
            }
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true,
            'appendMode' : 'insertFirst'
        }
    }
},
function(params){
    var that = this,
        viewDetailsPattern = {
            'view' : null,
            'week' : null,
            'month' : null,
            'year' : null,
            'query' : null
        };

    that.nodes = {
        'container' : cm.node('div'),
        'buttons' : {
            'views' : {
                'agenda' : cm.node('div'),
                'week' : cm.node('div'),
                'month' : cm.node('div')
            }
        },
        'holder' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        }
    };
    that.components = {};
    that.animations = {};

    that.ajaxHandler = null;
    that.isProcess = false;
    that.isRendering = false;
    that.loaderDelay = null;
    that.viewDetails = cm.clone(viewDetailsPattern);

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['defaultView'] = cm.inArray(['agenda', 'week', 'month'], that.params['defaultView']) ? that.params['defaultView'] : 'month';
        that.params['Com.Overlay']['container'] = that.nodes['container'];
    };

    var render = function(){
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['loader'] = new classConstructor(that.params[className]);
        });
        // Animations
        that.animations['response'] = new cm.Animation(that.nodes['holder']['container']);
        // View Buttons
        cm.forEach(that.nodes['buttons']['views'], function(node, key){
            cm.addEvent(node, 'click', function(e){
                cm.preventDefault(e);
                setView({
                    'view' : key
                });
            });
        });
        // View Finder
        new cm.Finder('Com.CalendarAgenda', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        new cm.Finder('Com.CalendarWeek', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        new cm.Finder('Com.CalendarMonth', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        // Render View
        !that.params['isViewPreloaded'] && setView({
            'view' : that.params['defaultView']
        });
    };

    var setViewDetails = function(data){
        that.viewDetails = cm.merge(viewDetailsPattern, data);
    };

    var setView = function(data){
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            setViewDetails(data);
            cm.forEach(that.nodes['buttons']['views'], function(node, key){
                if(key === that.viewDetails['view']){
                    cm.replaceClass(node, 'button-secondary', 'button-primary');
                }else{
                    cm.replaceClass(node, 'button-primary', 'button-secondary');
                }
            });
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl,
            '%view%' : that.viewDetails['view'],
            '%year%' : that.viewDetails['year'],
            '%month%' : that.viewDetails['month'],
            '%week%' : that.viewDetails['week'],
            '%query%' : that.viewDetails['query']
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl,
            '%view%' : that.viewDetails['view'],
            '%year%' : that.viewDetails['year'],
            '%month%' : that.viewDetails['month'],
            '%week%' : that.viewDetails['week'],
            '%query%' : that.viewDetails['query']
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, response){
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.start = function(that, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onSendEnd');
        that.triggerEvent('onProcessEnd', that.nodes['holder']['inner']);
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, response);
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config){
        that.callbacks.renderError(that, config);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.callbacks.render(that, response);
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderTemporary = function(that){
        return cm.node('div', {'class' : 'calendar__temporary'});
    };

    that.callbacks.render = function(that, data){
        var nodes, temporary;
        if(that.params['responseHTML']){
            that.isRendering = true;
            temporary = that.callbacks.renderTemporary(that);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    temporary.appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            temporary.appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.renderError = function(that, config){
        if(that.params['responseHTML']){
            that.isRendering = true;
            var temporary = that.callbacks.renderTemporary(that);
            temporary.appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.append = function(that, temporary){
        var height;
        // Wrap old content
        if(!that.nodes['holder']['temporary']){
            that.nodes['holder']['temporary'] = that.callbacks.renderTemporary(that);
            cm.appendNodes(that.nodes['holder']['inner'].childNodes, that.nodes['holder']['temporary']);
            cm.appendChild(that.nodes['holder']['temporary'], that.nodes['holder']['inner']);
        }
        cm.removeClass(that.nodes['holder']['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['holder']['inner']);
        cm.addClass(temporary, 'is-show', true);
        // Animate
        cm.removeClass(that.nodes['holder']['container'], 'is-loaded', true);
        cm.addClass(that.nodes['holder']['container'], 'is-show', true);
        height = temporary.offsetHeight;
        that.animations['response'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                that.nodes['holder']['container'].style.height = '';
                cm.remove(that.nodes['holder']['temporary']);
                cm.addClass(that.nodes['holder']['container'], 'is-loaded', true);
                that.nodes['holder']['temporary'] = temporary;
                that.isRendering = false;
            }
        });
    };

    /* ******* PUBLIC ******* */

    that.refresh = function(){
        setView(that.viewDetails);
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.setAction = function(o, mode, update){
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['ajax'] = cm.merge(that._raw.params['ajax'], o);
                break;
            case 'current':
                that.params['ajax'] = cm.merge(that.params['ajax'], o);
                break;
            case 'update':
                that.params['ajax'] = cm.merge(that._update.params['ajax'], o);
                break;
        }
        if(update){
            that._update.params['ajax'] = cm.clone(that.params['ajax']);
        }
        return that;
    };

    init();
});

/* *** CALENDAR EVENT *** */

cm.define('Com.CalendarEvent', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'data' : {
            'title' : null,
            'date' : null,
            'description' : null
        },
        'Com.Tooltip' : {
            'delay' : 'cm._config.hideDelayLong',
            'className' : 'com__calendar-event-tooltip',
            'minWidth' : 250
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'template' : null
    };
    that.components = {};
    that.template = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Render tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor, className){
            that.components['tooltip'] = new classConstructor(
                cm.merge(that.params[className],{
                    'target' : that.params['node']
                })
            );
        });
    };

    var renderContent = function(template){
        if(!cm.isEmpty(that.params['data']['title'])){
            template['title'].innerHTML = that.params['data']['title'];
        }
        if(!cm.isEmpty(that.params['data']['date'])){
            template['date'].innerHTML = that.params['data']['date'];
        }
        if(!cm.isEmpty(that.params['data']['description'])){
            template['description'].innerHTML = that.params['data']['description'];
        }else{
            cm.remove(template['description-container']);
        }
        if(!cm.isEmpty(that.params['data']['url'])){
            template['button'].setAttribute('href', that.params['data']['url']);
        }else{
            cm.remove(template['button-container']);
        }
    };

    /* ******* PUBLIC ******* */

    that.setTemplate = function(node){
        that.nodes['template'] = cm.getNodes(node);
        if(that.nodes['template']){
            renderContent(that.nodes['template']);
            that.components['tooltip'] && that.components['tooltip'].setContent(that.nodes['template']['container']);
        }
        return that;
    };

    that.setTooltipParams = function(o){
        that.params['Com.Tooltip'] = cm.merge(that.params['Com.Tooltip'], o);
        that.components['tooltip'] && that.components['tooltip'].setParams(that.params['Com.Tooltip']);
        return that;
    };

    init();
});

/* *** CALENDAR VIEW ABSTRACT *** */

cm.define('Com.AbstractCalendarView', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onRequestView'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'viewName' : '',
        'itemShortIndent' : 1,
        'itemShortHeight' : 24,
        'dayIndent' : 4,
        'Com.Tooltip' : {}
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'buttons' : {
            'container' : cm.node('div'),
            'prev' : cm.node('div'),
            'next' : cm.node('div'),
            'search-button' : cm.node('div'),
            'search-input' : cm.node('input'),
            'views' : {
                'agenda' : cm.node('div'),
                'week' : cm.node('div'),
                'month' : cm.node('div')
            }
        },
        'templates' : {
            'event' : {}
        }
    };
    that.components = {};
    that.days = [];

    var init = function(){
        that.getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.renderToolbar();
        that.render();
        that.triggerEvent('onRender');
    };

    /* ******* PUBLIC ******* */

    init();
});

cm.getConstructor('Com.AbstractCalendarView', function(classConstructor, className, classProto){
    classProto.getLESSVariables = function(){
        var that = this;
        that.params['itemShortIndent'] = cm.getLESSVariable('ComCalendarEvent-Short-Indent', that.params['itemShortIndent'], true);
        that.params['itemShortHeight'] = cm.getLESSVariable('ComCalendarEvent-Short-Height', that.params['itemShortHeight'], true);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        if(that.params['Com.Tooltip']['width'] != 'auto'){
            that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
                '%itemShortIndent%' : that.params['itemShortIndent'],
                '%itemShortHeight%' : that.params['itemShortHeight'],
                '%dayIndent%' : that.params['dayIndent']
            });
        }
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Find events and set template and tooltip config
        new cm.Finder('Com.CalendarEvent', null, that.params['node'], function(classObject){
            // Clone template
            var template = cm.clone(that.nodes['templates']['event']['container'], true);
            // Set Node
            classObject
                .setTooltipParams(that.params['Com.Tooltip'])
                .setTemplate(template);
        }, {'multiple' : true});
        return that;
    };

    classProto.renderToolbar = function(){
        var that = this;
        // Toolbar Controls
        new cm.Finder('Com.Select', 'week', that.nodes['buttons']['container'], function(classObject){
            that.components['week'] = classObject
                .addEvent('onChange', that.updateView.bind(that));
        });
        new cm.Finder('Com.Select', 'month', that.nodes['buttons']['container'], function(classObject){
            that.components['month'] = classObject
                .addEvent('onChange',  that.updateView.bind(that));
        });
        new cm.Finder('Com.Select', 'year', that.nodes['buttons']['container'], function(classObject){
            that.components['year'] = classObject
                .addEvent('onChange', that.updateView.bind(that));
        });
        // Search
        cm.addEvent(that.nodes['buttons']['search-input'], 'keypress', function(e){
            if(e.keyCode == 13){
                cm.preventDefault(e);
                that.updateView();
            }
        });
        cm.addEvent(that.nodes['buttons']['search-button'], 'click', function(e){
            cm.preventDefault(e);
            that.updateView();
        });
        // View Buttons
        cm.forEach(that.nodes['buttons']['views'], function(node, key){
            if(key === that.params['viewName']){
                cm.replaceClass(node, 'button-secondary', 'button-primary');
            }else{
                cm.replaceClass(node, 'button-primary', 'button-secondary');
            }
            cm.addEvent(node, 'click', function(e){
                cm.preventDefault(e);
                that.requestView({
                    'view' : key
                });
            });
        });
        // Prev / Next Buttons
        cm.addEvent(that.nodes['buttons']['prev'], 'click', function(e){
            cm.preventDefault(e);
            that.prev();
        });
        cm.addEvent(that.nodes['buttons']['next'], 'click', function(e){
            cm.preventDefault(e);
            that.next();
        });
        return that;
    };

    classProto.searchQuery = function(str){
        var that = this;
        var data = that.getData();
        data.query = str;
        that.requestView(data);
        return that;
    };

    classProto.requestView = function(data){
        var that = this;
        that.triggerEvent('onRequestView', data);
        return that;
    };

    classProto.getData = function(){
        var that = this;
        return {
            'query' : that.nodes['buttons']['search-input'].value,
            'view' : that.params['viewName'],
            'year' : that.components['year'] ? that.components['year'].get() : null,
            'month' : that.components['month'] ? that.components['month'].get() : null,
            'week' : that.components['week'] ? that.components['week'].get() : null
        };
    };

    classProto.updateView = function(){
        var that = this;
        that.triggerEvent('onRequestView', that.getData());
        return that;
    };

    classProto.prev = function(){
        var that = this;
        var data = that.getData();
        if(data['week'] !== null){
            if(data['week'] == 1){
                data['year']--;
                data['week'] = cm.getWeeksInYear(data['year']);
            }else{
                data['week']--;
            }
        }else if(data['month'] !== null){
            if(data['month'] == 0){
                data['year']--;
                data['month'] = 11;
            }else{
                data['month']--;
            }
        }else{
            data['year']--;
        }
        that.requestView(data);
        return that;
    };

    classProto.next = function(){
        var that = this;
        var data = that.getData();
        if(data['week'] !== null){
            if(data['week'] == cm.getWeeksInYear(data['year'])){
                data['year']++;
                data['week'] = 1;
            }else{
                data['week']++;
            }
        }else if(data['month'] !== null){
            if(data['month'] == 11){
                data['year']++;
                data['month'] = 0;
            }else{
                data['month']++;
            }
        }else {
            data['year']++;
        }
        that.requestView(data);
        return that;
    };
});

/* *** CALENDAR MONTH VIEW *** */

cm.define('Com.CalendarMonth', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'month',
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : '-(selfWidth - targetWidth) - targetHeight'
        }
    }
},
function(params){
    var that = this;
    Com.AbstractCalendarView.apply(that, arguments);
});

cm.getConstructor('Com.CalendarMonth', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.processDay = function(nodes){
        var that = this;
        var item = {
            'isShow' : false,
            'nodes' : nodes
        };
        // Show all events on more button click
        cm.addEvent(item.nodes['more-button'], 'click', function(){
            that.showMoreEvents(item);
        });
        // Prevent document scrolling while scroll all events block
        cm.addIsolateScrolling(item.nodes['more-holder']);
        // Push
        that.days.push(item);
    };

    classProto.showMoreEvents = function(item){
        var that = this;
        item.delay && clearTimeout(item.delay);
        if(!item.isShow){
            item.isShow = true;
            cm.setScrollTop(item.nodes['more-holder'], 0);
            cm.addClass(item.nodes['more-holder'], 'is-show');
        }
    };

    classProto.hideMoreEvents = function(item, isImmediately){
        var that = this;
        item.delay && clearTimeout(item.delay);
        if(item.isShow){
            if(isImmediately){
                item.isShow = false;
                cm.removeClass(item.nodes['more-holder'], 'is-show');
            }else{
                item.delay = setTimeout(function(){
                    item.isShow = false;
                    cm.removeClass(item.nodes['more-holder'], 'is-show');
                }, that.params['delay']);
            }
        }
    };

    classProto.getLESSVariables = function(){
        var that = this;
        _inherit.prototype.getLESSVariables.call(that);
        that.params['dayIndent'] = cm.getLESSVariable('ComCalendarMonth-Day-Indent', that.params['dayIndent'], true);
        return that;
    };

    classProto.render = function(){
        var that = this;
        _inherit.prototype.render.call(that);
        cm.forEach(that.nodes['days'], that.processDay.bind(that));
        return that;
    };
});

/* *** CALENDAR WEEK VIEW *** */

cm.define('Com.CalendarWeek', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'week',
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;
    Com.AbstractCalendarView.apply(that, arguments);
});

cm.getConstructor('Com.CalendarWeek', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.getLESSVariables = function(){
        var that = this;
        _inherit.prototype.getLESSVariables.call(that);
        that.params['dayIndent'] = cm.getLESSVariable('ComCalendarWeek-Day-Indent', that.params['dayIndent'], true);
        return that;
    };
});

/* *** CALENDAR AGENDA VIEW *** */

cm.define('Com.CalendarAgenda', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'agenda',
        'Com.Tooltip' : {
            'width' : 'targetWidth - %itemShortHeight% * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;
    Com.AbstractCalendarView.apply(that, arguments);
});
cm.define('Com.BoxRadiusTools', {
    'extend' : 'Com.BoxTools',
    'params' : {
        'className' : 'com__box-tools com__box-tools--radius',
        'inputs' : [
            {'name' : 'topleft', 'icon' : 'icon svg__radius-topleft small linked', 'iconPosition' : 'outsideLeft'},
            {'name' : 'topright', 'icon' : 'icon svg__radius-topright small linked', 'iconPosition' : 'outsideRight'},
            {'name' : 'bottomright', 'icon' : 'icon svg__radius-bottomright small linked', 'iconPosition' : 'outsideRight'},
            {'name' : 'bottomleft', 'icon' : 'icon svg__radius-bottomleft small linked', 'iconPosition' : 'outsideLeft'}
        ]
    }
},
function(params){
    var that = this;
    Com.BoxTools.apply(that, arguments);
});

cm.getConstructor('Com.BoxRadiusTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][0], 0),
                that.renderInput(that.params['inputs'][1], 1)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][3], 3),
                that.renderInput(that.params['inputs'][2], 2)
            ),
            cm.node('div', {'class' : 'b-line'},
                cm.node('div', {'class' : 'b-link-container'},
                    that.myNodes['link'] = cm.node('div', {'class' : 'b-link', 'title' : that.lang('link')},
                        cm.node('div', {'class' : 'icon'})
                    )
                )
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['link'], 'click', that.linkInputsHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };
});
cm.define('Com.Calendar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onDayOver',
        'onDayOut',
        'onDayClick',
        'onMonthRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'className' : '',
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'renderMonthOnInit' : true,
        'startWeekDay' : 0,
        'renderSelectsInBody' : true,
        'langs' : {
            'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        }
    }
},
function(params){
    var that = this,
        nodes = {
            'selects' : {}
        },
        selects = {},
        today = new Date(),
        current = {
            'year' : today.getFullYear(),
            'month' : today.getMonth()
        },
        previous = {},
        next = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
        that.params['renderMonthOnInit'] && renderView();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
    };

    var render = function(){
        var weekday;
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__calendar'},
            cm.Node('div', {'class' : 'selects'},
                nodes['months'] = cm.Node('select', {'class' : 'select months'}),
                nodes['years'] = cm.Node('select', {'class' : 'select years'})
            ),
            cm.Node('table',
                cm.Node('thead',
                    nodes['days'] = cm.Node('tr')
                ),
                nodes['dates'] = cm.Node('tbody')
            )
        );
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(nodes['container'], that.params['className']);
        // Render days
        cm.forEach(7, function(i){
            weekday = i + that.params['startWeekDay'];
            weekday = weekday > 6? Math.abs(6 - (weekday - 1)) : weekday;
            nodes['days'].appendChild(
                cm.Node('th', that.lang('daysAbbr')[weekday])
            );
        });
        // Render selects options
        that.lang('months').forEach(function(item, i){
            nodes['months'].appendChild(
                cm.Node('option', {'value' : i}, item)
            );
        });
        for(var i = that.params['endYear']; i >= that.params['startYear']; i--){
            nodes['years'].appendChild(
                cm.Node('option', {'value' : i}, i)
            );
        }
        // Insert into DOM
        that.params['node'].appendChild(nodes['container']);
    };

    var setMiscEvents = function(){
        // Init custom selects
        selects['years'] = new Com.Select({
                'node' : nodes['years'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .set(current['year'])
            .addEvent('onChange', renderView);

        selects['months'] = new Com.Select({
                'node' : nodes['months'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .set(current['month'])
            .addEvent('onChange', renderView);
    };

    var renderView = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        var date;
        // Get new today date
        today = new Date();
        // Get current month data
        date = new Date(selects['years'].get(), selects['months'].get(), 1);
        current = getMonthData(date);
        // Get previous month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] - 1);
        previous = getMonthData(date);
        // Get next month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] + 1);
        next = getMonthData(date);
        // Clear current table
        cm.clearNode(nodes['dates']);
        // Render rows
        cm.forEach(6, renderRow);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onMonthRender', current);
        }
    };

    var renderRow = function(i){
        var startWeekDay = current['startWeekDay'] - that.params['startWeekDay'],
            day = ((i - 1) * 7) + 1 - (startWeekDay > 0? startWeekDay - 7 : startWeekDay),
            tr = nodes['dates'].appendChild(
                cm.Node('tr')
            );
        cm.forEach(7, function(){
            renderCell(tr, day);
            day++;
        });
    };

    var renderCell = function(tr, day){
        var td, div, params;
        tr.appendChild(
            td = cm.Node('td')
        );
        // Render day
        if(day <= 0){
            td.appendChild(
                div = cm.Node('div', (previous['dayCount'] + day))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.prevMonth);
        }else if(day > current['dayCount']){
            td.appendChild(
                div = cm.Node('div', (day - current['dayCount']))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.nextMonth);
        }else{
            td.appendChild(
                div = cm.Node('div', day)
            );
            cm.addClass(td, 'in');
            params = {
                'container' : td,
                'node' : div,
                'day' : day,
                'month' : current['month'],
                'year' : current['year'],
                'date' : new Date(current['year'], current['month'], day),
                'isWeekend' : false,
                'isToday' : false
            };
            if(today.getFullYear() == current['year'] && today.getMonth() == current['month'] && day == today.getDate()){
                params['isToday'] = true;
                cm.addClass(td, 'today');
            }
            if(/0|6/.test(new Date(current['year'], current['month'], day).getDay())){
                params['isWeekend'] = true;
                cm.addClass(td, 'weekend');
            }
            // Add events
            cm.addEvent(div, 'mouseover', function(){
                that.triggerEvent('onDayOver', params);
            });
            cm.addEvent(div, 'mouseout', function(){
                that.triggerEvent('onDayOut', params);
            });
            cm.addEvent(div, 'click', function(){
                that.triggerEvent('onDayClick', params);
            });
            // Add to array
            current['days'][day] = params;
        }
    };

    var getMonthData = function(date){
        var o = {
            'year' : date.getFullYear(),
            'month' : date.getMonth(),
            'days' : {},
            'startWeekDay' : date.getDay()
        };
        o['dayCount'] = 32 - new Date(o['year'], o['month'], 32).getDate();
        return o;
    };

    /* ******* PUBLIC ******* */

    that.getFullYear = function(){
        return current['year'];
    };

    that.getMonth = function(){
        return current['month'];
    };

    that.set = function(year, month, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(
            year >= that.params['startYear'] && year <= that.params['endYear']
            && month >= 0 && month <= 11
        ){
            selects['years'].set(year, false);
            selects['months'].set(month, false);
            renderView(triggerEvents);
        }
        return that;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        var date = new Date();
        selects['years'].set(date.getFullYear(), false);
        selects['months'].set(date.getMonth(), false);
        renderView(triggerEvents);
        return that;
    };

    that.renderMonth = function(){
        renderView();
        return that;
    };

    that.getCurrentMonth = function(){
        return current;
    };

    that.nextMonth = function(){
        if(next['year'] <= that.params['endYear']){
            selects['years'].set(next['year'], false);
            selects['months'].set(next['month'], false);
            renderView();
        }
        return that;
    };

    that.prevMonth = function(){
        if(previous['year'] >= that.params['startYear']){
            selects['years'].set(previous['year'], false);
            selects['months'].set(previous['month'], false);
            renderView();
        }
        return that;
    };

    that.selectDay = function(date){
        if(date && current['year'] == date.getFullYear() && current['month'] == date.getMonth()){
            cm.addClass(current['days'][date.getDate()]['container'], 'selected');
        }
    };

    that.unSelectDay = function(date){
        if(date && current['year'] == date.getFullYear() && current['month'] == date.getMonth()){
            cm.removeClass(current['days'][date.getDate()]['container'], 'selected');
        }
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});
cm.define('Com.CalendarEvents', {
    'modules' : [
        'Params',
        'Structure',
        'Stack',
        'DataConfig',
        'Langs'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'embedStructure' : 'append',
        'name' : '',
        'data' : {},
        'format' : 'cm._config.displayDateFormat',
        'startYear' : 1950,
        'endYear' : new Date().getFullYear() + 10,
        'startWeekDay' : 0,
        'target' : '_blank',
        'langs' : {
            'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        },
        'Com.Tooltip' : {
            'className' : 'com__calendar-events__tooltip'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.getDataConfig(that.params['node']);
        // Render
        render();
        setMiscEvents();
        that.addToStack(that.nodes['container']);
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__calendar-events'});
        // Render calendar
        that.components['calendar'] = new Com.Calendar({
            'node' : that.nodes['container'],
            'renderMonthOnInit' : false,
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs']
        });
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(that.params['Com.Tooltip']);
        // Append
        that.embedStructure(that.nodes['container']);
    };

    var setMiscEvents = function(){
        // Add events on calendars day
        that.components['calendar']
            .addEvent('onDayOver', renderTooltip)
            .addEvent('onMonthRender', markMonthDays)
            .renderMonth();
    };

    var markMonthDays = function(calendar, params){
        var data, day;
        if((data = that.params['data'][params['year']]) && (data = data[(params['month'] + 1)])){
            cm.forEach(data, function(value, key){
                if(day = params['days'][key]){
                    cm.addClass(day['container'], 'active');
                }
            });
        }
    };

    var renderTooltip = function(calendar, params){
        var data,
            myNodes = {};

        if((data = that.params['data'][params['year']]) && (data = data[(params['month'] + 1)]) && (data = data[params['day']])){
            // Structure
            myNodes['content'] = cm.node('div', {'class' : 'pt__listing com__calendar-events-listing'},
                myNodes['list'] = cm.node('ul', {'class' : 'list'})
            );
            // Foreach events
            cm.forEach(data, function(value){
                myNodes['list'].appendChild(
                    cm.node('li',
                        cm.node('a', {'href' : value['url'], 'target' : that.params['target']}, value['title'])
                    )
                );
            });
            // Show tooltip
            that.components['tooltip']
                .setTarget(params['node'])
                .setTitle(cm.dateFormat(params['date'], that.params['format'], that.lang()))
                .setContent(myNodes['content'])
                .show();
        }
    };

    /* ******* MAIN ******* */

    that.addData = function(data){
        that.params['data'] = cm.merge(that.params['data'], data);
        that.components['calendar'].renderMonth();
        return that;
    };

    that.replaceData = function(data){
        that.params['data'] = data;
        that.components['calendar'].renderMonth();
        return that;
    };

    init();
});
cm.define('Com.CodeHighlight', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'language' : 'javascript',
        'lineNumbers' : true,
        'customEvents' : true,
        'disabled' : false,
        'title' :''
    }
},
function(params){
    var that = this;

    that.components = {};
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        // Code Mirror
        cm.loadScript({
            'path' : 'CodeMirror',
            'src' : '%assetsUrl%/libs/codemirror_comp/codemirror.min.js?%version%',
            'callback' : function(path){
                if(path){
                    that.components['codemirror'] = path.fromTextArea(that.params['node'], {
                        'lineNumbers' : that.params['lineNumbers'],
                        'viewportMargin' : Infinity,
                        'mode' : that.params['language']
                    });
                    that.components['codemirror'].on('change', function(cm){
                        that.params['node'].value = cm.getValue();
                    });
                }
                // Enable / Disable
                if(that.disabled){
                    that.disable();
                }else{
                    that.enable();
                }
            }
        });
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', that.redraw);
        }
    };

    /* ******* PUBLIC ******* */

    that.redraw = function(){
        that.components['codemirror'] && that.components['codemirror'].refresh();
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        that.components['codemirror'] && that.components['codemirror'].setOption('readOnly', 'nocursor');
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        that.components['codemirror'] && that.components['codemirror'].setOption('readOnly', false);
        return that;
    };

    init();
});
cm.define('Com.CollapsibleLayout', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Storage'
    ],
    'events' : [
        'onRender',
        'onCollapseLeft',
        'onExpandLeft',
        'onCollapseRight',
        'onExpandRight'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'remember' : false
    }
},
function(params){
    var that = this;

    that.nodes = {
        'leftButton' : cm.Node('div'),
        'leftContainer' : cm.Node('div'),
        'rightButton': cm.Node('div'),
        'rightContainer' : cm.Node('div')
    };

    that.isLeftCollapsed = false;
    that.isRightCollapsed = false;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        var storageLeftCollapsed,
            storageRightCollapsed;
        // Left Sidebar
        cm.addEvent(that.nodes['leftButton'], 'click', toggleLeft);
        // Right sidebar
        cm.addEvent(that.nodes['rightButton'], 'click', toggleRight);
        // Check toggle class
        that.isLeftCollapsed = cm.isClass(that.params['node'], 'is-sidebar-left-collapsed');
        that.isRightCollapsed = cm.isClass(that.params['node'], 'is-sidebar-right-collapsed');
        // Check storage
        if(that.params['remember']){
            storageLeftCollapsed = that.storageRead('isLeftCollapsed');
            storageRightCollapsed = that.storageRead('isRightCollapsed');
            that.isLeftCollapsed = storageLeftCollapsed !== null ? storageLeftCollapsed : that.isLeftCollapsed;
            that.isRightCollapsed = storageRightCollapsed !== null ? storageRightCollapsed : that.isRightCollapsed;
        }
        // Check sidebars visibility
        if(!cm.inDOM(that.nodes['leftContainer']) || cm.getStyle(that.nodes['leftContainer'], 'display') == 'none'){
            that.isLeftCollapsed = true;
        }
        if(!cm.inDOM(that.nodes['rightContainer']) || cm.getStyle(that.nodes['rightContainer'], 'display') == 'none'){
            that.isRightCollapsed = true;
        }
        // Trigger events
        if(that.isLeftCollapsed){
            that.collapseLeft(true);
        }else{
            that.expandLeft(true);
        }
        if(that.isRightCollapsed){
            that.collapseRight(true);
        }else{
            that.expandRight(true);
        }
        that.triggerEvent('onRender');
    };

   var toggleRight = function(){
        if(that.isRightCollapsed){
            that.expandRight();
        }else{
            that.collapseRight();
        }
    };

    var toggleLeft = function(){
        if(that.isLeftCollapsed){
            that.expandLeft();
        }else{
            that.collapseLeft();
        }
    };

    /* ******* MAIN ******* */

    that.collapseLeft = function(isImmediately){
        that.isLeftCollapsed = true;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-left-expanded', 'is-sidebar-left-collapsed', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isLeftCollapsed', true);
        }
        that.triggerEvent('onCollapseLeft');
        return that;
    };

    that.expandLeft = function(isImmediately){
        that.isLeftCollapsed = false;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-left-collapsed', 'is-sidebar-left-expanded', true);
        setTimeout(function(){
            isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        }, 5);
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isLeftCollapsed', false);
        }
        that.triggerEvent('onExpandLeft');
        return that;
    };

    that.collapseRight = function(isImmediately){
        that.isRightCollapsed = true;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-right-expanded', 'is-sidebar-right-collapsed', true);
        setTimeout(function(){
            isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        }, 5);
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isRightCollapsed', true);
        }
        that.triggerEvent('onCollapseRight');
        return that;
    };

    that.expandRight = function(isImmediately){
        that.isRightCollapsed = false;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-right-collapsed', 'is-sidebar-right-expanded', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isRightCollapsed', false);
        }
        that.triggerEvent('onExpandRight');
        return that;
    };

    init();
});
cm.define('Com.Collector', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove',
        'onConstructStart',
        'onConstruct',
        'onDestructStart',
        'onDestruct'
    ],
    'params' : {
        'node' : 'document.body',
        'name' : '',
        'attribute' : 'data-element',
        'autoInit' : false
    }
},
function(params){
    var that = this;

    that.isChanged = false;
    that.stackList = [];
    that.stackNodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(that.params['autoInit']){
            cm.forEach(cm._defineStack, function(classConstructor){
                that.add(classConstructor.prototype._name['full'], function(node){
                    new classConstructor({
                        'node' : node
                    });
                }, null, classConstructor.prototype.params['collectorPriority']);
            });
        }
    };

    var findNodes = function(parentNode, name){
        var nodes = [];
        // Find element in specified node
        if(parentNode.getAttribute(that.params['attribute']) == name){
            nodes.push(parentNode);
        }
        // Search for nodes in specified node
        nodes = nodes.concat(
            cm.clone(
                cm.getByAttr(that.params['attribute'], name, parentNode)
            )
        );
        return nodes;
    };

    var addNodes = function(parentNode, name){
        var nodes = findNodes(parentNode, name);
        // Filter off existing nodes
        nodes = nodes.filter(function(node){
            return !cm.inArray(that.stackNodes[name], node);
        });
        // Push new nodes in constructed nodes array
        that.stackNodes[name] = that.stackNodes[name].concat(nodes);
        return nodes;
    };

    var removeNodes = function(parentNode, name){
        var nodes = findNodes(parentNode, name),
            inArray;
        // Filter off not existing nodes and remove existing from global array
        nodes = nodes.filter(function(node){
            if(inArray = cm.inArray(that.stackNodes[name], node)){
                that.stackNodes[name].splice(that.stackNodes[name].indexOf(node), 1);
            }
            return inArray;
        });
        return nodes;
    };

    var sortList = function(){
        if(that.isChanged){
            that.stackList.sort(function(a, b){
                return a['priority'] - b['priority'];
            });
        }
        that.isChanged = false;
    };

    var constructAll = function(parentNode){
        var processNodes = {},
            processArray = that.stackList.slice(0);
        // Find new nodes to process
        cm.forEach(that.stackNodes, function(item, name){
            processNodes[name] = addNodes(parentNode, name);
        });
        // Process nodes
        cm.forEach(processArray, function(item){
            cm.forEach(processNodes[item['name']], function(node){
                item['construct'] && item['construct'](node, item['priority']);
            });
        });
    };

    var constructItem = function(parentNode, name){
        var processNodes = addNodes(parentNode, name),
            processArray = that.stackList.filter(function(item){
                return item['name'] === name;
            });
        cm.forEach(processArray, function(item){
            cm.forEach(processNodes, function(node){
                item['construct'] && item['construct'](node, item['priority']);
            });
        });
    };

    var destructAll = function(parentNode){
        var processNodes = {},
            processArray = that.stackList.slice(0);
        if(cm.isNode(parentNode)){
            cm.forEach(that.stackNodes, function(item, name){
                processNodes[name] = removeNodes(parentNode, name);
            });
            cm.forEach(processArray, function(item){
                cm.forEach(processNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
        }else{
            cm.forEach(processArray, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
            that.stackNodes = [];
        }
    };

    var destructItem = function(parentNode, name){
        var processNodes = {},
            processArray = that.stackList.filter(function(item){
                return item['name'] === name;
            });
        if(cm.isNode(parentNode)){
            processNodes = removeNodes(parentNode, name);
            cm.forEach(processArray, function(item){
                cm.forEach(processNodes, function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
        }else{
            cm.forEach(processArray, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
            delete that.stackNodes[name];
        }
    };

    /* ******* PUBLIC ******* */

    that.add = function(name, construct, destruct, priority){
        if(name){
            if(!that.stackNodes[name]){
                that.stackNodes[name] = [];
            }
            var item = {
                'name' : name,
                'priority' : priority || 0,
                'construct' : construct,
                'destruct' : destruct
            };
            if(typeof priority != 'undefined' && cm.isNumber(priority)){
                that.stackList.splice(priority, 0, item);
            }else{
                that.stackList.push(item);
            }
            that.isChanged = true;
            that.triggerEvent('onAdd', item);
        }
        return that;
    };

    that.remove = function(name, construct, destruct){
        if(name){
            if(typeof construct == 'undefined'){
                that.stackList = that.stackList.filter(function(item){
                    return !(item['name'] === name);
                });
            }else{
                that.stackList = that.stackList.filter(function(item){
                    return !(item['name'] === name && item['construct'] === construct && item['destruct'] === destruct);
                });
            }
            that.isChanged = true;
            that.triggerEvent('onRemove', {
                'name' : name
            });
        }
        return that;
    };

    that.construct = function(node, name){
        var timer = Date.now();
        node = node || document.body;
        that.triggerEvent('onConstructStart', {
            'node' : node,
            'name' : name
        });
        sortList();
        if(name){
            constructItem(node, name);
        }else{
            constructAll(node);
        }
        that.triggerEvent('onConstruct', {
            'node' : node,
            'name' : name
        });
        cm.errorLog({
            'type' : 'common',
            'name' : 'Com.Collector',
            'message' : ['Construct time', (Date.now() - timer), 'ms.'].join(' ')
        });
        return that;
    };

    that.destruct = function(node, name){
        var timer = Date.now();
        node = node || null;
        that.triggerEvent('onDestructStart', {
            'node' : node,
            'name' : name
        });
        sortList();
        if(name){
            destructItem(node, name);
        }else{
            destructAll(node);
        }
        that.triggerEvent('onDestruct', {
            'node' : node,
            'name' : name
        });
        cm.errorLog({
            'type' : 'common',
            'name' : 'Com.Collector',
            'message' : ['Destruct time', (Date.now() - timer), 'ms.'].join(' ')
        });
        return that;
    };

    init();
});
cm.define('Com.ColorPicker', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Storage',
        'Stack'
    ],
    'require' : [
        'Com.Tooltip',
        'Com.Palette'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear'
    ],
    'params' : {
        'input' : null,                                     // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'embedStructure' : 'replace',
        'name' : '',
        'value' : null,                                     // Color string: transparent | hex | rgba.
        'defaultValue' : 'transparent',
        'title' : '',
        'showLabel' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'renderInBody' : true,
        'disabled' : false,
        'size' : 'default',                                 // default | full
        'icons' : {
            'picker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'langs' : {
            'Transparent' : 'Transparent',
            'Clear' : 'Clear'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__colorpicker__tooltip',
            'top' : 'cm._config.tooltipTop'
        },
        'Com.Palette' : {
            'setOnInit' : false
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.value = null;
    that.previousValue = null;
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        // Add to stack
        that.addToStack(that.nodes['container']);
        // Set
        that.set(that.value, false);
        // Trigger render event
        that.triggerEvent('onRender', that.value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
            that.value = that.params['node'].value;
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.value = that.params['value'] || that.value || that.params['defaultValue'];
        that.disabled = that.params['disabled'];
        that.params['Com.Palette']['name'] = [that.params['name'], 'palette'].join('-');
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        that.nodes['container'] = cm.Node('div', {'class' : 'com__colorpicker'},
            that.nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            that.nodes['target'] = cm.Node('div', {'class' : 'pt__input'},
                that.nodes['input'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
                that.nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['picker']})
            ),
            that.nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                that.nodes['paletteContainer'] = cm.Node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Size
        if(!cm.isEmpty(that.params['size'])){
            cm.addClass(that.nodes['container'], ['size', that.params['size']].join('-'));
        }
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            that.nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            that.nodes['container'].id = that.params['node'].id;
        }
        // Name
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Label
        if(!that.params['showLabel']){
            cm.addClass(that.nodes['target'], 'is-no-label');
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(that.nodes['container'], 'has-clear-button');
            that.nodes['container'].appendChild(
                that.nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear')})
            );
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(that.nodes['container']);
    };

    var setLogic = function(){
        // Add events on input to makes him clear himself when user wants that
        cm.addEvent(that.nodes['input'], 'keydown', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                that.clear();
                that.components['tooltip'].hide();
            }
        });
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(that.nodes['clearButton'], 'click', function(){
                that.clear();
                that.components['tooltip'].hide();
            });
        }
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : that.nodes['container'],
                'content' : that.nodes['menuContainer'],
                'target' : that.nodes['target'],
                'events' : {
                    'onShowStart' : show,
                    'onHideStart' : hide
                }
            })
        );
        // Render palette
        that.components['palette'] = new Com.Palette(
            cm.merge(that.params['Com.Palette'], {
                'node' : that.nodes['menuContainer'],
                'events' : {
                    'onChange' : function(my, value){
                        set(my.get('rgb'), true);
                        that.components['tooltip'].hide();
                    }
                }
            })
        );
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var set = function(color, triggerEvents){
        that.previousValue = that.value;
        if(cm.isEmpty(color)){
            color = that.params['defaultValue'];
        }
        that.value = color;
        that.components['palette'].set(that.value, false);
        that.nodes['hidden'].value = that.components['palette'].get('rgb');
        if(that.value == 'transparent'){
            if(that.params['showLabel']){
                that.nodes['input'].value = that.lang('Transparent');
            }
            cm.replaceClass(that.nodes['input'], 'input-dark input-light', 'input-transparent');
        }else{
            if(that.params['showLabel']){
                that.nodes['input'].value = that.components['palette'].get('hex');
            }
            that.nodes['input'].style.backgroundColor = that.components['palette'].get('hex');
            if(that.components['palette'].isDark()){
                cm.replaceClass(that.nodes['input'], 'input-transparent input-light', 'input-dark');
            }else{
                cm.replaceClass(that.nodes['input'], 'input-transparent input-dark', 'input-light');
            }
        }
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            eventOnChange();
        }
    };

    var hide = function(){
        that.nodes['input'].blur();
        cm.removeClass(that.nodes['container'], 'active');
        that.components['palette'].set(that.value, false);
    };

    var show = function(){
        cm.addClass(that.nodes['container'], 'active');
        that.components['palette'].redraw();
    };

    var eventOnChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.set = function(color, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        set(color, triggerEvents);
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Set default color value
        set(that.params['defaultValue'], false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            eventOnChange();
        }
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(that.nodes['container'], 'disabled');
        that.nodes['input'].disabled = true;
        that.components['tooltip'].disable();
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(that.nodes['container'], 'disabled');
        that.nodes['input'].disabled = false;
        that.components['tooltip'].enable();
        return that;
    };

    init();
});
Com.Elements['Columns'] = {};

Com['GetColumns'] = function(id){
    return Com.Elements.Columns[id] || null;
};

cm.define('Com.Columns', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'required' : [
        'Com.Draggable'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove',
        'onChange',
        'onResize',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'columns' : false,                  // Deprecated, use 'node' parameter instead.
        'node' : cm.node('div'),
        'container' : false,
        'name' : '',
        'renderStructure' : false,
        'minColumnWidth' : 48,              // in px
        'data' : [],
        'isEditing' : true,
        'customEvents' : true
    }
},
function(params){
    var that = this,
        nodes = {},
        current;

    that.isEditing = null;
    that.pointerType = null;
    that.items = [];
    that.chassis = [];

    /* *** INIT *** */

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        renderChassis();
        that.params['isEditing'] && that.enableEditing();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['columns'])){
            that.params['node'] = that.params['columns'];
        }
    };

    /* *** STRUCTURE *** */

    var render = function(){
        if(that.params['renderStructure']){
            renderStructure();
        }else if(that.params['node']){
            collect();
        }
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(nodes['container'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(nodes['container'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
    };

    var collect = function(){
        var columns;
        // Collect nodes
        nodes['container'] = that.params['node'];
        nodes['inner'] = cm.getByAttr('data-com__columns', 'inner', nodes['container'])[0];
        nodes['holder'] = cm.getByAttr('data-com__columns', 'holder', nodes['container'])[0];
        // Set editable class
        //cm.addClass(nodes['container'], 'is-editable');
        // Collect only first child columns
        columns = cm.clone(cm.getByAttr('data-com__columns', 'column', nodes['holder']) || []);
        columns = columns.filter(function(item){
            var past = true;
            cm.forEach(columns, function(testItem){
                if(cm.isParent(testItem, item)){
                    past = false;
                }
            });
            return past;
        });
        cm.forEach(columns, collectColumn);
    };

    var renderStructure = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__columns'},
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['holder'] = cm.Node('div', {'class' : 'container'})
            )
        );
        // Render Columns
        cm.forEach(that.params['data'], renderColumn);
        // Embed
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }
    };

    /* *** COLUMNS *** */

    var collectColumn = function(container){
        var item = {
            'container' : container,
            'inner' : cm.getByAttr('data-com__columns', 'column-inner', container)[0] || cm.Node('div'),
            'width' : container.style.width
        };
        // Render ruler
        renderRuler(item);
        // Push to items array
        that.items.push(item);
    };

    var renderColumn = function(item, execute){
        item = cm.merge({
            'width' : '0%'
        }, item);
        // Structure
        item['container'] = cm.Node('div', {'class' : 'com__column'},
            item['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render ruler
        renderRuler(item);
        // Push to items array
        that.items.push(item);
        // Embed
        nodes['holder'].appendChild(item['container']);
        if(execute){
            // API onAdd event
            that.triggerEvent('onAdd', item);
        }
        return item;
    };

    var removeColumn = function(item, execute){
        var index = that.items.indexOf(item);
        cm.remove(item['container']);
        that.items.splice(index, 1);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var removeLastColumn = function(execute){
        var item = that.items.pop();
        cm.remove(item['container']);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var setEqualDimensions = function(){
        var itemsLength = that.items.length,
            width = (100 / itemsLength).toFixed(2);

        cm.forEach(that.items, function(item){
            item['width'] = [width, '%'].join('');
            item['container'].style.width = item['width'];
            item['rulerCounter'].innerHTML = item['width'];
        });
        // API onResize event
        that.triggerEvent('onResize', that.items);
        that.triggerEvent('onChange', that.items);
    };

    /* *** RULERS METHODS *** */

    var renderRuler = function(item){
        // Structure
        item['rulerContainer'] = cm.Node('div', {'class' : 'com__columns__ruler'},
            item['ruler'] = cm.Node('div', {'class' : 'pt__ruler is-horizontal is-small'},
                cm.Node('div', {'class' : 'line line-top'}),
                item['rulerCounter'] = cm.Node('div', {'class' : 'counter'}, item['width']),
                cm.Node('div', {'class' : 'line line-bottom'})
            )
        );
        // Embed
        cm.insertFirst(item['rulerContainer'], item['inner']);
    };

    /* *** CHASSIS METHODS *** */

    var renderChassis = function(){
        that.chassis = [];
        var count = that.items.length - 1;
        cm.forEach(count, renderChassisItem);
    };

    var removeChassis = function(){
        cm.forEach(that.chassis, function(chassis){
            cm.remove(chassis['container']);
        });
        that.chassis = [];
    };

    var updateChassis = function(){
        removeChassis();
        renderChassis();
    };

    var redrawChassis = function(){
        cm.forEach(that.chassis, function(item){
            redrawChassisItem(item);
        });
    };

    var renderChassisItem = function(i){
        var chassis = {
            'index' : i
        };
        // Structure
        chassis['container'] = cm.Node('div', {'class' : 'com__columns__chassis'},
            chassis['drag'] = cm.Node('div', {'class' : 'pt__drag is-horizontal'},
                cm.Node('div', {'class' : 'line'}),
                cm.Node('div', {'class' : 'drag'},
                    cm.Node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Styles
        redrawChassisItem(chassis);
        // Push to chassis array
        that.chassis.push(chassis);
        // Add events
        cm.addEvent(chassis['container'], 'touchstart', function(e){
            start(e, chassis);
        });
        cm.addEvent(chassis['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        nodes['inner'].appendChild(chassis['container']);
    };

    var redrawChassisItem = function(chassis){
        var ratio = nodes['holder'].offsetWidth / 100,
            i = chassis['index'],
            left = ((cm.getRealX(that.items[i]['container']) - cm.getRealX(nodes['holder']) + that.items[i]['container'].offsetWidth) / ratio).toFixed(2);
        // Structure
        chassis['container'].style.left = [left, '%'].join('');
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(current){
            return;
        }
        that.pointerType = e.type;
        // Current
        if(e.ctrlKey){
            blockContextMenu();
            setEqualDimensions();
            redrawChassis();
        }else{
            // Hide IFRAMES and EMBED tags
            cm.hideSpecialTags();
            // Get columns
            var index = that.chassis.indexOf(chassis),
                leftColumn = that.items[index],
                rightColumn = that.items[index + 1];

            current = {
                'index' : index,
                'offset' : cm.getRealX(nodes['holder']),
                'ratio' : nodes['holder'].offsetWidth / 100,
                'chassis' : chassis,
                'left' : {
                    'column' : leftColumn,
                    'offset' : cm.getRealX(leftColumn['container'])
                },
                'right' : {
                    'column' : rightColumn,
                    'offset' : cm.getRealX(rightColumn['container']) + rightColumn['container'].offsetWidth
                }
            };
            // Add move event on document
            cm.addClass(nodes['container'], 'is-active');
            cm.addClass(current['chassis']['drag'], 'is-active');
            cm.addClass(current['left']['column']['ruler'], 'is-active');
            cm.addClass(current['right']['column']['ruler'], 'is-active');
            cm.addClass(document.body, 'pt__drag__body--horizontal');
            // Add events
            switch(that.pointerType){
                case 'mousedown' :
                    cm.addEvent(window, 'mousemove', move);
                    cm.addEvent(window, 'mouseup', stop);
                    break;
                case 'touchstart' :
                    cm.addEvent(window, 'touchmove', move);
                    cm.addEvent(window, 'touchend', stop);
                    break;
            }
        }
    };

    var move = function(e){
        cm.preventDefault(e);
        // Calculate sizes and positions
        var position = cm.getEventClientPosition(e),
            toFixed = e.shiftKey ? 0 : 2,
            leftWidth = position['left'] - current['left']['offset'],
            rightWidth = current['right']['offset'] - position['left'];
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            current['left']['column']['width'] = [(leftWidth / current['ratio']).toFixed(toFixed), '%'].join('');
            current['right']['column']['width'] = [(rightWidth / current['ratio']).toFixed(toFixed), '%'].join('');

            current['left']['column']['container'].style.width = current['left']['column']['width'];
            current['right']['column']['container'].style.width = current['right']['column']['width'];
            current['chassis']['container'].style.left = [((position['left'] - current['offset']) / current['ratio']).toFixed(toFixed), '%'].join('');

            current['left']['column']['rulerCounter'].innerHTML = current['left']['column']['width'];
            current['right']['column']['rulerCounter'].innerHTML = current['right']['column']['width'];
        }
        // API onResize event
        that.triggerEvent('onChange', that.items);
    };

    var stop = function(){
        // Remove move event from document
        cm.removeClass(nodes['container'], 'is-active');
        cm.removeClass(current['chassis']['drag'], 'is-active');
        cm.removeClass(current['left']['column']['ruler'], 'is-active');
        cm.removeClass(current['right']['column']['ruler'], 'is-active');
        cm.removeClass(document.body, 'pt__drag__body--horizontal');
        // Remove events
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        current = null;
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', that.items);
    };

    /* *** HELPERS *** */

    var blockContextMenu = function(){
        cm.addEvent(window, 'contextmenu', contextMenuHandler);
        cm.addEvent(window, 'mouseup', restoreContextMenu);
    };

    var restoreContextMenu = function(){
        cm.removeEvent(window, 'contextmenu', contextMenuHandler);
        cm.removeEvent(window, 'mouseup', restoreContextMenu);
    };

    var contextMenuHandler = function(e){
        cm.preventDefault(e);
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(nodes['container'], 'is-editing is-editable');
            that.redraw();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(nodes['container'], 'is-editing is-editable');
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.redraw = function(){
        redrawChassis();
        return that;
    };

    that.setColumnsCount = function(count){
        var itemsLength = that.items.length;
        if(!count || itemsLength == count){
            return that;
        }
        if(itemsLength < count){
            // Add new columns
            cm.forEach(count - itemsLength, function(){
                renderColumn({}, true);
            });
        }else{
            // Remove columns from last
            while(that.items.length > count){
                removeLastColumn(true);
            }
        }
        setEqualDimensions();
        updateChassis();
        return that;
    };

    that.get = function(){
        return that.items;
    };

    init();
});
cm.define('Com.ColumnsHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onChange',
        'onResize',
        'onDragStart',
        'onDragMove',
        'onDragStop',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'items' : [],
        'showDrag' : true,
        'minColumnWidth' : 48,              // in px
        'isEditing' : true,
        'customEvents' : true,
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'url' : '',                                             // Request URL. Variables: %items%, %callback% for JSONP.
            'params' : ''                                           // Params object. %items%, %callback% for JSONP.
        }
    }
},
function(params){
    var that = this;

    that.items = [];
    that.chassis = [];
    that.current = null;
    that.pointerType = null;
    that.isEditing = null;
    that.isRendered = false;
    that.isAjax = false;
    that.isProcess = false;
    that.ajaxHandler = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
    };

    var render = function(){
        renderChassis();
        // Add window event
        cm.addEvent(window, 'resize', function(){
            that.redraw();
        });
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(that.params['node'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(that.params['node'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
        // Editing
        that.params['isEditing'] && that.enableEditing();
    };

    var renderChassis = function(){
        if(that.isEditing && !that.isRendered){
            that.items = [];
            that.chassis = [];
            cm.forEach(that.params['items'], function(item, i){
                that.items.push({
                    'container' : item
                });
                if(i < that.params['items'].length - 1){
                    renderChassisItem(i);
                }
            });
            that.isRendered = true;
        }
    };

    var renderChassisItem = function(i){
        var chassis = {
            'index' : i
        };
        // Structure
        chassis['container'] = cm.node('div', {'class' : 'com__columns__chassis'},
            chassis['inner'] = cm.node('div', {'class' : 'pt__drag is-horizontal'},
                cm.node('div', {'class' : 'line'})
            )
        );
        if(that.params['showDrag']){
            chassis['inner'].appendChild(
                cm.node('div', {'class' : 'drag'},
                    cm.node('div', {'class' : 'icon draggable'})
                )
            );
        }else{
            chassis['inner'].appendChild(
                cm.node('div', {'class' : 'helper'})
            );
        }
        // Styles
        redrawChassisItem(chassis);
        // Push to chassis array
        that.chassis.push(chassis);
        // Add events
        cm.addEvent(chassis['container'], 'touchstart', function(e){
            start(e, chassis);
        });
        cm.addEvent(chassis['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        that.params['node'].appendChild(chassis['container']);
    };

    var redrawChassisItem = function(chassis){
        var ratio = that.params['node'].offsetWidth / 100,
            i = chassis['index'],
            left = ((cm.getRealX(that.items[i]['container']) - cm.getRealX(that.params['node']) + that.items[i]['container'].offsetWidth) / ratio).toFixed(2);
        chassis['container'].style.left = [left, '%'].join('');
    };

    var redrawChassis = function(){
        cm.forEach(that.chassis, function(item){
            redrawChassisItem(item);
        });
    };

    var removeChassis = function(){
        cm.forEach(that.chassis, function(item){
            cm.remove(item['container']);
        });
        that.items = [];
        that.chassis = [];
        that.isRendered = false;
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(that.current){
            return;
        }
        that.pointerType = e.type;
        // Abort ajax handler
        if(that.isProcess){
            that.abort();
        }
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Current
        var index = that.chassis.indexOf(chassis),
            leftColumn = that.items[index],
            rightColumn = that.items[index + 1];

        that.current = {
            'index' : index,
            'offset' : cm.getRealX(that.params['node']),
            'ratio' : that.params['node'].offsetWidth / 100,
            'chassis' : chassis,
            'left' : {
                'column' : leftColumn,
                'offset' : cm.getRealX(leftColumn['container'])
            },
            'right' : {
                'column' : rightColumn,
                'offset' : cm.getRealX(rightColumn['container']) + rightColumn['container'].offsetWidth
            }
        };
        // Add move event on document
        cm.addClass(that.params['node'], 'is-chassis-active');
        cm.addClass(that.current['chassis']['inner'], 'is-active');
        cm.addClass(document.body, 'pt__drag__body--horizontal');
        // Add events
        switch(that.pointerType){
            case 'mousedown' :
                cm.addEvent(window, 'mousemove', move);
                cm.addEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.addEvent(window, 'touchmove', move);
                cm.addEvent(window, 'touchend', stop);
                break;
        }
        that.triggerEvent('onDragStart', that.current);
        return true;
    };

    var move = function(e){
        cm.preventDefault(e);
        // Calculate sizes and positions
        var position = cm.getEventClientPosition(e),
            leftWidth = position['left'] - that.current['left']['offset'],
            rightWidth = that.current['right']['offset'] - position['left'];
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            that.current['left']['column']['width'] = [(leftWidth / that.current['ratio']).toFixed(2), '%'].join('');
            that.current['right']['column']['width'] = [(rightWidth / that.current['ratio']).toFixed(2), '%'].join('');

            that.current['left']['column']['container'].style.width = that.current['left']['column']['width'];
            that.current['right']['column']['container'].style.width = that.current['right']['column']['width'];
            that.current['chassis']['container'].style.left = [((position['left'] - that.current['offset']) / that.current['ratio']).toFixed(2), '%'].join('');
        }
        // API onResize event
        that.triggerEvent('onChange', that.items);
        that.triggerEvent('onDragMove', that.current);
    };

    var stop = function(){
        var config;
        // Remove move event from document
        cm.removeClass(that.params['node'], 'is-chassis-active');
        cm.removeClass(that.current['chassis']['inner'], 'is-active');
        cm.removeClass(document.body, 'pt__drag__body--horizontal');
        // Remove events
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', that.items);
        that.triggerEvent('onDragStop', that.current);
        that.current = null;
        // Ajax
        if(that.isAjax){
            config = cm.clone(that.params['ajax']);
            that.ajaxHandler = that.callbacks.request(that, config);
        }
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        var items = [];
        cm.forEach(that.items, function(item){
            items.push(item['width']);
        });
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%items%' : items
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%items%' : items
        });
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.start = function(that){
        that.isProcess = true;
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            renderChassis();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            removeChassis();
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.redraw = function(){
        if(that.isEditing){
            redrawChassis();
        }
        return that;
    };

    init();
});
cm.define('Com.DateSelect', {
    'modules' : [
        'Params',
        'DataConfig',
        'Langs',
        'Events',
        'Structure',
        'Stack'
    ],
    'events' : [
        'onSelect',
        'onChange'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'name' : '',
        'embedStructure' : 'replace',
        'container' : null,
        'format' : 'cm._config.dateFormat',
        'startYear' : 1950,
        'endYear' : new Date().getFullYear() + 10,
        'renderSelectsInBody' : true,
        'langs' : {
            'Day' : 'Day',
            'Month' : 'Month',
            'Year' : 'Year',
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {},
        defaultDate = {
            'day' : '00',
            'month' : '00',
            'year' : '0000'
        };

    that.isDestructed = false;
    that.previous = cm.clone(defaultDate);
    that.selected = cm.clone(defaultDate);

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(nodes['container']);
        // Set selected date
        set(that.params['node'].value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__dateselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'pt__toolbar bottom'},
                cm.Node('div', {'class' : 'inner clear'},
                    cm.Node('ul', {'class' : 'group'},
                        nodes['year'] = cm.Node('li', {'class' : 'is-field small'}),
                        nodes['month'] = cm.Node('li', {'class' : 'is-field medium'}),
                        nodes['day'] = cm.Node('li', {'class' : 'is-field x-small'})
                    )
                )
            )
        );
        renderSelects();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(nodes['container']);
    };

    var renderSelects = function(){
        var data, i;
        // Days
        data = [
            {'value' : '00', 'text' : that.lang('Day')}
        ];
        for(i = 1; i <= 31; i++){
            data.push({'value' : cm.addLeadZero(i), 'text' : i});
        }
        components['day'] = new Com.Select({
            'container' : nodes['day'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' :  function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['day'] = item;
                    setMisc(true);
                }
            }
        });
        // Months
        data = [
            {'value' : '00', 'text' : that.lang('Month')}
        ];
        cm.forEach(that.lang('months'), function(month, i){
            data.push({'value' : cm.addLeadZero(parseInt(i + 1)), 'text' : month});
        });
        components['month'] = new Com.Select({
            'container' : nodes['month'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['month'] = item;
                    setMisc(true);
                }
            }
        });
        // Years
        data = [
            {'value' : '0000', 'text' : that.lang('Year')}
        ];
        for(i = that.params['endYear']; i >= that.params['startYear']; i--){
            data.push({'value' : i, 'text' : i});
        }
        components['year'] = new Com.Select({
            'container' : nodes['year'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['year'] = item;
                    setMisc(true);
                }
            }
        });
    };

    var set = function(str, execute){
        that.previous = cm.clone(that.selected);
        if(!str || str == toStr(defaultDate)){
            that.selected = cm.clone(defaultDate);
        }else{
            if(str instanceof Date){
                that.selected = fromStr(cm.parseDate(str));
            }else{
                that.selected = fromStr(str);
            }
        }
        components['day'].set(that.selected['day'], false);
        components['month'].set(that.selected['month'], false);
        components['year'].set(that.selected['year'], false);
        setMisc(execute);
    };

    var setMisc = function(execute){
        nodes['hidden'].value = toStr(that.selected);
        if(execute){
            // API onSelect event
            that.triggerEvent('onSelect', toStr(that.selected));
            // API onChange event
            if(toStr(that.selected) != toStr(that.previous)){
                that.triggerEvent('onChange', toStr(that.selected));
            }
        }
    };

    var fromStr = function(str, format){
        var o = {},
            convertFormats = {
                '%Y' : 'YYYY',
                '%m' : 'mm',
                '%d' : 'dd'
            },
            formats = {
                'YYYY' : function(value){
                    o['year'] = value;
                },
                'mm' : function(value){
                    o['month'] = value;
                },
                'dd' : function(value){
                    o['day'] = value;
                }
            },
            fromIndex = 0;
        format = format || that.params['format'];
        // Parse
        cm.forEach(convertFormats, function(item, key){
            format = format.replace(key, item);
        });
        cm.forEach(formats, function(item, key){
            fromIndex = format.indexOf(key);
            while(fromIndex != -1){
                item(str.substr(fromIndex, key.length));
                fromIndex = format.indexOf(key, fromIndex + 1);
            }
        });
        return o;
    };

    var toStr = function(o, format){
        var str = format || that.params['format'],
            formats = function(o){
                return {
                    '%Y' : function(){
                        return o['year'];
                    },
                    '%m' : function(){
                        return o['month'];
                    },
                    '%d' : function(){
                        return o['day'];
                    }
                };
            };
        cm.forEach(formats(o), function(item, key){
            str = str.replace(key, item);
        });
        return str;
    };

    /* ******* PUBLIC ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(format){
        format = format || that.params['format'];
        return toStr(that.selected, format);
    };

    that.getDate = function(){
        return that.selected;
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('date-select', {
    'node' : cm.node('input', {'type' : 'text'}),
    'constructor' : 'Com.DateSelect'
});
Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

cm.define('Com.Datepicker', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Structure',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'input' : null,                                                     // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'customEvents' : true,
        'renderInBody' : true,
        'format' : 'cm._config.dateFormat',
        'displayFormat' : 'cm._config.displayDateFormat',
        'isDateTime' : false,
        'dateTimeFormat' : 'cm._config.dateTimeFormat',
        'displayDateTimeFormat' : 'cm._config.displayDateTimeFormat',
        'minutesInterval' : 1,
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'startWeekDay' : 0,
        'showTodayButton' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'showPlaceholder' : true,
        'title' : '',
        'placeholder' : '',
        'menuMargin' : 4,
        'value' : 0,
        'disabled' : false,
        'icons' : {
            'datepicker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'langs' : {
            'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'Clear date' : 'Clear date',
            'Today' : 'Today',
            'Now' : 'Now',
            'Time' : 'Time:'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : false,
            'className' : 'com__datepicker__tooltip',
            'top' : 'cm._config.tooltipTop'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    that.date = null;
    that.value = null;
    that.previousValue = null;
    that.format = null;
    that.displayFormat = null;
    that.disabled = false;
    that.isDestructed = null;

    var init = function(){
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        setEvents();
        // Add to stack
        that.addToStack(nodes['container']);
        // Set selected date
        if(that.params['value']){
            that.set(that.params['value'], that.format, false);
        }else{
            that.set(that.params['node'].value, that.format, false);
        }
        // Trigger events
        that.triggerEvent('onRender', that.value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        if(that.params['value'] == 'now'){
            that.params['value'] = new Date();
        }
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
        that.format = that.params['isDateTime']? that.params['dateTimeFormat'] : that.params['format'];
        that.displayFormat = that.params['isDateTime']? that.params['displayDateTimeFormat'] : that.params['displayFormat'];
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com__datepicker-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['target'] = cm.Node('div', {'class' : 'pt__input has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text'}),
                nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['datepicker']})
            ),
            nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                nodes['calendarContainer'] = cm.Node('div', {'class' : 'calendar-holder'})
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            nodes['container'].id = that.params['node'].id;
        }
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(that.params['showPlaceholder'] && !cm.isEmpty(that.params['placeholder'])){
            nodes['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(nodes['container'], 'has-clear-button');
            nodes['container'].appendChild(
                nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear date')})
            );
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            nodes['menuContainer'].appendChild(
                nodes['todayButton'] = cm.Node('div', {'class' : 'button today is-wide'}, that.lang(that.params['isDateTime']? 'Now' : 'Today'))
            );
        }
        // Time Select
        if(that.params['isDateTime']){
            nodes['timeHolder'] = cm.Node('div', {'class' : 'time-holder'},
                cm.Node('dl', {'class' : 'form-box'},
                    cm.Node('dt', that.lang('Time')),
                    nodes['timeContainer'] = cm.Node('dd')
                )
            );
            cm.insertAfter(nodes['timeHolder'], nodes['calendarContainer']);
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var setLogic = function(){
        cm.addEvent(nodes['input'], 'keypress', inputKeypressHandler);
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                that.clear();
                components['menu'].hide(false);
            });
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                that.set(new Date());
                components['menu'].hide(false);
            });
        }
        // Render tooltip
        components['menu'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : nodes['container'],
                'content' : nodes['menuContainer'],
                'target' : nodes['target'],
                'events' : {
                    'onShowStart' : onShow,
                    'onHideStart' : onHide
                }
            })
        );
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'node' : nodes['calendarContainer'],
            'renderSelectsInBody' : false,
            'className' : 'com__datepicker-calendar',
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs'],
            'renderMonthOnInit' : false,
            'events' : {
                'onMonthRender' : function(){
                    if(that.date){
                        components['calendar'].selectDay(that.date);
                    }
                },
                'onDayClick' : function(calendar, params){
                    if(!that.date){
                        that.date = new Date();
                    }
                    components['calendar'].unSelectDay(that.date);
                    that.date.setDate(params['day']);
                    components['calendar'].selectDay(that.date);
                    set(true);
                    if(!that.params['isDateTime']){
                        components['menu'].hide(false);
                    }
                }
            }
        });
        // Render Time Select
        if(that.params['isDateTime']){
            components['time'] = new Com.TimeSelect({
                'container' : nodes['timeContainer'],
                'renderSelectsInBody' : false,
                'minutesInterval' : that.params['minutesInterval']
            });
            components['time'].addEvent('onChange', function(){
                if(!that.date){
                    that.date = new Date();
                }
                components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
                components['calendar'].selectDay(that.date);
                set(true);
            });
        }
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var inputKeypressHandler = function(e){
        var value = nodes['input'].value;
        if(cm.isKey(e, 'enter')){
            cm.preventDefault(e);
            var date = new Date(value);
            if(cm.isEmpty(value) || !cm.isDateValid(date)){
                that.clear(true);
            }else{
                that.set(date, null, true);
            }
            components['menu'].hide(false);
        }
        if(cm.isKey(e, 'delete')){
            if(cm.isEmpty(value)){
                that.clear(true);
                components['menu'].hide(false);
            }
        }
    };

    var setEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var onShow = function(){
        renderCalendarMonth();
        // Set classes
        cm.addClass(nodes['container'], 'active');
        that.triggerEvent('onFocus', that.value);
    };

    var onHide = function(){
        setInputValues();
        nodes['input'].blur();
        cm.removeClass(nodes['container'], 'active');
        that.triggerEvent('onBlur', that.value);
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        if(that.date){
            // Set date
            that.date.setFullYear(components['calendar'].getFullYear());
            that.date.setMonth(components['calendar'].getMonth());
            // Set time
            if(that.params['isDateTime']){
                that.date.setHours(components['time'].getHours());
                that.date.setMinutes(components['time'].getMinutes());
                that.date.setSeconds(0);
            }
            // Set value
            that.value = cm.dateFormat(that.date, that.format, that.lang());
        }else{
            that.value = cm.dateFormat(false, that.format, that.lang());
        }
        setInputValues();
        renderCalendarMonth();
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
    };

    var renderCalendarMonth = function(){
        // Render calendar month
        if(that.date){
            components['calendar'].set(that.date.getFullYear(), that.date.getMonth());
        }
        components['calendar'].renderMonth();
    };

    var setInputValues = function(){
        if(that.date){
            nodes['input'].value = cm.dateFormat(that.date, that.displayFormat, that.lang());
            nodes['hidden'].value = that.value;
        }else{
            nodes['input'].value = '';
            nodes['hidden'].value = cm.dateFormat(false, that.format, that.lang());
        }
    };
    
    var onChange = function(){
        if(!that.previousValue || (!that.value && that.previousValue) || (that.value != that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(nodes['calendarContainer'], 'destruct', {
                'type' : 'child',
                'self' : false
            });
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(format){
        format = typeof format != 'undefined'? format : that.format;
        return cm.dateFormat(that.date, format, that.lang());
    };

    that.getDate = function(){
        return that.date;
    };

    that.getFullYear = function(){
        return that.date? that.date.getFullYear() : null;
    };

    that.getMonth = function(){
        return that.date? that.date.getMonth() : null;
    };

    that.getDay = function(){
        return that.date? that.date.getDate() : null;
    };

    that.getHours = function(){
        return that.date? that.date.getHours() : null;
    };

    that.getMinutes = function(){
        return that.date? that.date.getMinutes() : null;
    };

    that.set = function(str, format, triggerEvents){
        format = typeof format != 'undefined'? format : that.format;
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Get date
        if(cm.isEmpty(str)){
            that.clear();
            return that;
        }else if(cm.isDate(str)){
            that.date = str;
        }else{
            that.date = cm.parseDate(str, format);
        }
        // Set parameters into components
        components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
        if(that.params['isDateTime']){
            components['time'].set(that.date, null, false);
        }
        // Set date
        set(triggerEvents);
        return that;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Clear date
        that.date = null;
        // Clear components
        components['calendar'].clear(false);
        if(that.params['isDateTime']){
            components['time'].clear(false);
        }
        // Set date
        set(false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        nodes['input'].disabled = true;
        components['menu'].disable();
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(nodes['container'], 'disabled');
        nodes['input'].disabled = false;
        components['menu'].enable();
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});
cm.define('Com.Dialog', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onOpenStart',
        'onOpen',
        'onOpenEnd',
        'onCloseStart',
        'onClose',
        'onCloseEnd'
    ],
    'params' : {
        'container' : 'document.body',
        'name' : '',
        'size' : 'auto',                // auto | fullscreen
        'width' : 700,                  // number, %, px
        'height' : 'auto',              // number, %, px, auto
        'minHeight' : 0,                // number, %, auto, not applicable when using height
        'maxHeight' : 'auto',           // number, %, auto, not applicable when using height
        'position' : 'fixed',
        'indentY' : 24,
        'indentX' : 24,
        'theme' : 'theme-light',        // theme css class name, default: theme-default | theme-black | theme-light
        'className' : '',               // custom css class name
        'content' : cm.node('div'),
        'title' : '',
        'buttons' : false,
        'titleOverflow' : false,
        'titleReserve': true,
        'closeButtonOutside' : false,
        'closeButton' : true,
        'closeTitle' : true,
        'closeOnBackground' : false,
        'openTime' : null,
        'duration' : 'cm._config.animDuration',
        'autoOpen' : true,
        'appendOnRender' : false,
        'removeOnClose' : true,
        'destructOnRemove' : false,
        'scroll' : true,
        'documentScroll' : false,
        'icons' : {
            'closeInside' : 'icon default linked',
            'closeOutside' : 'icon default linked'
        },
        'langs' : {
            'closeTitle' : 'Close',
            'close' : ''
        }
    }
},
function(params){
    var that = this,
        contentHeight,
        nodes = {};

    that.isOpen = false;
    that.isFocus = false;
    that.isRemoved = false;
    that.isDestructed = false;
    that.openInterval = null;
    that.resizeInterval = null;

    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['content']);
        validateParams();
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(nodes['container']);
        // Trigger onRender event
        that.triggerEvent('onRender');
        // Open
        that.params['autoOpen'] && open();
    };

    var getLESSVariables = function(){
        that.params['duration'] = cm.getTransitionDurationFromLESS('ComDialog-Duration', that.params['duration']);
    };
    
    var validateParams = function(){
        if(that.params['size'] == 'fullscreen'){
            that.params['width'] = '100%';
            that.params['height'] = '100%';
            that.params['indentX'] = 0;
            that.params['indentY'] = 0;
        }
        if(that.params['openTime'] !== undefined && that.params['openTime'] !== null){
            that.params['duration'] = that.params['openTime'];
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__dialog'},
            nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
            nodes['window'] = cm.Node('div', {'class' : 'window'},
                nodes['windowInner'] = cm.Node('div', {'class' : 'inner'})
            )
        );
        if(that.params['appendOnRender']){
            that.params['container'].appendChild(nodes['container']);
        }
        // Set that.params styles
        nodes['container'].style.position = that.params['position'];
        nodes['window'].style.width = that.params['width'] + 'px';
        // Add CSS Classes
        !cm.isEmpty(that.params['theme']) && cm.addClass(nodes['container'], that.params['theme']);
        !cm.isEmpty(that.params['className']) && cm.addClass(nodes['container'], that.params['className']);
        if(that.params['size'] == 'fullscreen'){
            cm.addClass(nodes['container'], 'is-fullscreen');
        }
        if(that.params['titleReserve']){
            cm.addClass(nodes['container'], 'is-title-reserve');
        }
        // Render close button
        if(that.params['closeButtonOutside']){
            nodes['bg'].appendChild(
                nodes['closeOutside'] = cm.Node('div', {'class' : that.params['icons']['closeOutside']}, that.lang('close'))
            );
            if(that.params['closeTitle']){
                nodes['closeOutside'].title = that.lang('closeTitle');
            }
            cm.addEvent(nodes['closeOutside'], 'click', close);
        }
        if(that.params['closeButton']){
            cm.addClass(nodes['container'], 'has-close-inside');
            nodes['window'].appendChild(
                nodes['closeInside'] = cm.Node('div', {'class' : that.params['icons']['closeInside']}, that.lang('close'))
            );
            if(that.params['closeTitle']){
                nodes['closeInside'].title = that.lang('closeTitle');
            }
            cm.addEvent(nodes['closeInside'], 'click', close);
        }
        if(that.params['closeOnBackground']){
            cm.addClass(nodes['container'], 'has-close-background');
            cm.addEvent(nodes['bg'], 'click', close);
            if(that.params['closeTitle']){
                nodes['bg'].title = that.lang('closeTitle');
            }
        }
        // Set title
        renderTitle(that.params['title']);
        // Embed content
        renderContent(that.params['content']);
        // Embed buttons
        renderButtons(that.params['buttons']);
        // Events
        cm.addEvent(nodes['container'], 'mouseover', function(e){
            var target = cm.getEventTarget(e);
            if(cm.isParent(nodes['container'], target, true)){
                that.isFocus = true;
            }
        });
        cm.addEvent(nodes['container'], 'mouseout', function(e){
            var target = cm.getRelatedTarget(e);
            if(!cm.isParent(nodes['container'], target, true)){
                that.isFocus = false;
            }
        });
        // Resize
        animFrame(resize);
    };

    var renderTitle = function(title){
        if(!cm.isEmpty(title)){
            cm.removeClass(nodes['container'], 'has-no-title');
            // Remove old nodes
            cm.remove(nodes['title']);
            // Render new nodes
            nodes['title'] = cm.Node('div', {'class' : 'title'}, title);
            if(that.params['titleOverflow']){
                cm.addClass(nodes['title'], 'cm__text-overflow');
            }
            cm.insertFirst(nodes['title'], nodes['windowInner']);
        }else{
            cm.addClass(nodes['container'], 'has-no-title');
        }
    };

    var renderContent = function(node){
        if(!nodes['descr']){
            nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                    nodes['inner'] = cm.Node('div', {'class' : 'inner com__dialog__inner'})
                )
            );
            if(!that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-no-scroll');
            }
            if(nodes['title']){
                cm.insertAfter(nodes['descr'], nodes['title']);
            }else if(nodes['buttons']){
                cm.insertBefore(nodes['descr'], nodes['buttons']);
            }else{
                cm.insertLast(nodes['descr'], nodes['windowInner']);
            }
        }
        if(cm.isNode(node)){
            cm.clearNode(nodes['inner']).appendChild(node);
        }
    };

    var renderButtons = function(node){
        if(cm.isNode(node)){
            // Remove old nodes
            cm.remove(nodes['buttons']);
            // Render new nodes
            nodes['buttons'] = cm.Node('div', {'class' : 'buttons'}, node);
            cm.insertLast(nodes['buttons'], nodes['windowInner']);
        }
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var winHeight = nodes['container'].offsetHeight - (that.params['indentY'] * 2),
            winWidth = nodes['container'].offsetWidth - (that.params['indentX'] * 2),
            windowHeight = nodes['window'].offsetHeight,
            windowWidth = nodes['window'].offsetWidth,
            insetHeight = nodes['inner'].offsetHeight,

            AWidth,
            AHeight,
            NAHeight,

            maxHeight,
            minHeight,
            setHeight,
            setWidth;
        // Calculate available width / height
        AHeight = winHeight
            - (nodes['title'] && nodes['title'].offsetHeight || 0)
            - (nodes['buttons'] && nodes['buttons'].offsetHeight || 0)
            - cm.getIndentY(nodes['windowInner'])
            - cm.getIndentY(nodes['descr']);
        NAHeight = winHeight - AHeight;
        AWidth = winWidth;
        // Calculate min / max height
        if(that.params['maxHeight'] == 'auto'){
            maxHeight = AHeight;
        }else if(/%/.test(that.params['maxHeight'])){
            maxHeight = ((winHeight / 100) * parseFloat(that.params['maxHeight'])) - NAHeight;
        }else{
            if(/px/.test(that.params['maxHeight'])){
                that.params['maxHeight'] = parseFloat(that.params['maxHeight']);
            }
            maxHeight = that.params['maxHeight'] - NAHeight;
        }
        if(that.params['minHeight'] == 'auto'){
            minHeight = 0;
        }else if(/%/.test(that.params['minHeight'])){
            minHeight = ((winHeight / 100) * parseFloat(that.params['minHeight'])) - NAHeight;
        }else{
            if(/px/.test(that.params['minHeight'])){
                that.params['minHeight'] = parseFloat(that.params['minHeight']);
            }
            minHeight = that.params['minHeight'] - NAHeight;
        }
        // Calculate height
        if(that.params['height'] == 'auto'){
            if(insetHeight < minHeight){
                setHeight = minHeight;
            }else if(insetHeight > maxHeight){
                setHeight = maxHeight;
            }else{
                setHeight = insetHeight;
            }
        }else if(/%/.test(that.params['height'])){
            setHeight = ((winHeight / 100) * parseFloat(that.params['height'])) - NAHeight;
        }else{
            if(/px/.test(that.params['height'])){
                that.params['height'] = parseFloat(that.params['height']);
            }
            setHeight = that.params['height'] - NAHeight;
        }
        setHeight = Math.min(
            Math.max(setHeight, minHeight, 0),
            AHeight
        );
        // Calculate width
        if(/%/.test(that.params['width'])){
            setWidth = ((winWidth / 100) * parseFloat(that.params['width']));
        }else{
            if(/px/.test(that.params['width'])){
                that.params['width'] = parseFloat(that.params['width']);
            }
            setWidth = that.params['width'];
        }
        setWidth = Math.min(setWidth, AWidth);
        // Set window height
        if(windowHeight != setHeight + NAHeight || contentHeight != insetHeight){
            contentHeight = insetHeight;
            if(insetHeight <= setHeight){
                cm.removeClass(nodes['scroll'], 'is-scroll');
            }else if(that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-scroll');
            }
            nodes['scroll'].style.height = [setHeight, 'px'].join('');
        }
        // Set window width
        if(windowWidth != setWidth){
            nodes['window'].style.width = [setWidth, 'px'].join('');
        }
    };

    var open = function(params){
        params = {
            'onEnd' : function(){}
        };
        if(!that.isOpen){
            that.isOpen = true;
            that.isFocus = true;
            that.isRemoved = false;
            if(!cm.inDOM(nodes['container'])){
                that.params['container'].appendChild(nodes['container']);
            }
            nodes['container'].style.display = 'block';
            resizeHelper();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Add close event on Esc press
            cm.addEvent(window, 'keydown', windowClickEvent);
            // Animate
            cm.addClass(nodes['container'], 'is-open', true);
            that.openInterval && clearTimeout(that.openInterval);
            that.openInterval = setTimeout(function(){
                params['onEnd']();
                // Open Event
                that.triggerEvent('onOpen');
                that.triggerEvent('onOpenEnd');
            }, that.params['duration']);
            // Open Event
            that.triggerEvent('onOpenStart');
        }
    };

    var close = function(params){
        params = {
            'onEnd' : function(){}
        };
        if(that.isOpen){
            that.isOpen = false;
            that.isFocus = false;
            // Remove close event on Esc press
            cm.removeEvent(window, 'keydown', windowClickEvent);
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Animate
            cm.removeClass(nodes['container'], 'is-open', true);
            that.openInterval && clearTimeout(that.openInterval);
            that.openInterval = setTimeout(function(){
                clearResizeInterval();
                nodes['container'].style.display = 'none';
                // Remove Window
                that.params['removeOnClose'] && remove();
                params['onEnd']();
                // Close Event
                that.triggerEvent('onClose');
                that.triggerEvent('onCloseEnd');
            }, that.params['duration']);
            // Close Event
            that.triggerEvent('onCloseStart');
        }
    };

    var remove = function(){
        if(!that.isRemoved){
            that.isRemoved = true;
            if(that.params['destructOnRemove']){
                that.destruct();
            }
            // Remove dialog container node
            cm.remove(nodes['container']);
        }
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        // ESC key
        if(e.keyCode == 27){
            that.isFocus && close();
        }
    };

    var clearResizeInterval = function(){
        that.resizeInterval && clearTimeout(that.resizeInterval);
        that.resizeInterval = null;
    };

    /* ******* MAIN ******* */

    that.set = function(title, content, buttons){
        renderTitle(title);
        renderContent(content);
        renderButtons(buttons);
        return that;
    };

    that.setTitle = function(title){
        renderTitle(title);
        return that;
    };

    that.setContent = function(content){
        renderContent(content);
        return that;
    };

    that.setButtons = function(buttons){
        renderButtons(buttons);
        return that;
    };

    that.open = function(){
        open();
        return that;
    };

    that.close = function(){
        close();
        return that;
    };

    that.setWidth = function(width){
        that.params['width'] = width;
        return that;
    };

    that.setHeight = function(height){
        that.params['height'] = height;
        return that;
    };

    that.setMinHeight = function(height){
        that.params['minHeight'] = height;
        return that;
    };

    that.setMaxHeight = function(height){
        that.params['maxHeight'] = height;
        return that;
    };

    that.remove = function(){
        if(that.isOpen){
            close({
                'onEnd' : function(){
                    if(!that.params['removeOnClose']){
                        remove();
                    }
                }
            });
        }else{
            remove();
        }
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(nodes['container'], 'destruct', {
                'type' : 'child',
                'self' : false
            });
            that.removeFromStack();
            cm.remove(nodes['container']);
        }
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(nodes['window'], node, true);
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});
cm.define('Com.DialogContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.Dialog',
        'container' : 'document.body',
        'renderButtons' : false,
        'justifyButtons' : 'right',
        'params' : {
            'destructOnRemove' : false,
            'autoOpen' : false
        },
        'langs' : {
            'close' : 'Close'
        }
    }
},
function(params){
    var that = this;
    that.buttons = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.DialogContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Set Content
        if(cm.isObject(that.params['content'])){
            that.params['params']['title'] = that.params['content']['title'] || that.params['params']['title'];
            that.params['params']['content'] = that.params['content']['content'] || that.params['params']['content'];
            that.params['params']['buttons'] = that.params['content']['buttons'] || that.params['params']['buttons'];
        }
        return that;
    };

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'container' : that.params['container'],
                'title' : that.nodes['title'] || that.params['params']['title'] || that.params['title'],
                'content' : that.nodes['content'] || that.params['params']['content'] || that.params['content'],
                'buttons' : that.nodes['buttons'] || that.params['params']['buttons'] || that.params['buttons']
            })
        );
    };

    classProto.renderControllerView = function(){
        var that = this;
        that.params['renderButtons'] && that.renderButtonsView();
        return that;
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpenStart', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onCloseEnd', that.afterCloseControllerHandler);
        return that;
    };

    classProto.renderButtonsView = function(){
        var that = this;
        // Structure
        that.nodes['buttons'] = cm.node('div', {'class' : 'pt__buttons'},
            that.nodes['buttonsHolder'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addClass(that.nodes['buttons'], ['pull', that.params['justifyButtons']].join('-'));
        // Render buttons
        cm.forEach(that.buttons, function(item){
            that.renderButton(item);
        });
        return that;
    };

    classProto.addButton = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'name' : '',
            'label' : '',
            'style' : 'button-primary',
            'embed' : false,
            'callback' : function(){}
        }, item);
        // Structure
        item['node'] = cm.node('button', {'class' : ['button', item['style']].join(' ')}, item['label']);
        cm.addEvent(item['node'], 'click', item['callback']);
        // Embed
        that.buttons[item['name']] = item;
        if(that.nodes['buttonsHolder']){
            item['embed'] = true;
            cm.appendChild(item['node'], that.nodes['buttonsHolder']);
        }
        return item;
    };

    classProto.renderButton = function(item){
        var that = this;
        // Configure
        if(that.getButton(item['name'])){
            item = that.getButton(item['name']);
        }else{
            item = that.addButton(item);
        }
        // Embed
        if(!item['embed'] && that.nodes['buttonsHolder']){
            item['embed'] = true;
            cm.appendChild(item['node'], that.nodes['buttonsHolder']);
        }
        return that;
    };

    classProto.getButton = function(name){
        var that = this;
        return that.buttons[name];
    };
});
cm.define('Com.Draganddrop', {
    'modules' : [
        'Params',
        'Events'
    ],
    'events' : [
        'onRender',
        'onInit',
        'onDragStart',
        'onDrop',
        'onRemove',
        'onReplace'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'chassisTag' : 'div',
        'draggableContainer' : 'document.body',      // HTML node | selfParent
        'scroll' : true,
        'scrollNode' : window,
        'scrollSpeed' : 1,                           // ms per 1px
        'renderTemporaryAria' : false,
        'useCSSAnimation' : true,
        'useGracefulDegradation' : true,
        'dropDuration' : 400,
        'moveDuration' : 200,
        'direction' : 'both',                        // both | vertical | horizontal
        'limit' : false,
        'highlightAreas' : true,                     // highlight areas on drag start
        'highlightChassis' : false,
        'animateRemove' : true,
        'removeNode' : true,
        'classes' : {
            'area' : null
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        anims = {},
        areas = [],
        areasList = [],
        draggableList = [],
        filteredAvailableAreas = [],
        checkInt,
        chassisInt,
        pageSize,
        isScrollProccess = false,
        isGracefulDegradation = false,
        isHighlightedAreas = false,

        current,
        currentAboveItem,
        currentPosition,
        currentArea,
        currentChassis,
        previousArea;

    that.pointerType = null;

    /* *** INIT *** */

    var init = function(){
        var areasNodes;

        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);

        if(that.params['container']){
            // Check Graceful Degradation, and turn it to mobile and old ie.
            if(that.params['useGracefulDegradation'] && ((cm.is('IE') && cm.isVersion() < 9) || cm.isMobile())){
                isGracefulDegradation = true;
            }
            // Init misc
            anims['scroll'] = new cm.Animation(that.params['scrollNode']);
            // Render temporary area
            if(that.params['renderTemporaryAria']){
                nodes['temporaryArea'] = cm.Node('div');
                initArea(nodes['temporaryArea'], {
                    'isTemporary' : true
                });
            }
            // Find drop areas
            areasNodes = cm.getByAttr('data-com-draganddrop', 'area', that.params['container']);
            // Init areas
            cm.forEach(areasNodes, function(area){
                initArea(area, {});
            });
            /* *** EXECUTE API EVENTS *** */
            that.triggerEvent('onInit', {});
            that.triggerEvent('onRender', {});
        }
    };

    var getLESSVariables = function(){
        that.params['dropDuration'] = cm.getTransitionDurationFromLESS('PtDnD-DropDuration', that.params['dropDuration']);
        that.params['moveDuration'] = cm.getTransitionDurationFromLESS('PtDnD-MoveDuration', that.params['moveDuration']);
    };

    var initArea = function(node, params){
        // Check, if area already exists
        if(cm.inArray(areasList, node)){
            return;
        }
        // Config
        var area = cm.merge({
            'node' : node,
            'styleObject' : cm.getStyleObject(node),
            'type' : false,                             // content, form
            'isLocked' : false,
            'isTemporary' : false,
            'isSystem' : false,
            'isRemoveZone' : false,
            'draggableInChildNodes' : true,
            'cloneDraggable' : false,
            'items' : [],
            'chassis' : [],
            'dimensions' : {}
        }, params);
        // Get type
        area['type'] = area['node'].getAttribute('data-block-type');
        // Add mark classes
        cm.addClass(area['node'], 'pt__dnd-area');
        cm.addClass(area['node'], that.params['classes']['area']);
        if(area['isLocked']){
            cm.addClass(area['node'], 'is-locked');
        }else{
            cm.addClass(area['node'], 'is-available');
        }
        // Find draggable elements
        initAreaWidgets(area);
        // Push to areas array
        areasList.push(area['node']);
        areas.push(area);
    };

    var initAreaWidgets = function(area){
        var childNodes;
        area['items'] = [];
        // Find draggable elements
        if(area['draggableInChildNodes']){
            childNodes = area['node'].childNodes;
            cm.forEach(childNodes, function(node){
                if(node.tagName && node.getAttribute('data-com-draganddrop') == 'draggable'){
                    area['items'].push(
                        initDraggable(node, area, {})
                    );
                }
            });
        }else{
            childNodes = cm.getByAttr('data-com-draganddrop', 'draggable', area['node']);
            cm.forEach(childNodes, function(node){
                area['items'].push(
                    initDraggable(node, area, {})
                );
            });
        }
    };

    var initDraggable = function(node, area, params){
        // Config
        var draggable = cm.merge({
            'node' : node,
            'styleObject' : cm.getStyleObject(node),
            'type' : false,                             // content, form
            'chassis' : {
                'top' : null,
                'bottom' : null
            },
            'dimensions' : {
                'offsetX' : 0,
                'offsetY' : 0
            }
        }, params);
        draggable['area'] = area;
        draggable['anim'] = new cm.Animation(draggable['node']);
        // Get type
        draggable['type'] = draggable['node'].getAttribute('data-block-type');
        // Set draggable event on element
        initDraggableDrag(draggable);
        // Return item to push in area array
        draggableList.push(draggable);
        return draggable;
    };

    var initDraggableDrag = function(draggable){
        var dragNode;
        draggable['drag'] = cm.getByAttr('data-com-draganddrop', 'drag', draggable['node'])[0];
        draggable['drag-bottom'] = cm.getByAttr('data-com-draganddrop', 'drag-bottom', draggable['node'])[0];
        // Set draggable event on element
        dragNode = draggable['drag'] || draggable['node'];
        // Add events
        cm.addEvent(dragNode, 'touchstart', function(e){
            start(e, draggable);
        });
        cm.addEvent(dragNode, 'mousedown', function(e){
            start(e, draggable);
        });
        if(draggable['drag-bottom']){
            cm.addEvent(draggable['drag-bottom'], 'mousedown', function(e){
                start(e, draggable);
            });
        }
    };

    /* *** DRAG AND DROP PROCESS ** */

    var start = function(e, draggable){
        cm.preventDefault(e);
        // If not left mouse button, don't duplicate drag event
        if(e.button){
            return;
        }
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return;
        }
        that.pointerType = e.type;
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e),
            x = position['left'],
            y = position['top'],
            tempCurrentAboveItem,
            tempCurrentPosition;
        pageSize = cm.getPageSize();
        // API onDragStart Event
        that.triggerEvent('onDragStart', {
            'item' : draggable,
            'node' : draggable['node'],
            'from' : draggable['area']
        });
        // Filter areas
        filteredAvailableAreas = areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(
                (draggable['type'] != area['type'] && !area['isRemoveZone'])
                || cm.isParent(draggable['node'], area['node'])
                || area['isLocked']
            ){
                return false;
            }
            // True - pass area
            return true;
        });
        // Highlight Areas
        if(that.params['highlightAreas']){
            toggleHighlightAreas();
        }
        // Get position and dimension of current draggable item
        getPosition(draggable);
        // Get offset position relative to touch point (cursor or finger position)
        draggable['dimensions']['offsetX'] = x - draggable['dimensions']['absoluteX1'];
        draggable['dimensions']['offsetY'] = y - draggable['dimensions']['absoluteY1'];
        // Set draggable item to current
        if(draggable['area']['cloneDraggable']){
            current = cloneDraggable(draggable);
        }else{
            current = draggable;
        }
        // Set position and dimension to current draggable node, before we insert it to draggableContainer
        current['node'].style.top = 0;
        current['node'].style.left = 0;
        current['node'].style.width = [current['dimensions']['width'], 'px'].join('');
        cm.setCSSTranslate(current['node'], [current['dimensions']['absoluteX1'], 'px'].join(''), [current['dimensions']['absoluteY1'], 'px'].join(''));
        // Unset area from draggable item
        unsetDraggableFromArea(current);
        // Insert draggable element to body
        if(that.params['draggableContainer'] && that.params['draggableContainer'] != 'selfParent'){
            that.params['draggableContainer'].appendChild(current['node']);
        }
        cm.addClass(current['node'], 'pt__dnd-helper');
        cm.addClass(current['node'], 'is-active', true);
        // Calculate elements position and dimension
        getPositionsAll();
        // Render Chassis Blocks
        renderChassisBlocks();
        // Find above draggable item
        cm.forEach(current['area']['items'], function(draggable){
            if(x >= draggable['dimensions']['absoluteX1'] && x < draggable['dimensions']['absoluteX2'] && y >= draggable['dimensions']['absoluteY1'] && y <= draggable['dimensions']['absoluteY2']){
                tempCurrentAboveItem = draggable;
                // Check above block position
                if((y - tempCurrentAboveItem['dimensions']['absoluteY1']) < (tempCurrentAboveItem['dimensions']['absoluteHeight'] / 2)){
                    tempCurrentPosition = 'top';
                }else{
                    tempCurrentPosition = 'bottom';
                }
            }
        });
        // If current current draggable not above other draggable items
        if(!tempCurrentAboveItem && current['area']['items'].length){
            if(y < current['area']['dimensions']['y1']){
                tempCurrentAboveItem = current['area']['items'][0];
                tempCurrentPosition = 'top';
            }else{
                tempCurrentAboveItem = current['area']['items'][current['area']['items'].length - 1];
                tempCurrentPosition = 'bottom';
            }
        }
        // Set chassis
        if(tempCurrentAboveItem){
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else{
            currentChassis = current['area']['chassis'][0];
        }
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-active');
            if(that.params['highlightChassis']){
                cm.addClass(currentChassis['node'], 'is-highlight');
            }
            currentChassis['node'].style.height = [current['dimensions']['absoluteHeight'], 'px'].join('');
        }
        // Set current area and above
        currentArea = current['area'];
        currentAboveItem = tempCurrentAboveItem;
        currentPosition = tempCurrentPosition;
        cm.addClass(currentArea['node'], 'is-active');
        // Set check position event
        //checkInt = setInterval(checkPosition, 5);
        // Add move event on document
        cm.addClass(document.body, 'pt__dnd-body');
        // Add events
        switch(that.pointerType){
            case 'mousedown' :
                cm.addEvent(window, 'mousemove', move);
                cm.addEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.addEvent(window, 'touchmove', move);
                cm.addEvent(window, 'touchend', stop);
                break;
        }
    };

    var move = function(e){
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e),
            x = position['left'],
            y = position['top'],
            posY = y - current['dimensions']['offsetY'],
            posX = x - current['dimensions']['offsetX'],
            styleX,
            styleY,
            tempCurrentArea,
            tempCurrentAboveItem,
            tempCurrentPosition;
        // Calculate drag direction and set new position
        switch(that.params['direction']){
            case 'both':
                styleX = [posX, 'px'].join('');
                styleY = [posY, 'px'].join('');
                break;
            case 'vertical':
                styleX = [current['dimensions']['absoluteX1'], 'px'].join('');
                if(that.params['limit']){
                    if(posY < current['area']['dimensions']['y1']){
                        styleY = [current['area']['dimensions']['y1'], 'px'].join('');
                    }else if(posY > current['area']['dimensions']['y2']){
                        styleY = [current['area']['dimensions']['y2'], 'px'].join('');
                    }else{
                        styleY = [posY, 'px'].join('');
                    }
                }else{
                    styleY = [posY, 'px'].join('');
                }
                break;
            case 'horizontal':
                styleX = [posX, 'px'].join('');
                styleY = [current['dimensions']['absoluteY1'], 'px'].join('');
                break;
        }
        cm.setCSSTranslate(current['node'], styleX, styleY);
        // Scroll node
        if(that.params['scroll']){
        //if(false){
            if(y + 48 > pageSize['winHeight']){
                toggleScroll(1);
            }else if(y - 48 < 0){
                toggleScroll(-1);
            }else{
                toggleScroll(0);
            }
        }
        // Check and recalculate position
        checkPosition();
        // Find above area
        cm.forEach(filteredAvailableAreas, function(area){
            if(x >= area['dimensions']['x1'] && x < area['dimensions']['x2'] && y >= area['dimensions']['y1'] && y <= area['dimensions']['y2']){
                if(!tempCurrentArea){
                    tempCurrentArea = area;
                }else if(area['dimensions']['width'] < tempCurrentArea['dimensions']['width'] || area['dimensions']['height'] < tempCurrentArea['dimensions']['height']){
                    tempCurrentArea = area;
                }
            }
        });
        // Find above draggable item
        if(tempCurrentArea){
            cm.forEach(tempCurrentArea['items'], function(draggable){
                if(x >= draggable['dimensions']['absoluteX1'] && x < draggable['dimensions']['absoluteX2'] && y >= draggable['dimensions']['absoluteY1'] && y <= draggable['dimensions']['absoluteY2']){
                    tempCurrentAboveItem = draggable;
                    // Check above block position
                    if((y - tempCurrentAboveItem['dimensions']['absoluteY1']) < (tempCurrentAboveItem['dimensions']['absoluteHeight'] / 2)){
                        tempCurrentPosition = 'top';
                    }else{
                        tempCurrentPosition = 'bottom';
                    }
                }
            });
        }else{
            tempCurrentArea = currentArea;
        }
        // If current current draggable not above other draggable items
        if(!tempCurrentAboveItem && tempCurrentArea['items'].length){
            if(y < tempCurrentArea['dimensions']['innerY1']){
                tempCurrentAboveItem = tempCurrentArea['items'][0];
                tempCurrentPosition = 'top';
            }else{
                tempCurrentAboveItem = tempCurrentArea['items'][tempCurrentArea['items'].length - 1];
                tempCurrentPosition = 'bottom';
            }
        }
        // Animate previous chassis and get current
        if(currentChassis){
            cm.removeClass(currentChassis['node'], 'is-active is-highlight');
        }
        if(currentAboveItem && tempCurrentAboveItem && currentAboveItem['chassis'][currentPosition] != tempCurrentAboveItem['chassis'][tempCurrentPosition]){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, that.params['moveDuration']);
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else if(!currentAboveItem && tempCurrentAboveItem){
            animateChassis(currentArea['chassis'][0], 0, that.params['moveDuration']);
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else if(currentAboveItem && !tempCurrentAboveItem){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, that.params['moveDuration']);
            currentChassis = tempCurrentArea['chassis'][0];
        }else if(!currentAboveItem && !tempCurrentAboveItem && currentArea != tempCurrentArea){
            animateChassis(currentArea['chassis'][0], 0, that.params['moveDuration']);
            currentChassis = tempCurrentArea['chassis'][0];
        }
        // Animate current chassis
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-active');
            if(that.params['highlightChassis']){
                cm.addClass(currentChassis['node'], 'is-highlight');
            }
            animateChassis(currentChassis, current['dimensions']['absoluteHeight'], that.params['moveDuration']);
        }
        // Unset classname from previous active area
        if(currentArea && currentArea != tempCurrentArea){
            cm.removeClass(currentArea['node'], 'is-active');
            previousArea = currentArea;
        }
        // Set current to global
        currentArea = tempCurrentArea;
        currentAboveItem = tempCurrentAboveItem;
        currentPosition = tempCurrentPosition;
        // Set active area class name
        if(!(previousArea && previousArea['isTemporary'] && currentArea['isRemoveZone'])){
            cm.addClass(currentArea['node'], 'is-active');
        }
    };

    var stop = function(e){
        var currentHeight;
        // Remove check position event
        //checkInt && clearInterval(checkInt);
        // Remove move events attached on document
        cm.removeClass(document.body, 'pt__dnd-body');
        // Remove events
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        // Calculate height of draggable block, like he already dropped in area, to animate height of fake empty space
        getPosition(current);
        current['node'].style.width = [(currentArea['dimensions']['innerWidth'] - current['dimensions']['margin']['left'] - current['dimensions']['margin']['right']), 'px'].join('');
        currentHeight = current['node'].offsetHeight + current['dimensions']['margin']['top'] + current['dimensions']['margin']['bottom'];
        current['node'].style.width = [current['dimensions']['width'], 'px'].join('');
        // If current draggable located above another draggable item, drops after/before it, or drops in area
        if(currentAboveItem){
            // Animate chassis blocks
            if(currentHeight != currentAboveItem['chassis'][currentPosition]['node'].offsetHeight){
                animateChassis(currentAboveItem['chassis'][currentPosition], currentHeight, that.params['dropDuration']);
            }
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'target' : currentAboveItem['node'],
                'append' : currentPosition == 'top' ? 'before' : 'after',
                'index' : currentArea['items'].indexOf(currentAboveItem) + (currentPosition == 'top' ? 0 : 1),
                'top' : [currentPosition == 'top'? currentAboveItem['dimensions']['absoluteY1'] : currentAboveItem['dimensions']['absoluteY2'], 'px'].join(''),
                'onStop' : unsetCurrentDraggable
            });
        }else if(currentArea['isRemoveZone'] || currentArea['isTemporary']){
            removeDraggable(current, {
                'onStop' : unsetCurrentDraggable
            });
        }else{
            // Animate chassis blocks
            animateChassis(currentArea['chassis'][0], currentHeight, that.params['dropDuration']);
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'onStop' : unsetCurrentDraggable
            });
        }
        // Unset chassis
        if(currentChassis){
            cm.removeClass(currentChassis['node'], 'is-active is-highlight');
        }
        // Unset active area classname
        if(currentArea){
            cm.removeClass(currentArea['node'], 'is-active');
        }
        // Un Highlight Areas
        if(that.params['highlightAreas']){
            toggleHighlightAreas();
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
    };

    /* *** DRAGGABLE MANIPULATION FUNCTIONS *** */

    var cloneDraggable = function(draggable){
        var clonedNode = draggable['node'].cloneNode(true),
            area = that.params['renderTemporaryAria']? areas[0] : draggable['area'],
            clonedDraggable = initDraggable(clonedNode, area, {});

        clonedDraggable['dimensions'] = cm.clone(draggable['dimensions']);
        area['items'].push(clonedDraggable);
        return clonedDraggable;
    };

    var dropDraggableToArea = function(draggable, area, params){
        params = cm.merge({
            'target' : area['node'],
            'append' : 'child',
            'index' : 0,
            'width' : [area['dimensions']['innerWidth'], 'px'].join(''),
            'top' : [area['dimensions']['innerY1'] - draggable['dimensions']['margin']['top'], 'px'].join(''),
            'left' : [area['dimensions']['innerX1'] - draggable['dimensions']['margin']['left'], 'px'].join(''),
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // Animate draggable item, like it drops in area
        cm.addClass(draggable['node'], 'is-drop', true);
        draggable['node'].style.width = params['width'];
        cm.setCSSTranslate(draggable['node'], params['left'], params['top']);
        // On Dnimate Stop
        setTimeout(function(){
            // Append element in new position
            switch(params['append']){
                case 'child' :
                    cm.appendChild(draggable['node'], params['target']);
                    break;
                case 'before' :
                    cm.insertBefore(draggable['node'], params['target']);
                    break;
                case 'after' :
                    cm.insertAfter(draggable['node'], params['target']);
                    break;
                case 'first' :
                    cm.insertFirst(draggable['node'], params['target']);
                    break;
            }
            // Remove draggable helper classname
            cm.removeClass(draggable['node'], 'pt__dnd-helper is-drop is-active', true);
            // Reset styles
            draggable['node'].style.left = 'auto';
            draggable['node'].style.top = 'auto';
            draggable['node'].style.width = 'auto';
            cm.setCSSTranslate(current['node'], 'auto', 'auto');
            // Set index of draggable item in new area
            area['items'].splice(params['index'], 0, draggable);
            // API onDrop Event
            that.triggerEvent('onDrop', {
                'item' : draggable,
                'node' : draggable['node'],
                'to' : area,
                'from' : draggable['area'],
                'index' : params['index']
            });
            // Set draggable new area
            draggable['area'] = area;
            // System onStop event
            params['onStop']();
        }, that.params['dropDuration']);
    };

    var removeDraggable = function(draggable, params){
        var style, anim, node;
        // Remove handler
        var handler = function(){
            if(that.params['removeNode']){
                cm.remove(node);
            }
            // Remove from draggable list
            draggableList = draggableList.filter(function(item){
                return item != draggable;
            });
            unsetDraggableFromArea(draggable);
            // API onRemove Event
            if(!params['noEvent']){
                that.triggerEvent('onRemove', {
                    'item' : draggable,
                    'node' : draggable['node'],
                    'from' : draggable['area']
                });
            }
            // System onStop event
            params['onStop']();
        };
        // Config
        params = cm.merge({
            'isCurrent' : draggable === current,
            'isInDOM' : cm.inDOM(draggable['node']),
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // If draggable not in DOM, we don't need to wrap and animate it
        if(params['isInDOM'] && that.params['animateRemove']){
            // If draggable is current - just animate pull out left, else - wrap to removable node
            if(params['isCurrent']){
                node = draggable['node'];
                anim = draggable['anim'];
                style = {
                    'left' : [-(draggable['dimensions']['absoluteWidth'] + 50), 'px'].join(''),
                    'opacity' : 0
                };
            }else{
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable'}), draggable['node']);
                anim = new cm.Animation(node);
                style = {
                    'height' : '0px',
                    'opacity' : 0
                };
            }
            // Animate draggable, like it disappear
            anim.go({
                'duration' : that.params['dropDuration'],
                'anim' : 'smooth',
                'style' : style,
                'onStop' : handler
            });
        }else{
            node = draggable['node'];
            handler();
        }
    };

    var unsetDraggableFromArea = function(draggable){
        draggable['area']['items'] = draggable['area']['items'].filter(function(item){
            return item != draggable;
        });
    };

    var unsetCurrentDraggable = function(){
        // Remove chassis blocks
        removeChassisBlocks();
        // Reset other
        current = false;
        currentAboveItem = false;
        currentArea = false;
        previousArea = false;
    };

    /* *** CHASSIS FUNCTIONS *** */

    var renderChassisBlocks = function(){
        var chassis;
        cm.forEach(areas, function(area){
            if(area['isLocked']){
                return;
            }

            if(!area['items'].length){
                chassis = renderChassis();
                cm.appendChild(chassis['node'], area['node']);
                area['chassis'].push(chassis);
            }
            cm.forEach(area['items'], function(draggable, i){
                if(i === 0){
                    chassis = renderChassis();
                    cm.insertBefore(chassis['node'], draggable['node']);
                    area['chassis'].push(chassis);
                }
                chassis = renderChassis();
                cm.insertAfter(chassis['node'], draggable['node']);
                area['chassis'].push(chassis);
                // Associate with draggable
                draggable['chassis']['top'] = area['chassis'][i];
                draggable['chassis']['bottom'] = area['chassis'][i + 1];
            });
        });
    };

    var renderChassis = function(){
        var node = cm.Node(that.params['chassisTag'], {'class' : 'pt__dnd-chassis'});
        return {
            'node' : node,
            'anim' : new cm.Animation(node),
            'isShow' : false
        };
    };

    var removeChassisBlocks = function(){
        cm.forEach(areas, function(area){
            cm.forEach(area['chassis'], function(chassis){
                cm.remove(chassis['node']);
            });
            area['chassis'] = [];
        });
    };

    var animateChassis = function(chassis, height, duration) {
        var style;
        height = [height, 'px'].join('');
        if(that.params['useCSSAnimation'] || isGracefulDegradation){
            if(!isGracefulDegradation && (style = cm.getSupportedStyle('transition-duration'))){
                chassis['node'].style[style] = [duration, 'ms'].join('');
            }
            chassis['node'].style.height = height;
        }else{
            chassis['anim'].go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : duration});
        }
    };

    /* *** POSITION CALCULATION FUNCTIONS *** */

    var getPosition = function(item){
        item['dimensions'] = cm.extend(item['dimensions'], cm.getFullRect(item['node'], item['styleObject']));
    };

    var getPositions = function(arr){
        cm.forEach(arr, getPosition);
    };

    var getPositionsAll = function(){
        getPositions(areas);
        cm.forEach(areas, function(area){
            getPositions(area['items']);
        });
    };

    var recalculatePosition = function(item){
        //item['dimensions']['x1'] = cm.getRealX(item['node']);
        item['dimensions']['y1'] = cm.getRealY(item['node']);
        //item['dimensions']['x2'] = item['dimensions']['x1'] + item['dimensions']['width'];
        item['dimensions']['y2'] = item['dimensions']['y1'] + item['dimensions']['height'];

        //item['dimensions']['innerX1'] = item['dimensions']['x1'] + item['dimensions']['padding']['left'];
        item['dimensions']['innerY1'] = item['dimensions']['y1'] + item['dimensions']['padding']['top'];
        //item['dimensions']['innerX2'] = item['dimensions']['innerX1'] + item['dimensions']['innerWidth'];
        item['dimensions']['innerY2'] = item['dimensions']['innerY1'] + item['dimensions']['innerHeight'];

        //item['dimensions']['absoluteX1'] = item['dimensions']['x1'] - item['dimensions']['margin']['left'];
        item['dimensions']['absoluteY1'] = item['dimensions']['y1'] - item['dimensions']['margin']['top'];
        //item['dimensions']['absoluteX2'] = item['dimensions']['x2'] + item['dimensions']['margin']['right'];
        item['dimensions']['absoluteY2'] = item['dimensions']['y2'] + item['dimensions']['margin']['bottom'];
    };

    var recalculatePositions = function(arr){
        cm.forEach(arr, recalculatePosition);
    };

    var recalculatePositionsAll = function(){
        var chassisHeight = 0;
        // Reset current active chassis height, cause we need to calculate clear positions
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-immediately');
            chassisHeight = currentChassis['node'].offsetHeight;
            currentChassis['node'].style.height = 0;
        }
        recalculatePositions(areas);
        cm.forEach(areas, function(area){
            recalculatePositions(area['items']);
        });
        // Restoring chassis height after calculation
        if(currentChassis && chassisHeight){
            currentChassis['node'].style.height = [chassisHeight, 'px'].join('');
            (function(currentChassis){
                setTimeout(function(){
                    cm.removeClass(currentChassis['node'], 'is-immediately');
                }, 5);
            })(currentChassis);
        }
    };

    var checkPosition = function(){
        var filteredAreas = getFilteredAreas();
        if(filteredAreas[0]['dimensions']['y1'] != cm.getRealY(filteredAreas[0]['node'])){
            recalculatePositionsAll();
        }
    };

    /* *** AREA FUNCTIONS *** */

    var getFilteredAreas = function(){
        return areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(area['isTemporary'] || area['isSystem']){
                return false;
            }
            // True - pass area
            return true;
        });
    };

    var getRemoveZones = function(){
        return areas.filter(function(area){
            return area['isRemoveZone'];
        });
    };

    var toggleHighlightAreas = function(){
        if(filteredAvailableAreas){
            if(isHighlightedAreas){
                isHighlightedAreas = false;
                cm.forEach(filteredAvailableAreas, function(area){
                    cm.removeClass(area['node'], 'is-highlight');
                });
            }else{
                isHighlightedAreas = true;
                cm.forEach(filteredAvailableAreas, function(area){
                    cm.addClass(area['node'], 'is-highlight');
                });
            }
        }
    };

    /* *** HELPERS *** */

    var toggleScroll = function(speed){
        var scrollRemaining,
            duration,
            styles = {};

        if(speed == 0){
            isScrollProccess = false;
            anims['scroll'].stop();
        }else if(speed < 0 && !isScrollProccess){
            isScrollProccess = true;
            duration = cm.getScrollTop(that.params['scrollNode']) * that.params['scrollSpeed'];
            if(cm.isWindow(that.params['scrollNode'])){
                styles['docScrollTop'] = 0;
            }else{
                styles['scrollTop'] = 0;
            }
            anims['scroll'].go({'style' : styles, 'duration' : duration, 'onStop' : function(){
                isScrollProccess = false;
                //getPositionsAll();
                //recalculatePositionsAll();
            }});
        }else if(speed > 0 && !isScrollProccess){
            isScrollProccess = true;
            scrollRemaining = cm.getScrollHeight(that.params['scrollNode']) - pageSize['winHeight'];
            if(cm.isWindow(that.params['scrollNode'])){
                styles['docScrollTop'] = scrollRemaining;
            }else{
                styles['scrollTop'] = scrollRemaining;
            }
            duration = scrollRemaining * that.params['scrollSpeed'];
            anims['scroll'].go({'style' : styles, 'duration' : duration, 'onStop' : function(){
                isScrollProccess = false;
                //getPositionsAll();
                //recalculatePositionsAll();
            }});
        }
    };

    /* ******* MAIN ******* */

    that.getArea = function(node){
        var area;
        cm.forEach(areas, function(item){
            if(item['node'] === node){
                area = item;
            }
        });
        return area;
    };

    that.registerArea = function(node, params){
        if(cm.isNode(node) && node.tagName){
            initArea(node, params || {});
        }
        return that;
    };

    that.updateArea = function(node){
        var area = that.getArea(node);
        if(area){
            initAreaWidgets(area);
        }
        return that;
    };

    that.removeArea = function(node, params){
        if(cm.isNode(node) && cm.inArray(areasList, node)){
            areasList = areasList.filter(function(area){
                return area != node;
            });
            areas = areas.filter(function(area){
                return area['node'] != node;
            });
        }
        return that;
    };

    that.getDraggable = function(node){
        var draggable;
        cm.forEach(draggableList, function(item){
            if(item['node'] === node){
                draggable = item;
            }
        });
        return draggable;
    };

    that.getDraggableList = function(){
        return draggableList;
    };

    that.registerDraggable = function(node, areaNode, params){
        var draggable, area, newDraggable, index, childNodes, draggableNodes = [];
        // Find draggable item by node
        draggable = that.getDraggable(node);
        // If draggable already exists - reinit it, else - init like new draggable item
        if(draggable){
            initDraggableDrag(draggable);
        }else if(cm.inArray(areasList, areaNode)){
            node.setAttribute('data-com-draganddrop', 'draggable');
            // Fins area item by node
            area = that.getArea(areaNode);
            // Find draggable index
            if(area['draggableInChildNodes']){
                childNodes = area['node'].childNodes;
                cm.forEach(childNodes, function(node){
                    if(node.tagName && node.getAttribute('data-com-draganddrop') == 'draggable'){
                        draggableNodes.push(node);
                    }
                });
            }else{
                draggableNodes = cm.getByAttr('data-com-draganddrop', 'draggable', area['node']);
            }
            index = draggableNodes.indexOf(node);
            // Register draggable
            newDraggable = initDraggable(node, area, params || {});
            area['items'].splice(index, 0, newDraggable);
        }
        return that;
    };

    that.replaceDraggable = function(oldDraggableNode, newDraggableNode, params){
        var oldDraggable,
            newDraggable;
        // Find draggable item
        cm.forEach(draggableList, function(item){
            if(item['node'] === oldDraggableNode){
                oldDraggable = item;
            }
        });
        if(oldDraggable){
            // Find old draggable area and index in area
            var area = oldDraggable['area'],
                index = area['items'].indexOf(oldDraggable),
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable', 'style' : 'height: 0px;'}), newDraggableNode),
                anim = new cm.Animation(node);
            // Append new draggable into DOM
            cm.insertAfter(node, oldDraggableNode);
            // Remove old draggable
            removeDraggable(oldDraggable, params);
            // Animate new draggable
            anim.go({'style' : {'height' : [cm.getRealHeight(node, 'offset', 0), 'px'].join(''), 'opacity' : 1}, 'duration' : 300, 'anim' : 'simple', 'onStop' : function(){
                cm.insertAfter(newDraggableNode, node);
                cm.remove(node);
                // Register new draggable
                newDraggable = initDraggable(newDraggableNode, area);
                area['items'].splice(index, 0, newDraggable);
                // API onEmbed event
                that.triggerEvent('onReplace', {
                    'item' : newDraggable,
                    'node' : newDraggable['node'],
                    'to' : newDraggable['to']
                });
            }});
        }
        return that;
    };

    that.removeDraggable = function(node, params){
        var draggable;
        // Find draggable item
        cm.forEach(draggableList, function(item){
            if(item['node'] === node){
                draggable = item;
            }
        });
        if(draggable){
            // Remove
            removeDraggable(draggable, params || {});
        }
        return that;
    };

    that.getOrderingNodes = function(){
        var results = [],
            arr,
            filteredAreas = getFilteredAreas();
        // Build array
        cm.forEach(filteredAreas, function(area){
            arr = {
                'area' : area['node'],
                'items' : []
            };
            cm.forEach(area['items'], function(item){
                arr['items'].push(item['node']);
            });
            results.push(arr);
        });
        return filteredAreas.length == 1 ? arr['items'] : results;
    };

    that.getOrderingIDs = function(){
        var results = {},
            arr,
            filteredAreas = getFilteredAreas();
        // Build array
        cm.forEach(filteredAreas, function(area){
            arr = {};
            cm.forEach(area['items'], function(item, i){
                if(!item['id']){
                    throw new Error('Attribute "data-id" not specified on item node.');
                }
                arr[item['id']] = i;
            });
            results[area['id']] = arr;
        });
        return filteredAreas.length == 1 ? arr : results;
    };
    
    init();
});
cm.define('Com.Draggable', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onMove',
        'onStop',
        'onSet',
        'onSelect'
    ],
    'params' : {
        'node' : cm.node('div'),            // Node, for drag
        'target' : false,                   // Node, for drag target event
        'limiter' : false,                  // Node, for limit draggable in it
        'minY' : false,
        'direction' : 'both',               // both | vertical | horizontal
        'alignNode' : false
    }
},
function(params){
    var that = this;

    that.startX = 0;
    that.startY = 0;
    that.nodeStartX = 0;
    that.nodeStartY = 0;
    that.isProcess = false;
    that.pointerType = null;
    that.dimensions = {
        'target' : {}
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['node'];
        }
    };

    var render = function(){
        // Calculate dimensions and position
        that.getDimensions();
        // Add drag start event
        cm.addEvent(that.params['target'], 'touchstart', function(e){
            start(e);
        });
        cm.addEvent(that.params['target'], 'mousedown', function(e){
            start(e);
        });
    };

    var start = function(e){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(that.isProcess){
            return;
        }
        that.isProcess = true;
        that.pointerType = e.type;
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e);
        that.startX = position['left'];
        that.startY = position['top'];
        // Calculate dimensions and position
        that.getDimensions();
        that.nodeStartX = cm.getStyle(that.params['node'], 'left', true);
        that.nodeStartY = cm.getStyle(that.params['node'], 'top', true);
        setPositionHelper(position, 'onSelect');
        // Add move event on document
        switch(that.pointerType){
            case 'mousedown' :
                cm.addEvent(window, 'mousemove', move);
                cm.addEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.addEvent(window, 'touchmove', move);
                cm.addEvent(window, 'touchend', stop);
                break;
        }
        // Trigger Event
        that.triggerEvent('onStart');
    };

    var move = function(e){
        cm.preventDefault(e);
        var position = cm.getEventClientPosition(e);
        // Calculate dimensions and position
        setPositionHelper(position, 'onSelect');
        // Trigger Event
        that.triggerEvent('onMove');
    };

    var stop = function(e){
        cm.preventDefault(e);
        that.isProcess = false;
        // Calculate dimensions and position
        var position = cm.getEventClientPosition(e);
        setPositionHelper(position, 'onSet');
        // Remove move events attached on document
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // Trigger Event
        that.triggerEvent('onStop');
    };
    
    /* *** HELPERS *** */

    var setPositionHelper = function(position, eventName){
        position = cm.merge({
            'left' : 0,
            'top' : 0
        }, position);
        if(that.params['node'] === that.params['target']){
            position['left'] += that.nodeStartX - that.startX;
            position['top'] += that.nodeStartY - that.startY;
        }else{
            position['left'] -= that.dimensions['target']['absoluteX1'];
            position['top'] -= that.dimensions['target']['absoluteY1'];
        }
        position['left'] = Math.round(position['left']);
        position['top'] = Math.round(position['top']);
        position = setPositionAction(position);
        that.triggerEvent(eventName, position);
    };

    var setPositionAction = function(position){
        position = cm.merge({
            'left' : 0,
            'top' : 0,
            'nodeTop' : 0,
            'nodeLeft' : 0
        }, position);
        // Check limit
        if(that.params['limiter']){
            if(position['top'] < 0){
                position['top'] = 0;
            }else if(position['top'] > that.dimensions['limiter']['absoluteHeight']){
                position['top'] = that.dimensions['limiter']['absoluteHeight'];
            }
            if(position['left'] < 0){
                position['left'] = 0;
            }else if(position['left'] > that.dimensions['limiter']['absoluteWidth']){
                position['left'] = that.dimensions['limiter']['absoluteWidth'];
            }
        }
        // Limiters
        if(!isNaN(that.params['minY']) && position['top'] < that.params['minY']){
            position['top'] = that.params['minY'];
        }
        // Align node
        position['nodeTop'] = position['top'];
        position['nodeLeft'] = position['left'];
        if(that.params['alignNode']){
            position['nodeTop'] -= (that.dimensions['node']['absoluteHeight'] / 2);
            position['nodeLeft'] -= (that.dimensions['node']['absoluteWidth'] / 2);
        }
        // Set styles
        switch(that.params['direction']){
            case 'vertical' :
                that.params['node'].style.top = [position['nodeTop'], 'px'].join('');
                break;
            case 'horizontal' :
                that.params['node'].style.left = [position['nodeLeft'], 'px'].join('');
                break;
            default :
                that.params['node'].style.top = [position['nodeTop'], 'px'].join('');
                that.params['node'].style.left = [position['nodeLeft'], 'px'].join('');
                break;
        }
        return position;
    };

    /* ******* MAIN ******* */

    that.getDimensions = function(){
        that.dimensions['target'] = cm.getFullRect(that.params['target']);
        that.dimensions['node'] = cm.getFullRect(that.params['node']);
        that.dimensions['limiter'] = cm.getFullRect(that.params['limiter']);
        return that.dimensions;
    };

    that.setPosition = function(position, triggerEvents){
        position = cm.merge({
            'left' : 0,
            'top' : 0
        }, position);
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        position = setPositionAction(position);
        // Trigger Event
        if(triggerEvents){
            that.triggerEvent('onSelect', position);
            that.triggerEvent('onSet', position);
        }
        return that;
    };

    init();
});
cm.define('Com.FileDropzone', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onDrop',
        'onSelect'
    ],
    'params' : {
        'embedStructure' : 'append',
        'target' : null,
        'height' : 128,
        'animated' : true,
        'rollover' : true,
        'max' : 0,                                  // 0 - infinity
        'duration' : 'cm._config.animDuration',
        'langs' : {
            'drop_single' : 'drop file here',
            'drop_multiple' : 'drop files here'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.dragInterval = null;
    that.isDropzoneShow = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileDropzone', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.dragOverHandler = that.dragOver.bind(that);
        that.dragDropHandler = that.dragDrop.bind(that);
        that.showDropzoneHandler = that.showDropzone.bind(that);
        that.hideDropzoneHandler = that.hideDropzone.bind(that);
        that.onGetLESSVariablesProcessHandler = that.onGetLESSVariablesProcess.bind(that);
        that.setEventsProcessHander = that.setEventsProcess.bind(that);
        that.unsetEventsProcessHander = that.unsetEventsProcess.bind(that);
        // Add events
        that.addEvent('onGetLESSVariablesProcess', that.onGetLESSVariablesProcessHandler);
        that.addEvent('onSetEventsProcess', that.setEventsProcessHander);
        that.addEvent('onUnsetEventsProcess', that.unsetEventsProcessHander);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            'drop' : !that.params['max'] || that.params['max'] > 1 ? that.lang('drop_multiple') : that.lang('drop_single')
        });
        return that;
    };

    classProto.onGetLESSVariablesProcess = function(){
        var that = this;
        that.params['height'] = cm.getLESSVariable('ComFileDropzone-Height', that.params['height'], true);
        that.params['duration'] = cm.getTransitionDurationFromLESS('ComFileDropzone-Duration', that.params['duration']);
        return that;
    };

    classProto.setEventsProcess = function(){
        var that = this;
        cm.addEvent(window, 'dragover', that.dragOverHandler);
        cm.addEvent(window, 'drop', that.dragDropHandler);
        return that;
    };

    classProto.unsetEventsProcess = function(){
        var that = this;
        cm.removeEvent(window, 'dragover', that.dragOverHandler);
        cm.removeEvent(window, 'drop', that.dragDropHandler);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-dropzone'},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'title'},
                    cm.node('div', {'class' : 'label'}, that.lang('drop')),
                    cm.node('div', {'class' : 'icon cm-i cm-i__circle-arrow-down'})
                )
            )
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init container animation
        if(that.params['rollover']){
            cm.addClass(that.nodes['container'], 'is-hidden');
            that.components['animation'] = new cm.Animation(that.params['container']);
        }else{
            cm.removeClass(that.nodes['container'], 'is-hidden');
            that.params['container'].style.height = that.params['height'] + 'px';
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.processFile = function(file){
        var that = this;
        that.components['reader'].read(file);
        return that;
    };

    /* *** DROPZONE *** */

    classProto.dragOver = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        cm.preventDefault(e);
        // Show dropzone
        that.showDropzone();
        // Hide dropzone if event not triggering inside the current document window (hax)
        that.dragInterval && clearTimeout(that.dragInterval);
        that.dragInterval = setTimeout(that.hideDropzoneHandler, 100);
        // Highlight dropzone
        if(cm.isParent(that.nodes['container'], target, true)){
            cm.addClass(that.nodes['container'], 'is-highlight');
        }else{
            cm.removeClass(that.nodes['container'], 'is-highlight');
        }
        return that;
    };

    classProto.dragDrop = function(e){
        var that = this,
            target = cm.getEventTarget(e),
            data = [],
            length = 0;
        cm.preventDefault(e);
        // Hide dropzone and reset his state
        that.dragInterval && clearTimeout(that.dragInterval);
        that.hideDropzone();
        // Process file
        if(cm.isParent(that.nodes['container'], target, true)){
            if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
                length = that.params['max'] ? Math.min(e.dataTransfer.files.length, that.params['max']) : e.dataTransfer.files.length;
                cm.forEach(length, function(i){
                    data.push(e.dataTransfer.files[i]);
                    that.triggerEvent('onDrop', e.dataTransfer.files[i]);
                });
                that.triggerEvent('onSelect', data);
            }
        }
        return that;
    };

    classProto.showDropzone = function(){
        var that = this,
            height;
        if(!that.isDropzoneShow){
            that.isDropzoneShow = true;
            // Set classes
            cm.removeClass(that.nodes['container'], 'is-highlight');
            // Animate
            if(that.params['rollover']){
                // Set classes
                cm.addClass(that.params['container'], 'is-dragging');
                cm.addClass(that.params['target'], 'is-hidden');
                cm.removeClass(that.nodes['container'], 'is-hidden');
                // Animate
                height = Math.max(that.params['height'], that.params['target'].offsetHeight);
                that.components['animation'].go({
                    'style' : {'height' : (height + 'px')},
                    'duration' : that.params['duration'],
                    'anim' : 'smooth'
                });
            }
        }
        return that;
    };

    classProto.hideDropzone = function(){
        var that = this,
            height;
        if(that.isDropzoneShow){
            that.isDropzoneShow = false;
            // Set classes
            cm.removeClass(that.nodes['container'], 'is-highlight');
            // Animate
            if(that.params['rollover']){
                // Set classes
                cm.removeClass(that.params['container'], 'is-dragging');
                cm.removeClass(that.params['target'], 'is-hidden');
                cm.addClass(that.nodes['container'], 'is-hidden');
                // Animate
                height = that.params['target'].offsetHeight;
                that.components['animation'].go({
                    'style' : {'height' : (height + 'px')},
                    'duration' : that.params['duration'],
                    'anim' : 'smooth',
                    'onStop' : function(){
                        that.params['container'].style.height = 'auto';
                    }
                });
            }
        }
        return that;
    };
});
cm.define('Com.FileInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__file-input',
        'file' : null,
        'showLink' : true,
        'autoOpen' : false,
        'local' : true,
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'params' : {
                'max' : 1
            }
        },
        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'params' : {
                'max' : 1
            }
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'max' : 1,
            'rollover' : true
        },
        'langs' : {
            'browse' : 'Browse',
            'browse_local' : 'Browse Local',
            'browse_filemanager' : 'Browse File Manager',
            'remove' : 'Remove',
            'open' : 'Open'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.myComponents = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.FileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.initComponentsStartHandler = that.initComponentsStart.bind(that);
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        that.addEvent('onInitComponentsStart', that.initComponentsStartHandler);
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this,
            value;
        if(that.params['formData']){
            value = that.value['file'] || that.value;
        }else{
            value = that.value;
        }
        return value;
    };

    classProto.initComponentsStart = function(){
        var that = this;
        cm.getConstructor('Com.FileReader', function(classObject){
            that.myComponents['validator'] = new classObject();
        });
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Dropzone
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        // File Uploader
        that.params['fileUploaderParams']['openOnConstruct'] = that.params['autoOpen'];
        that.params['fileUploaderParams']['params']['local'] = that.params['local'];
        that.params['fileUploaderParams']['params']['fileManager'] = that.params['fileManager'];
        // Other
        that.params['local'] = that.params['fileUploader'] ? false : that.params['local'];
        that.params['fileManagerParams']['openOnConstruct'] = that.params['autoOpen'];
        that.params['fileManager'] = that.params['fileUploader'] ? false : that.params['fileManager'];
        return that;
    };

    classProto.validateValue = function(value){
        var that = this,
            item = that.myComponents['validator'].validate(value);
        return !cm.isEmpty(item['value']) ? item : '';
    };

    classProto.saveValue = function(value){
        var that = this;
        that.previousValue = that.value;
        that.value = value;
        if(that.params['setHiddenInput']){
            if(!cm.isEmpty(value)){
                that.nodes['hidden'].value = JSON.stringify(value);
            }else{
                that.nodes['hidden'].value = ''
            }
        }
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.myComponents['reader'] = new classObject(that.params[className]);
            that.myComponents['reader'].addEvent('onReadSuccess', function(my, item){
                that.set(item, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.myComponents['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.myNodes['inner'],
                        'target' : that.myNodes['content']
                    })
                );
                that.myComponents['dropzone'].addEvent('onDrop', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Manager
        if(that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.myComponents['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.myNodes['browseFileManager']
                    })
                );
                that.myComponents['fileManager'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Uploader
        if(that.params['fileUploader']){
            cm.getConstructor(that.params['fileUploaderConstructor'], function(classObject){
                that.myComponents['fileUploader'] = new classObject(
                    cm.merge(that.params['fileUploaderParams'], {
                        'node' : that.myNodes['browseFileUploader']
                    })
                );
                that.myComponents['fileUploader'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__file-input__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.myNodes['content'] = cm.node('div', {'class' : 'com__file-input__holder'},
                    cm.node('div', {'class' : 'pt__file-line'},
                        that.myNodes['buttonsInner'] = cm.node('div', {'class' : 'inner'},
                            that.myNodes['clear'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('remove')),
                            that.myNodes['label'] = cm.node('div', {'class' : 'label'})
                        )
                    )
                )
            )
        );
        // Render Browse Buttons
        if(that.params['local']){
            that.myNodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    that.myNodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
            cm.insertFirst(that.myNodes['browseLocal'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileManager']){
            that.myNodes['browseFileManager'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_filemanager'));
            cm.insertFirst(that.myNodes['browseFileManager'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileUploader']){
            that.myNodes['browseFileUploader'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('browse'));
            cm.insertFirst(that.myNodes['browseFileUploader'], that.myNodes['buttonsInner']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['clear'], 'click', that.clearEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setData = function(){
        var that = this,
            url;
        if(cm.isEmpty(that.value)){
            cm.clearNode(that.myNodes['label']);
            cm.addClass(that.myNodes['label'], 'is-hidden');
            cm.removeClass(that.myNodes['browseLocal'], 'is-hidden');
            cm.removeClass(that.myNodes['browseFileManager'], 'is-hidden');
            cm.removeClass(that.myNodes['browseFileUploader'], 'is-hidden');
            cm.addClass(that.myNodes['clear'], 'is-hidden');
        }else{
            cm.clearNode(that.myNodes['label']);
            if(that.params['showLink']){
                that.myNodes['link'] = cm.node('a', {'target' : '_blank', 'href' : that.value['url'], 'title' : that.lang('open')}, that.value['name']);
            }else{
                that.myNodes['link'] = cm.textNode(that.value['name']);
            }
            cm.appendChild(that.myNodes['link'], that.myNodes['label']);
            cm.addClass(that.myNodes['browseLocal'], 'is-hidden');
            cm.addClass(that.myNodes['browseFileManager'], 'is-hidden');
            cm.addClass(that.myNodes['browseFileUploader'], 'is-hidden');
            cm.removeClass(that.myNodes['clear'], 'is-hidden');
            cm.removeClass(that.myNodes['label'], 'is-hidden');
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            file = e.target.files[0];
        cm.preventDefault(e);
        // Read File
        that.processFiles(file);
        return that;
    };

    classProto.processFiles = function(data){
        var that = this;
        if(cm.isFile(data)){
            that.myComponents['reader'].read(data);
        }else if(cm.isArray(data)){
            cm.forEach(data, function(file){
                that.processFiles(file);
            })
        }else if(!cm.isEmpty(data)){
            that.set(data, true);
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('file-input', {
    'node' : cm.node('input'),
    'constructor' : 'Com.FileInput'
});
cm.define('Com.FileReader', {
    'modules' : [
        'Params',
        'Events',
        'Langs'
    ],
    'events' : [
        'onConstruct',
        'onConstructStart',
        'onConstructEnd',
        'onValidateParams',
        'onRenderStart',
        'onRender',
        'onReadStart',
        'onReadProcess',
        'onReadSuccess',
        'onReadError',
        'onReadEnd'
    ],
    'params' : {
        'file' : null
    }
},
function(params){
    var that = this;
    that.construct(params);
});

cm.getConstructor('Com.FileReader', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        // Variables
        that.isDestructed = false;
        that.nodes = {};
        that.components = {};
        // Events
        that.triggerEvent('onConstructStart');
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.render();
        that.triggerEvent('onConstruct');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        that.triggerEvent('onRenderStart');
        that.read(that.params['file']);
        that.triggerEvent('onRender');
        return that;
    };

    classProto.read = function(file, callback){
        var that = this;
        callback = typeof callback == 'function' ? callback : function(){};
        if(cm.isFileReader && cm.isFile(file)){
            that.triggerEvent('onReadStart', file);
            // Config
            var item = that.validate(file);
            that.triggerEvent('onReadProcess', item);
            // Read File
            var reader = new FileReader();
            cm.addEvent(reader, 'load', function(e){
                item['value'] = e.target.result;
                callback(item);
                that.triggerEvent('onReadSuccess', item);
                that.triggerEvent('onReadEnd', item);
            });
            cm.addEvent(reader, 'error', function(e){
                item['error'] = e;
                callback(item);
                that.triggerEvent('onReadError', item);
                that.triggerEvent('onReadEnd', item);
            });
            reader.readAsDataURL(file);
        }
        return that;
    };

    classProto.validate = function(o){
        var that = this,
            item = {
                '_type' : 'file',
                'value' : null,
                'error' : null,
                'name' : '',
                'size' : 0,
                'url' : null,
                'type' : null
            },
            parsed;
        if(cm.isFile(o)){
            item['file'] = o;
            item['type'] = o.type;
            item['name'] = o.name;
            item['size'] = o.size;
            item['url'] = window.URL.createObjectURL(o);
        }else if(cm.isObject(o)){
            item = cm.merge(item, o);
            item['name'] = cm.isEmpty(item['name']) ? item['value'] : item['name'];
            item['url'] = cm.isEmpty(item['url']) ? item['value'] : item['url'];
        }else if(!cm.isEmpty(o)){
            parsed = cm.parseJSON(o);
            if(cm.isObject(parsed)){
                item = that.validate(parsed);
            }else{
                item = that.validate({
                    'value' : o
                })
            }
        }
        return item;
    };
});
cm.define('Com.FileStats', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'mfu' : 0,                                                    // Max files per upload
        'umf' : 0,                                                    // Max file size
        'quote' : 0,
        'usage' : 0,
        'inline' : false,
        'toggleBox' : true,
        'langs' : {
            'stats' : 'Statistics',
            'mfu' : 'You can upload up to %mfu% files at a time.',
            'umf' : 'Max file size: %umf%.',
            'quote' : 'Total storage: %quote%.',
            'usage' : 'Storage used: %usage%.',
            'quote_unlimited' : 'Unlimited'
        },
        'Com.ToggleBox' : {
            'renderStructure' : true
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileStats', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderView = function(){
        var that = this,
            vars = {
                '%mfu%' : that.params['mfu'],
                '%umf%' : that.params['umf'],
                '%quote%' : that.params['quote'],
                '%usage%' : that.params['usage']
            };
        vars['%quote%'] = parseFloat(vars['%quote%']) === 0 ? that.lang('quote_unlimited') : vars['%quote%'] + ' Mb';
        vars['%usage%'] = vars['%usage%'] + ' Mb';
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-stats'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__file-stats__list'},
                that.nodes['list'] = cm.node('ul',
                    cm.node('li', that.lang('mfu', vars)),
                    cm.node('li', that.lang('umf', vars)),
                    cm.node('li', that.lang('quote', vars)),
                    cm.node('li', that.lang('usage', vars))
                )
            )
        );
        if(that.params['inline']){
            cm.insertFirst(cm.node('li', {'class' : 'icon small info'}), that.nodes['list']);
            cm.addClass(that.nodes['content'], 'is-inline');
        }
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init ToggleBox
        if(that.params['toggleBox']){
            cm.getConstructor('Com.ToggleBox', function(classObject, className){
                that.components['togglebox'] = new classObject(
                    cm.merge(that.params[className], {
                        'node' : that.nodes['content'],
                        'title' : that.lang('stats')
                    })
                );
            });
        }
        return that;
    };
});
cm.define('Com.FileUploader', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect',
        'onComplete',
        'onGet'
    ],
    'params' : {
        'max' : 0,
        'showStats' : true,
        'completeOnSelect' : false,
        'local' : true,
        'localConstructor' : 'Com.FileUploaderLocal',
        'localParams' : {
            'embedStructure' : 'append'
        },
        'fileManagerLazy' : true,
        'fileManager' : true,
        'fileManagerConstructor' : 'Com.AbstractFileManager',
        'fileManagerParams' : {
            'embedStructure' : 'append',
            'showStats' : false,
            'fullSize' : true
        },
        'Com.Tabset' : {
            'embedStructure' : 'append',
            'toggleOnHashChange' : false,
            'calculateMaxHeight' : true
        },
        'Com.FileStats' : {
            'embedStructure' : 'append',
            'toggleBox' : false,
            'inline' : true
        },
        'langs' : {
            'tab_local' : 'Select From PC',
            'tab_filemanager' : 'File Manager',
            'browse_local_single' : 'Choose file',
            'browse_local_multiple' : 'Choose files',
            'or' : 'or',
            'browse' : 'Browse'
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.items = [];
    that.activeTab = null;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileUploader', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.completeHandler = that.complete.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this,
            data;
        if(that.activeTab){
            switch(that.activeTab['id']){
                case 'local':
                    data = that.components['local'].get();
                    that.afterGet(data);
                    break;
                case 'fileManager':
                    that.components['fileManager'].get();
                    break;
            }
        }
        return that;
    };

    classProto.complete = function(){
        var that = this,
            data;
        if(that.activeTab){
            switch(that.activeTab['id']){
                case 'local':
                    data = that.components['local'].get();
                    that.afterComplete(data);
                    break;
                case 'fileManager':
                    that.components['fileManager'].complete();
                    break;
            }
        }
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Components parameters
        that.params['localParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['lazy'] = that.params['fileManagerLazy'];
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-uploader'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['content'] = cm.node('div', {'class' : 'com__file-uploader__content'})
            )
        );
        // Local
        if(that.params['local']){
            that.nodes['local'] = that.renderLocal();
        }
        // File Manager
        if(that.params['fileManager']){
            that.nodes['fileManager'] = that.renderFileManager();
        }
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init Files Input
        if(that.params['local']){
            cm.getConstructor(that.params['localConstructor'], function(classObject){
                that.components['local'] = new classObject(
                    cm.merge(that.params['localParams'], {
                        'node' : that.nodes['local']['holder']
                    })
                );
                if(that.params['completeOnSelect']){
                    that.components['local'].addEvent('onSelect', function(my, data){
                        that.afterComplete(data);
                    });
                }
            });
        }
        // Init File Manager
        if(that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.components['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.nodes['fileManager']['holder']
                    })
                );
                that.components['fileManager'].addEvent('onGet', function(my, data){
                    that.afterGet(data);
                });
                that.components['fileManager'].addEvent('onComplete', function(my, data){
                    that.afterComplete(data);
                });
            });
        }
        // Init Tabset
        that.renderTabset();
        // Init Stats
        if(that.params['showStats']){
            cm.getConstructor('Com.FileStats', function(classObject, className){
                that.components['stats'] = new classObject(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['content']
                    })
                );
            });
        }
        return that;
    };

    classProto.renderTabset = function(){
        var that = this;
        cm.getConstructor('Com.Tabset', function(classObject, className){
            that.components['tabset'] = new classObject(
                cm.merge(that.params[className], {
                    'container' : that.nodes['content']
                })
            );
            that.components['tabset'].addEvent('onTabShow', function(my, data){
                that.activeTab = data;
                if(that.activeTab['id'] == 'fileManager'){
                    that.components['fileManager'] && that.components['fileManager'].load();
                }
            });
            if(that.params['local']){
                that.components['tabset'].addTab({
                    'id' : 'local',
                    'title' : that.lang('tab_local'),
                    'content' : that.nodes['local']['li']
                });
            }
            if(that.params['fileManager']){
                that.components['tabset'].addTab({
                    'id' : 'fileManager',
                    'title' : that.lang('tab_filemanager'),
                    'content' : that.nodes['fileManager']['li']
                });
            }
            that.components['tabset'].set(that.params['local'] ? 'local' : 'fileManager');
        });
        return that;
    };

    classProto.renderLocal = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['li'] = cm.node('li',
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__local-container'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'})
            )
        );
        return nodes;
    };

    classProto.renderFileManager = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['li'] = cm.node('li',
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__file-manager is-fullsize'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'})
            )
        );
        return nodes;
    };

    /* *** AFTER EVENTS *** */

    classProto.afterGet = function(data){
        var that = this;
        that.items = data;
        that.triggerEvent('onGet', that.items);
        return that;
    };

    classProto.afterComplete = function(data){
        var that = this;
        that.items = data;
        that.triggerEvent('onComplete', that.items);
        return that;
    };
});
cm.define('Com.FileUploaderContainer', {
    'extend' : 'Com.AbstractContainer',
    'events' : [
        'onComplete',
        'onGet'
    ],
    'params' : {
        'constructor' : 'Com.FileUploader',
        'placeholder' : true,
        'placeholderConstructor' : 'Com.DialogContainer',
        'placeholderParams' : {
            'renderButtons' : true,
            'params' : {
                'width' : 900
            }
        },
        'langs' : {
            'title_single' : 'Please select file',
            'title_multiple' : 'Please select files',
            'close' : 'Cancel',
            'save' : 'Select'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.FileUploaderContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.getHandler = that.get.bind(that);
        that.completeHandler = that.complete.bind(that);
        that.afterCompleteHandler = that.afterComplete.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Validate Language Strings
        that.setLangs({
            'title' : !that.params['params']['max'] || that.params['params']['max'] > 1 ? that.lang('title_multiple') : that.lang('title_single')
        });
    };

    classProto.get = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].get && that.components['controller'].get();
        return that;
    };

    classProto.complete = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].complete && that.components['controller'].complete();
        return that;
    };

    /* *** SYSTEM *** */

    classProto.renderControllerEvents = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.renderControllerEvents.apply(that, arguments);
        // Add specific events
        that.components['controller'].addEvent('onGet', function(my, data){
            that.afterGet(data);
        });
        that.components['controller'].addEvent('onComplete', function(my, data){
            that.afterComplete(data);
        });
        return that;
    };

    classProto.renderPlaceholderButtons = function(){
        var that = this;
        that.components['placeholder'].addButton({
            'name' : 'close',
            'label' : that.lang('close'),
            'style' : 'button-transparent',
            'callback' : that.closeHandler
        });
        that.components['placeholder'].addButton({
            'name' : 'save',
            'label' : that.lang('save'),
            'style' : 'button-primary',
            'callback' : that.completeHandler
        });
        return that;
    };

    /* *** AFTER EVENTS *** */

    classProto.afterGet = function(data){
        var that = this;
        that.triggerEvent('onGet', data);
        return that;
    };

    classProto.afterComplete = function(data){
        var that = this;
        that.triggerEvent('onComplete', data);
        that.close();
        return that;
    };
});
cm.define('Com.FileUploaderLocal', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect'
    ],
    'params' : {
        'max' : 0,
        'fileList' : true,
        'fileListConstructor' : 'Com.MultipleFileInput',
        'fileListParams' : {
            'local' : false,
            'dropzone' : false,
            'fileManager' : false,
            'fileUploader' : false,
            'embedStructure' : 'append'
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : false,
            'height' : 256
        },
        'showOverlay' : true,
        'overlayDelay' : 'cm._config.loadDelay',
        'Com.Overlay' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'showSpinner' : true,
            'showContent' : false,
            'position' : 'absolute',
            'theme' : 'light'
        },
        'Com.FileReader' : {},
        'langs' : {
            'browse_local_single' : 'Choose file',
            'browse_local_multiple' : 'Choose files',
            'or' : 'or',
            'browse' : 'Browse'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileUploaderLocal', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.items = [];
        that.isMultiple = false;
        that.isProccesing = false;
        that.overlayDelay = null;
        // Bind context to methods
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.items;
    };

    classProto.validateParams = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        // Validate Language Strings
        that.setLangs({
            'browse_local' : !that.params['max'] || that.params['max'] > 1 ? that.lang('browse_local_multiple') : that.lang('browse_local_single')
        });
        // Components parameters
        that.params['fileListParams']['max'] = that.params['max'];
        that.params['dropzoneParams']['max'] = that.params['max'];
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__local'},
            that.nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'},
                cm.node('div', {'class' : 'pt__buttons pull-center'},
                    cm.node('div', {'class' : 'inner'},
                        cm.node('div', {'class' : 'browse-button'},
                            cm.node('button', {'type' : 'button','class' : 'button button-primary button--xlarge'}, that.lang('browse_local')),
                            cm.node('div', {'class' : 'inner'},
                                that.nodes['input'] = cm.node('input', {'type' : 'file'})
                            )
                        )
                    )
                )
            )
        );
        if(that.params['dropzone']){
            that.nodes['dropzoneHolder'] = cm.node('div', {'class' : 'com__file-uploader__holder'},
                cm.node('div', {'class' : 'com__file-uploader__title'}, that.lang('or')),
                that.nodes['dropzone'] = cm.node('div', {'class' : 'com__file-uploader__dropzone'})
            );
            cm.appendChild(that.nodes['dropzoneHolder'], that.nodes['container']);
        }
        if(that.params['fileList']){
            that.nodes['files'] = cm.node('div', {'class' : 'com__file-uploader__files is-hidden'});
            cm.appendChild(that.nodes['files'], that.nodes['container']);
        }
        that.isMultiple && that.nodes['input'].setAttribute('multiple', 'multiple');
        // Events
        that.triggerEvent('onRenderViewProcess');
        cm.addEvent(that.nodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['overlay'] = new classConstructor(
                cm.merge(that.params[className], {
                    'container' : that.nodes['container']
                })
            );
        });
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.components['reader'] = new classObject(that.params[className]);
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.components['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.nodes['dropzone']
                    })
                );
                that.components['dropzone'].addEvent('onSelect', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init Files Input
        if(that.params['fileList']){
            cm.getConstructor(that.params['fileListConstructor'], function(classObject){
                that.components['fileList'] = new classObject(
                    cm.merge(that.params['fileListParams'], {
                        'node' : that.nodes['files']
                    })
                );
                that.components['fileList'].addEvent('onItemAddEnd', function(){
                    if(that.components['fileList'].get().length){
                        cm.removeClass(that.nodes['files'], 'is-hidden');
                    }
                });
                that.components['fileList'].addEvent('onItemRemoveEnd', function(){
                    if(!that.components['fileList'].get().length){
                        cm.addClass(that.nodes['files'], 'is-hidden');
                    }
                });
            });
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            length = that.params['max'] ? Math.min(e.target.files.length, (that.params['max'] - that.items.length)) : e.target.files.length,
            data = [];
        cm.preventDefault(e);
        cm.forEach(length, function(i){
            data.push(e.target.files[i]);
        });
        that.processFiles(data);
        return that;
    };

    classProto.processFiles = function(data){
        var that = this,
            length = data.length;
        // Show Overlay
        if(that.params['showOverlay']){
            that.overlayDelay = setTimeout(function(){
                if(that.components['overlay'] && !that.components['overlay'].isOpen){
                    that.components['overlay'].open();
                }
            }, that.params['overlayDelay']);
        }
        // Process
        cm.forEach(data, function(file, i){
            that.components['reader'].read(file, function(item){
                that.items[i] = item;
                if(cm.getLength(that.items) === length){
                    that.finalizeFiles();
                }
            });
        });
        return that;
    };

    classProto.finalizeFiles = function(){
        var that = this;
        // Render Files List
        if(that.components['fileList']){
            that.renderFileList();
        }
        // Hide Overlay
        if(that.params['showOverlay']){
            that.overlayDelay && clearTimeout(that.overlayDelay);
            if(that.components['overlay'] && that.components['overlay'].isOpen){
                that.components['overlay'].close();
            }
        }
        // Trigger events
        that.triggerEvent('onSelect', that.items);
        return that;
    };

    classProto.renderFileList = function(){
        var that = this;
        cm.forEach(that.items, function(item){
            that.components['fileList'].addItem({'value' : item}, true);
        });
        return that;
    };
});
cm.define('Com.FormStepsLoader', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'animateDuration' : 'cm._config.animDuration',
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'POST',
            'url' : '',                                             // Request URL. Variables: %baseUrl%
            'params' : {                                            // Request URL. Variables: %baseUrl%, %request%, %response%
                'request' : '%request%',
                'response' : '%response%'
            }
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'request' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        },
        'buttons' : {
            'send' : cm.node('div')
        },
        'response' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        }
    };
    that.components = {};
    that.animations = {};

    that.ajaxHandler = null;
    that.isProcess = false;
    that.isRendering = false;
    that.loaderDelay = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Overlay']['container'] = that.nodes['container'];
    };

    var render = function(){
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['loader'] = new classConstructor(that.params[className]);
        });
        // Animations
        that.animations['response'] = new cm.Animation(that.nodes['response']['container']);
        // Events
        cm.addEvent(that.nodes['buttons']['send'], 'click', that.send);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl,
            '%request%' : cm.getFDO(that.nodes['request']['inner']),
            '%response%' : cm.getFDO(that.nodes['response']['inner'])
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, response){
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.start = function(that, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onSendEnd');
        that.triggerEvent('onProcessEnd', that.nodes['response']['inner']);
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, response);
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config){
        that.callbacks.renderError(that, config);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.callbacks.render(that, response);
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderTemporary = function(that){
        return cm.node('div', {'class' : 'form__temporary'});
    };

    that.callbacks.render = function(that, data){
        var nodes, temporary;
        if(that.params['responseHTML']){
            that.isRendering = true;
            temporary = that.callbacks.renderTemporary(that);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    temporary.appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            temporary.appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.renderError = function(that, config){
        if(that.params['responseHTML']){
            that.isRendering = true;
            var temporary = that.callbacks.renderTemporary(that);
            temporary.appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.append = function(that, temporary){
        var height;
        // Wrap old content
        if(!that.nodes['response']['temporary']){
            that.nodes['response']['temporary'] = that.callbacks.renderTemporary(that);
            cm.forEach(that.nodes['response']['inner'].childNodes, function(node){
                cm.appendChild(node, that.nodes['response']['temporary']);
            });
            cm.appendChild(that.nodes['response']['temporary'], that.nodes['response']['inner']);
        }
        cm.removeClass(that.nodes['response']['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['response']['inner']);
        cm.addClass(temporary, 'is-show', true);
        // Animate
        cm.removeClass(that.nodes['response']['container'], 'is-loaded', true);
        cm.addClass(that.nodes['response']['container'], 'is-show', true);
        height = temporary.offsetHeight;
        that.animations['response'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                that.nodes['response']['container'].style.height = '';
                cm.remove(that.nodes['response']['temporary']);
                cm.addClass(that.nodes['response']['container'], 'is-loaded', true);
                that.nodes['response']['temporary'] = temporary;
                that.isRendering = false;
            }
        });
    };

    /* ******* PUBLIC ******* */

    that.send = function(){
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        }
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});
cm.define('Com.Gallery', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onSet',
        'onChange',
        'onItemLoad',
        'onItemSet'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'node' : cm.Node('div'),
        'data' : [],
        'duration' : 500,
        'showCaption' : true,
        'showArrowTitles' : false,
        'autoplay' : true,
        'zoom' : true,
        'icons' : {
            'prev' : 'icon default prev',
            'next' : 'icon default next',
            'zoom' : 'icon cm-i default zoom'
        },
        'Com.Zoom' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'documentScroll' : true
        }
    }
},
function(params){
    var that = this,
        items = [],
        anim = {};

    that.components = {};

    that.current = null;
    that.previous = null;
    that.isProcess = false;

    that.nodes = {
        'items' : []
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        // Collect items
        cm.forEach(that.nodes['items'], collectItem);
        // Process config items
        cm.forEach(that.params['data'], processItem);
        afterRender();
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__gallery'},
            that.nodes['holder'] = cm.Node('div', {'class' : 'holder'}),
            that.nodes['bar'] = cm.Node('div', {'class' : 'com__gallery-controls is-full'},
                cm.Node('div', {'class' : 'inner'},
                    that.nodes['prev'] = cm.Node('div', {'class' : 'bar-arrow prev'},
                        cm.Node('div', {'class' : that.params['icons']['prev']})
                    ),
                    that.nodes['next'] = cm.Node('div', {'class' : 'bar-arrow next'},
                        cm.Node('div', {'class' : that.params['icons']['next']})
                    ),
                    that.nodes['zoom'] = cm.Node('div', {'class' : 'bar-zoom'},
                        cm.Node('div', {'class' : that.params['icons']['zoom']})
                    )
                )
            ),
            that.nodes['loader'] = cm.Node('div', {'class' : 'loader'},
                cm.Node('div', {'class' : 'bg'}),
                cm.Node('div', {'class' : 'icon small loader centered'})
            )
        );
        // Arrow titles
        if(that.params['showArrowTitles']){
            that.nodes['next'].setAttribute('title', that.lang('Next'));
            that.nodes['prev'].setAttribute('title', that.lang('Previous'));
        }
        // Zoom
        if(that.params['zoom']){
            cm.getConstructor('Com.Zoom', function(classConstructor){
                that.components['zoom'] = new classConstructor(that.params['Com.Zoom']);
                cm.addEvent(that.nodes['zoom'], 'click', zoom);
            });
        }else{
            cm.remove(that.nodes['zoom']);
        }
        // Set events
        cm.addEvent(that.nodes['next'], 'click', next);
        cm.addEvent(that.nodes['prev'], 'click', prev);
        // Init animation
        anim['loader'] = new cm.Animation(that.nodes['loader']);
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        if(items.length < 2){
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }else{
            that.nodes['next'].style.display = '';
            that.nodes['prev'].style.display = '';
        }
    };

    var collectItem = function(item){
        if(!item['link']){
            item['link'] = cm.node('a');
        }
        item = cm.merge({
            'src' : item['link'].getAttribute('href') || '',
            'title' : item['link'].getAttribute('title') || ''
        }, item);
        processItem(item);
    };

    var processItem = function(item){
        item = cm.merge({
            'index' : items.length,
            'isLoad' : false,
            'type' : 'image',        // image | iframe
            'nodes' : {},
            'src' : '',
            'title' : '',
            'mime' : ''
        }, item);
        // Check type
        if(
            /(\.jpg|\.png|\.gif|\.jpeg|\.bmp|\.tga)$/gi.test(item['src'])
            || /^data:image/gi.test(item['src'])
            || /^image/gi.test(item['mime'])
        ){
            item['type'] = 'image';
        }else{
            item['type'] = 'iframe';
        }
        // Structure
        if(!item['link']){
            item['link'] = cm.node('a');
        }
        item['nodes']['container'] = cm.Node('div', {'class' : 'pt__image is-centered'},
            item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render by type
        if(item['type'] == 'image'){
            item['nodes']['inner'].appendChild(
                item['nodes']['content'] = cm.Node('img', {'class' : 'descr', 'alt' : item['title'], 'title' : item['title']})
            );
        }else{
            item['nodes']['inner'].appendChild(
                item['nodes']['content'] = cm.Node('iframe', {'class' : 'descr', 'webkitallowfullscreen' : true, 'mozallowfullscreen' : true, 'allowfullscreen' : true})
            );
        }
        // Caption
        if(that.params['showCaption'] && !cm.isEmpty(item['title'] && item['type'] == 'image')){
            item['nodes']['inner'].appendChild(
                cm.Node('div', {'class' : 'title'},
                    cm.Node('div', {'class' : 'inner'}, item['title'])
                )
            );
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Set image on thumb click
        cm.addEvent(item['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set(item['index']);
        }, true, true);
        // Push item to array
        items.push(item);
    };

    var set = function(i){
        var item, itemOld;
        if(!that.isProcess){
            that.isProcess = true;
            // Get item
            item = items[i];
            itemOld = items[that.current];
            // API onSet
            that.triggerEvent('onSet', {
                'current' : item,
                'previous' : itemOld
            });
            // If current active item not equal new item - process with new item, else redraw window alignment and dimensions
            if(i != that.current){
                // API onSet
                that.triggerEvent('onChange', {
                    'current' : item,
                    'previous' : itemOld
                });
                // Check type
                if(item['type'] == 'image'){
                    setItemImage(i, item, itemOld);
                }else{
                    setItemIframe(i, item, itemOld);
                }
            }else{
                that.isProcess = false;
            }
        }
    };

    var setItemImage = function(i, item, itemOld){
        cm.replaceClass(that.nodes['bar'], 'is-partial', 'is-full');
        if(!item['isLoad']){
            setLoader(i, item, itemOld);
        }else{
            setItem(i, item, itemOld);
        }
    };

    var setItemIframe = function(i, item, itemOld){
        cm.replaceClass(that.nodes['bar'], 'is-full', 'is-partial');
        that.nodes['holder'].appendChild(item['nodes']['container']);
        setLoader(i, item, itemOld);
    };

    var setLoader = function(i, item, itemOld){
        that.nodes['loader'].style.display = 'block';
        anim['loader'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : that.params['duration']});
        // Add image load event and src
        cm.addEvent(item['nodes']['content'], 'load', function(){
            item['isLoad'] = true;
            // Hide loader
            removeLoader();
            // Set and show item
            setItem(i, item, itemOld);
        });
        cm.addEvent(item['nodes']['content'], 'error', function(){
            item['isLoad'] = false;
            // Hide loader
            removeLoader();
            // Set and show item
            setItem(i, item, itemOld);
        });
        item['nodes']['content'].src = item['src'];
    };

    var removeLoader = function(){
        anim['loader'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : that.params['duration'], 'onStop' : function(){
            that.nodes['loader'].style.display = 'none';
        }});
    };

    var setItem = function(i, item, itemOld){
        // Set new active
        that.previous = that.current;
        that.current = i;
        // API onImageSetStart
        that.triggerEvent('onItemLoad', item);
        // Embed item content
        if(itemOld){
            itemOld['nodes']['container'].style.zIndex = 1;
            item['nodes']['container'].style.zIndex = 2;
        }
        if(item['type'] == 'image'){
            that.nodes['holder'].appendChild(item['nodes']['container']);
        }
        // Animate Slide
        item['anim'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : that.params['duration'], 'onStop' : function(){
            // Remove old item
            if(itemOld){
                cm.setOpacity(itemOld['nodes']['container'], 0);
                cm.remove(itemOld['nodes']['container']);
            }
            // API onImageSet event
            that.triggerEvent('onItemSet', item);
            that.isProcess = false;
        }});
    };

    var next = function(){
        set((that.current == items.length - 1)? 0 : that.current + 1);
    };

    var prev = function(){
        set((that.current == 0)? items.length - 1 : that.current - 1);
    };

    var zoom = function(){
        that.components['zoom']
            .set(items[that.current]['src'])
            .open();
    };

    /* ******* MAIN ******* */

    that.set = function(i){
        if(!isNaN(i) && items[i]){
            set(i);
        }
        return that;
    };

    that.next = function(){
        next();
        return that;
    };

    that.prev = function(){
        prev();
        return that;
    };

    that.getCount = function(){
        return items.length;
    };

    that.stop = function(){
        that.isProcess = false;
        return that;
    };

    that.clear = function(){
        if(that.current && items[that.current]){
            cm.remove(items[that.current]['nodes']['container']);
        }
        that.current = null;
        that.previous = null;
        items = [];
        return that;
    };

    that.add = function(item){
        item = cm.merge({
            'link' : cm.node('a'),
            'src' : '',
            'title' : ''
        }, item);
        processItem(item);
        return that;
    };

    that.collect = function(node){
        var nodes;
        if(cm.isNode(node)){
            nodes = cm.getNodes(node);
            // Collect items
            if(nodes['items']){
                cm.forEach(nodes['items'], collectItem);
                afterRender();
            }
        }
        return that;
    };

    init();
});
cm.define('Com.GalleryLayout', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onChange'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'barDirection' : 'horizontal',      // horizontal | vertical
        'hasBar' : true,
        'Com.Gallery' : {},
        'Com.Scroll' : {
            'step' : 25,
            'time' : 25
        }
    }
},
function(params){
    var that = this,
        components = {},
        items = [];
    
    that.nodes = {
        'inner' : cm.Node('div'),
        'preview-inner' : cm.Node('div'),
        'bar-inner' : cm.Node('div'),
        'bar-items' : []
    };

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        collectItems();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Scroll
        components['scroll'] = new Com.Scroll(
            cm.merge(that.params['Com.Scroll'], {
                'nodes' : that.nodes['ComScroll']
            })
        );
        // Gallery
        components['gallery'] = new Com.Gallery(
                cm.merge(that.params['Com.Gallery'], {
                    'container' : that.nodes['preview-inner'],
                    'data' : items
                })
            )
            .addEvent('onChange', onChange)
            .set(0);
    };

    var collectItems = function(){
        cm.forEach(that.nodes['bar-items'], function(item){
            item['title'] = item['link']? item['link'].getAttribute('title') || '' : '';
            item['src'] = item['link']? item['link'].getAttribute('href') || '' : '';
            items.push(item);
        });
    };

    var onChange = function(gallery, data){
        var item = data['current'],
            left,
            top;
        
        if(that.params['hasBar']){
            // Thumbs classes
            if(data['previous']){
                cm.removeClass(data['previous']['container'], 'active');
            }
            cm.addClass(item['container'], 'active');
            // Move bar
            if(that.params['barDirection'] == 'vertical'){
                top = item['container'].offsetTop - (that.nodes['inner'].offsetHeight / 2) + (item['container'].offsetHeight / 2);
                components['scroll'].scrollY(top);
            }else{
                left = item['container'].offsetLeft - (that.nodes['inner'].offsetWidth / 2) + (item['container'].offsetWidth / 2);
                components['scroll'].scrollX(left);
            }
        }
        // API onSet event
        that.triggerEvent('onChange', data);
    };

    /* ******* MAIN ******* */

    init();
});
cm.define('Com.GalleryPopup', {
    'modules' : [
        'Params',
        'DataConfig',
        'Events',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onOpen',
        'onClose',
        'onChange'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'size' : 'fullscreen',                   // fullscreen | auto
        'aspectRatio' : 'auto',                  // auto | 1x1 | 4x3 | 3x2 | 16x10 | 16x9 | 2x1 | 21x9 | 35x10 | 3x4 | 2x3 | 10x16 | 9x16 | 1x2
        'theme' : 'theme-black',
        'showCounter' : true,
        'showTitle' : true,
        'data' : [],
        'openOnSelfClick' : false,
        'Com.Dialog' : {
            'width' : '700',
            'autoOpen' : false,
            'titleOverflow' : true,
            'closeOnBackground' : true,
            'className' : 'com__gallery-popup'
        },
        'Com.Gallery' : {
            'showCaption' : false
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        validateParams();
        that.triggerEvent('onRenderStart');
        render();
        setLogic();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Dialog']['theme'] = that.params['theme'];
        that.params['Com.Dialog']['size'] = that.params['size'];
        if(that.params['size'] == 'fullscreen'){
            that.params['Com.Dialog']['documentScroll'] = false;
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__gallery-preview bottom'},
            nodes['galleryContainer'] = cm.Node('div', {'class' : 'inner'})
        );
        // Set aspect ration
        if(that.params['aspectRatio'] != 'auto'){
            cm.addClass(nodes['container'], ['cm__aspect', that.params['aspectRatio']].join('-'));
        }
    };

    var setLogic = function(){
        // Dialog
        cm.getConstructor('Com.Dialog', function(classConstructor){
            components['dialog'] = new classConstructor(
                    cm.merge(that.params['Com.Dialog'], {
                        'content' : nodes['container']
                    })
                )
                .addEvent('onOpen', function(){
                    cm.addEvent(window, 'keydown', keyboardEvents);
                    that.triggerEvent('onOpen');
                })
                .addEvent('onClose', function(){
                    components['gallery'].stop();
                    cm.removeEvent(window, 'keydown', keyboardEvents);
                    that.triggerEvent('onClose');
                });
        });
        // Gallery
        cm.getConstructor('Com.Gallery', function(classConstructor){
            components['gallery'] = new classConstructor(
                    cm.merge(that.params['Com.Gallery'], {
                        'node' : that.params['node'],
                        'container' : nodes['galleryContainer'],
                        'data' : that.params['data']
                    })
                )
                .addEvent('onSet', components['dialog'].open)
                .addEvent('onChange', onChange);
        });
        // Node's self click
        if(that.params['openOnSelfClick']){
            cm.addEvent(that.params['node'], 'click', that.open);
        }
    };

    var onChange = function(gallery, data){
        var title;
        // Set caption
        if(that.params['showCounter']){
            title = [(data['current']['index'] + 1), gallery.getCount()].join('/');
        }
        if(that.params['showTitle']){
            if(that.params['showCounter']){
                if(!cm.isEmpty(data['current']['title'])){
                    title = [title, data['current']['title']].join(' - ');
                }
            }else{
                title = data['current']['title'];
            }
        }
        if(that.params['showCounter'] || that.params['showTitle']){
            components['dialog'].setTitle(title);
        }
        that.triggerEvent('onChange', data);
    };

    var keyboardEvents = function(e){
        e = cm.getEvent(e);
        switch(e.keyCode){
            case 37:
                components['dialog'].isFocus && components['gallery'].prev();
                break;
            case 39:
                components['dialog'].isFocus && components['gallery'].next();
                break;
        }
    };

    /* ******* MAIN ******* */

    that.open = function(){
        that.set(0);
        return that;
    };

    that.close = function(){
        components['dialog'].close();
        return that;
    };

    that.set = function(i){
        components['gallery'].set(i);
        return that;
    };

    that.next = function(){
        components['gallery'].next();
        return that;
    };

    that.prev = function(){
        components['gallery'].prev();
        return that;
    };

    that.add = function(item){
        components['gallery'].add(item);
        return that;
    };

    that.collect = function(node){
        components['gallery'].collect(node);
        return that;
    };

    that.clear = function(){
        components['gallery'].clear();
        return that;
    };

    init();
});
cm.define('Com.Glossary', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'showTitle' : true,
        'Com.Tooltip' : {
            'className' : 'com__glossary__tooltip',
            'targetEvent' : 'hover'
        }
    }
},
function(params){
    var that = this;

    that.components = {};
    that.nodes = {
        'container' : cm.Node('div'),
        'title' : cm.Node('div'),
        'content' : cm.Node('div')
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'target' : that.nodes['container'],
                'content' : that.nodes['content'],
                'title' : that.params['showTitle']? that.nodes['title'].cloneNode(true) : ''
            })
        );
        that.triggerEvent('onRender', {});
    };

    /* ******* MAIN ******* */

    init();
});
cm.define('Com.Gridlist', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onSort',
        'onCheckAll',
        'onUnCheckAll',
        'onCheck',
        'onUnCheck',
        'onRenderStart',
        'onRenderEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'embedStructure' : 'append',
        'name' : '',
        'data' : [],
        'cols' : [],
        'sort' : true,
        'sortBy' : 'id',                                            // Default sort by key in array
        'orderBy' : 'ASC',
        'childsBy' : false,                                         // Render child rows after parent, WIP - doesn't work checking / uncheking rows and statuses
        'pagination' : true,
        'perPage' : 25,
        'showCounter' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',                 // Input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat',          // Render date format
        'responseCountKey' : 'count',                               // Ajax data count response key
        'responseKey' : 'data',                                     // Ajax data response key
        'ajax' : {                                                  // Ajax, WIP - doesn't work checking / uncheking rows and statuses
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
        },
        'langs' : {
            'counter' : 'Count: ',
            'check_all' : 'Check all',
            'uncheck_all' : 'Uncheck all',
            'empty' : 'Items does not found',
            'actions' : 'Actions'
        },
        'icons' : {
            'arrow' : {
                'desc' : 'icon arrow desc',
                'asc' : 'icon arrow asc'
            }
        },
        'statuses' : ['active', 'success', 'danger', 'warning'],
        'Com.Pagination' : {
            'renderStructure' : true,
            'animateSwitch' : true,
            'animatePrevious' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.isAjax = false;
    that.isCheckedAll = false;
    that.sortBy = null;
    that.orderBy = 'ASC';
    that.rows = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
    };

    var validateParams = function(){
        that.sortBy = that.params['sortBy'];
        that.orderBy = that.params['orderBy'];
        // Ajax
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
            that.params['pagination'] = true;
            that.params['Com.Pagination']['ajax'] = that.params['ajax'];
            that.params['Com.Pagination']['responseCountKey'] = that.params['responseCountKey'];
            that.params['Com.Pagination']['responseKey'] = that.params['responseKey'];
        }else{
            that.params['Com.Pagination']['count'] = that.params['data'].length;
        }
        // Pagination
        that.params['Com.Pagination']['perPage'] = that.params['perPage'];
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        // Container
        that.nodes['container'] = cm.node('div', {'class' : 'com__gridlist'});
        // Add css class
        cm.addClass(that.nodes['container'], that.params['className']);
        // Append
        that.embedStructure(that.nodes['container']);
        // Render table page
        if(that.isAjax){
            // Render dynamic pagination
            renderPagination();
        }else if(that.params['data'].length){
            // Counter
            if(that.params['showCounter']){
                renderCounter(that.params['data'].length);
            }
            // Sort data array for first time
            that.params['sort'] && arraySort();
            if(that.params['pagination']){
                // Render static pagination
                renderPagination();
            }else{
                // Render all data items
                renderTable(1, that.params['data'], that.nodes['container']);
            }
        }else{
            renderEmptiness(that.nodes['container']);
        }
    };

    var renderPagination = function(){
        var startIndex, endIndex, dataArray;
        cm.getConstructor('Com.Pagination', function(classConstructor){
            that.components['pagination'] = new classConstructor(
                cm.merge(that.params['Com.Pagination'], {
                    'container' : that.nodes['container'],
                    'callbacks' : {
                        'afterPrepare' : function(pagination, config){
                            config['url'] = cm.strReplace(config['url'], {
                                '%sortBy%' : that.sortBy,
                                '%orderBy%' : that.orderBy
                            });
                            config['params'] = cm.objectReplace(config['params'], {
                                '%sortBy%' : that.sortBy,
                                '%orderBy%' : that.orderBy
                            });
                            return config;
                        }
                    },
                    'events' : {
                        'onPageRender' : function(pagination, data){
                            if(that.isAjax){
                                if(data.isError){

                                }else if(data['data'].length){
                                    renderTable(data['page'], data['data'], data['container']);
                                }else{
                                    renderEmptiness(data['container']);
                                }
                            }else{
                                startIndex = that.params['perPage'] * (data['page'] - 1);
                                endIndex = Math.min(that.params['perPage'] * data['page'], that.params['data'].length);
                                dataArray = that.params['data'].slice(startIndex, endIndex);
                                renderTable(data['page'], dataArray, data['container']);
                            }
                        },
                        'onSetCount' : function(pagination, count){
                            that.params['showCounter'] && renderCounter(count);
                        }
                    }
                })
            );
        });
    };

    var renderCounter = function(count){
        if(that.nodes['counter']){
            that.nodes['counter'].innerHTML = that.lang('counter') + count;
        }else{
            that.nodes['counter'] = cm.node('div', {'class' : 'pt__gridlist__counter'}, that.lang('counter') + count);
            cm.insertFirst(that.nodes['counter'], that.nodes['container']);
        }
    };

    var renderEmptiness = function(container){
        that.nodes['empty'] = cm.node('div', {'class' : 'cm__empty'}, that.lang('empty'));
        cm.appendChild(that.nodes['empty'], container);
    };

    var renderTable = function(page, data, container){
        /*
            If pagination not exists we need to clean up table before render new one, cause on each sort will be rendered new table.
            When pagination exists, each rendered table will be have his own container, and no needs to clean up previous table.
        */
        if(!that.params['pagination']){
            cm.remove(that.nodes['table']);
        }
        // API onRenderStart event
        that.triggerEvent('onRenderStart', {
            'container' : container,
            'page' : page
        });
        // Render Table
        that.nodes['table'] = cm.node('div', {'class' : 'pt__gridlist'},
            cm.node('table',
                cm.node('thead',
                    that.nodes['title'] = cm.node('tr')
                ),
                that.nodes['content'] = cm.node('tbody')
            )
        );
        // Render Table Title
        cm.forEach(that.params['cols'], renderTh);
        // Render Table Row
        cm.forEach(data, function(item, i){
            renderRow(that.rows, item, (i + (page -1)));
        });
        // Append
        cm.appendChild(that.nodes['table'], container);
        // API onRenderEnd event
        that.triggerEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : that.rows
        });
    };

    var renderTh = function(item, i){
        // Merge cell parameters
        item = that.params['cols'][i] = cm.merge({
            '_component' : null,            // System attribute
            'width' : 'auto',               // number | % | auto
            'access' : true,                // Render column if is accessible
            'type' : 'text',		        // text | number | url | date | html | icon | checkbox | empty | actions | links
            'key' : '',                     // Data array key
            'title' : '',                   // Table th title
            'sort' : that.params['sort'],   // Sort this column or not
            'textOverflow' : false,         // Overflow long text to single line
            'class' : '',		            // Icon css class, for type="icon"
            'target' : '_blank',            // Link target, for type="url"
            'showTitle' : false,            // Show title on hover
            'titleText' : '',               // Alternative title text, if not specified - will be shown key text
            'altText' : '',                 // Alternative column text
            'urlKey' : false,               // Alternative link href, for type="url"
            'links' : [],                   // Render links menu, for type="links"
            'actions' : [],                 // Render actions menu, for type="actions"
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);
        item['nodes'] = {};
        // Check access
        if(item['access']){
            // Structure
            that.nodes['title'].appendChild(
                item['nodes']['container'] = cm.node('th', {'width' : item['width']},
                    item['nodes']['inner'] = cm.node('div', {'class' : 'inner'})
                )
            );
            // Insert specific specified content in th
            switch(item['type']){
                case 'checkbox' :
                    cm.addClass(item['nodes']['container'], 'control');
                    item['nodes']['inner'].appendChild(
                        item['nodes']['checkbox'] = cm.node('input', {'type' : 'checkbox', 'title' : that.lang('check_all')})
                    );
                    item['nodes']['checkbox'].checked = that.isCheckedAll;
                    cm.addEvent(item['nodes']['checkbox'], 'click', function(){
                        if(that.isCheckedAll == true){
                            that.unCheckAll();
                        }else{
                            that.checkAll();
                        }
                    });
                    that.nodes['checkbox'] = item['nodes']['checkbox'];
                    break;

                default:
                    item['nodes']['inner'].appendChild(
                        cm.node('span', item['title'])
                    );
                    break;
            }
            // Render sort arrow and set function on click to th
            if(item['sort'] && !/icon|empty|actions|links|checkbox/.test(item['type'])){
                cm.addClass(item['nodes']['container'], 'sort');
                if(item['key'] == that.sortBy){
                    item['nodes']['inner'].appendChild(
                        cm.node('div', {'class' : that.params['icons']['arrow'][that.orderBy.toLowerCase()]})
                    );
                }
                cm.addEvent(item['nodes']['inner'], 'click', function(){
                    that.sortBy = item['key'];
                    that.orderBy = that.orderBy == 'ASC' ? 'DESC' : 'ASC';
                    !that.isAjax && arraySort();
                    if(that.params['pagination']){
                        that.components['pagination'].rebuild();
                    }else{
                        renderTable(1, that.params['data'], that.nodes['container']);
                    }
                });
            }
        }
    };

    var renderRow = function(parentRow, data, i){
        // Config
        var item = {
            'index' : i,
            'data' : data,
            'childs' : [],
            'isChecked' : data['_checked'] || false,
            'status' : data['_status'] || false,
            'nodes' : {
                'cols' : []
            }
        };
        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.node('tr')
        );
        // Render cells
        cm.forEach(that.params['cols'], function(col){
            renderCell(col, item);
        });
        // Render childs
        if(that.params['childsBy']){
            cm.forEach(data[that.params['childsBy']], function(child, childI){
                renderRow(item['childs'], child, childI);
            });
        }
        // Push to rows array
        parentRow.push(item);
    };

    var renderCell = function(col, item){
        var nodes = {},
            text,
            title,
            href;
        // Check access
        if(col['access']){
            text = cm.isEmpty(cm.objectPath(col['key'], item['data']))? '' : cm.objectPath(col['key'], item['data']);
            title = cm.isEmpty(col['titleText'])? text : col['titleText'];
            // Structure
            item['nodes']['container'].appendChild(
                nodes['container'] = cm.node('td')
            );
            // Text overflow
            if(col['textOverflow']){
                nodes['inner'] = cm.node('div', {'class' : 'inner'});
                nodes['container'].appendChild(nodes['inner']);
            }else{
                nodes['inner'] = nodes['container'];
            }
            // Insert value by type
            switch(col['type']){
                case 'number' :
                    nodes['inner'].innerHTML = cm.splitNumber(text);
                    break;

                case 'date' :
                    if(that.params['dateFormat'] != that.params['visibleDateFormat']){
                        nodes['inner'].innerHTML = cm.dateFormat(
                            cm.parseDate(text, that.params['dateFormat']),
                            that.params['visibleDateFormat']
                        );
                    }else{
                        nodes['inner'].innerHTML = text;
                    }
                    break;

                case 'icon' :
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('div', {'class' : col['class']})
                    );
                    cm.addClass(nodes['node'], 'icon linked inline');
                    break;

                case 'url' :
                    text = cm.decode(text);
                    href = col['urlKey'] && item['data'][col['urlKey']]? cm.decode(item['data'][col['urlKey']]) : text;
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('a', {'target' : col['target'], 'href' : href}, !cm.isEmpty(col['altText'])? col['altText'] : text)
                    );
                    break;

                case 'checkbox' :
                    cm.addClass(nodes['container'], 'control');
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('input', {'type' : 'checkbox'})
                    );
                    item['nodes']['checkbox'] = nodes['node'];
                    if(item['isChecked']){
                        checkRow(item, false);
                    }
                    cm.addEvent(nodes['node'], 'click', function(){
                        if(!item['isChecked']){
                            checkRow(item, true);
                        }else{
                            unCheckRow(item, true);
                        }
                    });
                    break;

                case 'links':
                    nodes['links'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('div', {'class' : ['pt__links', col['class']].join(' ')},
                            nodes['linksList'] = cm.node('ul')
                        )
                    );
                    cm.forEach(col['links'], function(actionItem){
                        var actionNode;
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {}
                        }, actionItem);
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['linksList'].appendChild(
                            cm.node('li',
                                actionNode = cm.node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        cm.forEach(actionItem['events'], function(actionEventHandler, actionEventName){
                            cm.addEvent(actionNode, actionEventName, actionEventHandler);
                        });
                        nodes['links'].push(actionNode);
                    });
                    break;

                case 'actions':
                    nodes['actions'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('div', {'class' : ['pt__links', 'pull-right', col['class']].join(' ')},
                            cm.node('ul',
                                nodes['componentNode'] = cm.node('li', {'class' : 'com__menu', 'data-node' : 'ComMenu:{}:button'},
                                    cm.node('a', {'class' : 'label'}, that.lang('actions')),
                                    cm.node('span', {'class' : 'cm-i__chevron-down xx-small inline'}),
                                    cm.node('div', {'class' : 'pt__menu', 'data-node' : 'ComMenu.target'},
                                        nodes['actionsList'] = cm.node('ul', {'class' : 'pt__menu-dropdown'})
                                    )
                                )
                            )
                        )
                    );
                    cm.forEach(col['actions'], function(actionItem){
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {},
                            'constructor' : false,
                            'constructorParams' : {},
                            'callback' : function(){}
                        }, actionItem);
                        // WTF is that?
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['actionsList'].appendChild(
                            cm.node('li',
                                actionItem['_node'] = cm.node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        if(actionItem['constructor']){
                            cm.getConstructor(actionItem['constructor'], function(classConstructor){
                                actionItem['controller'] = new classConstructor(
                                    cm.merge(actionItem['constructorParams'], {
                                        'node' : actionItem['_node'],
                                        'data' : item['data'],
                                        'cellItem' : item,
                                        'actionItem' : actionItem
                                    })
                                );
                            });
                        }else{
                            cm.addEvent(actionItem['_node'], 'click', function(e){
                                cm.preventDefault(e);
                                actionItem['callback'](e, actionItem, item);
                            });
                        }
                        nodes['actions'].push(actionItem['_node']);
                    });
                    cm.getConstructor('Com.Menu', function(classConstructor){
                        col['_component'] = new classConstructor({
                            'node' : nodes['componentNode']
                        });
                    });
                    break;

                case 'empty' :
                    break;

                default :
                    nodes['inner'].innerHTML = text;
                    break;
            }
            // Statuses
            if(item['status']){
                setRowStatus(item, item['status']);
            }
            // onHover Title
            if(col['showTitle']){
                if(nodes['node']){
                    nodes['node'].title = title;
                }else{
                    nodes['inner'].title = title;
                }
            }
            // onClick handler
            if(col['onClick']){
                cm.addEvent(nodes['node'] || nodes['inner'], 'click', function(e){
                    e = cm.getEvent(e);
                    cm.preventDefault(e);
                    // Column onClick event
                    col['onClick'](that, item);
                });
            }
            // onCellRender handler
            if(col['onRender']){
                col['onRender'](that, {
                    'nodes' : nodes,
                    'col' : col,
                    'row' : item
                });
            }
            // Push cell to row nodes array
            item['nodes']['cols'].push(nodes);
        }
    };

    /* *** HELPING FUNCTIONS *** */

    var arraySort = function(){
        // Get item
        var item, textA, textB, t1, t2, value;
        cm.forEach(that.params['cols'], function(col){
            if(col['key'] == that.sortBy){
                item = col;
            }
        });
        // Sort
        that.params['data'].sort(function(a, b){
            textA = a[that.sortBy];
            textB = b[that.sortBy];
            switch(item['type']){
                case 'html':
                    t1 = cm.getTextNodesStr(cm.strToHTML(textA));
                    t2 = cm.getTextNodesStr(cm.strToHTML(textB));
                    value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;

                case 'date':
                    t1 = cm.parseDate(textA, that.params['dateFormat']);
                    t2 = cm.parseDate(textB, that.params['dateFormat']);
                    return (that.orderBy == 'ASC')? (t1 - t2) : (t2 - t1);
                    break;

                case 'number':
                    value = textA - textB;
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;

                default :
                    t1 = textA? textA.toLowerCase() : '';
                    t2 = textB? textB.toLowerCase() : '';
                    value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;
            }
        });
        // API onSort Event
        that.triggerEvent('onSort', {
            'sortBy' : that.sortBy,
            'orderBy' : that.orderBy
        });
    };

    var checkRow = function(row, execute){
        if(row['nodes']['checkbox']){
            row['nodes']['checkbox'].checked = true;
        }
        row['isChecked'] = true;
        row['data']['_checked'] = true;
        if(row['status']){
            cm.removeClass(row['nodes']['container'], row['status']);
        }
        cm.addClass(row['nodes']['container'], 'active');
        if(execute){
            // API onCheck Event
            that.triggerEvent('onCheck', row);
        }
    };

    var unCheckRow = function(row, execute){
        if(row['nodes']['checkbox']){
            row['nodes']['checkbox'].checked = false;
        }
        row['isChecked'] = false;
        row['data']['_checked'] = false;
        cm.removeClass(row['nodes']['container'], 'active');
        if(row['status']){
            cm.addClass(row['nodes']['container'], row['status']);
        }
        if(execute){
            // API onUnCheck Event
            that.triggerEvent('onUnCheck', row);
        }
    };

    var setRowStatus = function(row, status){
        row['status'] = status;
        row['data']['_status'] = status;
        cm.removeClass(row['nodes']['container'], that.params['statuses'].join(' '));
        if(row['isChecked']){
            cm.addClass(row['nodes']['container'], 'active');
        }else if(cm.inArray(that.params['statuses'], status)){
            cm.addClass(row['nodes']['container'], status);
        }
    };

    var clearRowStatus = function(row){
        row['status'] = null;
        row['data']['_status'] = null;
        cm.removeClass(row['nodes']['container'], that.params['statuses'].join(' '));
    };

    /* ******* MAIN ******* */

    that.rebuild = function(){
        if(that.isAjax){
            that.components['pagination'].rebuild();
        }
        return that;
    };

    that.check = function(index){
        if(that.params['data'][index]){
            that.params['data'][index]['_checked'] = true;
        }
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                checkRow(row, true);
            }
        });
        return that;
    };

    that.unCheck = function(index){
        if(that.params['data'][index]){
            that.params['data'][index]['_checked'] = false;
        }
        cm.forEach(that.rows, function(row){
            if(row['index'] == index){
                unCheckRow(row, true);
            }
        });
        return that;
    };

    that.checkAll = function(){
        that.isCheckedAll = true;
        that.nodes['checkbox'].checked = true;
        cm.forEach(that.params['data'], function(row){
            row['_checked'] = true;
        });
        cm.forEach(that.rows, function(row){
            checkRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onCheckAll', that.params['data']);
        return that;
    };

    that.unCheckAll = function(){
        that.isCheckedAll = false;
        that.nodes['checkbox'].checked = false;
        cm.forEach(that.params['data'], function(row){
            row['_checked'] = false;
        });
        cm.forEach(that.rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onUnCheckAll', that.params['data']);
        return that;
    };

    that.getChecked = function(){
        var checkedRows = [];
        cm.forEach(that.rows, function(row){
            row['isChecked'] && checkedRows.push(row);
        });
        return checkedRows;
    };

    that.getCheckedData = function(){
        var checkedRows = [];
        cm.forEach(that.params['data'], function(row){
            row['_checked'] && checkedRows.push(row);
        });
        return checkedRows;
    };

    that.setRowStatus = function(index, status){
        cm.forEach(that.rows, function(row){
            if(row['index'] == index){
                setRowStatus(row, status);
            }
        });
        return that;
    };

    that.clearRowStatus = function(index){
        cm.forEach(that.rows, function(row){
            if(row['index'] == index){
                clearRowStatus(row);
            }
        });
        return that;
    };

    init();
});
cm.define('Com.GridlistHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onColumnsChange',
        'onColumnsResize',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'isEditing' : true,
        'customEvents' : true,
        'columns' : {
            'isEditing' : false,
            'customEvents' : false,
            'showDrag' : false,
            'ajax' : {
                'type' : 'json',
                'method' : 'post',
                'url' : '',                                             // Request URL. Variables: %items%, %callback% for JSONP.
                'params' : ''                                           // Params object. %items%, %callback% for JSONP.
            }
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'thead' : cm.node('thead'),
        'items' : []
    };
    that.components = {};
    that.isEditing = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.nodes['container'] = that.params['node'];
    };

    var render = function(){
        // Get Nodes
        that.nodes['thead'] = that.nodes['container'].getElementsByTagName('thead')[0] || that.nodes['thead'];
        that.nodes['items'] = that.nodes['thead'].getElementsByTagName('th');
        // Init Columns
        cm.getConstructor('Com.ColumnsHelper', function(classConstructor){
            that.components['columns'] = new classConstructor(
                cm.merge(that.params['columns'], {
                    'node' : that.nodes['container'],
                    'items' : that.nodes['items'],
                    'events' : {
                        'onDragStart' : function(){
                            cm.addClass(that.nodes['container'], 'is-active');
                        },
                        'onDragStop' : function(){
                            cm.removeClass(that.nodes['container'], 'is-active');
                        },
                        'onChange' : function(my, items){
                            that.triggerEvent('onColumnsChange', items);
                        },
                        'onResize' : function(my, items){
                            that.triggerEvent('onColumnsResize', items);
                        }
                    }
                })
            );
        });
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(that.params['node'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(that.params['node'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
        // Editing
        that.params['isEditing'] && that.enableEditing();
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.components['columns'] && that.components['columns'].enableEditing();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.components['columns'] && that.components['columns'].disableEditing();
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.redraw = function(){
        that.components['columns'] && that.components['columns'].redraw();
        return that;
    };

    init();
});
cm.define('Com.HelpBubble', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : false,
        'container' : false,
        'content' : cm.node('span'),
        'Com.Tooltip' : {
            'className' : 'com__help-bubble__tooltip'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('span'),
        'button' : cm.node('span'),
        'content' : cm.node('span')
    };

    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Render structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('span', {'class' : 'com__help-bubble'},
                that.nodes['button'] = cm.node('span', {'class' : 'icon default linked'}),
                that.nodes['content'] = cm.node('span', {'class' : 'com__help-bubble__content'})
            );
            // Set Content
            that.set(that.params['content']);
            // Embed
            if(that.params['container']){
                that.params['container'].appendChild(that.nodes['container']);
            }
        }
        // Render tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor){
            that.components['tooltip'] = new classConstructor(that.params['Com.Tooltip']);
            that.components['tooltip']
                .setTarget(that.nodes['button'])
                .setContent(that.nodes['content']);
        });
    };

    /* ******* PUBLIC ******* */

    that.set = function(node){
        cm.clearNode(that.nodes['content']);
        if(cm.isString(node) || cm.isNumber(node)){
            that.nodes['content'].innerHTML = node;
        }else{
            cm.appendNodes(node, that.nodes['content']);
        }
        return that;
    };

    init();
});
cm.define('Com.ImageBox', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'animated' : false,
        'effect' : 'none',
        'zoom' : false,
        'scrollNode' : window,
        'Com.GalleryPopup' : {}
    }
},
function(params){
    var that = this,
        dimensions = {},
        pageDimensions = {};

    that.nodes = {
        'items' : []
    };
    that.components = {};
    that.processed = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.getDataNodes(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.GalleryPopup']['node'] = that.params['node'];
    };

    var render = function(){
        if(that.params['animated']){
            cm.addClass(that.params['node'], 'cm-animate');
            cm.addClass(that.params['node'], ['pre', that.params['effect']].join('-'));
            cm.addEvent(that.params['scrollNode'], 'scroll', process);
            process();
        }
        if(that.params['zoom']){
            cm.getConstructor('Com.GalleryPopup', function(classConstructor){
                that.components['popup'] = new classConstructor(that.params['Com.GalleryPopup']);
            });
        }
        // Add custom event
        cm.customEvent.add(that.params['node'], 'redraw', function(){
            that.redraw();
        });
    };

    var process = function(){
        if(!that.processed){
            getDimensions();
            getPageDimensions();
            // Rules for different block sizes.
            if(dimensions['height'] < pageDimensions['winHeight']){
                // Rules for block, which size is smaller than page's.
                if(
                    dimensions['top'] >= 0 &&
                    dimensions['bottom'] <= pageDimensions['winHeight']
                ){
                    set();
                }
            }else{
                // Rules for block, which size is larger than page's.
                if(
                    (dimensions['top'] < 0 && dimensions['bottom'] >= pageDimensions['winHeight'] / 2) ||
                    (dimensions['bottom'] > pageDimensions['winHeight'] && dimensions['top'] <= pageDimensions['winHeight'] / 2)
                ){
                    set();
                }
            }
        }
    };

    var set = function(){
        that.processed = true;
        cm.addClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };

    var restore = function(){
        that.processed = false;
        cm.removeClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };
    
    var getDimensions = function(){
        dimensions = cm.getRect(that.params['node']);
    };

    var getPageDimensions = function(){
        pageDimensions = cm.getPageSize();
    };

    /* ******* PUBLIC ******* */

    that.redraw = function(){
        if(that.params['animated']){
            restore();
            process();
        }
        return that;
    };

    init();
});
cm.define('Com.ImageInput', {
    'extend' : 'Com.FileInput',
    'params' : {
        'className' : 'com__image-input',
        'size' : 'default',
        'aspect' : false,
        'preview' : true,
        'previewConstructor' : 'Com.ImagePreviewContainer',
        'previewParams' : {},
        'langs' : {
            'preview' : 'Preview'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.FileInput.apply(that, arguments);
});

cm.getConstructor('Com.ImageInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Preview
        if(that.params['preview']){
            cm.getConstructor(that.params['previewConstructor'], function(classObject){
                that.components['preview'] = new classObject(
                    cm.merge(that.params['previewParams'], {
                        'node' : that.myNodes['preview']
                    })
                );
            });
        }
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__image-input__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.myNodes['content'] = cm.node('div', {'class' : 'input__holder'},
                    cm.node('div', {'class' : 'input__cover'},
                        that.myNodes['label'] = cm.node('div', {'class' : 'input__label'}),
                        that.myNodes['buttonsInner'] = cm.node('div', {'class' : 'input__buttons'},
                            that.myNodes['clear'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                                cm.node('button', {'type' : 'button', 'class' : 'button button-danger'},
                                    cm.node('span', that.lang('remove'))
                                )
                            )
                        )
                    ),
                    that.myNodes['imageContainer'] = cm.node('div', {'class' : 'pt__image is-cover'},
                        cm.node('div', {'class' : 'inner'},
                            that.myNodes['image'] = cm.node('div', {'class' : 'descr'})
                        )
                    )
                )
            )
        );
        // Image Preview size
        if(that.params['aspect']){
            cm.addClass(that.myNodes['imageContainer'], 'is-background has-aspect');
            cm.addClass(that.myNodes['imageContainer'], ['cm__aspect', that.params['aspect']].join('-'));
        }
        // Render Buttons
        that.renderButtons();
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['clear'], 'click', that.clearEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderButtons = function(){
        var that = this;
        if(that.params['preview']){
            that.myNodes['preview'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('preview'))
                )
            );
            cm.insertFirst(that.myNodes['preview'], that.myNodes['buttonsInner']);
        }
        if(that.params['local']){
            that.myNodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_local'))
                ),
                cm.node('div', {'class' : 'inner'},
                    that.myNodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
            cm.insertFirst(that.myNodes['browseLocal'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileManager']){
            that.myNodes['browseFileManager'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_filemanager'))
                )
            );
            cm.insertFirst(that.myNodes['browseFileManager'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileUploader']){
            that.myNodes['browseFileUploader'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('browse'))
                )
            );
            cm.insertFirst(that.myNodes['browseFileUploader'], that.myNodes['buttonsInner']);
        }
        return that;
    };

    classProto.setData = function(){
        var that = this,
            url;
        if(cm.isEmpty(that.value)){
            // Preview
            that.components['preview'] && that.components['preview'].clear();
            cm.addClass(that.myNodes['preview'], 'is-hidden');
            that.myNodes['image'].style.backgroundImage = '';
            cm.addClass(that.myNodes['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.myNodes['label']);
            cm.addClass(that.myNodes['label'], 'is-hidden');
            // Remove button
            cm.addClass(that.myNodes['clear'], 'is-hidden');
        }else{
            // Preview
            that.components['preview'] && that.components['preview'].set(that.value);
            cm.removeClass(that.myNodes['preview'], 'is-hidden');
            that.myNodes['image'].style.backgroundImage = cm.URLToCSSURL(that.value['url']);
            cm.removeClass(that.myNodes['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.myNodes['label']);
            if(that.params['showLink']){
                that.myNodes['link'] = cm.node('a', {'target' : '_blank', 'href' : that.value['url'], 'title' : that.lang('open')}, that.value['name']);
            }else{
                that.myNodes['link'] = cm.textNode(that.value['name']);
            }
            cm.appendChild(that.myNodes['link'], that.myNodes['label']);
            cm.removeClass(that.myNodes['label'], 'is-hidden');
            // Remove button
            cm.removeClass(that.myNodes['clear'], 'is-hidden');
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('image', {
    'node' : cm.node('input', {'type' : 'text'}),
    'constructor' : 'Com.ImageInput'
});

cm.define('Com.ImagePreviewContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.GalleryPopup',
        'params' : {
            'showCounter' : false,
            'showTitle' : true
        }
    }
},
function(params){
    var that = this;
    that.item = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});


cm.getConstructor('Com.ImagePreviewContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.renderControllerProcessHandler = that.renderControllerProcess.bind(that);
        // Add events
        that.addEvent('onRenderControllerProcess', that.renderControllerProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(item){
        var that = this;
        that.clear();
        that.setData(item);
        that.setController();
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].clear();
        return that;
    };

    classProto.renderControllerProcess = function(){
        var that = this;
        that.setController();
        return that;
    };

    classProto.setData = function(item){
        var that = this;
        that.item = {
            'src' : item['url'],
            'mime' : item['type'],
            'title' : item['name']
        };
        return that;
    };

    classProto.setController = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].add(that.item);
        return that;
    };
});
cm.define('Com.IndentInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'maxlength' : 3,
        'units' : 'px',
        'defaultValue' : 0,
        'allowNegative' : false
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.IndentInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set inputs
        that.setInput();
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        value = !cm.isEmpty(value) ? value : that.params['defaultValue'];
        that.rawValue = parseInt(value);
        return (that.rawValue + that.params['units']);
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'pt__input'},
            that.myNodes['input'] = cm.node('input', {'type' : 'text'})
        );
        // Attributes
        if(that.params['maxlength']){
            that.myNodes['input'].setAttribute('maxlength', that.params['maxlength']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['input'], 'blur', that.setValueHandler);
        cm.addEvent(that.myNodes['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValue();
                that.myNodes['input'].blur();
            }
        });

        if(that.params['allowNegative']){
            cm.allowOnlyNumbersInputEvent(that.myNodes['input'], function(e, value){
                that.selectAction(that.validateValue(value), true);
            });
        }else{
            cm.allowOnlyDigitInputEvent(that.myNodes['input'], function(e, value){
                that.selectAction(that.validateValue(value), true);
            });
        }
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setValue = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(that.rawValue, triggerEvents);
        return that;
    };

    classProto.setInput = function(){
        var that = this;
        that.myNodes['input'].value = that.rawValue;
        return that;
    };
});
cm.define('Com.Menu', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'event' : 'hover',
        'Com.Tooltip' : {
            'className' : 'com__menu-tooltip',
            'top' : 'targetHeight',
            'targetEvent' : 'hover',
            'hideOnReClick' : true,
            'theme' : false
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'button' : cm.Node('div'),
        'target' : cm.Node('div')
    };
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Tooltip']['targetEvent'] = that.params['event'];
    };

    var render = function(){
        // Tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor){
            that.components['tooltip'] = new classConstructor(
                cm.merge(that.params['Com.Tooltip'], {
                    'target' : that.nodes['button'],
                    'content' : that.nodes['target'],
                    'events' : {
                        'onShowStart' : function(){
                            cm.addClass(that.params['node'], 'active');
                            cm.addClass(that.nodes['button'], 'active');
                        },
                        'onHideStart' : function(){
                            cm.removeClass(that.params['node'], 'active');
                            cm.removeClass(that.nodes['button'], 'active');
                        }
                    }
                })
            );
        });
    };

    /* ******* PUBLIC ******* */

    init();
});
cm.define('Com.MultiField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onItemAdd',
        'onItemRemove',
        'onItemProcess',
        'onItemSort',
        'onItemIndexChange'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructure' : 'append',
        'embedStructureOnRender' : false,
        'sortable' : true,                      // Use drag and drop to sort items
        'showControls' : true,
        'renderItems' : 0,                      // Render count of fields by default
        'max' : 0,                              // 0 - infinity
        'template' : null,                      // Html node or string with items template
        'templateAttributeReplace' : false,
        'templateAttribute' : 'name',           // Replace specified items attribute by pattern, example: data-attribute-name="test[%index%]", available variables: %index%
        'duration' : 'cm._config.animDurationShort',
        'theme' : '',
        'langs' : {
            'add' : 'Add',
            'remove' : 'Remove'
        },
        'icons' : {
            'drag' : 'icon drag linked',
            'add' : 'icon add linked',
            'remove' : 'icon remove linked'
        },
        'Com.Sortable' : {
            'process' : false
        }
    }
}, function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultiField', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.nodes = {
            'container' : cm.node('div'),
            'content' : cm.node('div'),
            'toolbar' : {
                'container' : cm.node('div'),
                'add' : cm.node('div')
            },
            'items' : []
        };
        that.components = {};
        that.items = [];
        that.isToolbarVisible = true;
        // Bind context to methods
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    /* *** SYSTEM *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multifield'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__multifield__content'})
        );
        // Toolbar
        if(that.params['showControls']){
            that.nodes['toolbarContainer'] = that.renderToolbarView();
            cm.appendChild(that.nodes['toolbarContainer'], that.nodes['container']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multifield__toolbar'},
            nodes['content'] = cm.node('div', {'class' : 'com__multifield__item'},
                nodes['add'] = cm.node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
            )
        );
        // Add button events
        cm.addEvent(nodes['add'], 'click', function(e){
            cm.preventDefault(e);
            that.renderItem();
        });
        // Push
        that.nodes['toolbarView'] = nodes;
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Sortable
        if(that.params['sortable']){
            cm.getConstructor('Com.Sortable', function(classConstructor, className){
                that.components['sortable'] = new classConstructor(that.params[className]);
                that.components['sortable'].addEvent('onSort', function(my, data){
                    var item = that.items.find(function(item){
                        return item['container'] === data['node'];
                    });
                    if(item){
                        that.sortItem(item, data['index']);
                    }
                });
                that.components['sortable'].addGroup(that.nodes['content']);
            });
        }
        // Process collected view
        if(!that.params['renderStructure']){
            that.processCollectedView();
        }
        // Render items
        cm.forEach(Math.max(that.params['renderItems'] - that.items.length, 0), function(){
            that.renderItem();
        });
        return that;
    };

    classProto.processCollectedView = function(){
        var that = this;
        // Toolbar
        that.nodes['toolbarContainer'] = that.nodes['toolbar']['container'];
        cm.addEvent(that.nodes['toolbar']['add'], 'click', function(e){
            cm.preventDefault(e);
            that.renderItem();
        });
        // Process rendered items
        cm.forEach(that.nodes['items'], function(item){
            that.processItem(item);
        });
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Set theme
        cm.addClass(that.nodes['container'], that.params['theme']);
        return that;
    };

    /* *** ITEMS *** */

    classProto.renderItem = function(item, params){
        var that = this,
            nodes;
        if(that.params['max'] == 0 || that.items.length < that.params['max']){
            // Config
            item = cm.merge({
                'isVisible' : false
            }, item);
            params = cm.merge({
                'callback' : function(){},
                'triggerEvents' : true
            }, params);
            // Structure
            item['container'] = cm.node('div', {'class' : 'com__multifield__item', 'data-node' : 'items:[]:container'},
                item['content'] = item['field'] = cm.node('div', {'class' : 'field', 'data-node' : 'field'})
            );
            // Template
            if(!cm.isEmpty(that.params['template'])){
                if(cm.isString(that.params['template'])){
                    nodes = cm.strToHTML(that.params['template']);
                }else{
                    nodes = cm.clone(that.params['template'], true);
                }
                cm.appendNodes(nodes, item['field']);
            }
            // Controls
            if(that.params['showControls']){
                item['remove'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove'), 'data-node' : 'remove'});
                cm.appendChild(item['remove'], item['container']);
            }
            // Sortable
            if(that.params['sortable']){
                item['drag'] = cm.node('div', {'class' : that.params['icons']['drag'], 'data-node' : 'drag'});
                if(that.params['showControls']){
                    cm.insertFirst(item['drag'], item['container']);
                }else{
                    cm.appendChild(item['drag'], item['container']);
                }
            }
            // Embed
            cm.appendChild(item['container'], that.nodes['content']);
            // Process
            that.processItem(item);
            // Callback
            params['callback'](item);
            // Trigger event
            params['triggerEvents'] && that.triggerEvent('onItemAdd', item);
        }
    };

    classProto.processItem = function(item){
        var that = this;
        // Register sortable item
        if(that.params['sortable']){
            that.components['sortable'].addItem(item['container'], that.nodes['content']);
        }else{
            cm.remove(item['drag']);
        }
        // Controls
        if(that.params['showControls']){
            cm.addEvent(item['remove'], 'click', function(e){
                cm.preventDefault(e);
                that.deleteItem(item);
            });
        }else{
            cm.remove(item['remove']);
        }
        // Push
        that.items.push(item);
        that.resetIndexes();
        // Animate
        that.toggleItemVisibility(item);
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemProcess', item);
    };

    classProto.deleteItem = function(item, params){
        var that = this;
        params = cm.merge({
            'callback' : function(){},
            'triggerEvents' : true
        }, params);
        // Remove sortable item
        if(that.params['sortable']){
            that.components['sortable'].removeItem(item['container']);
        }
        // Remove from array
        that.items.splice(that.items.indexOf(item), 1);
        that.resetIndexes();
        // Animate
        that.toggleItemVisibility(item, function(){
            // Remove from DOM
            cm.remove(item['container']);
        });
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Callback
        params['callback'](item);
        // Trigger event
        params['triggerEvents'] && that.triggerEvent('onItemRemove', item);
    };

    classProto.sortItem = function(item, index){
        var that = this;
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        that.resetIndexes();
        // Trigger event
        that.triggerEvent('onItemSort', item);
    };

    classProto.resetIndexes = function(){
        var that = this;
        cm.forEach(that.items, function(item, index){
            if(item['index'] != index){
                // Set index
                item['previousIndex'] = item['index'];
                item['index'] = index;
                // Process data attributes
                if(that.params['templateAttributeReplace']){
                    cm.processDataAttributes(item['field'], that.params['templateAttribute'], {'%index%' : index});
                }
                // Trigger event
                that.triggerEvent('onItemIndexChange', item);
            }
        });
    };

    /* *** VISIBILITY *** */

    classProto.toggleToolbarVisibility = function(){
        var that = this;
        if(that.params['showControls']){
            if(that.params['max'] > 0 && that.items.length == that.params['max']){
                that.hideToolbar();
            }else{
                that.showToolbar();
            }
        }
        return that;
    };

    classProto.showToolbar = function(){
        var that = this,
            height = 0;
        if(!that.isToolbarVisible){
            that.isToolbarVisible = true;
            // Prepare
            that.nodes['toolbarContainer'].style.height = '';
            height = that.nodes['toolbarContainer'].offsetHeight;
            that.nodes['toolbarContainer'].style.height = '0px';
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : height + 'px', 'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'clear' : true,
                'onStop' : function(){
                    that.nodes['toolbarContainer'].style.overflow = '';
                    that.nodes['toolbarContainer'].style.height = '';
                }
            });
        }
        return that;
    };

    classProto.hideToolbar = function(){
        var that = this;
        if(that.isToolbarVisible){
            that.isToolbarVisible = false;
            // Prepare
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : '0px', 'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out'
            });
        }
        return that;
    };

    classProto.toggleItemVisibility = function(item, callback){
        var that = this;
        callback = typeof callback == 'function' ? callback : function(){};
        if(!item['height']){
            item['height'] = item['container'].offsetHeight;
        }
        if(typeof item['isVisible'] == 'undefined'){
            item['isVisible'] = true;
        }else if(item['isVisible']){
            item['isVisible'] = false;
            item['container'].style.overflow = 'hidden';
            cm.transition(item['container'], {
                'properties' : {'height' : '0px', 'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : callback
            });
        }else{
            item['isVisible'] = true;
            item['container'].style.overflow = 'hidden';
            item['container'].style.height = '0px';
            item['container'].style.opacity = 0;
            cm.transition(item['container'], {
                'properties' : {'height' : [item['height'], 'px'].join(''), 'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'clear' : true,
                'onStop' : function(){
                    item['container'].style.overflow = '';
                    callback();
                }
            });
        }
    };

    /* ******* PUBLIC ******* */

    classProto.addItem = function(item, params){
        var that = this;
        that.renderItem(item, params);
        return that;
    };

    classProto.removeItem = function(item, params){
        var that = this;
        if(typeof item == 'number' && that.items[item]){
            that.deleteItem(that.items[item], params);
        }else if(cm.inArray(that.items, item)){
            that.deleteItem(item, params);
        }
        return that;
    };

    classProto.getItem = function(index){
        var that = this;
        if(that.items[index]){
            return that.items[index];
        }
        return null;
    };

    classProto.getItems = function(){
        var that = this;
        return that.items;
    };
});
cm.define('Com.MultipleAutocomplete', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-autocomplete',
        'sortable' : false,
        'showToolbar' : false,
        'showControls' : true,
        'focusInput' : true,
        'inputConstructor' : 'Com.Autocomplete'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.MultipleInput.apply(that, arguments);
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('multi-autocomplete', {
    'node' : cm.node('div'),
    'constructor' : 'Com.MultipleAutocomplete'
});
cm.define('Com.MultipleFileInput', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-file-input',
        'local' : true,
        'sortable' : false,
        'showToolbar' : true,
        'showControls' : false,
        'focusInput' : false,
        'buttonsAlign' : 'left',
        'inputConstructor' : 'Com.FileInput',
        'inputParams' : {
            'embedStructure' : 'replace',
            'dropzone' : false
        },
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'params' : {}
        },
        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'params' : {}
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : true
        },
        'langs' : {
            'browse' : 'Browse',
            'browse_local' : 'Browse Local',
            'browse_filemanager' : 'Browse File Manager'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.myComponents = {};
    that.dragInterval = null;
    that.isDropzoneShow = false;
    that.hasButtons = false;
    // Call parent class construct
    Com.MultipleInput.apply(that, arguments);
});

cm.getConstructor('Com.MultipleFileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.itemAddProcessHandler = that.itemAddProcess.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onItemAddProcess', that.itemAddProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.params['showToolbar'] && cm.removeClass(that.nodes['toolbar']['browseHolder'], 'is-hidden');
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Components parameters
        that.params['dropzoneParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['params']['max'] = that.params['max'];
        that.params['fileUploaderParams']['params']['max'] = that.params['max'];
        // File Uploader
        that.params['fileUploaderParams']['params']['local'] = that.params['local'];
        that.params['fileUploaderParams']['params']['fileManager'] = that.params['fileManager'];
        // Other
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        that.params['local'] = that.params['fileUploader'] ? false : that.params['local'];
        that.params['fileManager'] = that.params['fileUploader'] ? false : that.params['fileManager'];
        that.hasButtons = that.params['local'] || that.params['fileManager'] || that.params['fileUploader'];
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.myComponents['reader'] = new classObject(that.params[className]);
            that.myComponents['reader'].addEvent('onReadSuccess', function(my, item){
                that.addItem({'value' : item}, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.myComponents['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.nodes['inner'],
                        'target' : that.nodes['holder']
                    })
                );
                that.myComponents['dropzone'].addEvent('onDrop', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Manager
        if(that.params['showToolbar'] && that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.myComponents['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.nodes['toolbar']['browseFileManager']
                    })
                );
                that.myComponents['fileManager'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Uploader
        if(that.params['showToolbar'] && that.params['fileUploader']){
            cm.getConstructor(that.params['fileUploaderConstructor'], function(classObject){
                that.myComponents['fileUploader'] = new classObject(
                    cm.merge(that.params['fileUploaderParams'], {
                        'node' : that.nodes['toolbar']['browseFileUploader']
                    })
                );
                that.myComponents['fileUploader'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        return that;
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multiple-input__toolbar'},
            nodes['content'] = cm.node('div', {'class' : 'pt__buttons'},
                nodes['contentInner'] = cm.node('div', {'class' : 'inner'})
            )
        );
        cm.addClass(nodes['content'], ['pull', that.params['buttonsAlign']].join('-'));
        // Render Browse Buttons
        if(that.params['local']){
            nodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    nodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            that.isMultiple && nodes['input'].setAttribute('multiple', 'multiple');
            cm.insertFirst(nodes['browseLocal'], nodes['contentInner']);
        }
        if(that.params['fileManager']){
            nodes['browseFileManager'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_filemanager'));
            cm.insertFirst(nodes['browseFileManager'], nodes['contentInner']);
        }
        if(that.params['fileUploader']){
            nodes['browseFileUploader'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('browse'));
            cm.insertFirst(nodes['browseFileUploader'], nodes['contentInner']);
        }
        if(!that.hasButtons){
            cm.addClass(nodes['container'], 'is-hidden');
        }
        // Events
        cm.addEvent(nodes['input'], 'change', that.browseActionHandler);
        // Push
        that.nodes['toolbar'] = nodes;
        return nodes['container'];
    };

    classProto.itemAddProcess = function(my, item){
        var that = this;
        item['controller'].addEvent('onClear', function(){
            that.removeItem(item);
        });
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            length = that.params['max'] ? Math.min(e.target.files.length, (that.params['max'] - that.items.length)) : e.target.files.length;
        cm.forEach(length, function(i){
            that.processFiles(e.target.files[i]);
        });
        return that;
    };

    classProto.processFiles = function(data){
        var that = this;
        if(cm.isFile(data)){
            that.myComponents['reader'].read(data);
        }else if(cm.isArray(data)){
            cm.forEach(data, function(file){
                that.processFiles(file);
            })
        }else if(!cm.isEmpty(data)){
            that.addItem({'value' : data}, true);
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('multi-file-input', {
    'node' : cm.node('div'),
    'constructor' : 'Com.MultipleFileInput'
});
cm.define('Com.Notifications', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'langs' : {
            'close' : 'Close'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.items = [];
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    /* ******* PUBLIC ******* */

    init();
});

cm.getConstructor('Com.Notifications', function(classConstructor, className, classProto){
    classProto.validateParams = function(){
        var that = this;
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.nodes['container'] = cm.node('div', {'class' : 'com__notifications'},
            that.nodes['list'] = cm.node('ul')
        );
        return that;
    };

    classProto.clear = function(){
        var that = this;
        while(that.items.length){
            that.remove(that.items[0]);
        }
        return that;
    };

    classProto.add = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'label' : '',
            'type' : 'warning',           // success | warning | danger
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('li', {'class' : item['type']},
            item['nodes']['close'] = cm.node('div', {'class' : 'close'}, that.lang('close')),
            item['nodes']['descr'] = cm.node('div', {'class' : 'descr'})
        );
        // Label
        if(cm.isNode(item['label'])){
            cm.appendChild(item['label'], item['nodes']['descr']);
        }else{
            item['nodes']['descr'].innerHTML = item['label'];
        }
        // Events
        cm.addEvent(item['nodes']['close'], 'click', function(){
            that.remove(item);
        });
        // Embed
        cm.appendChild(item['nodes']['container'], that.nodes['list']);
        // Push
        that.items.push(item);
        that.triggerEvent('onAdd', item);
        return that;
    };

    classProto.remove = function(item){
        var that = this;
        cm.remove(item['nodes']['container']);
        cm.arrayRemove(that.items, item);
        that.triggerEvent('onRemove', item);
        return that;
    };

    classProto.getLength = function(){
        var that = this;
        return that.items.length;
    };
});
cm.define('Com.OldBrowserAlert', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Storage',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'name' : 'default',
        'remember' : true,
        'versions' : {
            'IE' : 10,
            'FF' : 31,
            'Chrome' : 40,
            'Safari' : 6,
            'Opera' : 26
        },
        'langs' : {
            'title' : 'Thank you for visiting our site!',
            'descr' : 'It seems that you are using an outdated browser <b>(%browser% %version%)</b>. As a result, we cannot provide you with the best user experience while visiting our site. Please upgrade your <b>%browser%</b> to version <b>%minimum_version%</b> or above, or use another standards based browser such as Firefox, Chrome or Safari, by clicking on the icons below.',
            'continue' : 'Skip for now'
        }
    }
},
function(params){
    var that = this,
        userAgent = Com.UA.get();

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.addToStack();
        check();
        that.triggerEvent('onRender');
    };

    var check = function(){
        cm.forEach(that.params['versions'], function(version, browser){
            if(Com.UA.is(browser) && Com.UA.isVersion() < version){
                // Parse description string, insert browser name and version
                that.params['langs']['descr'] = that.lang('descr', {
                    '%browser%' : userAgent['full_name'],
                    '%version%' : userAgent['full_version'],
                    '%minimum_version%' : version
                });
                // Render window
                if(!that.params['remember'] || (that.params['remember'] && !that.storageRead('isShow'))){
                    render();
                }
            }
        });
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__oldbrowser-alert'},
            cm.Node('div', {'class' : 'b-descr'},
                cm.Node('p', {'innerHTML' : that.lang('descr')})
            ),
            cm.Node('ul', {'class' : 'b-browsers'},
                cm.Node('li', cm.Node('a', {'class' : 'icon linked chrome', 'title' : 'Google Chrome', 'href' : 'http://www.google.com/chrome/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked firefox', 'title' : 'Mozilla Firefox', 'href' : 'http://www.mozilla.com/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked safari', 'title' : 'Apple Safari', 'href' : 'http://www.apple.com/safari/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked msie', 'title' : 'Microsoft Internet Explorer', 'href' : 'http://ie.microsoft.com/', 'target' : '_blank'}))
            ),
            cm.Node('div', {'class' : 'form'},
                cm.Node('div', {'class' : 'btn-wrap pull-center'},
                    that.nodes['button'] = cm.Node('input', {'type' : 'button', 'value' : that.lang('continue')})
                )
            )
        );
        // Init dialog
        cm.getConstructor('Com.Dialog', function(classConstructor){
            that.components['dialog'] = new classConstructor({
                'title' : that.lang('title'),
                'content' : that.nodes['container'],
                'autoOpen' : false,
                'width' : 500,
                'events' : {
                    'onClose' : function(){
                        if(that.params['remember']){
                            that.storageWrite('isShow', true);
                        }
                    }
                }
            });
            // Add event on continue button
            cm.addEvent(that.nodes['button'], 'click', that.components['dialog'].close);
            // Open dialog
            that.components['dialog'].open();
        });
    };

    /* ******* MAIN ******* */

    init();
});
cm.define('Com.OpacityRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__opacity-range',
        'min' : 100,
        'max' : 0,
        'value' : 100,
        'color' : 'red'
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    Com.AbstractRange.apply(that, arguments);
});

cm.getConstructor('Com.OpacityRange', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        _inherit.prototype.construct.apply(that, arguments);
        that.setColor(that.params['color']);
        return this;
    };

    classProto.renderContent = function(){
        var that = this;
        that.myNodes['content'] = cm.node('div', {'class' : 'com__opacity-range__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner range-helper'})
        );
        return that.myNodes['content'];
    };

    classProto.setColor = function(color){
        var that = this;
        switch(that.params['direction']){
            case 'horizontal':
                that.myNodes['inner'].style.background = 'linear-gradient(to right, ' + color + ', rgba(255,255,255,0))';
                break;
            case 'vertical':
                that.myNodes['inner'].style.background = 'linear-gradient(to bottom, ' + color + ', rgba(255,255,255,0))';
                break;
        }
        return that;
    };
});
cm.define('Com.Overlay', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onOpenEnd',
        'onCloseStart',
        'onClose',
        'onCloseEnd'
    ],
    'params' : {
        'name' : '',
        'container' : 'document.body',
        'appendMode' : 'appendChild',
        'theme' : 'default',            // transparent | default | light | dark
        'position' : 'fixed',
        'showSpinner' : true,
        'showContent' : true,
        'autoOpen' : true,
        'removeOnClose' : true,
        'destructOnRemove' : false,
        'duration' : 'cm._config.animDurationLong'
    }
},
function(params){
    var that = this,
        themes = ['transparent', 'default', 'light', 'dark'];

    that.nodes = {};
    that.isDestructed = false;
    that.isOpen = false;
    that.isShowSpinner = false;
    that.isShowContent = false;
    that.openInterval = null;

    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };

    var getLESSVariables = function(){
        that.params['duration'] = cm.getLESSVariable('PtOverlay-Duration', that.params['duration']);
    };

    var validateParams = function(){
        that.params['position'] = cm.inArray(['static', 'relative', 'absolute', 'fixed'], that.params['position']) ? that.params['position'] : 'fixed';
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__overlay pt__overlay'},
            that.nodes['spinner'] = cm.Node('div', {'class' : 'overlay__spinner'}),
            that.nodes['content'] = cm.Node('div', {'class' : 'overlay__content'})
        );
        // Set position
        that.nodes['container'].style.position = that.params['position'];
        // Show spinner
        that.params['showSpinner'] && that.showSpinner();
        // Show content
        that.params['showContent'] && that.showContent();
        // Set theme
        that.setTheme(that.params['theme']);
    };

    var openHelper = function(){
        that.triggerEvent('onOpen')
            .triggerEvent('onOpenEnd');
    };

    var closeHelper = function(){
        that.triggerEvent('onClose')
            .triggerEvent('onCloseEnd');
        if(that.params['removeOnClose']){
            cm.remove(that.nodes['container']);
        }
    };

    /* ******* MAIN ******* */

    that.open = function(isImmediately){
        if(!that.isOpen){
            that.isOpen = true;
            // Set immediately animation hack
            if(isImmediately){
                cm.addClass(that.nodes['container'], 'is-immediately');
            }
            if(!cm.inDOM(that.nodes['container'])){
                cm[that.params['appendMode']](that.nodes['container'], that.params['container']);
            }
            that.triggerEvent('onOpenStart');
            cm.addClass(that.nodes['container'], 'is-open', true);
            // Remove immediately animation hack
            that.openInterval && clearTimeout(that.openInterval);
            if(isImmediately){
                that.openInterval = setTimeout(function(){
                    cm.removeClass(that.nodes['container'], 'is-immediately');
                    openHelper();
                }, 5);
            }else{
                that.openInterval = setTimeout(function(){
                    openHelper();
                }, that.params['duration'] + 5);
            }
        }
        return that;
    };

    that.close = function(isImmediately){
        if(that.isOpen){
            that.isOpen = false;
            // Set immediately animation hack
            if(isImmediately){
                cm.addClass(that.nodes['container'], 'is-immediately');
            }
            that.triggerEvent('onCloseStart');
            cm.removeClass(that.nodes['container'], 'is-open');
            // Remove immediately animation hack
            that.openInterval && clearTimeout(that.openInterval);
            if(isImmediately){
                that.openInterval = setTimeout(function(){
                    cm.removeClass(that.nodes['container'], 'is-immediately');
                    closeHelper();
                }, 5);
            }else{
                that.openInterval = setTimeout(function(){
                    closeHelper();
                }, that.params['duration'] + 5);
            }
        }
        // Close Event
        return that;
    };
    
    that.toggle = function(){
        if(that.isOpen){
            that.hide();
        }else{
            that.show();
        }
    };

    that.remove = function(){
        if(that.isOpen){
            that.close();
            if(!that.params['removeOnClose']){
                setTimeout(function(){
                    cm.remove(that.nodes['container']);
                }, that.params['duration'] + 5);
            }
        }else{
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.setTheme = function(theme){
        if(cm.inArray(themes, theme)){
            cm.addClass(that.nodes['container'], ['theme', theme].join('-'));
            cm.forEach(themes, function(item){
                if(item != theme){
                    cm.removeClass(that.nodes['container'], ['theme', item].join('-'));
                }
            });
        }
        return that;
    };

    that.showSpinner = function(){
        that.isShowSpinner = true;
        cm.addClass(that.nodes['spinner'], 'is-show');
        return that;
    };

    that.hideSpinner = function(){
        that.isShowSpinner = false;
        cm.removeClass(that.nodes['spinner'], 'is-show');
        return that;
    };

    that.setContent = function(node){
        if(cm.isNode(node)){
            that.nodes['content'].appendChild(node);
        }
        return that;
    };

    that.showContent = function(){
        that.isShowContent = true;
        cm.addClass(that.nodes['content'], 'is-show');
        return that;
    };

    that.hideContent = function(){
        that.isShowContent = false;
        cm.removeClass(that.nodes['content'], 'is-show');
        return that;
    };

    that.embed = function(node){
        if(cm.isNode(node)){
            that.params['container'] = node;
            node.appendChild(that.nodes['container']);
        }
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});
cm.define('Com.Pagination', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onAbort',
        'onError',
        'onPageRender',
        'onPageRenderEnd',
        'onPageSwitched',
        'onEnd',
        'onSetCount'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructure' : 'append',
        'scrollNode' : window,
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'barPosition' : 'bottom',                                   // top | bottom | both, require renderStructure
        'barAlign' : 'left',                                        // left | center | right, require renderStructure
        'barCountLR' : 3,
        'barCountM' : 1,                                            // 1 for drawing 3 center pagination buttons, 2 - 5, 3 - 7, etc
        'switchManually' : false,                                   // Switch pages manually
        'animateSwitch' : false,
        'animateDuration' : 'cm._config.animDuration',
        'animatePrevious' : false,                                  // Animating of hiding previous page, require animateSwitch
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'cache' : true,                                             // Cache response data
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'prev' : 'Previous',
            'next' : 'Next',
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'content' : cm.Node('div'),
        'pages' : cm.Node('div'),
        'bar' : []
    };

    that.components = {};
    that.animations = {};
    that.pages = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isAjax = false;
    that.isProcess = false;
    that.isRendering = false;

    that.page = null;
    that.pageToken = null;
    that.currentPage = null;
    that.previousPage = null;
    that.pageCount = 0;

    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        set(that.params['startPage']);
    };

    var getLESSVariables = function(){
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComPagination-Duration', that.params['animateDuration']);
    };

    var validateParams = function(){
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            if(!cm.isEmpty(that.params['data'])){
                that.params['count'] = that.params['data'].length;
            }
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] == 0 && that.params['count'] && that.params['perPage']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Loader
        that.params['Com.Overlay']['container'] = that.nodes['content'];
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('div', {'class' : 'com__pagination'},
                that.nodes['content'] = cm.Node('div', {'class' : 'com__pagination__content'},
                    that.nodes['pages'] = cm.Node('div', {'class' : 'com__pagination__pages'})
                )
            );
            // Bars
            if(/top|both/.test(that.params['barPosition'])){
                that.nodes['bar'].push(
                    that.callbacks.renderBar(that, {
                        'align' : that.params['barAlign'],
                        'position' : 'top'
                    })
                );
            }
            if(/bottom|both/.test(that.params['barPosition'])){
                that.nodes['bar'].push(
                    that.callbacks.renderBar(that, {
                        'align' : that.params['barAlign'],
                        'position' : 'bottom'
                    })
                );
            }
            // Append
            that.embedStructure(that.nodes['container']);
        }
        // Reset styles and variables
        reset();
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor){
            that.components['loader'] = new classConstructor(that.params['Com.Overlay']);
        });
        // Animated
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['container'], 'is-animated');
        }
        that.animations['content'] = new cm.Animation(that.nodes['content']);
    };

    var reset = function(){
        // Clear render pages
        cm.clearNode(that.nodes['pages']);
    };

    var set = function(page){
        var config;
        if(that.isProcess){
            that.abort();
        }
        if((!that.pageCount || page <= that.pageCount) && !that.isProcess && !that.isRendering){
            // Preset next page and page token
            that.page = page;
            that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : '';
            // Render bars
            that.callbacks.rebuildBars(that);
            // Request
            if(!that.currentPage || page != that.currentPage){
                if(that.params['cache'] && that.pages[that.page] && that.pages[that.page]['isRendered']){
                    that.callbacks.cached(that, that.pages[that.page]['data']);
                }else if(that.isAjax){
                    config = cm.clone(that.params['ajax']);
                    that.ajaxHandler = that.callbacks.request(that, config);
                }else{
                    that.callbacks.data(that, that.params['data']);
                }
            }
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response),
            countItem = cm.objectSelector(that.params['responseCountKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        if(countItem){
            that.setCount(countItem);
        }
        return data;
    };

    that.callbacks.response = function(that, config, response){
        that.setPage();
        // Response
        if(response){
            response = that.callbacks.filter(that, config, response);
        }
        that.callbacks.render(that, response);
    };

    that.callbacks.error = function(that, config){
        that.triggerEvent('onError');
        that.callbacks.response(that, config);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** STATIC *** */

    that.callbacks.data = function(that, data){
        var length, start, end, pageData;
        that.callbacks.start(that);
        that.setPage();
        if(!cm.isEmpty(data)){
            // Get page data and render
            if(that.params['perPage'] == 0){
                that.callbacks.render(that, data);
            }else if(that.params['perPage'] > 0){
                length = data.length;
                start = (that.page - 1) * that.params['perPage'];
                end = (that.page * that.params['perPage']);
                if(start < length){
                    pageData = data.slice(start , Math.min(end, length));
                    that.callbacks.render(that, pageData);
                }
            }
        }else{
            that.callbacks.render(that, data);
        }
        that.callbacks.end(that);
    };

    that.callbacks.cached = function(that, data){
        that.callbacks.start(that);
        that.setPage();
        that.callbacks.render(that, data);
        that.callbacks.end(that);
    };

    /* *** RENDER PAGE *** */

    that.callbacks.renderContainer = function(that, page){
        return cm.node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        that.isRendering = true;
        var page = {
            'page' : that.page,
            'token' : that.pageToken,
            'pages' : that.nodes['pages'],
            'container' : cm.node(that.params['pageTag']),
            'data' : data,
            'isVisible' : true,
            'isRendered' : true,
            'isError' : !data
        };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        // Render
        that.triggerEvent('onPageRender', page);
        if(page['data']){
            that.callbacks.renderPage(that, page);
        }else{
            that.callbacks.renderError(that, page);
        }
        // Embed
        that.nodes['pages'].appendChild(page['container']);
        cm.addClass(page['container'], 'is-visible', true);
        that.triggerEvent('onPageRenderEnd', page);
        // Switch
        if(!that.params['switchManually']){
            that.callbacks.switchPage(that, page);
        }
    };

    that.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    page['container'].appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            page['container'].appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
        }
    };

    that.callbacks.renderError = function(that, page){
        if(that.params['responseHTML']){
            page['container'].appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
        }
    };

    that.callbacks.switchPage = function(that, page){
        var contentRect = cm.getRect(that.nodes['content']),
            pageRect = cm.getRect(page['container']);
        // Hide previous page
        if(that.previousPage){
            that.callbacks.hidePage(that, that.pages[that.previousPage]);
        }
        // Show new page
        if(that.params['animateSwitch']){
            that.nodes['content'].style.overflow = 'hidden';
            that.nodes['content'].style.height = [contentRect['height'], 'px'].join('');
            that.animations['content'].go({'style' : {'height' : [pageRect['height'], 'px'].join('')}, 'duration' : that.params['animateDuration'], 'anim' : 'smooth', 'onStop' : function(){
                that.nodes['content'].style.overflow = 'visible';
                that.nodes['content'].style.height = 'auto';
                that.isRendering = false;
                that.triggerEvent('onPageSwitched', page);
            }});
        }else{
            that.isRendering = false;
            that.triggerEvent('onPageSwitched', page);
        }
    };

    that.callbacks.hidePage = function(that, page){
        page['isVisible'] = false;
        if(that.params['animateSwitch']){
            if(that.params['animatePrevious']){
                cm.removeClass(page['container'], 'is-visible');
                setTimeout(function(){
                    cm.remove(page['container']);
                }, that.params['animateDuration']);
            }else{
                setTimeout(function(){
                    cm.remove(page['container']);
                    cm.removeClass(page['container'], 'is-visible');
                }, that.params['animateDuration']);
            }
        }else{
            cm.remove(page['container']);
            cm.removeClass(page['container'], 'is-visible');
        }
    };

    /* *** RENDER BAR *** */

    that.callbacks.renderBar = function(that, params){
        params = cm.merge({
            'align' : 'left',
            'position' : 'bottom'
        }, params);
        var item = {};
        // Structure
        item['container'] = cm.Node('div', {'class' : 'com__pagination__bar'},
            item['items'] = cm.Node('ul')
        );
        cm.addClass(item['container'], ['pull', params['align']].join('-'));
        // Embed
        switch(params['position']){
            case 'top':
                cm.insertFirst(item['container'], that.nodes['container']);
                break;
            case 'bottom':
                cm.insertLast(item['container'], that.nodes['container']);
                break;
        }
        return item;
    };

    that.callbacks.rebuildBars = function(that){
        cm.forEach(that.nodes['bar'], function(item){
            that.callbacks.rebuildBar(that, item);
        });
    };

    that.callbacks.rebuildBar = function(that, item){
        // Clear items
        cm.clearNode(item['items']);
        // Show / Hide
        if(that.pageCount < 2){
            cm.addClass(item['container'], 'is-hidden');
        }else{
            cm.removeClass(item['container'], 'is-hidden');
            // Render items
            that.callbacks.renderBarItems(that, item);
        }
    };

    that.callbacks.renderBarItems = function(that, item){
        var dots = false;
        // Previous page buttons
        that.callbacks.renderBarArrow(that, item, {
            'text' : '<',
            'title' : that.lang('prev'),
            'className' : 'prev',
            'callback' : that.prev
        });
        // Page buttons
        cm.forEach(that.pageCount, function(page){
            ++page;
            if(page == that.page){
                that.callbacks.renderBarItem(that, item, {
                    'page' : page,
                    'isActive' : true
                });
                dots = true;
            }else{
                if(
                    page <= that.params['barCountLR'] ||
                    (that.currentPage && page >= that.page - that.params['barCountM'] && page <= that.page + that.params['barCountM']) ||
                    page > that.pageCount - that.params['barCountLR']
                ){
                    dots = true;
                    that.callbacks.renderBarItem(that, item, {
                        'page' : page,
                        'isActive' : false
                    });
                }else if(dots){
                    dots = false;
                    that.callbacks.renderBarPoints(that, item, {});
                }

            }
        });
        // Next page buttons
        that.callbacks.renderBarArrow(that, item, {
            'text' : '>',
            'title' : that.lang('next'),
            'className' : 'next',
            'callback' : that.next
        });
    };

    that.callbacks.renderBarArrow = function(that, item, params){
        params = cm.merge({
            'text' : '',
            'title' : '',
            'className' : '',
            'callback' : function(){}
        }, params);
        // Structure
        params['container'] = cm.Node('li', {'class' : params['className']},
            params['link'] = cm.Node('a', {'title' : params['title']}, params['text'])
        );
        // Events
        cm.addEvent(params['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            params['callback']();
        });
        // Append
        item['items'].appendChild(params['container']);
    };

    that.callbacks.renderBarPoints = function(that, item, params){
        params = cm.merge({
            'text' : '...',
            'className' : 'points'
        }, params);
        // Structure
        params['container'] = cm.Node('li', {'class' : params['className']}, params['text']);
        // Append
        item['items'].appendChild(params['container']);
    };

    that.callbacks.renderBarItem = function(that, item, params){
        params = cm.merge({
            'page' : null,
            'isActive' : false
        }, params);
        // Structure
        params['container'] = cm.Node('li',
            params['link'] = cm.Node('a', params['page'])
        );
        // Active Class
        if(params['isActive']){
            cm.addClass(params['container'], 'active');
        }
        // Events
        cm.addEvent(params['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            that.set(params['page']);
        });
        // Append
        item['items'].appendChild(params['container']);
    };

    /* *** HELPERS *** */

    that.callbacks.start = function(that){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onStart');
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onEnd');
    };

    /* ******* PUBLIC ******* */

    that.set = function(page){
        set(page);
        return that;
    };

    that.next = function(){
        set(that.pageCount == that.currentPage ? 1 : that.currentPage + 1);
        return that;
    };

    that.prev = function(){
        set(that.currentPage - 1 || that.pageCount);
        return that;
    };

    that.rebuild = function(params){
        // Cleanup
        if(that.isProcess){
            that.abort();
        }
        that.pages = {};
        that.currentPage = null;
        that.previousPage = null;
        // Reset styles and variables
        reset();
        // Set new parameters
        that.setParams(params);
        validateParams();
        // Render
        set(that.params['startPage']);
    };

    that.setToken = function(page, token){
        if(!that.pages[page]){
            that.pages[page] = {};
        }
        that.pages[page]['token'] = token;
        return that;
    };

    that.setCount = function(count){
        if(count && (count = parseInt(count.toString())) && count != that.params['count']){
            that.params['count'] = count;
            if(that.params['pageCount'] == 0 && that.params['count'] && that.params['perPage']){
                that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
            }else{
                that.pageCount = that.params['pageCount'];
            }
            that.callbacks.rebuildBars(that);
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.page;
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.isOwnNode = that.isParent = function(node, flag){
        return cm.isParent(that.nodes['container'], node, flag);
    };

    init();
});
cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'require' : [
        'Com.Draggable',
        'tinycolor'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onDraw',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'value' : 'transparent',
        'defaultValue' : 'rgb(255, 255, 255)',
        'setOnInit' : true,
        'langs' : {
            'new' : 'new',
            'previous' : 'previous',
            'select' : 'Select',
            'hue' : 'Hue',
            'opacity' : 'Opacity',
            'hex' : 'HEX'
        }
    }
},
function(params){
    var that = this,
        rangeContext,
        paletteContext,
        opacityContext;

    that.nodes = {};
    that.components = {};
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        initComponents();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['setOnInit'] && that.set(that.params['value'], false);
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__palette'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'b-palette'},
                    that.nodes['paletteZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['paletteDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['paletteCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-range', 'title' : that.lang('hue')},
                    that.nodes['rangeZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['rangeDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['rangeCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-range b-opacity', 'title' : that.lang('opacity')},
                    that.nodes['opacityZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['opacityDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['opacityCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-stuff'},
                    cm.node('div', {'class' : 'inner'},
                        cm.node('div', {'class' : 'b-preview-color'},
                            cm.node('div', {'class' : 'b-title'}, that.lang('new')),
                            cm.node('div', {'class' : 'b-colors'},
                                that.nodes['previewNew'] = cm.node('div', {'class' : 'b-color'}),
                                that.nodes['previewPrev'] = cm.node('div', {'class' : 'b-color'})
                            ),
                            cm.node('div', {'class' : 'b-title'}, that.lang('previous'))
                        ),
                        cm.node('div', {'class' : 'b-bottom'},
                            cm.node('div', {'class' : 'b-preview-inputs'},
                                that.nodes['inputHEX'] = cm.node('input', {'type' : 'text', 'title' : that.lang('hex')})
                            ),
                            cm.node('div', {'class' : 'b-buttons'},
                                that.nodes['buttonSelect'] = cm.node('div', {'class' : 'button button-primary is-wide'}, that.lang('select'))
                            )
                        )
                    )
                )
            )
        );
        // Render canvas
        paletteContext = that.nodes['paletteCanvas'].getContext('2d');
        rangeContext = that.nodes['rangeCanvas'].getContext('2d');
        opacityContext = that.nodes['opacityCanvas'].getContext('2d');
        renderRangeCanvas();
        //renderOpacityCanvas();
        // Add events
        cm.addEvent(that.nodes['inputHEX'], 'input', inputHEXHandler);
        cm.addEvent(that.nodes['inputHEX'], 'keypress', inputHEXKeypressHandler);
        cm.addEvent(that.nodes['buttonSelect'], 'click', buttonSelectHandler);
        // Append
        that.embedStructure(that.nodes['container']);
    };

    var initComponents = function(){
        that.components['paletteDrag'] = new Com.Draggable({
            'target' : that.nodes['paletteZone'],
            'node' : that.nodes['paletteDrag'],
            'limiter' : that.nodes['paletteZone'],
            'events' : {
                'onSelect' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['v'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['top']) / 100, 2);
                    that.value['s'] = cm.toFixed(((100 / dimensions['limiter']['absoluteWidth']) * data['left']) / 100, 2);
                    if(that.value['a'] == 0){
                        that.value['a'] = 1;
                        setOpacityDrag();
                    }
                    renderOpacityCanvas();
                    setColor();
                }
            }
        });
        that.components['rangeDrag'] = new Com.Draggable({
            'target' : that.nodes['rangeZone'],
            'node' : that.nodes['rangeDrag'],
            'limiter' : that.nodes['rangeZone'],
            'direction' : 'vertical',
            'events' : {
                'onSelect' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['h'] = Math.floor(360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['top']));
                    if(that.value['a'] == 0){
                        that.value['a'] = 1;
                        setOpacityDrag();
                    }
                    renderPaletteCanvas();
                    renderOpacityCanvas();
                    setColor();
                }
            }
        });
        that.components['opacityDrag'] = new Com.Draggable({
            'target' : that.nodes['opacityZone'],
            'node' : that.nodes['opacityDrag'],
            'limiter' : that.nodes['opacityZone'],
            'direction' : 'vertical',
            'events' : {
                'onSelect' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['a'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['top']) / 100, 2);
                    setColor();
                }
            }
        });
    };

    /* *** COLORS *** */

    var setRangeDrag = function(){
        var dimensions = that.components['rangeDrag'].getDimensions(),
            position = {
                'left' : 0,
                'top' : 0
            };
        if(that.value['h'] == 0){
            position['top'] = 0;
        }else if(that.value['h'] == 360){
            position['top'] = dimensions['limiter']['absoluteHeight'];
        }else{
            position['top'] = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * that.value['h']);
        }
        that.components['rangeDrag'].setPosition(position, false);
    };

    var setPaletteDrag = function(){
        var dimensions = that.components['paletteDrag'].getDimensions(),
            position = {
                'left' : (dimensions['limiter']['absoluteWidth'] / 100) * (that.value['s'] * 100),
                'top' : dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['v'] * 100)
            };
        that.components['paletteDrag'].setPosition(position, false);
    };

    var setOpacityDrag = function(){
        var dimensions = that.components['opacityDrag'].getDimensions(),
            position = {
                'left' : 0,
                'top' : dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['a'] * 100)
            };
        that.components['opacityDrag'].setPosition(position, false);
    };

    var inputHEXHandler = function(){
        var value = that.nodes['inputHEX'].value;
        var color = cm.removeSpaces(value);
        // Check for sharp
        color = (!/^#/.test(color) ? '#' : '') + color;
        // Reduce length
        color = cm.reduceText(color, 7, false);
        // Set
        that.nodes['inputHEX'].value = color;
        set(color, true, {'setInput' : false});
    };

    var inputHEXKeypressHandler = function(e){
        var color;
        e = cm.getEvent(e);
        if(e.keyCode == 13){
            color = that.nodes['inputHEX'].value;
            set(color, true);
            buttonSelectHandler();
        }
    };

    var buttonSelectHandler = function(){
        setColorPrev();
        that.triggerEvent('onSelect', that.value);
        eventOnChange();
    };

    var set = function(color, triggerEvent, params){
        if(cm.isEmpty(color)){
            color = that.params['defaultValue'];
        }else if(color == 'transparent'){
            color = {'h' : 360,  's' : 0,  'v' : 1, 'a' : 0};
        }
        that.value = tinycolor(color).toHsv();
        that.redraw(true, params);
        // Trigger onSet event
        if(triggerEvent){
            that.triggerEvent('onSet', that.value);
        }
    };
    
    var setColor = function(){
        setPreviewNew();
        setPreviewInputs();
        setPaletteDragColor();
        that.triggerEvent('onSet', that.value);
    };

    var setColorPrev = function(){
        if(that.value){
            that.previousValue = cm.clone(that.value);
        }else{
            if(!cm.isEmpty(that.params['value'])){
                that.previousValue = tinycolor(that.params['value']).toHsv();
            }else{
                that.previousValue = tinycolor(that.params['defaultValue']).toHsv();
            }
        }
        setPreviewPrev();
    };

    var setPaletteDragColor = function(){
        var color = tinycolor(cm.clone(that.value));
        if(color.isDark()){
            cm.replaceClass(that.nodes['paletteDrag'], 'is-light', 'is-dark');
        }else{
            cm.replaceClass(that.nodes['paletteDrag'], 'is-dark', 'is-light');
        }
    };

    var setPreviewNew = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['previewNew'].style.backgroundColor = color.toHslString();
    };

    var setPreviewPrev = function(){
        var color = tinycolor(cm.clone(that.previousValue));
        that.nodes['previewPrev'].style.backgroundColor = color.toHslString();
    };

    var setPreviewInputs = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['inputHEX'].value = color.toHexString();
    };

    var eventOnChange = function(){
        if(JSON.stringify(that.value) === JSON.stringify(that.previousValue) ){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* *** CANVAS *** */

    var renderRangeCanvas = function(){
        var gradient = rangeContext.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient.addColorStop(1/6, 'rgb(255, 0, 255)');
        gradient.addColorStop(2/6, 'rgb(0, 0, 255)');
        gradient.addColorStop(3/6, 'rgb(0, 255, 255)');
        gradient.addColorStop(4/6, 'rgb(0, 255, 0)');
        gradient.addColorStop(5/6, 'rgb(255, 255, 0)');
        gradient.addColorStop(1, 'rgb(255, 0, 0)');
        rangeContext.fillStyle = gradient;
        rangeContext.fillRect(0, 0, 100, 100);
    };

    var renderPaletteCanvas = function(){
        var gradient;
        // Fill color
        paletteContext.rect(0, 0, 100, 100);
        paletteContext.fillStyle = 'hsl(' +that.value['h']+', 100%, 50%)';
        paletteContext.fill();
        // Fill saturation
        gradient = paletteContext.createLinearGradient(0, 0, 100, 0);
        paletteContext.fillStyle = gradient;
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        paletteContext.fillRect(0, 0, 100, 100);
        // Fill brightness
        gradient = paletteContext.createLinearGradient(0, 0, 0, 100);
        paletteContext.fillStyle = gradient;
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        paletteContext.fillRect(0, 0, 100, 100);
    };

    var renderOpacityCanvas = function(){
        opacityContext.clearRect(0, 0, 100, 100);
        var gradient = opacityContext.createLinearGradient(0, 0, 0, 100),
            startColor = cm.clone(that.value),
            endColor = cm.clone(that.value);
        startColor['a'] = 1;
        endColor['a'] = 0;
        opacityContext.fillStyle = gradient;
        gradient.addColorStop(0, tinycolor(startColor).toRgbString());
        gradient.addColorStop(1, tinycolor(endColor).toRgbString());
        opacityContext.fillRect(0, 0, 100, 100);
    };

    /* ******* MAIN ******* */

    that.set = function(color, triggerEvent, params){
        triggerEvent = typeof triggerEvent == 'undefined'? true : triggerEvent;
        params = typeof params == 'undefined' ? {} : params;
        // Render new color
        set(color, triggerEvent, params);
        // Render previous color
        setColorPrev();
        return that;
    };

    that.get = function(method){
        var color = tinycolor(cm.clone(that.value));
        switch(method){
            case 'rgb':
                color = color.toRgbString();
                break;
            case 'hsl':
                color = color.toHslString();
                break;
            case 'hsv':
            case 'hsb':
                color = color.toHsvString();
                break;
            case 'hex':
            default:
                color = color.toHexString();
                break;
        }
        return color;
    };

    that.getRaw = function(method){
        var color = tinycolor(cm.clone(that.value));
        switch(method){
            case 'hsl':
                color = color.toHsl();
                break;
            case 'hsv':
            case 'hsb':
            default:
                // Color already in HSV
                break;
        }
        return color;
    };

    that.redraw = function(triggerEvent, params){
        triggerEvent = typeof triggerEvent == 'undefined'? true : triggerEvent;
        params = typeof params == 'undefined'? {} : params;
        params = cm.merge({
            'setInput' : true
        }, params);
        setOpacityDrag();
        setRangeDrag();
        setPaletteDrag();
        setPreviewNew();
        setPaletteDragColor();
        renderPaletteCanvas();
        renderOpacityCanvas();
        if(params['setInput']){
            setPreviewInputs();
        }
        if(triggerEvent){
            that.triggerEvent('onDraw');
        }
        return that;
    };

    that.isLight = function(){
        var color = tinycolor(cm.clone(that.value));
        return color.isLight();
    };

    that.isDark = function(){
        var color = tinycolor(cm.clone(that.value));
        return color.isDark();
    };

    init();
});
cm.define('Com.PositionTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__position-tools',
        'defaultValue' : 'center center',
        'options' : [
            {'name' : 'left top', 'icon' : 'svg__position-topleft', 'iconActive' : 'svg__position-topleft--light'},
            {'name' : 'center top', 'icon' : 'svg__position-topcenter', 'iconActive' : 'svg__position-topcenter--light'},
            {'name' : 'right top', 'icon' : 'svg__position-topright', 'iconActive' : 'svg__position-topright--light'},
            {'name' : 'left center', 'icon' : 'svg__position-middleleft', 'iconActive' : 'svg__position-middleleft--light'},
            {'name' : 'center center', 'icon' : 'svg__position-middlecenter', 'iconActive' : 'svg__position-middlecenter--light'},
            {'name' : 'right center', 'icon' : 'svg__position-middleright', 'iconActive' : 'svg__position-middleright--light'},
            {'name' : 'left bottom', 'icon' : 'svg__position-bottomleft', 'iconActive' : 'svg__position-bottomleft--light'},
            {'name' : 'center bottom', 'icon' : 'svg__position-bottomcenter', 'iconActive' : 'svg__position-bottomcenter--light'},
            {'name' : 'right bottom', 'icon' : 'svg__position-bottomright', 'iconActive' : 'svg__position-bottomright--light'}
        ]
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.options = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.PositionTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set inputs
        that.setOption();
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__position-tools__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderOption = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'iconType' : 'icon',
            'icon' : '',
            'iconActive' : '',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item'},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.myNodes['inner']);
        // Events
        cm.addEvent(item['nodes']['container'], 'click', function(){
            that.set(item['name']);
        });
        // Push
        that.options[item['name']] = item;
        return that;
    };

    classProto.setOption = function(){
        var that = this,
            item;
        if(that.options[that.previousValue]){
            item = that.options[that.previousValue];
            cm.removeClass(item['nodes']['container'], 'is-active');
            cm.replaceClass(item['nodes']['icon'], item['iconActive'], item['icon']);
        }
        if(that.options[that.value]){
            item = that.options[that.value];
            cm.addClass(item['nodes']['container'], 'is-active');
            cm.replaceClass(item['nodes']['icon'], item['icon'], item['iconActive']);
        }
    };
});
cm.define('Com.RepeatTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__repeat-tools',
        'defaultValue' : 'no-repeat',
        'options' : [
            {'name' : 'no-repeat', 'icon' : 'svg__repeat-no'},
            {'name' : 'repeat-x', 'icon' : 'svg__repeat-horizontal'},
            {'name' : 'repeat-y', 'icon' : 'svg__repeat-vertical'},
            {'name' : 'repeat', 'icon' : 'svg__repeat-both'}
        ],
        'langs' : {
            'no-repeat' : 'No',
            'repeat-x' : 'Horizontally',
            'repeat-y' : 'Vertically',
            'repeat' : 'Both'
        }
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.options = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.RepeatTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set inputs
        that.setOption();
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__repeat-tools__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderOption = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'iconType' : 'icon',
            'icon' : '',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item', 'title' : that.lang(item['name'])},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.myNodes['inner']);
        // Events
        cm.addEvent(item['nodes']['container'], 'click', function(){
            that.set(item['name']);
        });
        // Push
        that.options[item['name']] = item;
        return that;
    };

    classProto.setOption = function(){
        var that = this,
            item;
        if(that.options[that.previousValue]){
            item = that.options[that.previousValue];
            cm.removeClass(item['nodes']['container'], 'is-active');
        }
        if(that.options[that.value]){
            item = that.options[that.value];
            cm.addClass(item['nodes']['container'], 'is-active');
        }
    };
});
cm.define('Com.Request', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onStart',
        'onEnd',
        'onError',
        'onAbort',
        'onSuccess',
        'onContentRenderStart',
        'onContentRender',
        'onContentRenderEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'wrapContent' : true,
        'swapContentOnError' : true,
        'renderContentOnSuccess' : true,
        'className' : '',
        'autoSend' : false,
        'responseKey' : 'data',
        'responseHTML' : true,
        'responseHTMLKey' : 'data',
        'responseStatusKey' : 'data.success',
        'responseContainer' : null,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                 // Request URL. Variables: %baseUrl%, %callback%.
            'params' : '',                              // Params object. Variables: %baseUrl%, %callback%.
            'formData' : false
        },
        'variables' : {},
        'showOverlay' : true,
        'overlayContainer' : 'document.body',
        'overlayDelay' : 'cm._config.loadDelay',
        'animateDuration' : 'cm._config.animDuration',
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        },
        'Com.Overlay' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'showSpinner' : true,
            'showContent' : false,
            'position' : 'absolute',
            'theme' : 'light'
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.animations = {};
    that.components = {};
    that.requestData = {};
    that.responceData = null;
    that.responceDataFiltered = null;
    that.responceDataHTML = null;
    that.responceDataStatus = null;
    that.overlayDelay = null;
    that.isProcess = false;
    that.isError = false;
    that.isRendering = false;
    that.construct(params);
});

cm.getConstructor('Com.Request', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.destructHandler = that.destruct.bind(that);
        that.requestHandler = that.request.bind(that);
        that.setParams(params);
        that.convertEvents(that.params['events']);
        //that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoSend'] && that.set();
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
        }
        return that;
    };

    classProto.send = function(){
        var that = this;
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            that.request();
        }
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        if(that.params['wrapContent'] && cm.isNode(that.params['container'])){
            cm.appendNodes(that.params['container'].childNodes, that.nodes['inner']);
        }
        // Attributes
        that.setAttributes();
        // Overlay
        if(that.params['responseHTML']){
            that.params['Com.Overlay']['container'] =
                that.params['Com.Overlay']['container']
                || that.params['overlayContainer']
                || that.nodes['container']
                || document.body;
        }else{
            that.params['Com.Overlay']['container'] =
                that.params['Com.Overlay']['container']
                || that.params['overlayContainer']
                || document.body;
        }
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['overlay'] = new classConstructor(that.params[className]);
        });
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.nodes['container'] = cm.node('div', {'class' : 'com__request'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        return that;
    };
    
    classProto.setAttributes = function(){
        var that = this;
        // CSS Class
        cm.addClass(that.nodes['container'], that.params['className']);
        // Animations
        that.animations['container'] = new cm.Animation(that.nodes['container']);
        return that;
    };

    classProto.setAction = function(o, mode, update){
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['ajax'] = cm.merge(that._raw.params['ajax'], o);
                break;
            case 'current':
                that.params['ajax'] = cm.merge(that.params['ajax'], o);
                break;
            case 'update':
                that.params['ajax'] = cm.merge(that._update.params['ajax'], o);
                break;
        }
        if(update){
            that._update.params['ajax'] = cm.clone(that.params['ajax']);
        }
        return that;
    };

    classProto.setVariables = function(o, mode, update){
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['variables'] = cm.merge(that._raw.params['variables'], o);
                break;
            case 'current':
                that.params['variables'] = cm.merge(that.params['variables'], o);
                break;
            case 'update':
                that.params['variables'] = cm.merge(that._update.params['variables'], o);
                break;
        }
        if(update){
            that._update.params['variables'] = cm.clone(that.params['variables']);
        }
        return that;
    };

    /* *** REQUEST *** */

    classProto.request = function(){
        var that = this;
        that.prepare();
        that.components['ajax'] = cm.ajax(
            cm.merge(that.requestData, {
                'onStart' : function(){
                    that.start();
                },
                'onSuccess' : function(data){
                    that.responceData = data;
                    that.response();
                },
                'onError' : function(){
                    that.error();
                },
                'onAbort' : function(){
                    that.aborted();
                },
                'onEnd' : function(){
                    that.end();
                }
            })
        );
        return that;
    };

    classProto.prepare = function(){
        var that = this;
        that.isError = false;
        that.responceData = null;
        that.responceDataFiltered = null;
        that.responceDataHTML = null;
        that.responceDataStatus = null;
        that.requestData = cm.clone(that.params['ajax']);
        that.requestData['url'] = cm.strReplace(that.requestData['url'], that.params['variables']);
        that.requestData['params'] = cm.objectReplace(that.requestData['params'], that.params['variables']);
        return that;
    };

    classProto.abort = function(){
        var that = this;
        if(that.components['ajax'] && that.components['ajax'].abort){
            that.components['ajax'].abort();
        }
        return that;
    };

    classProto.start = function(){
        var that = this;
        that.isProcess = true;
        // Show Overlay
        if(that.params['showOverlay']){
            that.overlayDelay = setTimeout(function(){
                if(that.components['overlay'] && !that.components['overlay'].isOpen){
                    that.components['overlay'].open();
                }
            }, that.params['overlayDelay']);
        }
        that.triggerEvent('onStart');
        return that;
    };

    classProto.end = function(){
        var that = this;
        that.isProcess = false;
        // Hide Overlay
        if(that.params['showOverlay']){
            that.overlayDelay && clearTimeout(that.overlayDelay);
            if(that.components['overlay'] && that.components['overlay'].isOpen){
                that.components['overlay'].close();
            }
        }
        that.triggerEvent('onEnd');
        return that;
    };

    classProto.filter = function(){
        var that = this,
            dataFiltered = cm.objectSelector(that.params['responseKey'], that.responceData),
            dataStatus = cm.objectSelector(that.params['responseStatusKey'], that.responceData),
            dataHTML;
        if(cm.isEmpty(that.params['responseHTMLKey'])){
            dataHTML = cm.objectSelector(that.params['responseKey'], that.responceData);
        }else{
            dataHTML = cm.objectSelector(that.params['responseHTMLKey'], that.responceData);
        }
        that.responceDataFiltered = !cm.isEmpty(dataFiltered) ? dataFiltered : [];
        that.responceDataHTML = !cm.isEmpty(dataHTML) ? dataHTML : '';
        that.responceDataStatus = !cm.isEmpty(dataStatus) ? dataStatus : false;
    };

    classProto.response = function(){
        var that = this;
        if(!cm.isEmpty(that.responceData)){
            that.filter();
        }
        if(!cm.isEmpty(that.responceDataFiltered) || that.responceDataStatus){
            that.success();
        }else{
            that.error();
        }
        return that;
    };

    classProto.error = function(){
        var that = this;
        that.isError = true;
        that.renderError();
        that.triggerEvent('onError');
        return that;
    };

    classProto.success = function(){
        var that = this;
        that.isError = false;
        if(!that.responceDataStatus || (that.responceDataStatus && that.params['renderContentOnSuccess'])){
            that.renderResponse();
        }
        that.triggerEvent('onSuccess', {
            'response' : that.responceData,
            'status' : that.responceDataStatus,
            'filtered' : that.responceDataFiltered,
            'html' : that.responceDataHTML
        });
        return that;
    };

    classProto.aborted = function(){
        var that = this;
        cm.triggerEvent('onAbort');
        return that;
    };

    /* *** RENDER *** */

    classProto.renderTemporary = function(visible){
        var node = cm.node('div', {'class' : 'com__request__temporary'});
        if(visible){
            cm.addClass(node, 'is-show');
        }
        return node;
    };

    classProto.renderResponse = function(){
        var that = this,
            nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(that.responceDataHTML);
            that.renderContent(nodes);
        }
        return that;
    };

    classProto.renderContent = function(nodes){
        var that = this,
            temporary;
        if(cm.isNode(that.params['responseContainer'])){
            that.triggerEvent('onContentRenderStart', nodes);
            cm.clearNode(that.params['responseContainer']);
            cm.appendNodes(nodes, that.params['responseContainer']);
            that.triggerEvent('onContentRender', nodes);
            that.triggerEvent('onContentRenderEnd', nodes);
        }else if(cm.isNode(that.params['container'])){
            temporary = that.renderTemporary(false);
            cm.appendNodes(nodes, temporary);
            that.appendResponse(temporary);
        }else{
            that.triggerEvent('onContentRenderStart', nodes);
            that.triggerEvent('onContentRender', nodes);
            that.triggerEvent('onContentRenderEnd', nodes);
        }
        return that;
    };

    classProto.renderError = function(){
        var that = this,
            temporary,
            node;
        if(that.params['responseHTML']){
            node = cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'));
            // Append
            if(cm.isNode(that.params['responseContainer'])){
                that.triggerEvent('onContentRenderStart', node);
                if(that.params['swapContentOnError']){
                    cm.clearNode(that.params['responseContainer']);
                    cm.appendChild(node, that.params['responseContainer']);
                }else{
                    cm.remove(that.nodes['error']);
                    that.nodes['error'] = node;
                    cm.insertFirst(that.nodes['error'], that.params['responseContainer']);
                }
                that.triggerEvent('onContentRender', node);
                that.triggerEvent('onContentRenderEnd', node);
            }else if(cm.isNode(that.params['container'])){
                temporary = that.renderTemporary();
                cm.appendChild(node, temporary);
                if(that.params['swapContentOnError']){
                    that.appendResponse(temporary);
                }else{
                    that.appendError(temporary);
                }
            }else{
                that.triggerEvent('onContentRenderStart', node);
                that.triggerEvent('onContentRender', node);
                that.triggerEvent('onContentRenderEnd', node);
            }
        }
        return that;
    };

    classProto.appendError = function(temporary){
        var that = this;
        that.isRendering = true;
        that.triggerEvent('onContentRenderStart', temporary);
        cm.remove(that.nodes['error']);
        that.nodes['error'] = temporary;
        cm.addClass(that.nodes['error'], 'is-show');
        if(that.nodes['temporary']){
            cm.insertFirst(that.nodes['error'], that.nodes['temporary']);
        }else{
            cm.insertFirst(that.nodes['error'], that.nodes['inner']);
        }
        cm.addClass(that.nodes['container'], 'is-show is-loaded', true);
        that.isRendering = false;
        that.triggerEvent('onContentRender', temporary);
        that.triggerEvent('onContentRenderEnd', temporary);
        return that;
    };

    classProto.appendResponse = function(temporary){
        var that = this,
            height;
        that.isRendering = true;
        that.triggerEvent('onContentRenderStart', temporary);
        // Wrap old content
        if(!that.nodes['temporary']){
            that.nodes['temporary'] = that.renderTemporary(false);
            cm.appendNodes(that.nodes['inner'].childNodes, that.nodes['temporary']);
            cm.appendChild(that.nodes['temporary'], that.nodes['inner']);
            cm.customEvent.trigger(that.nodes['temporary'], 'destruct', {
                'type' : 'child',
                'self' : false
            });
        }
        cm.removeClass(that.nodes['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['inner']);
        cm.addClass(temporary, 'is-show', true);
        // Show container
        cm.removeClass(that.nodes['container'], 'is-loaded', true);
        cm.addClass(that.nodes['container'], 'is-show', true);
        that.triggerEvent('onContentRender', that.nodes['temporary']);
        // Animate
        height = temporary.offsetHeight;
        that.animations['container'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                // Remove old temporary
                cm.remove(that.nodes['temporary']);
                // Apply new temporary
                that.nodes['temporary'] = temporary;
                that.nodes['container'].style.height = '';
                cm.addClass(that.nodes['container'], 'is-loaded', true);
                that.isRendering = false;
                that.triggerEvent('onContentRenderEnd', that.nodes['temporary']);
            }
        });
        return that;
    };
});
cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Router', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.routes = {};
        that.current = null;
        that.previous = null;
        // Bind
        that.windowClickEventHandler = that.windowClickEvent.bind(that);
        // Call parent method - construct
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init location handlers
        cm.addEvent(window, 'click', that.windowClickEventHandler);
        return that;
    };

    classProto.windowClickEvent = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        if(cm.isNode(target) && target.tagName.toLowerCase() == 'a'){
            cm.preventDefault(e);
            that.processLink(target);
        }
        return that;
    };

    classProto.processLink = function(el){
        var that = this;
        var route = el.getAttribute('href');
        route && that.processRoute(route);
        return that;
    };

    classProto.processRoute = function(route){
        var that = this;
        cm.log(route);
        // Set Window URL
        window.history.pushState({}, '', route);
        // Destruct old route
        that.destructRoute(that.current);
        // Construct new route
        if(that.routes[route]){
            that.constructRoute(route)
        }else if(that.routes['/404']){
            that.constructRoute('/404')
        }
        return that;
    };

    classProto.destructRoute = function(route){
        var that = this;
        var item = that.routes[route];
        // Export
        that.previous = route;
        // Callbacks
        if(item){
            if(item['constructor']){
                item['controller'] && item['controller'].destruct && item['controller'].destruct();
            }else{
                item['onDestruct'](item);
                item['callback'](item);
            }
        }
        return that;
    };

    classProto.constructRoute = function(route){
        var that = this;
        var item = that.routes[route];
        // Export
        that.current = route;
        // Callbacks
        if(item){
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'container' : that.params['container']
                        })
                    );
                });
            }else{
                item['onConstruct'](item);
                item['callback'](item);
            }
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.add = function(route, params){
        var that = this;
        var item = cm.merge({
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){},
            'onConstruct' : function(){},
            'onDestruct' : function(){}
        }, params);
        // Export
        that.routes[route] = item;
        return that;
    };

    classProto.remove = function(route){
        var that = this;
        if(that.routes[route]){
            delete that.routes[route];
        }
        return that;
    };

    classProto.trigger = function(route){
        var that = this;
        that.processRoute(route);
        return that;
    };

    classProto.start = function(){
        var that = this;
        var route = window.location.pathname;
        that.processRoute(route);
        return that;
    };
});
cm.define('Com.ScaleTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__scale-tools',
        'defaultValue' : 'original',
        'options' : [
            {'name' : 'original', 'icon' : 'svg__scale-original'},
            {'name' : 'contain', 'icon' : 'svg__scale-contain'},
            {'name' : 'cover', 'icon' : 'svg__scale-cover'},
            {'name' : '100% 100%', 'icon' : 'svg__scale-fill'}
        ],
        'langs' : {
            'original' : 'Original',
            'contain' : 'Contain',
            'cover' : 'Cover',
            '100% 100%' : 'Fill'
        }
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.options = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.ScaleTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set inputs
        that.setOption();
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__scale-tools__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderOption = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'iconType' : 'icon',
            'icon' : '',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item', 'title' : that.lang(item['name'])},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.myNodes['inner']);
        // Events
        cm.addEvent(item['nodes']['container'], 'click', function(){
            that.set(item['name']);
        });
        // Push
        that.options[item['name']] = item;
        return that;
    };

    classProto.setOption = function(){
        var that = this,
            item;
        if(that.options[that.previousValue]){
            item = that.options[that.previousValue];
            cm.removeClass(item['nodes']['container'], 'is-active');
        }
        if(that.options[that.value]){
            item = that.options[that.value];
            cm.addClass(item['nodes']['container'], 'is-active');
        }
    };
});
Com['Scroll'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.Node('div'),
            'step' : 15,
            'time' : 50,
            'duration' : 300,
            'nodes' : {},
            'events' : {}
        }, o),
        API = {
            'onScroll' : [],
            'onScrollStart' : [],
            'onScrollEnd' : []
        },
        nodes = {
            'left' : cm.Node('div'),
            'right' : cm.Node('div'),
            'up' : cm.Node('div'),
            'down' : cm.Node('div'),
            'scroll' : cm.Node('div')
        },
        anim,
        animInterval,
        top,
        left;

    var init = function(){
        convertEvents(config['events']);
        getNodes(config['node'], 'ComScroll');
        render();
    };

    var render = function(){
        // Init animation
        anim = new cm.Animation(nodes['scroll']);
        // Reset
        nodes['scroll'].scrollTop = 0;
        nodes['scroll'].scrollLeft = 0;
        // Events
        cm.addEvent(nodes['up'], 'mousedown', startMoveUp);
        cm.addEvent(nodes['up'], 'mouseup', endAnimation);
        cm.addEvent(nodes['up'], 'mouseout', endAnimation);
        cm.addEvent(nodes['down'], 'mousedown', startMoveDown);
        cm.addEvent(nodes['down'], 'mouseup', endAnimation);
        cm.addEvent(nodes['down'], 'mouseout', endAnimation);
        cm.addEvent(nodes['left'], 'mousedown', startMoveLeft);
        cm.addEvent(nodes['left'], 'mouseup', endAnimation);
        cm.addEvent(nodes['left'], 'mouseout', endAnimation);
        cm.addEvent(nodes['right'], 'mousedown', startMoveRight);
        cm.addEvent(nodes['right'], 'mouseup', endAnimation);
        cm.addEvent(nodes['right'], 'mouseout', endAnimation);
    };

    var startMoveUp = function(){
        endAnimation();
        animInterval = setInterval(moveUp, config['time']);
        moveUp();
    };

    var startMoveDown = function(){
        endAnimation();
        animInterval = setInterval(moveDown, config['time']);
        moveDown();
    };

    var startMoveLeft = function(){
        endAnimation();
        animInterval = setInterval(moveLeft, config['time']);
        moveLeft();
    };

    var startMoveRight = function(){
        endAnimation();
        animInterval = setInterval(moveRight, config['time']);
        moveRight();
    };

    var endAnimation = function(){
        animInterval && clearInterval(animInterval);
    };

    var moveUp = function(){
        top = Math.max((nodes['scroll'].scrollTop - config['step']), 0);
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveDown = function(){
        top = Math.min((nodes['scroll'].scrollTop + config['step']), (nodes['scroll'].scrollHeight - nodes['scroll'].offsetHeight));
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveLeft = function(){
        left = Math.max((nodes['scroll'].scrollLeft - config['step']), 0);
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveRight = function(){
        left = Math.min((nodes['scroll'].scrollLeft + config['step']), (nodes['scroll'].scrollWidth - nodes['scroll'].offsetWidth));
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var getNodes = function(container, marker){
        if(container){
            var sourceNodes = {};
            if(marker){
                sourceNodes = cm.getNodes(container)[marker] || {};
            }else{
                sourceNodes = cm.getNodes(container);
            }
            nodes = cm.merge(nodes, sourceNodes);
        }
        nodes = cm.merge(nodes, config['nodes']);
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.scrollY = function(num){
        var top = Math.max(Math.min(num, nodes['scroll'].scrollHeight - nodes['scroll'].offsetHeight), 0);
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['duration'], 'amim' : 'smooth'});
        return that;
    };

    that.scrollX = function(num){
        var left = Math.max(Math.min(num, nodes['scroll'].scrollWidth - nodes['scroll'].offsetWidth), 0);
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['duration'], 'amim' : 'smooth'});
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    init();
};
cm.define('Com.ScrollPagination', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onRebuild',
        'onStart',
        'onAbort',
        'onError',
        'onPageRender',
        'onPageRenderEnd',
        'onPageShow',
        'onPageHide',
        'onEnd',
        'onFinalize',
        'onSetCount'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructure' : 'append',
        'scrollNode' : window,
        'scrollIndent' : 'Math.min(%scrollHeight% / 2, 600)',       // Variables: %blockHeight%.
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,                                            // Render only count of pages. 0 - infinity
        'showButton' : true,                                        // true - always | once - show once after first loaded page
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'stopOnESC' : true,
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__scroll-pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
        },
        'langs' : {
            'load_more' : 'Load More'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'scroll' : null,
        'bar' : cm.Node('div'),
        'content' : cm.Node('div'),
        'pages' : cm.Node('div'),
        'button' : cm.Node('div'),
        'loader' : cm.Node('div')
    };

    that.components = {};
    that.pages = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isAjax = false;
    that.isProcess = false;
    that.isFinalize = false;
    that.isButton = false;

    that.page = null;
    that.pageToken = null;
    that.currentPage = null;
    that.previousPage = null;
    that.nextPage = null;
    that.pageCount = 0;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        set();
    };

    var validateParams = function(){
        // Set Scroll Node
        if(that.nodes['scroll']){
            that.params['scrollNode'] = that.nodes['scroll'];
        }
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] == 0 && that.params['perPage'] && that.params['count']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Set next page token
        that.nextPage = that.params['startPage'];
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('div', {'class' : 'com__scroll-pagination'},
                that.nodes['content'] = cm.Node('div', {'class' : 'com__scroll-pagination__content'},
                    that.nodes['pages'] = cm.Node('div', {'class' : 'com__scroll-pagination__pages'})
                ),
                that.nodes['bar'] = cm.Node('div', {'class' : 'com__scroll-pagination__bar'},
                    that.nodes['button'] = cm.Node('div', {'class' : 'button button-primary'}, that.lang('load_more')),
                    that.nodes['loader'] = cm.Node('div', {'class' : 'button button-clear has-icon has-icon has-icon-small'},
                        cm.Node('div', {'class' : 'icon small loader'})
                    )
                )
            );
            // Append
            that.embedStructure(that.nodes['container']);
        }
        // Reset styles and variables
        reset();
        // Events
        cm.addEvent(that.nodes['button'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set();
        });
        if(that.params['stopOnESC']){
            cm.addEvent(window, 'keydown', ESCHandler);
        }
        cm.addScrollEvent(that.params['scrollNode'], scrollHandler);
        cm.addEvent(window, 'resize', resizeHandler);
    };

    var reset = function(){
        // Clear render pages
        cm.clearNode(that.nodes['pages']);
        // Load More Button
        if(!that.params['showButton']){
            that.callbacks.hideButton(that);
        }else{
            that.callbacks.showButton(that);
        }
        // Hide Loader
        cm.addClass(that.nodes['loader'], 'is-hidden');
    };

    var set = function(){
        var config;
        if(!that.isProcess && !that.isFinalize){
            // Preset next page and page token
            that.page = that.nextPage;
            that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : '';
            // Request
            if(that.isAjax){
                config = cm.clone(that.params['ajax']);
                that.ajaxHandler = that.callbacks.request(that, config);
            }else{
                that.callbacks.data(that, that.params['data']);
            }
        }
    };

    var scrollHandler = function(){
        var scrollRect = cm.getRect(that.params['scrollNode']),
            pagesRect = cm.getRect(that.nodes['pages']),
            scrollIndent;
        if((!that.params['showButton'] || (that.params['showButton'] == 'once' && that.params['startPage'] != that.currentPage)) && !cm.isProcess && !that.isFinalize && !that.isButton){
            scrollIndent = eval(cm.strReplace(that.params['scrollIndent'], {
                '%scrollHeight%' : scrollRect['bottom'] - scrollRect['top']
            }));
            if(pagesRect['bottom'] - scrollRect['bottom'] <= scrollIndent){
                set();
            }
        }
        // Show / Hide non visible pages
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page, scrollRect);
        });
    };

    var ESCHandler = function(e){
        e = cm.getEvent(e);

        if(e.keyCode == 27){
            if(!cm.isProcess && !cm.isFinalize){
                that.callbacks.showButton(that);
            }
        }
    };

    var resizeHandler = function(){
        // Show / Hide non visible pages
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page);
        });
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response),
            countItem = cm.objectSelector(that.params['responseCountKey'], response);
        if(!cm.isEmpty(dataItem)){
            if(!that.params['responseHTML'] && that.params['perPage']){
                data = dataItem.slice(0, that.params['perPage']);
            }else{
                data = dataItem;
            }
        }
        if(countItem){
            that.setCount(countItem);
        }
        return data;
    };

    that.callbacks.response = function(that, config, response){
        // Set next page
        that.setPage();
        // Response
        if(response){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.render(that, response);
        }else{
            that.callbacks.finalize(that);
        }
    };

    that.callbacks.error = function(that, config){
        that.callbacks.finalize(that);
        that.triggerEvent('onError');
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** STATIC *** */

    that.callbacks.data = function(that, data){
        var length, start, end, pageData;
        that.callbacks.start(that);
        that.setPage();
        if(!cm.isEmpty(data)){
            // Get page data and render
            if(that.params['perPage'] == 0){
                that.callbacks.render(that, data);
                that.callbacks.finalize(that);
            }else if(that.params['perPage'] > 0){
                length = data.length;
                start = (that.page - 1) * that.params['perPage'];
                end = (that.page * that.params['perPage']);
                if(start >= length){
                    that.callbacks.finalize(that);
                }else{
                    pageData = data.slice(start , Math.min(end, length));
                    that.callbacks.render(that, pageData);
                }
                if(end >= length){
                    that.callbacks.finalize(that);
                }
            }
        }else{
            that.callbacks.render(that, data);
        }
        that.callbacks.end(that);
    };

    /* *** RENDER *** */

    that.callbacks.renderContainer = function(that, page){
        return cm.Node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        var scrollTop = cm.getScrollTop(that.params['scrollNode']),
            page = {
                'page' : that.page,
                'token' : that.pageToken,
                'pages' : that.nodes['pages'],
                'container' : cm.Node(that.params['pageTag']),
                'data' : data,
                'isVisible' : false
            };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
        // Embed
        that.nodes['pages'].appendChild(page['container']);
        // Restore scroll position
        cm.setScrollTop(that.params['scrollNode'], scrollTop);
        that.triggerEvent('onPageRenderEnd', page);
        that.isPageVisible(page);
    };

    that.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    page['container'].appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            page['container'].appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
        }
    };

    /* *** HELPERS *** */

    that.callbacks.start = function(that){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            if(that.isButton){
                cm.addClass(that.nodes['button'], 'is-hidden');
                cm.removeClass(that.nodes['loader'], 'is-hidden');
            }else{
                that.loaderDelay = setTimeout(function(){
                    cm.removeClass(that.nodes['loader'], 'is-hidden');
                    cm.removeClass(that.nodes['bar'], 'is-hidden');
                }, that.params['loaderDelay']);
            }
        }
        that.triggerEvent('onStart');
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        that.loaderDelay && clearTimeout(that.loaderDelay);
        cm.addClass(that.nodes['loader'], 'is-hidden');
        // Check pages count
        if(that.pageCount > 0 && that.pageCount == that.currentPage){
            that.callbacks.finalize(that);
        }
        // Show / Hide Load More Button
        that.callbacks.toggleButton(that);
        that.triggerEvent('onEnd');
    };

    that.callbacks.finalize = function(that){
        if(!that.isFinalize){
            that.isFinalize = true;
            that.callbacks.hideButton(that);
            that.triggerEvent('onFinalize');
        }
    };

    that.callbacks.toggleButton = function(that){
        if(!that.isFinalize && (that.params['showButton'] === true || (that.params['showButton'] == 'once' && that.params['startPage'] == that.page))){
            that.callbacks.showButton(that);
        }else{
            that.callbacks.hideButton(that);
        }
    };

    that.callbacks.showButton = function(that){
        that.isButton = true;
        cm.removeClass(that.nodes['button'], 'is-hidden');
        cm.removeClass(that.nodes['bar'], 'is-hidden');
    };

    that.callbacks.hideButton = function(that){
        that.isButton = false;
        cm.addClass(that.nodes['button'], 'is-hidden');
        cm.addClass(that.nodes['bar'], 'is-hidden');
    };

    /* ******* PUBLIC ******* */

    that.set = function(){
        set();
        return that;
    };

    that.setToken = function(page, token){
        if(!that.pages[page]){
            that.pages[page] = {};
        }
        that.pages[page]['token'] = token;
        return that;
    };

    that.setCount = function(count){
        if(count && (count = parseInt(count.toString())) && count != that.params['count']){
            that.params['count'] = count;
            if(that.params['pageCount'] == 0 && that.params['count'] && that.params['perPage']){
                that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
            }else{
                that.pageCount = that.params['pageCount'];
            }
            if(that.pageCount > 0 && that.pageCount == that.currentPage){
                that.callbacks.finalize(that);
            }
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
        return that;
    };

    that.rebuild = function(params){
        // Cleanup
        if(that.isProcess){
            that.abort();
        }
        that.pages = {};
        that.currentPage = null;
        that.previousPage = null;
        // Set new parameters
        that.setParams(params);
        validateParams();
        // Reset styles and variables
        reset();
        that.triggerEvent('onRebuild');
        // Render new pge
        set();
    };

    that.isPageVisible = function(page, scrollRect){
        if(page['container']){
            scrollRect = typeof scrollRect == 'undefined' ? cm.getRect(that.params['scrollNode']) : scrollRect;
            var pageRect = cm.getRect(page['container']);

            if(cm.inRange(pageRect['top'], pageRect['bottom'], scrollRect['top'], scrollRect['bottom'])){
                if(!page['isVisible']){
                    page['isVisible'] = true;
                    cm.removeClass(page['container'], 'is-hidden');
                    cm.triggerEvent('onPageShow', page);
                }
            }else{
                if(page['isVisible']){
                    page['isVisible'] = false;
                    cm.addClass(page['container'], 'is-hidden');
                    cm.triggerEvent('onPageHide', page);
                }
            }
            return page['isVisible'];
        }
        return false;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.isParent = function(node, flag){
        return cm.isParent(that.nodes['container'], node, flag);
    };

    init();
});
Com.Elements['Selects'] = {};

Com['GetSelect'] = function(id){
    return Com.Elements.Selects[id] || null;
};

cm.define('Com.Select', {
    'modules' : [
        'Params',
        'Events',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onRenderStart',
        'onSelect',
        'onChange',
        'onReset',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'select' : null,                        // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('select'),             // Html select node to decorate.
        'container' : null,                    // Component container that is required in case content is rendered without available select.
        'name' : '',
        'embedStructure' : 'replace',
        'customEvents' : true,
        'renderInBody' : true,                  // Render dropdowns in document.body, else they will be rendrered in component container.
        'multiple' : false,                     // Render multiple select.
        'placeholder' : '',
        'showTitleTag' : true,                  // Copy title from available select node to component container. Will be shown on hover.
        'title' : false,                        // Title text. Will be shown on hover.
        'options' : [],                         // Listing of options, for rendering through java-script. Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'selected' : 0,                         // Option value / array of option values.
        'disabled' : false,
        'className' : '',
        'inputClassName' : '',
        'icons' : {
            'arrow' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__select__tooltip',
            'width' : 'targetWidth',
            'top' : 'cm._config.tooltipTop'
        }
    }
},
function(params){
    var that = this,
        nodes = {
            'menu' : {}
        },
        components = {},
        options = {},
        optionsList = [],
        optionsLength = 0,
        groups = [],

        oldActive,
        active;

    that.disabled = false;
    that.isDestructed = null;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        setMiscEvents();
        setEvents();
        // Set selected option
        if(that.params['multiple']){
            active = [];
            if(that.params['selected'] && cm.isArray(that.params['selected'])){
                cm.forEach(that.params['selected'], function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
            }else{
                cm.forEach(that.params['node'].options, function(item){
                    item.selected && set(options[item.value]);
                });
            }
        }else{
            if(that.params['selected'] && options[that.params['selected']]){
                set(options[that.params['selected']]);
            }else if(options[that.params['node'].value]){
                set(options[that.params['node'].value]);
            }else if(optionsLength){
                set(optionsList[0]);
            }
        }
        // Final events
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender', active);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['select'])){
            that.params['node'] = that.params['select'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['multiple'] = that.params['node'].multiple;
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['className'] = that.params['node'].className || that.params['className'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        var tabindex;
        /* *** RENDER STRUCTURE *** */
        if(that.params['multiple']){
            renderMultiple();
        }else{
            renderSingle();
        }
        /* *** ATTRIBUTES *** */
        // Add class name
        cm.addClass(nodes['container'], that.params['className']);
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // Tabindex
        if(tabindex = that.params['node'].getAttribute('tabindex')){
            nodes['container'].setAttribute('tabindex', tabindex);
        }
        // ID
        if(that.params['node'].id){
            nodes['container'].id = that.params['node'].id;
        }
        // Data
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-(?!node|element)/.test(item.name)){
                nodes['hidden'].setAttribute(item.name, item.value);
                nodes['container'].setAttribute(item.name, item.value);
            }
        });
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['items'].appendChild(
                nodes['placeholder'] = cm.Node('li', {'class' : 'title'}, that.params['placeholder'])
            );
        }
        /* *** RENDER OPTIONS *** */
        collectSelectOptions();
        cm.forEach(that.params['options'], function(item){
            renderOption(item);
        });
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var renderSingle = function(){
        nodes['container'] = cm.Node('div', {'class' : 'com__select'},
            nodes['hidden'] = cm.Node('select', {'class' : 'display-none'}),
            nodes['target'] = cm.Node('div', {'class' : 'pt__input'},
                nodes['text'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
                nodes['arrow'] = cm.Node('div', {'class' : that.params['icons']['arrow']})
            ),
            nodes['scroll'] = cm.Node('div', {'class' : 'pt__listing-items'},
                nodes['items'] = cm.Node('ul')
            )
        );
        cm.addClass(nodes['target'], that.params['inputClassName']);
    };

    var renderMultiple = function(){
        nodes['container'] = cm.Node('div', {'class' : 'com__select-multi'},
            nodes['hidden'] = cm.Node('select', {'class' : 'display-none', 'multiple' : true}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['scroll'] = cm.Node('div', {'class' : 'pt__listing-items'},
                    nodes['items'] = cm.Node('ul')
                )
            )
        );
    };

    var setMiscEvents = function(){
        if(!that.params['multiple']){
            // Switch items on arrows press
            cm.addEvent(nodes['container'], 'keydown', function(e){
                if(optionsLength){
                    var item = options[active],
                        index = optionsList.indexOf(item),
                        option;

                    switch(e.keyCode){
                        case 38:
                            cm.preventDefault(e);
                            if(index - 1 >= 0){
                                option = optionsList[index - 1];
                            }else{
                                option = optionsList[optionsLength - 1];
                            }
                            break;

                        case 40:
                            cm.preventDefault(e);
                            if(index + 1 < optionsLength){
                                option = optionsList[index + 1];
                            }else{
                                option = optionsList[0];
                            }
                            break;

                        case 13:
                            components['menu'].hide();
                            break;
                    }

                    if(option){
                        set(option, true);
                        scrollToItem(option);
                    }
                }
            });
            cm.addEvent(nodes['container'], 'focus', function(){
                cm.addEvent(window, 'keydown', blockDocumentArrows);
            });
            cm.addEvent(nodes['container'], 'blur', function(){
                cm.removeEvent(window, 'keydown', blockDocumentArrows);
            });
            // Render tooltip
            components['menu'] = new Com.Tooltip(
                cm.merge(that.params['Com.Tooltip'], {
                    'container' : that.params['renderInBody']? document.body : nodes['container'],
                    'content' : nodes['scroll'],
                    'target' : nodes['target'],
                    'disabled' : !optionsLength,
                    'events' : {
                        'onShowStart' : show,
                        'onHideStart' : hide
                    }
                })
            );
            nodes['menu'] = components['menu'].getNodes();
        }
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var setEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    /* *** COLLECTORS *** */

    var collectSelectOptions = function(){
        var myChildes = that.params['node'].childNodes;
        cm.forEach(myChildes, function(myChild, i){
            if(cm.isElementNode(myChild)){
                if(myChild.tagName.toLowerCase() == 'optgroup'){
                    var myOptionsNodes = myChild.querySelectorAll('option');
                    var myOptions = [];
                    cm.forEach(myOptionsNodes, function(optionNode){
                        myOptions.push({
                            'value' : optionNode.value,
                            'text' : optionNode.innerHTML,
                            'className' : optionNode.className
                        });
                    });
                    renderGroup(myChild.getAttribute('label'), myOptions);
                }else if(myChild.tagName.toLowerCase() == 'option'){
                    renderOption({
                        'value' : myChild.value,
                        'text' : myChild.innerHTML,
                        'className' : myChild.className
                    });
                }
            }
        });
    };

    /* *** GROUPS *** */

    var renderGroup = function(myName, myOptions){
        // Config
        var item = {
            'name' : myName,
            'options' : myOptions
        };
        // Structure
        item['optgroup'] = cm.Node('optgroup', {'label' : myName});
        item['container'] = cm.Node('li', {'class' : 'group'},
            item['items'] = cm.Node('ul', {'class' : 'pt__listing-items'})
        );
        if(!cm.isEmpty(myName)){
            cm.insertFirst(
                cm.Node('div', {'class' : 'title', 'innerHTML' : myName}),
                item['container']
            );
        }
        // Render options
        cm.forEach(myOptions, function(myOption){
            renderOption(myOption, item);
        });
        // Append
        nodes['items'].appendChild(item['container']);
        nodes['hidden'].appendChild(item['optgroup']);
        // Push to groups array
        groups.push(item);
    };

    /* *** OPTIONS *** */

    var renderOption = function(item, group){
        // Check for exists
        if(options[item['value']]){
            removeOption(options[item['value']]);
        }
        // Config
        item = cm.merge({
            'selected' : false,
            'value' : '',
            'text' : '',
            'className' : '',
            'group': null
        }, item);
        // Add link to group
        item['group'] = group;
        // Structure
        item['node'] = cm.Node('li', {'class' : item['className']},
            cm.Node('a', {'innerHTML' : item['text']})
        );
        item['option'] = cm.Node('option', {'value' : item['value'], 'innerHTML' : item['text']});
        // Label onlick event
        cm.addEvent(item['node'], 'click', function(){
            if(!that.disabled){
                set(item, true);
            }
            !that.params['multiple'] && components['menu'].hide(false);
        });
        // Append
        if(group){
            group['items'].appendChild(item['node']);
            group['optgroup'].appendChild(item['option']);
        }else{
            nodes['items'].appendChild(item['node']);
            nodes['hidden'].appendChild(item['option']);
        }
        // Push
        optionsList.push(options[item['value']] = item);
        optionsLength = optionsList.length;
        return true;
    };

    var editOption = function(option, text){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];
        option['text'] = text;
        option['node'].innerHTML = text;
        option['option'].innerHTML = text;

        if(!that.params['multiple'] && value === active){
            nodes['text'].value = cm.decode(text);
        }
    };

    var removeOption = function(option){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];
        // Remove option from list and array
        cm.remove(option['node']);
        cm.remove(option['option']);
        optionsList = optionsList.filter(function(item){
            return option != item;
        });
        optionsLength = optionsList.length;
        delete options[option['value']];
        // Set new active option, if current active is nominated for remove
        if(that.params['multiple']){
            active = active.filter(function(item){
                return value != item;
            });
        }else{
            if(value === active){
                if(optionsLength){
                    set(optionsList[0], true);
                }else{
                    active = null;
                    nodes['text'].value = '';
                }
            }
        }
    };

    /* *** SETTERS *** */

    var set = function(option, execute){
        if(option){
            if(that.params['multiple']){
                setMultiple(option);
            }else{
                setSingle(option);
            }
        }
        if(execute){
            that.triggerEvent('onSelect', active);
            onChange();
        }
    };

    var setMultiple = function(option){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];

        if(option['selected']){
            deselectMultiple(option);
        }else{
            active.push(value);
            option['option'].selected = true;
            option['selected'] = true;
            cm.addClass(option['node'], 'active');
        }
    };

    var setSingle = function(option){
        oldActive = active;
        active = typeof option['value'] != 'undefined'? option['value'] : option['text'];
        optionsList.forEach(function(item){
            cm.removeClass(item['node'], 'active');
        });
        if(option['group']){
            nodes['text'].value = [cm.decode(option['group']['name']), cm.decode(option['text'])].join(' > ');
        }else{
            nodes['text'].value = cm.decode(option['text']);
        }
        option['option'].selected = true;
        nodes['hidden'].value = active;
        cm.addClass(option['node'], 'active');
    };

    var deselectMultiple = function(option){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];

        active = active.filter(function(item){
            return value != item;
        });
        option['option'].selected = false;
        option['selected'] = false;
        cm.removeClass(option['node'], 'active');
    };

    var onChange = function(){
        if(that.params['multiple'] || active != oldActive){
            that.triggerEvent('onChange', active);
        }
    };

    /* *** DROPDOWN *** */

    var show = function(){
        if(!optionsLength){
            components['menu'].hide();
        }else{
            // Set classes
            cm.addClass(nodes['container'], 'active');
            nodes['text'].focus();
            // Scroll to active element
            if(active && options[active]){
                scrollToItem(options[active]);
            }
        }
        that.triggerEvent('onFocus', active);
    };

    var hide = function(){
        nodes['text'].blur();
        cm.removeClass(nodes['container'], 'active');
        that.triggerEvent('onBlur', active);
    };

    var scrollToItem = function(option){
        nodes['menu']['content'].scrollTop = option['node'].offsetTop - nodes['menu']['content'].offsetTop;
    };

    /* *** HELPERS *** */

    var blockDocumentArrows = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 38 || e.keyCode == 40){
            cm.preventDefault(e);
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(){
        return active || null;
    };

    that.set = function(value, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Select option and execute events
        if(typeof value != 'undefined'){
            if(cm.isArray(value)){
                cm.forEach(value, function(item){
                    if(options[item]){
                        set(options[item], false);
                    }
                });
                if(triggerEvents){
                    that.triggerEvent('onSelect', active);
                    that.triggerEvent('onChange', active);
                }
            }else if(options[value]){
                set(options[value], triggerEvents);
            }
        }
        return that;
    };

    that.reset = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(that.params['multiple']){
            that.deselectAll(triggerEvents);
        }else{
            if(optionsLength){
                set(optionsList[0], triggerEvents);
            }
        }
    };

    that.selectAll = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(that.params['multiple']){
            cm.forEach(options, deselectMultiple);
            cm.forEach(options, setMultiple);
            if(triggerEvents){
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.deselectAll = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(that.params['multiple']){
            cm.forEach(options, deselectMultiple);
            if(triggerEvents){
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.addOption = function(value, text){
        if(cm.isArray(arguments[0])){
            renderOption(arguments[0]);
        }else{
            renderOption({
                'value' : value,
                'text' : text
            });
        }
        // Enable / Disable Menu
        if(!that.params['multiple'] && !that.disabled && optionsLength){
            components['menu'].enable();
        }
        return that;
    };

    that.addOptions = function(arr){
        cm.forEach(arr, function(item){
            renderOption(item);
        });
        return that;
    };

    that.editOption = function(value, text){
        if(typeof value != 'undefined' && options[value]){
            editOption(options[value], text);
        }
        return that;
    };

    that.removeOption = function(value){
        if(typeof value != 'undefined' && options[value]){
            removeOption(options[value]);
        }
        // Enable / Disable Menu
        if(!that.params['multiple'] && !optionsList){
            components['menu'].disable();
        }
        return that;
    };

    that.removeOptionsAll = function(){
        cm.forEach(options, function(item){
            removeOption(item);
        });
        return that;
    };

    that.getOption = function(value){
        if(typeof value != 'undefined' && options[value]){
            return options[value];
        }
        return null;
    };

    that.getOptions = function(arr){
        var optionsArr = [];
        cm.forEach(arr, function(item){
            if(options[item]){
                optionsArr.push(options[item]);
            }
        });
        return optionsArr;
    };

    that.getOptionsAll = that.getAllOptions = function(){
        var result = [];
        cm.forEach(optionsList, function(item){
            result.push({
                'text' : item['text'],
                'value' : item['value']
            });
        });
        return result;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        cm.addClass(nodes['scroll'], 'disabled');
        if(!that.params['multiple']){
            nodes['text'].disabled = true;
            components['menu'].disable();
        }
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(nodes['container'], 'disabled');
        cm.removeClass(nodes['scroll'], 'disabled');
        if(!that.params['multiple']){
            nodes['text'].disabled = false;
            if(optionsLength){
                components['menu'].enable();
            }
        }
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('select', {
    'node' : cm.node('select'),
    'constructor' : 'Com.Select'
});
cm.define('Com.Slider', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onChangeStart',
        'onChange',
        'onPause',
        'onStart',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'customEvents' : true,
        'isEditing' : false,
        'time' : 500,                   // Fade time
        'delay' : 4000,                 // Delay before slide will be changed
        'slideshow' : true,             // Turn on / off slideshow
        'direction' : 'forward',        // Slideshow direction: forward | backward | random
        'pauseOnHover' : true,
        'fadePrevious' : false,         // Fade out previous slide, needed when using transparency slides
        'buttons' : true,               // Display buttons, can hide exists buttons
        'numericButtons' : false,       // Render slide index on button
        'arrows' : true,                // Display arrows, can hide exists arrows
        'effect' : 'fade',              // none | edit | fade | fade-out | push | pull | pull-parallax | pull-overlap
        'transition' : 'smooth',        // smooth | simple | acceleration | inhibition,
        'height' : 'auto',              // auto | max | slide
        'minHeight' : 48,               // Set min-height of slider, work with calculateMaxHeight parameter
        'hasBar' : false,
        'barDirection' : 'horizontal',  // horizontal | vertical
        'Com.Scroll' : {
            'step' : 25,
            'time' : 25
        }
    }
},
function(params){
    var that = this,
        components = {},
        slideshowInterval,
        minHeightDimension;
    
    that.nodes = {
        'container' : cm.Node('div'),
        'inner' : cm.Node('div'),
        'slides' : cm.Node('div'),
        'slidesInner' : cm.Node('ul'),
        'next' : cm.Node('div'),
        'prev' : cm.Node('div'),
        'buttons' : cm.Node('ul'),
        'items' : [],
        'layout-inner' : cm.Node('div'),
        'bar-inner' : cm.Node('div'),
        'bar-items' : []
    };

    that.anim = {};
    that.items = [];
    that.itemsLength = 0;

    that.effect = null;
    that.direction = 'next';
    that.current = null;
    that.previous = null;
    that.paused = false;
    that.pausedOutside = false;
    that.isProcess = false;
    that.isEditing = null;
    that.isDestructed = null;

    var init = function(){
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.enableEditingHandler = that.enableEditing.bind(that);
        that.disableEditingHandler = that.disableEditing.bind(that);
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        renderSlider();
        renderLayout();
        setEvents();
        that.setEffect(that.params['effect']);
        that.addToStack(that.params['node']);
        that.params['isEditing'] && that.enableEditing();
        that.triggerEvent('onRender');
    };

    var getLESSVariables = function(){
        that.params['time'] = cm.getTransitionDurationFromLESS('ComSlider-Duration', that.params['time']);
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.isEditing = cm.hasClass(that.params['node'], 'is-editing');
        that.params['direction'] = {'forward' : 1, 'backward' : 1, 'random' : 1}[that.params['direction']] ? that.params['direction'] : 'forward';
        that.params['effect'] = Com.SliderEffects[that.params['effect']] ? that.params['effect'] : 'fade';
        that.params['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[that.params['transition']] ? that.params['transition'] : 'smooth';
        that.params['height'] = {'auto' : 1, 'max' : 1, 'slide' : 1}[that.params['height']] ? that.params['height'] : 'auto';
        if(that.params['minHeight'] && isNaN(that.params['minHeight'])){
            minHeightDimension = getDimension(that.params['minHeight']);
            that.params['minHeight'] = parseFloat(that.params['minHeight']);
        }
    };

    var renderSlider = function(){
        var transitionRule = cm.getSupportedStyle('transition');
        // Collect items
        cm.forEach(that.nodes['items'], collectItem);
        // Arrows
        if(that.params['arrows']){
            cm.addEvent(that.nodes['next'], 'click', that.next);
            cm.addEvent(that.nodes['prev'], 'click', that.prev);
        }
        if(!that.params['arrows'] || that.itemsLength < 2){
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }
        // Buttons
        if(that.params['buttons']){
            cm.forEach(that.items, renderButton);
        }
        if(!that.params['buttons'] || that.itemsLength < 2){
            that.nodes['buttons'].style.display = 'none';
        }
        // Height Type Parameters
        that.nodes['inner'].style[transitionRule] = [that.params['time'], 'ms'].join('');
        if(/max|slide/.test(that.params['height'])){
            cm.addClass(that.nodes['container'], 'is-adaptive-content');
        }
        // Pause slider when it hovered
        if(that.params['slideshow'] && that.params['pauseOnHover']){
            cm.addEvent(that.nodes['container'], 'mouseover', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    stopSlideshow();
                }
            });
            cm.addEvent(that.nodes['container'], 'mouseout', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    startSlideshow();
                }
            });
        }
        // Init animations
        that.anim['slides'] = new cm.Animation(that.nodes['slides']);
        that.anim['slidesInner'] = new cm.Animation(that.nodes['slidesInner']);
    };

    var setEvents = function(){
        // Resize events
        cm.addEvent(window, 'resize', that.redrawHandler);
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', that.redrawHandler);
            cm.customEvent.add(that.params['node'], 'enableEditable', that.enableEditingHandler);
            cm.customEvent.add(that.params['node'], 'disableEditable', that.disableEditingHandler);
            cm.customEvent.add(that.params['node'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Resize events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(that.params['node'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.params['node'], 'enableEditable', that.enableEditingHandler);
            cm.customEvent.remove(that.params['node'], 'disableEditable', that.disableEditingHandler);
            cm.customEvent.remove(that.params['node'], 'destruct', that.destructHandler);
        }
    };

    var renderLayout = function(){
        if(that.params['hasBar']){
            that.nodes['ComScroll'] = cm.getNodes(that.params['node'])['ComScroll'];
            components['scroll'] = new Com.Scroll(
                cm.merge(that.params['Com.Scroll'], {
                    'nodes' : that.nodes['ComScroll']
                })
            );
        }
    };

    var calculateHeight = function(){
        switch(that.params['height']){
            case 'max' :
                calculateMaxHeight();
                break;

            case 'slide' :
                calculateSlideHeight();
                break;
        }
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.items, function(item){
            height = Math.max(height, cm.getRealHeight(item.nodes['container'], 'offsetRelative'));
            if(item.nodes['inner']){
                height = Math.max(height, cm.getRealHeight(item.nodes['inner'], 'offsetRelative'));
            }
        });
        if(minHeightDimension == '%'){
            height = Math.max(height, (that.nodes['inner'].offsetWidth / 100 * that.params['minHeight']));
        }else{
            height = Math.max(height, that.params['minHeight']);
        }
        if(height != that.nodes['inner'].offsetHeight){
            that.nodes['inner'].style.height = [height, 'px'].join('');
        }
    };

    var calculateSlideHeight = function(){
        var item,
            height = 0;
        if(that.current !== null){
            item = that.items[that.current];
            height = Math.max(height, cm.getRealHeight(item.nodes['container'], 'offsetRelative'));
            if(item.nodes['inner']){
                height = Math.max(height, cm.getRealHeight(item.nodes['inner'], 'offsetRelative'));
            }
        }
        if(minHeightDimension == '%'){
            height = Math.max(height, (that.nodes['inner'].offsetWidth / 100 * that.params['minHeight']));
        }else{
            height = Math.max(height, that.params['minHeight']);
        }
        if(height != that.nodes['inner'].offsetHeight){
            that.nodes['inner'].style.height = [height, 'px'].join('');
        }
    };

    var collectItem = function(item, i){
        // Configuration
        item = {
            'index' : i,
            'nodes' : item
        };
        // Bar
        if(that.params['hasBar']){
            item['bar'] = that.nodes['bar-items'][i];
            item['bar']['title'] = item['bar']['link']? item['bar']['link'].getAttribute('title') || '' : '';
            item['bar']['src'] = item['bar']['link']? item['bar']['link'].getAttribute('href') || '' : '';
        }
        // Process item
        processItem(item);
    };

    var processItem = function(item){
        // Configuration
        item = cm.merge({
            'index' : that.items.length,
            'nodes' : {
                'container' : cm.Node('li'),
                'inner' : null
            }
        }, item);
        // Bar
        if(that.params['hasBar']){
            // Set image on thumb click
            cm.addEvent(item['bar']['link'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                set(item['index']);
            });
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Push to items array
        that.items.push(item);
        that.itemsLength = that.items.length;
    };

    var resetStyles = function(){
        that.nodes['slidesInner'].scrollLeft = 0;
        cm.forEach(that.items, function(item){
            item.nodes['container'].style.display = '';
            item.nodes['container'].style.opacity = '';
            item.nodes['container'].style.left = '';
            item.nodes['container'].style.zIndex = '';
        });
    };

    var renderButton = function(item){
        // Structure
        that.nodes['buttons'].appendChild(
            item['nodes']['button'] = cm.Node('li')
        );
        if(that.params['numericButtons']){
            item['nodes']['button'].innerHTML = item['index'] + 1;
        }
        // Event
        cm.addEvent(item['nodes']['button'], 'click', function(){
            that.direction = 'next';
            set(item['index']);
        });
    };

    var set = function(index){
        if(!that.isProcess){
            that.isProcess = true;
            // Renew slideshow delay
            that.params['slideshow'] && renewSlideshow();
            // Set current active slide
            var current = that.items[index],
                previous = that.items[that.current];
            that.previous = that.current;
            that.current = index;
            // API onChangeStart event
            that.triggerEvent('onChangeStart', {
                'current' : current,
                'previous' : previous
            });
            // Reset active slide
            if(previous){
                if(that.params['buttons']){
                    cm.removeClass(previous['nodes']['button'], 'active');
                }
            }
            // Set active slide
            if(that.params['buttons']){
                cm.addClass(current['nodes']['button'], 'active');
            }
            // Set bar item
            if(that.params['hasBar']){
                setBarItem(current, previous);
            }
            // Transition effect and callback
            Com.SliderEffects[that.effect](that, current, previous, function(){
                that.isProcess = false;
                // API onChange event
                that.triggerEvent('onChange', {
                    'current' : current,
                    'previous' : previous
                });
                // Trigger custom event
                cm.customEvent.trigger(current['nodes']['container'], 'redraw', {
                    'type' : 'child',
                    'self' : false
                });
            });
            // Recalculate slider height dependence of height type
            calculateHeight();
        }
    };

    var setBarItem = function(current, previous){
        var left,
            top;
        // Thumbs classes
        if(previous){
            cm.removeClass(previous['bar']['container'], 'active');
        }
        cm.addClass(current['bar']['container'], 'active');
        // Move bar
        if(that.params['barDirection'] == 'vertical'){
            top = current['bar']['container'].offsetTop - (that.nodes['layout-inner'].offsetHeight / 2) + (current['bar']['container'].offsetHeight / 2);
            components['scroll'].scrollY(top);
        }else{
            left = current['bar']['container'].offsetLeft - (that.nodes['layout-inner'].offsetWidth / 2) + (current['bar']['container'].offsetWidth / 2);
            components['scroll'].scrollX(left);
        }
    };

    /* *** SLIDESHOW *** */

    var startSlideshow = function(){
        if(that.paused && !that.pausedOutside){
            that.paused = false;
            slideshowInterval = setTimeout(function(){
                switch(that.params['direction']){
                    case 'random':
                        set(cm.rand(0, (that.items.length - 1)));
                        break;

                    case 'backward':
                        that.prev();
                        break;

                    case 'forward':
                        that.next();
                        break;
                }
            }, that.params['delay']);
            that.triggerEvent('onStart');
        }
    };

    var stopSlideshow = function(){
        if(!that.paused){
            that.paused = true;
            slideshowInterval && clearTimeout(slideshowInterval);
            that.triggerEvent('onPause');
        }
    };

    var renewSlideshow = function(){
        if(!that.paused && !that.pausedOutside){
            stopSlideshow();
            startSlideshow();
        }
    };

    /* *** HELPERS *** */

    var resizeHandler = function(){
        // Recalculate slider height dependence of height type
        calculateHeight();
    };

    var getDimension = function(value){
        var pure = value.match(/\d+(\D*)/);
        return pure ? pure[1] : '';
    };

    /* ******* MAIN ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.enableEditMode();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.disableEditMode();
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.redraw = function(){
        resizeHandler();
        return that;
    };

    that.set = function(index){
        if(that.items[index]){
            set(index);
        }
        return that;
    };

    that.get = function(index){
        return that.items[index]? that.items[index] : null;
    };

    that.next = function(){
        that.direction = 'next';
        var i = ((that.current + 1) == that.items.length) ? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function(){
        that.direction = 'prev';
        var i = (that.current == 0) ? (that.items.length - 1) : (that.current - 1);
        set(i);
        return that;
    };

    that.pause = function(){
        that.pausedOutside = true;
        stopSlideshow();
        return that;
    };

    that.start = function(){
        that.pausedOutside = false;
        startSlideshow();
        return that;
    };

    that.enableEditMode = function(){
        that.pause();
        cm.addClass(that.nodes['container'], 'is-editable');
        that.setEffect('edit');
    };

    that.disableEditMode = function(){
        that.start();
        cm.removeClass(that.nodes['container'], 'is-editable');
        that.restoreEffect();
    };

    that.setEffect = function(effect){
        // Reset slides styles after previous effect
        cm.removeClass(that.nodes['slides'], ['effect', that.effect].join('-'));
        resetStyles();
        // Set new effect
        that.effect = Com.SliderEffects[effect] ? effect : 'fade';
        cm.addClass(that.nodes['slides'], ['effect', that.effect].join('-'));
        // Reset slide
        if(that.items[0]){
            set(0);
        }
        // Recalculate slider height
        calculateHeight();
        return that;
    };

    that.restoreEffect = function(){
        that.setEffect(that.params['effect']);
        return that;
    };

    init();
});

/* ******* SLIDER EFFECTS ******* */

Com.SliderEffects = {};

/* *** NONE *** */

Com.SliderEffects['none'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        previous['nodes']['container'].style.display = 'none';
        previous['nodes']['container'].style.zIndex = 1;
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
    }
    callback();
};

/* *** DEV *** */

Com.SliderEffects['edit'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        previous['nodes']['container'].style.display = 'none';
        previous['nodes']['container'].style.zIndex = 1;
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.opacity = 1;
        current['nodes']['container'].style.display = 'block';
        current['nodes']['container'].style.left = 0;
    }
    callback();
};

/* *** FADE *** */

Com.SliderEffects['fade'] = function(slider, current, previous, callback){
    var hide = function(item){
        item['nodes']['container'].style.display = 'none';
        cm.setOpacity(item['nodes']['container'], 0);
    };

    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        if(slider.params['fadePrevious']){
            previous['anim'].go({'style' : {'opacity' : 0}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
                hide(previous);
            }});
        }else{
            setTimeout(function(){
                hide(previous);
            }, slider.params['time']);
        }
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        current['anim'].go({'style' : {'opacity' : 1}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** FADE *** */

Com.SliderEffects['fade-out'] = function(slider, current, previous, callback){
    var hide = function(item){
        item['nodes']['container'].style.display = 'none';
        cm.setOpacity(item['nodes']['container'], 0);
    };

    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'opacity' : 0}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            hide(previous);
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        current['anim'].go({'style' : {'opacity' : 1}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PUSH *** */

Com.SliderEffects['push'] = function(slider, current, previous, callback){
    var left = current['nodes']['container'].offsetLeft;
    slider.anim['slidesInner'].go({'style' : {'scrollLeft' : left}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
};

/* *** PULL *** */

Com.SliderEffects['pull'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        var style = slider.direction == 'next' ? '-100%' : '100%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL OVERLAP *** */

Com.SliderEffects['pull-overlap'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        setTimeout(function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }, slider.params['time']);
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL PARALLAX *** */

Com.SliderEffects['pull-parallax'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        var style = slider.direction == 'next' ? '-50%' : '50%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};
cm.define('Com.Sortable', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRender',
        'onRemove',
        'onSort'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'process' : true,
        'Com.Draganddrop' : {
            'draggableContainer' : 'selfParent',
            'direction' : 'vertical',
            'limit' : true,
            'scroll' : false,
            'animateRemove' : false,
            'removeNode' : false
        }
    }
},
function(params){
    var that = this;

    that.components = {};
    that.nodes = {
        'groups' : []
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        // Init drag'n'drop class
        that.components['dd'] = new Com.Draganddrop(that.params['Com.Draganddrop'])
            .addEvent('onRemove', onRemove)
            .addEvent('onDrop', onSort);
        // Process items
        if(that.params['process']){
            cm.forEach(that.nodes['groups'], process);
        }
        // Trigger render event
        that.triggerEvent('onRender');
    };

    var onRemove = function(dd, widget){
        that.triggerEvent('onRemove', widget);
    };

    var onSort = function(dd, widget){
        that.triggerEvent('onSort', widget);
    };

    var process = function(group){
        if(group['container']){
            // Register group node
            that.addGroup(group['container']);
            // Register group's items
            if(group['items']){
                cm.forEach(group['items'], function(item){
                    processItem(item, group);
                });
            }
        }
    };

    var processItem = function(item, group){
        // Register item
        that.addItem(item['container'], group['container']);
        // Register sub groups
        if(item['groups']){
            cm.forEach(item['groups'], process);
        }
    };

    /* ******* MAIN ******* */

    that.addGroup = function(group){
        that.components['dd'].registerArea(group);
        return that;
    };

    that.removeGroup = function(group){
        that.components['dd'].removeArea(group);
        return that;
    };

    that.addItem = function(item, group){
        var nodes = cm.getNodes(item);
        if(nodes['items'][0]['drag']){
            nodes['items'][0]['drag'].setAttribute('data-com-draganddrop', 'drag');
        }
        that.components['dd'].registerDraggable(item, group);
        return that;
    };

    that.removeItem = function(item){
        that.components['dd'].removeDraggable(item);
        return that;
    };

    init();
});
cm.define('Com.Spacer', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'required' : [
        'Com.Draggable'
    ],
    'events' : [
        'onRender',
        'onChange',
        'onResize',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'height' : 0,
        'minHeight' : 0,
        'isEditing' : true,
        'customEvents' : true,
        'Com.Draggable' : {
            'direction' : 'vertical'
        }
    }
},
function(params){
    var that = this;

    that.isEditing = null;
    that.components = {};
    that.nodes = {};
    that.value = 0;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        set(parseFloat(that.params['height']), false);
        that.params['isEditing'] && that.enableEditing();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.params['Com.Draggable']['minY'] = that.params['minHeight'];
    };

    var render = function(){
        // Chassis Structure
        that.nodes['dragContainer'] = cm.Node('div', {'class' : 'com__spacer__chassis'},
            that.nodes['drag'] = cm.Node('div', {'class' : 'pt__drag is-vertical'},
                cm.Node('div', {'class' : 'line'}),
                cm.Node('div', {'class' : 'drag'},
                    cm.Node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Ruler Structure
        that.nodes['rulerContainer'] = cm.Node('div', {'class' : 'com__spacer__ruler'},
            that.nodes['ruler'] = cm.Node('div', {'class' : 'pt__ruler is-vertical is-small'},
                cm.Node('div', {'class' : 'line line-top'}),
                that.nodes['rulerCounter'] = cm.Node('div', {'class' : 'counter'}),
                cm.Node('div', {'class' : 'line line-bottom'})
            )
        );
        // Embed
        that.params['node'].appendChild(that.nodes['dragContainer']);
        that.params['node'].appendChild(that.nodes['rulerContainer']);
        // Add window event
        cm.addEvent(window, 'resize', function(){
            that.redraw();
        });
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(that.params['node'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(that.params['node'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
    };

    var setLogic = function(){
        that.components['draggable'] = new Com.Draggable(
            cm.merge(that.params['Com.Draggable'], {
                'node': that.nodes['dragContainer'],
                'events' : {
                    'onStart' : start,
                    'onSelect' : function(my, data){
                        that.value = data['top'];
                        move();
                    },
                    'onStop' : stop
                }
            })
        );
    };

    var start = function(){
        cm.addClass(document.body, 'pt__drag__body--vertical');
        cm.addClass(that.params['node'], 'is-active');
        cm.addClass(that.nodes['drag'], 'is-active');
        cm.addClass(that.nodes['ruler'], 'is-active');
    };

    var move = function(){
        that.params['node'].style.height = [that.value, 'px'].join('');
        setRulerCounter();
        that.triggerEvent('onChange', {
            'height' : that.value
        });
    };

    var stop = function(){
        cm.removeClass(document.body, 'pt__drag__body--vertical');
        cm.removeClass(that.params['node'], 'is-active');
        cm.removeClass(that.nodes['drag'], 'is-active');
        cm.removeClass(that.nodes['ruler'], 'is-active');
        that.triggerEvent('onResize', {
            'height' : that.value
        });
    };

    var set = function(height, triggerEvents){
        that.value = Math.max(height, that.params['minHeight']);
        setHeight();
        setRulerCounter();
        if(triggerEvents){
            that.triggerEvent('onChange', {
                'height' : that.value
            });
            that.triggerEvent('onResize', {
                'height' : that.value
            });
        }
    };

    var setRulerCounter = function(){
        that.nodes['rulerCounter'].innerHTML = [that.value, ' px'].join('');
    };

    var setHeight = function(){
        that.params['node'].style.height = [that.value, 'px'].join('');
        that.nodes['dragContainer'].style.top = [that.params['node'].offsetHeight, 'px'].join('');
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.redraw();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.redraw = function(){
        setHeight();
        return that;
    };

    that.set = function(height, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(!isNaN(height)){
            set(height, triggerEvents);
        }
        return that;
    };

    that.get = function(){
        return that.value;
    };

    init();
});
/* ******* COMPONENTS: TABSET ******* */

Com.Elements['Tabset'] = {};

Com['GetTabset'] = function(id){
    return Com.Elements.Tabset[id] || null;
};

cm.define('Com.Tabset', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide'
    ],
    'params' : {
        'node' : cm.Node('div'),        // Tabs contained node
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'toggleOnHashChange' : true,
        'renderOnInit' : true,
        'active' : null,
        'className' : '',
        'tabsPosition' : 'top',         // top | right | bottom | left
        'tabsFlexible' : false,
        'tabsWidth' : 256,              // Only for tabsPosition left or right
        'showTabs' : true,
        'showTabsTitle' : true,         // Show title tooltip
        'switchManually' : false,       // Change tab manually, not implemented yet
        'animateSwitch' : true,
        'animateDuration' : 300,
        'calculateMaxHeight' : false,
        'tabs' : [],
        'icons' : {
            'menu' : 'icon default linked'
        }
    }
},
function(params){
    var that = this,
        hashInterval,
        resizeInterval;
    
    that.nodes = {
        'tabs' : []
    };
    that.anim = {};
    that.tabs = {};
    that.tabsListing = [];
    that.active = false;
    that.previous = false;
    that.isProcess = false;
    
    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        validateParams();
        // Render tabset view
        renderView();
        // Render active tab
        that.params['renderOnInit'] && render();
    };

    var getLESSVariables = function(){
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComTabset-Duration', that.params['animateDuration']);
        that.params['tabsWidth'] = cm.getLESSVariable('ComTabset-Column-Width', that.params['tabsWidth'], true);
    };

    var validateParams = function(){
        if(!cm.inArray(['top', 'right', 'bottom', 'left'], that.params['tabsPosition'])){
            that.params['tabsPosition'] = 'top';
        }
        if(typeof that.params['tabsWidth'] == 'number'){
            that.params['tabsWidth'] = [that.params['tabsWidth'], 'px'].join('');
        }
    };

    var render = function(){
        var id = that.params['active'];
        if(that.params['toggleOnHashChange']){
            // Init hash change handler
            initHashChange();
            // Set first active tab
            if(id && that.tabs[id]){
                set(id);
            }else{
                hashHandler();
            }
        }else{
            if(id = getValidID(id)){
                set(id);
            }
        }
    };

    var renderView = function(){
        /* *** STRUCTURE *** */
        that.nodes['container'] = cm.Node('div', {'class' : 'com__tabset'},
            that.nodes['content'] = cm.Node('div', {'class' : 'com__tabset__content'},
                that.nodes['contentUL'] = cm.Node('ul')
            )
        );
        that.nodes['headerTitle'] = cm.Node('div', {'class' : 'com__tabset__head-title'},
            that.nodes['headerTitleText'] = cm.Node('div', {'class' : 'com__tabset__head-text'}),
            cm.Node('div', {'class' : 'com__tabset__head-menu pt__menu'},
                cm.Node('div', {'class' : that.params['icons']['menu']}),
                that.nodes['headerMenuUL'] = cm.Node('ul', {'class' : 'pt__menu-dropdown'})
            )
        );
        that.nodes['headerTabs'] = cm.Node('div', {'class' : 'com__tabset__head-tabs'},
            that.nodes['headerUL'] = cm.Node('ul')
        );
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['content'], 'is-animated');
        }
        // Set Tabs Width
        if(/left|right/.test(that.params['tabsPosition'])){
            that.nodes['headerTabs'].style.width = that.params['tabsWidth'];
            that.nodes['content'].style.width = ['calc(100% - ', that.params['tabsWidth'], ')'].join('');
        }
        // Embed Tabs
        if(that.params['showTabs']){
            cm.insertBefore(that.nodes['headerTitle'], that.nodes['content']);
            if(/bottom|right/.test(that.params['tabsPosition'])){
                cm.insertAfter(that.nodes['headerTabs'], that.nodes['content']);
            }else{
                cm.insertBefore(that.nodes['headerTabs'], that.nodes['content']);
            }
        }
        // Init Animation
        that.anim['contentUL'] = new cm.Animation(that.nodes['contentUL']);
        /* *** RENDER TABS *** */
        cm.forEach(that.nodes['tabs'], function(item){
            renderTab(
                cm.merge({'content' : item['container']}, that.getNodeDataConfig(item['container']))
            );
        });
        cm.forEach(that.params['tabs'], function(item){
            renderTab(item);
        });
        /* *** ATTRIBUTES *** */
        // CSS
        cm.addClass(that.nodes['container'], ['is-tabs', that.params['tabsPosition']].join('-'));
        if(that.params['tabsFlexible']){
            cm.addClass(that.nodes['container'], 'is-tabs-flexible');
        }
        if(!cm.isEmpty(that.params['className'])){
            cm.addClass(that.nodes['container'], that.params['className']);
        }
        // ID
        if(that.params['node'].id){
            that.nodes['container'].id = that.params['node'].id;
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(that.nodes['container']);
        /* *** EVENTS *** */
        Part.Menu && Part.Menu();
        cm.addEvent(window, 'resize', resizeHandler);
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var renderTab = function(item){
        // Check for exists
        if(that.tabs[item['id']]){
            removeTab(that.tabs[item['id']]);
        }
        // Config
        item = cm.merge({
            'id' : '',
            'title' : '',
            'content' : cm.Node('li'),
            'image' : null,
            'isHide' : true,
            'constructor' : false,
            'constructorParams' : {},
            'onShowStart' : function(that, tab){},
            'onShow' : function(that, tab){},
            'onHideStart' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        if(!cm.isEmpty(item['image']) && !cm.isNode(item['image'])){
            item['image'] = cm.strReplace(item['image'], {
                '%baseUrl%' : cm._baseUrl
            });
        }
        // Structure
        item['tab'] = renderTabLink(item, true);
        item['menu'] = renderTabLink(item, false);
        // Remove active tab class if exists
        cm.removeClass(item['content'], 'active');
        // Append tab
        that.nodes['headerUL'].appendChild(item['tab']['container']);
        that.nodes['headerMenuUL'].appendChild(item['menu']['container']);
        that.nodes['contentUL'].appendChild(item['content']);
        // Push
        that.tabsListing.push(item);
        that.tabs[item['id']] = item;
    };

    var renderTabLink = function(tab, image){
        var item = {};
        // Structure
        item['container'] = cm.Node('li',
            item['a'] = cm.Node('a',
                cm.node('div', {'class' : 'title'}, tab['title'])
            )
        );
        // Image
        if(image){
            if(cm.isNode(tab['image'])){
                item['image'] = tab['image'];
            }else if(!cm.isEmpty(tab['image'])){
                item['image'] = cm.node('div', {'class' : 'image'},
                    cm.node('img', {'src' : tab['image'], 'alt' : ''})
                );
            }
            if(item['image']){
                cm.insertFirst(item['image'], item['a']);
            }
            if(that.params['showTabsTitle']){
                item['a'].setAttribute('title', tab['title']);
            }
        }
        // Add click event
        if(that.params['toggleOnHashChange']){
            cm.addEvent(item['a'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                if(that.active != tab['id']){
                    window.location.href = [window.location.href.split('#')[0], tab['id']].join('#');
                }
            });
        }else{
            cm.addEvent(item['a'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                set(tab['id']);
            });
        }
        return item;
    };

    var removeTab = function(item){
        // Set new active tab, if current active is nominated for remove
        if(item['id'] === that.active && that.tabsListing[0]){
            set(that.tabsListing[0]);
        }
        // Remove tab from list and array
        cm.remove(item['tab']['container']);
        cm.remove(item['menu']['container']);
        cm.remove(item['content']);
        that.tabsListing = that.tabsListing.filter(function(tab){
            return item['id'] != tab['id'];
        });
        delete that.tabs[item['id']];
    };

    var set = function(id){
        var item, previous;
        if(!that.isProcess && id != that.active){
            that.isProcess = true;
            // Hide Previous Tab
            if(that.active && that.tabs[that.active]){
                that.previous = that.active;
                previous = that.tabs[that.previous];
                previous['isHide'] = true;
                // Hide Start Event
                previous['onHideStart'](that, previous);
                that.triggerEvent('onTabHideStart', previous);
                // Controller
                if(previous['controllerObject']){
                    previous['controllerObject'].suspend();
                }
                // Hide
                cm.removeClass(previous['tab']['container'], 'active');
                cm.removeClass(previous['menu']['container'], 'active');
                cm.removeClass(previous['content'], 'active');
                // Hide End Event
                previous['onHide'](that, previous);
                that.triggerEvent('onTabHide', previous);
            }
            // Show New Tab
            that.active = id;
            item = that.tabs[that.active];
            item['isHide'] = false;
            // Show Start Event
            item['onShowStart'](that, item);
            that.triggerEvent('onTabShowStart', item);
            // Controller
            if(item['constructor']){
                if(item['controller']){
                    item['controller'].refresh && item['controller'].refresh();
                }else{
                    cm.getConstructor(item['constructor'], function(classConstructor){
                        item['controller'] = new classConstructor(
                            cm.merge(item['controllerParams'], {
                                'container' : item['content']
                            })
                        );
                    });
                }
            }
            // Show
            item['content'].style.display = 'block';
            cm.addClass(item['tab']['container'], 'active');
            cm.addClass(item['menu']['container'], 'active');
            cm.addClass(item['content'], 'active', true);
            that.nodes['headerTitleText'].innerHTML = item['title'];
            // Animate
            if(!that.params['switchManually']){
                if(that.previous && that.params['animateSwitch'] && !that.params['calculateMaxHeight']){
                    animateSwitch();
                }else{
                    if(that.params['calculateMaxHeight']){
                        calculateMaxHeight();
                    }
                    if(that.previous){
                        that.tabs[that.previous]['content'].style.display = 'none';
                    }
                    switchTab();
                }
            }
        }
    };

    var switchTab = function(){
        // Show End Event
        that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
        that.triggerEvent('onTabShow', that.tabs[that.active]);
        that.isProcess = false;
        // Trigger custom event
        cm.customEvent.trigger(that.tabs[that.active]['content'], 'redraw', {
            'type' : 'child',
            'self' : false
        });
    };

    /* *** HELPERS *** */

    var animateSwitch = function(){
        var previousHeight = 0,
            currentHeight = 0;
        // Get height
        if(that.previous){
            previousHeight = cm.getRealHeight(that.tabs[that.previous]['content'], 'offsetRelative');
        }
        if(that.active){
            currentHeight = cm.getRealHeight(that.tabs[that.active]['content'], 'offsetRelative');
        }
        // Animate
        that.nodes['contentUL'].style.overflow = 'hidden';
        that.nodes['contentUL'].style.height = [previousHeight, 'px'].join('');
        that.anim['contentUL'].go({'style' : {'height' : [currentHeight, 'px'].join('')}, 'duration' : that.params['animateDuration'], 'anim' : 'smooth', 'onStop' : function(){
            if(that.previous){
                that.tabs[that.previous]['content'].style.display = 'none';
            }
            that.nodes['contentUL'].style.overflow = 'visible';
            that.nodes['contentUL'].style.height = 'auto';
            switchTab();
        }});
    };

    var initHashChange = function(){
        var hash;
        if("onhashchange" in window && !cm.is('IE7')){
            cm.addEvent(window, 'hashchange', hashHandler);
        }else{
            hash = window.location.hash;
            hashInterval = setInterval(function(){
                if(hash != window.location.hash){
                    hash = window.location.hash;
                    hashHandler();
                }
            }, 25);
        }
    };

    var hashHandler = function(){
        var id = window.location.hash.replace('#', '');
        if(id = getValidID(id)){
            set(id);
        }
    };

    var getValidID = function(id){
        if(cm.isEmpty(that.tabsListing) || cm.isEmpty(that.tabs)){
            return null;
        }
        return id && that.tabs[id]? id : that.tabsListing[0]['id'];
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.tabs, function(item){
            height = Math.max(height, cm.getRealHeight(item['content'], 'offsetRelative'));
        });
        if(height != that.nodes['contentUL'].offsetHeight){
            that.nodes['contentUL'].style.minHeight = [height, 'px'].join('');
            cm.forEach(that.tabs, function(item){
                item['content'].style.minHeight = [height, 'px'].join('');
            });
        }
    };

    var resizeHandler = function(){
        // Recalculate slider height
        if(that.params['calculateMaxHeight']){
            calculateMaxHeight();
        }
    };
    
    /* ******* MAIN ******* */

    that.render = function(){
        render();
        return that;
    };
    
    that.destruct = function(){
        that.remove();
        that.removeFromStack();
    };

    that.set = function(id){
        if(id && that.tabs[id]){
            set(id);
        }
        return that;
    };

    that.setByIndex = function(index){
        var item;
        if(item = that.tabsListing[index]){
            set(item['id']);
        }
        return that;
    };

    that.get = function(id){
        if(id && that.tabs[id]){
            return that.tabs[id];
        }
        return null;
    };

    that.getTabs = function(){
        return that.tabs;
    };

    that.getActiveTab = function(){
        return that.tabs[that.active];
    };

    that.addTab = function(item){
        if(item && item['id']){
            renderTab(item);
        }
        return that;
    };

    that.addTabs = function(o){
        if(cm.isArray(o) || cm.isObject(o)){
            cm.forEach(o, that.addTab);
        }
        return that;
    };

    that.removeTab = function(id){
        if(id && that.tabs[id]){
            removeTab(that.tabs[id]);
        }
        return that;
    };

    that.setEvents = function(o){
        if(o){
            that.tabs = cm.merge(that.tabs, o);
        }
        return that;
    };

    that.remove = function(){
        cm.removeEvent(window, 'hashchange', hashHandler);
        cm.removeEvent(window, 'resize', resizeHandler);
        hashInterval && clearInterval(hashInterval);
        resizeInterval && clearInterval(resizeInterval);
        cm.remove(that.nodes['container']);
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});

/* ******* COMPONENTS: TABSET: MODULE TAB CONTROLLER ******* */

Mod['TabController'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        that._isConstructed = false;
        that._isDestructed = false;
        that._isPaused = false;
    },
    'construct' : function(){
        var that = this;
        that._isConstructed = true;
        that._isDestructed = false;
        that._isPaused = false;
        return that;
    },
    'destruct' : function(){
        var that = this;
        if(that._isConstructed && !that._isDestructed){
            that._isConstructed = false;
            that._isDestructed = true;
            cm.customEvent.trigger(that.params['node'], 'destruct', {
                'type' : 'child',
                'self' : false
            });
            that.removeFromStack && that.removeFromStack();
            cm.remove(that.params['node']);
        }
        return that;
    },
    'refresh' : function(){
        var that = this;
        that._isPaused = false;
        return that;
    },
    'pause' : function(){
        var that = this;
        if(!that._isPaused){
            that._isPaused = true;
        }
        return that;
    }
};
cm.define('Com.TabsetHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Callbacks',
        'DataNodes',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide',
        'onLabelTarget',
        'onRequestStart',
        'onRequestEnd',
        'onRequestError',
        'onRequestSuccess',
        'onRequestAbort',
        'onContentRenderStart',
        'onContentRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'active' : null,
        'items' : [],
        'targetEvent' : 'click',                                    // click | hover
        'setFirstTabImmediately' : true,
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',                     // in ms
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'cache' : false,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %tab%, %callback% for JSONP.
            'params' : ''                                           // Params object. %tab%, %baseUrl%, %callback% for JSONP.
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.components = {};
    that.nodes = {
        'container': cm.Node('div'),
        'labels' : [],
        'tabs' : []
    };

    that.ajaxHandler = null;
    that.isAjax = false;
    that.isProcess = false;
    that.loaderDelay = null;
    that.targetEvent = null;

    that.current = false;
    that.previous = false;
    that.items = {};
    that.itemsList = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
        // Set active tab
        if(that.params['active'] && that.items[that.params['active']]){
            set(that.params['active']);
        }
    };

    var validateParams = function(){
        // Ajax
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
        // Target Event
        switch(that.params['targetEvent']){
            case 'hover':
                that.targetEvent = 'mouseover';
                break;
            case 'click':
            default:
                that.targetEvent = 'click';
                break;
        }
    };

    var render = function(){
        // Process tabs
        that.processTabs(that.nodes['tabs'], that.nodes['labels']);
        // Process tabs in parameters
        cm.forEach(that.params['items'], function(item){
            renderTab(item);
        });
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor){
            that.components['loader'] = new classConstructor(that.params['Com.Overlay']);
        });
    };

    var renderTab = function(item){
        item = cm.merge({
            'id' : '',
            'title' : '',
            'tab' : {
                'container' : cm.node('li'),
                'inner' : cm.node('div')
            },
            'label' : {
                'container' : cm.node('li'),
                'link' : cm.node('a')
            },
            'isHidden' : false,
            'isShow' : false,
            'isAjax' : false,
            'isCached' : false,
            'ajax' : {}
        }, item);
        if(!cm.isEmpty(item['ajax']['url'])){
            item.isAjax = true;
        }
        if(!cm.isEmpty(item['id']) && !that.items[item['id']]){
            that.itemsList.push(item);
            that.items[item['id']] = item;
            if(item.isHidden){
                cm.addClass(item['label']['container'], 'hidden');
                cm.addClass(item['tab']['container'], 'hidden');
            }
            cm.addEvent(item['label']['container'], that.targetEvent, function(){
                that.triggerEvent('onLabelTarget', {
                    'item' : item
                });
                set(item['id']);
            });
        }
    };

    var set = function(id){
        var item;
        if(that.current != id){
            that.triggerEvent('onTabShowStart', {
                'item' : that.items[id]
            });
            // Hide previous tab
            unset();
            // Show new tab
            that.current = id;
            item = that.items[that.current];
            item.isShow = true;
            if(!that.previous && that.params['setFirstTabImmediately']){
                cm.addClass(item['tab']['container'], 'is-immediately');
                cm.addClass(item['label']['container'], 'is-immediately');
                setTimeout(function(){
                    cm.removeClass(item['tab']['container'], 'is-immediately');
                    cm.removeClass(item['label']['container'], 'is-immediately');
                }, 5);
            }
            cm.addClass(item['tab']['container'], 'active');
            cm.addClass(item['label']['container'], 'active');
            if(item.isAjax && (!that.params['cache'] || (that.params['cache'] && !item.isCached))){
                that.ajaxHandler = that.callbacks.request(that, item, cm.merge(that.params['ajax'], item['ajax']));
            }else{
                that.triggerEvent('onTabShow', {
                    'item' : item
                });
            }
        }
    };

    var unset = function(){
        var item;
        if(that.current && that.items[that.current]){
            item = that.items[that.current];
            if(that.isProcess){
                that.abort();
            }
            that.previous = that.current;
            item.isShow = false;
            that.triggerEvent('onTabHideStart', {
                'item' : item
            });
            cm.removeClass(item['tab']['container'], 'active');
            cm.removeClass(item['label']['container'], 'active');
            that.triggerEvent('onTabHide', {
                'item' : item
            });
            that.current = null;
        }
    };

    var unsetHead = function(){
        var item;
        if(that.current && that.items[that.current]){
            item = that.items[that.current];
            cm.removeClass(item['label']['container'], 'active');
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, item, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%tab%' : item['id'],
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%tab%' : item['id'],
            '%baseUrl%' : cm._baseUrl
        });
        return config;
    };

    that.callbacks.request = function(that, item, config){
        config = that.callbacks.prepare(that, item, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that, item, config);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, item, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, item, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, item, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that, item,  config);
                }
            })
        );
    };

    that.callbacks.start = function(that, item, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader']
                        .embed(item['tab']['container'])
                        .open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onRequestStart', {
            'item' : item
        });
    };

    that.callbacks.end = function(that, item, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onRequestEnd', {
            'item' : item
        });
    };

    that.callbacks.filter = function(that, item, config, response){
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, item, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, item, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, item, response);
        }else{
            that.callbacks.error(that, item, config);
        }
    };

    that.callbacks.error = function(that, item, config){
        that.callbacks.renderError(that, item, config);
        that.triggerEvent('onRequestError', {
            'item' : item
        });
    };

    that.callbacks.success = function(that, item, response){
        that.callbacks.render(that, item, response);
        that.triggerEvent('onRequestSuccess', {
            'tab' : item,
            'response' : response
        });
    };

    that.callbacks.abort = function(that, item, config){
        that.triggerEvent('onRequestAbort', {
            'item' : item
        });
    };

    /* *** RENDER *** */

    that.callbacks.render = function(that, item, data){
        item['data'] = data;
        item.isCached = true;
        // Render
        that.triggerEvent('onContentRenderStart', {
            'item' : item,
            'data' : data
        });
        that.callbacks.renderContent(that, item, data);
        that.triggerEvent('onContentRender', {
            'item' : item,
            'data' : data
        });
        that.triggerEvent('onTabShow', {
            'item' : item,
            'data' : data
        });
    };

    that.callbacks.renderContent = function(that, item, data){
        var nodes;
        if(that.params['responseHTML']){
            cm.clearNode(item['tab']['inner']);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    item['tab']['inner'].appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            item['tab']['inner'].appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
        }
    };

    that.callbacks.renderError = function(that, item, config){
        if(that.params['responseHTML']){
            cm.clearNode(item['tab']['inner']);
            item['tab']['inner'].appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
        }
    };

    /* ******* PUBLIC ******* */

    that.set = function(id){
        if(id && that.items[id]){
            set(id);
        }
        return that;
    };

    that.setByIndex = function(index){
        var item;
        if(item = that.itemsList[index]){
            set(item['id']);
        }
        return that;
    };

    that.unset = function(){
        unset();
        that.previous = null;
        return that;
    };

    that.unsetHead = function(){
        unsetHead();
        return that;

    };

    that.get = function(){
        return that.current;
    };

    that.addTab = function(item){
        renderTab(item);
        return that;
    };

    that.addTabs = function(items){
        cm.forEach(items, function(item){
            renderTab(item);
        });
        return that;
    };

    that.processTabs = function(tabs, labels){
        var items = [],
            label,
            config,
            item;
        cm.forEach(tabs, function(tab, key){
            label = labels[key];
            config = cm.merge(that.getNodeDataConfig(tab['container']), that.getNodeDataConfig(label['container']));
            item = cm.merge(config, {
                'tab' : tab,
                'label' : label
            });
            items.push(item);
        });
        that.addTabs(items);
        return that;
    };

    that.getTab = function(id){
        if(id && that.items[id]){
            return that.items[id];
        }
        return null;
    };

    that.getTabs = function(){
        return that.items;
    };

    that.getCurrentTab = function(){
        return that.items[that.current];
    };

    that.isTabEmpty = function(id){
        var item = that.getTab(id);
        return !(item && item['tab']['inner'].childNodes.length);
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});
cm.define('Com.TagsInput', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'require' : [
        'Com.Autocomplete'
    ],
    'events' : [
        'onRender',
        'onAdd',
        'onRemove',
        'onChange',
        'onOpen',
        'onClose'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'data' : [],
        'maxSingleTagLength': 255,
        'autocomplete' : false,
        'icons' : {
            'add' : 'icon default linked',
            'remove' : 'icon default linked'
        },
        'langs' : {
            'tags' : 'Tags',
            'add' : 'Add',
            'remove' : 'Remove'
        },
        'Com.Autocomplete' : {
            'clearOnEmpty' : false
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        tags = [],
        items = {},
        isOpen = false;

    that.isDestructed = null;
    that.value = null;
    that.components = {};
    that.isAutocomplete = false;

    var init = function(){
        var sourceTags;
        preValidateParams();
        // Init modules
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        // Render
        validateParams();
        render();
        setLogic();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
        // Set tags
        sourceTags = that.params['data'].concat(
            that.params['node'].value.split(',')
        );
        cm.forEach(sourceTags, function(tag){
            addTag(tag);
        });
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.isAutocomplete = that.params['autocomplete'];
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__tags-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render add button
        renderAddButton();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(nodes['container']);

    };

    var setLogic = function(){
        // Autocomplete
        cm.getConstructor('Com.Autocomplete', function(classConstructor){
            that.components['autocomplete'] = new classConstructor(
                cm.merge(that.params['Com.Autocomplete'], {
                    'events' : {
                        'onClickSelect' : function(){
                            addAdderTags(true);
                        }
                    }
                })
            );
        });
    };

    var renderAddButton = function(){
        nodes['inner'].appendChild(
            nodes['addButtonContainer'] = cm.Node('div', {'class' : 'item'},
                nodes['addButton'] = cm.Node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
            )
        );
        // Add event on "Add Tag" button
        cm.addEvent(nodes['addButton'], 'click', openAdder);
    };

    var openAdder = function(){
        var item = {};
        if(!isOpen){
            isOpen = true;
            // Structure
            item['container'] = cm.Node('div', {'class' : 'item adder'},
                item['input'] = cm.Node('input', {'type' : 'text', 'maxlength' : that.params['maxSingleTagLength'], 'class' : 'input'})
            );
            cm.insertBefore(item['container'], nodes['addButtonContainer']);
            // Show
            item['anim'] = new cm.Animation(item['container']);
            item['anim'].go({'style' : {'width' : [cm.getRealWidth(item['container']), 'px'].join(''), 'opacity' : 1}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
                item['container'].style.overflow = 'visible';
                item['input'].focus();
                // API onOpen Event
                that.triggerEvent('onOpen');
            }});
            // Bind autocomplete
            if(that.isAutocomplete){
                that.components['autocomplete'].setTarget(item['input']);
                that.components['autocomplete'].setInput(item['input']);
            }
            // Set new tag on enter or on comma
            cm.addEvent(item['input'], 'keypress', function(e){
                e = cm.getEvent(e);
                if(e.keyCode == 13 || e.charCode == 44){
                    cm.preventDefault(e);
                    addAdderTags(true);
                    that.isAutocomplete && that.components['autocomplete'].hide();
                }
                if(e.keyCode == 27){
                    cm.preventDefault(e);
                    addAdderTags(true);
                    closeAdder(nodes['adder']);
                }
            });
            // Hide adder on document click
            cm.addEvent(document, 'mousedown', bodyEvent);
            // Add to nodes array
            nodes['adder'] = item;
        }else{
            addAdderTags(true);
        }
    };

    var closeAdder = function(item){
        cm.removeEvent(document, 'mousedown', bodyEvent);
        nodes['adder']['input'].blur();
        that.isAutocomplete && that.components['autocomplete'].hide();
        item['container'].style.overflow = 'hidden';
        item['anim'].go({'style' : {'width' : '0px', 'opacity' : 0}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
            cm.remove(item['container']);
            nodes['adder'] = null;
            isOpen = false;
            // API onClose Event
            that.triggerEvent('onClose');
        }});
    };

    var addAdderTags = function(execute){
        var sourceTags = nodes['adder']['input'].value.split(',');
        cm.forEach(sourceTags, function(tag){
            addTag(tag, execute);
        });
        nodes['adder']['input'].value = '';
        nodes['adder']['input'].focus();
        that.isAutocomplete && that.components['autocomplete'].clear();
    };

    var addTag = function(tag, execute){
        tag = tag.trim();
        if(tag && tag.length && !/^[\s]*$/.test(tag) && !cm.inArray(tags, tag)){
            tags.push(tag);
            renderTag(tag);
            setHiddenInputData();
            // Execute events
            if(execute){
                // API onChange Event
                that.triggerEvent('onChange', {'tag' : tag});
                // API onAdd Event
                that.triggerEvent('onAdd', {'tag' : tag});
            }
        }
    };

    var renderTag = function(tag){
        var item = {
            'tag' : tag
        };
        // Structure
        item['container'] = cm.Node('div', {'class' : 'item'},
            cm.Node('div', {'class' : 'text', 'title' : tag}, tag),
            item['button'] = cm.Node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove')})
        );
        item['anim'] = new cm.Animation(item['container']);
        // Append
        if(isOpen){
            cm.addClass(item['container'], 'closed');
            cm.insertBefore(item['container'], nodes['adder']['container']);
            // Show
            item['anim'].go({'style' : {'width' : [cm.getRealWidth(item['container']), 'px'].join(''), 'opacity' : 1}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
                cm.removeClass(item['container'], 'closed');
            }});
        }else{
            cm.insertBefore(item['container'], nodes['addButtonContainer']);
        }
        // Add click event on "Remove Tag" button
        cm.addEvent(item['button'], 'click', function(){
            if(isOpen){
                nodes['adder']['input'].focus();
            }
            removeTag(item);
        });
        // Push to global array
        items[tag] = item;
    };

    var removeTag = function(item){
        // Remove tag from data
        tags = tags.filter(function(tag){
            return item['tag'] != tag;
        });
        delete items[item['tag']];
        setHiddenInputData();
        // API onChange Event
        that.triggerEvent('onChange', {
            'tag' : item['tag']
        });
        // API onRemove Event
        that.triggerEvent('onRemove', {
            'tag' : item['tag']
        });
        // Animate
        item['anim'].go({'style' : {'width' : '0px', 'opacity' : 0}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
            cm.remove(item['container']);
            item = null;
        }});
    };

    var setHiddenInputData = function(){
        that.value = tags.join(',');
        nodes['hidden'].value = that.value;
    };

    var bodyEvent = function(e){
        if(isOpen){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(nodes['container'], target, true) && !that.components['autocomplete'].isOwnNode(target)){
                addAdderTags(true);
                closeAdder(nodes['adder']);
            }
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(){
        return that.value || null;
    };

    that.set = function(value){
        that.add(value);
        return that;
    };

    that.add = function(tag /* or tags comma separated or array */){
        var sourceTags;
        if(!tag){
            sourceTags = [];
        }else if(cm.isArray(tag)){
            sourceTags = tag;
        }else{
            sourceTags = tag.split(',');
        }
        cm.forEach(sourceTags, function(tag){
            addTag(tag, true);
        });
        return that;
    };

    that.remove = function(tag){
        var sourceTags;
        if(!tag){
            sourceTags = [];
        }else if(cm.isArray(tag)){
            sourceTags = tag;
        }else{
            sourceTags = tag.split(',');
        }
        cm.forEach(sourceTags, function(tag){
            if(cm.inArray(tags, tag)){
                removeTag(items[tag]);
            }
        });
        return that;
    };

    that.getAutocomplete = function(){
        return that.components['autocomplete'];
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('tags', {
    'node' : cm.node('input', {'type' : 'text'}),
    'constructor' : 'Com.TagsInput'
});
cm.define('Com.TimeSelect', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear'
    ],
    'params' : {
        'input' : null,                                  // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'container' : null,
        'embedStructure' : 'replace',
        'name' : '',
        'renderSelectsInBody' : true,
        'format' : 'cm._config.timeFormat',
        'showTitleTag' : true,
        'title' : false,
        'withHours' : true,
        'hoursInterval' : 0,
        'withMinutes' : true,
        'minutesInterval' : 0,
        'withSeconds' : false,
        'secondsInterval' : 0,
        'selected' : 0,
        'langs' : {
            'separator' : ':',
            'Hours' : 'HH',
            'Minutes' : 'MM',
            'Seconds' : 'SS',
            'HoursTitle' : 'Hours',
            'MinutesTitle' : 'Minutes',
            'SecondsTitle' : 'Seconds'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    that.date = new Date();
    that.value = 0;
    that.previousValue = 0;

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
        that.addToStack(nodes['container']);
        // Set selected time
        if(that.params['selected']){
            that.set(that.params['selected'], that.params['format'], false);
        }else{
            that.set(that.params['node'].value, that.params['format'], false);
        }
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        if(cm.isEmpty(that.params['hoursInterval'])){
            that.params['hoursInterval'] = 1;
        }
        if(cm.isEmpty(that.params['minutesInterval'])){
            that.params['minutesInterval'] = 1;
        }
        if(cm.isEmpty(that.params['secondsInterval'])){
            that.params['secondsInterval'] = 1;
        }
    };

    var render = function(){
        var hours = 0,
            minutes = 0,
            seconds = 0;
        /* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com__timeselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        /* *** ITEMS *** */
        // Hours
        if(that.params['withHours']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectHours'] = cm.Node('select', {'placeholder' : that.lang('Hours'), 'title' : that.lang('HoursTitle')})
            ));
            while(hours < 24){
                nodes['selectHours'].appendChild(
                    cm.Node('option', {'value' : hours},cm.addLeadZero(hours))
                );
                hours += that.params['hoursInterval'];
            }
        }
        // Minutes
        if(that.params['withMinutes']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectMinutes'] = cm.Node('select', {'placeholder' : that.lang('Minutes'), 'title' : that.lang('MinutesTitle')})
            ));
            while(minutes < 60){
                nodes['selectMinutes'].appendChild(
                    cm.Node('option', {'value' : minutes}, cm.addLeadZero(minutes))
                );
                minutes += that.params['minutesInterval'];
            }
        }
        // Seconds
        if(that.params['withSeconds']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectSeconds'] = cm.Node('select', {'placeholder' : that.lang('Seconds'), 'title' : that.lang('SecondsTitle')})
            ));
            while(seconds < 60){
                nodes['selectSeconds'].appendChild(
                    cm.Node('option', {'value' : seconds},cm.addLeadZero(seconds))
                );
                seconds += that.params['secondsInterval'];
            }
        }
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // Name
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var setMiscEvents = function(){
        // Hours select
        if(that.params['withHours']){
            components['selectHours'] = new Com.Select({
                    'select' : nodes['selectHours'],
                    'renderInBody' : that.params['renderSelectsInBody']
                }).addEvent('onChange', function(){
                    set(true);
                });
        }
        // Minutes select
        if(that.params['withMinutes']){
            components['selectMinutes'] = new Com.Select({
                    'select' : nodes['selectMinutes'],
                    'renderInBody' : that.params['renderSelectsInBody']
                }).addEvent('onChange', function(){
                    set(true);
                });
        }
        // Seconds select
        if(that.params['withSeconds']){
            components['selectSeconds'] = new Com.Select({
                    'select' : nodes['selectSeconds'],
                    'renderInBody' : that.params['renderSelectsInBody']
                })
                .addEvent('onChange', function(){
                    set(true);
                });
        }
        // Trigger onRender Event
        that.triggerEvent('onRender');
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        that.params['withHours'] && that.date.setHours(components['selectHours'].get());
        that.params['withMinutes'] && that.date.setMinutes(components['selectMinutes'].get());
        that.params['withSeconds'] && that.date.setSeconds(components['selectSeconds'].get());
        that.value = cm.dateFormat(that.date, that.params['format']);
        nodes['hidden'].value = that.value;
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
    };

    var onChange = function(){
        if(!that.previousValue || (!that.value && that.previousValue) || (that.value != that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.set = function(str, format, triggerEvents){
        format = typeof format != 'undefined'? format : that.params['format'];
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Get time
        if(cm.isEmpty(str) || typeof str == 'string' && new RegExp(cm.dateFormat(false, that.params['format'])).test(str)){
            that.clear();
            return that;
        }else if(typeof str == 'object'){
            that.date = str;
        }else{
            that.date = cm.parseDate(str, format);
        }
        // Set components
        that.params['withHours'] && components['selectHours'].set(that.date.getHours(), false);
        that.params['withMinutes'] && components['selectMinutes'].set(that.date.getMinutes(), false);
        that.params['withSeconds'] && components['selectSeconds'].set(that.date.getSeconds(), false);
        // Set time
        set(triggerEvents);
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.getDate = function(){
        return that.date;
    };

    that.getHours = function(){
        return that.date.getHours();
    };

    that.getMinutes = function(){
        return that.date.getMinutes();
    };

    that.getSeconds = function(){
        return that.date.getSeconds();
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Clear time
        that.date.setHours(0);
        that.date.setMinutes(0);
        that.date.setSeconds(0);
        // Clear components
        that.params['withHours'] && components['selectHours'].set(that.date.getHours(), false);
        that.params['withMinutes'] && components['selectMinutes'].set(that.date.getMinutes(), false);
        that.params['withSeconds'] && components['selectSeconds'].set(that.date.getSeconds(), false);
        // Set time
        set(false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    init();
});
cm.define('Com.Timer', {
    'modules' : [
        'Params',
        'Events'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onTick',
        'onEnd'
    ],
    'params' : {
        'count' : 0                 // ms
    }
},
function(params){
    var that = this;

    that.left = 0;
    that.pass = 0;

    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        render();
        that.triggerEvent('onRender');
    };

    var render = function(){
        that.left = that.params['count'];
        that.start();
    };

    var getLeftTime = function(){
        var o = {};
        o['d_total'] = Math.floor(that.left / 1000 / 60 / 60 / 24);
        o['h_total'] = Math.floor(that.left / 1000 / 60 / 60);
        o['m_total'] = Math.floor(that.left / 1000 / 60);
        o['s_total'] = Math.floor(that.left / 1000);
        o['d'] = Math.floor(o['d_total']);
        o['h'] = Math.floor(o['h_total'] - (o['d'] * 24));
        o['m'] = Math.floor(o['m_total'] - (o['d'] * 24 * 60) - (o['h'] * 60));
        o['s'] = Math.floor(o['s_total'] - (o['d'] * 24 * 60 * 60) - (o['h'] * 60 * 60) - (o['m'] * 60));
        return o;
    };

    /* ******* PUBLIC ******* */

    that.start = function(){
        var o = getLeftTime(),
            left = that.left,
            startTime = Date.now(),
            currentTime;
        that.isProcess = true;
        that.triggerEvent('onStart', o);
        // Process
        (function process(){
            if(that.isProcess){
                currentTime = Date.now();
                that.left = Math.max(left - (currentTime - startTime), 0);
                that.pass = that.params['count'] - that.left;
                o = getLeftTime();
                that.triggerEvent('onTick', o);
                if(that.left == 0){
                    that.stop();
                    that.triggerEvent('onEnd', o);
                }else{
                    animFrame(process);
                }
            }
        })();
        return that;
    };

    that.stop = function(){
        that.isProcess = false;
        return that;
    };

    init();
});
cm.define('Com.TintRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__tint-range',
        'min' : 360,
        'max' : 0,
        'value' : 360
    }
},
function(params){
    var that = this;
    Com.AbstractRange.apply(that, arguments);
});

cm.getConstructor('Com.TintRange', function(classConstructor, className, classProto){
    classProto.renderContent = function(){
        return cm.node('div', {'class' : 'com__tint-range__content'});
    };
});
cm.define('Com.ToggleBox', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'renderStructure' : false,
        'embedStructure' : 'replace',
        'duration' : 500,
        'remember' : false,                                 // Remember toggle state
        'toggleTitle' : false,                              // Change title on toggle
        'container' : false,
        'title' : false,
        'content' : false,
        'className' : 'has-title-bg is-base is-hide',
        'eventNode' : 'title',                              // button | title
        'langs' : {
            'show' : 'Show',
            'hide' : 'Hide'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'button': cm.Node('div'),
        'target': cm.Node('div'),
        'title': cm.Node('div')
    };
    that.animations = {};

    that.isCollapsed = false;
    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params['renderStructure']){
            if(!that.params['title']){
                that.params['title'] = '';
                that.params['toggleTitle'] = true;
            }
        }
    };

    var render = function(){
        var storageCollapsed;
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('dl', {'class' : 'com__togglebox'},
                that.nodes['titleContainer'] = cm.Node('dt',
                    that.nodes['button'] = cm.Node('span', {'class' : 'icon default linked'}),
                    that.nodes['title'] = cm.Node('span', {'class' : 'title'}, that.params['title'])
                ),
                that.nodes['target'] = cm.Node('dd',
                    that.nodes['content'] = cm.Node('div', {'class' : 'inner'})
                )
            );
            cm.addClass(that.nodes['container'], that.params['className']);
            // Embed
            that.embedStructure(that.nodes['container']);
            // Embed content
            if(that.params['content']){
                that.nodes['content'].appendChild(that.params['content']);
            }else{
                that.nodes['content'].appendChild(that.params['node']);
            }
            // Set events
            if(that.params['eventNode'] == 'button'){
                cm.addClass(that.nodes['container'], 'has-hover-icon');
                cm.addEvent(that.nodes['button'], 'click', that.toggle);
            }else{
                cm.addEvent(that.nodes['titleContainer'], 'click', that.toggle);
            }
        }else{
            cm.addEvent(that.nodes['button'], 'click', that.toggle);
        }
        // Animation
        that.animations['target'] = new cm.Animation(that.nodes['target']);
        // Check toggle class
        that.isCollapsed = cm.isClass(that.nodes['container'], 'is-hide') || !cm.isClass(that.nodes['container'], 'is-show');
        // Check storage
        if(that.params['remember']){
            storageCollapsed = that.storageRead('isCollapsed');
            that.isCollapsed = storageCollapsed !== null ? storageCollapsed : that.isCollapsed;
        }
        // Trigger collapse event
        if(that.isCollapsed){
            that.collapse(true);
        }else{
            that.expand(true);
        }
    };

    var expandEnd = function(){
        that.isProcess = false;
        that.nodes['target'].style.opacity = 1;
        that.nodes['target'].style.height = 'auto';
        that.nodes['target'].style.overflow = 'visible';
        // Trigger events
        cm.customEvent.trigger(that.nodes['target'], 'redraw', {
            'type' : 'child',
            'self' : false
        });
        that.triggerEvent('onShow');
    };

    var collapseEnd = function(){
        that.isProcess = false;
        that.nodes['target'].style.opacity = 0;
        that.nodes['target'].style.height = 0;
        that.nodes['target'].style.display = 'none';
        that.triggerEvent('onHide');
    };

    /* ******* PUBLIC ******* */

    that.setTitle = function(node){
        cm.clearNode(that.nodes['title']);
        if(cm.isString(node) || cm.isNumber(node)){
            that.nodes['title'].innerHTML = node;
        }else{
            cm.appendNodes(node, that.nodes['title']);
        }
        return that;
    };

    that.setContent = function(node){
        var parent = that.nodes['content'] || that.nodes['target'];
        cm.clearNode(parent);
        if(cm.isString(node) || cm.isNumber(node)){
            parent.innerHTML = node;
        }else{
            cm.appendNodes(node, parent);
        }
        return that;
    };

    that.toggle = function(){
        if(that.isCollapsed){
            that.expand();
        }else{
            that.collapse();
        }
    };

    that.expand = function(isImmediately){
        if(isImmediately || that.isCollapsed){
            that.isCollapsed = false;
            that.isProcess = 'show';
            that.triggerEvent('onShowStart');
            // Write storage
            if(that.params['remember']){
                that.storageWrite('isCollapsed', false);
            }
            cm.replaceClass(that.nodes['container'], 'is-hide', 'is-show');
            // Set title
            if(that.params['toggleTitle']){
                that.nodes['title'].innerHTML = that.lang('hide');
            }
            // Animate
            if(isImmediately){
                expandEnd();
            }else{
                // Redraw inner content
                that.nodes['target'].style.height = 'auto';
                that.nodes['target'].style.display = 'block';
                // Trigger events
                cm.customEvent.trigger(that.nodes['target'], 'redraw', {
                    'type' : 'child',
                    'self' : false
                });
                // Prepare animation
                that.nodes['target'].style.height = 0;
                that.nodes['target'].style.overflow = 'hidden';
                if(!that.nodes['target'].style.opacity){
                    that.nodes['target'].style.opacity = 0;
                }
                that.animations['target'].go({
                    'style' : {
                        'height' : [cm.getRealHeight(that.nodes['target'], 'offset', 'current'), 'px'].join(''),
                        'opacity' : 1
                    },
                    'anim' : 'smooth',
                    'duration' : that.params['duration'],
                    'onStop' : expandEnd
                });
            }
        }
    };

    that.collapse = function(isImmediately){
        if(isImmediately || !that.isHide){
            that.isCollapsed = true;
            that.isProcess = 'hide';
            that.triggerEvent('onHideStart');
            // Write storage
            if(that.params['remember']){
                that.storageWrite('isCollapsed', true);
            }
            cm.replaceClass(that.nodes['container'], 'is-show', 'is-hide');
            // Set title
            if(that.params['toggleTitle']){
                that.nodes['title'].innerHTML = that.lang('show');
            }
            // Animate
            that.nodes['target'].style.overflow = 'hidden';
            if(!that.nodes['target'].style.opacity){
                that.nodes['target'].style.opacity = 1;
            }
            if(isImmediately){
                collapseEnd();
            }else{
                that.animations['target'].go({
                    'style' : {
                        'height' : '0px',
                        'opacity' : 0
                    },
                    'anim' : 'smooth',
                    'duration' : that.params['duration'],
                    'onStop' : collapseEnd
                });
            }
        }
    };

    init();
});
cm.define('Com.Toolbar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'flex' : false
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.groups = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__toolbar'},
            that.nodes['part'] = cm.node('div', {'class' : 'pt__toolbar'},
                cm.node('div', {'class' : 'inner clear'},
                    that.nodes['left'] = cm.node('div', {'class' : 'left'}),
                    that.nodes['right'] = cm.node('div', {'class' : 'right'})
                )
            )
        );
        that.params['flex'] && cm.addClass(that.nodes['part'], 'is-adaptive');
        // Append
        that.embedStructure(that.nodes['container']);
    };

    /* ******* PUBLIC ******* */

    that.clear = function(){
        cm.forEach(that.groups, function(group){
            that.removeGroup(group);
        });
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.addGroup = function(item){
        item = cm.merge({
            'container' : cm.node('ul', {'class' : 'group'}),
            'node' : null,
            'adaptive' : true,
            'name' : '',
            'position' : 'left',
            'items' : {}
        }, item);
        if(!that.groups[item['name']]){
            if(!item['node']){
                item['node'] = item['container'];
            }
            item['adaptive'] && cm.addClass(item['container'], 'is-adaptive');
            if(/left|right/.test(item['position'])){
                cm.appendChild(item['container'], that.nodes[item['position']]);
            }
            that.groups[item['name']] = item;
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.getGroup = function(name){
        return that.groups[name];
    };

    that.removeGroup = function(name){
        var item;
        if(cm.isObject(arguments[0])){
            item = name;
        }else{
            item = that.groups[name];
        }
        if(item){
            cm.remove(item['container']);
            delete that.groups[item['name']];
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.addButton = function(item){
        var group;
        item = cm.merge({
            'container' : cm.node('li'),
            'node' : cm.node('div', {'class' : 'button'}),
            'name' : '',
            'label' : '',
            'title' : '',
            'group' : '',
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){}
        }, item);
        if((group = that.groups[item['group']]) && !group.items[item['name']]){
            item['node'].innerHTML = item['label'];
            item['node'].title = item['title'];
            // Callbacks
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'node' : item['node']
                        })
                    );
                });
            }else{
                cm.addEvent(item['node'], 'click', function(e){
                    cm.preventDefault(e);
                    item['callback'](e, item);
                });
            }
            cm.appendChild(item['node'], item['container']);
            cm.appendChild(item['container'], group['node']);
            group.items[item['name']] = item;
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.getButton = function(name, groupName){
        var item, group;
        if((group = that.groups[groupName]) && (item = group.items[name])){
            return item;
        }
        return null;
    };

    that.removeButton = function(name, groupName){
        var item, group;
        if(cm.isObject(arguments[0])){
            item = name;
            group = that.groups[item['group']];
        }else if(group = that.groups[groupName]){
            item = group.items[name];
        }
        if(item){
            cm.remove(item['container']);
            delete group.items[item['name']];
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    init();
});
cm.define('Com.Tooltip', {
    'modules' : [
        'Params',
        'Events',
        'Langs'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    'params' : {
        'target' : cm.Node('div'),
        'targetEvent' : 'hover',                        // hover | click | none
        'hideOnReClick' : false,                        // Hide tooltip when re-clicking on the target, requires setting value 'targetEvent' : 'click'
        'hideOnOut' : true,
        'preventClickEvent' : false,                    // Prevent default click event on the target, requires setting value 'targetEvent' : 'click'
        'top' : 0,                                      // Supported properties: targetHeight, selfHeight, number
        'left' : 0,                                     // Supported properties: targetWidth, selfWidth, number
        'width' : 'auto',                               // Supported properties: targetWidth, auto, number
        'minWidth' : 0,
        'duration' : 'cm._config.animDurationShort',
        'delay' : 0,
        'resizeInterval' : 5,
        'disabled' : false,
        'position' : 'absolute',
        'className' : '',
        'theme' : 'theme-default',
        'adaptive' : true,
        'adaptiveX' : true,
        'adaptiveY' : true,
        'title' : '',
        'titleTag' : 'h3',
        'content' : cm.Node('div'),
        'container' : 'document.body'
    }
},
function(params){
    var that = this;
    
    that.nodes = {};
    that.animation = null;
    that.delayInterval = null;
    that.resizeInterval = null;

    that.isHideProcess = false;
    that.isShowProcess = false;
    that.isShow = false;
    that.isWindowEvent = false;
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        setMiscEvents();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!that.params['adaptive']){
            that.params['adaptiveX'] = false;
            that.params['adaptiveY'] = false;
        }
        that.params['position'] = cm.inArray(['absolute', 'fixed'], that.params['position'])? that.params['position'] : 'absolute';
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__tooltip'},
            that.nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                that.nodes['content'] = cm.Node('div', {'class' : 'scroll'})
            )
        );
        // Add position style
        that.nodes['container'].style.position = that.params['position'];
        // Add theme css class
        !cm.isEmpty(that.params['theme']) && cm.addClass(that.nodes['container'], that.params['theme']);
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(that.nodes['container'], that.params['className']);
        // Set title
        renderTitle(that.params['title']);
        // Embed content
        renderContent(that.params['content']);
        // Disabled / Enabled
        if(that.params['disabled']){
            that.disable();
        }else{
            that.enable();
        }
    };

    var renderTitle = function(title){
        cm.remove(that.nodes['title']);
        if(!cm.isEmpty(title)){
            that.nodes['title'] = cm.Node('div', {'class' : 'title'},
                cm.Node(that.params['titleTag'], title)
            );
            cm.insertFirst(that.nodes['title'], that.nodes['inner']);
        }
    };

    var renderContent = function(node){
        cm.clearNode(that.nodes['content']);
        if(node){
            that.nodes['content'].appendChild(node);
        }
    };

    var setMiscEvents = function(){
        // Init animation
        that.animation = new cm.Animation(that.nodes['container']);
        // Add target event
        if(that.params['preventClickEvent']){
            cm.addEvent(that.params['target'], 'click', function(e){
                cm.preventDefault(e);
            });
        }
        setTargetEvent();
    };

    var targetEvent = function(){
        if(!that.disabled){
            if(that.isShow && that.params['targetEvent'] == 'click' && that.params['hideOnReClick']){
                hide();
            }else{
                show();
            }
        }
    };

    var setTargetEvent = function(){
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.addEvent(that.params['target'], 'mouseover', targetEvent, true);
                break;
            case 'click' :
                cm.addEvent(that.params['target'], 'click', targetEvent, true);
                break;
        }
    };

    var removeTargetEvent = function(){
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.removeEvent(that.params['target'], 'mouseover', targetEvent);
                break;
            case 'click' :
                cm.removeEvent(that.params['target'], 'click', targetEvent);
                break;
        }
    };

    var show = function(immediately){
        if((!that.isShow && !that.isShowProcess) || that.isHideProcess){
            that.isShowProcess = true;
            setWindowEvent();
            // Show Handler
            clearDelayInterval();
            if(immediately){
                showHandler(immediately);
            }else if(that.params['delay'] && !that.isHideProcess){
                that.delayInterval = setTimeout(showHandler, that.params['delay']);
            }else{
                showHandler();
            }
        }
    };

    var showHandler = function(immediately){
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        that.nodes['container'].style.display = 'block';
        resizeHelper();
        that.triggerEvent('onShowStart');
        // Animate
        if(immediately || !that.params['duration']){
            showHandlerEnd();
        }else{
            that.animation.stop();
            that.animation.go({
                'style' : {'opacity' : 1},
                'duration' : that.params['duration'],
                'anim' : 'smooth',
                'onStop' : showHandlerEnd
            });
        }
    };

    var showHandlerEnd = function(){
        that.nodes['container'].style.opacity = 1;
        that.isShow = true;
        that.isShowProcess = false;
        that.isHideProcess = false;
        that.triggerEvent('onShow');
    };

    var hide = function(immediately){
        if((that.isShow || that.isShowProcess) && !that.isHideProcess){
            that.isHideProcess = true;
            // Hide Handler
            clearDelayInterval();
            if(immediately){
                hideHandler(immediately);
            }else if(that.params['delay'] && !that.isShowProcess){
                that.delayInterval = setTimeout(hideHandler, that.params['delay']);
            }else{
                hideHandler();
            }
        }
    };

    var hideHandler = function(immediately){
        if(immediately || !that.params['duration']){
            hideHandlerEnd();
        }else{
            that.animation.stop();
            that.animation.go({
                'style' : {'opacity' : 0},
                'duration' : that.params['duration'],
                'anim' : 'smooth',
                'onStop' : hideHandlerEnd
            });
        }
    };

    var hideHandlerEnd = function(){
        that.triggerEvent('onHideStart');
        clearResizeInterval();
        removeWindowEvent();
        that.nodes['container'].style.display = 'none';
        cm.remove(that.nodes['container']);
        that.isShow = false;
        that.isShowProcess = false;
        that.isHideProcess = false;
        that.triggerEvent('onHide');
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var targetWidth =  that.params['target'].offsetWidth,
            targetHeight = that.params['target'].offsetHeight,
            selfHeight = that.nodes['container'].offsetHeight,
            selfWidth = that.nodes['container'].offsetWidth,
            pageSize = cm.getPageSize(),
            scrollTop = cm.getScrollTop(window),
            scrollLeft = cm.getScrollLeft(window);
        // Calculate size
        (function(){
            var width;
            if(that.params['width'] != 'auto'){
                width = Math.max(
                    eval(
                        that.params['minWidth']
                            .toString()
                            .replace('targetWidth', targetWidth)
                            .replace('selfWidth', selfWidth)
                    ),
                    eval(
                        that.params['width']
                            .toString()
                            .replace('targetWidth', targetWidth)
                            .replace('selfWidth', selfWidth)
                    )
                );
                if(width != selfWidth){
                    that.nodes['container'].style.width =  [width, 'px'].join('');
                    selfWidth = that.nodes['container'].offsetWidth;
                    selfHeight = that.nodes['container'].offsetHeight;
                }
            }
        })();
        // Calculate position
        (function(){
            var top = cm.getRealY(that.params['target']),
                topAdd = eval(
                    that.params['top']
                        .toString()
                        .replace('targetHeight', targetHeight)
                        .replace('selfHeight', selfHeight)
                ),
                left =  cm.getRealX(that.params['target']),
                leftAdd = eval(
                    that.params['left']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('selfWidth', selfWidth)
                ),
                positionTop,
                positionLeft;
            // Calculate adaptive or static vertical position
            if(that.params['adaptiveY']){
                positionTop = Math.max(
                    Math.min(
                        ((top + topAdd + selfHeight > pageSize['winHeight'])
                                ? (top - topAdd - selfHeight + targetHeight)
                                : (top + topAdd)
                        ),
                        (pageSize['winHeight'] - selfHeight)
                    ),
                    0
                );
            }else{
                positionTop = top + topAdd;
            }
            // Calculate adaptive or static horizontal position
            if(that.params['adaptiveX']){
                positionLeft = Math.max(
                    Math.min(
                        ((left + leftAdd + selfWidth > pageSize['winWidth'])
                                ? (left - leftAdd - selfWidth + targetWidth)
                                : (left + leftAdd)
                        ),
                        (pageSize['winWidth'] - selfWidth)
                    ),
                    0
                );
            }else{
                positionLeft = left + leftAdd;
            }
            // Fix scroll position for absolute
            if(that.params['position'] == 'absolute'){
                if(that.params['container'] == document.body){
                    positionTop += scrollTop;
                    positionLeft += scrollLeft;
                }else{
                    positionTop -= cm.getRealY(that.params['container']);
                    positionLeft -= cm.getRealX(that.params['container']);
                }
            }
            positionTop = Math.round(positionTop);
            positionLeft = Math.round(positionLeft);
            // Apply styles
            if(positionTop != that.nodes['container'].offsetTop){
                that.nodes['container'].style.top =  [positionTop, 'px'].join('');
            }
            if(positionLeft != that.nodes['container'].offsetLeft){
                that.nodes['container'].style.left = [positionLeft, 'px'].join('');
            }
        })();
    };

    var setWindowEvent = function(){
        if(that.params['hideOnOut'] && !that.isWindowEvent){
            that.isWindowEvent = true;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.addEvent(window, 'mousemove', windowEvent);
                    break;
                case 'click' :
                default :
                    cm.addEvent(window, 'mousedown', windowEvent);
                    break;
            }
        }
    };

    var removeWindowEvent = function(){
        if(that.params['hideOnOut'] && that.isWindowEvent){
            that.isWindowEvent = false;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.removeEvent(window, 'mousemove', windowEvent);
                    break;
                case 'click' :
                default :
                    cm.removeEvent(window, 'mousedown', windowEvent);
                    break;
            }
        }
    };

    var windowEvent = function(e){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(that.nodes['container'], target, true) && !cm.isParent(that.params['target'], target, true)){
            hide(false);
        }else{
            show(true);
        }
    };

    var clearResizeInterval = function(){
        that.resizeInterval && clearTimeout(that.resizeInterval);
        that.resizeInterval = null;
    };

    var clearDelayInterval = function(){
        that.delayInterval && clearTimeout(that.delayInterval);
        that.delayInterval = null;
    };

    /* ******* MAIN ******* */

    that.setTitle = function(title){
        renderTitle(title);
        return that;
    };

    that.setContent = function(node){
        renderContent(node);
        return that;
    };

    that.setTarget = function(node){
        removeTargetEvent();
        that.params['target'] = node || cm.Node('div');
        setTargetEvent();
        return that;
    };

    that.show = function(immediately){
        show(immediately);
        return that;
    };

    that.hide = function(immediately){
        hide(immediately);
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        return that;
    };

    that.scrollToNode = function(node){
        if(cm.isNode(node) && cm.isParent(that.nodes['content'], node)){
            that.nodes['content'].scrollTop = node.offsetTop - that.nodes['content'].offsetTop;
        }
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(that.nodes['container'], node, true);
    };

    that.remove = function(){
        hide(true);
        removeTargetEvent();
        return that;
    };

    // Deprecated
    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});
// This file must be deleted in future

Com['UA'] = {
    'hash' : {'ie':'MSIE','edge':'Edge','opera':'Opera','ff':'Firefox','firefox':'Firefox','webkit':'AppleWebKit','safari':'Safari','chrome':'Chrome','steam':'Steam'},
    'fullname' : {'Edge':'Microsoft Edge','MSIE':'Microsoft Internet Explorer','Firefox':'Mozilla Firefox','Chrome':'Google Chrome','Safari':'Apple Safari','Opera':'Opera','Opera Mini':'Opera Mini','Opera Mobile':'Opera Mobile','IE Mobile':'Internet Explorer Mobile','Steam':'Valve Steam Game Overlay'},
    'os' : {
        'Windows':{'NT 5.0':'2000','NT 5.1':'XP','NT 5.2':'Server 2003','NT 6.0':'Vista','NT 6.1':'7','NT 6.2':'8','NT 6.3':'8.1','NT 10.0':'10'},
        'Mac OSX':{'10.0':'Cheetah','10.1':'Puma','10.2':'Jaguar','10.3':'Panther','10.4':'Tiger','10.5':'Leopard','10.6':'Snow Leopard','10.7':'Lion','10.8':'Mountain Lion','10.9':'Mavericks','10.10':'Yosemite','10.11':'El Capitan'}
    },
    'str' : navigator.userAgent,
    'get' : function(str){
        var that = this,
            arr = {};
        str = (str)? str : that.str;
        // Check browser
        if(str.indexOf('IEMobile') > -1){
            arr['browser'] = 'IE Mobile';
            arr['hash'] = 'ie-mobile';
            arr['engine'] = 'Trident';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:IEMobile)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('MSIE') > -1 || str.indexOf('Trident') > -1){
            arr['browser'] = 'MSIE';
            arr['hash'] = 'ie';
            arr['engine'] = 'Trident';
            if(str.indexOf('MSIE') > -1){
                arr['full_version'] = str.replace(/^(?:.+)(?:MSIE)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            }else{
                arr['full_version'] = str.replace(/^(?:.+)(?:rv:)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            }
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Opera Mobi') > -1){
            arr['browser'] = 'Opera Mobile';
            arr['hash'] = 'opera-mobile';
            arr['engine'] = 'Presto';
            arr['type'] = 'mobile';
            arr['version'] = arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{1,})$/, '$1') : '';
            arr['short_version'] = arr['version'].split('.')[0];
        }else if(str.indexOf('Opera Mini') > -1){
            arr['browser'] = 'Opera Mini';
            arr['hash'] = 'opera-mini';
            arr['engine'] = 'Presto';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:Opera Mini\/)([0-9\.]{0,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Opera') > -1){
            arr['browser'] = 'Opera';
            arr['hash'] = 'opera';
            arr['engine'] = 'Presto';
            arr['version'] = arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{0,})(?:.{0,})$/, '$1') : str.replace(/^(?:Opera\/)([0-9\.]{1,})\s(?:.+)$/, '$1');
            arr['short_version'] = arr['version'].split('.')[0];
        }else if(str.indexOf('OPR') > -1){
            arr['browser'] = 'Opera';
            arr['hash'] = 'opera';
            arr['engine'] = 'Blink';
            arr['full_version'] = str.replace(/^(?:.+)(?:OPR\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Fennec') > -1){
            arr['browser'] = 'Fennec';
            arr['hash'] = 'fennec';
            arr['engine'] = 'Gecko';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:Fennec)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Firefox') > -1){
            arr['browser'] = 'Firefox';
            arr['hash'] = 'firefox';
            arr['engine'] = 'Gecko';
            arr['full_version'] = str.replace(/^(?:.+)(?:Firefox)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Edge') > -1){
            arr['browser'] = 'Edge';
            arr['hash'] = 'edge';
            arr['engine'] = 'EdgeHTML';
            arr['full_version'] = str.replace(/^(?:.+)(?:Edge)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Valve Steam GameOverlay') > -1){
            arr['browser'] = 'Steam';
            arr['hash'] = 'steam';
            arr['engine'] = 'AppleWebKit';
            arr['full_version'] = str.replace(/^(?:.+)(?:Chrome\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Chrome') > -1){
            arr['browser'] = 'Chrome';
            arr['hash'] = 'chrome';
            arr['engine'] = 'Blink';
            arr['full_version'] = str.replace(/^(?:.+)(?:Chrome\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Safari') > -1){
            arr['browser'] = 'Safari';
            arr['hash'] = 'safari';
            arr['engine'] = 'AppleWebKit';
            arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{1,})(?:.+)$/, '$1') : '2';
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else{
            arr['version'] = arr['browser'] = 'unknown';
        }
        // Browser fullname
        arr['full_name'] = ((that.fullname[arr['browser']])? that.fullname[arr['browser']] : 'unknown');
        arr['browser_name'] = arr['full_name'] + ((arr['version'].length > 0 && arr['version'] != 'unknown')? ' '+arr['version'] : '');
        // Ckeck browser engine
        if(!arr['engine']){
            if(str.indexOf('AppleWebKit') > -1){
                arr['engine'] = 'AppleWebKit';
            }else if(str.indexOf('Trident') > -1){
                arr['engine'] = 'Trident';
            }else if(str.indexOf('Gecko') > -1){
                arr['engine'] = 'Gecko';
            }else{
                arr['engine'] = 'unknown';
            }
        }
        // Check OS
        if(str.indexOf('Windows Phone') > -1){
            arr['os'] = 'Windows Phone';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows Phone)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Windows Phone OS') > -1){
            arr['os'] = 'Windows Phone OS';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows Phone OS)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Windows CE') > -1){
            arr['os'] = 'Windows Mobile';
            arr['os_type'] = 'mobile';
            arr['os_version'] = '';
        }else if(str.indexOf('Windows') > -1){
            arr['os'] = 'Windows';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Android') > -1){
            arr['os'] = 'Android';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Android)(?:[\s]{0,})([0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Linux') > -1){
            arr['os'] = 'Linux';
            arr['os_version'] = str.replace(/^(?:.+)(?:Linux)(?:[\s]{0,1})([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('iPhone') > -1){
            arr['os'] = 'iPhone';
            arr['os_type'] = 'mobile';
            arr['os_version'] =  str.replace(/^(?:.+)(?:CPU[ iPhone]{0,} OS )([a-zA-Z0-9\._]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
        }else if(str.indexOf('iPad') > -1){
            arr['os'] = 'iPad';
            arr['os_type'] = 'mobile';
            arr['os_version'] =  str.replace(/^(?:.+)(?:CPU[ iPhone]{0,} OS )([a-zA-Z0-9\._]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
        }else if(str.indexOf('Macintosh') > -1){
            if((str.indexOf('Mac OS X') > -1)){
                arr['os'] = 'Mac OSX';
                arr['os_version'] =  str.replace(/^(?:.+)(?:Mac OS X)(?:[\s]{0,1})([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
            }else{
                arr['os'] = 'Mac OS';
                arr['os_version'] = 'Classic';
            }
        }else if(str.indexOf('BlackBerry') > -1){
            arr['os'] = 'BlackBerry';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.{0,})(?:BlackBerry)(?:[\s]{0,})([0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('FreeBSD') > -1){
            arr['os'] = 'FreeBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:FreeBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('NetBSD') > -1){
            arr['os'] = 'NetBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:NetBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('OpenBSD') > -1){
            arr['os'] = 'OpenBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:OpenBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('SunOS') > -1){
            arr['os'] = 'SunOS';
            arr['os_version'] = str.replace(/^(?:.+)(?:SunOS )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else{
            arr['os'] = arr['os_version'] = 'unknown';
        }
        // Check OS Name
        if(!arr['os_name']){
            if(arr['os'] != 'unknown'){
                var os = that.os[arr['os']];
                arr['os_name'] =  arr['os'] + ((arr['os_version'].length > 0 && arr['os_version'] != 'unknown')? ' '+((os && os[arr['os_version']])? os[arr['os_version']] : arr['os_version']) : '');
            }
            else{
                arr['os_name'] = 'unknown';
            }
        }
        return arr;
    },
    'setBrowserClass' : function(){
        var user = Com.UA.get();
        if(user['hash']){
            cm.addClass(document.getElementsByTagName('html')[0], [user['engine'].toLowerCase(), user['hash'], user['hash']+user['short_version']].join(' '));
        }
    },
    'setEngineClass' : function(){
        var user = Com.UA.get();
        cm.addClass(document.getElementsByTagName('html')[0], user['engine'].toLowerCase());
    },
    'is' : function(str){
        var that = this,
            ver = str.replace(/[^0-9\.\,]/g,''),
            app = that.hash[str.replace(/[0-9\.\,\s]/g,'').toLowerCase()],
            user = that.get();
        return (app == user.browser && ((ver && ver.length > 0)? parseFloat(ver) == parseFloat(user.version) : true));
    },
    'isVersion' : function(){
        var that = this,
            user = that.get();
        return parseFloat(user.version);
    },
    'isMobile' : function(){
        var that = this,
            user = that.get();
        return user['os_type'] == 'mobile';
    }
};

/* Deprecated */

var is = function(str){
    cm.log('Warning. Method "is()" is deprecated. Please use "Com.UA.is()"');
    return Com.UA.is(str);
};

var isVersion = function(){
    cm.log('Warning. Method "isVersion()" is deprecated. Please use "Com.UA.isVersion()"');
    return Com.UA.isVersion();
};
cm.define('Com.Zoom', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onClose',
        'onCloseStart'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : 'document.body',
        'name' : '',
        'src' :'',
        'duration' : 'cm._config.animDuration',
        'autoOpen' : true,
        'removeOnClose' : true,
        'documentScroll' : false
    }
},
function(params){
    var that = this,
        imageRect,
        innerRect,
        widthRatio,
        heightRatio;

    that.isOpen = false;
    that.isLoad = false;
    that.nodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__zoom'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addEvent(that.nodes['container'], 'click', that.close);
    };

    var renderImage = function(){
        that.nodes['image'] = cm.node('img');
        cm.addEvent(that.nodes['image'], 'load', function(){
            that.isLoad = true;
            // Get image properties
            calculateHelper();
            calculateAction();
        });
        that.nodes['image'].src = that.params['src'];
        // Append
        that.nodes['inner'].appendChild(that.nodes['image']);
    };

    var calculateHelper = function(){
        imageRect = cm.getRect(that.nodes['image']);
        innerRect = cm.getRect(that.nodes['inner']);
        widthRatio = (imageRect['width'] - innerRect['width']) / innerRect['width'];
        heightRatio = (imageRect['height'] - innerRect['height']) / innerRect['height'];
    };

    var calculateAction = function(){
        if(that.isLoad){
            var setX = -cm._clientPosition['left'] * widthRatio,
                setY = -cm._clientPosition['top'] * heightRatio;
            cm.setCSSTranslate(that.nodes['image'], [setX, 'px'].join(''), [setY, 'px'].join(''));
        }
    };

    var clickAction = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            // ESC key
            that.close();
        }
    };

    var resizeAction = function(){
        calculateHelper();
        calculateAction();
    };

    var moveAction = function(){
        calculateAction();
    };

    var appendEvents = function(){
        cm.addEvent(window, 'mousemove', moveAction);
        cm.addEvent(window, 'resize', resizeAction);
        cm.addEvent(window, 'keydown', clickAction);
    };

    var removeEvents = function(){
        cm.removeEvent(window, 'mousemove', moveAction);
        cm.removeEvent(window, 'resize', resizeAction);
        cm.removeEvent(window, 'keydown', clickAction);
    };

    /* ******* PUBLIC ******* */

    that.set = function(src){
        that.isLoad = false;
        that.params['src'] = src;
        return that;
    };

    that.open = function(){
        if(!that.isOpen){
            that.isOpen = true;
            appendEvents();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Append
            that.nodes['container'].style.display = 'block';
            if(!cm.inDOM(that.nodes['container'])){
                that.params['container'].appendChild(that.nodes['container']);
            }
            renderImage();
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Event
                    that.triggerEvent('onOpen');
                }
            });
            // Event
            that.triggerEvent('onOpenStart');
        }
        return that;
    };

    that.close = function(){
        if(that.isOpen){
            that.isOpen = false;
            removeEvents();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Remove Window
                    that.nodes['container'].style.display = 'none';
                    that.params['removeOnClose'] && cm.remove(that.nodes['container']);
                    cm.remove(that.nodes['image']);
                    // Event
                    that.triggerEvent('onClose');
                }
            });
            // Event
            that.triggerEvent('onCloseStart');
        }
        return that;
    };

    init();
});
cm.define('Com.elFinderFileManager', {
    'extend' : 'Com.AbstractFileManager',
    'params' : {
        'lazy' : false,
        'config' : {
            url : '',
            lang : {},
            dotFiles : false,
            useBrowserHistory : false,
            resizable : false,
            width : 'auto',
            height : 'auto',
            commandsOptions : {
                getfile : {
                    folders : false,
                    multiple : false
                }
            }
        }
    }
},
function(params){
    var that = this;
    that.getFilesProcessType = null;
    that.isLoaded = false;
    // Call parent class construct
    Com.AbstractFileManager.apply(that, arguments);
});

cm.getConstructor('Com.elFinderFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.getFilesEventHandler = that.getFilesEvent.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this;
        that.getFilesProcessType = 'get';
        if(that.components['controller']){
            that.components['controller'].exec('getfile');
        }else{
            _inherit.prototype.get.apply(that, arguments);
        }
        return that;
    };

    classProto.complete = function(){
        var that = this;
        that.getFilesProcessType = 'complete';
        if(that.components['controller']){
            that.components['controller'].exec('getfile');
        }else{
            _inherit.prototype.complete.apply(that, arguments);
        }
        return that;
    };

    classProto.redraw = function(){
        var that = this;
        if(that.components['controller']){
            that.components['controller'].resize('auto', 'auto');
        }
        that.triggerEvent('onRedraw');
        return that;
    };

    classProto.renderController = function(){
        var that = this;
        // Init elFinder
        if(!that.components['controller']){
            if(typeof elFinder != 'undefined'){
                that.isLoaded = true;
                that.components['controller'] = new elFinder(that.nodes['holder']['inner'],
                    cm.merge(that.params['config'], {
                        commandsOptions : {
                            getfile : {
                                multiple: that.isMultiple
                            }
                        },
                        getFileCallback : that.getFilesEventHandler
                    })
                );
                // Show
                cm.removeClass(that.nodes['holder']['container'], 'is-hidden', true);
                that.components['controller'].show();
                that.components['controller'].resize('auto', 'auto');
            }else{
                cm.errorLog({
                    'name' : that._name['full'],
                    'message' : ['elFinder does not exists.'].join(' ')
                });
            }
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.getFilesEvent = function(data){
        var that = this;
        // Read files and convert to file format
        that.processFiles(data);
        // Callbacks
        switch(that.getFilesProcessType){
            case 'get':
                _inherit.prototype.get.call(that);
                break;
            case 'complete':
                _inherit.prototype.complete.call(that);
                break;
            default:
                _inherit.prototype.complete.call(that);
                break;

        }
        that.getFilesProcessType = null;
        return that;
    };

    classProto.convertFile = function(data){
        if(!data || data['mime'] == 'directory'){
            return false;
        }
        return {
            'value' : data['url'],
            'name' : data['name'],
            'mime' : data['mime'],
            'size' : data['size'],
            'url' : data['url']
        }
    };
});
cm.define('Com.elFinderFileManagerContainer', {
    'extend' : 'Com.AbstractFileManagerContainer',
    'params' : {
        'constructor' : 'Com.elFinderFileManager'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractFileManagerContainer.apply(that, arguments);
});
window.LESS = {"CmIconVars-Family":"Magpie-UI-Glyphs","CmIconVars-Color":"#666666","CmIconVars-Version":14,"CmIcon-Magnify":"\\e600","CmIcon-Reduce":"\\e601","CmIcon-CircleArrowLeft":"\\e700","CmIcon-CircleArrowRight":"\\e701","CmIcon-CircleArrowUp":"\\e702","CmIcon-CircleArrowDown":"\\e703","CmIcon-CircleClose":"\\e704","CmIcon-CircleTwitter":"\\e800","CmIcon-CircleInstagram":"\\e801","CmIcon-CircleYoutube":"\\e802","CmIcon-CircleVK":"\\e803","CmIcon-CircleFacebook":"\\e804","CmIcon-ChevronDown":"\\e900","CmIcon-ChevronUp":"\\e901","CmIcon-ChevronLeft":"\\e902","CmIcon-ChevronRight":"\\e903","CmVersion":"3.16.0","CmPath-Images":"../img/MagpieUI","CmPath-Fonts":"../fonts/MagpieUI","CmScreen-Mobile":"640px","CmScreen-MobilePortrait":"480px","CmScreen-Tablet":"1024px","CmScreen-TabletPortrait":"768px","CmSize-None":"0px","CmSize-XXXSmall":"4px","CmSize-XXSmall":"8px","CmSize-XSmall":"12px","CmSize-Small":"16px","CmSize-Medium":"24px","CmSize-Large":"32px","CmSize-XLarge":"48px","CmSize-XXLarge":"64px","CmSize-XXXLarge":"96px","CmIndent-None":"0px","CmIndent-XXXSmall":"4px","CmIndent-XXSmall":"8px","CmIndent-XSmall":"12px","CmIndent-Small":"16px","CmIndent-Medium":"24px","CmIndent-Large":"32px","CmIndent-XLarge":"48px","CmIndent-XXLarge":"64px","CmIndent-XXXLarge":"96px","CmIndents":["0px","4px","8px","12px","16px","24px","32px","48px","64px","96px"],"CmUI-Transition-Duration":"250ms","CmUI-Transition-DurationShort":"100ms","CmUI-Transition-DurationLong":"500ms","CmUI-Transition-DurationXLong":"750ms","CmUI-Transition-DurationReverse":"100ms","CmUI-Transition-DurationNone":"0ms","CmUI-Transition-Delay-Hide":"300ms","CmUI-MotionAsymmetric":"cubic-bezier(0.5, 0, 0.15, 1)","CmUI-Opacity-Hover":0.7,"CmUI-Shadow":[0,0,"8px","rgba(0, 0, 0, 0.15)"],"CmUI-ShadowLight":[0,0,"2px","rgba(0, 0, 0, 0.2)"],"CmUI-ShadowInner":[0,"2px","2px","rgba(0, 0, 0, 0.4)","inset"],"CmUI-Shadow-Bottom":[0,"2px","5px","rgba(0, 0, 0, 0.15)"],"CmUI-Shadow-BottomLarge":[0,"2px","12px","rgba(0, 0, 0, 0.2)"],"CmUI-Shadow-Right":["2px",0,"5px","rgba(0, 0, 0, 0.15)"],"CmUI-Shadow-Left":["-2px",0,"5px","rgba(0, 0, 0, 0.15)"],"CmUI-Overlay":"rgba(255, 255, 255, 0.7)","CmUI-Overlay-Dark":"rgba(0, 0, 0, 0.7)","CmUI-Overlay-Light":"rgba(255, 255, 255, 0.7)","CmUI-Overlay-Duration":"250ms","CmUI-AdaptiveFrom":"768px","CmUI-TooltipWidth":"320px","CmUI-ColumnIndent":"24px","CmUI-BoxIndent":"24px","CmVar-Color-LightDefault-Lightness":"100%","CmVar-Color-LightHighlight-Lightness":"98%","CmVar-Color-LightHover-Lightness":"95%","CmVar-Color-LightActive-Lightness":"91%","CmVar-Color-LightActiveHover-Lightness":"86%","CmVar-Color-MiddleDefault-Lightness":"80%","CmVar-Color-MiddleHover-Lightness":"75%","CmVar-Color-MiddleActive-Lightness":"70%","CmVar-Color-MiddleActiveHover-Lightness":"65%","CmVar-Color-DarkDefault-Lightness":"52%","CmVar-Color-DarkHover-Lightness":"45%","CmVar-Color-DarkActive-Lightness":"35%","CmVar-Color-DarkActiveHover-Lightness":"25%","CmColor-Primary":210,"CmColor-Primary-DarkSaturation":"75%","CmColor-Primary-DarkLighten":"0%","CmColor-Primary-DarkDefault-Lightness":"52%","CmColor-Primary-DarkHover-Lightness":"45%","CmColor-Primary-DarkActive-Lightness":"35%","CmColor-Primary-DarkActiveHover-Lightness":"25%","CmColor-Primary-DarkDefault":"#2985e0","CmColor-Primary-DarkHover":"#1d73c9","CmColor-Primary-DarkActive":"#16599c","CmColor-Primary-DarkActiveHover":"#104070","CmColor-Primary-MiddleSaturation":"75%","CmColor-Primary-MiddleLighten":"0%","CmColor-Primary-MiddleDefault-Lightness":"80%","CmColor-Primary-MiddleHover-Lightness":"75%","CmColor-Primary-MiddleActive-Lightness":"70%","CmColor-Primary-MiddleActiveHover-Lightness":"65%","CmColor-Primary-MiddleDefault":"#a6ccf2","CmColor-Primary-MiddleHover":"#8fbfef","CmColor-Primary-MiddleActive":"#79b2ec","CmColor-Primary-MiddleActiveHover":"#63a6e9","CmColor-Primary-LightSaturation":"70%","CmColor-Primary-LightLighten":"0%","CmColor-Primary-LightHighlight-Lightness":"98%","CmColor-Primary-LightHover-Lightness":"95%","CmColor-Primary-LightActive-Lightness":"91%","CmColor-Primary-LightActiveHover-Lightness":"86%","CmColor-Primary-LightDefault":"transparent","CmColor-Primary-LightHighlight":"#f6fafd","CmColor-Primary-LightHover":"#e9f2fb","CmColor-Primary-LightActive":"#d8e8f8","CmColor-Primary-LightActiveHover":"#c2dbf4","CmColor-Secondary":0,"CmColor-Secondary-DarkSaturation":"0%","CmColor-Secondary-DarkLighten":"0%","CmColor-Secondary-DarkDefault-Lightness":"52%","CmColor-Secondary-DarkHover-Lightness":"45%","CmColor-Secondary-DarkActive-Lightness":"35%","CmColor-Secondary-DarkActiveHover-Lightness":"25%","CmColor-Secondary-DarkDefault":"#858585","CmColor-Secondary-DarkHover":"#737373","CmColor-Secondary-DarkActive":"#595959","CmColor-Secondary-DarkActiveHover":"#404040","CmColor-Secondary-MiddleSaturation":"0%","CmColor-Secondary-MiddleLighten":"0%","CmColor-Secondary-MiddleDefault-Lightness":"80%","CmColor-Secondary-MiddleHover-Lightness":"75%","CmColor-Secondary-MiddleActive-Lightness":"70%","CmColor-Secondary-MiddleActiveHover-Lightness":"65%","CmColor-Secondary-MiddleDefault":"#cccccc","CmColor-Secondary-MiddleHover":"#bfbfbf","CmColor-Secondary-MiddleActive":"#b3b3b3","CmColor-Secondary-MiddleActiveHover":"#a6a6a6","CmColor-Secondary-LightSaturation":"0%","CmColor-Secondary-LightLighten":"0%","CmColor-Secondary-LightHighlight-Lightness":"98%","CmColor-Secondary-LightHover-Lightness":"95%","CmColor-Secondary-LightActive-Lightness":"91%","CmColor-Secondary-LightActiveHover-Lightness":"86%","CmColor-Secondary-LightDefault":"transparent","CmColor-Secondary-LightHighlight":"#fafafa","CmColor-Secondary-LightHover":"#f2f2f2","CmColor-Secondary-LightActive":"#e8e8e8","CmColor-Secondary-LightActiveHover":"#dbdbdb","CmColor-Success":120,"CmColor-Success-DarkSaturation":"65%","CmColor-Success-DarkLighten":"-10%","CmColor-Success-DarkDefault-Lightness":"52%","CmColor-Success-DarkHover-Lightness":"45%","CmColor-Success-DarkActive-Lightness":"35%","CmColor-Success-DarkActiveHover-Lightness":"25%","CmColor-Success-DarkDefault":"#25b125","CmColor-Success-DarkHover":"#1f931f","CmColor-Success-DarkActive":"#166916","CmColor-Success-DarkActiveHover":"#0d3f0d","CmColor-Success-LightSaturation":"60%","CmColor-Success-LightLighten":"0%","CmColor-Success-LightHighlight-Lightness":"98%","CmColor-Success-LightHover-Lightness":"95%","CmColor-Success-LightActive-Lightness":"91%","CmColor-Success-LightActiveHover-Lightness":"86%","CmColor-Success-LightDefault":"transparent","CmColor-Success-LightHighlight":"#f7fdf7","CmColor-Success-LightHover":"#ebfaeb","CmColor-Success-LightActive":"#daf6da","CmColor-Success-LightActiveHover":"#c6f1c6","CmColor-Danger":0,"CmColor-Danger-DarkSaturation":"65%","CmColor-Danger-DarkLighten":"0%","CmColor-Danger-DarkDefault-Lightness":"52%","CmColor-Danger-DarkHover-Lightness":"45%","CmColor-Danger-DarkActive-Lightness":"35%","CmColor-Danger-DarkActiveHover-Lightness":"25%","CmColor-Danger-DarkDefault":"#d43535","CmColor-Danger-DarkHover":"#bd2828","CmColor-Danger-DarkActive":"#931f1f","CmColor-Danger-DarkActiveHover":"#691616","CmColor-Danger-LightSaturation":"65%","CmColor-Danger-LightLighten":"0%","CmColor-Danger-LightHighlight-Lightness":"98%","CmColor-Danger-LightHover-Lightness":"95%","CmColor-Danger-LightActive-Lightness":"91%","CmColor-Danger-LightActiveHover-Lightness":"86%","CmColor-Danger-LightDefault":"transparent","CmColor-Danger-LightHighlight":"#fdf7f7","CmColor-Danger-LightHover":"#fbeaea","CmColor-Danger-LightActive":"#f7d9d9","CmColor-Danger-LightActiveHover":"#f3c4c4","CmColor-Warning":38,"CmColor-Warning-DarkSaturation":"75%","CmColor-Warning-DarkLighten":"0%","CmColor-Warning-DarkDefault-Lightness":"52%","CmColor-Warning-DarkHover-Lightness":"45%","CmColor-Warning-DarkActive-Lightness":"35%","CmColor-Warning-DarkActiveHover-Lightness":"25%","CmColor-Warning-DarkDefault":"#e09d29","CmColor-Warning-DarkHover":"#c98a1d","CmColor-Warning-DarkActive":"#9c6b16","CmColor-Warning-DarkActiveHover":"#704d10","CmColor-Warning-LightSaturation":"70%","CmColor-Warning-LightLighten":"0%","CmColor-Warning-LightHighlight-Lightness":"98%","CmColor-Warning-LightHover-Lightness":"95%","CmColor-Warning-LightActive-Lightness":"91%","CmColor-Warning-LightActiveHover-Lightness":"86%","CmColor-Warning-LightDefault":"transparent","CmColor-Warning-LightHighlight":"#fdfbf6","CmColor-Warning-LightHover":"#fbf5e9","CmColor-Warning-LightActive":"#f8ecd8","CmColor-Warning-LightActiveHover":"#f4e2c2","CmColor-Font":"#666666","CmColor-Font-Opposite":"#ffffff","CmColor-Font-Hint":"#999999","CmColor-Font-Placeholder":"#b7b7b7","CmColor-Font-Link":"#2985e0","CmColor-Font-LinkHover":"#1d73c9","CmColor-Font-LinkActive":"#16599c","CmColor-Background":"#ffffff","CmColor-Icon":"#666666","CmColor-Mark":"#fdf6ad","CmColor-Gallery":"#111111","CmColor-Border":"#cccccc","CmColor-BorderHover":"#a6a6a6","CmColor-BorderSelected":"#a6ccf2","CmColor-BorderActive":"#2985e0","CmColor-BorderDisabled":"#e8e8e8","CmFont-Base-LightWeight":300,"CmFont-Base-NormalWeight":400,"CmFont-Base-BoldWeight":600,"CmFont-Base-LineHeight":"18px","CmFont-Base-LineHeightSmall":"18px","CmFont-Base-Family":"'Open Sans', arial, helvetica, sans-serif","CmFont-Base-Size":"13px","CmFont-Base-SizeSmall":"11px","CmFont-Base-Weight":400,"CmFont-Base-Color":"#666666","CmFont-Base-ColorOpposite":"#ffffff","CmFont-Base-Hint-Size":"11px","CmFont-Base-Hint-Color":"#999999","CmFont-UI-LightWeight":300,"CmFont-UI-NormalWeight":400,"CmFont-UI-BoldWeight":600,"CmFont-UI-LineHeight":"18px","CmFont-UI-Size":"13px","CmFont-UI-SizeSmall":"11px","CmFont-UI-Family":"'Open Sans', arial, helvetica, sans-serif","CmFont-UI-Weight":400,"CmFont-UI-Color":"#666666","CmFont-UI-ColorOpposite":"#ffffff","CmFont-UI-H1-LineHeight":"32px","CmFont-UI-H1-Size":"24px","CmFont-UI-H1-Weight":300,"CmFont-UI-H1-Color":"#666666","CmFont-UI-H4-LineHeight":"24px","CmFont-UI-H4-Size":"16px","CmFont-UI-H4-Weight":300,"CmFont-UI-H4-Color":"#666666","CmBorder-Radius":"3px","CmBorder-Width":"1px","CmBorder-BoxWidth":"2px","CmBorder-TemporaryWidth":"2px","CmBorder-Default":["1px","solid","#cccccc"],"CmBorder-Separator":["1px","dotted","#cccccc"],"CmBorder-Editable":["1px","dashed","#2985e0"],"CmBorder-Box":["2px","solid","#cccccc"],"CmBorder-BoxHover":["2px","solid","#a6a6a6"],"CmBorder-BoxActive":["2px","solid","#2985e0"],"CmBorder-BoxSelected":["2px","solid","#a6ccf2"],"CmBorder-Temporary":["2px","dashed","#cccccc"],"CmBorder-TemporaryHover":["2px","dashed","#a6a6a6"],"CmBorder-TemporaryActive":["2px","dashed","#2985e0"],"CmBorder-TemporarySelected":["2px","dashed","#a6ccf2"],"CmButton-PaddingX":"12px","CmInput-Padding":"6px","CmInput-DefaultBackground":"#ffffff","CmInput-HoverBackground":"#ffffff","CmInput-ActiveBackground":"#ffffff","CmInput-DisabledBackground":"#fafafa","CmTextarea-Height":"100px","CmSelect-Size":7,"CmScrollBar-Size":"12px","CmScrollBar-TrackBackground":"#fafafa","CmScrollBar-TrackColor":"#dbdbdb","CmScrollBar-TrackColorHover":"#cccccc","CmForm-FieldHeight":"28px","CmForm-FieldIndent":"16px","CmForm-FieldTitleWidth":"156px","CmForm-FieldTitleWidthSpaceless":"128px","CmForm-FieldInnerIndent":"8px","CmForm-FieldSmallWidth":"210px","CmForm-ButtonsIndent":"12px","CmForm-IconsIndent":"8px","CmForm-ImageBox-ButtonWidth":"100px","CmForm-Cols-Names":["one","two","three","four","five","six","seven","eight","nine","ten"],"CmForm-Cols-Indent":"2%","CmForm-FilesList-Count":3,"CmCounter-Size":"16px","CmCounter-Border":"1px","CmCounter-Radius":"16px","PtBox-BorderWidth":"1px","PtBox-BorderColor":"#cccccc","PtBoxItem-Sizes":[50,80,150],"PtBoxItem-DescrLines":1,"PtBoxContent-Indent":"48px","PtBoxContent-Indents":["0px","4px","8px","12px","16px","24px","32px","48px","64px","96px"],"PtBoxCode-PaddingY":"8px","PtBoxCode-PaddingX":"12px","PtMenu-IndentY":"4px","PtMenu-IndentX":"0px","PtMenu-BorderWidth":"1px","PtMenu-BorderColor":"#cccccc","PtMenu-ItemIndentY":"2px","PtMenu-ItemIndentX":"12px","PtMenu-SeparatorIndentX":"12px","PtMenu-SeparatorSize":"1px","PtMenu-SeparatorColor":"#cccccc","PtMenu-Dropdown-IndentX":"0px","PtMenu-Dropdown-IndentY":"0px","PtLinks-Indent":"4px","PtImage-Background":"#fafafa","PtImage-TitlePaddingTop":"4px","PtImage-Color":"#ffffff","PtRange-Size":"24px","PtRange-Height":"200px","PtRange-Drag-Color":"#000000","PtListingItems-Count":10,"PtListingItems-PaddingY":"2px","PtListingItems-PaddingX":"4px","PtListingItems-Indent":"1px","PtListingCounters-Indent":"4px","PtListingCounters-Height":"24px","PtColumns-Indent":"24px","PtColumns-Indents":["0px","4px","8px","12px","16px","24px","32px","48px","64px","96px"],"PtColumns-AdaptiveFrom":"768px","PtGrid-Indent":"24px","PtGrid-Indents":["0px","4px","8px","12px","16px","24px","32px","48px","64px","96px"],"PtSelectable-Hover-Background":"#fafafa","PtSelectable-Hover-Border":"#f2f2f2","PtSelectable-Active-Background":"#f6fafd","PtSelectable-Active-Border":"#d8e8f8","PtToolbar-GroupIndent":"16px","PtToolbar-ItemIndent":"4px","PtToolbar-ItemIndents":"24px","PtToolbar-XXXSmall":"32px","PtToolbar-XXSmall":"56px","PtToolbar-XSmall":"76px","PtToolbar-Small":"100px","PtToolbar-Medium":"150px","PtToolbar-Large":"250px","PtToolbar-XLarge":"350px","PtLineShare-Size":"32px","PtLineShare-Indent":"8px","PtGridlist-AdaptiveFrom":"768px","PtGridlist-FontSize":"13px","PtGridlist-Title-FontSize":"13px","PtGridlist-Title-DefaultBackground":"transparent","PtGridlist-Title-HoverBackground":"#e9f2fb","PtGridlist-Title-ActiveBackground":"#d8e8f8","PtGridlist-Cell-Padding":"6px","PtGridlist-Cell-SpaceSize":"1px","PtGridlist-Cell-SpaceBorder":["1px","solid","transparent"],"PtGridlist-Cell-FontSize":"13px","PtGridlist-Cell-DefaultBackground":"transparent","PtGridlist-Cell-HoverBackground":"#e9f2fb","PtGridlist-Cell-ActiveBackground":"#d8e8f8","PtGridlist-Cell-ActiveHoverBackground":"#c2dbf4","PtGridlist-Cell-SuccessBackground":"#daf6da","PtGridlist-Cell-SuccessHoverBackground":"#c6f1c6","PtGridlist-Cell-WarningBackground":"#f8ecd8","PtGridlist-Cell-WarningHoverBackground":"#f4e2c2","PtGridlist-Cell-DangerBackground":"#f7d9d9","PtGridlist-Cell-DangerHoverBackground":"#f3c4c4","PtGridlist-Title-HasBackground-Default":"#fafafa","PtGridlist-Title-HasBackground-Hover":"#f2f2f2","PtGridlist-Cell-HasBackground-Default":"#fafafa","PtGridlist-Cell-HasBackground-Hover":"#f2f2f2","PtDnD-Area-Padding":"16px","PtDnD-Area-BorderRadius":"3px","PtDnD-DropDuration":"400ms","PtDnD-MoveDuration":"200ms","PtDnD-Chassis-HighlightIndent":"24px","PtDnD-Area-ActiveBackground":"rgba(54, 140, 226, 0.12)","PtDnD-Area-ActiveBorder":["1px","dashed","#2985e0"],"PtDnD-Area-HighlightBackground":"rgba(54, 140, 226, 0.05)","PtDnD-Area-HighlightBorder":["1px","dashed","rgba(41, 133, 224, 0.3)"],"ComDashboard-Area-Padding":0,"ComDashboard-Widget-Indent":"24px","ComDashboard-Placeholder-Height":"48px","PtEditable-HoverBackground":"rgba(255, 255, 255, 0.5)","PtEditable-ActiveBackground":"rgba(255, 255, 255, 0.5)","PtEditable-Drag-DefaultBackground":"#fafafa","PtEditable-Drag-HoverBackground":"#f2f2f2","PtEditable-Drag-ActiveBackground":"#d8e8f8","PtDrag-Vertical-Width":"48px","PtDrag-Vertical-Height":"16px","PtDrag-Vertical-Icon-Width":"18px","PtDrag-Vertical-Icon-Height":"6px","PtDrag-Horizontal-Width":"16px","PtDrag-Horizontal-Height":"32px","PtDrag-Horizontal-Icon-Width":"6px","PtDrag-Horizontal-Icon-Height":"14px","PtDrag-DefaultBackground":"#fafafa","PtDrag-DefaultBorder":"#cccccc","PtDrag-HoverBackground":"#f2f2f2","PtDrag-HoverBorder":"#a6a6a6","PtDrag-ActiveBackground":"#d8e8f8","PtDrag-ActiveBorder":"#79b2ec","PtDrag-Line-Size":"2px","PtDrag-Line-DefaultBackground":"#e8e8e8","PtDrag-Line-HoverBackground":"#e8e8e8","PtDrag-Line-ActiveBackground":"#2985e0","PtRuler-Line-Size":"2px","PtRuler-Line-Indent":"12px","PtRuler-Line-DefaultBackground":"#e8e8e8","PtRuler-Line-HoverBackground":"#e8e8e8","PtRuler-Line-ActiveBackground":"#2985e0","PtOverlay-Default":"rgba(255, 255, 255, 0.7)","PtOverlay-Light":"rgba(255, 255, 255, 0.7)","PtOverlay-Dark":"rgba(0, 0, 0, 0.7)","PtOverlay-Duration":"250ms","LtCollapsible-SidebarWidth":"350px","LtCollapsible-Duration":"500ms","LtComment-InnerIndent":"4px","LtForum-AdaptiveFrom":"768px","LtForum-PostBackground":"#fafafa","LtForum-PostBackgroundFeatured":"#f6fafd","LtForum-PostTitleBackground":"#e8e8e8","LtForum-PostLeftColumnSize":"174px","LtProfile-LeftColumn":"174px","LtPost-Indent":"32px","LtPost-Image-Size":"172px","LtPost-Image-Indent":"16px","ComCalendar-CellHeight":"21px","ComCalendar-CellBorderRadius":"2px","ComCalendar-Outer-Background":"transparent","ComCalendar-Outer-BackgroundHover":"transparent","ComCalendar-Outer-BorderSize":0,"ComCalendar-Outer-Border":"transparent","ComCalendar-Outer-BorderHover":"transparent","ComCalendar-Inner-Background":"#fafafa","ComCalendar-Inner-BackgroundHover":"#f2f2f2","ComCalendar-Inner-BorderSize":"1px","ComCalendar-Inner-Border":"#e8e8e8","ComCalendar-Inner-BorderHover":"#dbdbdb","ComCalendar-Weekend-Background":"#e8e8e8","ComCalendar-Weekend-BackgroundHover":"#dbdbdb","ComCalendar-Weekend-BorderSize":"1px","ComCalendar-Weekend-Border":"#e8e8e8","ComCalendar-Weekend-BorderHover":"#dbdbdb","ComCalendar-Today-Background":"","ComCalendar-Today-BackgroundHover":"#c2dbf4","ComCalendar-Today-BorderSize":"2px","ComCalendar-Today-Border":"#2985e0","ComCalendar-Today-BorderHover":"#1d73c9","ComCalendar-Active-Background":"#d8e8f8","ComCalendar-Active-BackgroundHover":"#c2dbf4","ComCalendar-Active-BorderSize":"1px","ComCalendar-Active-Border":"#2985e0","ComCalendar-Active-BorderHover":"#1d73c9","ComBigCalendar-BorderWidth":"1px","ComBigCalendar-BorderColor":"#cccccc","ComBigCalendar-Border":["1px","solid","#cccccc"],"ComBigCalendar-Background":"#ffffff","ComCalendarEvent-TooltipWidth":"320px","ComCalendarEvent-Padding":"4px","ComCalendarEvent-LineHeight":"18px","ComCalendarEvent-Short-Indent":"1px","ComCalendarEvent-Short-Height":"20px","ComCalendarEvent-Long-Indent":"12px","ComCalendarTable-Border":["1px","solid","#cccccc"],"ComCalendarTable-Default-Background":"#ffffff","ComCalendarTable-Default-BackgroundHover":"#f2f2f2","ComCalendarTable-Inactive-Background":"#ffffff","ComCalendarTable-Inactive-BackgroundHover":"#f2f2f2","ComCalendarTable-Weekend-Background":"#e8e8e8","ComCalendarTable-Weekend-BackgroundHover":"#dbdbdb","ComCalendarTable-Today-Background":"#f6fafd","ComCalendarTable-Today-BackgroundHover":"#e9f2fb","ComCalendarTable-Active-Background":"#d8e8f8","ComCalendarTable-Active-BackgroundHover":"#c2dbf4","ComCalendarAgenda-Day-Indent":"24px","ComCalendarAgenda-Day-Padding":"12px","ComCalendarAgenda-Day-Width":"72px","ComCalendarWeek-Day-Indent":"4px","ComCalendarWeek-Item-Height":"20px","ComCalendarMonth-Item-Count":3,"ComCalendarMonth-Item-LineHeight":"18px","ComCalendarMonth-Item-Height":"20px","ComCalendarMonth-Item-Indent":"1px","ComCalendarMonth-Day-Indent":"4px","ComCalendarMonth-Day-Items":5,"ComCalendarMonth-Day-Height":"104px","ComColumns-AdaptiveFrom":"768px","ComColumns-Indent":"24px","ComColumns-Indents":["0px","4px","8px","12px","16px","24px","32px","48px","64px","96px"],"ComColumns-MinHeight":"64px","ComColumns-HoverBackground":"rgba(0, 0, 0, 0.01)","ComColumns-ActiveBackground":"rgba(0, 0, 0, 0.01)","ComColumns-Ruler-DefaultBackground":"rgba(250, 250, 250, 0.8)","ComColumns-Ruler-ActiveBackground":"rgba(246, 250, 253, 0.8)","ComSpacer-HoverBackground":"rgba(0, 0, 0, 0.01)","ComSpacer-ActiveBackground":"#f6fafd","ComBoxTools-Width":"210px","ComBoxTools-LineSize":"28px","ComBoxTools-LineIndent":"4px","ComBoxTools-LinkSize":"24px","ComBoxTools-LinkIndent":"4px","ComPositionTools-Item-Size":"24px","ComPositionTools-Item-Indent":"4px","ComRepeatTools-Item-Size":"38px","ComRepeatTools-Item-Indent":"6px","ComScaleTools-Item-Size":"38px","ComScaleTools-Item-Indent":"6px","ComDatepicker-Width":"210px","ComDatepicker-TooltipWidth":"210px","ComTimeSelect-Width":"210px","ComTimeSelect-Indent":"24px","ComColorPalette-Size":"200px","ComColorPalette-Drag-Size":"16px","ComColorPicker-Width":"210px","ComFileDropzone-Height":"128px","ComFileDropzone-Duration":"250ms","ComImageInput-Height":"128px","ComImageInput-CoverBackground":"rgba(0, 0, 0, 0.7)","ComImageInput-CoverDelay":"300ms","ComImageInput-ButtonsIndent":"4px","CmMultipleFileInput-Count":3,"ComDialog-Duration":"250ms","ComDialog-Indent":"24px","ComDialog-TitleIndent":"12px","ComDialog-Overlay":"rgba(0, 0, 0, 0.7)","ComDialog-Default-Background":"#ffffff","ComDialog-Black-Background":"#111111","ComDialog-Black-TitleColor":"#ffffff","ComDialog-Light-Overlay":"rgba(255, 255, 255, 0.7)","ComDialog-Light-Background":"#ffffff","ComDialog-Light-TitleColor":"#ffffff","ComDialog-Light-TitleBackground":"#2985e0","ComDialog-Box-Indent":"24px","ComTabset-AdaptiveFrom":"768px","ComTabset-BorderColor":"#cccccc","ComTabset-BorderRadius":"3px","ComTabset-BorderWidth":"1px","ComTabset-Border":["1px","solid","#cccccc"],"ComTabset-BorderOverlap":"#ffffff","ComTabset-BorderOverlapRadius":0,"ComTabset-Duration":"250ms","ComTabset-Column-Width":"256px","ComTabset-Content-Background":"#ffffff","ComTabset-Tabs-Height":"28px","ComTabset-Tabs-Indent":"4px","ComTabset-Tabs-IndentInner":"12px","ComTabset-Tabs-IndentBetween":"-1px","ComTabset-Tabs-HorizontalIndent":"24px","ComTabset-Tabs-VerticalIndent":"24px","ComTabset-Tabs-FontSize":"13px","ComTabset-Tabs-DefaultBackground":"#e8e8e8","ComTabset-Tabs-HoverBackground":"#f2f2f2","ComTabset-Tabs-ActiveBackground":"#ffffff","ComTabset-TabsTitle-Background":"#fafafa","ComTabset-Tabs-ImageSize":"24px","ComTabset-Tabs-TitleIndent":"8px","ComPagination-Duration":"250ms","ComToggleBox-AdaptiveFrom":"768px","ComToggleBox-Size":"32px","ComToggleBox-SizeMedium":"24px","ComToggleBox-SizeUI":"24px","ComToggleBox-SizeBase":"24px","ComToggleBox-HasBackground-TitleIndentX":"8px","ComToggleBox-HasBackground-TitleIndentY":"0px","ComToggleBox-HasBackground-TitleIndent":["0px","8px"],"ComToggleBox-HasBackground-TitleBorderRadius":"3px","ComToggleBox-ContentBackgroundNormal":"#fafafa","ComToggleBox-ContentBackgroundHover":"#f2f2f2","ComToggleBox-ContentSpaceBorder":["1px","solid","transparent"],"ComToggleBox-Theme":"Light","ComToggleBox-HasBackground-TitleTheme":"Light","ComToggleBox-ThemeLight-TitleColorNormal":"#666666","ComToggleBox-ThemeLight-TitleColorHover":"#1d73c9","ComToggleBox-ThemeLight-TitleColorActive":"#666666","ComToggleBox-ThemeLight-TitleIcon":"../img/MagpieUI/icons/small/arrow-right.png","ComToggleBox-ThemeLight-TitleBackgroundNormal":"#e8e8e8","ComToggleBox-ThemeLight-TitleBackgroundHover":"#c2dbf4","ComToggleBox-ThemeLight-TitleBackgroundActive":"#e8e8e8","ComToggleBox-ThemeDark-TitleColorNormal":"#ffffff","ComToggleBox-ThemeDark-TitleColorHover":"#c2dbf4","ComToggleBox-ThemeDark-TitleColorActive":"#ffffff","ComToggleBox-ThemeDark-TitleIcon":"../img/MagpieUI/icons/small/arrow-white-right.png","ComToggleBox-ThemeDark-TitleBackgroundNormal":"#2985e0","ComToggleBox-ThemeDark-TitleBackgroundHover":"#1d73c9","ComToggleBox-ThemeDark-TitleBackgroundActive":"#2985e0","ComSelect-ListCount":7,"ComSelect-MultiListCount":5,"ComAutocomplete-ListCount":7,"ComTagsInput-itemIndent":"12px","ComTagsInput-itemWidth":"250px","ComTagsInput-inputWidth":"200px","ComZoom-Background":"#111111","ComGallery-Background":"#111111","ComGalleryControls-Button-Size":"12px","ComGalleryLayout-ArrowWidth":"24px","ComGalleryLayout-SizesCount":12,"ComSlider-Duration":"500ms","AppPath-Images":"../img","AppPath-Fonts":"../fonts"};
if(cm._baseUrl.indexOf('serdidg.github.io') > -1){
    cm._baseUrl = [cm._baseUrl, '/MagpieUI/docs/build'].join('/');
}else{
    cm._baseUrl = [cm._baseUrl, 'docs/build'].join('/');
}
cm.define('Docs.DynamicForm', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'formName' : 'dynamic'
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'text' : cm.node('textarea'),
        'button' : cm.node('button')
    };
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        new cm.Finder('Com.Form', that.params['formName'], that.nodes['container'], process);
    };

    var process = function(classObject){
        that.components['form'] = classObject;
        cm.addEvent(that.nodes['button'], 'click', executeAction);
    };

    var executeAction = function(){
        var value = "that.components['form']" + that.nodes['text'].value;
        try{
            eval(value);
        }catch(e){
        }
    };

    /* ******* PUBLIC ******* */

    init();
});
cm.define('Docs.DynamicToolbar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : ''
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'text' : cm.node('textarea'),
        'button' : cm.node('button')
    };
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        render();
        that.triggerEvent('onRender');
    };

    var render = function(){
        new cm.Finder('Com.Toolbar', that.params['name'], that.nodes['container'], process);
    };

    var process = function(classObject){
        that.components['toolbar'] = classObject;
        cm.addEvent(that.nodes['button'], 'click', executeAction);
    };

    var executeAction = function(){
        var value = "that.components['toolbar']" + that.nodes['text'].value;
        try{
            eval(value);
        }catch(e){

        }
    };

    /* ******* PUBLIC ******* */

    init();
});
window.Collector = new Com.Collector({
        'autoInit' : true
    })
    .addEvent('onConstruct', function(collector, data){
        Part.Menu();
        Part.Autoresize(data['node']);
    });

cm.onReady(function(){
    window.Collector.construct();
});