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

const moment = require('moment');

/**
 * Helper models
 * @module lib/helperModels
 */

/** helper class to parse date based on 2-digit year */
class BankDate {
  /**
   * Parses date
   * @param {string} year - 4-digit or 2-digit year, 20xx assumed for the latter
   * @param {string} month - month number (starting from 1 = January)
   * @param {string} day - day number
   * @return {Date} a Date object
   * @static
   */
  static parse(year, month, day) {
    let fullyear = Number.parseInt(year, 10);
    if (fullyear < 100) {
      fullyear += 2000;
    }
    return new Date(Date.UTC(fullyear, Number.parseInt(month, 10) - 1, day));
  }

  static forOffsetDateTime({date, time, offset}){
    return moment(date+time+offset,'YYMMDDHmmZZ').toDate();
  }
}

/** helper class to parse amount and identify it's sign based on Debit/Credit mark */
class BankAmount {

  /**
   * Parses amount, identifies sign based on Debit or Credit mark.
   * @param {string} dcmark - D or C = Debit or credit (C = positive), prefix 'R' -> change of sign, reversed
   * @param {string} amoutStr - string with positive float number
   * @return {float} amount, rounded to 2 fractional digits, with sign
   * @static
   */
  static parse(dcmark, amountStr) {
    let rev, dc = dcmark;
    if (dcmark.length === 2) {
      rev = dcmark[0];
      dc = dcmark[1];
    }
    if (rev && rev !== 'R') throw Error( `Wrong reversal mark: ${dcmark}` );
    if (! (dc === 'D' || dc === 'C') ) throw Error( `Wrong debit/credit mark: ${dcmark}` );

    let amount = Number.parseFloat(amountStr.replace(',', '.'));
    if (Number.isNaN(amount)) { throw Error( `Amount cannot be parsed: ${amountStr}` ) }
    if (amount < 0) { throw Error( `Positive amount string expected: ${amountStr}` ) }

    if (dc === 'D') amount = -amount; // Bank debit = minus
    if (rev) amount = -amount;
    amount = Math.round(amount * 100) / 100;
    return amount;
  }

  /**
   * Compares amounts (floats in fact), returns True if difference < 0.001
   * @param {float} a - number 1
   * @param {float} b - number 2
   * @static
   */
  static isEqual(a, b) {
    return Math.abs(a - b) < 0.001;
  }
}

module.exports = {
  /** Bank amount, parses debit/credit mark + amount string */
  Amount: BankAmount,

  /** Bank date, parses date with 2digit year */
  Date: BankDate
};
