var exampleHasErrors = false;
var example = "";

var internal = require('internal');
var print = require('@arangodb').print;
var errors = require("@arangodb").errors;
var time = require("internal").time;
var fs = require('fs');
var output = '';
var testFunc;
var countErrors;
var collectionAlreadyThere = [];
var ignoreCollectionAlreadyThere = [];
var rc;
var j;

var db = require('internal').db;
var examples = require("@arangodb/graph-examples/example-graph.js");
var user_examples = require("@arangodb/examples/example-users.js");


var assert = function(condition, assertion) {
  if (!condition) {
    print('ASSERTD-FAIL ' + assertion);
  }
};



// The page (source file) of the current example, set by arangoproxy before each
// example, so that the exemptions of a page can be removed when it is done
var __docsPage = "";

var addIgnoreCollection = function(collectionName) {
  if (!db.ignore.exists(collectionName)) {
    db.ignore.insert({_key: collectionName, value: 1, page: __docsPage})
    return
  }
};

var addIgnoreView = function(viewName) {
  addIgnoreCollection(viewName);
};

var removeIgnoreCollection = function(collectionName) {
  var collection = db.ignore.exists(collectionName);
  if (collection == false) {
    return
  }

  db.ignore.remove(collection);
};

var removeIgnoreView = function (viewName) {
  removeIgnoreCollection(viewName);
};
// Exempt other kinds of resources, stored as "<kind>:<name>" (collections and
// Views share a namespace, other resources can have the same names)
var addIgnoreGraph = function (name) { addIgnoreCollection("graph:" + name); };
var removeIgnoreGraph = function (name) { removeIgnoreCollection("graph:" + name); };
var addIgnoreAnalyzer = function (name) { addIgnoreCollection("analyzer:" + name); };
var removeIgnoreAnalyzer = function (name) { removeIgnoreCollection("analyzer:" + name); };
var addIgnoreUser = function (name) { addIgnoreCollection("user:" + name); };
var removeIgnoreUser = function (name) { removeIgnoreCollection("user:" + name); };
var addIgnoreDatabase = function (name) { addIgnoreCollection("database:" + name); };
var removeIgnoreDatabase = function (name) { removeIgnoreCollection("database:" + name); };
var addIgnoreTask = function (name) { addIgnoreCollection("task:" + name); };
var removeIgnoreTask = function (name) { removeIgnoreCollection("task:" + name); };

// The resources that examples can create (in the _system database), to detect
// the ones that an example leaves behind (see checkLeftovers in arangosh.go)
function __docsResources() {
  var safe = function (fn) {
    try {
      return fn();
    } catch (e) {
      return [];
    }
  };
  var names = function (list, fn) {
    return list.map(fn);
  };
  return {
    databases: safe(function () { return db._databases(); }),
    collections: safe(function () {
      return names(db._collections(), function (c) { return c.name(); })
        .filter(function (n) { return n.charAt(0) !== "_"; });
    }),
    views: safe(function () { return names(db._views(), function (v) { return v.name(); }); }),
    graphs: safe(function () { return names(db._graphs.toArray(), function (g) { return g._key; }); }),
    analyzers: safe(function () {
      return names(require("@arangodb/analyzers").toArray(), function (a) { return a.name(); });
    }),
    users: safe(function () {
      return names(require("@arangodb/users").all(), function (u) { return u.user; });
    }),
    // Via HTTP, as the client module isn't available in all versions
    tasks: safe(function () {
      var r = internal.arango.GET("/_api/tasks");
      return Array.isArray(r) ? names(r, function (t) { return t.id; }) : [];
    })
  };
}

// Remove resources (see __docsResources() for the kinds)
function __docsRemove(left) {
  var attempt = function (fn) {
    try {
      fn();
    } catch (e) {
    }
  };
  // Graphs first, as their collections can't be dropped otherwise
  (left.graphs || []).forEach(function (n) {
    attempt(function () { require("@arangodb/general-graph")._drop(n, false); });
    attempt(function () { db._graphs.remove(n); });
  });
  (left.views || []).forEach(function (n) { attempt(function () { db._dropView(n); }); });
  (left.collections || []).forEach(function (n) { attempt(function () { db._drop(n); }); });
  (left.analyzers || []).forEach(function (n) {
    attempt(function () { require("@arangodb/analyzers").remove(n, true); });
  });
  (left.users || []).forEach(function (n) { attempt(function () { require("@arangodb/users").remove(n); }); });
  (left.databases || []).forEach(function (n) { attempt(function () { db._dropDatabase(n); }); });
  (left.tasks || []).forEach(function (n) { attempt(function () { internal.arango.DELETE("/_api/tasks/" + n); }); });
}

