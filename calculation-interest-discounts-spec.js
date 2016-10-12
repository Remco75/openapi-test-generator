'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var customFormats = module.exports = function(zSchema) {
  // Placeholder file for all custom-formats in known to swagger.json
  // as found on
  // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#dataTypeFormat

  var decimalPattern = /^\d{0,8}.?\d{0,4}[0]+$/;

  /** Validates floating point as decimal / money (i.e: 12345678.123400..) */
  zSchema.registerFormat('double', function(val) {
    return !decimalPattern.test(val.toString());
  });

  /** Validates value is a 32bit integer */
  zSchema.registerFormat('int32', function(val) {
    // the 32bit shift (>>) truncates any bits beyond max of 32
    return Number.isInteger(val) && ((val >> 0) === val);
  });

  zSchema.registerFormat('int64', function(val) {
    return Number.isInteger(val);
  });

  zSchema.registerFormat('float', function(val) {
    // should parse
    return Number.isInteger(val);
  });

  zSchema.registerFormat('date', function(val) {
    // should parse a a date
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('dateTime', function(val) {
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('password', function(val) {
    // should parse as a string
    return typeof val === 'string';
  });
};

customFormats(ZSchema);

var validator = new ZSchema({});
var request = require('request');

chai.should();

describe('/calculation/interest-discounts', function() {
  describe('get', function() {
    it('should respond with 200 successful operation', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "properties": {
          "interestDiscountList": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "NEW_CHECKING_ACCOUNT",
                    "QUICK_CLOSING_MORTGAGE",
                    "QUOTE_DISCOUNT"
                  ]
                },
                "value": {
                  "type": "number"
                },
                "useInMaxMortgageCalculation": {
                  "type": "boolean",
                  "default": false
                },
                "alwaysUseInMaxMortgageCalculation": {
                  "type": "boolean",
                  "default": false
                },
                "useInMonthlyCostsCalculation": {
                  "type": "boolean",
                  "default": false
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      request({
        url: 'http://www-t7.snsbank.nl/online/rest/mortgage/calculation/interest-discounts',
        method: 'GET',
        rejectUnauthorized: false,
        json: true
        //,
        //headers: {
        //  'Content-Type': 'application/json'
        //}
      },
      function(error, res, body) {
        if (error) return done(error);
        body = JSON.parse(body.substring(5));
        console.log(body);
        res.statusCode.should.equal(200);

        validator.validate(body, schema).should.be.true;
        done();
      });
    });

  });

});
