// worker.js —— 部署到 Cloudflare Workers，绑定 R2 桶（变量名 BUCKET）
// 文档：把这段代码贴进 CF 控制台的 Worker，再在 Settings→Bindings 绑 R2 桶
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const bucket = env.BUCKET;
    const META = '_meta.json';

    if (url.pathname.startsWith('/dl/')) {
      const key = decodeURIComponent(url.pathname.slice(4));
      const obj = await bucket.get(key);
      if (!obj) return new Response('没找到', { status: 404 });
      return new Response(obj.body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(key)}`,
          'Content-Length': obj.size, 'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/api/list') {
      const q = url.searchParams.get('q') || '', cat = url.searchParams.get('cat') || '全部';
      const [listed, mo] = await Promise.all([
        bucket.list({ limit: 1000 }),
        bucket.get(META).then(o => o ? o.text() : '{}').catch(() => '{}'),
      ]);
      const meta = JSON.parse(mo);
      let out = listed.objects.filter(o => o.key !== META)
        .map(o => ({ name: o.key, size: o.size, time: o.uploaded.getTime(), ...(meta[o.key] || {}) }))
        .sort((a, b) => b.time - a.time);
      if (cat !== '全部') out = out.filter(o => (o.cat || '其他') === cat);
      if (q) out = out.filter(o => (o.name + (o.desc || '')).toLowerCase().includes(q.toLowerCase()));
      return Response.json(out);
    }

    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const form = await req.formData();
      const file = form.get('file');
      if (!file) return new Response('没收到文件', { status: 400 });
      const safe = (form.get('name') || file.name).replace(/[/\\]/g, '').replace(/\s+/g, '_');
      let meta = {};
      try { meta = JSON.parse(await (await bucket.get(META)).text()); } catch {}
      await bucket.put(safe, file.stream(), { httpMetadata: { contentType: 'application/octet-stream' } });
      meta[safe] = { cat: form.get('cat') || '其他', desc: form.get('desc') || '', size: file.size, time: Date.now() };
      await bucket.put(META, JSON.stringify(meta, null, 2), { httpMetadata: { contentType: 'application/json' } });
      return Response.json({ ok: true, name: safe });
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/file/')) {
      const key = decodeURIComponent(url.pathname.slice(11));
      await bucket.delete(key);
      let meta = {};
      try { meta = JSON.parse(await (await bucket.get(META)).text()); } catch {}
      delete meta[key];
      await bucket.put(META, JSON.stringify(meta, null, 2), { httpMetadata: { contentType: 'application/json' } });
      return Response.json({ ok: true });
    }
    return new Response('MC File Server', { status: 404 });
  },
};
