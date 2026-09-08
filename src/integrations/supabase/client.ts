import type { Session, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/rework";

const DB_KEY = "rework-system.local-db.v1";
const SESSION_KEY = "rework-system.local-session.v1";

type UserMetadata = {
  full_name?: string;
  department?: string;
  [key: string]: unknown;
};

type StoredUser = {
  id: string;
  email: string;
  password?: string;
  password_hash?: string;
  password_salt?: string;
  created_at: string;
  updated_at: string;
  user_metadata: UserMetadata;
};

type StoredSession = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

type LocalRow = Record<string, unknown>;

type LocalState = {
  users: StoredUser[];
  tables: Record<string, LocalRow[]>;
};

type LocalQueryResult<TData> = {
  data: TData;
  error: Error | null;
  count: number | null;
};

type AuthResult = {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
};

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";
type AuthListener = (event: AuthEvent, session: Session | null) => void;

type Filter =
  | { type: "eq"; column: string; value: unknown }
  | { type: "is"; column: string; value: unknown }
  | { type: "in"; column: string; values: readonly unknown[] };

type OrderSpec = {
  column: string;
  ascending: boolean;
};

const DEFAULT_TABLES: Record<string, LocalRow[]> = {
  profiles: [],
  user_roles: [],
  rework_jobs: [],
  notifications: [],
  job_history: [],
};

const SEED_USERS: StoredUser[] = [
  {
    id: "demo-admin",
    email: "admin@local.test",
    password: "password",
    created_at: "2026-09-01T02:00:00.000Z",
    updated_at: "2026-09-01T02:00:00.000Z",
    user_metadata: { full_name: "สมชาย ผู้ดูแลระบบ", department: "ฝ่ายผลิต" },
  },
  {
    id: "demo-qc",
    email: "qc@local.test",
    password: "password",
    created_at: "2026-09-01T02:05:00.000Z",
    updated_at: "2026-09-01T02:05:00.000Z",
    user_metadata: { full_name: "กมลวรรณ QC", department: "QC/QA" },
  },
  {
    id: "demo-operator",
    email: "operator@local.test",
    password: "password",
    created_at: "2026-09-01T02:10:00.000Z",
    updated_at: "2026-09-01T02:10:00.000Z",
    user_metadata: { full_name: "อนันต์ ฝ่ายผลิต", department: "ฝ่ายผลิต" },
  },
];

const SEED_TABLES: Record<string, LocalRow[]> = {
  profiles: [
    {
      id: "demo-admin",
      full_name: "สมชาย ผู้ดูแลระบบ",
      employee_code: "ADM-001",
      department: "ฝ่ายผลิต",
      email: "admin@local.test",
      created_at: "2026-09-01T02:00:00.000Z",
      updated_at: "2026-09-01T02:00:00.000Z",
    },
    {
      id: "demo-qc",
      full_name: "กมลวรรณ QC",
      employee_code: "QC-014",
      department: "QC/QA",
      email: "qc@local.test",
      created_at: "2026-09-01T02:05:00.000Z",
      updated_at: "2026-09-01T02:05:00.000Z",
    },
    {
      id: "demo-operator",
      full_name: "อนันต์ ฝ่ายผลิต",
      employee_code: "OP-027",
      department: "ฝ่ายผลิต",
      email: "operator@local.test",
      created_at: "2026-09-01T02:10:00.000Z",
      updated_at: "2026-09-01T02:10:00.000Z",
    },
  ],
  user_roles: [
    {
      id: "role-admin",
      user_id: "demo-admin",
      role: "admin",
      created_at: "2026-09-01T02:00:00.000Z",
    },
    { id: "role-qc", user_id: "demo-qc", role: "qc", created_at: "2026-09-01T02:05:00.000Z" },
    {
      id: "role-operator",
      user_id: "demo-operator",
      role: "operator",
      created_at: "2026-09-01T02:10:00.000Z",
    },
  ],
  rework_jobs: [
    {
      id: "job-001",
      job_no: "RWK-20260908-0001",
      reported_at: "2026-09-08T01:15:00.000Z",
      created_by: "demo-operator",
      department: "ฝ่ายผลิต",
      line_id: "LINE-01",
      line_name: "Line 1 - Assembly",
      product_code: "PRD-1001",
      product_name: "ฝาขวด PET 28mm",
      lot_no: "LOT-260908-A",
      work_order_no: "WO-20260908-01",
      defect_qty: 1200,
      unit: "PCS",
      defect_type: "ฉลากติดเบี้ยว",
      problem_detail: "พบฉลากเอียงเกิน spec ระหว่างตรวจท้ายไลน์",
      root_cause: "ตั้ง guide rail ไม่ตรงตำแหน่ง",
      priority: "urgent",
      due_date: "2026-09-08",
      assigned_to: "demo-admin",
      assigned_by: "demo-admin",
      assigned_at: "2026-09-08T01:45:00.000Z",
      status: "in_progress",
      started_at: "2026-09-08T02:00:00.000Z",
      rework_method: "คัดแยกและติดฉลากใหม่",
      rework_qty: null,
      pass_qty: null,
      fail_qty: null,
      time_spent_minutes: null,
      result_note: null,
      result_by: null,
      result_at: null,
      qc_result: null,
      qc_reason: null,
      qc_by: null,
      qc_at: null,
      closed_at: null,
      created_at: "2026-09-08T01:15:00.000Z",
      updated_at: "2026-09-08T02:00:00.000Z",
    },
    {
      id: "job-002",
      job_no: "RWK-20260907-0004",
      reported_at: "2026-09-07T04:30:00.000Z",
      created_by: "demo-admin",
      department: "ฝ่ายผลิต",
      line_id: "LINE-02",
      line_name: "Line 2 - Packing",
      product_code: "PRD-1003",
      product_name: "กล่องกระดาษลูกฟูก B",
      lot_no: "LOT-260907-C",
      work_order_no: "WO-20260907-03",
      defect_qty: 86,
      unit: "BOX",
      defect_type: "บรรจุไม่ครบ",
      problem_detail: "สุ่มตรวจพบจำนวนสินค้าในกล่องไม่ครบ 3 กล่องต่อ pallet",
      root_cause: "counter sensor อ่านค่าพลาดช่วงเปลี่ยนกะ",
      priority: "high",
      due_date: "2026-09-08",
      assigned_to: "demo-operator",
      assigned_by: "demo-admin",
      assigned_at: "2026-09-07T05:00:00.000Z",
      status: "pending_qc",
      started_at: "2026-09-07T05:20:00.000Z",
      rework_method: "เปิดกล่องนับใหม่และซีลซ้ำ",
      rework_qty: 86,
      pass_qty: 82,
      fail_qty: 4,
      time_spent_minutes: 140,
      result_note: "แก้ไขครบ รอ QC ตรวจยืนยัน",
      result_by: "demo-operator",
      result_at: "2026-09-07T08:15:00.000Z",
      qc_result: null,
      qc_reason: null,
      qc_by: null,
      qc_at: null,
      closed_at: null,
      created_at: "2026-09-07T04:30:00.000Z",
      updated_at: "2026-09-07T08:15:00.000Z",
    },
    {
      id: "job-003",
      job_no: "RWK-20260906-0002",
      reported_at: "2026-09-06T03:10:00.000Z",
      created_by: "demo-operator",
      department: "ฝ่ายผลิต",
      line_id: "LINE-03",
      line_name: "Line 3 - Molding",
      product_code: "PRD-1002",
      product_name: "ขวด PET 600ml",
      lot_no: "LOT-260906-B",
      work_order_no: "WO-20260906-02",
      defect_qty: 450,
      unit: "PCS",
      defect_type: "รอยขีดข่วน",
      problem_detail: "พบผิวขวดมีรอยบริเวณคอขวดหลายชิ้น",
      root_cause: "แม่พิมพ์มีคราบสะสม",
      priority: "normal",
      due_date: "2026-09-07",
      assigned_to: "demo-qc",
      assigned_by: "demo-admin",
      assigned_at: "2026-09-06T03:40:00.000Z",
      status: "closed",
      started_at: "2026-09-06T04:00:00.000Z",
      rework_method: "คัดแยกและเปลี่ยนบรรจุภัณฑ์",
      rework_qty: 450,
      pass_qty: 430,
      fail_qty: 20,
      time_spent_minutes: 210,
      result_note: "คัดแยกเสร็จ ส่งดีคืนคลัง",
      result_by: "demo-operator",
      result_at: "2026-09-06T08:15:00.000Z",
      qc_result: "pass",
      qc_reason: "สุ่มตรวจผ่านตาม AQL",
      qc_by: "demo-qc",
      qc_at: "2026-09-06T09:00:00.000Z",
      closed_at: "2026-09-06T09:10:00.000Z",
      created_at: "2026-09-06T03:10:00.000Z",
      updated_at: "2026-09-06T09:10:00.000Z",
    },
    {
      id: "job-004",
      job_no: "RWK-20260905-0003",
      reported_at: "2026-09-05T06:20:00.000Z",
      created_by: "demo-admin",
      department: "ฝ่ายผลิต",
      line_id: "LINE-01",
      line_name: "Line 1 - Assembly",
      product_code: "PRD-1001",
      product_name: "ฝาขวด PET 28mm",
      lot_no: "LOT-260905-D",
      work_order_no: "WO-20260905-04",
      defect_qty: 300,
      unit: "PCS",
      defect_type: "สีเพี้ยน",
      problem_detail: "สีชิ้นงานเข้มกว่ามาตรฐานหลังปรับ batch สี",
      root_cause: "อัตราส่วน masterbatch สูงเกินไป",
      priority: "high",
      due_date: "2026-09-06",
      assigned_to: "demo-operator",
      assigned_by: "demo-admin",
      assigned_at: "2026-09-05T06:40:00.000Z",
      status: "rework_required",
      started_at: "2026-09-05T07:00:00.000Z",
      rework_method: "คัดแยกสีและส่งผลิตซ้ำเฉพาะ lot ที่ไม่ผ่าน",
      rework_qty: 300,
      pass_qty: 180,
      fail_qty: 120,
      time_spent_minutes: 95,
      result_note: "QC reject ส่วนที่ยังสีเพี้ยน",
      result_by: "demo-operator",
      result_at: "2026-09-05T08:45:00.000Z",
      qc_result: "fail",
      qc_reason: "ยังพบสีเกิน tolerance 120 ชิ้น",
      qc_by: "demo-qc",
      qc_at: "2026-09-05T09:20:00.000Z",
      closed_at: null,
      created_at: "2026-09-05T06:20:00.000Z",
      updated_at: "2026-09-05T09:20:00.000Z",
    },
    {
      id: "job-005",
      job_no: "RWK-20260904-0001",
      reported_at: "2026-09-04T02:45:00.000Z",
      created_by: "demo-operator",
      department: "ฝ่ายผลิต",
      line_id: "LINE-02",
      line_name: "Line 2 - Packing",
      product_code: "PRD-1002",
      product_name: "ขวด PET 600ml",
      lot_no: "LOT-260904-A",
      work_order_no: "WO-20260904-01",
      defect_qty: 650,
      unit: "PCS",
      defect_type: "ปิดผนึกไม่สนิท",
      problem_detail: "ฝาปิดไม่แน่น มี leak test fail",
      root_cause: "แรงบิดเครื่องปิดฝาต่ำ",
      priority: "normal",
      due_date: "2026-09-05",
      assigned_to: "demo-admin",
      assigned_by: "demo-admin",
      assigned_at: "2026-09-04T03:00:00.000Z",
      status: "closed",
      started_at: "2026-09-04T03:20:00.000Z",
      rework_method: "ปรับ torque และปิดฝาซ้ำ",
      rework_qty: 650,
      pass_qty: 640,
      fail_qty: 10,
      time_spent_minutes: 180,
      result_note: "ผ่าน leak test หลัง rework",
      result_by: "demo-admin",
      result_at: "2026-09-04T06:30:00.000Z",
      qc_result: "pass",
      qc_reason: "ผ่านทุกตัวอย่างสุ่ม",
      qc_by: "demo-qc",
      qc_at: "2026-09-04T07:00:00.000Z",
      closed_at: "2026-09-04T07:10:00.000Z",
      created_at: "2026-09-04T02:45:00.000Z",
      updated_at: "2026-09-04T07:10:00.000Z",
    },
  ],
  notifications: [
    {
      id: "note-001",
      user_id: "demo-admin",
      job_id: "job-001",
      title: "มีงาน Rework ใหม่",
      message: "งาน RWK-20260908-0001 ต้องดำเนินการด่วน",
      read_at: null,
      created_at: "2026-09-08T01:20:00.000Z",
    },
    {
      id: "note-002",
      user_id: "demo-qc",
      job_id: "job-002",
      title: "งาน Rework รอตรวจสอบ",
      message: "งาน RWK-20260907-0004 ดำเนินการเสร็จแล้ว รอ QC/QA ตรวจสอบ",
      read_at: null,
      created_at: "2026-09-07T08:15:00.000Z",
    },
  ],
  job_history: [
    {
      id: "history-001",
      job_id: "job-001",
      action: "created",
      detail: "สร้างงานตัวอย่าง",
      from_status: null,
      to_status: "new",
      actor_id: "demo-operator",
      created_at: "2026-09-08T01:15:00.000Z",
    },
  ],
};

const authListeners = new Set<AuthListener>();
let memoryState = createInitialState();
let memorySession: StoredSession | null = null;

function createInitialState(): LocalState {
  return {
    users: [...SEED_USERS],
    tables: Object.fromEntries(
      Object.entries({ ...DEFAULT_TABLES, ...SEED_TABLES }).map(([name, rows]) => [
        name,
        rows.map((row) => ({ ...row })),
      ]),
    ),
  };
}

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRows(value: unknown): LocalRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => ({ ...row }));
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!isRecord(value)) return false;
  const hasHashedPassword =
    typeof value["password_hash"] === "string" && typeof value["password_salt"] === "string";
  const hasLegacyPassword = typeof value["password"] === "string";
  return (
    typeof value["id"] === "string" &&
    typeof value["email"] === "string" &&
    (hasHashedPassword || hasLegacyPassword) &&
    typeof value["created_at"] === "string" &&
    typeof value["updated_at"] === "string" &&
    isRecord(value["user_metadata"])
  );
}

