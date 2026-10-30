// 置き場所（contracts/test-hooks.md、ADR 0001、ADR 0004）。
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ACCEPTANCE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BACKEND_DIR = path.resolve(ACCEPTANCE_DIR, '..', '..');
export const REPO_DIR = path.resolve(BACKEND_DIR, '..');
export const CONTRACTS_DIR = path.join(REPO_DIR, 'contracts');
export const SCHEMAS_DIR = path.join(CONTRACTS_DIR, 'schemas');
export const CONTRACT_FIXTURES_DIR = path.join(CONTRACTS_DIR, 'fixtures');
export const SEEDS_DIR = path.join(ACCEPTANCE_DIR, 'seeds');
// ビルドの出力（CLAUDE.md：backend/dist/。コミットしない）。
export const DIST_DIR = path.join(BACKEND_DIR, 'dist');
export const DIST_VERSION = '2026-11-30.1';
// 保存のキー（contracts/data.md の 1）と、seed を 1 回だけ入れるための印（contracts/test-hooks.md の W-7）。
export const STORAGE_KEY = 'kyounoitte:data';
export const SEEDED_MARK = 'test:seeded';
