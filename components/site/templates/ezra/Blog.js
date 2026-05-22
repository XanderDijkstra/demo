// http-url:https://framerusercontent.com/modules/4OLrxyzfTjMzS2CWvcvI/B17WKPewOauM0gE8fuvl/T79x6ameU.js
import { jsx as _jsx2, jsxs as _jsxs2, Fragment as _Fragment } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls2, ChildrenCanSuspend, ComponentViewportProvider, ControlType as ControlType2, cx as cx2, forwardLoader, getFonts, Link, PathVariablesContext, queryCache, RichText as RichText2, SmartComponentScopedContainer, useComponentViewport as useComponentViewport2, useLoadMorePaginatedQuery, useLocaleInfo as useLocaleInfo2, useQueryData, useVariantState as useVariantState2, withCSS as withCSS2, withFX } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion2, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React2 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/y8UJBBVllb4vwCLZ4xkU/RQmWNZyIldf0pETqV2CG/bN5vmZNAg.js
import { addPropertyControls as e5, ControlType as l3, QueryEngine as t4 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/y8UJBBVllb4vwCLZ4xkU/RQmWNZyIldf0pETqV2CG/bN5vmZNAg-0.js
import { ControlType as y } from "./_framer-runtime.js";
import { ControlType as P } from "./_framer-runtime.js";
var t;
var e = Object.create;
var r = Object.defineProperty;
var n = Object.getOwnPropertyDescriptor;
var i = Object.getOwnPropertyNames;
var s = Object.getPrototypeOf;
var a = Object.prototype.hasOwnProperty;
var o = (t5, e6, n4) => e6 in t5 ? r(t5, e6, { enumerable: true, configurable: true, writable: true, value: n4 }) : t5[e6] = n4;
var u = (t5, e6) => function() {
  return e6 || (0, t5[i(t5)[0]])((e6 = { exports: {} }).exports, e6), e6.exports;
};
var l = (t5, e6, s4, o4) => {
  if (e6 && "object" == typeof e6 || "function" == typeof e6)
    for (let u4 of i(e6))
      a.call(t5, u4) || u4 === s4 || r(t5, u4, { get: () => e6[u4], enumerable: !(o4 = n(e6, u4)) || o4.enumerable });
  return t5;
};
var h = (t5, n4, i4) => (i4 = null != t5 ? e(s(t5)) : {}, l(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !n4 && t5 && t5.__esModule ? i4 : r(i4, "default", { value: t5, enumerable: true }),
  t5
));
var c = (t5, e6, r3) => o(t5, "symbol" != typeof e6 ? e6 + "" : e6, r3);
var f = u({ "../../../node_modules/dataloader/index.js"(t5, e6) {
  var r3, n4 = /* @__PURE__ */ function() {
    function t6(t7, e8) {
      if ("function" != typeof t7)
        throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but got: " + t7 + ".");
      this._batchLoadFn = t7, this._maxBatchSize = function(t8) {
        if (!(!t8 || false !== t8.batch))
          return 1;
        var e9 = t8 && t8.maxBatchSize;
        if (void 0 === e9)
          return 1 / 0;
        if ("number" != typeof e9 || e9 < 1)
          throw TypeError("maxBatchSize must be a positive number: " + e9);
        return e9;
      }(e8), this._batchScheduleFn = function(t8) {
        var e9 = t8 && t8.batchScheduleFn;
        if (void 0 === e9)
          return i4;
        if ("function" != typeof e9)
          throw TypeError("batchScheduleFn must be a function: " + e9);
        return e9;
      }(e8), this._cacheKeyFn = function(t8) {
        var e9 = t8 && t8.cacheKeyFn;
        if (void 0 === e9)
          return function(t9) {
            return t9;
          };
        if ("function" != typeof e9)
          throw TypeError("cacheKeyFn must be a function: " + e9);
        return e9;
      }(e8), this._cacheMap = function(t8) {
        if (!(!t8 || false !== t8.cache))
          return null;
        var e9 = t8 && t8.cacheMap;
        if (void 0 === e9)
          return /* @__PURE__ */ new Map();
        if (null !== e9) {
          var r4 = ["get", "set", "delete", "clear"].filter(function(t9) {
            return e9 && "function" != typeof e9[t9];
          });
          if (0 !== r4.length)
            throw TypeError("Custom cacheMap missing methods: " + r4.join(", "));
        }
        return e9;
      }(e8), this._batch = null, this.name = e8 && e8.name ? e8.name : null;
    }
    var e7 = t6.prototype;
    return e7.load = function(t7) {
      if (null == t7)
        throw TypeError("The loader.load() function must be called with a value, but got: " + String(t7) + ".");
      var e8 = function(t8) {
        var e9 = t8._batch;
        if (null !== e9 && !e9.hasDispatched && e9.keys.length < t8._maxBatchSize)
          return e9;
        var r5 = { hasDispatched: false, keys: [], callbacks: [] };
        return t8._batch = r5, t8._batchScheduleFn(function() {
          (function(t9, e10) {
            var r6;
            if (e10.hasDispatched = true, 0 === e10.keys.length) {
              a3(e10);
              return;
            }
            try {
              r6 = t9._batchLoadFn(e10.keys);
            } catch (r7) {
              return s4(t9, e10, TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function errored synchronously: " + String(r7) + "."));
            }
            if (!r6 || "function" != typeof r6.then)
              return s4(t9, e10, TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise: " + String(r6) + "."));
            r6.then(function(t10) {
              if (!o4(t10))
                throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array: " + String(t10) + ".");
              if (t10.length !== e10.keys.length)
                throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array of the same length as the Array of keys.\n\nKeys:\n" + String(e10.keys) + "\n\nValues:\n" + String(t10));
              a3(e10);
              for (var r7 = 0; r7 < e10.callbacks.length; r7++) {
                var n6 = t10[r7];
                n6 instanceof Error ? e10.callbacks[r7].reject(n6) : e10.callbacks[r7].resolve(n6);
              }
            }).catch(function(r7) {
              s4(t9, e10, r7);
            });
          })(t8, r5);
        }), r5;
      }(this), r4 = this._cacheMap, n5 = this._cacheKeyFn(t7);
      if (r4) {
        var i5 = r4.get(n5);
        if (i5) {
          var u4 = e8.cacheHits || (e8.cacheHits = []);
          return new Promise(function(t8) {
            u4.push(function() {
              t8(i5);
            });
          });
        }
      }
      e8.keys.push(t7);
      var l4 = new Promise(function(t8, r5) {
        e8.callbacks.push({ resolve: t8, reject: r5 });
      });
      return r4 && r4.set(n5, l4), l4;
    }, e7.loadMany = function(t7) {
      if (!o4(t7))
        throw TypeError("The loader.loadMany() function must be called with Array<key> but got: " + t7 + ".");
      for (var e8 = [], r4 = 0; r4 < t7.length; r4++)
        e8.push(this.load(t7[r4]).catch(function(t8) {
          return t8;
        }));
      return Promise.all(e8);
    }, e7.clear = function(t7) {
      var e8 = this._cacheMap;
      if (e8) {
        var r4 = this._cacheKeyFn(t7);
        e8.delete(r4);
      }
      return this;
    }, e7.clearAll = function() {
      var t7 = this._cacheMap;
      return t7 && t7.clear(), this;
    }, e7.prime = function(t7, e8) {
      var r4 = this._cacheMap;
      if (r4) {
        var n5, i5 = this._cacheKeyFn(t7);
        void 0 === r4.get(i5) && (e8 instanceof Error ? (n5 = Promise.reject(e8)).catch(function() {
        }) : n5 = Promise.resolve(e8), r4.set(i5, n5));
      }
      return this;
    }, t6;
  }(), i4 = "object" == typeof process && "function" == typeof process.nextTick ? function(t6) {
    r3 || (r3 = Promise.resolve()), r3.then(function() {
      process.nextTick(t6);
    });
  } : "function" == typeof setImmediate ? function(t6) {
    setImmediate(t6);
  } : function(t6) {
    setTimeout(t6);
  };
  function s4(t6, e7, r4) {
    a3(e7);
    for (var n5 = 0; n5 < e7.keys.length; n5++)
      t6.clear(e7.keys[n5]), e7.callbacks[n5].reject(r4);
  }
  function a3(t6) {
    if (t6.cacheHits)
      for (var e7 = 0; e7 < t6.cacheHits.length; e7++)
        t6.cacheHits[e7]();
  }
  function o4(t6) {
    return "object" == typeof t6 && null !== t6 && "number" == typeof t6.length && (0 === t6.length || t6.length > 0 && Object.prototype.hasOwnProperty.call(t6, t6.length - 1));
  }
  e6.exports = n4;
} });
var d = h(f(), 1);
var g = { Uint8: 1, Uint16: 2, Uint32: 4, BigUint64: 8, Int8: 1, Int16: 2, Int32: 4, BigInt64: 8, Float32: 4, Float64: 8 };
var p = class {
  getOffset() {
    return this.offset;
  }
  ensureLength(t5) {
    let e6 = this.bytes.length;
    if (!(this.offset + t5 <= e6))
      throw Error("Reading out of bounds");
  }
  readUint8() {
    let t5 = g.Uint8;
    this.ensureLength(t5);
    let e6 = this.view.getUint8(this.offset);
    return this.offset += t5, e6;
  }
  readUint16() {
    let t5 = g.Uint16;
    this.ensureLength(t5);
    let e6 = this.view.getUint16(this.offset);
    return this.offset += t5, e6;
  }
  readUint32() {
    let t5 = g.Uint32;
    this.ensureLength(t5);
    let e6 = this.view.getUint32(this.offset);
    return this.offset += t5, e6;
  }
  readUint64() {
    let t5 = this.readBigUint64();
    return Number(t5);
  }
  readBigUint64() {
    let t5 = g.BigUint64;
    this.ensureLength(t5);
    let e6 = this.view.getBigUint64(this.offset);
    return this.offset += t5, e6;
  }
  readInt8() {
    let t5 = g.Int8;
    this.ensureLength(t5);
    let e6 = this.view.getInt8(this.offset);
    return this.offset += t5, e6;
  }
  readInt16() {
    let t5 = g.Int16;
    this.ensureLength(t5);
    let e6 = this.view.getInt16(this.offset);
    return this.offset += t5, e6;
  }
  readInt32() {
    let t5 = g.Int32;
    this.ensureLength(t5);
    let e6 = this.view.getInt32(this.offset);
    return this.offset += t5, e6;
  }
  readInt64() {
    let t5 = this.readBigInt64();
    return Number(t5);
  }
  readBigInt64() {
    let t5 = g.BigInt64;
    this.ensureLength(t5);
    let e6 = this.view.getBigInt64(this.offset);
    return this.offset += t5, e6;
  }
  readFloat32() {
    let t5 = g.Float32;
    this.ensureLength(t5);
    let e6 = this.view.getFloat32(this.offset);
    return this.offset += t5, e6;
  }
  readFloat64() {
    let t5 = g.Float64;
    this.ensureLength(t5);
    let e6 = this.view.getFloat64(this.offset);
    return this.offset += t5, e6;
  }
  readBytes(t5) {
    let e6 = this.offset, r3 = e6 + t5, n4 = this.bytes.subarray(e6, r3);
    return this.offset = r3, n4;
  }
  readString() {
    let t5 = this.readUint32(), e6 = this.readBytes(t5);
    return this.decoder.decode(e6);
  }
  readJson() {
    let t5 = this.readString();
    return JSON.parse(t5);
  }
  constructor(t5) {
    this.bytes = t5, c(this, "offset", 0), c(this, "view"), c(this, "decoder", new TextDecoder()), this.view = v(this.bytes);
  }
};
function v(t5) {
  return new DataView(t5.buffer, t5.byteOffset, t5.byteLength);
}
var m = "undefined" != typeof window;
var w = m && "function" == typeof window.requestIdleCallback;
function I(t5, ...e6) {
  if (!t5)
    throw Error("Assertion Error" + (e6.length > 0 ? ": " + e6.join(" ") : ""));
}
function b(t5) {
  throw Error(`Unexpected value: ${t5}`);
}
var U = 1024;
var S = 1.5;
var k = (t5) => 2 ** t5 - 1;
var L = (t5) => -(2 ** (t5 - 1));
var B = (t5) => 2 ** (t5 - 1) - 1;
var E = { Uint8: 0, Uint16: 0, Uint32: 0, Uint64: 0, BigUint64: 0, Int8: L(8), Int16: L(16), Int32: L(32), Int64: Number.MIN_SAFE_INTEGER, BigInt64: -(BigInt(2) ** BigInt(63)) };
var M = { Uint8: k(8), Uint16: k(16), Uint32: k(32), Uint64: Number.MAX_SAFE_INTEGER, BigUint64: BigInt(2) ** BigInt(64) - BigInt(1), Int8: B(8), Int16: B(16), Int32: B(32), Int64: Number.MAX_SAFE_INTEGER, BigInt64: BigInt(2) ** BigInt(63) - BigInt(1) };
function T(t5, e6, r3, n4) {
  I(t5 >= e6, t5, "outside lower bound for", n4), I(t5 <= r3, t5, "outside upper bound for", n4);
}
var F = class {
  getOffset() {
    return this.offset;
  }
  slice(t5 = 0, e6 = this.offset) {
    return this.bytes.slice(t5, e6);
  }
  subarray(t5 = 0, e6 = this.offset) {
    return this.bytes.subarray(t5, e6);
  }
  ensureLength(t5) {
    let e6 = this.bytes.length;
    if (this.offset + t5 <= e6)
      return;
    let r3 = new Uint8Array(Math.ceil(e6 * S) + t5);
    r3.set(this.bytes), this.bytes = r3, this.view = v(r3);
  }
  writeUint8(t5) {
    T(t5, E.Uint8, M.Uint8, "Uint8");
    let e6 = g.Uint8;
    this.ensureLength(e6), this.view.setUint8(this.offset, t5), this.offset += e6;
  }
  writeUint16(t5) {
    T(t5, E.Uint16, M.Uint16, "Uint16");
    let e6 = g.Uint16;
    this.ensureLength(e6), this.view.setUint16(this.offset, t5), this.offset += e6;
  }
  writeUint32(t5) {
    T(t5, E.Uint32, M.Uint32, "Uint32");
    let e6 = g.Uint32;
    this.ensureLength(e6), this.view.setUint32(this.offset, t5), this.offset += e6;
  }
  writeUint64(t5) {
    T(t5, E.Uint64, M.Uint64, "Uint64");
    let e6 = BigInt(t5);
    this.writeBigUint64(e6);
  }
  writeBigUint64(t5) {
    T(t5, E.BigUint64, M.BigUint64, "BigUint64");
    let e6 = g.BigUint64;
    this.ensureLength(e6), this.view.setBigUint64(this.offset, t5), this.offset += e6;
  }
  writeInt8(t5) {
    T(t5, E.Int8, M.Int8, "Int8");
    let e6 = g.Int8;
    this.ensureLength(e6), this.view.setInt8(this.offset, t5), this.offset += e6;
  }
  writeInt16(t5) {
    T(t5, E.Int16, M.Int16, "Int16");
    let e6 = g.Int16;
    this.ensureLength(e6), this.view.setInt16(this.offset, t5), this.offset += e6;
  }
  writeInt32(t5) {
    T(t5, E.Int32, M.Int32, "Int32");
    let e6 = g.Int32;
    this.ensureLength(e6), this.view.setInt32(this.offset, t5), this.offset += e6;
  }
  writeInt64(t5) {
    T(t5, E.Int64, M.Int64, "Int64");
    let e6 = BigInt(t5);
    this.writeBigInt64(e6);
  }
  writeBigInt64(t5) {
    T(t5, E.BigInt64, M.BigInt64, "BigInt64");
    let e6 = g.BigInt64;
    this.ensureLength(e6), this.view.setBigInt64(this.offset, t5), this.offset += e6;
  }
  writeFloat32(t5) {
    let e6 = g.Float32;
    this.ensureLength(e6), this.view.setFloat32(this.offset, t5), this.offset += e6;
  }
  writeFloat64(t5) {
    let e6 = g.Float64;
    this.ensureLength(e6), this.view.setFloat64(this.offset, t5), this.offset += e6;
  }
  writeBytes(t5) {
    let e6 = t5.length;
    this.ensureLength(e6), this.bytes.set(t5, this.offset), this.offset += e6;
  }
  encodeString(t5) {
    let e6 = this.encodedStrings.get(t5);
    if (e6)
      return e6;
    let r3 = this.encoder.encode(t5);
    return this.encodedStrings.set(t5, r3), r3;
  }
  writeString(t5) {
    let e6 = this.encodeString(t5), r3 = e6.length;
    this.writeUint32(r3), this.writeBytes(e6);
  }
  writeJson(t5) {
    let e6 = JSON.stringify(t5);
    this.writeString(e6);
  }
  constructor() {
    c(this, "offset", 0), c(this, "bytes", new Uint8Array(U)), c(this, "view", v(this.bytes)), c(this, "encoder", new TextEncoder()), c(this, "encodedStrings", /* @__PURE__ */ new Map());
  }
};
function x(t5) {
  return "string" == typeof t5;
}
function N(t5) {
  return Number.isFinite(t5);
}
function A(t5) {
  return null === t5;
}
var O = class t2 {
  static fromString(e6) {
    let [r3, n4, i4] = e6.split("/").map(Number);
    return I(N(r3), "Invalid chunkId"), I(N(n4), "Invalid offset"), I(N(i4), "Invalid length"), new t2(r3, n4, i4);
  }
  toString() {
    return `${this.chunkId}/${this.offset}/${this.length}`;
  }
  static read(e6) {
    let r3 = e6.readUint16(), n4 = e6.readUint32(), i4 = e6.readUint32();
    return new t2(r3, n4, i4);
  }
  write(t5) {
    t5.writeUint16(this.chunkId), t5.writeUint32(this.offset), t5.writeUint32(this.length);
  }
  compare(t5) {
    return this.chunkId < t5.chunkId ? -1 : this.chunkId > t5.chunkId ? 1 : this.offset < t5.offset ? -1 : this.offset > t5.offset ? 1 : (I(this.length === t5.length), 0);
  }
  constructor(t5, e6, r3) {
    this.chunkId = t5, this.offset = e6, this.length = r3;
  }
};
function R(t5) {
  if (A(t5))
    return 0;
  switch (t5.type) {
    case P.Array:
      return 1;
    case P.Boolean:
      return 2;
    case P.Color:
      return 3;
    case P.Date:
      return 4;
    case P.Enum:
      return 5;
    case P.File:
      return 6;
    case P.ResponsiveImage:
      return 10;
    case P.Link:
      return 7;
    case P.Number:
      return 8;
    case P.Object:
      return 9;
    case P.RichText:
      return 11;
    case P.String:
      return 12;
    case P.VectorSetItem:
      return 13;
    default:
      b(t5);
  }
}
function q(e6) {
  let r3 = e6.readUint16(), n4 = [];
  for (let i4 = 0; i4 < r3; i4++) {
    let r4 = t.read(e6);
    n4.push(r4);
  }
  return { type: P.Array, value: n4 };
}
function _(e6, r3) {
  for (let n4 of (e6.writeUint16(r3.value.length), r3.value))
    t.write(e6, n4);
}
function D(e6, r3, n4) {
  let i4 = e6.value.length, s4 = r3.value.length;
  if (i4 < s4)
    return -1;
  if (i4 > s4)
    return 1;
  for (let s5 = 0; s5 < i4; s5++) {
    let i5 = e6.value[s5], a3 = r3.value[s5], o4 = t.compare(i5, a3, n4);
    if (0 !== o4)
      return o4;
  }
  return 0;
}
function j(t5) {
  return { type: P.Boolean, value: 0 !== t5.readUint8() };
}
function C(t5, e6) {
  t5.writeUint8(e6.value ? 1 : 0);
}
function J(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function V(t5) {
  return { type: P.Color, value: t5.readString() };
}
function W(t5, e6) {
  t5.writeString(e6.value);
}
function $(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function z(t5) {
  let e6 = t5.readInt64(), r3 = new Date(e6);
  return { type: P.Date, value: r3.toISOString() };
}
function G(t5, e6) {
  let r3 = new Date(e6.value), n4 = r3.getTime();
  t5.writeInt64(n4);
}
function K(t5, e6) {
  let r3 = new Date(t5.value), n4 = new Date(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function H(t5) {
  return { type: P.Enum, value: t5.readString() };
}
function X(t5, e6) {
  t5.writeString(e6.value);
}
function Q(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function Y(t5) {
  return { type: P.File, value: t5.readString() };
}
function Z(t5, e6) {
  t5.writeString(e6.value);
}
function tt(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function te(t5) {
  return { type: P.Link, value: t5.readJson() };
}
function tr(t5, e6) {
  t5.writeJson(e6.value);
}
function tn(t5, e6) {
  let r3 = JSON.stringify(t5.value), n4 = JSON.stringify(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function ti(t5) {
  return { type: P.Number, value: t5.readFloat64() };
}
function ts(t5, e6) {
  t5.writeFloat64(e6.value);
}
function ta(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function to(e6) {
  let r3 = e6.readUint16(), n4 = {};
  for (let i4 = 0; i4 < r3; i4++) {
    let r4 = e6.readString();
    n4[r4] = t.read(e6);
  }
  return { type: P.Object, value: n4 };
}
function tu(e6, r3) {
  let n4 = Object.entries(r3.value);
  for (let [r4, i4] of (e6.writeUint16(n4.length), n4))
    e6.writeString(r4), t.write(e6, i4);
}
function tl(e6, r3, n4) {
  let i4 = Object.keys(e6.value).sort(), s4 = Object.keys(r3.value).sort();
  if (i4.length < s4.length)
    return -1;
  if (i4.length > s4.length)
    return 1;
  for (let a3 = 0; a3 < i4.length; a3++) {
    let o4 = i4[a3], u4 = s4[a3];
    if (o4 < u4)
      return -1;
    if (o4 > u4)
      return 1;
    let l4 = e6.value[o4] ?? null, h3 = r3.value[u4] ?? null, c4 = t.compare(l4, h3, n4);
    if (0 !== c4)
      return c4;
  }
  return 0;
}
function th(t5) {
  return { type: P.ResponsiveImage, value: t5.readJson() };
}
function tc(t5, e6) {
  t5.writeJson(e6.value);
}
function tf(t5, e6) {
  let r3 = JSON.stringify(t5.value), n4 = JSON.stringify(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function td(t5) {
  let e6 = t5.readInt8();
  if (0 === e6)
    return { type: P.RichText, value: t5.readUint32() };
  if (1 === e6)
    return { type: P.RichText, value: t5.readString() };
  throw Error("Invalid rich text pointer");
}
function tg(t5, e6) {
  if (N(e6.value)) {
    t5.writeInt8(0), t5.writeUint32(e6.value);
    return;
  }
  if (x(e6.value)) {
    t5.writeInt8(1), t5.writeString(e6.value);
    return;
  }
  throw Error("Invalid rich text pointer");
}
function tp(t5, e6) {
  let r3 = t5.value, n4 = e6.value;
  if (N(r3) && N(n4) || x(r3) && x(n4))
    return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
  throw Error("Invalid rich text pointer");
}
function tv(t5) {
  return { type: P.String, value: t5.readString() };
}
function ty(t5, e6) {
  t5.writeString(e6.value);
}
function tm(t5, e6, r3) {
  let n4 = t5.value, i4 = e6.value;
  return (0 === r3.type && (n4 = t5.value.toLowerCase(), i4 = e6.value.toLowerCase()), n4 < i4) ? -1 : n4 > i4 ? 1 : 0;
}
function tw(t5) {
  return { type: P.VectorSetItem, value: t5.readUint32() };
}
function tI(t5, e6) {
  t5.writeUint32(e6.value);
}
function tb(t5, e6) {
  let r3 = t5.value, n4 = e6.value;
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
((t5) => {
  t5.read = function(t6) {
    let e6 = t6.readUint8();
    switch (e6) {
      case 0:
        return null;
      case 1:
        return q(t6);
      case 2:
        return j(t6);
      case 3:
        return V(t6);
      case 4:
        return z(t6);
      case 5:
        return H(t6);
      case 6:
        return Y(t6);
      case 7:
        return te(t6);
      case 8:
        return ti(t6);
      case 9:
        return to(t6);
      case 10:
        return th(t6);
      case 11:
        return td(t6);
      case 12:
        return tv(t6);
      case 13:
        return tw(t6);
      default:
        b(e6);
    }
  }, t5.write = function(t6, e6) {
    let r3 = R(e6);
    if (t6.writeUint8(r3), !A(e6))
      switch (e6.type) {
        case P.Array:
          return _(t6, e6);
        case P.Boolean:
          return C(t6, e6);
        case P.Color:
          return W(t6, e6);
        case P.Date:
          return G(t6, e6);
        case P.Enum:
          return X(t6, e6);
        case P.File:
          return Z(t6, e6);
        case P.Link:
          return tr(t6, e6);
        case P.Number:
          return ts(t6, e6);
        case P.Object:
          return tu(t6, e6);
        case P.ResponsiveImage:
          return tc(t6, e6);
        case P.RichText:
          return tg(t6, e6);
        case P.VectorSetItem:
          return tI(t6, e6);
        case P.String:
          return ty(t6, e6);
        default:
          b(e6);
      }
  }, t5.compare = function(t6, e6, r3) {
    let n4 = R(t6), i4 = R(e6);
    if (n4 < i4)
      return -1;
    if (n4 > i4)
      return 1;
    if (A(t6) || A(e6))
      return 0;
    switch (t6.type) {
      case P.Array:
        return I(e6.type === P.Array), D(t6, e6, r3);
      case P.Boolean:
        return I(e6.type === P.Boolean), J(t6, e6);
      case P.Color:
        return I(e6.type === P.Color), $(t6, e6);
      case P.Date:
        return I(e6.type === P.Date), K(t6, e6);
      case P.Enum:
        return I(e6.type === P.Enum), Q(t6, e6);
      case P.File:
        return I(e6.type === P.File), tt(t6, e6);
      case P.Link:
        return I(e6.type === P.Link), tn(t6, e6);
      case P.Number:
        return I(e6.type === P.Number), ta(t6, e6);
      case P.Object:
        return I(e6.type === P.Object), tl(t6, e6, r3);
      case P.ResponsiveImage:
        return I(e6.type === P.ResponsiveImage), tf(t6, e6);
      case P.RichText:
        return I(e6.type === P.RichText), tp(t6, e6);
      case P.VectorSetItem:
        return I(e6.type === P.VectorSetItem), tb(t6, e6);
      case P.String:
        return I(e6.type === P.String), tm(t6, e6, r3);
      default:
        b(t6);
    }
  };
})(t || (t = {}));
var tU = class e2 {
  sortEntries() {
    this.entries.sort((e6, r3) => {
      for (let n4 = 0; n4 < this.fieldNames.length; n4++) {
        let i4 = e6.values[n4], s4 = r3.values[n4], a3 = t.compare(i4, s4, this.options.collation);
        if (0 !== a3)
          return a3;
      }
      return e6.pointer.compare(r3.pointer);
    });
  }
  static deserialize(r3) {
    let n4 = new p(r3), i4 = n4.readJson(), s4 = n4.readUint8(), a3 = [];
    for (let t5 = 0; t5 < s4; t5++) {
      let t6 = n4.readString();
      a3.push(t6);
    }
    let o4 = new e2(a3, { collation: i4 }), u4 = n4.readUint32();
    for (let e6 = 0; e6 < u4; e6++) {
      let e7 = [];
      for (let r5 = 0; r5 < s4; r5++) {
        let r6 = t.read(n4);
        e7.push(r6);
      }
      let r4 = O.read(n4);
      o4.entries.push({ values: e7, pointer: r4 });
    }
    return o4;
  }
  serialize() {
    let e6 = new F();
    for (let t5 of (e6.writeJson(this.options.collation), e6.writeUint8(this.fieldNames.length), this.fieldNames))
      e6.writeString(t5);
    for (let r3 of (this.sortEntries(), e6.writeUint32(this.entries.length), this.entries)) {
      let { values: n4, pointer: i4 } = r3;
      for (let r4 of n4)
        t.write(e6, r4);
      i4.write(e6);
    }
    return e6.subarray();
  }
  addItem(t5, e6) {
    let r3 = this.fieldNames.map((e7) => t5.getField(e7) ?? null);
    this.entries.push({ values: r3, pointer: e6 });
  }
  constructor(t5, e6) {
    this.fieldNames = t5, this.options = e6, c(this, "entries", []);
  }
};
var tS = 3;
var tk = 250;
var tL = [
  408,
  // Request Timeout
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
];
var tB = async (t5, e6) => {
  let r3 = 0;
  for (; ; ) {
    try {
      let n4 = await fetch(t5, e6);
      if (!tL.includes(n4.status) || ++r3 > tS)
        return n4;
    } catch (t6) {
      if (e6?.signal?.aborted || ++r3 > tS)
        throw t6;
    }
    await tE(r3);
  }
};
async function tE(t5) {
  let e6 = Math.floor(tk * (Math.random() + 1) * 2 ** (t5 - 1));
  await new Promise((t6) => {
    setTimeout(t6, e6);
  });
}
async function tM(t5, e6) {
  let r3 = tx(e6), n4 = [], i4 = 0;
  for (let t6 of r3)
    n4.push(`${t6.from}-${t6.to - 1}`), i4 += t6.to - t6.from;
  let s4 = new URL(t5), a3 = n4.join(",");
  s4.searchParams.set("range", a3);
  let o4 = await tB(s4);
  if (200 !== o4.status)
    throw Error(`Request failed: ${o4.status} ${o4.statusText}`);
  let u4 = await o4.arrayBuffer(), l4 = new Uint8Array(u4);
  if (l4.length !== i4)
    throw Error("Request failed: Unexpected response length");
  let h3 = new tT(), c4 = 0;
  for (let t6 of r3) {
    let e7 = t6.to - t6.from, r4 = c4 + e7, n5 = l4.subarray(c4, r4);
    h3.write(t6.from, n5), c4 = r4;
  }
  return e6.map((t6) => h3.read(t6.from, t6.to - t6.from));
}
var tT = class {
  read(t5, e6) {
    for (let r3 of this.chunks) {
      if (t5 < r3.start)
        break;
      if (t5 > r3.end)
        continue;
      if (t5 + e6 > r3.end)
        break;
      let n4 = t5 - r3.start, i4 = n4 + e6;
      return r3.data.slice(n4, i4);
    }
    throw Error("Missing data");
  }
  write(t5, e6) {
    let r3 = t5, n4 = r3 + e6.length, i4 = 0, s4 = this.chunks.length;
    for (; i4 < s4; i4++) {
      let t6 = this.chunks[i4];
      if (I(t6, "Missing chunk"), !(r3 > t6.end)) {
        if (r3 > t6.start) {
          let n5 = r3 - t6.start, i5 = t6.data.subarray(0, n5);
          e6 = tF(i5, e6), r3 = t6.start;
        }
        break;
      }
    }
    for (; s4 > i4; s4--) {
      let t6 = this.chunks[s4 - 1];
      if (I(t6, "Missing chunk"), !(n4 < t6.start)) {
        if (n4 < t6.end) {
          let r4 = n4 - t6.start, i5 = t6.data.subarray(r4);
          e6 = tF(e6, i5), n4 = t6.end;
        }
        break;
      }
    }
    let a3 = { start: r3, end: n4, data: e6 }, o4 = s4 - i4;
    this.chunks.splice(i4, o4, a3);
  }
  constructor() {
    c(this, "chunks", []);
  }
};
function tF(t5, e6) {
  let r3 = t5.length + e6.length, n4 = new Uint8Array(r3);
  return n4.set(t5, 0), n4.set(e6, t5.length), n4;
}
function tx(t5) {
  I(t5.length > 0, "Must have at least one range");
  let e6 = [...t5].sort((t6, e7) => t6.from - e7.from), r3 = [];
  for (let t6 of e6) {
    let e7 = r3.length - 1, n4 = r3[e7];
    n4 && t6.from <= n4.to ? r3[e7] = { from: n4.from, to: Math.max(n4.to, t6.to) } : r3.push(t6);
  }
  return r3;
}
var tN = class {
  async loadModel() {
    let [t5] = await tM(this.options.url, [this.options.range]);
    return I(t5, "Failed to load model"), tU.deserialize(t5);
  }
  async getModel() {
    return this.modelPromise ?? (this.modelPromise = this.loadModel()), this.model ?? (this.model = await this.modelPromise), this.model;
  }
  async lookupItems(t5) {
    I(t5.length === this.fields.length, "Invalid query length");
    let e6 = await this.getModel(), r3 = t5.reduce((t6, e7, r4) => t6.flatMap((t7) => {
      switch (e7.type) {
        case "All":
          return [t7];
        case "Equals":
          return this.queryEquals(t7, e7, r4);
        case "NotEquals":
          return this.queryNotEquals(t7, e7, r4);
        case "LessThan":
          return this.queryLessThan(t7, e7, r4);
        case "GreaterThan":
          return this.queryGreaterThan(t7, e7, r4);
        case "Contains":
          return this.queryContains(t7, e7, r4);
        case "StartsWith":
          return this.queryStartsWith(t7, e7, r4);
        case "EndsWith":
          return this.queryEndsWith(t7, e7, r4);
        default:
          b(e7);
      }
    }), [e6.entries]), n4 = [];
    for (let t6 of r3)
      for (let e7 of t6) {
        let t7 = {};
        for (let r4 = 0; r4 < this.options.fieldNames.length; r4++) {
          let n5 = this.options.fieldNames[r4], i4 = e7.values[r4];
          t7[n5] = i4;
        }
        n4.push({ pointer: e7.pointer.toString(), data: t7 });
      }
    return n4;
  }
  queryEquals(t5, e6, r3) {
    let n4 = this.getLeftMost(t5, r3, e6.value), i4 = this.getRightMost(t5, r3, e6.value), s4 = t5.slice(n4, i4 + 1);
    return s4.length > 0 ? [s4] : [];
  }
  queryNotEquals(t5, e6, r3) {
    let n4 = this.getLeftMost(t5, r3, e6.value), i4 = this.getRightMost(t5, r3, e6.value), s4 = [], a3 = t5.slice(0, n4);
    a3.length > 0 && s4.push(a3);
    let o4 = t5.slice(i4 + 1);
    return o4.length > 0 && s4.push(o4), s4;
  }
  queryLessThan(t5, e6, r3) {
    let n4 = this.getRightMost(t5, r3, null);
    if (t5 = t5.slice(n4 + 1), e6.inclusive) {
      let n5 = this.getRightMost(t5, r3, e6.value), i5 = t5.slice(0, n5 + 1);
      return i5.length > 0 ? [i5] : [];
    }
    let i4 = this.getLeftMost(t5, r3, e6.value), s4 = t5.slice(0, i4);
    return s4.length > 0 ? [s4] : [];
  }
  queryGreaterThan(t5, e6, r3) {
    let n4 = this.getRightMost(t5, r3, null);
    if (t5 = t5.slice(n4 + 1), e6.inclusive) {
      let n5 = this.getLeftMost(t5, r3, e6.value), i5 = t5.slice(n5);
      return i5.length > 0 ? [i5] : [];
    }
    let i4 = this.getRightMost(t5, r3, e6.value), s4 = t5.slice(i4 + 1);
    return s4.length > 0 ? [s4] : [];
  }
  queryContains(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.includes(n4);
    });
  }
  queryStartsWith(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.startsWith(n4);
    });
  }
  queryEndsWith(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.endsWith(n4);
    });
  }
  /**
  * Returns the index of the left most entry that is equal to the target.
  *
  * ```text
  *   Left most
  *       ↓
  * ┌───┬───┬───┬───┬───┬───┐
  * │ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │
  * └───┴───┴───┴───┴───┴───┘
  * ```
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param target The target value to search for.
  * @returns The index of the left most entry that is equal to the target.
  */
  getLeftMost(e6, r3, n4) {
    let i4 = 0, s4 = e6.length;
    for (; i4 < s4; ) {
      let a3 = i4 + s4 >> 1, o4 = e6[a3], u4 = o4.values[r3];
      0 > t.compare(u4, n4, this.collation) ? i4 = a3 + 1 : s4 = a3;
    }
    return i4;
  }
  /**
  * Returns the index of the right most entry that is equal to the target.
  *
  * ```text
  *              Right most
  *                   ↓
  * ┌───┬───┬───┬───┬───┬───┐
  * │ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │
  * └───┴───┴───┴───┴───┴───┘
  * ```
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param target The target value to search for.
  * @returns The index of the right most entry that is equal to the target.
  */
  getRightMost(e6, r3, n4) {
    let i4 = 0, s4 = e6.length;
    for (; i4 < s4; ) {
      let a3 = i4 + s4 >> 1, o4 = e6[a3], u4 = o4.values[r3];
      t.compare(u4, n4, this.collation) > 0 ? s4 = a3 : i4 = a3 + 1;
    }
    return s4 - 1;
  }
  /**
  * Finds all items that are matching the predicate and groups adjacent items together.
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param predicate The predicate to match the values against.
  * @returns An array of chunks that match the predicate.
  */
  findItems(t5, e6, r3) {
    let n4 = [], i4 = 0;
    for (let s4 = 0; s4 < t5.length; s4++) {
      let a3 = t5[s4], o4 = a3.values[e6], u4 = r3(o4);
      if (!u4) {
        if (i4 < s4) {
          let e7 = t5.slice(i4, s4);
          n4.push(e7);
        }
        i4 = s4 + 1;
      }
    }
    if (i4 < t5.length) {
      let e7 = t5.slice(i4);
      n4.push(e7);
    }
    return n4;
  }
  constructor(t5) {
    this.options = t5, c(this, "schema"), c(this, "fields"), c(this, "supportedLookupTypes", [
      "All",
      "Equals",
      "NotEquals",
      "LessThan",
      "GreaterThan",
      "Contains",
      "StartsWith",
      "EndsWith"
      /* EndsWith */
    ]), c(this, "modelPromise"), c(this, "model"), c(this, "collation");
    let e6 = {}, r3 = [];
    for (let t6 of this.options.fieldNames) {
      let n4 = this.options.collectionSchema[t6];
      I(n4, "Missing definition for field", t6), e6[t6] = n4, r3.push({ type: "Identifier", name: t6 });
    }
    this.schema = e6, this.fields = r3, this.collation = this.options.collation;
  }
};
var tA = class e3 {
  static read(r3) {
    let n4 = new e3(), i4 = r3.readUint16();
    for (let e6 = 0; e6 < i4; e6++) {
      let e7 = r3.readString(), i5 = t.read(r3);
      n4.setField(e7, i5);
    }
    return n4;
  }
  write(e6) {
    for (let [r3, n4] of (e6.writeUint16(this.fields.size), this.fields))
      e6.writeString(r3), t.write(e6, n4);
  }
  getData() {
    let t5 = {};
    for (let [e6, r3] of this.fields)
      t5[e6] = r3;
    return t5;
  }
  setField(t5, e6) {
    this.fields.set(t5, e6);
  }
  getField(t5) {
    return this.fields.get(t5);
  }
  constructor() {
    c(this, "fields", /* @__PURE__ */ new Map());
  }
};
var tO = class {
  scanItems() {
    return this.itemsPromise ?? (this.itemsPromise = tB(this.url).then(async (t5) => {
      if (!t5.ok)
        throw Error(`Request failed: ${t5.status} ${t5.statusText}`);
      let e6 = await t5.arrayBuffer(), r3 = new Uint8Array(e6), n4 = new p(r3), i4 = [], s4 = n4.readUint32();
      for (let t6 = 0; t6 < s4; t6++) {
        let t7 = n4.getOffset(), e7 = tA.read(n4), r4 = n4.getOffset() - t7, s5 = new O(this.id, t7, r4), a3 = s5.toString(), o4 = { pointer: a3, data: e7.getData() };
        this.itemLoader.prime(a3, o4), i4.push(o4);
      }
      return i4;
    })), this.itemsPromise;
  }
  resolveItem(t5) {
    return this.itemLoader.load(t5);
  }
  constructor(t5, e6) {
    this.id = t5, this.url = e6, c(this, "itemsPromise"), c(this, "itemLoader", new d.default(async (t6) => {
      let e7 = t6.map((t7) => {
        let e8 = O.fromString(t7);
        return { from: e8.offset, to: e8.offset + e8.length };
      }), r3 = await tM(this.url, e7);
      return r3.map((e8, r4) => {
        let n4 = new p(e8), i4 = tA.read(n4), s4 = t6[r4];
        return I(s4, "Missing pointer"), { pointer: s4, data: i4.getData() };
      });
    }, { maxBatchSize: 250 }));
  }
};
var tP = class {
  async scanItems() {
    let t5 = await Promise.all(this.chunks.map(async (t6) => t6.scanItems()));
    return t5.flat();
  }
  resolveItems(t5) {
    return Promise.all(t5.map((t6) => {
      let e6 = O.fromString(t6), r3 = this.chunks[e6.chunkId];
      return I(r3, "Missing chunk"), r3.resolveItem(t6);
    }));
  }
  compareItems(t5, e6) {
    let r3 = O.fromString(t5.pointer), n4 = O.fromString(e6.pointer);
    return r3.compare(n4);
  }
  compareValues(e6, r3, n4) {
    return t.compare(e6, r3, n4);
  }
  constructor(t5) {
    this.options = t5, c(this, "id"), c(this, "schema"), c(this, "indexes"), c(this, "resolveRichText"), c(this, "resolveVectorSetItem"), c(this, "chunks"), this.chunks = this.options.chunks.map((t6, e6) => new tO(e6, t6)), this.schema = t5.schema, this.indexes = t5.indexes, this.resolveRichText = t5.resolveRichText, this.resolveVectorSetItem = t5.resolveVectorSetItem, this.id = t5.id;
  }
};

// http-url:https://framerusercontent.com/modules/y8UJBBVllb4vwCLZ4xkU/RQmWNZyIldf0pETqV2CG/bN5vmZNAg-1.js
import { jsx as e4 } from "react/jsx-runtime";
import { AutoBreakpointVariant as t3, ComponentPresetsConsumer as r2, Link as n2, motion as o2 } from "./_framer-runtime.js";
import { isValidElement as i2 } from "react";
import { Fragment as p2, createElement as s2 } from "react";
var a2;
var l2 = "undefined" != typeof window;
var f2 = l2 && "function" == typeof window.requestIdleCallback;
var u2 = "preload";
function c2(e6) {
  return "object" == typeof e6 && null !== e6 && !/* @__PURE__ */ i2(e6) && u2 in e6;
}
function m2(e6, ...t5) {
  if (!e6)
    throw Error("Assertion Error" + (t5.length > 0 ? ": " + t5.join(" ") : ""));
}
var d2 = ((a2 = d2 || {})[a2.Fragment = 1] = "Fragment", a2[a2.Link = 2] = "Link", a2[a2.Module = 3] = "Module", a2[a2.Tag = 4] = "Tag", a2[a2.Text = 5] = "Text", a2);
function g2(i4) {
  let a3 = /* @__PURE__ */ new Map();
  return (l4) => {
    let f4 = a3.get(l4);
    if (f4)
      return f4;
    let u4 = JSON.parse(l4), d4 = function a4(l5) {
      switch (l5[0]) {
        case 1: {
          let [, ...e6] = l5, t5 = e6.map(a4);
          return /* @__PURE__ */ s2(p2, void 0, ...t5);
        }
        case 2: {
          let [, e6, ...t5] = l5, r3 = t5.map(a4);
          return /* @__PURE__ */ s2(n2, e6, ...r3);
        }
        case 3: {
          let [, n4, o4, f5, u5] = l5;
          for (let e6 of f5) {
            let t5 = o4[e6];
            t5 && (o4[e6] = a4(t5));
          }
          for (let e6 of u5) {
            let t5 = o4[e6];
            if ("string" != typeof t5)
              continue;
            let r3 = i4[t5];
            r3 && (c2(r3) && r3.preload(), o4[e6] = r3);
          }
          let p4 = i4[n4];
          return m2(p4, "Module not found"), c2(p4) && p4.preload(), /* @__PURE__ */ e4(r2, { componentIdentifier: n4, children: (r3) => /* @__PURE__ */ e4(t3, { component: p4, props: { ...r3, ...o4 } }) });
        }
        case 4: {
          let [, e6, t5, ...r3] = l5, n4 = r3.map(a4);
          if ("a" === e6)
            return /* @__PURE__ */ s2(o2.a, t5, ...n4);
          return /* @__PURE__ */ s2(e6, t5, ...n4);
        }
        case 5: {
          let [, e6] = l5;
          return e6;
        }
      }
    }(u4);
    return a3.set(l4, d4), d4;
  };
}

// http-url:https://framerusercontent.com/modules/y8UJBBVllb4vwCLZ4xkU/RQmWNZyIldf0pETqV2CG/bN5vmZNAg.js
var i3 = { c6QCl_qjd: { isNullable: true, type: l3.String }, createdAt: { isNullable: true, type: l3.Date }, gFkK1pVLq: { isNullable: true, type: l3.String }, id: { isNullable: false, type: l3.String }, LdFjSxs7V: { isNullable: true, type: l3.RichText }, mYaRK7HjE: { isNullable: true, type: l3.ResponsiveImage }, nextItemId: { isNullable: true, type: l3.String }, OE9lZWz4L: { isNullable: true, type: l3.String }, previousItemId: { isNullable: true, type: l3.String }, pWU4_Pal3: { isNullable: true, type: l3.String }, updatedAt: { isNullable: true, type: l3.Date }, vFgw3kp2G: { isNullable: true, type: l3.Boolean } };
var o3 = ["id"];
var n3 = { type: 1 };
var d3 = ["previousItemId"];
var c3 = ["nextItemId"];
var u3 = ["id", "pWU4_Pal3"];
var p3 = ["pWU4_Pal3", "id"];
var s3 = ["c6QCl_qjd"];
var f3 = { type: 0 };
var N2 = ["pWU4_Pal3"];
var g3 = ["vFgw3kp2G"];
var y2 = ["OE9lZWz4L"];
var b2 = ["gFkK1pVLq"];
var h2 = ["mYaRK7HjE"];
var w2 = ["LdFjSxs7V"];
var v2 = [];
var S2 = (e6) => {
  let l4 = v2[e6];
  if (l4)
    return l4().then((e7) => e7.default);
};
var L2 = {};
var x2 = g2(L2);
var I2 = new t4();
var R2 = { collectionByLocaleId: { default: new tP({ chunks: [new URL("./bN5vmZNAg-chunk-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/")], id: "dd3d94b5-5295-4a87-91cd-d2d24bed63bedefault", indexes: [new tN({ collation: n3, collectionSchema: i3, fieldNames: o3, range: { from: 0, to: 265 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: n3, collectionSchema: i3, fieldNames: d3, range: { from: 265, to: 529 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: n3, collectionSchema: i3, fieldNames: c3, range: { from: 529, to: 789 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: n3, collectionSchema: i3, fieldNames: u3, range: { from: 789, to: 1568 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: n3, collectionSchema: i3, fieldNames: p3, range: { from: 1568, to: 2347 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: s3, range: { from: 2347, to: 3007 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: N2, range: { from: 3007, to: 3640 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: g3, range: { from: 3640, to: 3792 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: y2, range: { from: 3792, to: 4994 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: b2, range: { from: 4994, to: 5300 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: h2, range: { from: 5300, to: 9419 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") }), new tN({ collation: f3, collectionSchema: i3, fieldNames: w2, range: { from: 9419, to: 53566 }, url: new URL("./bN5vmZNAg-indexes-default-0.framercms", import.meta.url).href.replace("/modules/", "/cms/") })], resolveRichText: x2, resolveVectorSetItem: S2, schema: i3 }) }, displayName: "/blog", id: "dd3d94b5-5295-4a87-91cd-d2d24bed63be" };
var bN5vmZNAg_default = R2;
e5(R2, { c6QCl_qjd: { defaultValue: "", title: "Title", type: l3.String }, pWU4_Pal3: { preventLocalization: false, title: "Slug", type: l3.String }, vFgw3kp2G: { defaultValue: true, title: "Featured", type: l3.Boolean }, OE9lZWz4L: { defaultValue: "", title: "Excerpt", type: l3.String }, gFkK1pVLq: { defaultValue: "", title: "Date", type: l3.String }, mYaRK7HjE: { title: "Image", type: l3.ResponsiveImage }, LdFjSxs7V: { defaultValue: "", title: "Content", type: l3.RichText }, createdAt: { title: "Created", type: l3.Date }, updatedAt: { title: "Updated", type: l3.Date }, previousItemId: { dataIdentifier: "local-module:collection/bN5vmZNAg:default", title: "Previous", type: l3.CollectionReference }, nextItemId: { dataIdentifier: "local-module:collection/bN5vmZNAg:default", title: "Next", type: l3.CollectionReference } });

// http-url:https://framerusercontent.com/modules/9E1Nn4Skmk69bkV9UXYM/kEBo9s0q1yuaJeYbwrMv/y2BzdVdPx.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getFontsFromSharedStyle, getLoadingLazyAtYPosition, Image, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";

// http-url:https://framerusercontent.com/modules/9ip7q1JwyLaITIqr92GV/vAujWfGKZNRncSGIYM1K/kHRLKrhqI.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["FR;InterDisplay-Medium", "FR;InterDisplay-Bold", "FR;InterDisplay-BoldItalic", "FR;InterDisplay-MediumItalic"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/ePuN3mCjzajIHnyCdvKBFiZkyY0.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/V3j1L0o5vPFKe26Sw4HcpXCfHo.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/F3kdpd2N0cToWV5huaZjjgM.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/0iDmxkizU9goZoclqIqsV5rvETU.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/r0mv3NegmA0akcQsNFotG32Las.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/iwWTDc49ENF2tCHbqlNARXw6Ug.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/Ii21jnSJkulBKsHHXKlapi7fv9w.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/I11LrmuBDQZweplJ62KkVsklU5Y.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/UjFZPDy3qGuDktQM4q9CxhKfIa8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/8exwVHJy2DhJ4N5prYlVMrEKmQ.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/UTeedEK21hO5jDxEUldzdScUqpg.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/Ig8B8nzy11hzIWEIYnkg91sofjo.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/qITWJ2WdG0wrgQPDb8lvnYnTXDg.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/qctQFoJqJ9aIbRSIp0AhCQpFxn8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/fXvVh2JeZlehNcEhKHpHH0frSl0.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/7pScaNeb6M7n2HF2jKemDqzCIr4.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/qS4UjQYyATcVV9rODk0Zx9KhkY8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/VfD2n20yM7v0hrUEBHEyafsmMBY.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/4oIO9fB59bn3cKFWz7piCj28z9s.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/MzumQQZJQBC6KM1omtmwOtsogtI.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/F5Lmfd3fCAu7TwiYbI4DLWw4ks.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/A5P4nkYCJlLQxGxaS1lzG8PNSc.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/vuPfygr1n1zYxscvWgGI8hRf3LE.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/jplzYzqFHXreyADwk9yrkQlWQ.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/sSIKP2TfVPvfK7YVENPE5H87A.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/gawbeo7iEJSRZ4kcrh6YRrU8o.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/RkMAGv2iAm3rw7tZzs7FaZf0rM.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/8E92vrr3j1gDqzepmeSbD2u0JxA.woff2", weight: "500" }] }];
var css = [`.framer-GR1Rk .framer-styles-preset-jcm9hg:not(.rich-text-wrapper), .framer-GR1Rk .framer-styles-preset-jcm9hg.rich-text-wrapper p { --framer-font-family: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-bold: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-italic: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on; --framer-font-size: 20px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0px; --framer-line-height: 150%; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-396d90b4-9ee1-4ab1-944c-3113af433c78, #606060); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`];
var className = "framer-GR1Rk";

// http-url:https://framerusercontent.com/modules/n6XnvZb1tD3hb7LqfckT/SxK31hIoDsA7wR3kyRbu/kzXPbUgl6.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["FR;InterDisplay", "FR;InterDisplay-Bold", "FR;InterDisplay-BoldItalic", "FR;InterDisplay-Italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/2uIBiALfCHVpWbHqRMZutfT7giU.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/Zwfz6xbVe5pmcWRJRgBDHnMkOkI.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/U9LaDDmbRhzX3sB8g8glTy5feTE.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/tVew2LzXJ1t7QfxP1gdTIdj2o0g.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/DF7bjCRmStYPqSb945lAlMfCCVQ.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/bHYNJqzTyl2lqvmMiRRS6Y16Es.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/vebZUMjGyKkYsfcY73iwWTzLNag.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/I11LrmuBDQZweplJ62KkVsklU5Y.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/UjFZPDy3qGuDktQM4q9CxhKfIa8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/8exwVHJy2DhJ4N5prYlVMrEKmQ.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/UTeedEK21hO5jDxEUldzdScUqpg.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/Ig8B8nzy11hzIWEIYnkg91sofjo.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/qITWJ2WdG0wrgQPDb8lvnYnTXDg.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/qctQFoJqJ9aIbRSIp0AhCQpFxn8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/fXvVh2JeZlehNcEhKHpHH0frSl0.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/7pScaNeb6M7n2HF2jKemDqzCIr4.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/qS4UjQYyATcVV9rODk0Zx9KhkY8.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/VfD2n20yM7v0hrUEBHEyafsmMBY.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/4oIO9fB59bn3cKFWz7piCj28z9s.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/MzumQQZJQBC6KM1omtmwOtsogtI.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/F5Lmfd3fCAu7TwiYbI4DLWw4ks.woff2", weight: "700" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/THWAFHoAcmqLMy81E8hCSdziVKA.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/sQxGYWDlRkDr0eOKqiNRl6g5rs.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/NNTAT1XAm8ZRkr824inYPkjNeL4.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/P2qr9PAWBt905929rHfxmneMUG0.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/2BmSa4TZZvFKAZg2DydxTbvKlTU.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/P0JCAnd2N1Q6qwTQohre3XmQ.woff2", weight: "400" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/KMFW46iYsEZaUBwXbwPc9nQm71o.woff2", weight: "400" }] }];
var css2 = [`.framer-vx5xh .framer-styles-preset-1miusx:not(.rich-text-wrapper), .framer-vx5xh .framer-styles-preset-1miusx.rich-text-wrapper p { --framer-font-family: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-bold: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-family-italic: "Inter Display", "Inter Display Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0em; --framer-line-height: 160%; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-396d90b4-9ee1-4ab1-944c-3113af433c78, #606060); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`];
var className2 = "framer-vx5xh";

// http-url:https://framerusercontent.com/modules/9E1Nn4Skmk69bkV9UXYM/kEBo9s0q1yuaJeYbwrMv/y2BzdVdPx.js
var enabledGestures = { omP1ArXQ8: { hover: true } };
var cycleOrder = ["omP1ArXQ8", "yH_WEwULe"];
var serializationHash = "framer-6845o";
var variantClassNames = { omP1ArXQ8: "framer-v-1sl0qcp", yH_WEwULe: "framer-v-1prtujs" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion.create(React.Fragment);
var humanReadableVariantMap = { Desktop: "omP1ArXQ8", Phone: "yH_WEwULe" };
var getProps = ({ date, height, id, image, title, width, ...props }) => {
  return { ...props, BZ02a0WAQ: title ?? props.BZ02a0WAQ ?? "Forvandle uterommet med ekspertråd", Ig_aHHTzc: date ?? props.Ig_aHHTzc ?? "1. des. 2025", mx8L3SAx1: image ?? props.mx8L3SAx1 ?? { alt: "Blog Image", pixelHeight: 976, pixelWidth: 884, src: "https://framerusercontent.com/images/9C8LdinQbsFihgbYjeigXcuUuA.png?width=884&height=976", srcSet: "https://framerusercontent.com/images/9C8LdinQbsFihgbYjeigXcuUuA.png?width=884&height=976 884w" }, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "omP1ArXQ8" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className: className3, layoutId, variant, mx8L3SAx1, Ig_aHHTzc, BZ02a0WAQ, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "omP1ArXQ8", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className2, className];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-1sl0qcp", className3, classNames), "data-framer-name": "Desktop", layoutDependency, layoutId: "omP1ArXQ8", ref: refBinding, style: { backgroundColor: "var(--token-faf660b1-b323-4a6e-95c7-74bb55134f69, rgb(255, 255, 255))", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, ...style }, variants: { yH_WEwULe: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 } }, ...addPropertyOverrides({ "omP1ArXQ8-hover": { "data-framer-name": void 0 }, yH_WEwULe: { "data-framer-name": "Phone" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx(motion.div, { className: "framer-998zts", "data-framer-name": "Image", layoutDependency, layoutId: "M20fhhbMX", style: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, children: /* @__PURE__ */ _jsx(Image, { background: { alt: "Blog Image", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 24 + (((componentViewport?.height || 421) - 48 - 463.4) / 2 + 0 + 0) + 0), pixelHeight: 976, pixelWidth: 884, sizes: `max(${componentViewport?.width || "100vw"} - 48px, 1px)`, ...toResponsiveImage(mx8L3SAx1) }, className: "framer-g43w08", "data-framer-name": "Image", layoutDependency, layoutId: "GvyZFpwca", style: { rotate: 0, scale: 1 }, variants: { "omP1ArXQ8-hover": { rotate: 9, scale: 1.2 } }, ...addPropertyOverrides({ yH_WEwULe: { background: { alt: "Blog Image", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 20 + (((componentViewport?.height || 420) - 40 - 463.4) / 2 + 0 + 0) + 0), pixelHeight: 976, pixelWidth: 884, sizes: `max(${componentViewport?.width || "100vw"} - 40px, 1px)`, ...toResponsiveImage(mx8L3SAx1) } } }, baseVariant, gestureVariant) }) }), /* @__PURE__ */ _jsxs(motion.div, { className: "framer-1v0qf5e", "data-framer-name": "Date & Title", layoutDependency, layoutId: "ZMeZ2CDJL", children: [/* @__PURE__ */ _jsxs(motion.div, { className: "framer-4scb1m", "data-framer-name": "Date", layoutDependency, layoutId: "RObPwZt71", children: [/* @__PURE__ */ _jsx(motion.div, { className: "framer-1mgwu3v", "data-framer-name": "Line", layoutDependency, layoutId: "aBVW6wk0n", style: { backgroundColor: "var(--token-396d90b4-9ee1-4ab1-944c-3113af433c78, rgb(96, 96, 96))" }, variants: { "omP1ArXQ8-hover": { backgroundColor: "var(--token-9e8a9b46-d051-431c-8150-32b11507662e, rgb(190, 221, 37))" } } }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-1miusx", "data-styles-preset": "kzXPbUgl6", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-396d90b4-9ee1-4ab1-944c-3113af433c78, rgb(96, 96, 96)))" }, children: "1. des. 2025" }) }), className: "framer-wp5h0c", fonts: ["Inter"], layoutDependency, layoutId: "bHhWV9tsh", style: { "--extracted-r6o4lv": "var(--token-396d90b4-9ee1-4ab1-944c-3113af433c78, rgb(96, 96, 96))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: Ig_aHHTzc, variants: { "omP1ArXQ8-hover": { "--extracted-r6o4lv": "rgba(190, 221, 37, 0.8)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "omP1ArXQ8-hover": { children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-1miusx", "data-styles-preset": "kzXPbUgl6", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, rgba(190, 221, 37, 0.8))" }, children: "1. des. 2025" }) }) } }, baseVariant, gestureVariant) })] }), /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-jcm9hg", "data-styles-preset": "kHRLKrhqI", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31)))" }, children: "Forvandle uterommet med ekspertråd" }) }), className: "framer-1wxy0fy", fonts: ["Inter"], layoutDependency, layoutId: "qfmzjUIW1", style: { "--extracted-r6o4lv": "var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: BZ02a0WAQ, variants: { "omP1ArXQ8-hover": { "--extracted-r6o4lv": "var(--token-9e8a9b46-d051-431c-8150-32b11507662e, rgb(190, 221, 37))" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "omP1ArXQ8-hover": { children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { className: "framer-styles-preset-jcm9hg", "data-styles-preset": "kHRLKrhqI", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-9e8a9b46-d051-431c-8150-32b11507662e, rgb(190, 221, 37)))" }, children: "Forvandle uterommet med ekspertråd" }) }) } }, baseVariant, gestureVariant) })] })] }) }) }) });
});
var css3 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-6845o.framer-30h7qg, .framer-6845o .framer-30h7qg { display: block; }", ".framer-6845o.framer-1sl0qcp { align-content: flex-start; align-items: flex-start; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 24px; position: relative; width: 381px; will-change: var(--framer-will-change-override, transform); }", ".framer-6845o .framer-998zts { align-content: center; align-items: center; aspect-ratio: 1.2566037735849056 / 1; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: var(--framer-aspect-ratio-supported, 265px); justify-content: center; overflow: hidden; padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-6845o .framer-g43w08 { flex: 1 0 0px; gap: 10px; height: 100%; position: relative; width: 1px; }", ".framer-6845o .framer-1v0qf5e { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; max-width: 294px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-6845o .framer-4scb1m { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 2px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-6845o .framer-1mgwu3v { flex: none; height: 1px; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 20px; }", ".framer-6845o .framer-wp5h0c { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-6845o .framer-1wxy0fy { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-6845o.framer-v-1prtujs.framer-1sl0qcp { cursor: unset; padding: 20px; }", ".framer-6845o.framer-v-1prtujs .framer-998zts { height: var(--framer-aspect-ratio-supported, 271px); }", ".framer-6845o.framer-v-1prtujs .framer-1v0qf5e { max-width: unset; }", ...css2, ...css];
var Framery2BzdVdPx = withCSS(Component, css3, "framer-6845o");
var y2BzdVdPx_default = Framery2BzdVdPx;
Framery2BzdVdPx.displayName = "Blog Card v1";
Framery2BzdVdPx.defaultProps = { height: 421, width: 381 };
addPropertyControls(Framery2BzdVdPx, { variant: { options: ["omP1ArXQ8", "yH_WEwULe"], optionTitles: ["Desktop", "Phone"], title: "Variant", type: ControlType.Enum }, mx8L3SAx1: { __defaultAssetReference: "data:framer/asset-reference,9C8LdinQbsFihgbYjeigXcuUuA.png?originalFilename=Image.png&width=884&height=976", __vekterDefault: { alt: "Blog Image", assetReference: "data:framer/asset-reference,9C8LdinQbsFihgbYjeigXcuUuA.png?originalFilename=Image.png&width=884&height=976" }, title: "Image", type: ControlType.ResponsiveImage }, Ig_aHHTzc: { defaultValue: "1. des. 2025", displayTextArea: false, title: "Date", type: ControlType.String }, BZ02a0WAQ: { defaultValue: "Forvandle uterommet med ekspertråd", displayTextArea: false, title: "Title", type: ControlType.String } });
addFonts(Framery2BzdVdPx, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts2), ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/4OLrxyzfTjMzS2CWvcvI/B17WKPewOauM0gE8fuvl/T79x6ameU.js
var RichTextWithFX = withFX(RichText2);
var BlogCardV1Fonts = getFonts(y2BzdVdPx_default);
var MotionDivWithFX = withFX(motion2.div);
var cycleOrder2 = ["Umqxf9j2X", "xKyuEZda1", "N4kEcO0q5"];
var serializationHash2 = "framer-aoPQB";
var variantClassNames2 = { N4kEcO0q5: "framer-v-1407t4d", Umqxf9j2X: "framer-v-inbsab", xKyuEZda1: "framer-v-1qsj48k" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var animation = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 30 };
var transition2 = { damping: 70, delay: 0.1, mass: 1.1, stiffness: 400, type: "spring" };
var animation1 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 50 };
var transition3 = { delay: 0.3, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var toResponsiveImage2 = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var query1 = () => ({ from: { alias: "RU8LzqfwT", data: bN5vmZNAg_default, type: "Collection" }, limit: { type: "LiteralValue", value: 3 }, offset: { type: "LiteralValue", value: 1 }, select: [{ collection: "RU8LzqfwT", name: "pWU4_Pal3", type: "Identifier" }, { collection: "RU8LzqfwT", name: "mYaRK7HjE", type: "Identifier" }, { collection: "RU8LzqfwT", name: "gFkK1pVLq", type: "Identifier" }, { collection: "RU8LzqfwT", name: "c6QCl_qjd", type: "Identifier" }, { collection: "RU8LzqfwT", name: "id", type: "Identifier" }] });
var QueryData = ({ query, pageSize, children }) => {
  const { paginatedQuery, paginationInfo, loadMore } = useLoadMorePaginatedQuery(query, pageSize, "RU8LzqfwT");
  const data = useQueryData(paginatedQuery);
  return children(data, paginationInfo, loadMore);
};
var Transition2 = ({ value, children }) => {
  const config = React2.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React2.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx2(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { Desktop: "Umqxf9j2X", Phone: "N4kEcO0q5", Tablet: "xKyuEZda1" };
var Variants2 = motion2.create(React2.Fragment);
var getProps2 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "Umqxf9j2X" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React2.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className: className3, layoutId, variant, ...restProps } = getProps2(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder: cycleOrder2, defaultVariant: "Umqxf9j2X", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx2(serializationHash2, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx2(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx2(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx2(Transition2, { value: transition12, children: /* @__PURE__ */ _jsx2(motion2.section, { ...restProps, ...gestureHandlers, className: cx2(scopingClassNames, "framer-inbsab", className3, classNames), "data-framer-name": "Desktop", layoutDependency, layoutId: "Umqxf9j2X", ref: refBinding, style: { backgroundColor: "var(--token-0fafc4a9-8d39-41c6-89b7-3b051fb1a0fa, rgb(242, 241, 231))", ...style }, ...addPropertyOverrides2({ N4kEcO0q5: { "data-framer-name": "Phone" }, xKyuEZda1: { "data-framer-name": "Tablet" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-32silq", "data-framer-name": "Container", layoutDependency, layoutId: "W6d1z2BRr", children: [/* @__PURE__ */ _jsx2(RichTextWithFX, { __framer__animate: { transition: transition2 }, __framer__animateOnce: true, __framer__enter: animation, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0.5, __fromCanvasComponent: true, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsxs2(motion2.h2, { dir: "auto", style: { "--font-selector": "RlI7SW50ZXJEaXNwbGF5LU1lZGl1bQ==", "--framer-font-family": '"Inter Display", "Inter Display Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on", "--framer-font-size": "48px", "--framer-font-weight": "500", "--framer-letter-spacing": "-2px", "--framer-line-height": "125%", "--framer-text-alignment": "center", "--framer-text-color": "var(--extracted-1of0zx5, var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31)))" }, children: ["Groen leven ", /* @__PURE__ */ _jsx2(motion2.span, { style: { "--font-selector": "R0Y7UGxheWZhaXIgRGlzcGxheS01MDBpdGFsaWM=", "--framer-font-family": '"Playfair Display", "Playfair Display Placeholder", serif', "--framer-font-style": "italic" }, children: /* @__PURE__ */ _jsx2(motion2.em, { children: "Våre Blog" }) })] }) }), className: "framer-5alcb5", fonts: ["FR;InterDisplay-Medium", "FR;InterDisplay-MediumItalic", "GF;Playfair Display-500italic"], layoutDependency, layoutId: "kveFCGsTD", style: { "--extracted-1of0zx5": "var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides2({ N4kEcO0q5: { children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsxs2(motion2.h2, { dir: "auto", style: { "--font-selector": "RlI7SW50ZXJEaXNwbGF5LU1lZGl1bQ==", "--framer-font-family": '"Inter Display", "Inter Display Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on", "--framer-font-size": "34px", "--framer-font-weight": "500", "--framer-letter-spacing": "-1px", "--framer-line-height": "125%", "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-1of0zx5, var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31)))" }, children: ["Groen leven ", /* @__PURE__ */ _jsx2(motion2.span, { style: { "--font-selector": "R0Y7UGxheWZhaXIgRGlzcGxheS01MDBpdGFsaWM=", "--framer-font-family": '"Playfair Display", "Playfair Display Placeholder", serif', "--framer-font-size": "48px", "--framer-font-style": "italic", "--framer-letter-spacing": "-2px" }, children: /* @__PURE__ */ _jsx2(motion2.em, { children: "Våre Blog" }) })] }) }) }, xKyuEZda1: { children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsxs2(motion2.h2, { dir: "auto", style: { "--font-selector": "RlI7SW50ZXJEaXNwbGF5LU1lZGl1bQ==", "--framer-font-family": '"Inter Display", "Inter Display Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on", "--framer-font-size": "40px", "--framer-font-weight": "500", "--framer-letter-spacing": "-1.5px", "--framer-line-height": "125%", "--framer-text-alignment": "center", "--framer-text-color": "var(--extracted-1of0zx5, var(--token-7c1746b7-c57b-4b3e-8391-742de5bfab8e, rgb(31, 31, 31)))" }, children: ["Groen leven ", /* @__PURE__ */ _jsx2(motion2.span, { style: { "--font-selector": "R0Y7UGxheWZhaXIgRGlzcGxheS01MDBpdGFsaWM=", "--framer-font-family": '"Playfair Display", "Playfair Display Placeholder", serif', "--framer-font-size": "48px", "--framer-font-style": "italic", "--framer-letter-spacing": "-2px" }, children: /* @__PURE__ */ _jsx2(motion2.em, { children: "Våre Blog" }) })] }) }) } }, baseVariant, gestureVariant) }), /* @__PURE__ */ _jsx2(MotionDivWithFX, { __framer__animate: { transition: transition3 }, __framer__animateOnce: true, __framer__enter: animation1, __framer__styleAppearEffectEnabled: true, __framer__threshold: 0, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-1pjmp40", layoutDependency, layoutId: "RU8LzqfwT", children: /* @__PURE__ */ _jsx2(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx2(QueryData, { pageSize: 6, query: query1(), children: (collection, paginationInfo, loadMore) => {
    return /* @__PURE__ */ _jsx2(_Fragment, { children: collection?.map(({ c6QCl_qjd: c6QCl_qjdRU8LzqfwT, gFkK1pVLq: gFkK1pVLqRU8LzqfwT, id: idRU8LzqfwT, mYaRK7HjE: mYaRK7HjERU8LzqfwT, pWU4_Pal3: pWU4_Pal3RU8LzqfwT }, index) => {
      pWU4_Pal3RU8LzqfwT ?? (pWU4_Pal3RU8LzqfwT = "");
      gFkK1pVLqRU8LzqfwT ?? (gFkK1pVLqRU8LzqfwT = "");
      c6QCl_qjdRU8LzqfwT ?? (c6QCl_qjdRU8LzqfwT = "");
      return /* @__PURE__ */ _jsx2(LayoutGroup2, { id: `RU8LzqfwT-${idRU8LzqfwT}`, children: /* @__PURE__ */ _jsx2(PathVariablesContext.Provider, { value: { pWU4_Pal3: pWU4_Pal3RU8LzqfwT }, children: /* @__PURE__ */ _jsx2(Link, { href: { pathVariables: { pWU4_Pal3: pWU4_Pal3RU8LzqfwT }, webPageId: "vnm5eGwn2" }, motionChild: true, nodeId: "WEf4N4H7n", scopeId: "T79x6ameU", children: /* @__PURE__ */ _jsx2(motion2.a, { className: "framer-1d7826r framer-1i0ijkd", layoutDependency, layoutId: "WEf4N4H7n", children: /* @__PURE__ */ _jsx2(ComponentViewportProvider, { height: 421, width: "360px", y: (componentViewport?.y || 0) + 50 + (((componentViewport?.height || 672) - 150 - 535) / 2 + 0 + 0) + 0 + 114 + 0 + 0, ...addPropertyOverrides2({ N4kEcO0q5: { width: `max(${componentViewport?.width || "100vw"} - 40px, 1px)`, y: (componentViewport?.y || 0) + 30 + (((componentViewport?.height || 1339) - 90 - 1395) / 2 + 0 + 0) + 0 + 92 + 0 + 882 + 0 }, xKyuEZda1: { width: `max(max((${componentViewport?.width || "100vw"} - 84px) / 2, 50px), 1px)`, y: (componentViewport?.y || 0) + 40 + (((componentViewport?.height || 1022) - 120 - 966) / 2 + 0 + 0) + 0 + 100 + 0 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx2(SmartComponentScopedContainer, { className: "framer-bgbeir-container", layoutDependency, layoutId: "xpXZv44kh-container", nodeId: "xpXZv44kh", rendersWithMotion: true, scopeId: "T79x6ameU", children: /* @__PURE__ */ _jsx2(y2BzdVdPx_default, { BZ02a0WAQ: c6QCl_qjdRU8LzqfwT, height: "100%", id: "xpXZv44kh", Ig_aHHTzc: gFkK1pVLqRU8LzqfwT, layoutId: "xpXZv44kh", mx8L3SAx1: toResponsiveImage2(mYaRK7HjERU8LzqfwT), style: { width: "100%" }, variant: matchVariant("omP1ArXQ8"), width: "100%", ...addPropertyOverrides2({ N4kEcO0q5: { variant: matchVariant("yH_WEwULe") }, xKyuEZda1: { variant: matchVariant("yH_WEwULe") } }, baseVariant, gestureVariant) }) }) }) }) }) }) }, idRU8LzqfwT);
    }) });
  } }) }) })] }) }) }) }) });
});
var css4 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-aoPQB.framer-1i0ijkd, .framer-aoPQB .framer-1i0ijkd { display: block; }", ".framer-aoPQB.framer-inbsab { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; overflow: hidden; padding: 50px 30px 100px 30px; position: relative; width: 1400px; }", ".framer-aoPQB .framer-32silq { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 54px; height: min-content; justify-content: center; max-width: 1204px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-aoPQB .framer-5alcb5 { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-aoPQB .framer-1pjmp40 { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 30px 30px; height: min-content; justify-content: center; padding: 0px; position: relative; width: 100%; }", ".framer-aoPQB .framer-1d7826r { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; padding: 0px; position: relative; text-decoration: none; width: 360px; }", ".framer-aoPQB .framer-bgbeir-container { flex: 1 0 0px; height: auto; position: relative; width: 1px; }", ".framer-aoPQB.framer-v-1qsj48k.framer-inbsab { padding: 40px 30px 80px 30px; width: 768px; }", ".framer-aoPQB.framer-v-1qsj48k .framer-32silq { gap: 40px; max-width: 100%; }", ".framer-aoPQB.framer-v-1qsj48k .framer-1pjmp40 { align-content: unset; align-items: unset; display: grid; gap: 24px 24px; grid-auto-rows: min-content; grid-template-columns: repeat(2, minmax(50px, 1fr)); }", ".framer-aoPQB.framer-v-1qsj48k .framer-1d7826r { align-self: start; justify-self: center; width: 100%; }", ".framer-aoPQB.framer-v-1407t4d.framer-inbsab { padding: 30px 20px 60px 20px; width: 200px; }", ".framer-aoPQB.framer-v-1407t4d .framer-32silq { gap: 32px; max-width: 100%; }", ".framer-aoPQB.framer-v-1407t4d .framer-1pjmp40 { align-content: center; align-items: center; flex-direction: column; gap: 20px; }", ".framer-aoPQB.framer-v-1407t4d .framer-1d7826r { width: 100%; }"];
var FramerT79x6ameU = withCSS2(Component2, css4, "framer-aoPQB");
var T79x6ameU_default = FramerT79x6ameU;
FramerT79x6ameU.displayName = "Blog Section";
FramerT79x6ameU.defaultProps = { height: 672, width: 1400 };
addPropertyControls2(FramerT79x6ameU, { variant: { options: ["Umqxf9j2X", "xKyuEZda1", "N4kEcO0q5"], optionTitles: ["Desktop", "Tablet", "Phone"], title: "Variant", type: ControlType2.Enum } });
addFonts2(FramerT79x6ameU, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/ePuN3mCjzajIHnyCdvKBFiZkyY0.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/V3j1L0o5vPFKe26Sw4HcpXCfHo.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/F3kdpd2N0cToWV5huaZjjgM.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/0iDmxkizU9goZoclqIqsV5rvETU.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/r0mv3NegmA0akcQsNFotG32Las.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/iwWTDc49ENF2tCHbqlNARXw6Ug.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "normal", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/Ii21jnSJkulBKsHHXKlapi7fv9w.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/A5P4nkYCJlLQxGxaS1lzG8PNSc.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/vuPfygr1n1zYxscvWgGI8hRf3LE.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/jplzYzqFHXreyADwk9yrkQlWQ.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/sSIKP2TfVPvfK7YVENPE5H87A.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/gawbeo7iEJSRZ4kcrh6YRrU8o.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/RkMAGv2iAm3rw7tZzs7FaZf0rM.woff2", weight: "500" }, { cssFamilyName: "Inter Display", source: "framer", style: "italic", uiFamilyName: "Inter Display", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/8E92vrr3j1gDqzepmeSbD2u0JxA.woff2", weight: "500" }, { cssFamilyName: "Playfair Display", openType: true, source: "google", style: "italic", uiFamilyName: "Playfair Display", url: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_pqTbtPK-F2rA0s.woff2", weight: "500" }] }, ...BlogCardV1Fonts], { supportsExplicitInterCodegen: true });
FramerT79x6ameU.loader = { load: (props, context) => {
  const locale = context.locale;
  const queryCacheEntry = queryCache.get(query1(), locale);
  return Promise.allSettled([queryCacheEntry.preload(), (async () => {
    const parentData = await queryCacheEntry.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(y2BzdVdPx_default, {}, context)));
  })()]);
} };
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerT79x6ameU", "slots": [], "annotations": { "framerContractVersion": "1", "framerDisplayContentsDiv": "false", "framerComponentViewportWidth": "true", "framerIntrinsicWidth": "1400", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"xKyuEZda1":{"layout":["fixed","auto"]},"N4kEcO0q5":{"layout":["fixed","auto"]}}}', "framerImmutableVariables": "true", "framerIntrinsicHeight": "672", "framerAutoSizeImages": "true", "framerColorSyntax": "true" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  T79x6ameU_default as default
};
