describe('OpenApiTestGenerator', function() {
    var OpenApiGenerator = require('../index');

    var fileExists = require('file-exists'),
        path = require('path'),
        rimraf = require('rimraf');

    describe('when the building the generator object though the constructor', function() {

        it('should return an object with a generator property', function() {
            var myGenerator = OpenApiGenerator(require('../spec/mocks/bareSwagger.json'));
            expect(myGenerator.generate).toBeTruthy();
        });

        it('should fail when we do not supply a open-api json', function() {
            expect(OpenApiGenerator).toThrow(new Error('please provide a openAPI json to start'));
        });

        it('should fail when we supply INVALID a open-api json', function() {
            expect(function() { OpenApiGenerator(require('../spec/mocks/invalidSwagger.json'))}).toThrow();
        });

    });

    describe('when calling "generate"', function() {
        var myGenerator, outputTestPath = '.tmp/test';

        beforeAll(function() {
            myGenerator = OpenApiGenerator(require('../spec/mocks/bareSwagger.json'));
        });

        beforeEach(function() {
            rimraf.sync(outputTestPath)
        });

        it('should create testfiles for eacht path, in the output dir', function() {
            myGenerator.generate(outputTestPath, true);
            expect(fileExists(path.join(outputTestPath, 'path1-test.js'))).toBe(true);
            expect(fileExists(path.join(outputTestPath, 'path2-test.js'))).toBe(true);
        });

        it('should create requestMocks for eacht path / operation', function() {
            myGenerator.generate(outputTestPath, true);
            expect(fileExists(path.join(outputTestPath, 'get/path1/request-array.json'))).toBe(true);
            expect(fileExists(path.join(outputTestPath, 'post/path2/request-array.json'))).toBe(true);
        });
    });
});