// After each example (run by arangoproxy): abort Stream Transactions and kill AQL
// queries that are still running, switch back to the _system database, and remove
// the resources that the example created unless they are exempted for subsequent
// examples (addIgnoreCollection() etc.). Prints what was done.
function __docsCleanup() {
  var removed = {};
  if (db._name() !== "_system") {
    removed.currentDatabase = [db._name()];
    db._useDatabase("_system");
  }
  try {
    var trx = internal.arango.GET("/_api/transaction");
    (trx.transactions || []).forEach(function (t) {
      if (t.state === "running") {
        internal.arango.DELETE("/_api/transaction/" + t.id);
        (removed.transactions = removed.transactions || []).push(t.id);
      }
    });
  } catch (e) {
  }
  try {
    var queries = internal.arango.GET("/_api/query/current");
    (Array.isArray(queries) ? queries : []).forEach(function (q) {
      internal.arango.DELETE("/_api/query/" + q.id);
      (removed.queries = removed.queries || []).push(q.query);
    });
  } catch (e) {
  }
  var prefixes = { graphs: "graph:", analyzers: "analyzer:", users: "user:", databases: "database:", tasks: "task:" };
  var ignored = function (name, kind) {
    try {
      var key = (prefixes[kind] || "") + String(name).replace(/^_system::/, "");
      return db.ignore.exists(key) !== false;
    } catch (e) {
      return false;
    }
  };
  // A graph is exempted if its name or all of its collections are
  var graphCollections = function (name) {
    try {
      var g = db._graphs.document(name);
      var cols = (g.orphanCollections || []).slice();
      (g.edgeDefinitions || []).forEach(function (e) {
        cols = cols.concat([e.collection], e.from, e.to);
      });
      return cols;
    } catch (e) {
      return [];
    }
  };
  var left = {};
  var now = __docsResources();
  Object.keys(now).forEach(function (kind) {
    var extra = now[kind].filter(function (n) {
      return (__docsBaseline[kind] || []).indexOf(n) === -1 && !ignored(n, kind);
    });
    if (kind === "graphs") {
      extra = extra.filter(function (g) {
        var cols = graphCollections(g);
        return !(cols.length > 0 && cols.every(function (c) { return ignored(c, "collections"); }));
      });
    }
    if (extra.length > 0) {
      left[kind] = extra;
      removed[kind] = extra;
    }
  });
  __docsRemove(left);
  if (Object.keys(removed).length > 0) {
    print("CLEANED " + JSON.stringify(removed));
  }
}

// When a page is done (requested by the page template via arangoproxy): remove the
// exemptions that its examples added but didn't remove, and the exempted resources
function __docsPageDone(page) {
  var kinds = { graph: "graphs", analyzer: "analyzers", user: "users", database: "databases", task: "tasks" };
  var left = {};
  db.ignore.toArray().forEach(function (d) {
    if (d.page !== page) {
      return;
    }
    var m = /^(graph|analyzer|user|database|task):(.*)$/.exec(d._key);
    // Collections and Views share the namespace
    var targets = m ? [kinds[m[1]]] : ["collections", "views"];
    targets.forEach(function (kind) {
      (left[kind] = left[kind] || []).push(m ? m[2] : d._key);
    });
    db.ignore.remove(d._key);
  });
  // Only report the ones that still exist
  var now = __docsResources();
  Object.keys(left).forEach(function (kind) {
    left[kind] = left[kind].filter(function (n) {
      return (now[kind] || []).indexOf(n) !== -1 || (now[kind] || []).indexOf("_system::" + n) !== -1;
    });
    if (left[kind].length === 0) {
      delete left[kind];
    }
  });
  __docsRemove(left);
  if (Object.keys(left).length > 0) {
    print("PAGEDONE " + JSON.stringify(left));
  }
}

var formatPlan = function (plan) {
  return { 
    estimatedCost: plan.estimatedCost,
    nodes: plan.nodes.map(function(node) {
      return node.type; 
    }) 
  }; 
};

// HTTP EXAMPLES HEADER

internal.startPrettyPrint(true);
internal.stopColorPrint(true);
var appender = function(text) {
  output += text;
};
const rawAppender = appender;
const htmlAppender = appender;
const jsonAppender = appender;
const shellAppender = appender;
const jsonLAppender = function(text) {
  output += text + "↩\n" ;
};

const plainAppender = function(text) {
  // do we have a line that could be json? try to parse & format it.
  if (text.match(/^\{.*\}$/) || text.match(/^\[.*\]$/)) {
    try {
      let parsed = JSON.parse(text);
      output += internal.inspect(parsed) + "↩\n" ;
    } catch (x) {
      // fallback to plain text.
      output += text;
    }
  } else {
    output += text;
  }
};


const log = function (a) {
  internal.startCaptureMode();
  print(a);
  appender(internal.stopCaptureMode());
};

