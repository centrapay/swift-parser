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

const Parser  = require('../lib/parser');
const Tags    = require('../lib/tags');
const helpers = require('../lib/helperModels');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const BigNumber = require('bignumber.js');

const DUMMY_STATEMENT_LINES = [
  ':20:B4E08MS9D00A0009',
  ':21:X',
  ':25:123456789',
  ':28C:123/1',
  ':60F:C140507EUR0,00',
  ':61:1405070507C500,00NTRFNONREF//AUXREF',
  ':86:LINE1',
  'LINE2',
  ':62F:C140508EUR500,00',
];

const DUMMY_STATEMENT_LINES_WITH_STRUCTURE = [
  ':20:B4E08MS9D00A0009',
  ':21:X',
  ':25:123456789',
  ':28C:123/1',
  ':60F:C140507EUR0,00',
  ':61:1405070507C500,00NTRFNONREF//AUXREF',
  ':86:?20some?21data',
  ':62F:C140508EUR500,00',
];

const DUMMY_STATEMENT_LINES_61_64_65 = [
  ':20:B4E08MS9D00A0009',
  ':21:X',
  ':25:123456789',
  ':28C:123/1',
  ':60F:C140507EUR0,00',
  ':61:1405070507C500,00NTRFNONREF//AUXREF',
  'SUPPLEMENTARY61',
  ':86:LINE1',
  'LINE2',
  ':62F:C140508EUR500,00',
  ':64:C140509EUR600,00',
  ':65:C140510EUR700,00',
  ':86:statement',
  'comment',
];

const DUMMY_STATEMENT_W_MESSAGE_BLOCKS = [
  '{1:F01KNABNL2HAXXX0000000000}{2:I940KNABNL2HXXXXN3020}{4:',
  ':20:B4E08MS9D00A0009',
  ':21:X',
  ':25:123456789',
  ':28C:123/1',
  ':60F:C140507EUR0,00',
  ':61:1405070507C500,00NTRFNONREF//AUXREF',
  ':86:LINE1',
  'LINE2',
  ':62F:C140508EUR500,00',
  '-}',
  '{1:F01KNABNL2HAXXX0000000000}{2:I940KNABNL2HXXXXN3020}{4:',
  ':20:B4E08MS9D00A0009',
  ':21:X',
  ':25:123456789',
  ':28C:123/2',
  ':60F:C140508EUR500,00',
  ':62F:C140508EUR500,00',
  '-}{5:{CAC:VALIDATION SUCCESS}}'
];

function expectedMt940Statement() {
  return {
    transactionReference:  'B4E08MS9D00A0009',
    relatedReference:      'X',
    accountIdentification: '123456789',
    number: {
      statement: '123',
      sequence:  '1',
      section:   ''
    },
    openingBalanceDate: helpers.Date.parse('14', '05', '07'),
    closingBalanceDate: helpers.Date.parse('14', '05', '08'),
    currency:           'EUR',
    openingBalance:     BigNumber(0.0),
    closingBalance:     BigNumber(500.0),
    closingAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
    forwardAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
    closingAvailableBalance:     BigNumber(500.0),
    forwardAvailableBalance:     BigNumber(500.0),
    informationToAccountOwner: '',
    messageBlocks: {},
    transactions: [
      {
        amount:          BigNumber(500.00),
        isReversal:      false,
        currency:        'EUR',
        reference:       'NONREF',
        bankReference:   'AUXREF',
        transactionType: 'NTRF',
        date:            helpers.Date.parse('14', '05', '07'),
        entryDate:       helpers.Date.parse('14', '05', '07'),
        detailSegments: [ 'LINE1\nLINE2' ],
        extraDetails:    '',
        fundsCode:       '',
      }
    ]};
}

const DUMMY_GROUP_SIMPLE = [
  new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
  new Tags.TagAccountIdentification('123456789'),
  new Tags.TagStatementNumber('123/1'),
  new Tags.TagOpeningBalance('C140507EUR0,00'),
  new Tags.TagStatementLine('1405070507C500,00NTRFNONREF//AUXREF'),
  new Tags.TagTransactionDetails('DETAILS'),
  new Tags.TagClosingBalance('C140508EUR500,00')
];
const DUMMY_GROUP_COMPLEX = [ // 2 detail lines and 2 transactions
  new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
  new Tags.TagRelatedReference('X'),
  new Tags.TagAccountIdentification('123456789'),
  new Tags.TagStatementNumber('123/1'),
  new Tags.TagOpeningBalance('C140507EUR0,00'),
  new Tags.TagStatementLine('1405070507C500,00NTRFNONREF//AUXREF'),
  new Tags.TagTransactionDetails('LINE1\nLINE2'),
  new Tags.TagStatementLine('1405070507C0,00NTRFNONREF2'),
  new Tags.TagTransactionDetails('LINE1'),
  new Tags.TagClosingBalance('C140508EUR500,00')
];

///////////////////////////////////////////////////////////////////////////////
// TESTS
///////////////////////////////////////////////////////////////////////////////

