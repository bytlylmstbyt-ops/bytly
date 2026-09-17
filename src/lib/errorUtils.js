export function toUserMessage(value, fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.') {
  const seen = new WeakSet();
  const visit = (v, depth = 0) => {
    if (v == null || depth > 8) return '';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s || s === '[object Object]' || s === 'Object object') return '';
      return s;
    }
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v instanceof Error) return visit(v.message, depth + 1) || visit(v.cause, depth + 1);
    if (Array.isArray(v)) return v.map(x => visit(x, depth + 1)).filter(Boolean).join(' | ');
    if (typeof v === 'object') {
      if (seen.has(v)) return '';
      seen.add(v);
      for (const key of ['message','error','details','detail','reason','hint','description','text','content','value','output_text','result','response','cause','code']) {
        if (v[key] != null) {
          const text = visit(v[key], depth + 1);
          if (text) return text;
        }
      }
      try {
        const json = JSON.stringify(v, null, 2);
        return json && json !== '{}' ? json : '';
      } catch { return ''; }
    }
    return '';
  };
  return visit(value) || fallback;
}

export function assertDisplayable(value, fallback = 'لم يُرجع النظام محتوى قابلًا للعرض.') {
  const text = toUserMessage(value, '');
  return text || fallback;
}
