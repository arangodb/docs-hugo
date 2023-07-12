

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

    try {
        assert(Array.isArray(rules));
    } catch(err) {
        msg = "Assertion failed: returned rules is not an Array!"
        throw new Error(msg);
    }

    try {
        assert(rules.some(e => e.flags && e.flags.clusterOnly));
    } catch(err) {
        msg = "Assertion failed: no clusterOnly flags!"
        throw new Error(msg);
    }

    print(JSON.stringify(rules,null,2));
}

checkHealth();
generateOptimizerRules();


