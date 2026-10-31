// 备选：不想用 Cloudflare 时，文件放自己电脑。和 index.html 同一目录，
// 把 index.html 里 API 改成 http://你的电脑IP:3000 再打开（或直接 http://IP:3000 访问本机网页）
const express=require('express'),multer=require('multer'),fs=require('fs'),path=require('path');
const app=express();const UP='files';fs.mkdirSync(UP,{recursive:true});
const STORE='meta.json';
const load=()=>{try{return JSON.parse(fs.readFileSync(STORE,'utf8'))}catch{return{}}};
const save=d=>fs.writeFileSync(STORE,JSON.stringify(d,null,2));
const up=multer({dest:UP,limits:{fileSize:20*1024**3}});
app.use(express.static('.'));app.use('/dl',express.static(UP));
app.get('/api/list',(_,r)=>{const m=load();r.json(fs.readdirSync(UP).filter(f=>!f.startsWith('.')).map(f=>{const s=fs.statSync(path.join(UP,f));return{name:f,size:s.size,time:s.mtimeMs,...(m[f]||{})}}).sort((a,b)=>b.time-a.time))});
app.post('/api/upload',up.single('file'),(req,r)=>{if(!req.file)return r.sendStatus(400);const n=(req.body.name||req.file.originalname).replace(/[/\\]/g,'').replace(/\s+/g,'_');fs.renameSync(req.file.path,path.join(UP,n));const m=load();m[n]={cat:req.body.cat||'其他',desc:req.body.desc||'',size:req.file.size,time:Date.now()};save(m);r.json({ok:true,name:n})});
app.delete('/api/file/:n',(req,r)=>{const n=decodeURIComponent(req.params.n).replace(/[/\\]/g,'');try{fs.unlinkSync(path.join(UP,n))}catch{}const m=load();delete m[n];save(m);r.json({ok:true})});
app.listen(3000,'0.0.0.0',()=>console.log('http://localhost:3000  (局域网用提示的IP)'));
