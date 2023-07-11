

var internal = require('internal');
var fs = require('fs');


var assert = function(condition) {
    if (!condition) {
      throw new Error('assertion failed');
    }
};

function checkHealth() {
    var retries = 0;
    var isConnected = false;
    while (!isConnected) {
        if (retries == 2000000) throw new Error("Cannot connect to server");
        try {
            var url = "/_api/version";
            var isActive = internal.arango.GET(url);
            isConnected = true;
        } catch(err) {
            retries = retries + 1;
        }
    }
}

function generateOptimizerRules() {
    var url = "/_api/query/rules";
    var rules = internal.arango.GET(url);
    assert(Array.isArray(rules));
    assert(rules.some(e => e.flags && e.flags.clusterOnly));
    print(rules);
}

checkHealth();
generateOptimizerRules();


