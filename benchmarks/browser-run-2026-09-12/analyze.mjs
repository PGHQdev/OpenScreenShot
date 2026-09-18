import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const dir=process.argv[2]?path.resolve(process.argv[2]):path.dirname(fileURLToPath(import.meta.url));
const rows=JSON.parse(await fs.readFile(path.join(dir,'results.json'),'utf8'));
const quantile=(values,p)=>{const a=[...values].sort((a,b)=>a-b);return a.length?a[Math.ceil(p*a.length)-1]:null;};
const groups={};
for(const mode of ['desktop','mobile','pdf']){
 const all=rows.filter(r=>r.mode===mode),ok=all.filter(r=>r.artifactValid);
 groups[mode]={attempts:all.length,validArtifacts:ok.length,p50Seconds:quantile(ok.map(r=>r.elapsedMs/1000),.5),p95Seconds:quantile(ok.map(r=>r.elapsedMs/1000),.95),browserSeconds:ok.reduce((n,r)=>n+(r.browserMs??0)/1000,0),missingUsageHeaders:all.filter(r=>r.browserMs==null).length};
}
const totalMs=rows.reduce((n,r)=>n+(r.browserMs??0),0);
const summary={generatedAt:new Date().toISOString(),quantileMethod:'nearest rank; valid artifacts only; includes transfer to local client; visual correctness assessed separately',groups,totalReportedBrowserSeconds:totalMs/1000,reportedUsageMarginalBrowserCostUSD:totalMs/3600000*.09,reportedUsageCostPer1000ValidArtifactsUSD:totalMs/3600000*.09/rows.filter(r=>r.artifactValid).length*1000};
await fs.writeFile(path.join(dir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let cards='';
await fs.mkdir(path.join(dir,'previews'),{recursive:true});
for(const r of rows){
 if(!r.file)continue;
 if(r.endpoint==='screenshot'){
 const image=sharp(path.join(dir,r.file));
 await image.clone().resize({width:480,withoutEnlargement:true}).toFile(path.join(dir,`previews/${r.id}.png`));
 await image.clone().extract({left:0,top:0,width:r.width,height:Math.min(1000,r.height)}).resize({width:720}).toFile(path.join(dir,`previews/${r.id}-top.png`));
 }
 cards+=`<article><h2>${esc(r.id)}</h2><p>${(r.elapsedMs/1000).toFixed(2)}s wall; ${(r.browserMs/1000).toFixed(2)}s browser; ${r.width??''} × ${r.height??''}</p><a href="${r.file}">${r.endpoint==='screenshot'?`<img loading="lazy" src="previews/${r.id}.png" alt="${esc(r.id)}">`:'Open PDF'}</a></article>`;
}
await fs.writeFile(path.join(dir,'gallery.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Browser Run benchmark captures</title><style>body{font:16px system-ui;margin:24px;background:#eee;color:#222}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{background:white;padding:16px;overflow:hidden}h2{font-size:18px}img{width:100%;height:auto}a{color:#145ac0}</style><h1>Browser Run benchmark captures</h1><p>September 12, 2026. Images are real API results; HTTP success does not establish page correctness. Click to inspect original.</p><main>${cards}</main></html>`);
console.log(JSON.stringify(summary,null,2));