function normalizeTables(value: unknown): Record<string, LocalRow[]> {
  const tables: Record<string, LocalRow[]> = { ...DEFAULT_TABLES };
  if (!isRecord(value)) return tables;
  for (const [name, rows] of Object.entries(value)) {
    tables[name] = toRows(rows);
  }
  return tables;
}

function normalizeState(value: unknown): LocalState {
  if (!isRecord(value)) return createInitialState();
  return ensureSeedData({
    users: Array.isArray(value["users"]) ? value["users"].filter(isStoredUser) : [],
    tables: normalizeTables(value["tables"]),
  });
}

function ensureSeedData(state: LocalState): LocalState {
  const hasUsers = state.users.length > 0;
  const hasJobs = (state.tables["rework_jobs"] ?? []).length > 0;
  if (hasUsers && hasJobs) return state;
  const seedTable = (name: string) => (SEED_TABLES[name] ?? []).map((row) => ({ ...row }));

  return {
    users: hasUsers ? state.users : [...SEED_USERS],
    tables: {
      ...state.tables,
      profiles: hasUsers ? (state.tables["profiles"] ?? []) : seedTable("profiles"),
      user_roles: hasUsers ? (state.tables["user_roles"] ?? []) : seedTable("user_roles"),
      rework_jobs: hasJobs ? (state.tables["rework_jobs"] ?? []) : seedTable("rework_jobs"),
      notifications: (state.tables["notifications"] ?? []).length
        ? (state.tables["notifications"] ?? [])
        : seedTable("notifications"),
      job_history: (state.tables["job_history"] ?? []).length
        ? (state.tables["job_history"] ?? [])
        : seedTable("job_history"),
    },
  };
}

