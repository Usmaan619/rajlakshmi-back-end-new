const { calculateTotalWeight } = require('./utils/helper');
console.log(calculateTotalWeight([ { weight: "500", quantity: 1 } ]));
console.log(calculateTotalWeight([ { weight: "1kg", quantity: 1 } ]));
console.log(calculateTotalWeight([ { weight: "500gm", quantity: 2 } ]));
console.log(calculateTotalWeight([ { weight: 1.5, quantity: 1 } ]));
