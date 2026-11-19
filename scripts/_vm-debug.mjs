import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:'new',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio'],defaultViewport:{width:960,height:540},protocolTimeout:120000});
const p=await b.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));p.on('console',m=>{if(m.type()==='error')console.log('console',m.text().slice(0,200))});
p.on('requestfailed',r=>console.log('failed',r.url().slice(0,100)));
await p.goto('http://localhost:8123/',{waitUntil:'domcontentloaded',timeout:120000});
for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,4000));console.log(await p.evaluate(()=>[document.readyState,typeof THREE,typeof assetsReady,typeof window.assetsReady].join(' ')))}
await b.close();