function readState(): LocalState {
  if (!hasLocalStorage()) return memoryState;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return createInitialState();
    const state = normalizeState(JSON.parse(raw));
    saveState(state);
    return state;
  } catch (error) {
    console.warn("Cannot read local rework data", error);
    return createInitialState();
  }
}

function saveState(state: LocalState) {
  memoryState = state;
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(state));
}

function readStoredSession(): StoredSession | null {
  if (!hasLocalStorage()) return memorySession;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (
      typeof parsed["userId"] !== "string" ||
      typeof parsed["accessToken"] !== "string" ||
      typeof parsed["refreshToken"] !== "string"
    ) {
      return null;
    }
    return {
      userId: parsed["userId"],
      accessToken: parsed["accessToken"],
      refreshToken: parsed["refreshToken"],
    };
  } catch (error) {
    console.warn("Cannot read local auth session", error);
    return null;
  }
}

function saveStoredSession(session: StoredSession | null) {
  memorySession = session;
  if (!hasLocalStorage()) return;
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function createId(prefix = "local") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string, salt: string) {
  const payload = `${salt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  let hash = 0;
  for (let index = 0; index < payload.length; index += 1) {
    hash = Math.imul(31, hash) + payload.charCodeAt(index);
  }
  return `fallback-${hash >>> 0}`;
}

async function passwordMatches(account: StoredUser, password: string) {
  if (account.password_hash && account.password_salt) {
    return (await hashPassword(password, account.password_salt)) === account.password_hash;
  }
  return account.password === password;
}

function normalizeMetadata(value: unknown): UserMetadata {
  if (!isRecord(value)) return {};
  const metadata: UserMetadata = { ...value };
  if (typeof metadata.full_name === "string") metadata.full_name = metadata.full_name.trim();
  if (typeof metadata.department === "string") metadata.department = metadata.department.trim();
  return metadata;
}

function createUser(account: StoredUser): User {
  return {
    id: account.id,
    aud: "authenticated",
    role: "authenticated",
    email: account.email,
    email_confirmed_at: account.created_at,
    confirmed_at: account.created_at,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: account.user_metadata,
    created_at: account.created_at,
    updated_at: account.updated_at,
    is_anonymous: false,
  } as User;
}

function createSession(account: StoredUser, stored?: StoredSession): Session {
  return {
    access_token: stored?.accessToken ?? `local-access-${createId("token")}`,
    refresh_token: stored?.refreshToken ?? `local-refresh-${createId("token")}`,
    expires_in: 31_536_000,
    expires_at: Math.floor(Date.now() / 1000) + 31_536_000,
    token_type: "bearer",
    user: createUser(account),
  } as Session;
}

function findAccountBySession(): { account: StoredUser; session: Session } | null {
  const stored = readStoredSession();
  if (!stored) return null;

  const state = readState();
  const account = state.users.find((user) => user.id === stored.userId);
  if (!account) {
    saveStoredSession(null);
    return null;
  }

  return { account, session: createSession(account, stored) };
}

function persistSession(account: StoredUser): Session {
  const stored: StoredSession = {
    userId: account.id,
    accessToken: `local-access-${createId("token")}`,
    refreshToken: `local-refresh-${createId("token")}`,
  };
  saveStoredSession(stored);
  return createSession(account, stored);
}

function emitAuthEvent(event: AuthEvent, session: Session | null) {
  for (const listener of authListeners) {
    listener(event, session);
  }
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "th", { numeric: true });
}

function matchesFilter(row: LocalRow, filter: Filter) {
  const value = row[filter.column];
  if (filter.type === "eq") return value === filter.value;
  if (filter.type === "is") {
    if (filter.value === null) return value == null;
    return value === filter.value;
  }
  return filter.values.some((candidate) => value === candidate);
}

function projectRows(rows: LocalRow[], columns: string[] | null) {
  if (!columns) return rows.map((row) => ({ ...row }));
  return rows.map((row) => {
    const selected: LocalRow = {};
    for (const column of columns) {
      selected[column] = row[column];
    }
    return selected;
  });
}

function normalizeInsertRow(table: string, value: Record<string, unknown>) {
  const now = new Date().toISOString();
  const row: LocalRow = { ...value };
  if (typeof row["id"] !== "string") row["id"] = createId(table);
  if (typeof row["created_at"] !== "string") row["created_at"] = now;
  if (table === "rework_jobs" && typeof row["updated_at"] !== "string") row["updated_at"] = now;
  return row;
}

class LocalQueryBuilder implements PromiseLike<LocalQueryResult<LocalRow[] | null>> {
  private filters: Filter[] = [];
  private selectedColumns: string[] | null = null;
  private countMode: "exact" | null = null;
  private head = false;
  private orderSpec: OrderSpec | null = null;

  constructor(private readonly table: string) {}

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    const parsedColumns = columns
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    this.selectedColumns = columns.trim() === "*" ? null : parsedColumns;
    this.countMode = options?.count ?? null;
    this.head = options?.head ?? false;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.filters.push({ type: "in", column, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderSpec = { column, ascending: options?.ascending ?? true };
    return this;
  }

  async maybeSingle(): Promise<LocalQueryResult<LocalRow | null>> {
    const result = this.readResult();
    const rows = result.data ?? [];
    return {
      data: rows[0] ?? null,
      error: null,
      count: result.count,
    };
  }

  async insert(
    values: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<LocalQueryResult<LocalRow[]>> {
    const rows = (Array.isArray(values) ? values : [values]).map((value) =>
      normalizeInsertRow(this.table, value),
    );
    const state = readState();
    const currentRows = state.tables[this.table] ?? [];
    state.tables = {
      ...state.tables,
      [this.table]: [...currentRows, ...rows],
    };
    saveState(state);
    return { data: rows, error: null, count: null };
  }

  then<TResult1 = LocalQueryResult<LocalRow[] | null>, TResult2 = never>(
    onfulfilled?:
      ((value: LocalQueryResult<LocalRow[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.readResult()).then(onfulfilled, onrejected);
  }

  private readResult(): LocalQueryResult<LocalRow[] | null> {
    const state = readState();
    let sourceRows = state.tables[this.table] ?? [];
    if (this.table === "notifications") {
      const currentUserId = findAccountBySession()?.account.id;
      sourceRows = currentUserId
        ? sourceRows.filter((row) => row["user_id"] === currentUserId)
        : [];
    }
    let rows = sourceRows.filter((row) =>
      this.filters.every((filter) => matchesFilter(row, filter)),
    );
    const orderSpec = this.orderSpec;
    if (orderSpec) {
      rows = [...rows].sort((left, right) => {
        const direction = orderSpec.ascending ? 1 : -1;
        return compareValues(left[orderSpec.column], right[orderSpec.column]) * direction;
      });
    }

    return {
      data: this.head ? null : projectRows(rows, this.selectedColumns),
      error: null,
      count: this.countMode === "exact" ? rows.length : null,
    };
  }
}

const localAuth = {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email);
    const account = readState().users.find((user) => user.email === normalizedEmail);
    if (!account || !(await passwordMatches(account, password))) {
      return {
        data: { user: null, session: null },
        error: new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"),
      };
    }

    const session = persistSession(account);
    emitAuthEvent("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: unknown; emailRedirectTo?: string };
  }): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return { data: { user: null, session: null }, error: new Error("กรุณากรอกอีเมล") };
    }
    if (password.length < 6) {
      return {
        data: { user: null, session: null },
        error: new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
      };
    }

    const state = readState();
    if (state.users.some((user) => user.email === normalizedEmail)) {
      return { data: { user: null, session: null }, error: new Error("อีเมลนี้ถูกสมัครแล้ว") };
    }

    const now = new Date().toISOString();
    const metadata = normalizeMetadata(options?.data);
    const fallbackName = normalizedEmail.split("@")[0] ?? normalizedEmail;
    const fullName = metadata.full_name || fallbackName;
    const department = metadata.department || null;
    const passwordSalt = createId("salt");
    const account: StoredUser = {
      id: createId("user"),
      email: normalizedEmail,
      password_hash: await hashPassword(password, passwordSalt),
      password_salt: passwordSalt,
      created_at: now,
      updated_at: now,
      user_metadata: metadata,
    };
    const role: AppRole = state.users.length === 0 ? "admin" : "operator";
    const profile: LocalRow = {
      id: account.id,
      full_name: fullName,
      employee_code: null,
      department,
      email: normalizedEmail,
      created_at: now,
      updated_at: now,
    };
    const userRole: LocalRow = {
      id: createId("role"),
      user_id: account.id,
      role,
      created_at: now,
    };

    state.users = [...state.users, account];
    state.tables = {
      ...state.tables,
      profiles: [...(state.tables["profiles"] ?? []), profile],
      user_roles: [...(state.tables["user_roles"] ?? []), userRole],
    };
    saveState(state);

    const session = persistSession(account);
    emitAuthEvent("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  },

  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    return { data: { session: findAccountBySession()?.session ?? null }, error: null };
  },

  async getUser(): Promise<{ data: { user: User | null }; error: null }> {
    return { data: { user: findAccountBySession()?.session.user ?? null }, error: null };
  },

  async signOut(): Promise<{ error: null }> {
    saveStoredSession(null);
    emitAuthEvent("SIGNED_OUT", null);
    return { error: null };
  },

  onAuthStateChange(callback: AuthListener) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },
};

export const supabase = {
  auth: localAuth,
  from(table: string) {
    return new LocalQueryBuilder(table);
  },
};
