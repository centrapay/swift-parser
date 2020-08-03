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

const Tags = require('./tags');
const Field86Structure = require('./field86structure');
const Statement = require('./statement');

function formatTxn({ txn, with86Structure }) {
  const result = {
    ...txn,
    details: txn.detailLines.join('\n'),
  };
  delete result.detailLines;
  if (with86Structure) {
    let structuredDetails = Field86Structure.parse(txn.detailLines.join('\n'));
    if (structuredDetails) {
      result.structuredDetails = structuredDetails;
    }
  }
  return result;
}

class StatementVisitor {

  constructor(opts) {
    this.withTags = opts.withTags;
    this.with86Structure = opts.with86Structure;
    this.messageBlocks = {};
    this.transactions = [];
    this.informationToAccountOwner = [];
    this.tags = [];
  }

  pushTag(tag) {
    this.tags.push(tag);
    if (! (tag instanceof Tags.TagNonSwift)) {
      this.prevTag = tag;
    }
  }

  get lastTransaction() {
    return this.transactions[this.transactions.length - 1];
  }

  toMt940Statement() {
    const statement = new Statement({
      accountIdentification: this.accountIdentification,
      number: this.statementNumber,
      relatedReference: this.relatedReference,
      transactionReference: this.transactionReference,
      currency: this.currency,
      transactions: this.transactions.map(txn => formatTxn({ txn, with86Structure: this.with86Structure })),
      closingBalanceDate: this.closingBalanceDate,
      statementDate: this.statementDate,
      openingBalanceDate: this.openingBalanceDate,
      openingBalance: this.openingBalance,
      closingBalance: this.closingBalance,
      closingAvailableBalanceDate: this.closingAvailableBalanceDate,
      closingAvailableBalance: this.closingAvailableBalance,
      forwardAvailableBalanceDate: this.forwardAvailableBalanceDate,
      forwardAvailableBalance: this.forwardAvailableBalance,
      informationToAccountOwner: this.informationToAccountOwner.join('\n'),
      messageBlocks: this.messageBlocks,
    });
    if (this.withTags) {
      statement.tags = this.tags;
    }
    return statement;
  }

  visitMessageBlock(tag) {
    Object.entries(tag.fields).forEach(([key, value]) => {
      if (value && key !== 'EOB') {
        this.messageBlocks[key] = { value };
      }
    });
    this.pushTag(tag);
  }

  visitAccountIdentification(tag) {
    this.accountIdentification = tag.fields.accountIdentification;
    this.pushTag(tag);
  }

  visitStatementNumber(tag) {
    this.statementNumber = {
      statement: tag.fields.statementNumber,
      sequence: tag.fields.sequenceNumber,
      section: tag.fields.sectionNumber,
    };
    this.pushTag(tag);
  }

  visitRelatedReference(tag) {
    this.relatedReference = tag.fields.relatedReference;
    this.pushTag(tag);
  }

  visitTransactionReferenceNumber(tag) {
    this.transactionReference = tag.fields.transactionReference;
    this.pushTag(tag);
  }

  visitStatementLine(tag) {
    this.transactions.push(Object.assign({},
      tag.fields,
      {
        currency: this.currency,
        detailLines: [],
      }
    ));
    this.pushTag(tag);
  }

  visitTransactionDetails(tag) {
    if (this.prevTag instanceof Tags.TagStatementLine) {
      this.lastTransaction.detailLines.push(tag.fields.transactionDetails);
    } else {
      this.informationToAccountOwner.push(tag.fields.transactionDetails);
    }
    this.pushTag(tag);
  }

  visitOpeningBalance(tag) {
    this.openingBalanceDate = tag.fields.date;
    this.openingBalance = tag.fields.amount;
    this.currency = tag.fields.currency;
    this.pushTag(tag);
  }

  visitClosingBalance(tag) {
    this.closingBalanceDate = tag.fields.date;
    this.statementDate = tag.fields.date;
    this.closingBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitForwardAvailableBalance(tag) {
    this.forwardAvailableBalanceDate = tag.fields.date;
    this.forwardAvailableBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitClosingAvailableBalance(tag) {
    this.closingAvailableBalanceDate = tag.fields.date;
    this.closingAvailableBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitNonSwift(tag) {
    if (this.prevTag instanceof Tags.TagStatementLine || this.prevTag instanceof Tags.TagTransactionDetails) {
      this.lastTransaction.nonSwift = tag.data;
    }
    this.pushTag(tag);
  }
}

module.exports = StatementVisitor;
