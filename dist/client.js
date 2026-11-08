window.__ModuleLoader__.load({id:"dsh-wallet-pill",factory(require){
"use strict";var __dshWalletPill=(()=>{var x=Object.defineProperty;var D=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var A=Object.prototype.hasOwnProperty;var y=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,a)=>(typeof require<"u"?require:t)[a]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var I=(e,t)=>{for(var a in t)x(e,a,{get:t[a],enumerable:!0})},_=(e,t,a,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of $(t))!A.call(e,n)&&n!==a&&x(e,n,{get:()=>t[n],enumerable:!(o=D(t,n))||o.enumerable});return e};var O=e=>_(x({},"__esModule",{value:!0}),e);var ne={};I(ne,{create:()=>te});var j={"pill.balance":"\u4F59\u989D","panel.title":"\u8D26\u6237\u4F59\u989D","panel.toppedUp":"\u5145\u503C","panel.granted":"\u8D60\u9001","panel.zone":"\u8BA1\u8D39\u65F6\u6BB5","panel.zone.peak":"\u9AD8\u5CF0","panel.zone.offPeak":"\u7A7A\u95F2","panel.zone.switchIn":"{time}\u540E\u5207\u6362","panel.zone.flat":"\u6682\u65E0\u5207\u6362","panel.prices":"\u4EF7\u76EE\uFF08\u5143 / \u767E\u4E07 token\uFF09","panel.price.model":"\u6A21\u578B","panel.price.bucket":"\u9879\u76EE","panel.price.offPeak":"\u7A7A\u95F2","panel.price.peak":"\u9AD8\u5CF0","panel.price.hit":"\u7F13\u5B58\u547D\u4E2D","panel.price.miss":"\u7F13\u5B58\u672A\u547D\u4E2D","panel.price.out":"\u8F93\u51FA","panel.updated":"\u66F4\u65B0\u4E8E {time}","panel.tableVersion":"\u4EF7\u76EE\u8868 {version}","panel.source":"\u4F59\u989D\u6765\u6E90\uFF1A{source}","panel.source.account":"DeepSeek \u8D26\u6237","panel.source.apiKey":"API Key","panel.refresh":"\u5237\u65B0","panel.refreshing":"\u5237\u65B0\u4E2D\u2026","panel.retry":"\u91CD\u8BD5","panel.stale":"\u663E\u793A\u4E0A\u6B21\u8BFB\u6570","error.noKey":"\u672A\u914D\u7F6E DEEPSEEK_API_KEY","error.account":"\u8D26\u53F7\u4F59\u989D\u8BFB\u53D6\u5931\u8D25","error.accountExpired":"\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55","error.timeout":"\u4F59\u989D\u63A5\u53E3\u8D85\u65F6","error.network":"\u65E0\u6CD5\u8FDE\u63A5\u4F59\u989D\u63A5\u53E3","error.malformed":"\u4F59\u989D\u63A5\u53E3\u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u6570\u636E","error.unauthorized":"API key \u65E0\u6548\u6216\u5DF2\u8FC7\u671F","error.generic":"\u8BFB\u53D6\u5931\u8D25\uFF08{code}\uFF09","duration.hour":"{n} \u5C0F\u65F6","duration.minute":"{n} \u5206","duration.second":"{n} \u79D2"},K={"pill.balance":"Balance","panel.title":"Account balance","panel.toppedUp":"Topped up","panel.granted":"Granted","panel.zone":"Billing window","panel.zone.peak":"Peak","panel.zone.offPeak":"Off-peak","panel.zone.switchIn":"switches in {time}","panel.zone.flat":"no switch ahead","panel.prices":"Prices (CNY per 1M tokens)","panel.price.model":"Model","panel.price.bucket":"Item","panel.price.offPeak":"Off-peak","panel.price.peak":"Peak","panel.price.hit":"Cache hit","panel.price.miss":"Cache miss","panel.price.out":"Output","panel.updated":"Updated {time}","panel.tableVersion":"Table {version}","panel.source":"Source: {source}","panel.source.account":"DeepSeek account","panel.source.apiKey":"API Key","panel.refresh":"Refresh","panel.refreshing":"Refreshing\u2026","panel.retry":"Retry","panel.stale":"Showing the last reading","error.noKey":"DEEPSEEK_API_KEY is not configured","error.account":"The account balance could not be read","error.accountExpired":"Your sign-in expired; sign in again","error.timeout":"The balance request timed out","error.network":"Cannot reach the balance endpoint","error.malformed":"The balance endpoint returned an unexpected payload","error.unauthorized":"The API key is invalid or expired","error.generic":"Read failed ({code})","duration.hour":"{n}h","duration.minute":"{n}m","duration.second":"{n}s"},P={zh:j,en:K};var s=y("react"),L=y("react-dom");var U="/wallet-pill/state";async function S(e){let t=new URLSearchParams({refresh:e.refresh?"1":"0",locale:e.locale,tz:String(-new Date().getTimezoneOffset()*60),v:"1.0.2"}),a=await fetch(`${U}?${t.toString()}`,{signal:e.signal,headers:{accept:"application/json"}});if(!a.ok)throw new Error(`state ${a.status}`);let o=await a.json();if(o.ok!==!0||o.value===void 0)throw new Error(o.error?.code??"bad payload");return o.value}var V={CNY:"\xA5",USD:"$"};function B(e){let t=e.toUpperCase();return V[t]??`${t} `}function h(e,t){let a=e.trim(),o=a===""?Number.NaN:Number(a),n=B(t);return Number.isFinite(o)?o>0&&o<.01?`${n}<0.01`:`${n}${o.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:`${n}\u2014`}function k(e){return Number.isFinite(e)?e.toLocaleString("en-US",{maximumFractionDigits:2}):"\u2014"}function E(e){let t=Math.max(0,Math.floor(e/1e3));return{hours:Math.floor(t/3600),minutes:Math.floor(t%3600/60),seconds:t%60}}function z(e){let t=new Date(e),a=o=>String(o).padStart(2,"0");return`${a(t.getHours())}:${a(t.getMinutes())}:${a(t.getSeconds())}`}var r=y("react/jsx-runtime"),H=6e4,Y=320,v=8;function N(){return(0,r.jsxs)("svg",{className:"wp-glyph",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[(0,r.jsx)("rect",{x:"3",y:"6",width:"18",height:"13",rx:"3.5"}),(0,r.jsx)("path",{d:"M3 10.5h18"}),(0,r.jsx)("circle",{cx:"17",cy:"14.75",r:"1.25",fill:"currentColor",stroke:"none"})]})}function F(e){let[t,a]=(0,s.useState)({loading:!0}),o=(0,s.useRef)(),n=(0,s.useRef)(!0),c=(0,s.useRef)(),i=(0,s.useCallback)(u=>{c.current?.abort();let f=new AbortController;c.current=f,a(d=>({...d,loading:!0})),S({refresh:u,locale:e(),signal:f.signal}).then(d=>{!n.current||f.signal.aborted||(o.current=d,a({value:d,loading:!1}))}).catch(d=>{if(!n.current||f.signal.aborted)return;let l=d instanceof Error?d.message:String(d);a({value:o.current,error:l,loading:!1})})},[e]);(0,s.useEffect)(()=>{n.current=!0,i(!1);let u=window.setInterval(()=>{document.visibilityState==="visible"&&i(!1)},H),f=()=>{document.visibilityState==="visible"&&i(!1)};return document.addEventListener("visibilitychange",f),()=>{n.current=!1,c.current?.abort(),window.clearInterval(u),document.removeEventListener("visibilitychange",f)}},[i]);let m=(0,s.useCallback)(()=>i(!0),[i]);return{...t,refresh:m}}function G(e,t,a,o){let[n,c]=(0,s.useState)();return(0,s.useLayoutEffect)(()=>{if(!e){c(void 0);return}let i=()=>{let m=t.current?.getBoundingClientRect();if(m===void 0)return;let u=a.current?.getBoundingClientRect(),f=u?.width??Y,d=u?.height??220,l=Math.max(v,window.innerWidth-f-v),g=Math.min(Math.max(v,m.left+m.width/2-f/2),l),w=Math.max(v,m.top-d-v);c(p=>p!==void 0&&Math.abs(p.left-g)<.5&&Math.abs(p.top-w)<.5?p:{left:g,top:w})};return i(),window.addEventListener("resize",i),window.addEventListener("scroll",i,!0),()=>{window.removeEventListener("resize",i),window.removeEventListener("scroll",i,!0)}},[e,t,a,o]),n}function q(e,t,a,o){(0,s.useEffect)(()=>{if(!e)return;let n=i=>{i.key==="Escape"&&(o(),t.current?.focus())},c=i=>{let m=i.target;m!==null&&a.current?.contains(m)!==!0&&t.current?.contains(m)!==!0&&o()};return document.addEventListener("keydown",n),document.addEventListener("pointerdown",c,!0),()=>{document.removeEventListener("keydown",n),document.removeEventListener("pointerdown",c,!0)}},[e,t,a,o])}function Z(e){let[t,a]=(0,s.useState)(()=>Date.now());return(0,s.useEffect)(()=>{if(e===null)return;let o=window.setInterval(()=>a(Date.now()),1e3);return()=>window.clearInterval(o)},[e]),e===null?null:Math.max(0,e-t)}function J(e,t){let a=E(e),o=(n,c)=>t(n,{n:c});return a.hours>0?`${o("duration.hour",a.hours)} ${o("duration.minute",a.minutes)}`:a.minutes>0?`${o("duration.minute",a.minutes)} ${o("duration.second",a.seconds)}`:o("duration.second",a.seconds)}function Q(e,t){return e==="account-expired"?t("error.accountExpired"):e==="account-timeout"?t("error.timeout"):e==="account-network"?t("error.network"):e.startsWith("account-")?t("error.account"):e==="timeout"?t("error.timeout"):e==="network"?t("error.network"):e==="malformed"?t("error.malformed"):e==="http-401"||e==="http-403"?t("error.unauthorized"):t("error.generic",{code:e})}function X({value:e,error:t,loading:a,onRefresh:o,t:n}){let c=e.pricing.models,[i,m]=(0,s.useState)(c[0]?.id??""),u=c.find(p=>p.id===i)??c[0],f=Z(e.pricing.nextChangeAt),d=e.pricing.zone,l=e.balance,g=l.status==="ready"||l.status==="error"?l.source:void 0,w=l.status==="ready"?h(l.wallet.total,l.wallet.currency):"\u2014";return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"wp-head",children:[(0,r.jsxs)("span",{className:"wp-title",children:[(0,r.jsx)(N,{}),n("panel.title")]}),(0,r.jsx)("span",{className:"wp-amount","data-wallet-balance":l.status,children:w})]}),l.status==="ready"?(0,r.jsxs)("dl",{className:"wp-rows",children:[(0,r.jsx)("dt",{children:n("panel.toppedUp")}),(0,r.jsx)("dd",{children:h(l.wallet.toppedUp,l.wallet.currency)}),(0,r.jsx)("dt",{children:n("panel.granted")}),(0,r.jsx)("dd",{children:h(l.wallet.granted,l.wallet.currency)})]}):null,l.status==="error"?(0,r.jsx)("p",{className:"wp-error",children:Q(l.code,n)}):null,t!==void 0?(0,r.jsxs)("p",{className:"wp-note",children:[n("panel.stale")," \xB7 ",t]}):null,(0,r.jsx)("div",{className:"wp-rule","aria-hidden":"true"}),(0,r.jsxs)("div",{className:"wp-zone",children:[(0,r.jsx)("span",{className:"wp-chip","data-zone":d,children:n(d==="peak"?"panel.zone.peak":"panel.zone.offPeak")}),(0,r.jsx)("span",{children:f===null?n("panel.zone.flat"):n("panel.zone.switchIn",{time:J(f,n)})})]}),(0,r.jsx)("div",{className:"wp-section-title",children:n("panel.prices")}),c.length>1?(0,r.jsx)("div",{className:"wp-tabs",role:"tablist","aria-label":n("panel.price.model"),children:c.map(p=>(0,r.jsx)("button",{type:"button",role:"tab",className:"wp-tab","data-active":p.id===u?.id,"aria-selected":p.id===u?.id,onClick:()=>m(p.id),children:p.label},p.id))}):null,u!==void 0?(0,r.jsxs)("table",{className:"wp-table",children:[(0,r.jsx)("thead",{children:(0,r.jsxs)("tr",{children:[(0,r.jsx)("th",{scope:"col",children:n("panel.price.bucket")}),(0,r.jsx)("th",{scope:"col","data-active":d==="off-peak",children:n("panel.price.offPeak")}),(0,r.jsx)("th",{scope:"col","data-active":d==="peak",children:n("panel.price.peak")})]})}),(0,r.jsx)("tbody",{children:[{label:n("panel.price.hit"),range:u.hit},{label:n("panel.price.miss"),range:u.miss},{label:n("panel.price.out"),range:u.out}].map(p=>{let[T,W]=p.range;return(0,r.jsxs)("tr",{children:[(0,r.jsx)("td",{children:p.label}),(0,r.jsx)("td",{children:k(T)}),(0,r.jsx)("td",{children:k(W)})]},p.label)})})]}):null,(0,r.jsxs)("div",{className:"wp-foot",children:[(0,r.jsxs)("span",{className:"wp-meta",children:[g!==void 0?(0,r.jsx)("span",{children:n("panel.source",{source:n(g==="account"?"panel.source.account":"panel.source.apiKey")})}):null,(0,r.jsx)("span",{children:l.status==="ready"?n("panel.updated",{time:z(l.at)}):"\u2014"}),(0,r.jsx)("span",{children:n("panel.tableVersion",{version:e.pricing.tableVersion})})]}),(0,r.jsx)("button",{type:"button",className:"wp-refresh",disabled:a,onClick:o,children:n(a?"panel.refreshing":"panel.refresh")})]})]})}function C({t:e,locale:t}){let{value:a,error:o,loading:n,refresh:c}=F(t),[i,m]=(0,s.useState)(!1),u=(0,s.useRef)(null),f=(0,s.useRef)(null),d=G(i,u,f,a),l=(0,s.useCallback)(()=>m(!1),[]);if(q(i,u,f,l),a===void 0||a.balance.status==="unconfigured")return null;let g=o!==void 0||a.balance.status==="error",w=a.balance.status==="ready"?`${e("pill.balance")} ${h(a.balance.wallet.total,a.balance.wallet.currency)}`:`${e("pill.balance")} \u2014`;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("button",{ref:u,type:"button",className:"wp-pill","data-wallet-pill":"pill","data-stale":g,"aria-haspopup":"dialog","aria-expanded":i,onClick:()=>m(p=>!p),children:[(0,r.jsx)(N,{}),(0,r.jsx)("span",{className:"wp-label",children:w}),g?(0,r.jsx)("span",{className:"wp-dot","aria-hidden":"true"}):null]}),i?(0,L.createPortal)((0,r.jsx)("div",{ref:f,className:"wp-panel",role:"dialog","aria-label":e("panel.title"),style:{left:d?.left??-9999,top:d?.top??-9999,visibility:d===void 0?"hidden":"visible"},children:(0,r.jsx)(X,{value:a,error:o,loading:n,onRefresh:c,t:e})}),document.body):null]})}var R=`
[data-wallet-pill='pill'] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  max-width: 100%;
  padding: 1px 8px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 1px);
  font-variant-numeric: tabular-nums;
  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));
  white-space: nowrap;
  cursor: pointer;
}

