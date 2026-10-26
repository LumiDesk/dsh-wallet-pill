window.__ModuleLoader__.load({id:"dsh-wallet-pill",factory(require){
"use strict";var __dshWalletPill=(()=>{var x=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var D=Object.getOwnPropertyNames;var A=Object.prototype.hasOwnProperty;var y=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,a)=>(typeof require<"u"?require:e)[a]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});var j=(t,e)=>{for(var a in e)x(t,a,{get:e[a],enumerable:!0})},I=(t,e,a,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of D(e))!A.call(t,r)&&r!==a&&x(t,r,{get:()=>e[r],enumerable:!(o=$(e,r))||o.enumerable});return t};var W=t=>I(x({},"__esModule",{value:!0}),t);var ee={};j(ee,{create:()=>X});var O={"pill.balance":"\u4F59\u989D","panel.title":"\u8D26\u6237\u4F59\u989D","panel.toppedUp":"\u5145\u503C","panel.granted":"\u8D60\u9001","panel.zone":"\u8BA1\u8D39\u65F6\u6BB5","panel.zone.peak":"\u9AD8\u5CF0","panel.zone.offPeak":"\u7A7A\u95F2","panel.zone.switchIn":"{time}\u540E\u5207\u6362","panel.zone.flat":"\u6682\u65E0\u5207\u6362","panel.prices":"\u4EF7\u76EE\uFF08\u5143 / \u767E\u4E07 token\uFF09","panel.price.model":"\u6A21\u578B","panel.price.bucket":"\u9879\u76EE","panel.price.offPeak":"\u7A7A\u95F2","panel.price.peak":"\u9AD8\u5CF0","panel.price.hit":"\u7F13\u5B58\u547D\u4E2D","panel.price.miss":"\u7F13\u5B58\u672A\u547D\u4E2D","panel.price.out":"\u8F93\u51FA","panel.updated":"\u66F4\u65B0\u4E8E {time}","panel.tableVersion":"\u4EF7\u76EE\u8868 {version}","panel.refresh":"\u5237\u65B0","panel.refreshing":"\u5237\u65B0\u4E2D\u2026","panel.retry":"\u91CD\u8BD5","panel.stale":"\u663E\u793A\u4E0A\u6B21\u8BFB\u6570","error.noKey":"\u672A\u914D\u7F6E DEEPSEEK_API_KEY","error.timeout":"\u4F59\u989D\u63A5\u53E3\u8D85\u65F6","error.network":"\u65E0\u6CD5\u8FDE\u63A5\u4F59\u989D\u63A5\u53E3","error.malformed":"\u4F59\u989D\u63A5\u53E3\u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u6570\u636E","error.unauthorized":"API key \u65E0\u6548\u6216\u5DF2\u8FC7\u671F","error.generic":"\u8BFB\u53D6\u5931\u8D25\uFF08{code}\uFF09","duration.hour":"{n} \u5C0F\u65F6","duration.minute":"{n} \u5206","duration.second":"{n} \u79D2"},B={"pill.balance":"Balance","panel.title":"Account balance","panel.toppedUp":"Topped up","panel.granted":"Granted","panel.zone":"Billing window","panel.zone.peak":"Peak","panel.zone.offPeak":"Off-peak","panel.zone.switchIn":"switches in {time}","panel.zone.flat":"no switch ahead","panel.prices":"Prices (CNY per 1M tokens)","panel.price.model":"Model","panel.price.bucket":"Item","panel.price.offPeak":"Off-peak","panel.price.peak":"Peak","panel.price.hit":"Cache hit","panel.price.miss":"Cache miss","panel.price.out":"Output","panel.updated":"Updated {time}","panel.tableVersion":"Table {version}","panel.refresh":"Refresh","panel.refreshing":"Refreshing\u2026","panel.retry":"Retry","panel.stale":"Showing the last reading","error.noKey":"DEEPSEEK_API_KEY is not configured","error.timeout":"The balance request timed out","error.network":"Cannot reach the balance endpoint","error.malformed":"The balance endpoint returned an unexpected payload","error.unauthorized":"The API key is invalid or expired","error.generic":"Read failed ({code})","duration.hour":"{n}h","duration.minute":"{n}m","duration.second":"{n}s"},P={zh:O,en:B};var l=y("react"),N=y("react-dom");var U="/wallet-pill/state";async function E(t,e){let a=`${U}?refresh=${t?"1":"0"}`,o=await fetch(a,{signal:e,headers:{accept:"application/json"}});if(!o.ok)throw new Error(`state ${o.status}`);let r=await o.json();if(r.ok!==!0||r.value===void 0)throw new Error(r.error?.code??"bad payload");return r.value}var V={CNY:"\xA5",USD:"$"};function _(t){let e=t.toUpperCase();return V[e]??`${e} `}function h(t,e){let a=t.trim(),o=a===""?Number.NaN:Number(a),r=_(e);return Number.isFinite(o)?o>0&&o<.01?`${r}<0.01`:`${r}${o.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:`${r}\u2014`}function k(t){return Number.isFinite(t)?t.toLocaleString("en-US",{maximumFractionDigits:2}):"\u2014"}function S(t){let e=Math.max(0,Math.floor(t/1e3));return{hours:Math.floor(e/3600),minutes:Math.floor(e%3600/60),seconds:e%60}}function z(t){let e=new Date(t),a=o=>String(o).padStart(2,"0");return`${a(e.getHours())}:${a(e.getMinutes())}:${a(e.getSeconds())}`}var n=y("react/jsx-runtime"),H=6e4,K=320,v=8;function C(){return(0,n.jsxs)("svg",{className:"wp-glyph",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[(0,n.jsx)("rect",{x:"3",y:"6",width:"18",height:"13",rx:"3.5"}),(0,n.jsx)("path",{d:"M3 10.5h18"}),(0,n.jsx)("circle",{cx:"17",cy:"14.75",r:"1.25",fill:"currentColor",stroke:"none"})]})}function Y(){let[t,e]=(0,l.useState)({loading:!0}),a=(0,l.useRef)(),o=(0,l.useRef)(!0),r=(0,l.useRef)(),i=(0,l.useCallback)(d=>{r.current?.abort();let s=new AbortController;r.current=s,e(p=>({...p,loading:!0})),E(d,s.signal).then(p=>{!o.current||s.signal.aborted||(a.current=p,e({value:p,loading:!1}))}).catch(p=>{if(!o.current||s.signal.aborted)return;let m=p instanceof Error?p.message:String(p);e({value:a.current,error:m,loading:!1})})},[]);(0,l.useEffect)(()=>{o.current=!0,i(!1);let d=window.setInterval(()=>{document.visibilityState==="visible"&&i(!1)},H),s=()=>{document.visibilityState==="visible"&&i(!1)};return document.addEventListener("visibilitychange",s),()=>{o.current=!1,r.current?.abort(),window.clearInterval(d),document.removeEventListener("visibilitychange",s)}},[i]);let u=(0,l.useCallback)(()=>i(!0),[i]);return{...t,refresh:u}}function F(t,e,a,o){let[r,i]=(0,l.useState)();return(0,l.useLayoutEffect)(()=>{if(!t){i(void 0);return}let u=()=>{let d=e.current?.getBoundingClientRect();if(d===void 0)return;let s=a.current?.getBoundingClientRect(),p=s?.width??K,m=s?.height??220,c=Math.max(v,window.innerWidth-p-v),w=Math.min(Math.max(v,d.left+d.width/2-p/2),c),f=Math.max(v,d.top-m-v);i(b=>b!==void 0&&Math.abs(b.left-w)<.5&&Math.abs(b.top-f)<.5?b:{left:w,top:f})};return u(),window.addEventListener("resize",u),window.addEventListener("scroll",u,!0),()=>{window.removeEventListener("resize",u),window.removeEventListener("scroll",u,!0)}},[t,e,a,o]),r}function G(t,e,a,o){(0,l.useEffect)(()=>{if(!t)return;let r=u=>{u.key==="Escape"&&(o(),e.current?.focus())},i=u=>{let d=u.target;d!==null&&a.current?.contains(d)!==!0&&e.current?.contains(d)!==!0&&o()};return document.addEventListener("keydown",r),document.addEventListener("pointerdown",i,!0),()=>{document.removeEventListener("keydown",r),document.removeEventListener("pointerdown",i,!0)}},[t,e,a,o])}function q(t){let[e,a]=(0,l.useState)(()=>Date.now());return(0,l.useEffect)(()=>{if(t===null)return;let o=window.setInterval(()=>a(Date.now()),1e3);return()=>window.clearInterval(o)},[t]),t===null?null:Math.max(0,t-e)}function Z(t,e){let a=S(t),o=(r,i)=>e(r,{n:i});return a.hours>0?`${o("duration.hour",a.hours)} ${o("duration.minute",a.minutes)}`:a.minutes>0?`${o("duration.minute",a.minutes)} ${o("duration.second",a.seconds)}`:o("duration.second",a.seconds)}function J(t,e){return t==="timeout"?e("error.timeout"):t==="network"?e("error.network"):t==="malformed"?e("error.malformed"):t==="http-401"||t==="http-403"?e("error.unauthorized"):e("error.generic",{code:t})}function Q({value:t,error:e,loading:a,onRefresh:o,t:r}){let i=t.pricing.models,[u,d]=(0,l.useState)(i[0]?.id??""),s=i.find(f=>f.id===u)??i[0],p=q(t.pricing.nextChangeAt),m=t.pricing.zone,c=t.balance,w=c.status==="ready"?h(c.wallet.total,c.wallet.currency):"\u2014";return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("div",{className:"wp-head",children:[(0,n.jsxs)("span",{className:"wp-title",children:[(0,n.jsx)(C,{}),r("panel.title")]}),(0,n.jsx)("span",{className:"wp-amount","data-wallet-balance":c.status,children:w})]}),c.status==="ready"?(0,n.jsxs)("dl",{className:"wp-rows",children:[(0,n.jsx)("dt",{children:r("panel.toppedUp")}),(0,n.jsx)("dd",{children:h(c.wallet.toppedUp,c.wallet.currency)}),(0,n.jsx)("dt",{children:r("panel.granted")}),(0,n.jsx)("dd",{children:h(c.wallet.granted,c.wallet.currency)})]}):null,c.status==="error"?(0,n.jsx)("p",{className:"wp-error",children:J(c.code,r)}):null,e!==void 0?(0,n.jsxs)("p",{className:"wp-note",children:[r("panel.stale")," \xB7 ",e]}):null,(0,n.jsx)("div",{className:"wp-rule","aria-hidden":"true"}),(0,n.jsxs)("div",{className:"wp-zone",children:[(0,n.jsx)("span",{className:"wp-chip","data-zone":m,children:r(m==="peak"?"panel.zone.peak":"panel.zone.offPeak")}),(0,n.jsx)("span",{children:p===null?r("panel.zone.flat"):r("panel.zone.switchIn",{time:Z(p,r)})})]}),(0,n.jsx)("div",{className:"wp-section-title",children:r("panel.prices")}),i.length>1?(0,n.jsx)("div",{className:"wp-tabs",role:"tablist","aria-label":r("panel.price.model"),children:i.map(f=>(0,n.jsx)("button",{type:"button",role:"tab",className:"wp-tab","data-active":f.id===s?.id,"aria-selected":f.id===s?.id,onClick:()=>d(f.id),children:f.label},f.id))}):null,s!==void 0?(0,n.jsxs)("table",{className:"wp-table",children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("th",{scope:"col",children:r("panel.price.bucket")}),(0,n.jsx)("th",{scope:"col","data-active":m==="off-peak",children:r("panel.price.offPeak")}),(0,n.jsx)("th",{scope:"col","data-active":m==="peak",children:r("panel.price.peak")})]})}),(0,n.jsx)("tbody",{children:[{label:r("panel.price.hit"),range:s.hit},{label:r("panel.price.miss"),range:s.miss},{label:r("panel.price.out"),range:s.out}].map(f=>{let[b,T]=f.range;return(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:f.label}),(0,n.jsx)("td",{children:k(b)}),(0,n.jsx)("td",{children:k(T)})]},f.label)})})]}):null,(0,n.jsxs)("div",{className:"wp-foot",children:[(0,n.jsxs)("span",{className:"wp-meta",children:[(0,n.jsx)("span",{children:c.status==="ready"?r("panel.updated",{time:z(c.at)}):"\u2014"}),(0,n.jsx)("span",{children:r("panel.tableVersion",{version:t.pricing.tableVersion})})]}),(0,n.jsx)("button",{type:"button",className:"wp-refresh",disabled:a,onClick:o,children:r(a?"panel.refreshing":"panel.refresh")})]})]})}function L({t}){let{value:e,error:a,loading:o,refresh:r}=Y(),[i,u]=(0,l.useState)(!1),d=(0,l.useRef)(null),s=(0,l.useRef)(null),p=F(i,d,s,e),m=(0,l.useCallback)(()=>u(!1),[]);if(G(i,d,s,m),e===void 0||e.balance.status==="no-key")return null;let c=a!==void 0||e.balance.status==="error",w=e.balance.status==="ready"?`${t("pill.balance")} ${h(e.balance.wallet.total,e.balance.wallet.currency)}`:`${t("pill.balance")} \u2014`;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("button",{ref:d,type:"button",className:"wp-pill","data-wallet-pill":"pill","data-stale":c,"aria-haspopup":"dialog","aria-expanded":i,onClick:()=>u(f=>!f),children:[(0,n.jsx)(C,{}),(0,n.jsx)("span",{className:"wp-label",children:w}),c?(0,n.jsx)("span",{className:"wp-dot","aria-hidden":"true"}):null]}),i?(0,N.createPortal)((0,n.jsx)("div",{ref:s,className:"wp-panel",role:"dialog","aria-label":t("panel.title"),style:{left:p?.left??-9999,top:p?.top??-9999,visibility:p===void 0?"hidden":"visible"},children:(0,n.jsx)(Q,{value:e,error:a,loading:o,onRefresh:r,t})}),document.body):null]})}var M=`
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
`;var g="wallet-pill",R="conversation.composer.dock";function X(t){return{inject:["slots","locale"],apply(e){e.effect(()=>e.locale.register(g,P),"wallet-pill: dictionaries"),e.effect(()=>{if(typeof document>"u")return()=>{};let o=document.createElement("style");return o.dataset.plugin=g,o.dataset.pluginCss=`${g}/pill.css`,o.textContent=M,document.head.appendChild(o),()=>o.remove()},"wallet-pill: pill styles");let a=e.locale.bind(g);e.slots.inject(R,()=>e.slots.register({name:R,id:g,order:2,locale:g,inject:()=>({t:a})},L))}}}return W(ee);})();
return __dshWalletPill.create(require);}});
