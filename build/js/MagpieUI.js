// TinyColor v1.2.1
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function() {

var trimLeft = /^[\s,#]+/,
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
        hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
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
        return this.replace(/^\s+|\s+$/g, '');
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

 ******* */

var cm = {
        '_version' : '3.11.0',
        '_loadTime' : Date.now(),
        '_debug' : true,
        '_debugAlert' : false,
        '_deviceType' : 'desktop',
        '_deviceOrientation' : 'landscape',
        '_baseUrl': [window.location.protocol, window.location.hostname].join('//'),
        '_scrollSize' : 0,
        '_pageSize' : {},
        '_clientPosition' : {'left' : 0, 'top' : 0},
        '_config' : {
            'animDuration' : 300,
            'animDurationQuick' : 150,
            'hideDelay' : 300,
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
        },
        'MAX_SAFE_INTEGER' : 9007199254740991
    },
    Mod = {},
    Part = {},
    Com = {
        'Elements' : {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window['localStorage'] !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;
cm.isTouch = 'ontouchstart' in document.documentElement || !!window.maxTouchPoints || !!navigator.maxTouchPoints;

/* ******* OBJECTS AND ARRAYS ******* */

cm.top = window.top.cm || cm;

cm.isType = function(o, types){
    if(cm.isString(types)){
        return Object.prototype.toString.call(o) === '[object ' + types +']'
    }
    if(cm.isRegExp(types)){
        return types.test(Object.prototype.toString.call(o));
    }
    if(cm.isObject(types)){
        var match = false;
        cm.forEach(types, function(type){
            if(!match){
                match = Object.prototype.toString.call(o) === '[object ' + type +']'
            }
        });
        return match;
    }
    return false;
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

cm.isWindow = function(o) {
    return Object.prototype.toString.call(o) === '[object Window]' || Object.prototype.toString.call(o) === '[object global]';
};

cm.isNode = function(node){
    return !!(node && node.nodeType);
};

cm.isTextNode = function(node){
    return !!(node && node.nodeType && node.nodeType == 3);
};

cm.isElementNode = function(node){
    return !!(node && node.nodeType && node.nodeType == 1);
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
    if(!o2){
        o2 = {};
    }
    if(!o1){
        o1 = {}
    }else if(cm.isObject(o1) || cm.isArray(o1)){
        o1 = cm.clone(o1);
    }else{
        return cm.clone(o2);
    }
    cm.forEach(o2, function(item, key){
        if(item !== null){
            try{
                if(item._isComponent){
                    o1[key] = item;
                }else if(cm.isObject(item) && item.constructor != Object){
                    o1[key] = item;
                }else if(cm.isObject(item)){
                    o1[key] = cm.merge(o1[key], item);
                }else{
                    o1[key] = item;
                }
            }catch(e){
                o1[key] = item;
            }
        }
    });
    return o1;
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
    return Array.prototype.indexOf.call(a, item)
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
        if(typeof value == 'object'){
            newO[key] = cm.objectReplace(value, vars);
        }else{
            newO[key] = cm.strReplace(value, vars);
        }
    });
    return newO;
};

cm.isEmpty = function(el){
    if(!el){
        return true;
    }else if(typeof el == 'string' || cm.isArray(el)){
        return el.length == 0;
    }else if(cm.isObject(el)){
        return cm.getLength(el) === 0;
    }else if(typeof el == 'number'){
        return el == 0;
    }else{
        return false;
    }
};

cm.objectSelector = function(name, obj, apply){
    obj = typeof obj == 'undefined'? window : obj;
    name = name.split('.');
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
        return function(){}
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
            if(e.touches){
                o['left'] = e.touches[0].clientX;
                o['top'] = e.touches[0].clientY;
            }
        }catch(e){}
    }
    return o;
};

cm.crossEvents = function(key){
    var events = {
        'mousedown' : 'touchstart',
        'mouseup' : 'touchend',
        'mousemove' : 'touchmove'
    };
    return events[key];
};

cm.addEvent = function(el, type, handler, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    // Process touch events
    if(cm.isTouch && cm.crossEvents(type)){
        el.addEventListener(cm.crossEvents(type), handler, useCapture);
        return el;
    }
    try{
        el.addEventListener(type, handler, useCapture);
    }catch(e){
        el.attachEvent('on' + type, handler);
    }
    return el;
};

cm.removeEvent = function(el, type, handler, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    // Process touch events
    if(cm.isTouch && cm.crossEvents(type)){
        el.removeEventListener(cm.crossEvents(type), handler, useCapture);
        return el;
    }
    try{
        el.removeEventListener(type, handler, useCapture);
    }catch(e){
        el.detachEvent('on' + type, handler);
    }
    return el;
};

cm.triggerEvent = function(el, type, params){
    var event;
    if(cm.isTouch && cm.crossEvents(type)){
        type = cm.crossEvents(type);
    }
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
                        return cm.getNodeOffsetIndex(a['node']) > cm.getNodeOffsetIndex(b['node']) ? -1 : 1;
                    }
                    return cm.getNodeOffsetIndex(a['node']) > cm.getNodeOffsetIndex(b['node']) ? 1 : -1;
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
                            case 'all':
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

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    node = node || document;
    if(node.getElementsByClassName){
        return node.getElementsByClassName(str);
    }
    var els = node.getElementsByTagName('*'), arr = [];
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
        value,
        el = document.createElement(args[0]);
    if(typeof args[1] == "object" && !args[1].nodeType){
        for(var i in args[1]){
            value = args[1][i];
            if(typeof value == 'object'){
                value = JSON.stringify(value);
            }
            if(i == 'style'){
                el.style.cssText = value;
            }else if(i == 'class'){
                el.className = value;
            }else if(i == 'innerHTML'){
                el.innerHTML = value;
            }else{
                el.setAttribute(i, value);
            }
        }
        i = 2;
    }else{
        i = 1;
    }
    for(var ln = args.length; i < ln; i++){
        if(typeof arguments[i] != 'undefined'){
            if(typeof arguments[i] == 'string' || typeof args[i] == 'number'){
                el.appendChild(document.createTextNode(args[i]));
            }else{
                el.appendChild(args[i]);
            }
        }
    }
    return el;
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
            el = el.parentNode
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
    while(node.childNodes.length != 0){
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
    if(cm.isNode(node) && cm.isNode(target)){
        target.parentNode.insertBefore(node, target);
    }
    return node;
};

cm.insertAfter = function(node, target){
    if(cm.isNode(node) && cm.isNode(target)){
        var before = target.nextSibling;
        if(before != null){
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
    if(!str){
        return null;
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
            if(i == 0 && cm.isEmpty(separator)){
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
                    if(o[name] == el[i].value){
                        el[i].checked = true;
                    }
                    break;

                case 'checkbox':
                    el[i].checked = !!+o[name];
                    break;

                default:
                    if(el[i].tagName.toLowerCase() == 'select'){
                        cm.setSelect(el[i], o[name]);
                    }else{
                        el[i].value = o[name];
                    }
                    break;
            }
        }
    });
    return form;
};

cm.getFDO = function(o, chbx){
    var data = {},
        elements = [
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
                if(index == ''){
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
            str = str.replace(new RegExp(key, 'g'), item);
        });
    }
    return str;
};

cm.reduceText = function(str, length, points){
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '...' : '');
    }else{
        return str;
    }
};

cm.removeDanger = function(str){
    return str.replace(/(\<|\>|&lt;|&gt;)/gim, '');
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
        (number % 100 > 4 && number % 100 < 20)
            ?
            2
            :
            cases[(number % 10 < 5) ? number % 10 : 5]
        ];
};

cm.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

cm.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

/* ******* DATE AND TIME ******* */

cm.getCurrentDate = function(format){
    format = format || cm._config['dateTimeFormat'];
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs){
    var str = format,
        formats = function(date){
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
            }
        };

    langs = cm.merge({
        'months' : [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        'days' : [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ]
    }, langs);

    cm.forEach(formats(date), function(item, key){
        str = str.replace(key, item);
    });
    return str;
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
                date.setFullYear(value);
            },
            'mm' : function(value){
                date.setMonth(value - 1);
            },
            'dd' : function(value){
                date.setDate(value);
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
    return o[key] || o;
};

