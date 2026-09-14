import { prisma } from '@/config/prisma.js';
import {
  computeVersionChainHash,
  sha256Hash,
} from '@/hashing/canonical-hash.js';
import { fabricGateway } from './fabric.gateway.js';
import { projectRepository } from '@/repositories/project.repository.js';
import { blockchainRepository } from '@/repositories/blockchain.repository.js';
import { auditRepository } from '@/repositories/audit.repository.js';
import { tamperLogRepository } from '@/repositories/tamper-log.repository.js';
import { AppError } from '@/utils/app-error.js';

export interface BidIntegrityStatus {
  bidId: string;
  vendorName: string;
  currentVersion: number;
  trustedHash: string;
  computedHash: string;
  isValid: boolean;
  originalAmount: number;
  currentAmount: number;
  tamperLogId: string | null;
}

export interface IntegrityVerificationReport {
  tenderId: string;
  verified: boolean;
  isTampered: boolean;
  tamperedVendorName: string | null;
  tamperMessage: string | null;
  databaseIntegrity: boolean;
  versionChainValid: boolean;
  blockchainVerified: boolean;
  snapshotIntegrity: boolean;
  totalVersions: number;
  totalBids: number;
  tamperAlerts: BidIntegrityStatus[];
  versionDetails: Array<{
    versionNumber: number;
    expectedHash: string;
    computedHash: string;
    previousHash: string | null;
    isValid: boolean;
    changedBy: string;
    changedAt: Date;
    changeReason: string;
    blockchainStatus: 'VERIFIED_ON_CHAIN' | 'UNANCHORED' | 'MISMATCH';
  }>;
  bidDetails: BidIntegrityStatus[];
  snapshotDetails: {
    sourceName: string;
    sourceUrl: string;
    storedSha256: string;
    computedSha256: string;
    isValid: boolean;
  };
  blockchainSummary: {
    enabled: boolean;
    onChainEventsCount: number;
    ledgerHashMatch: boolean;
    message: string;
  };
  verifiedAt: string;
}

