(function() {
    'use strict';
    var fs = require('fs'),
        mkdirp = require('mkdirp'),
        stt = require('swagger-test-templates'),
        path = require('path'),
        deref = require('json-schema-deref-sync'),
        Swagmock = require('swagmock'),
        mockRequestGenerator = require('json-schema-test-data-generator'),
        outputBase;

    /**
     * @description Generates tests and mocks for the given openApi spec.
     * @param spec {object} The swagger specification JSON
     * @param outputPath {string} The base where to write the files to
     * @param writeMocks {boolean} Whether the module should write the generated requestMocks to file
     */
    function generate(spec, outputPath, writeMocks) {
        // @todo validate the spec
        spec = deref(spec);
        if (!outputPath) {
            throw new Error('please supply an output path');
        }
        outputBase = outputPath;

        var allPaths = extractPaths(spec.paths, outputBase),
            requestMocks = {};

        allPaths.forEach(function(apiPath) {
            requestMocks[path.join(spec.basePath, apiPath.path)] = {};
            requestMocks[path.join(spec.basePath, apiPath.path)][apiPath.operation] = generateRequestMock(apiPath, spec, 200, 400, writeMocks);
            generateResponseMock(apiPath, spec)
        });

        generateTests(spec, requestMocks);
    }

    /**
     * @description Generates tests for the given openApi spec.
     * @param spec {object} The swagger specification JSON
     * @param mocks {object} Mock data ordered by endpoint / operation / response
     */
    function generateTests(spec, mocks) {
        var testConfig  = {
            assertionFormat: 'should',
            testModule: 'request',
            pathName: [],
            requestData: mocks,
            maxLen: -1
        };

        stt.testGen(spec, testConfig).forEach(function(file) {
            fs.writeFile(path.join(outputBase, file.name), file.test, function(err) {
                if(err) { return console.log(err); }
                //console.log("The file "+ file.name +" was saved");
            });
        });
    }

    /**
     * @description generate a mock-object for a given path / operation combination based on it's parameter schema
     * we assume statuscode 400 is a validation error for now
     * @param apiPath {object} object with path and operation to generate for
     * @param spec {object} the swagger spec
     * @param succesStatusCode {integer} The http status-code which is returned for succes
     * @param validationErrorStatusCode {integer} The http status-code which is returned for request validation errors
     * @param writeMockToFile {boolean} Should we write the mockfile to the output path
     * @returns {object} the mock for the path / operation combi.
     *      Contains 2 properties:
     *      - 200: contains the mocks that should lead to a succesful result
     *      - 400: contains the mocks that should lead to a unsuccesful result, with validation errors
     */
    function generateRequestMock(apiPath, spec, succesStatusCode, validationErrorStatusCode, writeMockToFile) {
        var pathMock =  { },
            getMocks = {};

        pathMock[succesStatusCode] = [];
        pathMock[validationErrorStatusCode] = [];

        spec['paths'][apiPath.path][apiPath.operation].parameters.forEach(function(param) {
            getMocks[param.name] = (param.schema) ? mockRequestGenerator(param.schema) : mockRequestGenerator(param);
        });

        if(Object.keys(getMocks).length > 0) {
            var validMocks = {},
                inValidMocks = {};

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

            pathMock[succesStatusCode].push(validMocks);
            pathMock[validationErrorStatusCode].push(inValidMocks);
            if (writeMockToFile) {
                fs.writeFile(path.join(process.cwd(), outputBase, apiPath.operation, apiPath.path) + '/request-array.json', JSON.stringify(getMocks), {}, function (err) {
                    if (err) { return console.log(err); }
                    console.log("The request mock for " + apiPath.path + apiPath.operation +" was saved");
                });
            }
            return pathMock;
        }
    }

    /**
     * @description  generate responseMocks based on the schemes, where possible we will use the `example` properties to fill the data
     * @param apiPath {object} object with path and operation to generate for
     * @param spec the swagger spec
     */
    function generateResponseMock(apiPath, spec) {
        Swagmock(spec, {validated: true}).responses(apiPath, function(error, mock) {
            if (error) {
                console.log(error, path.path);
            } else {
                fs.writeFile(path.join(process.cwd(), outputBase, apiPath.operation, apiPath.path)+'/response.json', JSON.stringify(mock), {}, function(err) {
                    if(err) { return console.log(err); }
                    //console.log("The response mock for "+ apiPath.path +" was saved");
                });
            }
        });
    }

    /**
     * @description extract path / operation info from swaggerJson for easier handling
     * @param  apiPaths {object} the endpoint for the api
     * @param base {string} baseDirectory if filled with a path we will create a directory structure to store mockdata
     * @return {array} paths
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

    module.exports = {
        generate: generate
    };
}());