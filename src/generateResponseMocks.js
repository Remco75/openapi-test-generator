(function(){
    'use strict';
    var fs = require('fs'),
        path = require('path'),
        Swagmock = require('swagmock'),
        async = require('asyncawait/async'),
        await = require('asyncawait/await');

    /**
     * init the module with a swagger spec, flattened paths and outputFolder
     * @param spec {Object} The swagger spec
     * @param flatPaths {Array} Array with path / operation objects
     * @param outputBase {String} Where to write
     * @returns {*}
     */
    module.exports = function(spec, flatPaths, outputBase) {
        /**
         * Generate mock for the given swagger specn in ngApiMock style and write to outputDir
         * @return {Promise} resolves with Array all the mock objects
         */
        var collectNgApiMockData = async (function () {
            var ngApiMocks = [];

            var basePath = spec.basePath || '';
            await (flatPaths.forEach(function(apiPathOp) {
                Swagmock(spec).responses({path: apiPathOp.path, operation: apiPathOp.operation, useExamples: true}, function(err, mock) {
                    var responses = {},
                        expessionPath = path.join(basePath, apiPathOp.path.replace(/\{(.*)\}/, '*'));

                    for (var statusCode in mock.responses) {
                        responses['generated_'+statusCode] = {
                            default: false,
                            status: statusCode,
                            data: mock.responses[statusCode]
                        };
                    }

                    var thisMock = {
                        expression: expessionPath,
                        method: apiPathOp.operation,
                        name: apiPathOp.path.replace(/\//g , '_').replace(/_/, '') + '_' + apiPathOp.operation,
                        isArray: Array.isArray(mock.responses[statusCode]),
                        responses: responses
                    };

                    ngApiMocks.push(thisMock);
                });
            }));
            // due to the async nature of the mock generation we can only do this in a new loop
            ngApiMocks.forEach(function(ngApiMock) {
                fs.writeFileSync(path.join(outputBase, ngApiMock.name + '.json' ), JSON.stringify(ngApiMock));
            });
            return ngApiMocks;
        });

        /**
         * @description  generate responseMocks based on the schemes, where possible we will use the `example` properties to fill the data
         * @param apiPath {string} path to generate for
         * @param operation {string} operation to generate for
         * @param statusCode {number} http statusCode to generate the response for
         * @return {promise} the responseMock. Also written to file
         */
        function generateResponseMock(apiPath, operation, statusCode) {
            return Swagmock(spec).responses({path: apiPath, operation: operation, response: statusCode}, function(error, mock) {
                if (error) { return console.log(error); }
                fs.writeFileSync(path.join(process.cwd(), outputBase, operation, apiPath)+'/response.json', JSON.stringify(mock));
                return 'mock written';
            });
        }

        return {
            generateNgApiMockData: collectNgApiMockData,
            generateResponseMock: generateResponseMock
        };
    } ;
}());
