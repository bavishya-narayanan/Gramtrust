import * as fs from 'node:fs';
import * as grpc from '@grpc/grpc-js';
import { connect, signers } from '@hyperledger/fabric-gateway';
export class LocalBlockchainGateway {
    async store(record) {
        console.log('[LocalBlockchainGateway] Mock store record:', record);
        return record.hash;
    }
    async verify(projectCode) {
        console.log('[LocalBlockchainGateway] Mock verify project:', projectCode);
        return { verified: true };
    }
}
export class FabricBlockchainGateway {
    gateway = null;
    client = null;
    async getGateway() {
        if (this.gateway)
            return this.gateway;
        const peerEndpoint = process.env.FABRIC_PEER_ENDPOINT;
        const mspId = process.env.FABRIC_MSP_ID;
        const certPath = process.env.FABRIC_CERT_PATH;
        const keyPath = process.env.FABRIC_KEY_PATH;
        const tlsCertPath = process.env.FABRIC_PEER_CERT_PATH;
        if (!peerEndpoint || !mspId || !certPath || !keyPath || !tlsCertPath) {
            throw new Error('Hyperledger Fabric configuration is incomplete in environment.');
        }
        const credentials = fs.readFileSync(certPath);
        const identity = { mspId, credentials };
        const privateKeyPem = fs.readFileSync(keyPath);
        const signer = signers.newPrivateKeySigner(privateKeyPem);
        const tlsRootCert = fs.readFileSync(tlsCertPath);
        const peerSign = grpc.credentials.createSsl(tlsRootCert);
        this.client = new grpc.Client(peerEndpoint, peerSign);
        this.gateway = connect({
            client: this.client,
            identity,
            signer,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });
        return this.gateway;
    }
    async store(record) {
        try {
            const gw = await this.getGateway();
            const channelName = process.env.FABRIC_CHANNEL || 'mychannel';
            const chaincodeName = process.env.FABRIC_CHAINCODE || 'ledger';
            const network = gw.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            if (record.action === 'CREATE' || record.action === 'IMPORT') {
                await contract.submitTransaction('CreateProject', record.projectId, record.projectCode, String(record.amount), record.status || 'Pending', record.hash);
            }
            else {
                await contract.submitTransaction('UpdateProject', record.projectCode, String(record.amount), record.status || 'Pending', record.hash);
            }
            return record.hash;
        }
        catch (error) {
            console.error('[FabricBlockchainGateway] Error storing to Fabric:', error);
            throw error;
        }
    }
    async verify(projectCode) {
        try {
            const gw = await this.getGateway();
            const channelName = process.env.FABRIC_CHANNEL || 'mychannel';
            const chaincodeName = process.env.FABRIC_CHAINCODE || 'ledger';
            const network = gw.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            const resultBytes = await contract.evaluateTransaction('GetProject', projectCode);
            const projectString = Buffer.from(resultBytes).toString('utf8');
            return JSON.parse(projectString);
        }
        catch (error) {
            console.error('[FabricBlockchainGateway] Error verifying project in Fabric:', error);
            throw error;
        }
    }
    close() {
        if (this.gateway)
            this.gateway.close();
        if (this.client)
            this.client.close();
    }
}
export class GramTrustGateway {
    activeGateway;
    constructor() {
        const isFabricConfigured = !!(process.env.FABRIC_PEER_ENDPOINT &&
            process.env.FABRIC_MSP_ID &&
            process.env.FABRIC_CERT_PATH &&
            process.env.FABRIC_KEY_PATH);
        if (isFabricConfigured) {
            console.log('[GramTrustGateway] Initializing Fabric Gateway');
            this.activeGateway = new FabricBlockchainGateway();
        }
        else {
            console.log('[GramTrustGateway] Fabric configuration missing; using local simulation gateway');
            this.activeGateway = new LocalBlockchainGateway();
        }
    }
    async store(record) {
        return this.activeGateway.store(record);
    }
    async verify(projectCode) {
        return this.activeGateway.verify(projectCode);
    }
}
export const gateway = new GramTrustGateway();
//# sourceMappingURL=ledger-gateway.js.map