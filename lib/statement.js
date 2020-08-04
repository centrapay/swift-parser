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


/**
 * A statement of financial transactions.
 *
 * @property {string} transactionReference - tag 20 reference
 * @property {string} relatedReference - tag 21 reference
 * @property {string} accountIdentification - tag 25 own bank account identification
 * @property {string} number.statement - tag 28 main statement number
 * @property {string} number.sequence - tag 28 statement sub number (sequence)
 * @property {string} number.section - tag 28 statement sub sub number (present on some banks)
 * @property {Date} openingBalanceDate - tag 60 statement opening date
 * @property {Date} closingBalanceDate - tag 62 statement closing date
 * @property {Date} closingAvailableBalanceDate - closing available balance date (field 64)
 * @property {Date} forwardAvailableBalanceDate - forward available balance date (field 65)
 * @property {string} currency - statement currency
 * @property {Number} openingBalance - beginning balance of the statement
 * @property {Number} closingBalance - ending balance of the statement
 * @property {Number} closingAvailableBalance - closing available balance (field 64)
 * @property {Number} forwardAvailableBalance - forward available balance (field 65)
 * @property {string} informationToAccountOwner - statement level additional details
 * @property {object} messageBlocks - statement message blocks, if present
 * @property {array<Transaction>} transactions - collection of transactions
 */
class Statement {

  constructor(props) {
    Object.assign(this, props);
    if(props.closingBalance){
      if (!this.closingAvailableBalanceDate) {
        this.closingAvailableBalanceDate = new Date(this.closingBalanceDate);
        this.closingAvailableBalance = this.closingBalance;
      }
      if (!this.forwardAvailableBalanceDate) {
        this.forwardAvailableBalanceDate = new Date(this.closingAvailableBalanceDate);
        this.forwardAvailableBalance = this.closingAvailableBalance;
      }
    }
  }
}

module.exports = Statement;