describe('Parser', () => {

  describe('Full Examples', () => {

    glob.sync('*.{mt940,mt940x}', { cwd: __dirname }).forEach(examplePath => {
      const example = fs.readFileSync(path.resolve(__dirname, examplePath), 'utf-8');

      test(`${examplePath} statements`, () => {
        const statements = new Parser().parse({ data: example, type: 'mt940' });
        expect(statements).toMatchSnapshot();
      });

      test(`${examplePath} transaction computed state`, () => {
        const statements = new Parser().parse({ data: example, type: 'mt940' });
        const transactions = statements
          .flatMap(s => s.transactions)
          .map(t => {
            return {
              details: t.details,
              structuredDetails: t.structuredDetails,
            };
          });
        expect(transactions).toMatchSnapshot();
      });

    });

    glob.sync('*.mt942', { cwd: __dirname }).forEach(examplePath => {
      const example = fs.readFileSync(path.resolve(__dirname, examplePath), 'utf-8');
      it(examplePath, () => {
        const parser = new Parser();
        const result = parser.parse({ data: example, type: 'mt942' });
        expect(result).toMatchSnapshot();
      });
    });
  });

  it('parse fails if type is not valid', () =>{
    const parser = new Parser();
    expect(()=> parser.parse({ data: '', type: 'invalid-type'})).toThrow('"invalid-type" is not a valid file type');
  });

  describe('Parser methods', () => {

    it('_splitAndNormalize', () => {
      const parser = new Parser();
      const result = parser._splitAndNormalize('abc   \r\n\r\n-');
      expect(result).toEqual(['abc   ']);
    });

    it('_parseLines', () => {
      const parser = new Parser();
      const result = [...parser._parseLines(DUMMY_STATEMENT_LINES)];
      expect(8).toEqual(result.length);
      expect(result[0]).toEqual({id: '20', subId: '',  data: ['B4E08MS9D00A0009']});
      expect(result[1]).toEqual({id: '21', subId: '',  data: ['X']});
      expect(result[2]).toEqual({id: '25', subId: '',  data: ['123456789']});
      expect(result[3]).toEqual({id: '28', subId: 'C', data: ['123/1']});
      expect(result[4]).toEqual({id: '60', subId: 'F', data: ['C140507EUR0,00']});
      expect(result[5]).toEqual({id: '61', subId: '',  data: ['1405070507C500,00NTRFNONREF//AUXREF']});
      expect(result[6]).toEqual({id: '86', subId: '',  data: ['LINE1', 'LINE2']});
      expect(result[7]).toEqual({id: '62', subId: 'F', data: ['C140508EUR500,00']});
    });

    it('_groupTags', () => {
      const parser = new Parser();
      const groups = [DUMMY_GROUP_SIMPLE, DUMMY_GROUP_COMPLEX];
      const result = parser._groupTags([...DUMMY_GROUP_SIMPLE, ...DUMMY_GROUP_COMPLEX]);
      expect(result).toEqual(groups);
    });

  });

  /* INTEGRATION TEST */
  describe('Integration test', () => {
    it('typical statement', () => {
      const parser = new Parser();
      const result = parser.parse({ data: DUMMY_STATEMENT_LINES.join('\n'), type: 'mt940' });
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expectedMt940Statement());
    });

    it('statement with structured 86', () => {
      let parser = new Parser();
      let result = parser.parse({ data: DUMMY_STATEMENT_LINES_WITH_STRUCTURE.join('\n'), type: 'mt940' });
      expect(result.length).toEqual(1);

      const exp = expectedMt940Statement();
      exp.transactions[0].detailSegments = [ '?20some?21data' ];
      expect(result[0].transactions[0].details).toEqual('?20some?21data');
      expect(result[0].transactions[0].structuredDetails).toEqual({
        '20': 'some',
        '21': 'data',
      });
      expect(result[0]).toEqual(exp);

      parser = new Parser();
      result = parser.parse({ with86Structure: false, data: DUMMY_STATEMENT_LINES_WITH_STRUCTURE.join('\n'), type: 'mt940'});
      delete exp.transactions[0].structuredDetails;
      expect(result[0]).toEqual(exp);
    });

    it('statement with fields 64, 65, long 61 and statement comment', () => {
      const parser = new Parser();
      const exp    = expectedMt940Statement();

      // patch data
      exp.closingAvailableBalanceDate = helpers.Date.parse('14', '05', '09');
      exp.forwardAvailableBalanceDate = helpers.Date.parse('14', '05', '10');
      exp.closingAvailableBalance     = BigNumber(600.0);
      exp.forwardAvailableBalance     = BigNumber(700.0);
      exp.transactions[0].extraDetails = 'SUPPLEMENTARY61';
      exp.informationToAccountOwner = 'statement\ncomment';

      const result = parser.parse({ data: DUMMY_STATEMENT_LINES_61_64_65.join('\n'), type: 'mt940' });
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(exp);
    });

    it('multiple statements with message blocks', () => {
      const parser = new Parser();
      const exp1   = expectedMt940Statement();
      const exp2   = expectedMt940Statement();

      // patch data
      exp1.messageBlocks      = {
        '1': { value: 'F01KNABNL2HAXXX0000000000' },
        '2': { value: 'I940KNABNL2HXXXXN3020' },
      };
      exp2.messageBlocks      = {
        '1': { value: 'F01KNABNL2HAXXX0000000000' },
        '2': { value: 'I940KNABNL2HXXXXN3020' },
        '5': { value: '{CAC:VALIDATION SUCCESS}' },
      };
      exp2.openingBalance     = exp2.closingBalance;
      exp2.openingBalanceDate = exp2.closingBalanceDate;
      exp2.number.sequence    = '2';
      exp2.transactions       = [];

      const result = parser.parse({ data: DUMMY_STATEMENT_W_MESSAGE_BLOCKS.join('\n'), type: 'mt940' });
      expect(result.length).toEqual(2);
      expect(result[0]).toEqual(exp1);
      expect(result[1]).toEqual(exp2);
    });
  });

  /* NS TESTS */
  describe('NS tests', () => {

    const DUMMY_STATEMENT_LINES_WITH_NS = [
      ':20:B4E08MS9D00A0009',
      ':21:X',
      ':25:123456789',
      ':28C:123/1',
      ':60F:C140507EUR0,00',
      ':61:1405070507C100,00NTRFNONREF//AUXREF',
      ':86:LINE1',
      ':61:1405070507C200,00NTRFNONREF//AUXREF',
      ':NS:Hello world',
      ':86:LINE2',
      ':61:1405070507C300,00NTRFNONREF//AUXREF',
      ':86:LINE3',
      ':NS:Hello',
      'bank info',
      ':62F:C140508EUR600,00',
    ];

    it('_parseLines with NS', () => {
      const parser = new Parser();
      const result = [...parser._parseLines(DUMMY_STATEMENT_LINES_WITH_NS)];
      expect(result).toEqual([
        {id: '20', subId: '',  data: ['B4E08MS9D00A0009']},
        {id: '21', subId: '',  data: ['X']},
        {id: '25', subId: '',  data: ['123456789']},
        {id: '28', subId: 'C', data: ['123/1']},
        {id: '60', subId: 'F', data: ['C140507EUR0,00']},
        {id: '61', subId: '',  data: ['1405070507C100,00NTRFNONREF//AUXREF']},
        {id: '86', subId: '',  data: ['LINE1']},
        {id: '61', subId: '',  data: ['1405070507C200,00NTRFNONREF//AUXREF']},
        {id: 'NS', subId: '',  data: ['Hello world']},
        {id: '86', subId: '',  data: ['LINE2']},
        {id: '61', subId: '',  data: ['1405070507C300,00NTRFNONREF//AUXREF']},
        {id: '86', subId: '',  data: ['LINE3']},
        {id: 'NS', subId: '',  data: ['Hello', 'bank info']},
        {id: '62', subId: 'F', data: ['C140508EUR600,00']},
      ]);
    });

    it('statement with NS', () => {
      const parser = new Parser();
      const result = parser.parse({ data: DUMMY_STATEMENT_LINES_WITH_NS.join('\n'), type: 'mt940' });
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        transactionReference:  'B4E08MS9D00A0009',
        relatedReference:      'X',
        accountIdentification: '123456789',
        number: {
          statement: '123',
          sequence:  '1',
          section:   ''
        },
        openingBalanceDate: helpers.Date.parse('14', '05', '07'),
        closingBalanceDate: helpers.Date.parse('14', '05', '08'),
        currency:           'EUR',
        openingBalance:     BigNumber(0.0),
        closingBalance:     BigNumber(600.0),
        closingAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
        forwardAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
        closingAvailableBalance:     BigNumber(600.0),
        forwardAvailableBalance:     BigNumber(600.0),
        informationToAccountOwner: '',
        messageBlocks: {},
        transactions: [
          {
            amount:          BigNumber(100.00),
            isReversal:      false,
            currency:        'EUR',
            reference:       'NONREF',
            bankReference:   'AUXREF',
            transactionType: 'NTRF',
            date:            helpers.Date.parse('14', '05', '07'),
            entryDate:       helpers.Date.parse('14', '05', '07'),
            detailSegments: [ 'LINE1' ],
            extraDetails:    '',
            fundsCode:       '',
          },
          {
            amount:          BigNumber(200.00),
            isReversal:      false,
            currency:        'EUR',
            reference:       'NONREF',
            bankReference:   'AUXREF',
            transactionType: 'NTRF',
            date:            helpers.Date.parse('14', '05', '07'),
            entryDate:       helpers.Date.parse('14', '05', '07'),
            detailSegments: [ 'LINE2' ],
            extraDetails:    '',
            fundsCode:       '',
            nonSwift:        'Hello world',
          },
          {
            amount:          BigNumber(300.00),
            isReversal:      false,
            currency:        'EUR',
            reference:       'NONREF',
            bankReference:   'AUXREF',
            transactionType: 'NTRF',
            date:            helpers.Date.parse('14', '05', '07'),
            entryDate:       helpers.Date.parse('14', '05', '07'),
            detailSegments: [ 'LINE3' ],
            extraDetails:    '',
            fundsCode:       '',
            nonSwift:        'Hello\nbank info',
          },
        ]});
    });

  });

});
