(function() {
    'use strict';
    var fs = require('fs'),
        mkdirp = require('mkdirp'),
        rimraf = require('rimraf'),
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
     */
    function generate(spec, outputPath) {
        // @todo validate the spec
        spec = deref(spec);
        if (!outputPath) {
            console.log('please supply an output path');
            return false;
        }
        rimraf.sync(outputPath +'/*');
        outputBase = outputPath;

        var allPaths = extractPaths(spec.paths, outputBase),
            requestMocks = {};

        allPaths.forEach(function(apiPath) {
            requestMocks[path.join(spec.basePath, apiPath.path)] = {};
            requestMocks[path.join(spec.basePath, apiPath.path)][apiPath.operation] = generateRequestMock(apiPath, spec, false);
            apiPath.response = 200;
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
                console.log("The file "+ file.name +" was saved");
            });
        });
    }

    /**
     * @description generate a mock-object for a given path / operation combination based on it's parameter schema
     * @param apiPath {object} object with path and operation to generate for
     * @param spec {object} the swagger spec
     * @param writeMockToFile {boolean} Should we write the mockfile to the output path
     * @returns {object} the mock for the path / operation combi
     */
    function generateRequestMock(apiPath, spec, writeMockToFile) {
        var pathMock =  {
            200: [], 400: []
        };
        for (var i = 0; i < spec['paths'][apiPath.path][apiPath.operation].parameters.length; i++) {
            var jsonData = mockRequestGenerator(spec['paths'][apiPath.path][apiPath.operation].parameters[i].schema);

            // fill happy mocks
            jsonData.filter(function(mock) { return mock.valid; }).forEach(function(mock) {
                pathMock[200].push({ body: mock.data, description: mock.message});
            });

            // fill validation errors mocks
            jsonData.filter(function(mock) { return !mock.valid; }).forEach(function(mock) {
                pathMock[400].push({ body: mock.data, description: mock.message});
            });

            if (writeMockToFile) {
                fs.writeFile(process.cwd(). path.join(outputBase, apiPath.operation, apiPath.path) + '/request-array.json', JSON.stringify(jsonData), {}, function (err) {
                    if (err) { return console.log(err); }
                    console.log("The request mock for " + apiPath.path + " was saved");
                });
            }
        }
        return pathMock;
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
                    console.log("The response mock for "+ apiPath.path +" was saved");
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