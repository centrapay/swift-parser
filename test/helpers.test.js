/*
*  Copyright 2016 Alexander Tsybulsky and other contributors
*  Copyright 2020 Centrapay and other contributors
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

const helpers = require('../lib/helperModels');
const BigNumber = require('bignumber.js');

describe('Helpers', () => {
  describe('Bank date parser', () => {
    it('should work at all (with full date)', () => {
      expect('2016-12-01').toEqual(helpers.Date.parse(2016,12,1).toISOString().substr(0, 10));
      expect('1996-12-01').toEqual(helpers.Date.parse(1996,12,1).toISOString().substr(0, 10));
    });

    it('should work with YY (2-digit) year', () => {
      expect('2016-12-01').toEqual(helpers.Date.parse(16,12,1).toISOString().substr(0, 10));
    });
  });

  describe('Bank amount', () => {
    describe('Parse', () => {
      it('should parse debit amount -> negative', () => {
        expect(helpers.Amount.parse('D', '123.34')).toEqual(BigNumber(-123.34));
      });

      it('should parse credit amount -> positive', () => {
        expect(helpers.Amount.parse('C', '123.34')).toEqual(BigNumber(123.34));
      });

      it('should parse debit amount reversal -> positive', () => {
        expect(helpers.Amount.parse('RD', '123.34')).toEqual(BigNumber(123.34));
      });

      it('should parse credit amount reversal -> negative', () => {
        expect(helpers.Amount.parse('RC', '123.34')).toEqual(BigNumber(-123.34));
      });

      it('should parse amount with ,', () => {
        expect(helpers.Amount.parse('C', '123,34')).toEqual(BigNumber(123.34));
      });

      it('should round to 2 fractional digits', () => {
        expect(helpers.Amount.parse('C', '123,345')).toEqual(BigNumber(123.35));
      });

      it('should fail if wrong indicator passed', () => {
        expect(helpers.Amount.parse.bind(null, 'X', '123,34')).toThrow(/Wrong debit/);
      });

      it('should fail if wrong indicator passed / reversal', () => {
        expect(helpers.Amount.parse.bind(null, 'XZ', '123,34')).toThrow(/Wrong reversal/);
      });

      it('should fail if wrong indicator passed / reversal 2', () => {
        expect(helpers.Amount.parse.bind(null, 'RZ', '123,34')).toThrow(/Wrong debit/);
      });

      it('should fail if wrong amount passed', () => {
        expect(helpers.Amount.parse.bind(null, 'D', 'XXXXXX')).toThrow(/Amount cannot be parsed/);
      });

      it('should fail for negative amount string', () => {
        expect(helpers.Amount.parse.bind(null, 'D', '-123.78')).toThrow(/Positive amount/);
      });
    });

  });


});
