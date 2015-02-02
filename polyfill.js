var g =
  typeof global === "object" ? global :
  typeof window === "object" ? window : this;
var Promise = g.Promise || require('promise/lib/es6-extensions');
var Symbol = g.Symbol || require('es6-symbol');