cm.getScrollBarSize = (function(){
    var node;
    return function(){
        !node && (node = cm.insertFirst(cm.Node('div', {'class' : 'cm__scroll-bar-size-checker'}), document.body));
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
    if(openDurationRule){
        if(openDurationProperty = openDurationRule.style[cm.getSupportedStyle('transitionDuration')]){
            if(openDurationProperty.match('ms')){
                return parseFloat(openDurationProperty);
            }else if(openDurationProperty.match('s')){
                return (openDurationProperty) / 1000;
            }else{
                return parseFloat(openDurationProperty);
            }
        }
    }
    return 0;
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

cm.inRange = function(a1, b1, a2, b2){
    return a1 >= a2 && a1 <= b2 || b1 >= a2 && b1 <= b2 || a2 >= a1 && a2 <= b1
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
            properties = [];
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

        var start = Date.now();
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
    };

    that.stop = function(){
        for(var i in processes){
            processes[i] = false;
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
            'method' : 'post',                                       // post | get
            'params' : '',
            'url' : '',
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
            config['params'] = cm.obj2URI(config['params']);
        }
        // Build request link
        if(config['method'] != 'post'){
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
        if(config['method'] == 'post'){
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
            config['url'] = cm.strReplace(config['url'], {'%callback%' : callbackSuccessName, '%25callback%25' : callbackSuccessName});
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

cm.defineStack = {};

cm.defineHelper = function(name, data, handler){
    var that = this;
    // Process config
    data = cm.merge({
        'modules' : [],
        'require' : [],
        'params' : {},
        'events' : []
    }, data);
    // Create class extend object
    that.build = {
        '_raw' : data,
        '_name' : {
            'full' : name,
            'short' : name.replace('.', ''),
            'split' : name.split('.')
        },
        '_modules' : {},
        'params' : data['params']
    };
    // Extend class by predefine module
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
    // Prototype class
    handler.prototype = that.build;
    // Extend Window object
    cm.objectSelector(that.build._name['full'], window, handler);
    // Add to defined stack
    cm.defineStack[name] = handler;
};

cm.define = (function(){
    var definer = Function.prototype.call.bind(cm.defineHelper, arguments);
    return function(){
        definer.apply(cm.defineHelper, arguments);
    };
})();

cm.getConstructor = function(className, callback){
    var classConstructor;
    callback = typeof callback != 'undefined' ? callback : function(){}
    if(!className || className == '*'){
        cm.forEach(cm.defineStack, function(classConstructor){
            callback(classConstructor, className);
        });
        return cm.defineStack;
    }else{
        classConstructor = cm.defineStack[className];
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
            callback(classConstructor, className);
            return classConstructor;
        }
    }
};

cm.find = function(className, name, parentNode, callback){
    if(!className || className == '*'){
        var classes = [];
        cm.forEach(cm.defineStack, function(classConstructor){
            if(classConstructor.prototype.findInStack){
                classes = cm.extend(classes, classConstructor.prototype.findInStack(name, parentNode, callback));
            }
        });
        return classes;
    }else{
        var classConstructor = cm.defineStack[className];
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
            return classConstructor.prototype.findInStack(name, parentNode, callback);
        }
    }
    return null;
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
            'multiple' : false
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
            that.remove();
        }
    };

    that.remove = function(){
        cm.getConstructor(className, function(classConstructor){
            classConstructor.prototype.removeEvent(params['event'], watcher);
        });
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
                        cm.defineStack[that._name['full']].prototype[key] = item;
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
    },
    'setParams' : function(params, replace){
        var that = this;
        replace = typeof replace == 'undefined'? false : replace;
        that.params = cm.merge(replace ? that._raw.params : that.params, params);
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
                    break
            }
        });
        return that;
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
        if(!that.build['params']['events']){
            that.build['params']['events'] = {};
        }
        that.build['events'] = {};
        cm.forEach(that.build._raw['events'], function(item){
            that.build['events'][item] = [];
            that.build[item] = function(handler){
                var that = this;
                that.addEvent(item, handler);
                return that;
            };
        });
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
                item(that, params || {});
            });
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
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
        if(typeof that.params['langs'][str] == 'undefined'){
            that.params['langs'][str] = str;
        }
        langStr = that.params['langs'][str];
        // Process variables
        langStr = cm.strReplace(langStr, vars);
        return langStr;
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            that.params['langs'] = cm.merge(that.params['langs'], o);
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
        if(typeof that.build['params']['nodesDataMarker'] == 'undefined'){
            that.build['params']['nodesDataMarker'] = 'data-node';
        }
        if(typeof that.build['params']['nodesMarker'] == 'undefined'){
            that.build['params']['nodesMarker'] = that.build._name['short'];
        }
        if(!that.build['nodes']){
            that.build['nodes'] = {};
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
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set.'].join(' ')
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
        that._stackItem = {
            'name' : that.params['name'],
            'node' : node,
            'class' : that,
            'className' : that._name['full']
        };
        that._stack.push(that._stackItem);
        return that;
    },
    'removeFromStack' : function(){
        var that = this;
        cm.arrayRemove(that._stack, that._stackItem);
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
        parent = parent || document.body;
        callback = typeof callback == 'function' ? callback : function(){};
        cm.forEach(that._stack, function(item){
            if((cm.isEmpty(name) || item['name'] == name) && cm.isParent(parent, item['node'], true)){
                items.push(item);
                callback(item['class'], item, name);
            }
        });
        return items;
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
    },
    'appendStructure' : function(node){
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

    var setEvents = function(item){
        var target;
        cm.addEvent(item['node'], 'mouseover', function(e){
            e = cm.getEvent(e);
            target = cm.getObjFromEvent(e);
            if(!cm.isParent(item['drop'], target, true)){
                checkPosition(item);
            }
        });
        cm.addEvent(item['node'], 'mousedown', function(e){
            e = cm.getEvent(e);
            target = cm.getObjFromEvent(e);
            if(cm.getStyle(item['drop'], 'visibility') == 'hidden' && !cm.isClass(item['node'], 'is-show')){
                if(!cm.isParent(item['drop'], target, true)){
                    if(cm.isClass(item['node'], 'is-show')){
                        cm.removeClass(item['node'], 'is-show');
                    }else{
                        cm.preventDefault(e);
                        cm.addClass(item['node'], 'is-show');
                    }
                }
            }
        });
        cm.addEvent(document.body, 'mousedown', function(e){
            e = cm.getEvent(e);
            target = cm.getRelatedTarget(e);
            if(!cm.isParent(item['node'], target, true)){
                cm.removeClass(item['node'], 'is-show');
            }
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
        setInterval(checkAction, 500);
        //cm.addEvent(window, 'scroll', disableHover);
    };

    // Actions

    var checkAction = function(){
        checkScrollSize();
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
        var size = cm._scrollSize;

        return function(){
            cm._scrollSize = cm.getScrollBarSize();
            if(size != cm._scrollSize){
                size = cm._scrollSize;
                cm.customEvent.trigger(window, 'scrollSizeChange', {
                    'type' : 'all',
                    'self' : true,
                    'scrollSize' : cm._scrollSize
                })
            }
        };
    })();

    var checkPageSize = function(){
        cm._pageSize = cm.getPageSize();
    };

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
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : true,
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'formData' : true,
            'url' : '',                                             // Request URL. Variables: %baseurl%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseurl%, %callback% for JSONP.
        }
    }
},
function(params){
    var that = this;

    that.ajaxHandler = null;
    that.fields = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__form'},
                that.nodes['form'] = cm.node('form', {'class' : 'form'})
            );
            that.appendStructure(that.nodes['container']);
            cm.remove(that.params['node']);
        }
        // Events
        cm.addEvent(that.nodes['form'], 'submit', function(e){
            cm.preventDefault(e);
            that.send();
        });
    };

    var renderField = function(type, params){
        var fieldParams, field;
        // Merge params
        params = cm.merge({
            'name' : '',
            'label' : '',
            'options' : [],
            'container' : that.nodes['form'],
            'form' : that
        }, params);
        // Render
        if(fieldParams = Com.FormFields.get(type)){
            cm.getConstructor('Com.FormField', function(classConstructor){
                params = cm.merge(fieldParams, params);
                field = new classConstructor(params);
                if(params['field']){
                    that.fields[params['name']] = field;
                }
            });
        }
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseurl%' : cm._baseUrl
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
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.triggerEvent('onSendEnd');
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, response);
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config){
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* ******* PUBLIC ******* */

    that.add = function(type, params){
        renderField(type, params);
        return that;
    };

    that.getAll = function(){
        var o = {};
        cm.forEach(that.fields, function(field, name){
            o[name] = field.get();
        });
        return o;
    };

    that.clear = function(){
        cm.clearNode(that.nodes['form']);
        return that;
    };

    that.reset = function(){
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

    that.setAction = function(o){
        o = cm.merge(that._raw.params['ajax'], o);
        that.params['ajax'] = o;
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
        'node' : cm.Node('div'),
        'container' : cm.node('div'),
        'form' : false,
        'name' : '',
        'type' : false,
        'label' : '',
        'help' : null,
        'placeholder' : '',
        'options' : [],
        'component' : false,
        'componentParams' : {},
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
    that.component = null;
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
        if(that.params['component']){
            cm.getConstructor(that.params['component'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
        that.params['componentParams']['node'] = that.params['node'];
        that.params['componentParams']['name'] = that.params['name'];
        that.params['componentParams']['options'] = that.params['options'];
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
        that.component = that.callbacks.component(that, that.params['componentParams']);
    };

    that.callbacks.component = function(that, params){
        if(that.params['component']){
            return new that.params['constructor'](params);
        }
    };

    that.callbacks.render = function(that){
        var nodes = {};
        nodes['container'] = cm.node('dl',
            nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        if(!cm.isEmpty(that.params['name'])){
            that.params['node'].setAttribute('name', that.params['name']);
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

    that.callbacks.set = function(that, value){
        cm.isFunction(that.component.set) && that.component.set(value);
        return value;
    };

    that.callbacks.get = function(that){
        return cm.isFunction(that.component.get) ? that.component.get() : null;
    };

    that.callbacks.reset = function(that){
        cm.isFunction(that.component.reset) && that.component.reset();
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
        'component' : function(that){
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
        'component' : function(that){
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
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = item.config['value'] == value;
            });
            return value;
        },
        'get' : function(that){
            var value = null;
            cm.forEach(that.component, function(item){
                if(item.nodes['input'].checked){
                    value = item.config['value'];
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'component' : function(that){
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
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = cm.inArray(value, item.config['value']);
            });
            return value;
        },
        'get' : function(that){
            var value = [];
            cm.forEach(that.component, function(item){
                if(item.nodes['input'].checked){
                    value.push(item.config['value']);
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.component, function(item){
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
        'component' : function(that){
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
cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Callbacks'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender',
        'onClear',
        'onSelect',
        'onChange',
        'onClickSelect',
        'onAbort',
        'onError'
    ],
    'params' : {
        'input' : cm.Node('input', {'type' : 'text'}),              // HTML input node.
        'target' : false,                                           // HTML node.
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'clearOnEmpty' : true,                                      // Clear input and value if item didn't selected from tooltip
        'showLoader' : true,                                        // Show ajax spinner in tooltip, for ajax mode only.
        'data' : [],                                                // Examples: [{'value' : 'foo', 'text' : 'Bar'}] or ['Foo', 'Bar'].
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %query%, %callback%.
            'params' : ''                                           // Params object. Variables: %baseurl%, %query%, %callback%.
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
    var that = this,
        requestDelay,
        ajaxHandler;

    that.isOpen = false;
    that.isAjax = false;
    that.components = {};
    that.registeredItems = [];
    that.selectedItemIndex = null;
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        that.callbacksProcess();
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['input'];
        }
        // If URL parameter exists, use ajax data
        that.isAjax = !cm.isEmpty(that.params['ajax']['url']);
        // Convert params object to URI string
        if(cm.isObject(that.params['ajax']['params'])){
            that.params['ajax']['params'] = cm.obj2URI(that.params['ajax']['params']);
        }
        // Prepare data
        that.params['data'] = that.convertData(that.params['data']);
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
        that.setInput(that.params['input']);
        that.triggerEvent('onRender');
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
                    if(that.selectedItemIndex == null){
                        that.selectedItemIndex = listLength - 1;
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
                    if(that.selectedItemIndex == null){
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

    var blurHandler = function(){
        if(!that.isOpen){
            clear();
        }
    };

    var requestHandler = function(){
        var query = that.params['input'].value,
            config = cm.clone(that.params['ajax']);
        // Clear tooltip ajax/static delay and filtered items list
        requestDelay && clearTimeout(requestDelay);
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();

        if(query.length >= that.params['minLength']){
            requestDelay = setTimeout(function(){
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

    var set = function(index){
        var item = that.registeredItems[index];
        if(item){
            that.setRegistered(item, true);
        }
    };

    var clear = function(){
        var item;
        // Kill timeout interval and ajax request
        requestDelay && clearTimeout(requestDelay);
        that.abort();
        // Clear input
        if(that.params['clearOnEmpty']){
            item = that.getRegisteredItem(that.value);
            if(!item || item['data']['text'] != that.params['input'].value){
                that.clear();
            }
        }
    };

    var onChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
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

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config, query){
        config['url'] = cm.strReplace(config['url'], {
            '%query%' : query,
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.strReplace(config['params'], {
            '%query%' : query,
            '%baseurl%' : cm._baseUrl
        });
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
            if(item['text'].toLowerCase().indexOf(query.toLowerCase()) > -1){
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

    that.set = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = typeof item['value'] != 'undefined'? item['value'] : item['text'];
        that.params['input'].value = item['text'];
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
            that.params['input'] = node;
            cm.addEvent(that.params['input'], 'input', requestHandler);
            cm.addEvent(that.params['input'], 'keydown', inputHandler);
            cm.addEvent(that.params['input'], 'blur', blurHandler);
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

    that.convertData = function(data){
        var newData = data.map(function(item){
            if(!cm.isObject(item)){
                return {'text' : item, 'value' : item};
            }else{
                return item;
            }
        });
        return newData;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        if(that.params['clearOnEmpty']){
            that.params['input'].value = '';
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

    that.isOwnNode = function(node){
        return that.components['tooltip'].isOwnNode(node);
    };

    init();
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
        'DataConfig',
        'Langs'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'data' : {},
        'format' : cm._config['displayDateFormat'],
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
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__calendar-events'});
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
        // Insert into DOM
        that.params['node'].appendChild(that.nodes['container']);
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
            })
        }
    };

    var renderTooltip = function(calendar, params){
        var data,
            myNodes = {};

        if((data = that.params['data'][params['year']]) && (data = data[(params['month'] + 1)]) && (data = data[params['day']])){
            // Structure
            myNodes['content'] = cm.Node('div', {'class' : 'pt__listing com__calendar-events-listing'},
                myNodes['list'] = cm.Node('ul', {'class' : 'list'})
            );
            // Foreach events
            cm.forEach(data, function(value){
                myNodes['list'].appendChild(
                    cm.Node('li',
                        cm.Node('a', {'href' : value['url'], 'target' : that.params['target']}, value['title'])
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
        'lineNumbers' : true
    }
},
function(params){
    var that = this;

    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(typeof CodeMirror != 'undefined'){
            that.components['codemirror'] = CodeMirror.fromTextArea(that.params['node'], {
                'lineNumbers': that.params['lineNumbers'],
                'viewportMargin': Infinity,
                'mode': that.params['language']
            });
            that.components['codemirror'].on('change', function(cm){
                that.params['node'].value = cm.getValue();
            });
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.components['codemirror'].refresh();
            });
        }
    };

    /* ******* PUBLIC ******* */

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
        // Left Sidebar
        cm.addEvent(that.nodes['leftButton'], 'click', toggleLeft);
        // Right sidebar
        cm.addEvent(that.nodes['rightButton'], 'click', toggleRight);
        // Check toggle class
        that.isLeftCollapsed = cm.isClass(that.params['node'], 'is-sidebar-left-collapsed');
        that.isRightCollapsed = cm.isClass(that.params['node'], 'is-sidebar-right-collapsed');
        // Check storage
        if(that.params['remember']){
            that.isLeftCollapsed = that.storageRead('isLeftCollapsed');
            that.isRightCollapsed = that.storageRead('isRightCollapsed');
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
        'onRender',
        'onConstructStart',
        'onConstruct',
        'onDestructStart',
        'onDestruct'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'attribute' : 'data-element',
        'autoInit' : false
    }
},
function(params){
    var that = this;

    that.stackList = [];
    that.stackNodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(that.params['autoInit']){
            cm.forEach(cm.defineStack, function(classConstructor){
                that.add(classConstructor.prototype._name['full'], function(node){
                    new classConstructor({
                        'node' : node
                    });
                });
            });
        }
    };

    var findNodes = function(parentNode, name){
        var nodes = [];
        // Find element in specified node
        if(parentNode.getAttribute(that.params['attribute']) == name){
            nodes.push(parentNode)
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

    var constructAll = function(parentNode){
        var processNodes = {};
        cm.forEach(that.stackNodes, function(item, name){
            processNodes[name] = addNodes(parentNode, name);
        });
        cm.forEach(that.stackList, function(item){
            cm.forEach(processNodes[item['name']], function(node){
                item['construct'](node, item['priority']);
            });
        });
    };

    var constructItem = function(parentNode, name){
        var processArray = that.stackList.filter(function(item){
            return item['name'] === name;
        });
        var processNodes = addNodes(parentNode, name);
        cm.forEach(processArray, function(item){
            cm.forEach(processNodes, function(node){
                item['construct'](node, item['priority']);
            });
        });
    };

    var destructAll = function(parentNode){
        if(cm.isNode(parentNode)){
            var processNodes = {};
            cm.forEach(that.stackNodes, function(item, name){
                processNodes[name] = removeNodes(parentNode, name);
            });
            cm.forEach(that.stackList, function(item){
                cm.forEach(processNodes[item['name']], function(node){
                    item['destruct'](node, item['priority']);
                });
            });
        }else{
            cm.forEach(that.stackList, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'](node, item['priority']);
                });
            });
            that.stackNodes = [];
        }
    };

    var destructItem = function(parentNode, name){
        var processArray = that.stackList.filter(function(item){
            return item['name'] === name;
        });
        if(cm.isNode(parentNode)){
            var processNodes = removeNodes(parentNode, name);
            cm.forEach(processArray, function(item){
                cm.forEach(processNodes, function(node){
                    item['destruct'](node, item['priority']);
                });
            });
        }else{
            cm.forEach(processArray, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'](node, item['priority']);
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
                'priority' : priority,
                'construct' : construct,
                'destruct' : destruct
            };
            if(typeof priority != 'undefined' && cm.isNumber(priority)){
                that.stackList.splice(priority, 0, item);
            }else{
                that.stackList.push(item);
            }
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
        if(name){
            constructItem(node, name)
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
        if(name){
            destructItem(node, name)
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
        'container' : false,
        'input' : null,                                     // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'name' : '',
        'value' : null,                                     // Color string: transparent | hex | rgba.
        'defaultValue' : 'transparent',
        'title' : '',
        'showInputValue' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'renderInBody' : true,
        'disabled' : false,
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
            that.nodes['target'] = cm.Node('div', {'class' : 'form-field has-icon-right'},
                that.nodes['input'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
                that.nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['picker']})
            ),
            that.nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                that.nodes['paletteContainer'] = cm.Node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            that.nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            that.nodes['container'].id = that.params['node'].id;
        }
        // Set hidden input attributes
        if(that.params['node'].getAttribute('name')){
            that.nodes['hidden'].setAttribute('name', that.params['node'].getAttribute('name'));
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(that.nodes['container'], 'has-clear-button');
            that.nodes['container'].appendChild(
                that.nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear')})
            );
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(that.nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(that.nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
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
            if(that.params['showInputValue']){
                that.nodes['input'].value = that.lang('Transparent');
            }
            cm.replaceClass(that.nodes['input'], 'input-dark input-light', 'input-transparent');
        }else{
            if(that.params['showInputValue']){
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
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return false;
        }
        cm.preventDefault(e);
        // Current
        if(e.ctrlKey){
            blockContextMenu();
            setEqualDimensions();
            redrawChassis();
        }else if(e.button === 0){
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
            cm.addEvent(window, 'mousemove', move);
            cm.addEvent(window, 'mouseup', stop);
        }else{
            return false;
        }
        return true;
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
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
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
        if(!cm.isTouch && e.button){
            return;
        }
        if(that.current){
            return;
        }
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
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
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
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
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
        'Events'
    ],
    'events' : [
        'onSelect',
        'onChange'
    ],
    'params' : {
        'container' : false,
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
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
    
    that.previous = cm.clone(defaultDate);
    that.selected = cm.clone(defaultDate);

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        // Set selected date
        set(that.params['node'].value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-dateselect'},
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
        /* *** ATTRIBUTES *** */
        // Set hidden input attributes
        if(that.params['node'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', that.params['node'].getAttribute('name'));
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
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
                }
            };
        cm.forEach(formats(o), function(item, key){
            str = str.replace(key, item);
        });
        return str;
    };

    /* ******* MAIN ******* */

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
Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

cm.define('Com.Datepicker', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
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
        'container' : false,
        'input' : null,                      // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'name' : '',
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
            'hideOnReClick' : true,
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

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
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
            nodes['target'] = cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
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
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
    };

    var setLogic = function(){
        // Add events on input to makes him clear himself when user wants that
        cm.addEvent(nodes['input'], 'keydown', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                that.clear();
                components['menu'].hide(false);
            }
        });
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
                    'onShowStart' : show,
                    'onHideStart' : hide
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
                })
                .onChange(function(){
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

    var show = function(){
        // Render calendar month
        if(that.date){
            components['calendar'].set(that.date.getFullYear(), that.date.getMonth())
        }
        components['calendar'].renderMonth();
        // Set classes
        cm.addClass(nodes['container'], 'active');
        that.triggerEvent('onFocus', that.value);
    };

    var hide = function(){
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
            nodes['input'].value = cm.dateFormat(that.date, that.displayFormat, that.lang());
            nodes['hidden'].value = that.value;
        }else{
            that.value = cm.dateFormat(false, that.format, that.lang());
            nodes['input'].value = '';
            nodes['hidden'].value = cm.dateFormat(false, that.format, that.lang());
        }
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
        if(cm.isEmpty(str) || typeof str == 'string' && new RegExp(cm.dateFormat(false, format, that.lang())).test(str)){
            that.clear();
            return that;
        }else if(typeof str == 'object'){
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
        'onCloseStart',
        'onClose'
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
        'theme' : 'theme-default',      // theme css class name, default: theme-default | theme-black
        'className' : '',               // custom css class name
        'content' : cm.Node('div'),
        'title' : '',
        'buttons' : false,
        'titleOverflow' : false,
        'titleReserve': true,
        'closeButtonOutside' : false,
        'closeButton' : true,
        'closeTitle' : true,
        'closeOnBackground' : false,
        'openTime' : 'cm._config.animDuration',
        'autoOpen' : true,
        'appendOnRender' : false,
        'removeOnClose' : true,
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
        nodes = {},
        anim = {};

    that.isOpen = false;
    that.isFocus = false;

    var init = function(){
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
    
    var validateParams = function(){
        if(that.params['size'] == 'fullscreen'){
            that.params['width'] = '100%';
            that.params['height'] = '100%';
            that.params['indentX'] = 0;
            that.params['indentY'] = 0;
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
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
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
            // Remove old nodes
            cm.remove(nodes['title']);
            // Render new nodes
            nodes['title'] = cm.Node('div', {'class' : 'title'}, title);
            if(that.params['titleOverflow']){
                cm.addClass(nodes['title'], 'cm__text-overflow');
            }
            cm.insertFirst(nodes['title'], nodes['windowInner']);
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

    var resize = function(){
        if(that.isOpen){
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
            setHeight = Math.min(Math.max(setHeight, 0), AHeight);
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
                nodes['window'].style.width = [setWidth, 'px'].join('')
            }
        }
        animFrame(resize);
    };

    var open = function(){
        if(!that.isOpen){
            that.isOpen = true;
            if(!cm.inDOM(nodes['container'])){
                that.params['container'].appendChild(nodes['container']);
            }
            nodes['container'].style.display = 'block';
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Add close event on Esc press
            cm.addEvent(window, 'keydown', windowClickEvent);
            // Animate
            anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : that.params['openTime'], 'onStop' : function(){
                // Open Event
                that.triggerEvent('onOpen');
            }});
            // Open Event
            that.triggerEvent('onOpenStart');
        }
    };

    var close = function(){
        if(that.isOpen){
            that.isOpen = false;
            // Remove close event on Esc press
            cm.removeEvent(window, 'keydown', windowClickEvent);
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Animate
            anim['container'].go({
                'style' : {'opacity' : '0'}, 'duration' : that.params['openTime'], 'onStop' : function(){
                    nodes['container'].style.display = 'none';
                    // Close Event
                    that.triggerEvent('onClose');
                    // Remove Window
                    that.params['removeOnClose'] && remove();
                }
            });
            // Close Event
            that.triggerEvent('onCloseStart');
        }
    };

    var remove = function(){
        that.isOpen = false;
        // Remove dialog container node
        cm.remove(nodes['container']);
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            // ESC key
            that.isFocus && close();
        }
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
        remove();
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
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

    /* *** INIT *** */

    var init = function(){
        var areasNodes;

        getCSSHelpers();
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

    var getCSSHelpers = function(){
        that.params['dropDuration'] = cm.getTransitionDurationFromRule('.pt__dnd-helper__drop-duration');
        that.params['moveDuration'] = cm.getTransitionDurationFromRule('.pt__dnd-helper__move-duration');
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
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return;
        }
        cm.preventDefault(e);
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e),
            x = position['left'],
            y = position['top'],
            tempCurrentAboveItem,
            tempCurrentPosition;
        if(!cm.isTouch){
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
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
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
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
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
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
                }
            }else{
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable'}), draggable['node']);
                anim = new cm.Animation(node);
                style = {
                    'height' : '0px',
                    'opacity' : 0
                }
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
        'onSet'
    ],
    'params' : {
        'node' : cm.Node('div'),            // Node, for drag
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
    that.isDrag = false;
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
        cm.addEvent(that.params['target'], 'mousedown', start);
    };

    var start = function(e){
        cm.preventDefault(e);
        if(!cm.isTouch && e.button){
            return;
        }
        if(that.isDrag){
            return;
        }
        that.isDrag = true;
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
        setPosition(that.startX, that.startY);
        // Add move event on document
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
        // Trigger Event
        that.triggerEvent('onStart');
    };

    var move = function(e){
        cm.preventDefault(e);
        var position = cm.getEventClientPosition(e);
        // Calculate dimensions and position
        setPosition(position['left'], position['top']);
        // Trigger Event
        that.triggerEvent('onMove');
    };

    var stop = function(){
        that.isDrag = false;
        // Remove move events attached on document
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // Trigger Event
        that.triggerEvent('onStop');
    };
    
    /* *** HELPERS *** */

    var setPosition = function(x, y){
        var posX = x,
            posY = y;
        if(that.params['node'] === that.params['target']){
            posX += that.nodeStartX - that.startX;
            posY += that.nodeStartY - that.startY;
        }else{
            posX -= that.dimensions['target']['absoluteX1'];
            posY -= that.dimensions['target']['absoluteY1'];
        }
        that.setPosition(posX, posY, true);
    };

    /* ******* MAIN ******* */

    that.getDimensions = function(){
        that.dimensions['target'] = cm.getFullRect(that.params['target']);
        that.dimensions['node'] = cm.getFullRect(that.params['node']);
        that.dimensions['limiter'] = cm.getFullRect(that.params['limiter']);
        return that.dimensions;
    };

    that.setPosition = function(posX, posY, triggerEvents){
        var nodePosY,
            nodePosX;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Check limit
        if(that.params['limiter']){
            if(posY < 0){
                posY = 0;
            }else if(posY > that.dimensions['limiter']['absoluteHeight']){
                posY = that.dimensions['limiter']['absoluteHeight'];
            }
            if(posX < 0){
                posX = 0;
            }else if(posX > that.dimensions['limiter']['absoluteWidth']){
                posX = that.dimensions['limiter']['absoluteWidth'];
            }
        }
        // Limiters
        if(!isNaN(that.params['minY']) && posY < that.params['minY']){
            posY = that.params['minY'];
        }
        // Align node
        nodePosY = posY;
        nodePosX = posX;
        if(that.params['alignNode']){
            nodePosY -= (that.dimensions['node']['absoluteHeight'] / 2);
            nodePosX -= (that.dimensions['node']['absoluteWidth'] / 2);
        }
        // Set styles
        switch(that.params['direction']){
            case 'vertical' :
                that.params['node'].style.top = [nodePosY, 'px'].join('');
                break;
            case 'horizontal' :
                that.params['node'].style.left = [nodePosX, 'px'].join('');
                break;
            default :
                that.params['node'].style.top = [nodePosY, 'px'].join('');
                that.params['node'].style.left = [nodePosX, 'px'].join('');
                break;
        }
        // Trigger Event
        if(triggerEvents){
            that.triggerEvent('onSet', {
                'posY' : posY,
                'posX' : posX,
                'nodePosY' : nodePosY,
                'nodePosX' : nodePosX
            })
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
            item['link'] = cm.Node('a')
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
            'title' : ''
        }, item);
        // Check type
        if(
            /(\.jpg|\.png|\.gif|\.jpeg|\.bmp|\.tga)$/gi.test(item['src']) ||
            /^data:image/gi.test(item['src'])
        ){
            item['type'] = 'image';
        }else{
            item['type'] = 'iframe';
        }
        // Structure
        if(!item['link']){
            item['link'] = cm.Node('a')
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
                item['nodes']['content'] = cm.Node('iframe', {'class' : 'descr'})
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
        if(items[that.current]){
            cm.remove(items[that.current]['nodes']['container']);
            that.current = null;
            that.previous = null;
        }
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
            cm.addClass(nodes['container'], ['cm__aspect', that.params['aspectRatio']].join('-'))
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
        'DataConfig'
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
        'node' : cm.Node('div'),
        'container' : false,
        'data' : [],
        'cols' : [],
        'sort' : true,
        'sortBy' : 'id',                                    // default sort by key in array
        'orderBy' : 'ASC',
        'childsBy' : false,
        'pagination' : true,
        'perPage' : 25,
        'showCounter' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',        // input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat', // render date format
        'langs' : {
            'counter' : 'Count: ',
            'check_all' : 'Check all',
            'uncheck_all' : 'Uncheck all',
            'empty' : 'Items does not found'
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
    var that = this,
        rows = [],
        sortBy,
        orderBy;

    that.nodes = {};
    that.components = {};
    that.isCheckedAll = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['container']){
            that.params['container'] = that.params['node'];
        }
        // Pagination
        that.params['Com.Pagination']['count'] = that.params['data'].length;
        that.params['Com.Pagination']['perPage'] = that.params['perPage'];
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        // Container
        that.params['container'].appendChild(
            that.nodes['container'] = cm.Node('div', {'class' : 'com__gridlist'})
        );
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(that.nodes['container'], that.params['className']);
        // Counter
        if(that.params['showCounter']){
            that.nodes['container'].appendChild(
                cm.Node('div', {'class' : 'pt__gridlist__counter'}, that.lang('counter') + that.params['data'].length)
            );
        }
        // Sort data array for first time
        that.params['sort'] && arraySort(that.params['sortBy']);
        // Render table
        if(that.params['data'].length){
            if(that.params['pagination']){
                that.components['pagination'] = new Com.Pagination(
                    cm.merge(that.params['Com.Pagination'], {
                        'container' : that.nodes['container'],
                        'events' : {
                            'onPageRender' : function(pagination, data){
                                renderTable(data['page'], data['container']);
                            }
                        }
                    })
                );
            }else{
                renderTable(1, that.nodes['container']);
            }
        }else{
            that.nodes['container'].appendChild(
                cm.Node('div', {'class' : 'cm__empty'}, that.lang('empty'))
            );
        }
    };

    var renderTable = function(page, container){
        var start, end;
        /*
        If pagination not exists we need to clean up table before render new one, cause on ech sort will be rendered new table.
        When pagination exists, ech rendered table will be have his own container, and no needs to clean up previous table.
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
        that.nodes['table'] = cm.Node('div', {'class' : 'pt__gridlist'},
            cm.Node('table',
                cm.Node('thead',
                    that.nodes['title'] = cm.Node('tr')
                ),
                that.nodes['content'] = cm.Node('tbody')
            )
        );
        // Render Table Title
        cm.forEach(that.params['cols'], renderTh);
        // Render Table Row
        if(that.params['pagination']){
            end = that.params['perPage'] * page;
            start = end - that.params['perPage'];
        }else{
            end = that.params['data'].length;
            start = 0;
        }
        for(var i = start, l = Math.min(end, that.params['data'].length); i < l; i++){
            renderRow(rows, that.params['data'][i], i);
        }
        // Append
        container.appendChild(that.nodes['table']);
        // API onRenderEnd event
        that.triggerEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : rows
        });
    };

    var renderTh = function(item, i){
        // Config
        item = that.params['cols'][i] = cm.merge({
            'width' : 'auto',               // number | % | auto
            'access' : true,                // Render column if is accessible
            'type' : 'text',		        // text | number | url | date | html | icon | checkbox | empty | actions
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
            'actions' : [],                 // Render actions menu, for type="actions"
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);
        item['nodes'] = {};
        // Check access
        if(item['access']){
            // Structure
            that.nodes['title'].appendChild(
                item['nodes']['container'] = cm.Node('th', {'width' : item['width']},
                    item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
                )
            );
            // Insert specific specified content in th
            switch(item['type']){
                case 'checkbox' :
                    cm.addClass(item['nodes']['container'], 'control');
                    item['nodes']['inner'].appendChild(
                        item['nodes']['checkbox'] = cm.Node('input', {'type' : 'checkbox', 'title' : that.lang('check_all')})
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
                        cm.Node('span', item['title'])
                    );
                    break;
            }
            // Render sort arrow and set function on click to th
            if(!/icon|empty|actions|checkbox/.test(item['type']) && item['sort']){
                cm.addClass(item['nodes']['container'], 'sort');
                if(item['key'] == sortBy){
                    item['nodes']['inner'].appendChild(
                        cm.Node('div', {'class' : that.params['icons']['arrow'][orderBy.toLowerCase()]})
                    );
                }
                cm.addEvent(item['nodes']['inner'], 'click', function(){
                    arraySort(item['key']);
                    if(that.params['pagination']){
                        that.components['pagination'].rebuild();
                    }else{
                        renderTable(1, that.nodes['container']);
                    }
                });
            }
        }
    };

    var renderRow = function(parent, row, i){
        // Config
        var item = {
            'index' : i,
            'data' : row,
            'childs' : [],
            'isChecked' : row['_checked'] || false,
            'status' : row['_status'] || false,
            'nodes' : {
                'cols' : []
            }
        };
        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.Node('tr')
        );
        // Render cells
        cm.forEach(that.params['cols'], function(col){
            renderCell(col, item);
        });
        // Render childs
        if(that.params['childsBy']){
            cm.forEach(row[that.params['childsBy']], function(child, childI){
                renderRow(item['childs'], child, childI);
            });
        }
        // Push to rows array
        rows.push(item);
    };

    var renderCell = function(col, item){
        var nodes = {},
            text,
            title,
            href;
        // Check access
        if(col['access']){
            text = cm.isEmpty(item['data'][col['key']])? '' : item['data'][col['key']];
            title = cm.isEmpty(col['titleText'])? text : col['titleText'];
            // Structure
            item['nodes']['container'].appendChild(
                nodes['container'] = cm.Node('td')
            );
            // Text overflow
            if(col['textOverflow']){
                nodes['inner'] = cm.Node('div', {'class' : 'inner'});
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
                        nodes['node'] = cm.Node('div', {'class' : col['class']})
                    );
                    cm.addClass(nodes['node'], 'icon linked inline');
                    break;

                case 'url' :
                    text = cm.decode(text);
                    href = col['urlKey'] && item['data'][col['urlKey']]? cm.decode(item['data'][col['urlKey']]) : text;
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('a', {'target' : col['target'], 'href' : href}, !cm.isEmpty(col['altText'])? col['altText'] : text)
                    );
                    break;

                case 'checkbox' :
                    cm.addClass(nodes['container'], 'control');
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('input', {'type' : 'checkbox'})
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

                case 'actions':
                    nodes['actions'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('div', {'class' : ['pt__links', col['class']].join(' ')},
                            nodes['actionsList'] = cm.Node('ul')
                        )
                    );
                    cm.forEach(col['actions'], function(actionItem){
                        var actionNode;
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {}
                        }, actionItem);
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['actionsList'].appendChild(
                            cm.Node('li',
                                actionNode = cm.Node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        cm.forEach(actionItem['events'], function(actionEventHandler, actionEventName){
                            cm.addEvent(actionNode, actionEventName, actionEventHandler);
                        });
                        nodes['actions'].push(actionNode);
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

    var arraySort = function(key){
        sortBy = key;
        orderBy = !orderBy? that.params['orderBy'] : (orderBy == 'ASC' ? 'DESC' : 'ASC');
        // Get item
        var item, textA, textB, t1, t2, value;
        cm.forEach(that.params['cols'], function(col){
            if(col['key'] == key){
                item = col;
            }
        });
        // Sort
        if(that.params['data'].sort){
            that.params['data'].sort(function(a, b){
                textA = a[key];
                textB = b[key];
                switch(item['type']){
                    case 'html':
                        t1 = cm.getTextNodesStr(cm.strToHTML(textA));
                        t2 = cm.getTextNodesStr(cm.strToHTML(textB));
                        value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;

                    case 'date':
                        t1 = cm.parseDate(textA, that.params['dateFormat']);
                        t2 = cm.parseDate(textB, that.params['dateFormat']);
                        return (orderBy == 'ASC')? (t1 - t2) : (t2 - t1);
                        break;

                    case 'number':
                        value = textA - textB;
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;

                    default :
                        t1 = textA? textA.toLowerCase() : '';
                        t2 = textB? textB.toLowerCase() : '';
                        value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;
                }
            });
        }
        // API onSort Event
        that.triggerEvent('onSort', {
            'sortBy' : sortBy,
            'orderBy' : orderBy,
            'data' : that.params['data']
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
        cm.forEach(rows, function(row){
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
        cm.forEach(rows, function(row){
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
        cm.forEach(rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onUnCheckAll', that.params['data']);
        return that;
    };

    that.getChecked = function(){
        var checkedRows = [];
        cm.forEach(rows, function(row){
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
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                setRowStatus(row, status);
            }
        });
        return that;
    };

    that.clearRowStatus = function(index){
        cm.forEach(rows, function(row){
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
                that.nodes['content'] = cm.node('span', {'class' : 'com__help-bubble__content'},
                    that.params['content']
                )
            );
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
        if(cm.isNode(node)){
            cm.clearNode(that.nodes['content']);
            that.nodes['content'].appendChild(node);
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
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'title' : '',
        'placeholder' : '',
        'value' : null,
        'disabled' : false,
        'type' : 'file',              // base64 | file
        'langs' : {
            'no_image' : 'No Image',
            'browse' : 'Browse',
            'remove' : 'Remove'
        },
        'Com.GalleryPopup' : {}
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.disabled = false;
    that.value = null;
    that.file = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        // Set selected date
        if(that.params['value']){
            that.set(that.params['value'], false);
        }else{
            that.set(that.params['node'].value, false);
        }
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__image-input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            cm.node('div', {'class' : 'pt__box-item size-80'},
                cm.node('div', {'class' : 'l'},
                    that.nodes['imageContainer'] = cm.node('div', {'class' : 'pt__image has-border is-centered'},
                        that.nodes['link'] = cm.node('a', {'class' : 'inner'},
                            that.nodes['image'] = cm.node('img', {'class' : 'descr', 'alt' : ''})
                        )
                    )
                ),
                that.nodes['r'] = cm.node('div', {'class' : 'r'},
                    that.nodes['buttons'] = cm.node('div', {'class' : 'btn-wrap pull-left'},
                        cm.node('div', {'class' : 'browse-button'},
                            cm.node('button', that.lang('browse')),
                            cm.node('div', {'class' : 'inner'},
                                that.nodes['input'] = cm.node('input', {'type' : 'file'})
                            )
                        ),
                        that.nodes['remove'] = cm.node('button', that.lang('remove'))
                    )
                )
            )
        );
        if(!cm.isEmpty(that.params['title'])){
            that.nodes['imageContainer'].title = that.params['title'];
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.nodes['r'].appendChild(
                cm.node('div', {'class' : 'hint'}, that.params['placeholder'])
            );
        }
        if(!cm.isEmpty(that.params['name'])){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.appendStructure(that.nodes['container']);
        cm.remove(that.params['node']);
        // Events
        cm.getConstructor('Com.GalleryPopup', function(classConstructor){
            that.components['popup'] = new classConstructor(
                cm.merge(that.params['Com.GalleryPopup'], {
                    'node' : that.nodes['imageContainer']
                })
            );
        });
        that.components['fileReader'] = new FileReader();
        cm.addEvent(that.components['fileReader'], 'load', fileReaderAction);
        cm.addEvent(that.nodes['input'], 'change', changeAction);
        cm.addEvent(that.nodes['remove'], 'click', removeAction);
    };

    var changeAction = function(){
        var file = that.nodes['input'].files[0];
        if(/^image\//.test(file.type)){
            that.file = file;
            that.components['fileReader'].readAsDataURL(that.file);
        }
    };

    var removeAction = function(){
        that.reset();
    };

    var fileReaderAction = function(e){
        set(e.target.result);
    };

    var set = function(url){
        that.value = url;
        that.nodes['hidden'].value = url;
        setImage(url);
    };

    var setImage = function(url){
        that.nodes['image'].src = url;
        cm.replaceClass(that.nodes['imageContainer'], 'is-no-hover is-no-image', 'is-zoom');
        cm.appendChild(that.nodes['remove'], that.nodes['buttons']);
        // Replace gallery item
        if(that.components['popup']){
            that.components['popup']
                .clear()
                .add({
                    'link' : that.nodes['link'],
                    'src' : url,
                    'title' : ''
                })
        }
    };

    /* ******* PUBLIC ******* */

    that.set = function(url, file){
        if(cm.isEmpty(url)){
            that.reset();
        }else{
            that.file = file;
            set(url);
        }
        return that;
    };

    that.get = function(){
        switch(that.params['type']){
            case 'base64' :
                return that.value;
                break;
            case 'file' :
                return that.file;
                break;
        }
    };

    that.reset = function(){
        that.file = null;
        that.value = null;
        that.nodes['hidden'].value = '';
        cm.replaceClass(that.nodes['imageContainer'], 'is-zoom', 'is-no-hover is-no-image');
        cm.remove(that.nodes['remove']);
        // Clear gallery item
        if(that.components['popup']){
            that.components['popup']
                .clear()
        }
        return that;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('image-input', {
    'node' : cm.node('input'),
    'component' : 'Com.ImageInput'
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
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack',
        'Langs'
    ],
    'events' : [
        'onRender',
        'onItemAdd',
        'onItemRemove',
        'onItemProcess',
        'onItemSort',
        'onItemIndexChange'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : false,
        'container' : false,
        'renderItems' : 0,
        'maxItems' : 0,                         // 0 - infinity
        'template' : null,                      // Html node or string with items template
        'templateAttributeReplace' : false,
        'templateAttribute' : 'name',           // Replace specified items attribute by pattern, example: data-attribute-name="test[%index%]", available variables: %index%
        'sortable' : true,                      // Use drag and drop to sort items
        'duration' : 200,
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
    var that = this,
        toolbarHeight = 0,
        toolbarVisible = true;

    that.nodes = {
        'container' : cm.node('div'),
        'content' : cm.node('ul'),
        'toolbar' : cm.node('li'),
        'add' : cm.node('div'),
        'items' : []
    };
    that.components = {};
    that.items = [];

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
        // Check sortable
        if(that.params['sortable']){
            cm.getConstructor('Com.Sortable', function(classConstructor){
                that.components['sortable'] = new classConstructor(that.params['Com.Sortable']);
            });
            if(!that.components['sortable']){
                that.params['sortable'] = false;
            }
        }
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__multifield'},
                that.nodes['content'] = cm.node('div', {'class' : 'com__multifield__content'}),
                that.nodes['toolbar'] = cm.node('div', {'class' : 'com__multifield__toolbar'},
                    cm.node('div', {'class' : 'com__multifield__item'},
                        that.nodes['add'] = cm.node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
                    )
                )
            );
            // Embed
            if(that.params['container']){
                that.params['container'].appendChild(that.nodes['container']);
            }
        }
        // Add button events
        cm.addEvent(that.nodes['add'], 'click', function(e){
            cm.preventDefault(e);
            renderItem();
        });
        // Init Sortable
        if(that.params['sortable']){
            that.components['sortable'].addEvent('onSort', function(my, data){
                var item = that.items.find(function(item){
                    return item['container'] === data['node']
                });
                if(item){
                    sortItem(item, data['index']);
                }
            });
            that.components['sortable'].addGroup(that.nodes['content']);
        }
        // Process rendered items
        cm.forEach(that.nodes['items'], processItem);
        // Render items
        cm.forEach(Math.max(that.params['renderItems'] - that.items.length, 0), renderItem);
    };

    var renderItem = function(){
        if(that.params['maxItems'] == 0 || that.items.length < that.params['maxItems']){
            var item = {
                'isVisible' : false
            };
            // Structure
            item['container'] = cm.node('div', {'class' : 'com__multifield__item', 'data-node' : 'items:[]:container'},
                item['field'] = cm.node('div', {'class' : 'field', 'data-node' : 'field'}),
                item['remove'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove'), 'data-node' : 'remove'})
            );
            // Template
            if(cm.isNode(that.params['template'])){
                cm.appendChild(that.params['template'], item['field']);
            }else if(!cm.isEmpty(that.params['template'])){
                cm.appendChild(cm.strToHTML(that.params['template']), item['field']);
            }
            // Sortable
            if(that.params['sortable']){
                item['drag'] = cm.node('div', {'class' : that.params['icons']['drag'], 'data-node' : 'drag'});
                cm.insertFirst(item['drag'], item['container']);
            }
            // Embed
            that.nodes['content'].appendChild(item['container']);
            // Process
            processItem(item);
            // Trigger event
            that.triggerEvent('onItemAdd', item);
        }
    };

    var processItem = function(item){
        // Register sortable item
        if(that.params['sortable']){
            that.components['sortable'].addItem(item['container'], that.nodes['content']);
        }else{
            cm.remove(item['drag']);
        }
        // Events
        cm.addEvent(item['remove'], 'click', function(e){
            cm.preventDefault(e);
            removeItem(item);
        });
        // Push
        that.items.push(item);
        resetIndexes();
        // Animate
        toggleItemVisibility(item);
        // Toggle toolbar visibility
        toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemProcess', item);
    };

    var removeItem = function(item){
        // Remove sortable item
        if(that.params['sortable']){
            that.components['sortable'].removeItem(item['container']);
        }
        // Remove from array
        that.items.splice(that.items.indexOf(item), 1);
        resetIndexes();
        // Animate
        toggleItemVisibility(item, function(){
            // Remove from DOM
            cm.remove(item['container']);
        });
        // Toggle toolbar visibility
        toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemRemove', item);
    };

    var sortItem = function(item, index){
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        resetIndexes();
        // Trigger event
        that.triggerEvent('onItemSort', item);
    };

    var resetIndexes = function(){
        cm.forEach(that.items, function(item, index){
            if(item['index'] != index){
                // Set index
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

    var itemInArray = function(item){
        return !!that.items.find(function(find){
            return find === item;
        });
    };

    var toggleToolbarVisibility = function(){
        if(!toolbarHeight){
            toolbarHeight = that.nodes['toolbar'].offsetHeight;
        }
        if(that.params['maxItems'] > 0 && that.items.length == that.params['maxItems']){
            if(toolbarVisible){
                toolbarVisible = false;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : '0px', 'opacity' : 0},
                    'duration' : that.params['duration'],
                    'easing' : 'ease-in-out'
                });
            }
        }else{
            if(!toolbarVisible){
                toolbarVisible = true;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : [toolbarHeight, 'px'].join(''), 'opacity' : 1},
                    'duration' : that.params['duration'],
                    'easing' : 'ease-in-out',
                    'clear' : true,
                    'onStop' : function(){
                        that.nodes['toolbar'].style.overflow = '';
                    }
                });
            }
        }
    };

    var toggleItemVisibility = function(item, callback){
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

    that.addItem = function(){
        renderItem();
        return that;
    };

    that.removeItem = function(item){
        if(typeof item == 'number' && that.items[item]){
            removeItem(that.items[item]);
        }else if(itemInArray(item)){
            removeItem(item);
        }
        return that;
    };

    that.getItem = function(index){
        if(that.items[index]){
            return that.items[index];
        }
        return null;
    };

    that.getItems = function(){
        return that.items;
    };

    init();
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
    that.compoennts = {};

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
            that.compoennts['dialog'] = new classConstructor({
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
            cm.addEvent(that.nodes['button'], 'click', that.compoennts['dialog'].close);
            // Open dialog
            that.compoennts['dialog'].open();
        });
    };

    /* ******* MAIN ******* */

    init();
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
        'theme' : 'default',            // transparent | default | light | dark
        'position' : 'fixed',
        'showSpinner' : true,
        'showContent' : true,
        'autoOpen' : true,
        'removeOnClose' : true,
        'duration' : 500
    }
},
function(params){
    var that = this,
        themes = ['transparent', 'default', 'light', 'dark'];

    that.nodes = {};
    that.isOpen = false;
    that.isShowSpinner = false;
    that.isShowContent = false;
    that.openInterval = null;

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };
    
    var getCSSHelpers = function(){
        that.params['duration'] = cm.getTransitionDurationFromRule('.pt__overlay-helper__duration');
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
                that.params['container'].appendChild(that.nodes['container']);
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
        'onEnd'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'container' : false,
        'scrollNode' : window,
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,
        'showLoader' : true,
        'loaderDelay' : 300,                                        // in ms
        'barPosition' : 'bottom',                                   // top | bottom | both, require renderStructure
        'barAlign' : 'left',                                        // left | center | right, require renderStructure
        'barCountLR' : 3,
        'barCountM' : 1,                                            // 1 for drawing 3 center pagination buttons, 2 - 5, 3 - 7, etc
        'switchManually' : false,                                   // Switch pages manually
        'animateSwitch' : false,
        'animateDuration' : 300,
        'animatePrevious' : false,                                  // Animating of hiding previous page, require animateSwitch
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'prev' : 'Previous',
            'next' : 'Next'
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
        getCSSHelpers();
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

    var getCSSHelpers = function(){
        that.params['animateDuration'] = cm.getTransitionDurationFromRule('.com__pagination-helper__duration');
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
        if(that.params['pageCount'] == 0){
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
            // Embed
            if(that.params['container']){
                that.params['container'].appendChild(that.nodes['container']);
            }
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
                if(that.pages[that.page] && that.pages[that.page]['isRendered']){
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
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
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
        return cm.Node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        that.isRendering = true;
        var page = {
            'page' : that.page,
            'token' : that.pageToken,
            'pages' : that.nodes['pages'],
            'container' : cm.Node(that.params['pageTag']),
            'data' : data,
            'isVisible' : true,
            'isRendered' : true
        };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        // Render
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
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
            if(that.params['pageCount'] == 0){
                that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
            }else{
                that.pageCount = that.params['pageCount'];
            }
            that.callbacks.rebuildBars(that);
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

    that.isParent = function(node, flag){
        return cm.isParent(that.nodes['container'], node, flag);
    };

    init();
});
cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Stack'
    ],
    'require' : [
        'Com.Draggable',
        'tinycolor'
    ],
    'events' : [
        'onRender',
        'onDraw',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
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
    that.componnets = {};
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
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
                                that.nodes['inputHEX'] = cm.node('input', {'type' : 'text', 'maxlength' : 7, 'title' : that.lang('hex')})
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
        // Embed
        that.params['node'].appendChild(that.nodes['container']);
    };

    var initComponents = function(){
        that.componnets['paletteDrag'] = new Com.Draggable({
            'target' : that.nodes['paletteZone'],
            'node' : that.nodes['paletteDrag'],
            'limiter' : that.nodes['paletteZone'],
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['v'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['posY']) / 100, 2);
                    that.value['s'] = cm.toFixed(((100 / dimensions['limiter']['absoluteWidth']) * data['posX']) / 100, 2);
                    if(that.value['a'] == 0){
                        that.value['a'] = 1;
                        setOpacityDrag();
                    }
                    renderOpacityCanvas();
                    setColor();
                }
            }
        });
        that.componnets['rangeDrag'] = new Com.Draggable({
            'target' : that.nodes['rangeZone'],
            'node' : that.nodes['rangeDrag'],
            'limiter' : that.nodes['rangeZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['h'] = Math.floor(360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['posY']));
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
        that.componnets['opacityDrag'] = new Com.Draggable({
            'target' : that.nodes['opacityZone'],
            'node' : that.nodes['opacityDrag'],
            'limiter' : that.nodes['opacityZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['a'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['posY']) / 100, 2);
                    setColor();
                }
            }
        });
    };

    /* *** COLORS *** */

    var setRangeDrag = function(){
        var dimensions = that.componnets['rangeDrag'].getDimensions(),
            posY;
        if(that.value['h'] == 0){
            posY = 0;
        }else if(that.value['h'] == 360){
            posY = dimensions['limiter']['absoluteHeight'];
        }else{
            posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * that.value['h']);
        }
        that.componnets['rangeDrag'].setPosition(0, posY, false);
    };

    var setPaletteDrag = function(){
        var dimensions = that.componnets['paletteDrag'].getDimensions(),
            posY,
            posX;
        posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['v'] * 100);
        posX = (dimensions['limiter']['absoluteWidth'] / 100) * (that.value['s'] * 100);
        that.componnets['paletteDrag'].setPosition(posX, posY, false);
    };

    var setOpacityDrag = function(){
        var dimensions = that.componnets['opacityDrag'].getDimensions(),
            posY;
        posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['a'] * 100);
        that.componnets['opacityDrag'].setPosition(0, posY, false);
    };

    var inputHEXHandler = function(){
        var color = that.nodes['inputHEX'].value;
        if(!/^#/.test(color)){
            that.nodes['inputHEX'].value = '#' + color;
        }else{
            set(color, true, {'setInput' : false});
        }
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
        'onFinalize'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'container' : false,
        'scrollNode' : window,
        'scrollIndent' : 'Math.min(%scrollHeight% / 2, 600)',       // Variables: %blockHeight%.
        'data' : [],                                                // Static data
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,                                              // Render only count of pages. 0 - infinity
        'showButton' : true,                                        // true - always | once - show once after first loaded page
        'showLoader' : true,
        'loaderDelay' : 100,                                        // in ms
        'stopOnESC' : true,
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__scroll-pagination__page'
        },
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseurl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
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
            if(that.params['container']){
                that.params['container'].appendChild(that.nodes['container']);
            }
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
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
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
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
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
        if(that.params['pageCount'] > 0 && that.params['pageCount'] == that.currentPage){
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
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onReset',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'container' : false,                    // Component container that is required in case content is rendered without available select.
        'select' : null,                        // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('select'),             // Html select node to decorate.
        'name' : '',
        'renderInBody' : true,                  // Render dropdowns in document.body, else they will be rendrered in component container.
        'multiple' : false,                     // Render multiple select.
        'placeholder' : '',
        'showTitleTag' : true,                  // Copy title from available select node to component container. Will be shown on hover.
        'title' : false,                        // Title text. Will be shown on hover.
        'options' : [],                         // Listing of options, for rendering through java-script. Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'selected' : 0,                         // Option value / array of option values.
        'disabled' : false,
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
        optionsLength,
        groups = [],

        oldActive,
        active;

    that.disabled = false;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
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
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
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
        if(that.params['node'].className){
            cm.addClass(nodes['container'], that.params['node'].className);
        }
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
            if(/^data-/.test(item.name) && item.name != 'data-element'){
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
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
    };

    var renderSingle = function(){
        nodes['container'] = cm.Node('div', {'class' : 'com__select'},
            nodes['hidden'] = cm.Node('select', {'class' : 'display-none'}),
            nodes['target'] = cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['arrow'] = cm.Node('div', {'class' : that.params['icons']['arrow']}),
                nodes['text'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'})
            ),
            nodes['scroll'] = cm.Node('div', {'class' : 'pt__listing-items'},
                nodes['items'] = cm.Node('ul')
            )
        );
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
                e = cm.getEvent(e);
                if(optionsLength){
                    var item = options[active],
                        index = optionsList.indexOf(item),
                        option;

                    switch(e.keyCode){
                        case 38:
                            if(index - 1 >= 0){
                                option = optionsList[index - 1];
                            }else{
                                option = optionsList[optionsLength - 1];
                            }
                            break;

                        case 40:
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
                cm.addEvent(document.body, 'keydown', blockDocumentArrows);
            });
            cm.addEvent(nodes['container'], 'blur', function(){
                cm.removeEvent(document.body, 'keydown', blockDocumentArrows);
            });
            // Render tooltip
            components['menu'] = new Com.Tooltip(
                cm.merge(that.params['Com.Tooltip'], {
                    'container' : that.params['renderInBody']? document.body : nodes['container'],
                    'content' : nodes['scroll'],
                    'target' : nodes['target'],
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

    /* *** COLLECTORS *** */

    var collectSelectOptions = function(){
        var myChildes = that.params['node'].childNodes,
            myOptionsNodes,
            myOptions;
        cm.forEach(myChildes, function(myChild){
            if(cm.isElementNode(myChild)){
                if(myChild.tagName.toLowerCase() == 'optgroup'){
                    myOptionsNodes = myChild.querySelectorAll('option');
                    myOptions = [];
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
            'group': group
        }, item);
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
                    nodes['text'].value = ''
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

    that.get = function(){
        return active;
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
            components['menu'].enable();
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
    'component' : 'Com.Select',
    'callbacks' : {
        'component' : function(that, params){
            return new that.params['constructor'](
                cm.merge(params, {
                    'select' : params['node']
                })
            );
        }
    }
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
        'isEditing' : false,
        'customEvents' : true,
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

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);

        validateParams();
        renderSlider();
        renderLayout();
        that.setEffect(that.params['effect']);
        that.addToStack(that.params['node']);
        that.params['isEditing'] && that.enableEditing();
        that.triggerEvent('onRender');
    };

    var getCSSHelpers = function(){
        that.params['time'] = cm.getTransitionDurationFromRule('.com__slider-helper__duration');
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
        // Resize events
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
            cm.addClass(that.params['node'], 'is-editing');
            that.enableEditMode();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing');
            that.disableEditMode();
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
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
        'minHeight' : 24,
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
        set(parseFloat(that.params['node'].style.height), false);
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
        // Editing
        that.params['isEditing'] && that.enableEditing();
    };

    var setLogic = function(){
        that.components['draggable'] = new Com.Draggable(
            cm.merge(that.params['Com.Draggable'], {
                'node': that.nodes['dragContainer'],
                'events' : {
                    'onStart' : start,
                    'onSet' : function(my, data){
                        that.value = data['posY'];
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
        that.value = Math.min(height, that.params['minHeight']);
        setHeight(height);
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

    var setHeight = function(height){
        that.params['node'].style.height = [height, 'px'].join('');
        that.nodes['dragContainer'].style.top = [that.params['node'].offsetHeight, 'px'].join('');
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
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
        setHeight(that.value);
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
        'container' : false,
        'name' : '',
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
        getCSSHelpers();
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

    var getCSSHelpers = function(){
        var rule;
        that.params['animateDuration'] = cm.getTransitionDurationFromRule('.com__tabset-helper__duration');
        if(rule = cm.getCSSRule('.com__tabset-helper__column-width')[0]){
            that.params['tabsWidth'] = cm.styleToNumber(rule.style.width);
        }
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
        that.appendStructure(that.nodes['container']);
        cm.remove(that.params['node']);
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
            'isHide' : true,
            'onShowStart' : function(that, tab){},
            'onShow' : function(that, tab){},
            'onHideStart' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        // Structure
        item['tab'] = renderTabLink(item);
        item['menu'] = renderTabLink(item);
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

    var renderTabLink = function(tab){
        var item = {};
        // Structure
        item['container'] = cm.Node('li',
            item['a'] = cm.Node('a', tab['title'])
        );
        if(that.params['showTabsTitle']){
            item['a'].setAttribute('title', tab['title']);
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
        if(!that.isProcess && id != that.active){
            that.isProcess = true;
            // Hide Previous Tab
            if(that.active && that.tabs[that.active]){
                that.previous = that.active;
                that.tabs[that.active]['isHide'] = true;
                // Hide Start Event
                that.tabs[that.active]['onHideStart'](that, that.tabs[that.active]);
                that.triggerEvent('onTabHideStart', that.tabs[that.active]);
                // Hide
                cm.removeClass(that.tabs[that.active]['tab']['container'], 'active');
                cm.removeClass(that.tabs[that.active]['menu']['container'], 'active');
                cm.removeClass(that.tabs[that.active]['content'], 'active');
                // Hide End Event
                that.tabs[that.active]['onHide'](that, that.tabs[that.active]);
                that.triggerEvent('onTabHide', that.tabs[that.active]);
            }
            // Show New Tab
            that.active = id;
            that.tabs[that.active]['isHide'] = false;
            // Show Start Event
            that.tabs[that.active]['onShowStart'](that, that.tabs[that.active]);
            that.triggerEvent('onTabShowStart', that.tabs[that.active]);
            // Show
            that.tabs[that.active]['content'].style.display = 'block';
            cm.addClass(that.tabs[that.active]['tab']['container'], 'active');
            cm.addClass(that.tabs[that.active]['menu']['container'], 'active');
            cm.addClass(that.tabs[that.active]['content'], 'active', true);
            that.nodes['headerTitleText'].innerHTML = that.tabs[that.active]['title'];
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
            that.nodes['contentUL'].style.height = [height, 'px'].join('');
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

    that.set = function(id){
        if(id && that.tabs[id]){
            set(id);
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

    that.addTab = function(item){
        if(item && item['id']){
            renderTab(item);
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
cm.define('Com.TabsetHelper', {
    'modules' : [
        'Params',
        'Events',
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
        'loaderDelay' : 300,                                        // in ms
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'cache' : false,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %tab%, %callback% for JSONP.
            'params' : ''                                           // Params object. %tab%, %baseurl%, %callback% for JSONP.
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
                'inner' : cm.node('div')
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

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, item, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%tab%' : item['id'],
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%tab%' : item['id'],
            '%baseurl%' : cm._baseUrl
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
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, item, config, response){
        // Response
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, {
                'item' : item,
                'response' : response
            });
            response = that.callbacks.filter(that, item, config, response);
            that.callbacks.render(that, item, response);
        }else{
            that.callbacks.error(that, item, config);
        }
    };

    that.callbacks.error = function(that, item, config){
        that.triggerEvent('onRequestError', {
            'item' : item
        });
    };

    that.callbacks.success = function(that, tab, response){
        that.triggerEvent('onRequestSuccess', {
            'tab' : tab,
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
        that.isRendering = true;
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
        'container' : false,
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'name' : '',
        'data' : [],
        'maxSingleTagLength': 255,
        'autocomplete' : {                              // All parameters what uses in Com.Autocomplete
            'clearOnEmpty' : false
        },
        'icons' : {
            'add' : 'icon default linked',
            'remove' : 'icon default linked'
        },
        'langs' : {
            'tags' : 'Tags',
            'add' : 'Add Tag',
            'remove' : 'Remove Tag'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        tags = [],
        items = {},
        isOpen = false;

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
        // Check for autocomplete
        that.isAutocomplete = !(!cm.isEmpty(params['autocomplete']) && !that.getNodeDataConfig(that.params['node'])['autocomplete']);
    };

    var render = function(){
        /* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com__tags-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render add button
        renderAddButton();
        /* *** ATTRIBUTES *** */
        // Set hidden input attributes
        if(that.params['node'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', that.params['node'].getAttribute('name'));
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);

    };

    var setLogic = function(){
        // Autocomplete
        cm.getConstructor('Com.Autocomplete', function(classConstructor){
            that.components['autocomplete'] = new classConstructor(
                cm.merge(that.params['autocomplete'], {
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
        nodes['hidden'].value = tags.join(',');
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

    init();
});
cm.define('Com.TimeSelect', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear'
    ],
    'params' : {
        'container' : false,
        'input' : null,                                  // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
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
        // Set hidden input attributes
        if(that.params['node'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', that.params['node'].getAttribute('name'));
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
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
        'node' : cm.Node('div'),
        'duration' : 500,
        'remember' : false,                                 // Remember toggle state
        'toggleTitle' : false,                              // Change title on toggle
        'renderStructure' : false,
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
            that.appendStructure(that.nodes['container']);
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
            that.isCollapsed = that.storageRead('isCollapsed');
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
        that.triggerEvent('onShow');
    };

    var collapseEnd = function(){
        that.isProcess = false;
        that.nodes['target'].style.opacity = 0;
        that.nodes['target'].style.height = 0;
        that.triggerEvent('onHide');
    };

    /* ******* MAIN ******* */

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
        'duration' : 'cm._config.animDurationQuick',
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
    var that = this,
        anim;
    
    that.nodes = {};
    that.isShow = false;
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
        anim = new cm.Animation(that.nodes['container']);
        // Add target event
        if(that.params['preventClickEvent']){
            that.params['target'].onclick = function(e){
                cm.preventDefault(e);
            };
        }
        setTargetEvent();
        // Check position
        animFrame(getPosition);
    };

    var targetEvent = function(){
        if(!that.disabled){
            if(that.isShow && that.params['targetEvent'] == 'click' && that.params['hideOnReClick']){
                hide(false);
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
        if(!that.isShow){
            that.isShow = true;
            // Append child tooltip into body and set position
            that.params['container'].appendChild(that.nodes['container']);
            // Show tooltip
            that.nodes['container'].style.display = 'block';
            // Animate
            anim.go({'style' : {'opacity' : 1}, 'duration' : immediately? 0 : that.params['duration'], 'onStop' : function(){
                that.triggerEvent('onShow');
            }});
            // Add document target event
            if(that.params['hideOnOut']){
                switch(that.params['targetEvent']){
                    case 'hover' :
                        cm.addEvent(document, 'mouseover', bodyEvent);
                        break;
                    case 'click' :
                    default :
                        cm.addEvent(document, 'mousedown', bodyEvent);
                        break;
                }
            }
            that.triggerEvent('onShowStart');
        }
    };

    var hide = function(immediately){
        if(that.isShow){
            that.isShow = false;
            // Remove document target event
            if(that.params['hideOnOut']){
                switch(that.params['targetEvent']){
                    case 'hover' :
                        cm.removeEvent(document, 'mouseover', bodyEvent);
                        break;
                    case 'click' :
                    default :
                        cm.removeEvent(document, 'mousedown', bodyEvent);
                        break;
                }
            }
            // Animate
            anim.go({'style' : {'opacity' : 0}, 'duration' : immediately? 0 : that.params['duration'], 'onStop' : function(){
                that.nodes['container'].style.display = 'none';
                cm.remove(that.nodes['container']);
                that.triggerEvent('onHide');
            }});
            that.triggerEvent('onHideStart');
        }
    };

    var getPosition = function(){
        if(that.isShow){
            var targetWidth =  that.params['target'].offsetWidth,
                targetHeight = that.params['target'].offsetHeight,
                selfHeight = that.nodes['container'].offsetHeight,
                selfWidth = that.nodes['container'].offsetWidth,
                pageSize = cm.getPageSize(),
                scrollTop = cm.getScrollTop(window),
                scrollLeft = cm.getScrollLeft(window);
            // Calculate size
            (function(){
                if(that.params['width'] != 'auto'){
                    var width = eval(
                        that.params['width']
                            .toString()
                            .replace('targetWidth', targetWidth)
                    );
                    if(width != selfWidth){
                        that.nodes['container'].style.width =  [width, 'px'].join('');
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
                // Apply styles
                if(positionTop != that.nodes['container'].offsetTop){
                    that.nodes['container'].style.top =  [positionTop, 'px'].join('');
                }
                if(positionLeft != that.nodes['container'].offsetLeft){
                    that.nodes['container'].style.left = [positionLeft, 'px'].join('');
                }
            })();
        }
        animFrame(getPosition);
    };

    var bodyEvent = function(e){
        if(that.isShow){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(that.nodes['container'], target, true) && !cm.isParent(that.params['target'], target, true)){
                hide(false);
            }
        }
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
Com['UA'] = {
    'hash' : {'ie':'MSIE','opera':'Opera','ff':'Firefox','firefox':'Firefox','webkit':'AppleWebKit','safari':'Safari','chrome':'Chrome','steam':'Steam'},
    'fullname' : {'MSIE':'Microsoft Internet Explorer','Firefox':'Mozilla Firefox','Chrome':'Google Chrome','Safari':'Apple Safari','Opera':'Opera','Opera Mini':'Opera Mini','Opera Mobile':'Opera Mobile','IE Mobile':'Internet Explorer Mobile','Steam':'Valve Steam Game Overlay'},
    'os' : {
        'Windows':{'NT 5.0':'2000','NT 5.1':'XP','NT 5.2':'Server 2003','NT 6.0':'Vista','NT 6.1':'7','NT 6.2':'8','NT 6.3':'8.1','NT 10.0':'10'},
        'Mac OSX':{'10.0':'Cheetah','10.1':'Puma','10.2':'Jaguar','10.3':'Panther','10.4':'Tiger','10.5':'Leopard','10.6':'Snow Leopard','10.7':'Lion','10.8':'Mountain Lion','10.9':'Mavericks','10.10':'Yosemite','10.11':'El Capitan'}
    },
    'str' : navigator.userAgent,
    'get' : function(str){
        var that = this,
            str = (str)? str : that.str,
            arr = {};
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
        if(str.indexOf('Windows Phone OS') > -1){
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