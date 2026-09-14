// Owner-only development tools for the platform Agent.
// These are intentionally isolated from business-data tools.

const CODE_ROOTS = ['src/', 'base44/functions/'];
const BLOCKED = [/\.env/i, /secret/i, /credentials/i, /token/i, /private[_-]?key/i];

export function assertSafePath(path: string) {
  const normalized = String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!CODE_ROOTS.some((root) => normalized.startsWith(root))) throw new Error('المسار خارج نطاق كود المنصة.');
  if (normalized.includes('..') || BLOCKED.some((rx) => rx.test(normalized))) throw new Error('هذا الملف محمي ولا يمكن للوكيل تعديله.');
  return normalized;
}

export const DEV_TOOL_REGISTRY = {
  read_code_file: { risk: 'low', description: 'قراءة ملف من كود المنصة' },
  search_code: { risk: 'low', description: 'البحث داخل كود المنصة' },
  write_code_file: { risk: 'high', description: 'تعديل أو إنشاء ملف في كود المنصة' },
  run_build_check: { risk: 'high', description: 'تشغيل فحص البناء واختبارات المشروع' },
};
