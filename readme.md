# OpenAPI test and mock data generator
This small module makes it easy to generate *tests* and *request* and *response* data for you openAPI spec (f.k.a. Swagger-spec).
It makes use of some great modules out there to generate request mocks, response mocks, and then ties 'em together. 

The generated response data is great for communication with the Frontend devvers in your team: tell 'em to use these files as mocks.
As time and your API progresses they can just generate the most up date mocks.

If you would like to use the seperate functionality, (ie just generate mocks, or only the test templates) check these dependencies we use:

- [swagger-test-templates](https://www.npmjs.com/package/swagger-test-templates)
- [swagmock](https://www.npmjs.com/package/swagmock)
- [json-schema-test-data-generator](https://www.npmjs.com/package/json-schema-test-data-generator)



## Installing
`npm install open-api-test-generator`

## Usage
```javascript
//Simply import the module with
var OpenApiGenerator = require('open-api-test-generator');
//Import your openAPI spec:
 var spec = require('path/to/swagger.json');

//Construct the generator object:
 var generator = OpenApiGenerator(spec, 'path/to/write/tests/and/mocks');

//Then use it:
generator.generate();
```

### options
The generate function can also be called with 2 optional parameters 
- writeRequestMocks: should we write request mocks to file? default false
- templatesPath: path to overwrite the templates used to generate tests 

## ng-apimock
To generate mocks for the [ng-api-mock](https://www.npmjs.com/package/ng-apimock) module:

```javascript
generator.generateNgApiMockData().then(function(mockData) {
    // do something with mocks
});
```
