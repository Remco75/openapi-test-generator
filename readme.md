# OpenAPI test and mock data generator
This small module makes it easy to generate tests and request and response data for you openAPI spec (f.k.a. Swagger-spec).

## Installing
`npm install open-api-test-generator`

## Usage
Simply import the module with
`var generator = require('open-api-test-generator');`

Import your openAPI spec:
` var spec = require('path/to/swagger.json');`

Then use it:
`generator.generate(spec, 'path/to/write/tests/and/mocks');`

At this point GET request mocks are not yet implemented, this will follow soon.