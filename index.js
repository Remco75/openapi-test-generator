(function() {
    'use strict';
    var fs = require('fs'),
        mkdirp = require('mkdirp'),
        stt = require('swagger-test-templates'),
        path = require('path'),
        deref = require('json-schema-deref-sync'),
        Swagmock = require('swagmock'),
        mockRequestGenerator = require('json-schema-test-data-generator'),
        outputBase, spec,
        ZSchema = require('z-schema'),
        zSchema = new ZSchema(),
        swaggerSchema = require('swagger-schema-official/schema');


    /**
     * @description Generates tests and mocks for the given openApi spec.
     * @param outputPath {string} The base where to write the files to
     * @param writeMocks {boolean} Whether the module should write the generated requestMocks to file
     */
    function generate(outputPath, writeMocks) {
        if (!outputPath) { throw new Error('please supply an output path'); }

        outputBase = outputPath;

        var allPaths = extractPaths(spec.paths, outputBase), requestMocks = {};

        allPaths.forEach(function(apiPath) {
            requestMocks[path.join(spec.basePath, apiPath.path)] = {};
            requestMocks[path.join(spec.basePath, apiPath.path)][apiPath.operation] = generateRequestMock(apiPath.path, apiPath.operation, 200, 400, writeMocks);
            generateResponseMock(apiPath.path, apiPath.operation, 200)
        });
        generateTests(requestMocks);
    }

    /**
     * @description Generates tests for the given openApi spec.
     * @param mocks {object} Mock data ordered by endpoint / operation / responseCode
     */
    function generateTests(mocks) {
        var testConfig  = {
            assertionFormat: 'should', testModule: 'request', pathName: [], requestData: mocks, maxLen: -1
        };

        stt.testGen(spec, testConfig).forEach(function(file) {
            fs.writeFileSync(path.join(outputBase, file.name), file.test);
        });
    }

    /**
     * @description generate a mock-object for a given path / operation combination based on it's parameter schema
     * @param apiPath {string} path to generate for
     * @param operation {string} operation to generate for
     * @param successStatusCode {number} The http status-code which is returned for succes
     * @param validationErrorStatusCode {number} The http status-code which is returned for request validation errors
     * @param writeMockToFile {boolean} Should we write the mockfile to the output path
     * @returns {object} the mock for the path / operation combi.
     *      Contains 2 properties:
     *      - [successStatusCode]: contains the mocks that should lead to a succesful result
     *      - [validationErrorStatusCode]: contains the mocks that should lead to a unsuccesful result, with validation errors
     */
    function generateRequestMock(apiPath, operation, successStatusCode, validationErrorStatusCode, writeMockToFile) {
        var pathMock =  {}, getMocks = {};

        pathMock[successStatusCode] = [];
        pathMock[validationErrorStatusCode] = [];

        spec['paths'][apiPath][operation].parameters.forEach(function(param) {
            getMocks[param.name] = (param.schema) ? mockRequestGenerator(param.schema) : mockRequestGenerator(param);
        });

        if(Object.keys(getMocks).length > 0) {
            var validMocks = {}, inValidMocks = {};

            for (var paramName in getMocks) {
                getMocks[paramName].filter(function (fullMock) { return fullMock.valid; }).forEach(function (mock) {
                    validMocks[paramName] = mock.data;
                    validMocks.description = mock.message;
                });

                getMocks[paramName].filter(function (fullMock) { return !fullMock.valid; }).forEach(function (mock) {
                    inValidMocks[paramName] = mock.data;
                    inValidMocks.description = mock.message;
                });
            }

            pathMock[successStatusCode].push(validMocks);
            pathMock[validationErrorStatusCode].push(inValidMocks);

            if (writeMockToFile) {
                fs.writeFile(path.join(process.cwd(), outputBase, operation, apiPath) + '/request-array.json', JSON.stringify(getMocks), {}, function (err) {
                    if (err) { return console.log(err); }
                    console.log("The request mock for " + apiPath + operation +" was saved");
                });
            }
            return pathMock;
        }
    }

    /**
     * @description  generate responseMocks based on the schemes, where possible we will use the `example` properties to fill the data
     * @param apiPath {string} path to generate for
     * @param operation {string} operation to generate for
     * @param statusCode {number} http statusCode to generate the response for
     */
    function generateResponseMock(apiPath, operation, statusCode) {
        Swagmock(spec, {validated: true}).responses({path: apiPath, operation: operation, response: statusCode}, function(error, mock) {
            if (error) {
                console.log(error, path.path);
            } else {
                fs.writeFile(path.join(process.cwd(), outputBase, operation, apiPath)+'/response.json', JSON.stringify(mock), {}, function(err) {
                    if(err) { return console.log(err); }
                    console.log("The response mock for "+ apiPath +" was saved");
                });
            }
        });
    }

    /**
     * @description Smash nested path / operation info from swaggerJson for easier handling
     * @param  apiPaths {object} the endpoint for the api
     * @param base {string} baseDirectory if filled with a path we will create a directory structure to store mockdata
     * @return {array} paths / operations combinations
     */
    function extractPaths(apiPaths, base) {
        var responsePaths = [];
        for (var localPath in apiPaths) {
            for ( var operation in apiPaths[localPath]) {
                responsePaths.push({ path: localPath, operation: operation });
                if (base) {
                    mkdirp.sync(path.join(outputBase, operation, localPath));
                }
            }
        }
        return responsePaths;
    }

    /**
     * @constructor
     * @param openApiSpec {object} A valid openApi Specification json describing your api
     * @returns {{generate: generate}}
     */
    module.exports = function(openApiSpec) {
        if (!openApiSpec) throw new Error('please provide a openAPI json to start');
        if (!zSchema.validate(openApiSpec, swaggerSchema)) throw new Error('openAPI spec not valid');

        spec = deref(openApiSpec);
        return {
            generate: generate
        }
    };
}());