[data-wallet-pill='pill'] svg {
  width: 14px;
  height: 14px;
  flex: none;
}

@media (hover: hover) {
  [data-wallet-pill='pill']:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-secondary);
  }
}

[data-wallet-pill='pill'][aria-expanded='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}

[data-wallet-pill='pill']:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

.wp-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wp-dot {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-state-warn-primary);
}

.wp-panel {
  position: fixed;
  z-index: 1100;
  box-sizing: border-box;
  width: 320px;
  max-width: calc(100vw - 24px);
  padding: 16px;
  border: 0;
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-specific-menu);
  backdrop-filter: var(--dsw-menu-backdrop-filter);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  cursor: default;
}

.wp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.wp-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.wp-title svg {
  width: 14px;
  height: 14px;
  flex: none;
}

.wp-amount {
  font: var(--dsw-font-m-18);
  font-variant-numeric: tabular-nums;
}

.wp-rows {
  display: grid;
  grid-template-columns: minmax(76px, auto) minmax(0, 1fr);
  gap: 6px 16px;
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
}

.wp-rows dt,
.wp-rows dd {
  min-width: 0;
  margin: 0;
}

.wp-rows dd {
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.wp-rule {
  margin: 10px 0;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}

.wp-zone {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wp-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: 0.5px solid currentColor;
  border-radius: var(--dsw-radius-sm);
  font-size: 11px;
  line-height: 17px;
}

.wp-chip[data-zone='peak'] {
  color: var(--dsw-alias-state-warn-primary);
}

.wp-chip[data-zone='off-peak'] {
  color: var(--dsw-alias-state-success-primary);
}

.wp-section-title {
  margin: 12px 0 6px;
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}

.wp-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.wp-tab {
  padding: 1px 8px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  cursor: pointer;
}

@media (hover: hover) {
  .wp-tab:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-secondary);
  }
}

