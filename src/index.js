(function() {
    'use strict';
    var fs = require('fs'),
        mkdirp = require('mkdirp'),
        stt = require('swagger-test-templates'),
        path = require('path'),
        deref = require('json-schema-deref-sync'),
        ZSchema = require('z-schema'),
        zSchema = new ZSchema(),
        swaggerSchema = require('swagger-schema-official/schema'),
        outputBase, spec, flatPaths, responseMockGenerator, requestMockGenerator;

    /**
     * @description Generates tests and mocks for the given openApi spec.
     * @param writeMocks {boolean} Whether the module should write the generated requestMocks to file seperatly
     * @param templatesPath {String} Folder with tests-tempates. Needed as long as swagger-test-templates does not support options
     * @todo remove when stt support request options
     */
    function generate(writeMocks, templatesPath) {
        var requestMocks = {},
            basePath = spec.basePath || '';

        flatPaths.forEach(function(apiPath) {
            requestMocks[path.join(basePath, apiPath.path)] = {};
            requestMocks[path.join(basePath, apiPath.path)][apiPath.operation] = requestMockGenerator(apiPath.path, apiPath.operation, 200, 400, writeMocks);
            responseMockGenerator.generateResponseMock(apiPath.path, apiPath.operation, 200);
        });
        generateTests(requestMocks, templatesPath);
    }

    /**
     * @description Generates tests for the given openApi spec.
     * @param mocks {object} Mock data ordered by endpoint / operation / responseCode
     * @param templatesPath {String} Folder with tests-tempates. Needed as long as swagger-test-templates does not support options
     */
    function generateTests(mocks, templatesPath) {
        var testConfig  = {
            assertionFormat: 'should', testModule: 'request', pathName: [], requestData: mocks, maxLen: -1, templatesPath: templatesPath
        };
        stt.testGen(spec, testConfig).forEach(function(file) {
            //we want spec in the name, not test
            fs.writeFileSync(path.join(outputBase, file.name.replace('test', 'spec')), file.test);
        });
    }

    /**
     * @description Smash nested path / operation info from swaggerJson for easier handling
     * @param  apiPaths {object} the endpoint for the api
     * @param base {string} baseDirectory if filled with a path we will create a directory structure to store mockdata
     * @return {array} paths / operations combinations
     */
    function flattenAndCreateDirectories(apiPaths, base) {
        var responsePaths = [];
        for (var localPath in apiPaths) {
            for ( var operation in apiPaths[localPath]) {
                responsePaths.push({ path: localPath, operation: operation });
                if (base) {
                    mkdirp.sync(path.join(process.cwd(), outputBase, operation, localPath));
                }
            }
        }
        return responsePaths;
    }

    /**
     * @constructor
     * @param openApiSpec {object} A valid openApi Specification json describing your api
     * @param outputPath {string} The base where to write the files to
     * @returns {{generate: generate}}
     */
    module.exports = function(openApiSpec, outputPath) {
        if (!openApiSpec) throw new Error('please provide a openAPI json to start');
        if (!zSchema.validate(openApiSpec, swaggerSchema)) {
            var errors = zSchema.getLastErrors();
            throw new Error('openAPI spec not valid\n' + JSON.stringify(errors, null, 2));
        }
        if (!outputPath) { throw new Error('please supply an output path'); }

        outputBase = outputPath;
        spec = deref(openApiSpec);
        flatPaths = flattenAndCreateDirectories(spec.paths, outputBase);

        responseMockGenerator = require('./generateResponseMocks')(spec, flatPaths, outputBase);
        requestMockGenerator = require('./generateRequestMocks')(spec, flatPaths, outputBase).generateRequestMock;

        return {
            generate: generate,
            generateNgApiMockdata: responseMockGenerator.generateNgApiMockData
        }
    };
}());
