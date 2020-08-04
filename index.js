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
 * MT940 parser
 * @module @centrapay/swift-parser
 */

const Parser  = require('./lib/parser');
const parser = new Parser();

module.exports = {

  /**
   * Parse a SWIFT MT940 or MT942 statement message.
   *
   * @function
   * @param {object} opts
   * @param {string} opts.data - SWIFT message
   * @param {string} opts.type - message format: mt940 or mt942
   * @param {boolean} [opts.validate=false] - check for semantic errors
   * @returns {array<Statement>} Array of statements
   *
   * @example
   * const parser = require('@centrapay/swift-parser');
   * const statements = parser.parse({
   *   type: 'mt940',
   *   data: fs.readFileSync(path, 'utf8'),
   * });
   *
   * statements.forEach(statement => {
   *   console.log(statement.accountIdentification, statement.number.statement);
   *   statement.transactions.forEach(txn => {
   *     console.log(txn.amount, txn.currency);
   *   };
   * };
   */
  parse: parser.parse.bind(parser),
};
