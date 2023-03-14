### Here are mocked definitions from the various 1_structs.md files which are not processed by the http_docublock migration script

definitions = {
    "ARANGO_ERROR": {
        "description": "An ArangoDB Error code", 
        "type": "integer"
    }, 
    "ArangoError": {
        "description": "the arangodb error type", 
        "properties": {
            "code": {
                "description": "the HTTP Status code", 
                "type": "integer"
            }, 
            "error": {
                "description": "boolean flag to indicate whether an error occurred (*true* in this case)", 
                "type": "boolean"
            }, 
            "errorMessage": {
                "description": "a descriptive error message describing what happened, may contain additional information", 
                "type": "string"
            }, 
            "errorNum": {
                "description": "the ARANGO_ERROR code", 
                "type": "integer"
            }
        }
    }, 
}