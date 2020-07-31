const tags   = require('../lib/tags');
const tf     = new tags.TagFactory();

describe('Tags', () => {
  describe('TagFactory', () => {

    it('should create tag 20 (TransactionReferenceNumber)', () => {
      const ref = 'REFERENCE';
      const tag = tf.createTag('20', null, ref);
      expect(tag.fields.transactionReference).toEqual(ref);
    });

    it('should create tag 21 (RelatedReference)', () => {
      const ref = 'REFERENCE';
      const tag = tf.createTag('21', null, ref);
      expect(tag.fields.relatedReference).toEqual(ref);
    });

    it('should create tag 25 (AccountIdentification)', () => {
      const account = '123456789';
      const tag = tf.createTag('25', null, account);
      expect(tag.fields.accountIdentification).toEqual(account);
    });

    it('should create tag 28 (StatementNumber)', () => {
      const str = '998/1';
      const tag = tf.createTag('28', null, str);
      expect(tag.fields.statementNumber).toEqual('998');
      expect(tag.fields.sequenceNumber).toEqual('1');
    });

    it('should create tag NS (NonSwift)', () => {
      const str = 'XYZ';
      const tag = tf.createTag('NS', null, str);
      expect(tag.fields.nonSwift).toEqual('XYZ');
    });

    it('should create tag 60 (OpeningBalance)', () => {
      const str = 'C160507EUR123,89';
      const tag = tf.createTag('60', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.currency).toEqual('EUR');
      expect(tag.fields.amount).toEqual(123.89);
    });

    it('should create tag 62 (ClosingBalance)', () => {
      const str = 'C160507EUR123,89';
      const tag = tf.createTag('62', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.currency).toEqual('EUR');
      expect(tag.fields.amount).toEqual(123.89);
    });

    it('should create tag 64 (ClosingAvailableBalance)', () => {
      const str = 'C160507EUR123,89';
      const tag = tf.createTag('64', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.currency).toEqual('EUR');
      expect(tag.fields.amount).toEqual(123.89);
    });

    it('should create tag 65 (ForwardAvailableBalance)', () => {
      const str = 'C160507EUR123,89';
      const tag = tf.createTag('65', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.currency).toEqual('EUR');
      expect(tag.fields.amount).toEqual(123.89);
    });

    it('should create tag 61 (StatementLine)', () => {
      const str = '1605070507D123,89NTRFNONREF//B4E07XM00J000023';
      const tag = tf.createTag('61', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.entryDate.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.amount).toEqual(-123.89);
      expect(tag.fields.transactionType).toEqual('NTRF');
      expect(tag.fields.reference).toEqual('NONREF');
      expect(tag.fields.bankReference).toEqual('B4E07XM00J000023');
      expect(tag.fields.isReversal).toEqual(false);
    });

    it('should create tag 61 / reversal and funds code', () => {
      const str = '1605070507RDR123,89NTRFNONREF//B4E07XM00J000023';
      const tag = tf.createTag('61', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.entryDate.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.amount).toEqual(123.89); // Reversed
      expect(tag.fields.transactionType).toEqual('NTRF');
      expect(tag.fields.reference).toEqual('NONREF');
      expect(tag.fields.bankReference).toEqual('B4E07XM00J000023');
      expect(tag.fields.isReversal).toEqual(true);
      expect(tag.fields.fundsCode).toEqual('R');
    });

    it('should create tag 61 (with extraDetails)', () => {
      const str = '1605070507D123,89NTRFNONREF//B4E07XM00J000023\nSUPPLEMENTARY_DETAILS';
      const tag = tf.createTag('61', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.entryDate.toISOString().substr(0,10)).toEqual('2016-05-07');
      expect(tag.fields.amount).toEqual(-123.89);
      expect(tag.fields.transactionType).toEqual('NTRF');
      expect(tag.fields.reference).toEqual('NONREF');
      expect(tag.fields.bankReference).toEqual('B4E07XM00J000023');
      expect(tag.fields.isReversal).toEqual(false);
      expect(tag.fields.extraDetails).toEqual('SUPPLEMENTARY_DETAILS');
    });

    it('should create tag 61 (with extraDetails, but no bankRef)', () => {
      const str = '170406D000000001001,69N541NONREF\nNL72RABO0104510633';
      const tag = tf.createTag('61', null, str);
      expect(tag.fields.date.toISOString().substr(0,10)).toEqual('2017-04-06');
      expect(tag.fields.isReversal).toEqual(false);
      expect(tag.fields.amount).toEqual(-1001.69);
      expect(tag.fields.transactionType).toEqual('N541');
      expect(tag.fields.reference).toEqual('NONREF');
      expect(tag.fields.extraDetails).toEqual('NL72RABO0104510633');
    });

    it('should create tag 86 (TransactionDetails)', () => {
      const str = 'Some text here';
      const tag = tf.createTag('86', null, str);
      expect(tag.fields.transactionDetails).toEqual('Some text here');
    });

    it('should create tag with a subId', () => {
      const str = '998/1';
      const tag = tf.createTag('28', 'C', str);
      expect(tag.fields.statementNumber).toEqual('998');
      expect(tag.fields.sequenceNumber).toEqual('1');
    });

    it('should throw unknown tag', () => {
      const str = 'Some data';
      expect(tf.createTag.bind(tf, 'XX', null, str)).toThrow(/Unknown tag/);
    });

    it('should throw wrong content', () => {
      const str = 'Some data';
      expect(tf.createTag.bind(tf, '28', null, str)).toThrow(/Cannot parse/);
    });
  });
  describe('Tags', () => {

    it('Tag and TagBalance are abstact', () => {
      expect(() => new tags.Tag).toThrow(/Tag instances/);
      expect(() => new tags.TagBalance('C160507EUR123,89')).toThrow(/TagBalance instances/);
    });

  });
});
