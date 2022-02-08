var U=Object.defineProperty;var W=(t,e,s)=>e in t?U(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var h=(t,e,s)=>(W(t,typeof e!="symbol"?e+"":e,s),s);import{d as g,c as d,a,t as f,b as y,F as x,r as L,o as l,w as O,v as A,e as F,f as H,p as K,g as J,h as E,i as Q}from"./vendor.c589b098.js";const X=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerpolicy&&(r.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?r.credentials="include":n.crossorigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}};X();const Y="modulepreload",I={},Z="/",P=function(e,s){return!s||s.length===0?e():Promise.all(s.map(i=>{if(i=`${Z}${i}`,i in I)return;I[i]=!0;const n=i.endsWith(".css"),r=n?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${i}"]${r}`))return;const o=document.createElement("link");if(o.rel=n?"stylesheet":Y,n||(o.as="script",o.crossOrigin=""),o.href=i,document.head.appendChild(o),n)return new Promise((u,G)=>{o.addEventListener("load",u),o.addEventListener("error",G)})})).then(()=>e())},B={ball:{type:"ball",name:"\u5C0F\u7403",img:"ball.png",config:["radius:m","x:m","y:m","mass:kg","vx:m/s","vy:m/s"]}},R={},v={},k={G:667259e-16,c:299792458,k:8987551787368176e-6,e:1602176634e-28};function ee(t){R[t.id]=t}function $(){return R}function te(t){v[t.id]=t}function se(t){return v[t]===void 0?!1:(delete v[t],!0)}function C(){return v}class m{constructor(e,s,i){this.name=e,this.type=s,this.magnitude=i,this.id=m.idCounter++,te(this)}destroy(){se(this.id)}}m.idCounter=0;class ie extends m{constructor(e,s,i){super(e,s,i)}}class M extends m{constructor(e,s,i){super(e,s,i)}}class N extends M{constructor(e,s){super(e,"gravity");this.centralObject=s,this.mass=s.mass,this.center=s.position}calculateForceGravity(e){if(e===this.centralObject)return[0,0];const s=[0,0],i=e.position[0]-this.center[0],n=e.position[1]-this.center[1],r=Math.sqrt(Math.pow(i,2)+Math.pow(n,2));return s[0]=-(this.mass*e.mass*k.G)/Math.pow(r,2)*i/r,s[1]=-(this.mass*e.mass*k.G)/Math.pow(r,2)*n/r,s}}class ne{constructor(){this.objectList={},this.fieldList={},this.objectList=$(),this.fieldList=C()}analyzeAll(e){const s=Object.values(this.objectList);for(const i of s)i.calculateAcceleration(e)}}class oe{constructor(e){this.loopFuncs=[],this.status="running",this.speed=1,this.config=e,this.run(),this.analyzer=new ne}run(){this.createLoop(),this.status="running"}stop(){this.status="stopped"}pause(){this.status="paused"}resume(){this.status="running"}createLoop(){let e=0,s=0,i=this;this.loop=n=>{if(typeof this.speed!="number"&&(this.speed=parseFloat(this.speed)),i.status==="paused")return requestAnimationFrame(this.loop);if(i.status==="running"){let r=n-s;s=n,e++;for(let o=0;o<this.config.refreshRate*this.speed;o++)i.update();for(let o of i.loopFuncs)o(e,r);requestAnimationFrame(this.loop)}else if(i.status==="stopped"){this.loop=void 0;return}},requestAnimationFrame(this.loop)}update(){this.analyzer.analyzeAll(this.config.refreshRate),this.moveAllObjects()}addLoop(e){this.loopFuncs.push(e)}removeLoop(e){this.loopFuncs.splice(this.loopFuncs.indexOf(e),1)}moveAllObjects(){const e=Object.values($());for(const s of e)s.move(this.config.refreshRate)}setSpeed(e){this.speed=e}}class j extends ie{constructor(e,s,i){super(e,"electric",s);this.setShape(i)}isInField(e){return this.shape.isInShape(e.position)}calculateForceElectic(e){if(!this.isInField(e))return[0,0];const s=[0,0],i=this.magnitude[0]*e.charge,n=this.magnitude[1]*e.charge;return s[0]=i,s[1]=n,s}setShape(e){this.shape=e}}class _{constructor(e,s){this.mass=0,this.velocity=[0,0],this.acceleration=[0,0],this.forces=[],this.position=[0,0],this.charge=0,this.name=e,this.id=_.idCounter++,this.gravityField=new N(this.name,this),ee(this),this.setConfig(s)}setConfig(e){e.description&&(this.description=e.description),e.mass&&this.setMass(e.mass),e.position&&this.setPosition(e.position[0],e.position[1]),e.velocity&&this.setVelocity(e.velocity[0],e.velocity[1]),e.charge&&this.setCharge(e.charge),e.shape&&this.setShape(e.shape)}setPosition(e=this.position[0],s=this.position[1]){this.position[0]=e,this.position[1]=s}setShape(e){this.shape=e}setMass(e){this.mass=e,this.gravityField.mass=e}addForce(e){this.forces.push(e)}removeForce(e){this.forces.splice(this.forces.indexOf(e),1)}addAcceleration(e,s){this.acceleration[0]+=e,this.acceleration[1]+=s}isInField(e){if(e instanceof M)return!0}move(e=1){this.position[0]+=this.velocity[0]/e/60,this.position[1]+=this.velocity[1]/e/60}setVelocity(e,s){this.velocity[0]=e,this.velocity[1]=s}setCharge(e){this.charge=e}calculateForce(){const e=[0,0],s=Object.values(C());for(const i of s)if(i instanceof N){const n=i.calculateForceGravity(this);e[0]+=n[0],e[1]+=n[1]}else if(i instanceof j){const n=i.calculateForceElectic(this);e[0]+=n[0],e[1]+=n[1]}return e}calculateAcceleration(e=1){if(!this.mass)return;const s=this.calculateForce(),i=[0,0];return i[0]=s[0]/this.mass,i[1]=s[1]/this.mass,this.acceleration=i,this.velocity[0]+=i[0]/e/60,this.velocity[1]+=i[1]/e/60,i}}_.idCounter=0;class T extends _{constructor(e,s){super(e,s);this.radius=s.radius}}class re{constructor(e,s,i,n){this.id=e,this.type=s,this.center=i,this.setNode(n)}setNode(e){this.node=e,this.node.push(e[0])}setRadius(e){this.radius=e}isInShape(e){if(this.type==="circle")return Math.pow(e[0]-this.center[0],2)+Math.pow(e[1]-this.center[1],2)<=Math.pow(this.radius,2);if(this.type==="polygon"){let s=0;for(let i=0;i<this.node.length-1;i++){const n=this.node[i][1],r=this.node[i+1][1];e[1]>=Math.min(n,r)&&e[1]<=Math.max(n,r)&&e[0]<=Math.max(this.node[i][0],this.node[i+1][0])&&s++}return s%2==1}}}const b=new oe({refreshRate:10});P(()=>Promise.resolve().then(function(){return de}),void 0).then(t=>window.cnb=t);const p=class{constructor(){this.init(),p.div=document.getElementById("app"),this.initDraw()}init(){["objects","fields"].forEach(e=>{const s=document.getElementById(e);p.canvases[e]=s,p.contexts[e]=s.getContext("2d")})}initDraw(){b.addLoop(S),this.resize(),window.addEventListener("resize",this.resize)}resize(){const e=Object.values(p.canvases);for(const s of e)s.setAttribute("width",`${window.innerWidth}px`),s.setAttribute("height",`${window.innerHeight}px`),s.style.width=`${window.innerWidth}px`,s.style.height=`${window.innerHeight}px`;p.div.setAttribute("width",`${window.innerWidth}px`),p.div.setAttribute("height",`${window.innerHeight}px`),p.div.style.width=`${window.innerWidth}px`,p.div.style.height=`${window.innerHeight}px`}};let c=p;h(c,"canvases",{}),h(c,"contexts",{}),h(c,"div"),h(c,"objectList",$()),h(c,"fieldList",C());function S(){const t=c.contexts.objects;if(!(t instanceof CanvasRenderingContext2D))return;const e=Object.values(c.objectList);t.clearRect(0,0,parseFloat(c.canvases.objects.style.width||"0"),parseFloat(c.canvases.objects.style.height||"0"));for(const s of e)if(s instanceof T){const[i,n]=s.position,r=t.createRadialGradient(i,n,0,i,n,s.radius);r.addColorStop(0,"white"),r.addColorStop(1,"green"),t.fillStyle=r,t.beginPath(),t.arc(s.position[0],s.position[1],s.radius,0,Math.PI*2),t.fill()}}function V(){const t=c.contexts.fields;if(!(t instanceof CanvasRenderingContext2D))return;const e=Object.values(c.fieldList);t.clearRect(0,0,parseFloat(c.canvases.fields.style.width||"0"),parseFloat(c.canvases.fields.style.height||"0"));for(const s of e)if(s.type==="electric"&&s instanceof j){if(s.shape.type==="circle"){const[i,n]=s.shape.center;t.fillStyle="rgba(0, 0, 255, 0.5)",t.beginPath(),t.arc(i,n,s.shape.radius,0,Math.PI*2),t.fill()}else if(s.shape.type==="polygon"){t.fillStyle="rgba(0, 0, 255, 0.5)",t.beginPath(),t.moveTo(s.shape.node[0][0],s.shape.node[0][1]);for(const[i,n]of s.shape.node)t.lineTo(i,n);t.closePath(),t.fill()}}}function ae(t){const e=c.contexts.fields;if(e instanceof CanvasRenderingContext2D){if(t.shape.type==="circle"){const[s,i]=t.shape.center;e.fillStyle="rgba(0, 0, 255, 0.5)",e.beginPath(),e.arc(s,i,t.shape.radius,0,Math.PI*2),e.fill()}else if(t.shape.type==="polygon"){e.fillStyle="rgba(0, 0, 255, 0.5)",e.beginPath(),e.moveTo(t.shape.node[0][0],t.shape.node[0][1]);for(const[s,i]of t.shape.node)e.lineTo(s,i);e.closePath(),e.fill()}}}var ce=Object.freeze({__proto__:null,[Symbol.toStringTag]:"Module",Draw:c,drawAllObjects:S,drawAllFields:V,drawField:ae});function z(t){const e=new T("ball",t.config);return S(),e}function le(t,e,s){const i=new j(t,e,s);return V(),i}function D(t){return{mass:"\u8D28\u91CF",radius:"\u534A\u5F84",x:"x\u5750\u6807",y:"y\u5750\u6807",vx:"x\u901F\u5EA6",vy:"y\u901F\u5EA6"}[t]||t}var de=Object.freeze({__proto__:null,[Symbol.toStringTag]:"Module",addRoundObject:z,addUniformElectricField:le,getName:D,Shape:re});var w=(t,e)=>{const s=t.__vccOpts||t;for(const[i,n]of e)s[i]=n;return s};const pe={x:"0",y:"0",vx:"0",vy:"0",mass:"1",radius:"50"},ue=g({name:"ObjectsVue",props:{_name:{type:String,required:!0},_type:{type:String,required:!0},_img:{type:String,required:!0}},data(){return{detail:!1,obj:B,getName:D,configs:pe}},methods:{createConfig(t){const e={};for(const s in t){const i=parseFloat(t[s]);isNaN(i)?e[s]=t[s]:e[s]=i}return e.position=[e.x,e.y],e.velocity=[e.vx,e.vy],{type:this._type,config:e}},create(t){const e=this.createConfig(t);return z(e)},triggerDetail(){this.detail=!this.detail}}}),he={class:"object"},fe={id:"brief"},me=["src"],ge={class:"text"},ye={key:0},ve={class:"detail"},_e={class:"input-prompt"},be={id:"input-box"},we=["onUpdate:modelValue"],xe={id:"unit"};function Fe(t,e,s,i,n,r){return l(),d("div",he,[a("div",fe,[a("button",{id:"detail",onClick:e[0]||(e[0]=o=>t.triggerDetail())},f(t.detail?"\u7B80\u7565":"\u8BE6\u7EC6"),1),a("img",{id:"image",src:`/${t._img}`},null,8,me),a("span",ge,f(t._name),1),a("button",{class:"create",onClick:e[1]||(e[1]=o=>t.create(t.configs))},"\u521B\u5EFA")]),t.detail?(l(),d("hr",ye)):y("",!0),t.detail?(l(!0),d(x,{key:1},L((t.obj[t._type]||{}).config,o=>(l(),d("div",ve,[a("span",_e,f(t.getName(o.split(":")[0])),1),a("span",be,[O(a("input",{class:"input",type:"text","onUpdate:modelValue":u=>t.configs[o.split(":")[0]]=u},null,8,we),[[A,t.configs[o.split(":")[0]],void 0,{trim:!0}]]),a("span",xe,f(o.split(":")[1]),1)])]))),256)):y("",!0)])}var $e=w(ue,[["render",Fe],["__scopeId","data-v-75e91036"]]);const Ce=Object.values(B),je=g({name:"RightBar",data:()=>({list:Ce}),methods:{},components:{ObjectsVue:$e}}),Se={id:"right-bar"};function Le(t,e,s,i,n,r){const o=F("ObjectsVue");return l(),d("div",Se,[(l(!0),d(x,null,L(t.list,u=>(l(),H(o,{_name:u.name,_type:u.type,_img:u.img},null,8,["_name","_type","_img"]))),256))])}var Oe=w(je,[["render",Le],["__scopeId","data-v-1f57108c"]]),Ae="/assets/settings.0c9bdc27.png",Ee="/assets/play.0bc8270f.png",Ie="/assets/pause.429c644f.png",Pe="/assets/speeddown.1f507ff4.png",Be="/assets/speedup.58720e73.png";const Re=g({name:"LeftBar",data:()=>({app:b,folded:!1,status:"running"}),methods:{triggerPlaying(){const t=this.app.status;t==="running"?b.pause():t==="paused"&&b.resume(),this.status=this.app.status},triggerFold(){const t=document.getElementById("settings"),e=/rotate\([0-9]+deg\)/.exec(t.style.transform)||[],s=parseInt((/[0-9]+/.exec(e[0])||[])[0]||"0");t.style.transform=`rotate(${s+90}deg)`;const i=document.getElementById("left-bar"),n=document.getElementById("hr");this.folded?(i.style.width="375px",n.style.display="block"):(i.style.width="48px",setTimeout(()=>{n.style.display="none"},500)),this.folded=!this.folded},changeSpeed(t){const e=this.app.speed;t==="up"?e<10&&(this.app.speed=parseFloat((e+.1).toFixed(1))):e>.1&&(this.app.speed=parseFloat((e-.1).toFixed(1)))}}}),q=t=>(K("data-v-678b7ffd"),t=t(),J(),t),ke={id:"left-bar",style:{"z-index":"200"}},Me=q(()=>a("span",{id:"hr"},null,-1)),Ne=q(()=>a("span",{id:"hr"},null,-1)),Te={id:"speed",style:{"padding-left":"2px"}};function Ve(t,e,s,i,n,r){return l(),d("div",ke,[a("img",{onClick:e[0]||(e[0]=o=>t.triggerFold()),id:"settings",class:"settings",src:Ae,style:{width:"48px",height:"48px"}}),Me,t.status==="paused"?(l(),d("img",{key:0,onClick:e[1]||(e[1]=o=>t.triggerPlaying()),class:"settings",id:"play",src:Ee,style:{width:"40px","margin-right":"6px"}})):y("",!0),t.status==="running"?(l(),d("img",{key:1,onClick:e[2]||(e[2]=o=>t.triggerPlaying()),class:"settings",id:"pause",src:Ie,style:{width:"40px","margin-right":"6px"}})):y("",!0),a("img",{class:"settings",onClick:e[3]||(e[3]=o=>t.changeSpeed("down")),id:"speeddown",src:Pe,style:{width:"40px","margin-right":"6px"}}),O(a("input",{type:"range",max:"10",min:"0.1",step:"0.1","onUpdate:modelValue":e[4]||(e[4]=o=>t.app.speed=o)},null,512),[[A,t.app.speed]]),a("img",{class:"settings",onClick:e[5]||(e[5]=o=>t.changeSpeed("up")),id:"speedup",src:Be,style:{width:"40px","margin-right":"6px"}}),Ne,a("span",Te,"\xD7"+f(t.app.speed),1)])}var ze=w(Re,[["render",Ve],["__scopeId","data-v-678b7ffd"]]);const De=g({name:"App",data(){return{rightToolbar:!0}},components:{RightBar:Oe,LeftBar:ze}}),qe=a("canvas",{id:"objects"},null,-1),Ge=a("canvas",{id:"fields"},null,-1);function Ue(t,e,s,i,n,r){const o=F("RightBar"),u=F("LeftBar");return l(),d(x,null,[qe,Ge,E(o),E(u)],64)}var We=w(De,[["render",Ue]]);Q(We).mount("#app");P(()=>Promise.resolve().then(function(){return ce}),void 0).then(t=>new t.Draw);