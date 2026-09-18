// Exploratory benchmark, not production service code. Credentials never enter results.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
if(!account) throw Error('Set CLOUDFLARE_ACCOUNT_ID');
let token=process.env.CLOUDFLARE_API_TOKEN;
if(!token){
 const cfg=await fs.readFile(path.join(os.homedir(),'Library/Preferences/.wrangler/config/default.toml'),'utf8');
 token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
}
if(!token) throw Error('Set CLOUDFLARE_API_TOKEN or authenticate Wrangler');
const pages=[
 ['example','https://example.com','static control'],
 ['openscreenshot','https://openscreenshot.app/','product landing page'],
 ['screenshotone','https://screenshotone.com/','long marketing page'],
 ['astro','https://astro.build/','image-rich marketing page'],
 ['mdn','https://developer.mozilla.org/en-US/docs/Web/JavaScript','long documentation'],
 ['wikipedia','https://en.wikipedia.org/wiki/Screenshot','article with images'],
 ['hn','https://news.ycombinator.com/','dense text listing'],
 ['daytona','https://www.daytona.io/','dynamic marketing page'],
];
const jobs=[];
for(let round=1;round<=3;round++) for(const [id,url,category] of pages) jobs.push({id:`${id}-desktop-${round}`,url,category,mode:'desktop',round,endpoint:'screenshot'});
for(const name of ['openscreenshot','screenshotone','astro','daytona']){
 const [id,url,category]=pages.find(p=>p[0]===name); jobs.push({id:`${id}-mobile-1`,url,category,mode:'mobile',round:1,endpoint:'screenshot'});
}
for(const name of ['openscreenshot','mdn']){
 const [id,url,category]=pages.find(p=>p[0]===name); jobs.push({id:`${id}-pdf-1`,url,category,mode:'pdf',round:1,endpoint:'pdf'});
}
const results=[]; let lastStart=0, browserTotal=0;
await fs.mkdir(path.join(out,'artifacts'),{recursive:true});
for(const job of jobs){
 if(browserTotal>480000){console.log('Browser-time safety cap reached');break;}
 await new Promise(r=>setTimeout(r,Math.max(0,11000-(Date.now()-lastStart))));
 const viewport=job.mode==='mobile'?{width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true}:{width:1440,height:900,deviceScaleFactor:1};
 const payload={url:job.url,viewport,gotoOptions:{waitUntil:'networkidle2',timeout:25000},...(job.endpoint==='screenshot'?{screenshotOptions:{fullPage:true,type:'png'}}:{pdfOptions:{format:'A4',printBackground:true}})};
 const row={...job,startedAt:new Date().toISOString(),payload};
 lastStart=Date.now();const start=performance.now();
 try{
  const res=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering/${job.endpoint}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(65000)});
  const buf=Buffer.from(await res.arrayBuffer());
  Object.assign(row,{elapsedMs:performance.now()-start,status:res.status,contentType:res.headers.get('content-type'),browserMs:res.headers.has('x-browser-ms-used')?Number(res.headers.get('x-browser-ms-used')):null,bytes:buf.length});
  const signature=job.endpoint==='pdf'?buf.subarray(0,5).toString()==='%PDF-':buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  row.artifactValid=res.ok&&signature;
  if(row.artifactValid){row.file=`artifacts/${job.id}.${job.endpoint==='pdf'?'pdf':'png'}`;await fs.writeFile(path.join(out,row.file),buf);if(job.endpoint==='screenshot'){row.width=buf.readUInt32BE(16);row.height=buf.readUInt32BE(20);}}
  else row.error=buf.toString('utf8').slice(0,2000);
  browserTotal+=row.browserMs??65000;
 }catch(e){Object.assign(row,{elapsedMs:performance.now()-start,artifactValid:false,error:e.message});browserTotal+=65000;}
 results.push(row);await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({id:row.id,status:row.status,valid:row.artifactValid,seconds:+(row.elapsedMs/1000).toFixed(2),browserMs:row.browserMs,size:row.width?`${row.width}x${row.height}`:undefined,error:row.error}));
 if([401,403,429].includes(row.status)){console.log('Stopping on auth/quota response');break;}
}
