import { Contract } from 'fabric-contract-api';
import type { Context } from 'fabric-contract-api';

export interface LedgerChaincodeTransaction {
  projectCode: string;
  action: 'IMPORT' | 'STORE' | 'VERIFY' | 'UPDATE' | 'CREATE';
  amount: number;
  hash: string;
  timestamp: string;
  txId: string;
  createdBy: string;
}

export class LedgerContract extends Contract {
  async CreateRecord(
    ctx: Context,
    projectCode: string,
    action: LedgerChaincodeTransaction['action'],
    amount: string,
    hash: string,
    timestamp: string,
  ): Promise<string> {
    if (!projectCode || !action || !amount || !hash || !timestamp) {
      throw new Error('projectCode, action, amount, hash, and timestamp are required');
    }

    const txId = ctx.stub.getTxID();
    const record: LedgerChaincodeTransaction = {
      projectCode,
      action,
      amount: Number(amount),
      hash,
      timestamp,
      txId,
      createdBy: ctx.clientIdentity.getID(),
    };
    const key = ctx.stub.createCompositeKey('record', [projectCode, txId]);

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
    return JSON.stringify(record);
  }

  async ReadRecord(ctx: Context, projectCode: string, txId: string): Promise<string> {
    const key = ctx.stub.createCompositeKey('record', [projectCode, txId]);
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Record ${projectCode}/${txId} does not exist`);
    }
    return data.toString();
  }

  async GetProjectHistory(ctx: Context, projectCode: string): Promise<string> {
    const iterator = await ctx.stub.getStateByPartialCompositeKey('record', [projectCode]);
    const records: LedgerChaincodeTransaction[] = [];

    try {
      let result = await iterator.next();
      while (!result.done) {
        if (result.value?.value) {
          records.push(JSON.parse(result.value.value.toString()) as LedgerChaincodeTransaction);
        }
        result = await iterator.next();
      }
    } finally {
      await iterator.close();
    }

    return JSON.stringify(records);
  }
}

export function buildLedgerTransaction(transaction: LedgerChaincodeTransaction) {
  return { ...transaction, immutable: true };
}

export const contracts = [LedgerContract];
