# OpenAPI test and mock data generator
This small module makes it easy to generate tests and request and response data for you openAPI spec (f.k.a. Swagger-spec).
It makes use of some great modules out there to generate request mocks, response mocks, and then ties 'em together.

If you would like to use the seperate functionality, (ie just generate mocks, or only the test templates) check these dependencies in the package.json

- swagger-test-templates
- swagmock
- json-schema-test-data-generator



## Installing
`npm install open-api-test-generator`

## Usage
Simply import the module with
`var OpenApiGenerator = require('open-api-test-generator');`

Import your openAPI spec:
` var spec = require('path/to/swagger.json');`

Construct the generator object:
` var generator = OpenApiGenerator(spec)`;

Then use it:
`generator.generate('path/to/write/tests/and/mocks');`

