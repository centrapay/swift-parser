import BigNumber from "bignumber.js";

export interface Transaction {
  date: Date;
  amount: BigNumber;
  isReversal: boolean;
  currency: string;
  detailSegments: string[];
  details: string;
  structuredDetails: Record<string, string>;
  transactionType: string;
  reference: string;
  entryDate: Date;
  fundsCode: string;
  bankReference: string;
  extraDetails: string;
  nonSwift: string;
}

export interface StatementNumber {
  statement: string;
  sequence: string;
  section: string;
}

export interface Statement {
  transactionReference: string;
  relatedReference: string;
  accountIdentification: string;
  number: StatementNumber;
  statementDate: Date;
  openingBalanceDate: Date;
  closingBalanceDate: Date;
  closingAvailableBalanceDate: Date;
  forwardAvailableBalanceDate: Date;
  currency: string;
  openingBalance: BigNumber;
  closingBalance: BigNumber;
  closingAvailableBalance: BigNumber;
  forwardAvailableBalance: BigNumber;
  informationToAccountOwner: string;
  messageBlocks: Record<string, unknown>;
  transactions: Transaction[];
}

export interface ParseOptions {
  data: string;
  type: "mt940" | "mt942";
  validate?: boolean;
}

export function parse(opts: ParseOptions): Statement[];