var appendCurlRequest = function (shellAppender, jsonAppender, rawAppender) {
  return function (method, url, body, headers) {
    var response;
    var curl;
    var jsonBody = false;

    if ((typeof body !== 'string') && (body !== undefined)) {
      jsonBody = true;
    }
    if (headers === undefined || headers === null || headers === '') {
      headers = {};
    }
    if (!headers.hasOwnProperty('Accept') && !headers.hasOwnProperty('accept')) {
      headers['accept'] = 'application/json';
    }

    curl = 'curl ';

    if (method === 'POST') {
      response = internal.arango.POST_RAW(url, body, headers);
      curl += '-X ' + method + ' ';
    } else if (method === 'PUT') {
      response = internal.arango.PUT_RAW(url, body, headers);
      curl += '-X ' + method + ' ';
    } else if (method === 'GET') {
      response = internal.arango.GET_RAW(url, headers);
    } else if (method === 'DELETE') {
      response = internal.arango.DELETE_RAW(url, body, headers);
      curl += '-X ' + method + ' ';
    } else if (method === 'PATCH') {
      response = internal.arango.PATCH_RAW(url, body, headers);
      curl += '-X ' + method + ' ';
    } else if (method === 'HEAD') {
      response = internal.arango.HEAD_RAW(url, headers);
      curl += '-X ' + method + ' ';
    } else if (method === 'OPTION' || method === 'OPTIONS') {
      response = internal.arango.OPTION_RAW(url, body, headers);
      curl += '-X ' + method + ' ';
    }
    for (let i in headers) {
      if (headers.hasOwnProperty(i)) {
        // TODO: The header could contain ' which would need to be replaced by '"'"'
        // for Bash, but doing so (inline or calling a function) somehow breaks the
        // toolchain (arangoproxy unable to launch the 2nd arangosh to connect to the server)
        curl += "--header '" + i + ": " + headers[i] + "' ";
      }
    }

    if (body !== undefined && body !== '') {
      curl += '--data-binary @- ';
    }

    curl += "--dump - 'http://localhost:8529" + url + "'";

    if (body) {
      curl += " <<'EOF'";
      if (jsonBody) {
        curl += '\n' + JSON.stringify(body, undefined, 2);
      } else {
        curl += '\n' + body;
      }
      curl += "\nEOF";
    }

    print("REQ");
    print(curl);
    print("ENDREQ");
    return response;
  };
};

  

var logCurlRequestRaw = appendCurlRequest(shellAppender, jsonAppender, rawAppender);
// TODO: Is this calling the internal implementation on purpose?
var logCurlRequestPlain = internal.appendCurlRequest(shellAppender, jsonAppender, plainAppender);
var logRawResponse = internal.appendRawResponse(rawAppender, rawAppender);
var logCurlRequest = function () {
  if ((arguments.length > 1) &&
      (arguments[1] !== undefined) &&
      (arguments[1].length > 0) &&
      (arguments[1][0] !== '/')) {
      throw new Error("your URL doesn't start with a /! the example will be broken. [" + arguments[1] + "]");
  }
  var r = logCurlRequestRaw.apply(logCurlRequestRaw, arguments);
  return r;
};


var swallowText = function () {};
var curlRequestRaw = internal.appendCurlRequest(swallowText, swallowText, swallowText);
var curlRequest = function () {
  rc = curlRequestRaw.apply(curlRequestRaw, arguments);
  if (rc.code != 200) {
    expectRC = arguments["4"];
    if (typeof expectRC !== undefined) {
      if (expectRC.indexOf(rc.code) >=0) {
        return rc;
      }
    }
    throw rc.code + " " + rc.errorMessage
  }
  return rc
};

var logJsonResponseRaw = internal.appendJsonResponse(rawAppender, rawAppender);
var logJsonResponse = internal.appendJsonResponse(rawAppender, jsonAppender);

var logJsonLResponseRaw = internal.appendJsonLResponse(rawAppender, rawAppender);
var logJsonLResponse = function (response) {
  var r = logJsonLResponseRaw.apply(logJsonLResponseRaw, [response]);
  print("RESP");
  print(output);
  print("ENDRESP");
  output = "";
}

var logHtmlResponse = internal.appendRawResponse(rawAppender, htmlAppender);
var logRawResponseRaw = internal.appendRawResponse(rawAppender, rawAppender);
var logRawResponse = function (response) {
  var r = logRawResponseRaw.apply(logRawResponseRaw, [response]);
  print("RESP");
  print(output);
  print("ENDRESP");
  output = "";
};

var logPlainResponseRaw = internal.appendPlainResponse(plainAppender, plainAppender);
var logPlainResponse = function (response) {
  var r = logPlainResponseRaw.apply(logPlainResponseRaw, [response]);
  print("RESP");
  print(output);
  print("ENDRESP");
  output = "";
}

var logJsonResponse = function (response) {
  var r = logJsonResponseRaw.apply(logJsonResponseRaw, [response]);
  print("RESP");
  print(output);
  print("ENDRESP");
  output = "";
};


print("EOFD");





