import { api } from './api';

export interface SettlementRequest {
  dealId: string;
  seller: string;
  buyer: string;
  tokenId: string;
  amount: number;
  assetName?: string;
}

export interface ComplianceCheckRequest {
  seller: string;
  buyer: string;
  tokenId: string;
  amount: number;
}

export async function submitSettlement(request: SettlementRequest) {
  return api.post('/settlement', request);
}

export async function checkCompliance(request: ComplianceCheckRequest) {
  return api.post('/compliance', request);
}

export async function getTransactionStatus(transactionId: string) {
  return api.get(`/settlement/${transactionId}`);
}

export async function listTransactions() {
  return api.get('/settlement');
}
