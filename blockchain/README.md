# Hyperledger Fabric Layer

This folder contains the real Fabric chaincode used by GramTrust. The backend submits records through `@hyperledger/fabric-gateway` when `FABRIC_ENABLED=true`; PostgreSQL remains a queryable projection and local fallback when Fabric is disabled.

## Start a local Fabric network

The supported local network is the official Fabric test network because it supplies the peer, orderer, CA, TLS certificates, channel, and chaincode lifecycle tooling.

From PowerShell, install Docker Desktop and Git, then clone `fabric-samples` beside this repository:

```powershell
cd ..
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

Use Git Bash or WSL for the Fabric shell scripts. From `fabric-samples/test-network`:

```bash
./network.sh down
./network.sh up createChannel -ca -c gramtrust-channel
./network.sh deployCC -ccn gramtrust -ccp "$PWD/../../gramtrust/blockchain/chaincode" -ccl typescript
```

The chaincode entrypoint is `chaincode/index.ts`, which exports `LedgerContract`. Its transactions are:

- `CreateRecord` submits an append-only record using a `record` composite key.
- `ReadRecord` reads one record by project code and Fabric transaction ID.
- `GetProjectHistory` queries all records for a project.

## Configure the backend

Copy the Fabric user certificate, private key, and Org1 peer TLS CA certificate from the test network into local identity files, then set these values in `backend/.env`:

```dotenv
FABRIC_ENABLED=true
FABRIC_CHANNEL=gramtrust-channel
FABRIC_CHAINCODE=gramtrust
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.org1.example.com
FABRIC_TLS_CERT_PATH=../blockchain/identities/peer0/tls/ca.crt
FABRIC_CERT_PATH=../blockchain/identities/user/cert.pem
FABRIC_KEY_PATH=../blockchain/identities/user/key.pem
```

The certificate paths are intentionally configurable because Fabric sample layouts differ by Fabric version and organization. Do not commit private keys or certificates.

Then run:

```powershell
cd backend
npm run build
npm run dev
```

With Fabric disabled or the three identity paths unset, the backend uses its existing PostgreSQL hash projection. With Fabric enabled, create, import, update, and store operations submit `CreateRecord` to the Fabric ledger and retain the returned Fabric transaction ID in the PostgreSQL payload projection.
