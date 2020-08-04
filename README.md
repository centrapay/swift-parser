# Centrapay SWIFT Parser

SWIFT bank statement parser for JavaScript (ES2015). Supports [MT 940 Customer
Statement Message][MT940] and [MT 942 Interim Transaction Report][MT942].


## Installation

```bash
npm install @centrapay/swift-parser
```

## Usage

```javascript
const parser = require('@centrapay/swift-parser');
const statements = parser.parse({
  type: 'mt940',
  data: fs.readFileSync(path, 'utf8'),
});

statements.forEach(statement => {
  console.log(statement.accountIdentification, statement.number.statement);
  statement.transactions.forEach(txn => {
    console.log(txn.amount, txn.currency);
  };
};
```


## CLI

This package also includes a CLI which parses a SWIFT file and outputs the result as JSON:

```bash
swift-parse -t mt942 my-statement.txt
```


## API

### parser.parse()

Parse a SWIFT statement document.

If `parser.parse()` is invoked with `{ validate: true }` then MT940 statements
are additionally validated for:

- all strictly required tags
- opening/closing balance currency is the same
- opening balance + turnover = closing balance

**Returns:** Array\<Statement\>

**Params:**

| Param    | Type    | Description                                           |
|----------|---------|-------------------------------------------------------|
| data     | string  | raw SWIFT message text                                |
| type     | string  | message format (mt940 or mt942)                       |
| validate | boolean | *Optional* perform additional semantic error checking |


### Statement

| Field                       | Type      | Description                                                                |
|-----------------------------|-----------|----------------------------------------------------------------------------|
| transactionReference        | string    | tag 20 reference                                                           |
| relatedReference            | string    | tag 21 reference                                                           |
| accountIdentification       | string    | tag 25 own bank account identification                                     |
| number.statement            | string    | tag 28 main statement number                                               |
| number.sequence             | string    | tag 28 statement sub number (sequence)                                     |
| number.section              | string    | tag 28 statement sub sub number (present on some banks)                    |
| openingBalanceDate          | Date      | tag 60 statement opening date                                              |
| closingBalanceDate          | Date      | tag 62 statement closing date                                              |
| closingAvailableBalanceDate | Date      | tag 64 closing available balance date, default = closing date              |
| forwardAvailableBalanceDate | Date      | tag 65 forward available balance date, default = closing available date    |
| currency                    | string    | statement currency (USD, EUR ...)                                          |
| openingBalance              | BigNumber | beginning balance of the statement (with sign, based on debit/credit mark) |
| closingBalance              | BigNumber | ending balance of the statement (with sign, based on debit/credit mark)    |
| closingAvailableBalance     | BigNumber | tag 64 closing available balance, default = closing balance                |
| forwardAvailableBalance     | BigNumber | tag 65 forward available balance, default = closing available              |
| informationToAccountOwner   | string    | additional statement level information                                     |
| transactions                | array     | collection of transactions                                                 |
| messageBlocks               | object    | statement message blocks, if present (EXPERIMENTAL)                        |


### Transaction

| Field             | Type      | Description                                                            |
|-------------------|-----------|------------------------------------------------------------------------|
| date              | Date      | transaction date                                                       |
| amount            | BigNumber | transaction amount (with sign, Credit+, Debit-)                        |
| reversal          | Boolean   | transaction is a reversal                                              |
| currency          | string    | transaction currency (copy of statement currency)                      |
| details           | string    | content of relevant 86 tag(s), may be multiline (`\n` separated)       |
| transactionType   | string    | MT940 transaction type code (e.g. NTRF ...)                            |
| reference         | string    | payment reference field                                                |
| entryDate         | Date      | entry date field                                                       |
| fundsCode         | string    | funds code field                                                       |
| bankReference     | string    | bank reference                                                         |
| extraDetails      | string    | extra details (supplementary details)                                  |
| structuredDetails | Object    | structured details if detected                                         |
| nonSwift          | string    | content of NS tags associated with a transaction (after tags 61 or 86) |


### Structured Transaction Details

The `transaction.structuredDetails` attribute can be used to access structured
data from statement transaction details (SWIFT "86" tag).  The following
structured detail formats are supported:
- `'<sep>DD'`, where `<sep>` can be `'>'` or `'?'` and `DD` is two digits
- `'/TAG/value'`, where `TAG` is 2 to 4 uppercase chars.

**Example**

```
>20some details >30more data
```

```json
{
  "20": "some details",
  "30": "more data"
}
```

**Example**

```
/ORDP/Smith Corp
```

```json
{
  "ORDP": "Smith Corp"
}
```


## History

See [Changelog](./CHANGELOG.md)


## Legal

Copyright © 2015 [Alexander Tsybulsky][] and Copyright © 2020 [Centrapay][].

This software is licensed under Apache-2.0 License. Please see [LICENSE](/LICENSE) for details.


## Credits

Forked from [a-fas/mt940][]. Originally inspired by [WoLpH/mt940][].



[MT940]: https://www2.swift.com/knowledgecentre/publications/us9m_20190719/2.0?topic=mt940.htm
[MT942]: https://www2.swift.com/knowledgecentre/publications/us9m_20190719/2.0?topic=mt942.htm
[Centrapay]: https://centrapay.com/
[Alexander Tsybulsky]: https://github.com/a-fas
[a-fas/mt940]: https://github.com/a-fas/mt940js
[WoLpH/mt940]: https://github.com/WoLpH/mt940
