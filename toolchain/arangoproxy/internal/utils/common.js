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


function cleanupAfterExample() {
  for (let col of db._collections()) {
    if (db.ignore.exists(col) != false || col._name == "ignore"){
      continue
    }

    if (!col.properties().isSystem) {
      db._drop(col._name);
    }
  }
}

var addIgnoreCollection = function(collectionName) {
  if (!db.ignore.exists(collectionName)) {
    db.ignore.insert({_key: collectionName, value: 1})
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
  output += text + "&#x21A9;\n" ;
};

const plainAppender = function(text) {
  // do we have a line that could be json? try to parse & format it.
  if (text.match(/^{.*}$/) || text.match(/^[.*]$/)) {
    try {
      let parsed = JSON.parse(text);
      output += internal.inspect(parsed) + "&#x21A9;\n" ;
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

const escapeSingleQuotes = function(str) {
  let regex = /'/g;
  return str.replace(regex, `'"'"'`);
}

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
        curl += "--header '" + i + ': ' + escapeSingleQuotes(headers[i]) + "' ";
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





