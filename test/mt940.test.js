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

const Tags    = require('../lib/tags');
const helpers = require('../lib/helperModels');
const mt940MsgType = require('../lib/mt940');
const BigNumber = require('bignumber.js');
function expectedStatement() {
  return {
    transactionReference: 'B4E08MS9D00A0009',
    relatedReference: 'X',
    accountIdentification: '123456789',
    number: {
      statement: '123',
      sequence: '1',
      section: ''
    },
    statementDate: helpers.Date.parse('14', '05', '08'),
    openingBalanceDate: helpers.Date.parse('14', '05', '07'),
    closingBalanceDate: helpers.Date.parse('14', '05', '08'),
    currency: 'EUR',
    openingBalance: BigNumber(0.0),
    closingBalance: BigNumber(500.0),
    closingAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
    forwardAvailableBalanceDate: helpers.Date.parse('14', '05', '08'),
    closingAvailableBalance: BigNumber(500.0),
    forwardAvailableBalance: BigNumber(500.0),
    informationToAccountOwner: '',
    messageBlocks: {},
    transactions: [
      {
        amount: BigNumber(500.00),
        isReversal: false,
        currency: 'EUR',
        reference: 'NONREF',
        bankReference: 'AUXREF',
        transactionType: 'NTRF',
        date: helpers.Date.parse('14', '05', '07'),
        entryDate: helpers.Date.parse('14', '05', '07'),
        detailSegments: [ 'LINE1\nLINE2' ],
        extraDetails: '',
        fundsCode: '',
      }
    ]};
}

const DUMMY_GROUP_STRUCTURED = [
  new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
  new Tags.TagAccountIdentification('123456789'),
  new Tags.TagStatementNumber('123/1'),
  new Tags.TagOpeningBalance('C140507EUR0,00'),
  new Tags.TagStatementLine('1405070507C500,00NTRFNONREF//AUXREF'),
  new Tags.TagTransactionDetails('?20Hello?30World'),
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

describe('MT940 Message Type', () => {

  it('buildStatement', () => {
    const group  = DUMMY_GROUP_COMPLEX;
    let result = mt940MsgType.buildStatement({ group });

    let exp  = expectedStatement();
    exp.transactions.push({ // patch
      amount: BigNumber(0.00),
      currency: 'EUR',
      isReversal: false,
      reference: 'NONREF2',
      bankReference: '',
      transactionType: 'NTRF',
      date: helpers.Date.parse('14', '05', '07'),
      entryDate: helpers.Date.parse('14', '05', '07'),
      detailSegments: [ 'LINE1' ],
      extraDetails: '',
      fundsCode: '',
    });
    expect(result).toEqual(exp);
    expect(result.tags).not.toBeDefined();
    expect(result.structuredDetails).not.toBeDefined();
  });

  it('buildStatement structured', () => {
    const result = mt940MsgType.buildStatement({ group: DUMMY_GROUP_STRUCTURED, with86Structure: true });
    expect(result.transactions[0].structuredDetails).toEqual({
      '20': 'Hello',
      '30': 'World',
    });
  });

  it('validateGroup throws', () => {
    expect(() => mt940MsgType.validateGroup({ group: [ // missing tags
      new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
    ]})).toThrow(/Mandatory tag/);
    expect(() => mt940MsgType.validateGroup({ group: [ // missing tags
      new Tags.TagClosingBalance('C140508EUR500,00')
    ]})).toThrow(/Mandatory tag/);
    expect(() => mt940MsgType.validateGroup({ group: [ // missing tags
      new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
      new Tags.TagOpeningBalance('C140507EUR0,00'),
      new Tags.TagClosingBalance('C140508EUR500,00')
    ]})).toThrow(/Mandatory tag/);
    expect(() => mt940MsgType.validateGroup({ group: [ // inconsistent currency
      new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
      new Tags.TagAccountIdentification('123456789'),
      new Tags.TagStatementNumber('123/1'),
      new Tags.TagOpeningBalance('C140507EUR0,00'),
      new Tags.TagStatementLine('1405070507C500,00NTRFNONREF//AUXREF'),
      new Tags.TagTransactionDetails('DETAILS'),
      new Tags.TagClosingBalance('C140508USD500,00')
    ]})).toThrow(/Currency markers/);
    expect(() => mt940MsgType.validateGroup({ group: [ // inconsistent balances
      new Tags.TagTransactionReferenceNumber('B4E08MS9D00A0009'),
      new Tags.TagAccountIdentification('123456789'),
      new Tags.TagStatementNumber('123/1'),
      new Tags.TagOpeningBalance('C140507EUR0,00'),
      new Tags.TagStatementLine('1405070507C400,00NTRFNONREF//AUXREF'),
      new Tags.TagTransactionDetails('DETAILS'),
      new Tags.TagClosingBalance('C140508EUR500,00')
    ]})).toThrow(/Sum of lines/);
  });

});
