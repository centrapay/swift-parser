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

const Field86Structure = require('./field86structure');

/**
 * A financial transaction record.
 *
 * @property {Date} date - transaction date
 * @property {Number} amount - transaction amount (with sign, Credit+, Debit-)
 * @property {Boolean} isReversal - reversal transaction
 * @property {string} currency - transaction currency (copy of statement currency)
 * @property {array<string>} detailSegments - content of relevant 86 tag(s)
 * @property {string} details - content of relevant 86 tag(s) as a single string
 * @property {Object} structuredDetails - parsed details in form of { subtag: value }
 * @property {string} transactionType - MT940 transaction type code (e.g. NTRF ...)
 * @property {string} reference - payment reference field
 * @property {Date} entryDate - entry date field
 * @property {string} fundsCode - funds code field
 * @property {string} bankReference - bank reference
 * @property {string} extraDetails - extra details (supplementary details)
 * @property {string} nonSwift - content of NS tags which happened in the context of transaction (after tags 61 or 86), can be multiline (separated by `\n`)
 */
class Transaction {

  constructor(props) {
    this.date = props.date;
    this.entryDate = props.entryDate;
    this.fundsCode = props.fundsCode;
    this.amount = props.amount;
    this.isReversal = props.isReversal;
    this.transactionType = props.transactionType;
    this.reference = props.reference;
    this.bankReference = props.bankReference;
    this.extraDetails = props.extraDetails;
    this.currency = props.currency;
    this.detailSegments = props.detailSegments || [];
  }

  get details() {
    return this.detailSegments.join('\n');
  }

  get structuredDetails() {
    return Field86Structure.parse(this.details);
  }

}

module.exports = Transaction;
