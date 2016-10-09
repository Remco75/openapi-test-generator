describe("OpenApiTestGenerator", function() {
    var OpenApiGenerator;

    describe('the building the generator object though the constructor', function() {

        it("should return an object with a generator property", function() {
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
});
