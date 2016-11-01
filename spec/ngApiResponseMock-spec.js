describe('The ngApiMock generator', function() {
    var responseMockgenerator = require('../src/generateResponseMocks'),
        fs = require('fs'),
        deref = require('json-schema-deref-sync'),
        path = require('path'),
        mkdirp = require('mkdirp'),
        rimraf = require('rimraf'),
        fileExists = require('file-exists'),
        outputTestPath = './.tmp/generated',
        flatPaths = [
            { path: '/path1/{orderId}', operation: 'get' },
            { path: '/path2', operation: 'post' }
        ],
        spec = require('../spec/mocks/bareSwagger.json');

    describe('when calling ngApiMockgenerator', function() {
        var myGenerator;
        rimraf.sync(path.join(outputTestPath, '/**'));

        beforeEach(function() {
            myGenerator = responseMockgenerator(spec, flatPaths, outputTestPath);
            mkdirp.sync(path.join(process.cwd(), outputTestPath, '/path1/{orderId}', 'get'));
            mkdirp.sync(path.join(process.cwd(), outputTestPath, '/path2', 'post'));
        });

        it('should return an array with 3 mocks', function(done) {
            myGenerator.generateNgApiMockData().then(function(data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBe(2);
                done();
            });
        });

        it('should add the basePath to the ngApiMock expression if present', function() {
            myGenerator.generateNgApiMockData().then(function(data) {
                expect(data[0].expression).toContain('somebase');
                done();
            });
        });

        it('should should write 2 mockfiles', function(done) {
            myGenerator.generateNgApiMockData().then(function(data) {
                expect(fileExists(path.join(outputTestPath,'path2_post.json'))).toBe(true);
                done();
            });
        });
    });

});
