(function(){
    'use strict';
    var fs = require('fs'),
        path = require('path'),
        mockRequestGenerator = require('json-schema-test-data-generator');

    /**
     * init the module with a swagger spec, flattened paths and outputFolder
     * @param spec
     * @param flatPaths
     * @param outputBase
     * @returns {*}
     */
    module.exports = function(spec, flatPaths, outputBase) {

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
                Object.keys(getMocks).forEach(function(paramName) {

                    getMocks[paramName].filter(function (fullMock) { return fullMock.valid; }).forEach(function (mock) {
                        var validMocks = {};
                        validMocks[paramName] = mock.data;
                        validMocks.description = mock.message;
                        pathMock[successStatusCode].push(validMocks);
                    });

                    getMocks[paramName].filter(function (fullMock) { return !fullMock.valid; }).forEach(function (mock) {
                        var inValidMocks = {};
                        inValidMocks[paramName] = mock.data;
                        inValidMocks.description = mock.message;
                        pathMock[validationErrorStatusCode].push(inValidMocks);
                    });
                });

                if (writeMockToFile) {
                    fs.writeFileSync(path.join(process.cwd(), outputBase, operation, apiPath) + '/request-array.json', JSON.stringify(getMocks), {}, function (err) {
                        if (err) { return console.log(err); }
                        console.log("The request mock for " + apiPath + operation +" was saved");
                    });
                }
                return pathMock;
            }
        }

        return {
            generateRequestMock: generateRequestMock
        };
    } ;
}());
