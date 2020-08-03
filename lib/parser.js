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
 * MT940 parser class
 * @module lib/parser
 */

const Tags = require('./tags');
const mt940MsgType = require('./mt940');

/**
 * Main parser class, parses input text (e.g. read from a file) into array of statements.
 * Each statement is validated for: all strictly required tags,
 * opening/closing balance currency is the same, opening balance + turnover = closing balance.
 * One input may return one or more statements (as array). Each statement contains transactions
 * array, where each contains data of tag 61 (and tag 86 for details).
 * <p>Output statement contains:</p>
 * @property {string} transactionReference - tag 20 reference
 * @property {string} relatedReference - tag 21 reference, optional
 * @property {string} accountIdentification - tag 25 own bank account identification
 * @property {string} number.statement - tag 28 main statement number
 * @property {string} number.sequence - tag 28 statement sub number (sequence)
 * @property {string} number.section - tag 28 statement sub sub number (present on some banks)
 * @property {Date}   openingBalanceDate - tag 60 statement opening date
 * @property {Date}   closingBalanceDate - tag 62 statement closing date
 * @property {Date} closingAvailableBalanceDate - closing available balance date (field 64)
 * @property {Date} forwardAvailableBalanceDate - forward available balance date (field 65)
 * @property {Date}   statementDate - abstraction for statement date = `closingBalanceDate`
 * @property {string} currency - statement currency
 * @property {Number} openingBalance - beginning balance of the statement
 * @property {Number} closingBalance - ending balance of the statement
 * @property {Number} closingAvailableBalance - closing available balance (field 64)
 * @property {Number} forwardAvailableBalance - forward available balance (field 65)
 * @property {string} informationToAccountOwner - statement level additional details
 * @property {object} messageBlocks - statement message blocks, if present (EXPERIMENTAL)
 *
 * @property {array}  transactions - collection of transactions
 * @property {Date}   transaction.date - transaction date
 * @property {Number} transaction.amount - transaction amount (with sign, Credit+, Debit-)
 * @property {Boolean} transaction.isReversal - reversal transaction
 * @property {string} transaction.currency - transaction currency (copy of statement currency)
 * @property {string} transaction.details - content of relevant 86 tag(s), may be multiline (`\n` separated)
 * @property {string} transaction.transactionType - MT940 transaction type code (e.g. NTRF ...)
 * @property {string} transaction.reference - payment reference field
 * @property {Date}   transaction.entryDate - optional, entry date field
 * @property {string} transaction.fundsCode - optional, funds code field
 * @property {string} transaction.bankReference - optional, bank reference
 * @property {string} transaction.extraDetails - optional, extra details (supplementary details)
 * @property {Object} transaction.structuredDetails - optional, if detected, parsed details in form of { subtag: value }
 * @property {string} transaction.nonSwift - optional, content of NS tags which happened in the context of transaction (after tags 61 or 86), can be multiline (separated by `\n`)
 * @example
 * const mt940parser = new Parser();
 * const statements  = parser.parse(fs.readFileSync(path, 'utf8'));
 * for (let i of statements) {
 *   console.log(i.number.statement, i.statementDate);
 *   for (let t of i.transactions) {
 *     console.log(t.amount, t.currency);
 *   }
 * }
 */
class Parser {

  constructor () {
    this.params = { };
    this.postParseMiddlewareStack = [];
  }

  /**
  * Parse text data into array of statements
  *
  * @param {string} data - text unparsed bank statement in MT940 format
  * @param {boolean} withTags - tags will be copied to output statements in `tags` attribute for further analysis
  * @param {boolean} with86Structure - parse 86 field structure (default: true)
  * @return {array} Array of statements @see class documentation for details
  */
  parse({ data, with86Structure = true, withTags = false }) {
    const factory    = new Tags.TagFactory();
    const dataLines  = this._splitAndNormalize(data);
    const tagLines   = [...this._parseLines(dataLines)];
    const tags       = tagLines.map(i => factory.createTag(i.id, i.subId, i.data.join('\n')));
    const tagGroups  = this._groupTags(tags);
    const msgType = mt940MsgType;
    const statements = tagGroups.map((group, idx) => {
      msgType.validateGroup({ group, groupNumber: idx + 1 });
      return msgType.buildStatement({ group, withTags, with86Structure });
    });

    for (let s of statements) {
      this._applyPostParseMiddlewares(s);
    }

    return statements;
  }

  /**
   * usePostParse - use middleware(s) after parsing, before result return
   * @param {function} fn - middleware fn(statement, next)
   */
  usePostParse(fn) {
    if (typeof fn !== 'function') throw Error('middleware must be a function');
    this.postParseMiddlewareStack.push(fn);
  }

  /**
   * _aaplyPostParse - internal apply post parse middlewares
   * @param {object} statement - statement to process
   */
  _applyPostParseMiddlewares(statement) {
    if (this.postParseMiddlewareStack.length === 0) return;
    const chainFn = this.postParseMiddlewareStack
      .reverse()
      .reduce((next, fn) => fn.bind(null, statement, next), () => {});
    chainFn(statement);
  }

  /**
  * Split text into lines, replace clutter, remove empty lines ...
  * @private
  */
  _splitAndNormalize(data) {
    return data
      .split(/\r?\n/)
      .filter(line => !!line && line !== '-');
  }

  /**
  * Convert lines into separate tags
  * @private
  */
  *_parseLines(lines) {
    const reTag = /^:([0-9]{2}|NS)([A-Z])?:/;
    let tag = null;

    for (let i of lines) {

      // Detect new tag start
      const match = i.match(reTag);
      if (match || i.startsWith('-}') || i.startsWith('{')) {
        if (tag) yield tag; // Yield previous
        tag = match // Start new tag
          ? {
            id:    match[1],
            subId: match[2] || '',
            data:  [i.substr(match[0].length)]
          }
          : {
            id:    'MB',
            subId: '',
            data:  [i.trim()],
          };
      } else { // Add a line to previous tag
        tag.data.push(i);
      }
    }

    if (tag) { yield tag } // Yield last
  }

  /**
  * Group tags into statements
  * @private
  */
  _groupTags(tags) {
    if (tags.length === 0) return [];
    const hasMessageBlocks = (tags[0] instanceof Tags.TagMessageBlock);
    const groups = [];
    let curGroup;

    for (let i of tags) {
      if (hasMessageBlocks && i instanceof Tags.TagMessageBlock && i.isStarting ||
        !hasMessageBlocks && i instanceof Tags.TagTransactionReferenceNumber) {
        groups.push(curGroup = []); // Statement starting tag -> start new group
      }
      curGroup.push(i);
    }
    return groups;
  }

}

module.exports = Parser;
