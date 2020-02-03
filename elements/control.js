
import { id, overload, todB, toLevel, toCamelCase } from '../../fn/module.js';
import * as normalise   from '../../fn/modules/normalisers.js';
import * as denormalise from '../../fn/modules/denormalisers.js';

export const attributes = ['min', 'max', 'value'];

export const eventOptions = {
  // The event bubbles (false by default)
  // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
  bubbles: true,

  // The event may be cancelled (false by default)
  // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
  cancelable: true

  // Trigger listeners outside of a shadow root (false by default)
  // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
  //composed: false
};

export const inputEvent = new CustomEvent('input', eventOptions);

export function transform(curve, value, min, max) {
    return denormalise[toCamelCase(curve)](min, max, value) ;
}

export function invert(curve, value, min, max) {
    return normalise[toCamelCase(curve)](min, max, value) ;
}


function outputMilliKilo(unit, value) {
    return value < 0.001 ? (value * 1000).toFixed(2) :
        value < 1 ? (value * 1000).toPrecision(3) :
        value > 1000 ? (value / 1000).toPrecision(3) :
        value.toPrecision(3) ;
}

export const transformOutput = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? '-1.00' :
            value === 0 ? '0.00' :
            value === 1 ? '1.00' :
            value.toFixed(2) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db < -1 ? db.toPrecision(3) :
                db.toFixed(2) :
            // Allow Infinity to pass through as it is already gracefully
            // rendered by Sparky
            db ;
    },

    Hz: function(unit, value) {
        return value < 1 ? value.toFixed(2) :
            value > 1000 ? (value / 1000).toPrecision(3) :
            value.toPrecision(3) ;
    },

    semitone: function(unit, value) {
        // detune value is in cents
        return value === 0 ? '0' :
            value < 0 ?
                '♭' + (-value / 100).toFixed(2) :
                '♯' + (value / 100).toFixed(2) ;
    },

    s: outputMilliKilo,

    bpm: function(unit, value) {
        // Input value is a rate in beats per second
        const bpm = value * 60;
        return bpm < 100 ?
            bpm.toFixed(1) :
            bpm.toFixed(0) ;
    },

    default: function(unit, value) {
        return value < 0.1 ? value.toFixed(3) :
            value < 999.5 ? value.toPrecision(3) :
            value.toFixed(0) ;
    }
});

function tickMilliKilo(unit, value) {
    return value < 1 ? (value * 1000).toFixed(0) :
        value < 10 ? value.toFixed(1) :
        value < 1000 ? value.toPrecision(1) :
        (value / 1000).toPrecision(1) + 'k' ;
}

export const transformTick = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? 'left' :
            value === 0 ? 'centre' :
            value === 1 ? 'right' :
            value.toFixed(1) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db.toFixed(0) :
            db ;
    },

    Hz: function(unit, value) {
        return value < 10 ? value.toFixed(1) :
            value < 1000 ? value.toFixed(0) :
            (value / 1000).toFixed(0) + 'k' ;
    },

    semitone: function(unit, value) {
        //console.log(unit, value, value / 100, (value / 100).toFixed(0));
        // detune value is in cents
        return (value / 100).toFixed(0);
    },

    s: tickMilliKilo,

    default: function(unit, value) {
        // Format numbers to precision 3 then remove trailing zeroes from floats
        return (value < 99.5 ?
            value.toPrecision(3) :
            value.toFixed(0)
        )
        .replace(/(\d+)(\.\d*?)0+$/, ($0, $1, $2) => {
            return $1 + ($2.length > 1 ? $2 : '');
        });
    }
});

function unitKilo(unit, value) {
    return value > 1000 ? 'k' + unit :
        unit ;
}

function unitMilliKilo(unit, value) {
    return value < 1 ? 'm' + unit :
        value > 1000 ? 'k' + unit :
        unit ;
}

function unitEmptyString() {
    return '';
}

export const transformUnit = overload(id, {
    pan: unitEmptyString,

    dB: id,

    Hz: unitKilo,

    semitone: unitEmptyString,

    s: unitMilliKilo,

    default: function(unit, value) {
        // Return empty string if no unit
        return unit || '';
    }
});


export function evaluate(string) {
    // Coerce null, undefined, false, '' to 0
    if (!string) { return 0; }

    const number = +string;
    if (number || number === 0) { return number; }

    const tokens = /^(-?[\d.]+)(?:(dB|bpm)|(m|k)?(\w+))$/.exec(string);
    if (!tokens) { return 0 };

    const value = parseFloat(tokens[1]) ;

    return tokens[2] === 'dB' ? toLevel(value) :
        // BPM to rate in beats per second
        tokens[2] === 'bpm' ? value / 60 :
        // milli-
        tokens[3] === 'm' ? value / 1000 :
        // kilo-
        tokens[3] === 'k' ? value * 1000 :
        value ;
}
