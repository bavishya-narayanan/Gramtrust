import { readFile } from 'node:fs/promises';
import { createPrivateKey } from 'node:crypto';
import { connect, signers, type Contract, type Gateway } from '@hyperledger/fabric-gateway';
import * as grpc from '@grpc/grpc-js';
import { env } from '@/config/env.js';

export interface FabricRecord {
  projectCode: string;
  action: string;
  amount: number;
  hash: string;
  timestamp: string;
}

export interface FabricProcurementRecord {
  tenderId: string;
  eventType: string;
  recordId: string;
  version: number;
  hash: string;
  actor: string;
  timestamp: string;
  txId?: string;
  metadata?: Record<string, unknown>;
}

class FabricBlockchainGateway {
  private gateway: Gateway | undefined;
  private client: grpc.Client | undefined;
  private contract: Contract | undefined;

  get enabled(): boolean {
    return env.FABRIC_ENABLED;
  }

  private async getContract(): Promise<Contract> {
    if (this.contract) return this.contract;

    const tlsPath = env.FABRIC_TLS_CERT_PATH;
    const certificatePath = env.FABRIC_CERT_PATH;
    const keyPath = env.FABRIC_KEY_PATH;
    if (!tlsPath || !certificatePath || !keyPath) {
      throw new Error(
        'FABRIC_TLS_CERT_PATH, FABRIC_CERT_PATH, and FABRIC_KEY_PATH are required when Fabric is enabled'
      );
    }

    const [tlsCertificate, certificate, privateKey] = await Promise.all([
      readFile(tlsPath),
      readFile(certificatePath),
      readFile(keyPath),
    ]);
    const client = new grpc.Client(
      env.FABRIC_PEER_ENDPOINT,
      grpc.credentials.createSsl(tlsCertificate),
      { 'grpc.ssl_target_name_override': env.FABRIC_PEER_HOST_ALIAS }
    );
    const identity = { mspId: env.FABRIC_MSP_ID, credentials: certificate };
    const signer = signers.newPrivateKeySigner(createPrivateKey(privateKey));

    this.client = client;
    this.gateway = connect({ identity, signer, client });
    this.contract = this.gateway.getNetwork(env.FABRIC_CHANNEL).getContract(env.FABRIC_CHAINCODE);
    return this.contract;
  }

  async store(record: FabricRecord): Promise<{ txId: string; record: FabricRecord }> {
    const contract = await this.getContract();
    const result = await contract.submitTransaction(
      'CreateRecord',
      record.projectCode,
      record.action,
      String(record.amount),
      record.hash,
      record.timestamp
    );
    const committedRecord = JSON.parse(new TextDecoder().decode(result)) as FabricRecord & {
      txId: string;
    };
    return { txId: committedRecord.txId, record };
  }

  async history(projectCode: string): Promise<FabricRecord[]> {
    const contract = await this.getContract();
    const result = await contract.evaluateTransaction('GetProjectHistory', projectCode);
    return JSON.parse(new TextDecoder().decode(result)) as FabricRecord[];
  }

  /**
   * Anchor procurement / tender event to Hyperledger Fabric
   */
  async anchorProcurementEvent(
    event: FabricProcurementRecord
  ): Promise<{ txId: string; status: string }> {
    if (!this.enabled) {
      // Return unanchored status; do NOT fake successful blockchain anchoring
      return {
        txId: `OFFLINE-PROOF-${event.tenderId}-${event.version}-${Date.now().toString(16)}`,
        status: 'UNAVAILABLE_OFFLINE',
      };
    }

    try {
      const contract = await this.getContract();
      const result = await contract.submitTransaction(
        'AnchorProcurementEvent',
        event.tenderId,
        event.eventType,
        event.recordId,
        String(event.version),
        event.hash,
        event.actor,
        event.timestamp,
        JSON.stringify(event.metadata || {})
      );
      const committed = JSON.parse(new TextDecoder().decode(result));
      return { txId: committed.txId, status: 'COMMITTED' };
    } catch (err) {
      console.error('Fabric anchorProcurementEvent error:', err);
      throw err;
    }
  }

  async getTenderLedgerHistory(tenderId: string): Promise<FabricProcurementRecord[]> {
    if (!this.enabled) {
      return [];
    }
    try {
      const contract = await this.getContract();
      const result = await contract.evaluateTransaction('GetTenderHistory', tenderId);
      return JSON.parse(new TextDecoder().decode(result)) as FabricProcurementRecord[];
    } catch (err) {
      console.error('Fabric getTenderLedgerHistory error:', err);
      return [];
    }
  }

  close(): void {
    this.gateway?.close();
    this.client?.close();
    this.gateway = undefined;
    this.client = undefined;
    this.contract = undefined;
  }
}

export const fabricGateway = new FabricBlockchainGateway();
