describe('OpenApiTestGenerator', function() {
    var OpenApiGenerator = require('../src/index'),
       // responseMockgenerator = require('../src/generateResponseMocks'),
        fs = require('fs'),
        fileExists = require('file-exists'),
        path = require('path'),
        rimraf = require('rimraf'),
        outputTestPath = path.join('.tmp/generated'),
        spec = require('../spec/mocks/bareSwagger.json');

    describe('when the building the generator object though the constructor', function() {
        beforeEach(function() {
            rimraf.sync(path.join(outputTestPath,'/**'));
        });

        it('should return an object with a generator property', function() {
            var myGenerator = OpenApiGenerator(spec, outputTestPath);
            expect(myGenerator.generate).toBeTruthy();
            expect(myGenerator.generateNgApiMockdata).toBeTruthy();
        });

        it('should fail when we do not supply a open-api json', function() {
            expect(OpenApiGenerator).toThrow(new Error('please provide a openAPI json to start'));
        });

        it('should fail when we supply INVALID a open-api json', function() {
            expect(function() { OpenApiGenerator(require('../spec/mocks/invalidSwagger.json'))}).toThrow();
        });

        it('should build an valid directory structure', function() {
            var myGenerator = OpenApiGenerator(spec, outputTestPath);
            expect(fs.statSync(path.join(outputTestPath, 'get/path1/{orderId}')).isDirectory()).toBe(true);
            expect(fs.statSync(path.join(outputTestPath, 'post/path2')).isDirectory()).toBe(true);
        });
    });

    describe('when calling "generate"', function() {
        var myGenerator;

        beforeEach(function() {
            rimraf.sync(path.join(outputTestPath,'/**'));
            myGenerator = OpenApiGenerator(spec, outputTestPath);
        });

        it('should create testfiles for each path, in the output dir', function() {
            myGenerator.generate();
            expect(fileExists(path.join(outputTestPath, 'path1-{orderId}-spec.js'))).toBe(true);
            expect(fileExists(path.join(outputTestPath, 'path2-spec.js'))).toBe(true);
        });

        it('should NOT create testfiles for each path, in the output dir', function() {
            myGenerator.generate();
            expect(fileExists(path.join(outputTestPath, 'get/path1/{orderId}/request-array.json'))).toBe(false);
            expect(fileExists(path.join(outputTestPath, 'post/path2/request-array.json'))).toBe(false);
        });

        it('should create requestMocks for each path / operation', function() {
            myGenerator.generate(true);
            expect(fileExists(path.join(outputTestPath, 'get/path1/{orderId}/request-array.json'))).toBe(true);
            expect(fileExists(path.join(outputTestPath, 'post/path2/request-array.json'))).toBe(true);
        });
    });
});