export const verifyService = {
  /**
   * Performs cryptographic audit and verification across Tender & Vendor records.
   * Automatically creates tamper logs (with deduplication) when bid hash mismatches are detected.
   */
  async verifyTender(tenderId: string): Promise<IntegrityVerificationReport> {
    const tender = await prisma.tender.findFirst({
      where: { OR: [{ id: tenderId }, { tenderId }] },
      include: {
        snapshot: true,
        versions: {
          orderBy: { versionNumber: 'asc' },
        },
        bids: {
          include: {
            versions: {
              orderBy: { versionNumber: 'asc' },
            },
          },
        },
        blockchainTransactions: {
          orderBy: { version: 'asc' },
        },
      },
    });

    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found`, 404);
    }

    // 1. Verify Raw Snapshot SHA-256
    const rawPayloadString = JSON.stringify(tender.snapshot.rawData);
    const computedSnapshotSha256 = sha256Hash(rawPayloadString);
    const snapshotIntegrity =
      computedSnapshotSha256.toLowerCase() === tender.snapshot.sha256.toLowerCase();

    // 2. Fetch on-chain transactions if Fabric is enabled
    let fabricHistory: any[] = [];
    if (fabricGateway.enabled) {
      try {
        fabricHistory = await fabricGateway.getTenderLedgerHistory(tender.tenderId);
      } catch (err) {
        console.warn('Fabric verification lookup notice:', err);
      }
    }

    // 3. Verify Tender Version Hash Chain
    let versionChainValid = true;
    let runningPrevHash: string | null = null;
    const versionDetails = [];

    for (const v of tender.versions) {
      const computedHash = computeVersionChainHash(v.data, runningPrevHash);
      const isVersionValid = computedHash.toLowerCase() === v.newHash.toLowerCase();

      if (!isVersionValid) {
        versionChainValid = false;
      }

      let blockchainStatus: 'VERIFIED_ON_CHAIN' | 'UNANCHORED' | 'MISMATCH' = 'UNANCHORED';
      const onChainRecord = fabricHistory.find(
        (f) => Number(f.version) === v.versionNumber && f.tenderId === tender.tenderId
      );

      if (onChainRecord) {
        if (onChainRecord.hash.toLowerCase() === v.newHash.toLowerCase()) {
          blockchainStatus = 'VERIFIED_ON_CHAIN';
        } else {
          blockchainStatus = 'MISMATCH';
        }
      } else {
        const localTx = tender.blockchainTransactions.find(
          (t) => t.version === v.versionNumber && t.hash.toLowerCase() === v.newHash.toLowerCase()
        );
        if (localTx && localTx.status === 'COMMITTED') {
          blockchainStatus = 'VERIFIED_ON_CHAIN';
        }
      }

      versionDetails.push({
        versionNumber: v.versionNumber,
        expectedHash: v.newHash,
        computedHash,
        previousHash: runningPrevHash,
        isValid: isVersionValid,
        changedBy: v.changedBy,
        changedAt: v.changedAt,
        changeReason: v.changeReason,
        blockchainStatus,
      });

      runningPrevHash = v.newHash;
    }

    // 4. Verify Bids using canonical bid hash
    // The trusted hash is Bid.currentHash (set at import/version creation time).
    // The computed hash re-derives the canonical payload from LIVE DB values.
    // A mismatch means the bid was modified directly in the DB.
    const bidDetails: BidIntegrityStatus[] = [];
    const tamperAlerts: BidIntegrityStatus[] = [];

    for (const bid of tender.bids) {
      // The authentic sealed baseline comes from the initial submission (first BidVersion)
      const firstVersion = bid.versions[0];
      const originalAmount = firstVersion
        ? Number(firstVersion.bidAmount)
        : Number(bid.bidAmount);

      const currentAmount = Number(bid.bidAmount);
      const originalTrustedHash = firstVersion ? firstVersion.newHash : bid.currentHash;
      const trustedHash = originalTrustedHash;

      // Re-derive live hash from original baseline format
      const baseData = firstVersion ? (firstVersion.data as Record<string, unknown>) : null;
      const liveData = baseData ? { ...baseData, bidAmount: currentAmount } : { bidAmount: currentAmount };
      const computedHash = firstVersion
        ? computeVersionChainHash(liveData, firstVersion.previousHash)
        : bid.currentHash;

      // In immutable procurement, sealed bids must never be altered after submission.
      // A bid is valid ONLY if live DB amount strictly equals original sealed amount with unbroken hash and no extra versions.
      const isAmountUnchanged = originalAmount === currentAmount && bid.versions.length <= 1;
      const isHashMatching = computedHash.toLowerCase() === trustedHash.toLowerCase();
      const isValid = isAmountUnchanged && isHashMatching;

      let tamperLogId: string | null = null;

      if (!isValid) {
        // Auto-create tamper log with deduplication
        const existing = await tamperLogRepository.findExistingMismatch(bid.id, trustedHash);
        if (!existing) {
          const log = await tamperLogRepository.create({
            recordId: bid.id,
            bidId: bid.id,
            tenderId: tender.tenderId,
            vendorName: bid.vendorName,
            vendorId: bid.vendorId ?? null,
            userId: null,
            userName: 'System / Integrity Verification',
            userRole: 'SYSTEM',
            fieldName: 'bid_amount',
            oldValue: String(originalAmount),
            newValue: String(currentAmount),
            trustedHash,
            currentHash: computedHash,
            originalAmount: String(originalAmount),
            currentAmount: String(currentAmount),
            changeType: 'HASH_MISMATCH',
            status: 'TAMPERED',
          });
          tamperLogId = log.id;

          // Mark tender as Tampered in DB
          await prisma.tender.update({
            where: { id: tender.id },
            data: { blockchainStatus: 'Tampered' },
          }).catch(() => {});

          // Also record as TenderAuditEvent for audit timeline
          try {
            await prisma.tenderAuditEvent.create({
              data: {
                tenderId: tender.id,
                eventType: 'TAMPERING_DETECTED',
                actor: 'SYSTEM/INTEGRITY_CHECK',
                actorRole: 'SYSTEM',
                details: {
                  bidId: bid.id,
                  vendorName: bid.vendorName,
                  trustedHash,
                  computedHash,
                  originalAmount,
                  currentAmount,
                  reason: 'Direct database modification detected — bid hash mismatch',
                },
                hash: computedHash,
              },
            });
          } catch {
            // non-fatal
          }
        } else {
          tamperLogId = existing.id;
        }
      }

      const entry: BidIntegrityStatus = {
        bidId: bid.id,
        vendorName: bid.vendorName,
        currentVersion: bid.currentVersionNumber,
        trustedHash,
        computedHash,
        isValid,
        originalAmount,
        currentAmount,
        tamperLogId,
      };

      bidDetails.push(entry);
      if (!isValid) tamperAlerts.push(entry);
    }

    const bidsIntegrity = bidDetails.every((b) => b.isValid);
    const databaseIntegrity = snapshotIntegrity && versionChainValid && bidsIntegrity;
    const blockchainVerified =
      versionDetails.length > 0 &&
      versionDetails.every(
        (v) => v.blockchainStatus === 'VERIFIED_ON_CHAIN' || !fabricGateway.enabled
      );

    const overallVerified = databaseIntegrity && versionChainValid;
    const isTampered = tamperAlerts.length > 0;
    const tamperedVendorName = isTampered
      ? Array.from(new Set(tamperAlerts.map((a) => a.vendorName))).join(', ')
      : null;
    const tamperMessage = isTampered
      ? `Tender ${tender.tenderId} was tampered with through vendor ${tamperedVendorName}. The bid associated with this vendor has been detected as tampered.`
      : null;

    return {
      tenderId: tender.tenderId,
      verified: overallVerified && !isTampered,
      isTampered,
      tamperedVendorName,
      tamperMessage,
      databaseIntegrity,
      versionChainValid,
      blockchainVerified,
      snapshotIntegrity,
      totalVersions: tender.versions.length,
      totalBids: tender.bids.length,
      tamperAlerts,
      versionDetails,
      bidDetails,
      snapshotDetails: {
        sourceName: tender.snapshot.sourceName,
        sourceUrl: tender.snapshot.sourceUrl,
        storedSha256: tender.snapshot.sha256,
        computedSha256: computedSnapshotSha256,
        isValid: snapshotIntegrity,
      },
      blockchainSummary: {
        enabled: fabricGateway.enabled,
        onChainEventsCount: fabricHistory.length || tender.blockchainTransactions.length,
        ledgerHashMatch: blockchainVerified,
        message: fabricGateway.enabled
          ? (blockchainVerified
              ? 'All version hashes verified against Hyperledger Fabric ledger'
              : 'Ledger hash mismatch or missing blocks detected')
          : 'Hyperledger Fabric network offline — verified against local cryptographic SHA-256 chain',
      },
      verifiedAt: new Date().toISOString(),
    };
  },

  /**
   * Legacy Fund Project Verification
   */
  async verifyProject(code: string) {
    const project = await projectRepository.findByCode(code);
    if (!project) throw new AppError(`Project ${code} not found`, 404);

    const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
    const blockchainAmount = latestRecord ? latestRecord.amount : 0;
    const difference = project.amount - blockchainAmount;
    const status = difference === 0 ? 'Verified' : 'Mismatch';

    await auditRepository.create({
      projectId: project.id,
      databaseAmount: project.amount,
      blockchainAmount,
      difference,
      status,
      notes: { action: 'BLOCKCHAIN_VERIFY' },
    });

    return { ...project, blockchainAmount, difference, integrityStatus: status };
  },

  async verifyAll() {
    const projects = await projectRepository.findAll();
    const results = [];
    for (const p of projects) {
      const latestRecord = await blockchainRepository.findLatestByProjectId(p.id);
      const blockchainAmount = latestRecord ? latestRecord.amount : 0;
      const difference = p.amount - blockchainAmount;
      const status = difference === 0 ? 'Verified' : 'Mismatch';
      results.push({ ...p, blockchainAmount, difference, integrityStatus: status });
    }
    return results;
  },

  async report() {
    const audits = await auditRepository.findRecent(50);
    const projects = await projectRepository.findAll();
    return {
      audits,
      totalProjects: projects.length,
      verifiedCount: projects.filter((p) => p.integrityStatus === 'Verified').length,
    };
  },
};
