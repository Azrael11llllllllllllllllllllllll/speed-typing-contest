const $=x=>document.getElementById(x),firstName=$("firstName"),middleInitial=$("middleInitial"),lastName=$("lastName"),limit=$("limit"),typing=$("typing"),guide=$("typing-guide"),passage=$("passage").textContent.replace(/\s+/g," ").trim(),timer=$("timer"),timerWrap=$("floating-timer"),wpm=$("wpm"),acc=$("acc"),score=$("score"),msg=$("msg"),start=$("start"),reset=$("reset"),results=$("results"),supabaseConfig=window.SUPABASE_CONFIG||{},supabaseEnabled=Boolean(supabaseConfig.url&&supabaseConfig.anonKey);let id=null,running=false,prestartId=null,duration=300,left=300,began=0,deadline=0,last=null,serverResults=null,serverSnapshot=null,displayedResults=[],audioContext=null,lastWarningSecond=null,prestartCount=0;
function getParticipantName(){const nameParts=[firstName&&firstName.value.trim(),middleInitial&&middleInitial.value.trim()?middleInitial.value.trim()+".":"",lastName&&lastName.value.trim()].filter(Boolean);return nameParts.join(" ");}
function capitalizeNameField(value){return value.replace(/[^\p{L} '\u2019-]/gu,"").replace(/(^|[ '\u2019-])(\p{L})/gu,(_,separator,letter)=>separator+letter.toUpperCase()).replace(/(\p{L})([^ '\u2019-]*)/gu,(_,first,rest)=>first+rest.toLowerCase());}
function formatMiddleInitial(value){return value.replace(/[^A-Za-z]/g,"").slice(0,2).toUpperCase();}
firstName.addEventListener("input",()=>{firstName.value=capitalizeNameField(firstName.value);});
middleInitial.addEventListener("input",()=>{middleInitial.value=formatMiddleInitial(middleInitial.value);});
lastName.addEventListener("input",()=>{lastName.value=capitalizeNameField(lastName.value);});
const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
function playTimerTone(kind){if(!audioContext)return;const play=()=>{let now=audioContext.currentTime,tones=kind==="finish"?[[660,0,.22],[880,.12,.36],[1040,.22,.4]]:[[880,0,.12],[880,.18,.12]];for(const [frequency,offset,length] of tones){let oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),startAt=now+offset;oscillator.type="sine";oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,startAt);gain.gain.exponentialRampToValueAtTime(kind==="finish"?.9:.2,startAt+.018);gain.gain.exponentialRampToValueAtTime(.0001,startAt+length);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(startAt);oscillator.stop(startAt+length+.02)}};if(audioContext.state==="suspended")audioContext.resume().then(play).catch(()=>{});else play()}
function showTime(seconds){let wasUrgent=timerWrap.classList.contains("urgent"),isUrgent=seconds>0&&seconds<=15;timer.textContent=fmt(seconds);timerWrap.classList.toggle("urgent",isUrgent);if(isUrgent&&seconds!==lastWarningSecond){playTimerTone("warning");lastWarningSecond=seconds;}if(!isUrgent)lastWarningSecond=null;}
function setPrestartMessage(text){msg.textContent=text;msg.style.cssText="color:#0f172a;font-weight:700;font-size:24px;text-align:center;";}
function startCountdown(){clearInterval(prestartId);prestartCount=3;setPrestartMessage("Ready...");playTimerTone("warning");prestartId=setInterval(()=>{prestartCount--;if(prestartCount>0){setPrestartMessage(prestartCount===2?"Set...":prestartCount===1?"Go!":"Ready...");playTimerTone("warning");}else {clearInterval(prestartId);prestartId=null;setPrestartMessage("Good luck!");playTimerTone("finish");setTimeout(()=>{startTypingRun();},600);}} ,1000);}
function startTypingRun(){msg.style.cssText="";msg.textContent="Type the passage as fast and accurately as you can.";duration=+limit.value;left=duration;began=Date.now();deadline=began+duration*1000;running=true;typing.value="";typing.disabled=false;renderTypingGuide();firstName.disabled=true;middleInitial.disabled=true;lastName.disabled=true;limit.disabled=true;start.disabled=true;showTime(left);wpm.textContent=0;acc.textContent="100%";score.textContent=0;typing.focus();id=setInterval(()=>{left=Math.max(0,Math.ceil((deadline-Date.now())/1000));showTime(left);update();if(left<=0)stop("timeout");else if(typing.value===passage)stop("complete")},250)}
function metrics(){let t=typing.value,correct=0,errors=0;for(let i=0;i<t.length;i++){if(t[i]===passage[i])correct++;else errors++;}let a=t.length?Math.round(correct/t.length*100):100,m=Math.max((Date.now()-began)/60000,1/60),w=Math.round((correct/5)/m);return{wpm:w,accuracy:a,score:Math.round(w*a/100),errors,correct}}
function renderTypingGuide(){let typed=typing.value;guide.innerHTML=Array.from(passage,(char,index)=>`<span class="${index>=typed.length?"":typed[index]===char?"correct":"incorrect"}">${safe(char)}</span>`).join("");guide.scrollTop=typing.scrollTop;guide.scrollLeft=typing.scrollLeft;guide.style.display="block"}
function update(){let m=metrics();wpm.textContent=m.wpm;acc.textContent=m.accuracy+"%";score.textContent=m.score}
function data(){try{return JSON.parse(localStorage.getItem("typingResults")||"[]")}catch(e){return[]}}
function elapsed(r){if(Number.isFinite(+r.elapsedMs)&&+r.elapsedMs>0)return+r.elapsedMs;let parts=String(r.time||"0:00").split(":").map(Number);return(parts.length===2?parts[0]*60+parts[1]:0)*1000}
function ordinal(n){let mod100=n%100;return n+(mod100>=11&&mod100<=13?"th":n%10===1?"st":n%10===2?"nd":n%10===3?"rd":"th")+" place"}
function render(){let d=[...(serverResults??data())],ranked=d.filter(r=>r.completed===true).sort((a,b)=>elapsed(a)-elapsed(b)||b.wpm-a.wpm||b.accuracy-a.accuracy),places=new Map(ranked.map((r,i)=>[r,ordinal(i+1)]));d.sort((a,b)=>{let ar=places.has(a),br=places.has(b);return ar!==br?(ar?-1:1):ar?ranked.indexOf(a)-ranked.indexOf(b):0});displayedResults=d.map(r=>({...r,place:places.get(r)||null}));results.innerHTML=d.length?displayedResults.map((r,i)=>`<tr><td>${safe(r.name)}</td><td>${r.wpm}</td><td>${r.accuracy}%</td><td>${r.score}</td><td>${safe(r.time)}</td><td>${r.errors ?? 0}</td><td>${r.place||"Not completed"}<div class="certificate-actions"><button type="button" class="row-certificate" onclick="printCertificateByIndex(${i})">Print Certificate</button><button type="button" class="row-qr" onclick="showCertificateQrByIndex(${i})">QR Code</button></div></td></tr>`).join(""):`<tr><td colspan="7">No saved results yet.</td></tr>`}
function safe(s){let d=document.createElement("div");d.textContent=s;return d.innerHTML}
async function refreshResults(){try{let endpoint=supabaseEnabled?`${supabaseConfig.url.replace(/\/$/,"")}/rest/v1/contest_results?select=name,wpm,accuracy,score,time,date,elapsed_ms,errors,completed&order=id.desc`:`save_result.php?_=${Date.now()}`,headers=supabaseEnabled?{apikey:supabaseConfig.anonKey,Authorization:`Bearer ${supabaseConfig.anonKey}`}:{},response=await fetch(endpoint,{cache:"no-store",headers});if(response.ok){let payload=await response.json();if(supabaseEnabled&&Array.isArray(payload))payload=payload.map(({elapsed_ms,...result})=>({...result,elapsedMs:elapsed_ms}));if(Array.isArray(payload)){let snapshot=JSON.stringify(payload);if(snapshot!==serverSnapshot){serverSnapshot=snapshot;serverResults=payload;render()}}}}catch(e){serverResults=null}}
async function savePHP(r){try{let endpoint=supabaseEnabled?`${supabaseConfig.url.replace(/\/$/,"")}/rest/v1/contest_results`:"save_result.php",headers={"Content-Type":"application/json"},body=r;if(supabaseEnabled){headers.apikey=supabaseConfig.anonKey;headers.Authorization=`Bearer ${supabaseConfig.anonKey}`;headers.Prefer="return=minimal";body={name:r.name,wpm:r.wpm,accuracy:r.accuracy,score:r.score,time:r.time,date:r.date,elapsed_ms:r.elapsedMs,errors:r.errors,completed:r.completed}}let response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body)});if(!response.ok)throw new Error("Could not save result");await refreshResults()}catch(e){serverResults=null;render()}}
function stop(reason="manual"){if(!running)return;running=false;clearInterval(id);timerWrap.classList.remove("urgent");if(reason==="timeout")playTimerTone("finish");let elapsedMs=Math.max(1,Date.now()-began),m=metrics(),usedSeconds=Math.max(1,Math.round(elapsedMs/1000));last={name:getParticipantName(),...m,time:fmt(usedSeconds),date:new Date().toLocaleString(),elapsedMs,completed:reason==="complete",errors:m.errors};let d=data();d.unshift(last);localStorage.setItem("typingResults",JSON.stringify(d.slice(0,200)));savePHP(last);typing.disabled=true;firstName.disabled=false;middleInitial.disabled=false;lastName.disabled=false;limit.disabled=false;start.disabled=false;render();msg.className=reason==="timeout"?"timeout":reason==="complete"?"congratulations":"";msg.style.cssText=reason==="timeout"?"color:#b42318;font-weight:bold;font-size:18px":reason==="complete"?"color:#067647;font-weight:bold;font-size:18px":"";let ending=reason==="timeout"?"Time's up! Your time limit has ended. ":reason==="complete"?"Congratulations! You completed the passage. ":"";msg.textContent=`${ending}Saved: ${last.wpm} WPM • ${last.accuracy}% accuracy • ${last.errors} errors • Score ${last.score}`;update()}
start.onclick=()=>{const fullName=getParticipantName();if(!fullName){msg.textContent="Enter participant name first.";return}const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(AudioContextClass){audioContext??=new AudioContextClass();if(audioContext.state==="suspended")audioContext.resume().catch(()=>{})}startCountdown();}
typing.oninput=()=>{renderTypingGuide();update();if(typing.value===passage)stop("complete")};typing.onscroll=renderTypingGuide
reset.onclick=()=>{clearInterval(id);running=false;began=0;deadline=0;left=+limit.value;showTime(left);typing.value="";guide.style.display="none";renderTypingGuide();typing.disabled=true;firstName.disabled=false;middleInitial.disabled=false;lastName.disabled=false;limit.disabled=false;start.disabled=false;wpm.textContent=0;acc.textContent="100%";score.textContent=0;msg.className="";msg.style.cssText="";msg.textContent="Ready."}
limit.onchange=()=>{if(!running)showTime(+limit.value)}
$("clear").hidden=supabaseEnabled;
$("clear").onclick=async()=>{if(!confirm("Clear all saved contest results?"))return;try{let response=await fetch("save_result.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"clear"})}),result=await response.json();if(!response.ok||!result.success)throw new Error("Server could not clear results");localStorage.removeItem("typingResults");serverResults=[];serverSnapshot="[]";render();msg.textContent="All saved results cleared."}catch(error){msg.textContent="Could not clear saved results. Check the server and try again."}}
function printCertificateByIndex(index){let result=displayedResults[index];if(result)printCertificate(result)}
function showCertificateQrByIndex(index){let result=displayedResults[index];if(result)showCertificateQr(result)}
function getCertificateBaseUrl(){
    if(window.location.protocol==="http:"||window.location.protocol==="https:"){
        if(["localhost","127.0.0.1"].includes(window.location.hostname))return "https://azrael11llllllllllllllllllllllll.github.io/speed-typing-contest/";
        return `${window.location.origin}${window.location.pathname.replace(/\/+$/, "")}/`;
    }
    return "https://azrael11llllllllllllllllllllllll.github.io/speed-typing-contest/";
}
function buildCertificateQrUrl(result){
    const payload={
        name: result.name || "Participant",
        wpm: result.wpm,
        accuracy: result.accuracy,
        score: result.score,
        time: result.time,
        place: result.place || null,
        date: new Date().toLocaleDateString()
    };
    const certUrl=`${getCertificateBaseUrl()}?certificate=${encodeURIComponent(JSON.stringify(payload))}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(certUrl)}`;
}
function getCertificateFromQuery(){
    const params=new URLSearchParams(window.location.search);
    const raw=params.get("certificate");
    if(!raw)return null;
    try{return JSON.parse(raw)}catch(e){
        try{return JSON.parse(decodeURIComponent(raw))}catch(err){return null}
    }
}
function openCertificateFromQuery(){
    const payload=getCertificateFromQuery();
    if(!payload)return;
    const normalized={
        name: payload.name || "Participant",
        wpm: Number(payload.wpm || 0),
        accuracy: Number(payload.accuracy || 0),
        score: Number(payload.score || 0),
        time: payload.time || "00:00",
        place: payload.place || null
    };
    renderCertificatePopup(normalized, false, false, true);
}
function renderCertificatePopup(result, autoPrint=false, inline=false){
    const rank=Number.parseInt(result.place,10);
    const template=rank===1?"First.png":rank===2?"second.png":rank===3?"third.png":"participant.png";
    const imageUrl=new URL(`cetificates/${template}`,window.location.href).href;
    const nameTop=rank>=1&&rank<=3?"55.5%":"49.5%";
    const certificateStyles=`@page{size:landscape;margin:0}*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{display:grid;place-items:center;background:#fff}.certificate{position:relative;width:min(100vw,150vh);aspect-ratio:3/2;container-type:inline-size}.certificate img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.name,.date{position:absolute;text-align:center;white-space:nowrap;font-family:Georgia,"Times New Roman",serif;color:#071a39}.name{left:29%;top:${nameTop};width:57%;transform:translateY(-50%);font-size:clamp(12px,2.2cqw,28px)}.date{left:52.5%;top:84%;width:22%;transform:translateY(-50%);font-size:clamp(8px,1.48cqw,17px)}.save-certificate{position:fixed;top:16px;right:16px;padding:10px 16px;border:0;border-radius:6px;background:#173b68;color:#fff;font:600 14px Arial,sans-serif;cursor:pointer}@media screen{.certificate{width:min(96vw,144vh)}}@media print{.certificate{width:min(100vw,150vh)}.save-certificate{display:none}}`;
    if(inline){
        const viewport=document.createElement("meta");
        viewport.name="viewport";
        viewport.content="width=device-width,initial-scale=1";
        const title=document.createElement("title");
        title.textContent=`Certificate - ${result.name||"Participant"}`;
        const style=document.createElement("style");
        style.textContent=certificateStyles;
        document.head.replaceChildren(viewport,title,style);
        const button=document.createElement("button");
        button.className="save-certificate";
        button.type="button";
        button.textContent="Save PDF";
        button.addEventListener("click",()=>window.print());
        const certificate=document.createElement("main");
        certificate.className="certificate";
        const image=document.createElement("img");
        image.src=imageUrl;
        image.alt="Certificate template";
        const name=document.createElement("div");
        name.className="name";
        name.textContent=result.name||"Participant";
        const date=document.createElement("div");
        date.className="date";
        date.textContent=new Date().toLocaleDateString();
        certificate.append(image,name,date);
        document.body.replaceChildren(button,certificate);
        return;
    }
    const popup=window.open("","_blank");
    if(!popup){msg.textContent="Allow pop-ups for this page to print the certificate.";return}
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate - ${safe(result.name||"Participant")}</title><style>${certificateStyles}</style></head><body><main class="certificate"><img src="${imageUrl}" alt="Certificate template">${qrMarkup}<div class="name">${safe(result.name||"Participant")}</div><div class="date">${safe(new Date().toLocaleDateString())}</div></main></body></html>`);
    popup.document.close();
    if(autoPrint){popup.addEventListener("load",()=>popup.print(),{once:true});}
}
function showCertificateQr(result){
    const popup=window.open("","_blank");
    if(!popup){msg.textContent="Allow pop-ups to display the certificate QR code.";return}
    const qrUrl=buildCertificateQrUrl(result);
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate QR Code</title><style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{display:grid;place-items:center;background:#fff}img{display:block;width:min(88vmin,480px);height:auto;image-rendering:pixelated}</style></head><body><img src="${qrUrl}" alt="Certificate QR code"></body></html>`);
    popup.document.close();
}
function printCertificate(result){renderCertificatePopup(result,true)}
renderTypingGuide();
openCertificateFromQuery();
refreshResults();
setInterval(refreshResults,2000);