.wp-tab[data-active='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}

.wp-tab:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 1px;
}

.wp-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

.wp-table th {
  font-weight: 400;
  text-align: right;
}

.wp-table td {
  color: var(--dsw-alias-label-secondary);
  text-align: right;
}

.wp-table th:first-child,
.wp-table td:first-child {
  text-align: left;
}

.wp-table th[data-active='true'] {
  color: var(--dsw-alias-brand-primary);
  font-weight: 500;
}

.wp-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.wp-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary);
}

.wp-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

@media (hover: hover) {
  .wp-refresh:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}

.wp-refresh:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active);
}

.wp-refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wp-refresh:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

.wp-error {
  margin: 8px 0 0;
  color: var(--dsw-alias-state-error-primary);
}

.wp-note {
  margin: 8px 0 0;
  color: var(--dsw-alias-label-tertiary);
}
`;var b="wallet-pill",M="conversation.composer.dock";function ee(e){let t=e.locale.getSnapshot?.();return typeof t?.active=="string"&&t.active.length>0?t.active:typeof navigator<"u"&&typeof navigator.language=="string"&&navigator.language.length>0?navigator.language:"en-US"}function te(e){return{inject:["slots","locale"],apply(t){t.effect(()=>t.locale.register(b,P),"wallet-pill: dictionaries"),t.effect(()=>{if(typeof document>"u")return()=>{};let n=document.createElement("style");return n.dataset.plugin=b,n.dataset.pluginCss=`${b}/pill.css`,n.textContent=R,document.head.appendChild(n),()=>n.remove()},"wallet-pill: pill styles");let a=t.locale.bind(b),o=()=>ee(t);t.slots.inject(M,()=>t.slots.register({name:M,id:b,order:2,locale:b,inject:()=>({t:a,locale:o})},C))}}}return O(ne);})();
return __dshWalletPill.create(require);}});
