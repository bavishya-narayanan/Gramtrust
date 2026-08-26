export interface BlockchainGatewayRecord {
    projectId: string;
    projectCode: string;
    action: string;
    amount: number;
    hash: string;
    status: string;
}
export interface BlockchainGateway {
    store(record: BlockchainGatewayRecord): Promise<string>;
    verify(projectCode: string): Promise<any>;
}
export declare class LocalBlockchainGateway implements BlockchainGateway {
    store(record: BlockchainGatewayRecord): Promise<string>;
    verify(projectCode: string): Promise<any>;
}
export declare class FabricBlockchainGateway implements BlockchainGateway {
    private gateway;
    private client;
    private getGateway;
    store(record: BlockchainGatewayRecord): Promise<string>;
    verify(projectCode: string): Promise<any>;
    close(): void;
}
export declare class GramTrustGateway implements BlockchainGateway {
    private activeGateway;
    constructor();
    store(record: BlockchainGatewayRecord): Promise<string>;
    verify(projectCode: string): Promise<any>;
}
export declare const gateway: GramTrustGateway;
