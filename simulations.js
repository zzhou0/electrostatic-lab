const ink = '#e4f1e9', mint = '#cfff82', blue = '#71ceff', pink = '#ff948e', gold = '#ffd276', mutedInk = '#9db5ab';
const W=640, H=360, TAU=2*Math.PI;
const fmt = (n, places=2) => Number(n.toFixed(places)).toString();
const signed = n => n>0 ? '+'+fmt(n) : fmt(n);
const limit = (v,min,max) => Math.max(min, Math.min(max,v));

function surface(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1,Math.round(canvas.clientWidth*dpr));
  const height = Math.max(1,Math.round(canvas.clientHeight*dpr));
  if (canvas.width!==width || canvas.height!==height) { canvas.width=width;canvas.height=height; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(width/W,0,0,height/H,0,0);
  ctx.clearRect(0,0,W,H);
  return ctx;
}
function path(c, points, color, width=2, dash=[]) {
  if (!points.length) return;
  c.beginPath(); c.setLineDash(dash); c.strokeStyle=color; c.lineWidth=width;
  c.lineJoin='round'; c.lineCap='round';
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke();c.setLineDash([]);
}
function dot(c,x,y,r,color) {
  c.beginPath(); c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();
}
function ring(c,x,y,r,color,width=2) {
  c.beginPath(); c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function label(c,s,x,y,color=ink,size=20,align='center') {
  c.font='600 '+size+'px system-ui, sans-serif';c.fillStyle=color;
  c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);
}
function arrow(c,x,y,dx,dy,color=mint,width=2) {
  const m=Math.hypot(dx,dy); if(m<2)return;
  const ux=dx/m,uy=dy/m,h=Math.min(10,m*.45),ex=x+dx,ey=y+dy;
  path(c,[[x,y],[ex,ey]],color,width);
  path(c,[[ex-h*ux-h*.5*uy,ey-h*uy+h*.5*ux],[ex,ey],[ex-h*ux+h*.5*uy,ey-h*uy-h*.5*ux]],color,width);
}
function particle(c,x,y,q,r=21) {
  const color=q>0?pink:q<0?blue:mutedInk;
  const glow=c.createRadialGradient(x,y,1,x,y,r*2.25);
  glow.addColorStop(0,color+'75');glow.addColorStop(1,color+'00');
  dot(c,x,y,r*2.25,glow);dot(c,x,y,r,'#192c2d');ring(c,x,y,r,color,2);
  label(c,q>0?'+':q<0?'−':'0',x,y,color,r*.92);
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function grid(c) {
  for(let x=20;x<W;x+=25)for(let y=20;y<H;y+=25)dot(c,x,y,1,'#284041');
}
function fieldAt(x,y,sources) {
  return sources.reduce(([ex,ey],[sx,sy,q])=>{
    const dx=x-sx,dy=y-sy,r=Math.max(4,Math.hypot(dx,dy)), f=q/(r*r*r);
    return [ex+f*dx,ey+f*dy];
  },[0,0]);
}
function fieldLines(sources,count=15) {
  const lines=[];
  for(const [sx,sy,q] of sources) {
    if(q<0)continue;
    for(let i=0;i<count;i++){
      const a=TAU*i/count; let x=sx+16*Math.cos(a),y=sy+16*Math.sin(a);const p=[];
      for(let step=0;step<280;step++){
        p.push([x,y]);const [ex,ey]=fieldAt(x,y,sources),m=Math.hypot(ex,ey);
        if(!m)break;
        x+=4*ex/m;y+=4*ey/m;
        if(x<-6||x>646||y<-6||y>366||sources.some(([u,v,z])=>z<0&&Math.hypot(x-u,y-v)<16))break;
      }
      if(p.length>4)lines.push(p);
    }
  }
  return lines;
}
function renderLines(c,lines,t,color='#80b8a0',animated=true){
  for(const [i,p] of lines.entries()){
    path(c,p,color,1.4);
    const k=Math.floor(p.length*.44);
    arrow(c,...p[k],p[k+3<p.length?k+3:k+1][0]-p[k][0],p[k+3<p.length?k+3:k+1][1]-p[k][1],color,1.6);
    if(animated){const index=Math.floor(((t+i*.137)%1)*(p.length-1));dot(c,...p[index],2.8,mint);}
  }
}
function uniform(c, x1=72,x2=570, y1=70,y2=295,color='#4d7c6e') {
  for(let y=y1;y<=y2;y+=45)arrow(c,x1,y,x2-x1,0,color,1.6);
}
function sceneCaption(c,left,right){
  label(c,left,22,334,mutedInk,17,'left');
  if(right) label(c,right,618,334,mutedInk,17,'right');
}

function heroArt(canvas,variant) {
  const c=surface(canvas);
  if(variant==='energy'){
    rect(c,110,99,420,164,'#dce8d4');
    path(c,[[105,99],[535,99]],'#567e59',8);
    path(c,[[105,263],[535,263]],'#567e59',8);
    for(let i=135;i<535;i+=51){arrow(c,i,128,0,105,'#64886b',2.5);label(c,'+',i,72,'#486e4f',25);label(c,'−',i,291,'#486e4f',25);}
    return;
  }
  const sources=[[194,181,1],[456,181,-1]];
  const cover=variant==='hero';
  if(cover){
    grid(c);
    const g=c.createRadialGradient(330,181,20,330,181,355);
    g.addColorStop(0,'#284e35');g.addColorStop(1,'#12222300');rect(c,0,0,W,H,g);
  }
  renderLines(c,fieldLines(sources,17),.23,cover?'#8ab67d':'#72977c',cover);
  particle(c,194,181,1,cover?33:30);particle(c,456,181,-1,cover?33:30);
}

const fieldCases=[
  [[195,180,1],[445,180,-1]],[[195,180,1],[445,180,1]],[[320,180,1]]
];
const cachedLines=fieldCases.map(s=>fieldLines(s));

const simulations={
  charge(c,[electrons,mass],t){
    ring(c,320,175,104,'#476764');ring(c,320,175,133,'#315351',1);
    for(let i=0;i<6;i++){
      const a=i*TAU/6;particle(c,320+34*Math.cos(a),175+34*Math.sin(a),1,13);
    }
    for(let i=0;i<electrons;i++){
      const a=i*TAU/electrons+t*TAU;particle(c,320+104*Math.cos(a),175+104*Math.sin(a),-1,10);
    }
    sceneCaption(c,'红色：原子核内质子','蓝色：核外电子（示意）');
    const q=6-electrons;return '质子 6 个 · 电子 '+electrons+' 个 · 净电荷 '+signed(q)+'e · 相对比荷 '+signed(q/mass);
  },
  charging(c,[mode,progress],t){
    const p=progress/100, approach=Math.sin(Math.PI*p);
    const x1=155+(mode===2?134*p:(mode===1?93:185)*approach),x2=485-(mode===1?92*approach:0);
    ring(c,x1,170,68,'#728c7b');ring(c,x2,170,77,'#728c7b');
    label(c,mode===2?'带正电的棒':'甲',x1,270);label(c,mode===2?'中性金属球':'乙',x2,270);
    const n=mode===1?limit(Math.floor(5*p),0,2):Math.round(4*p);
    for(let i=0;i<4;i++){
      if(mode===2){
        particle(c,x1+22*(i%2-.5),147+i*15,1,9);
        particle(c,x2-(12+37*p),145+i*16,-1,8);particle(c,x2+18+30*p,145+i*16,1,8);
      }else{
        const y=143+i*18;
        particle(c,x1-27,y,1,8);
        if(mode===1)particle(c,x2+27,y,1,8);
        if(mode===0)particle(c,i<n?x2:x1+20,y,-1,8);
        if(mode===1)particle(c,i<n?x1+20:x2-20,y,-1,8);
      }
    }
    if(p>0&&p<1&&mode!==2) {
      const from=mode===0?x1+68:x2-77,to=mode===0?x2-77:x1+68;
      arrow(c,from,114,to-from,0,mint);dot(c,from+(to-from)*t,114,5,blue);
    }
    sceneCaption(c,'蓝色圆点表示可移动的电子');
    return mode===2?'近端聚集电子，远端电子不足 · 导体净电荷仍为 0':mode===0?'甲 '+signed(n)+'e · 乙 '+signed(-n)+'e · 总净电荷 0':'甲 '+signed(4-n)+'e · 乙 '+signed(n)+'e · 总净电荷 +4e';
  },
  sharing(c,[mode,q1,q2],t){
    if(mode===1){
      const angle=Math.abs(q1)*5*t, spread=angle*1.2;
      particle(c,320,80,q1,29);
      path(c,[[320,110],[320,183]],mutedInk,5);
      for(const sign of [-1,1]){
        path(c,[[320,183],[320+sign*spread,267-angle*.48]],q1<0?blue:q1>0?pink:mutedInk,7);
        if(q1) label(c,q1>0?'+':'−',320+sign*(spread+23),239,q1>0?pink:blue);
      }
      return '用 Q₁ 给验电器充电 · '+(q1?'两片带同种电荷，互相排斥。':'金属箔保持合拢。');
    }
    const s=Math.sin(Math.PI*t), x1=154+112*s,x2=486-112*s;
    const after=t>=.5, mean=(q1+q2)/2;
    for(const [x,q] of [[x1,after?mean:q1],[x2,after?mean:q2]]){
      ring(c,x,165,54,mutedInk);particle(c,x,165,q,23);label(c,signed(q)+' nC',x,246);
    }
    return '接触前 '+signed(q1)+'、'+signed(q2)+' nC · 接触后各 '+signed(mean)+' nC · 总电荷 '+signed(q1+q2)+' nC';
  },
  coulomb(c,[r,q1,q2],t){
    const d=80+r*58,x1=320-d/2,x2=320+d/2,y=141;
    const f=9*Math.abs(q1*q2)/(r*r);
    particle(c,x1,y,q1);particle(c,x2,y,q2);
    label(c,'q₁ = '+signed(q1)+' μC',x1,95);label(c,'q₂ = '+signed(q2)+' μC',x2,95);
    const len=Math.min(88,14+15*Math.sqrt(f))*(.94+.06*Math.sin(t*TAU)),s=Math.sign(q1*q2);
    arrow(c,x1,y+55,-s*len,0,mint,3);arrow(c,x2,y+55,s*len,0,mint,3);
    path(c,[[x1,248],[x2,248]],mutedInk,1,[5,5]); label(c,'r = '+r+' m',320,279);
    sceneCaption(c,'绿色箭头：两个电荷各自的受力');
    return '两力大小均为 '+fmt(f)+' mN · '+(s>0?'相斥':s<0?'相吸':'静电力为零');
  },
  balance(c,[pos],t){
    const x=320+pos*1.65, left=1/(1+pos/100)**2,right=1/(1-pos/100)**2,total=left-right;
    particle(c,155,180,1);particle(c,485,180,1);particle(c,x,180,1,12);
    label(c,'固定 +Q',155,126);label(c,'固定 +Q',485,126);
    arrow(c,x,92,20*left,0,pink,3);arrow(c,x,125,-20*right,0,blue,3);
    arrow(c,x,245,Math.sign(total)*Math.min(147,Math.abs(total)*28),0,mint,3);
    if(!total)ring(c,x,245,6+2*Math.sin(t*TAU),mint);
    sceneCaption(c,'红：左源斥力　蓝：右源斥力','绿：合力');
    return '左源力 '+fmt(left)+' · 右源力 '+fmt(right)+' · 合力 '+signed(total)+'（相对值，向右为正）';
  },
  strength(c,[r,source,test],t){
    const x=174+r*65,e=18000/r**2, q=[1,-1,2][test],dir=source?-1:1;
    particle(c,174,181,dir,25);particle(c,x,181,q,13);
    const len=32+Math.sqrt(e)*.52;
    arrow(c,x,112,dir*len,0,mint,3);arrow(c,x,250,Math.sign(q)*dir*len*(Math.abs(q)===2?1.25:1),0,gold,3);
    label(c,'源电荷 Q',174,222);
    sceneCaption(c,'绿：电场 E⃗','黄：试探电荷受力 F⃗');
    return 'E = '+fmt(e,1)+' N/C · |F| = '+fmt(e*Math.abs(q)/1000,2)+' μN · 两矢量'+(q>0?'同向':'反向');
  },
  superposition(c,[offset,h,type],t){
    const p=[320+offset,238-h*1.48],sources=type===2?Array.from({length:17},(_,i)=>[176+i*18,238,2/17]):[[222,238,1],[418,238,type===1?-1:1]];
    const [ex,ey]=fieldAt(...p,sources),m=Math.hypot(ex,ey);
    const scale=Math.min(620000,120/Math.max(m,1e-7));
    if(type===2)path(c,[[176,238],[464,238]],pink,3);
    for(const [i,source] of sources.entries()){
      const [x,y,q]=source;particle(c,x,y,q,type===2?5:21);
      const [ax,ay]=fieldAt(...p,[source]);
      arrow(c,...p,ax*scale,ay*scale,type===2?'#8f7a74':i===0?pink:blue,type===2?1:2);
    }
    arrow(c,...p,ex*scale,ey*scale,mint,3.5);dot(c,...p,6+Math.sin(t*TAU),gold);
    sceneCaption(c,'黄色：观测点','绿色：合电场');
    return '合场横向分量 '+signed(ex*10000)+' · 纵向分量 '+signed(-ey*10000)+'（相对值，向右、向上为正）';
  },
  lines(c,[mode],t){
    if(mode===3){
      uniform(c);
      for(let y=70;y<=295;y+=45)dot(c,80+480*t,y,3,mint);
    }else{
      renderLines(c,cachedLines[mode],t);
      for(const [x,y,q] of fieldCases[mode])particle(c,x,y,q);
      if(mode<2){dot(c,320,180,6,gold);label(c,'O',320,206,gold);}
    }
    return ['中点 O 的电场向右，场强不为零。','中点 O 的场强为零。','正电荷的电场沿径向向外，离源越远越弱。','匀强电场各点大小和方向都相同。'][mode];
  },
  shield(c,[mode,e],t){
    const color=['#4a7464','#5c8c70','#80ae7e','#aacc87','#d0eb8e'][e-1];
    if(!mode){
      for(let x=50;x<=590;x+=45)for(let y=45;y<=315;y+=45){
        const dx=x-320,dy=y-180,r2=dx*dx+dy*dy;
        if(r2<123*123)continue;
        const correction=112*112/(r2*r2);
        const ex=1+correction*(dx*dx-dy*dy),ey=2*correction*dx*dy;
        arrow(c,x,y,ex*(12+e*2),ey*(12+e*2),color,1.7);
      }
      dot(c,320,180,112,'#101f20');ring(c,320,180,112,'#9cb1a6',10);ring(c,320,180,98,'#496667',2);
      for(let i=-2;i<=2;i++){
        label(c,'−',320-112*Math.cos(i*.28),180+112*Math.sin(i*.28),blue,21);
        label(c,'+',320+112*Math.cos(i*.28),180+112*Math.sin(i*.28),pink,21);
      }
    }else{uniform(c,62,576,70,295,color);dot(c,85+470*t,160,4,mint);}
    dot(c,320,180,7,gold);label(c,'腔内探针',320,214);
    return '外电场 '+e+' · 探针场强 '+(mode?e:0)+'（相对值，示意图）';
  },
  tip(c,[mode,sharp,volts],t){
    if(mode){
      rect(c,104,61,432,12,'#845957');label(c,'带正电的集尘板',320,38);
      for(let i=0;i<8;i++){
        const p=(t+i/8)%1, x=90+p*460, y=Math.max(82,279-p*volts*52);
        particle(c,x,y,-1,8);
      }
      for(let x=140;x<550;x+=50)arrow(c,x,102,0,64,'#597d6d');
      sceneCaption(c,'电场向下，带负电尘粒受力向上');
      return '相对电压 '+volts+' · 带负电尘粒受力趋向正极板（定性演示）';
    }
    const tip=355+sharp*14, edge=volts*sharp, active=edge>=12;
    c.beginPath();c.moveTo(105,113);c.lineTo(284,113);c.lineTo(tip,180);c.lineTo(284,247);c.lineTo(105,247);c.closePath();
    c.fillStyle='#294440';c.fill();c.strokeStyle='#7c9e90';c.lineWidth=3;c.stroke();
    for(let i=0;i<sharp+2;i++){dot(c,tip-10-i*8,180-(i%2?1:-1)*i*3,3.5,pink);}
    for(let i=-2;i<=2;i++){
      const x=tip+12,y=180+i*10;arrow(c,x,y,volts*9,i*16,'#8bbb85',2);
      if(active){const s=(t+Math.abs(i)*.19)%1;dot(c,x+s*95,y+s*i*20,3.2,gold);}
    }
    sceneCaption(c,'亮点：放电示意');
    return '相对场强指标 '+edge+' · '+(active?'达到示意阈值，空气电离。':'低于示意阈值。');
  },
  work(c,[route,test],t){
    const a=[111,235],b=[529,235],q=test?-1:1;
    const nodes=route?[a,[111,107],[342,107],[342,235],b]:[a,b];
    uniform(c,55,584,73,298,'#3e665a');path(c,nodes,gold,3,[7,5]);
    const f=t*(nodes.length-1),i=Math.min(nodes.length-2,Math.floor(f)),s=f-i;
    const x=nodes[i][0]*(1-s)+nodes[i+1][0]*s,y=nodes[i][1]*(1-s)+nodes[i+1][1]*s;
    particle(c,x,y,q,13);label(c,'A',a[0],268);label(c,'B',b[0],268);
    const work=(x-a[0])/(b[0]-a[0])*6*q;
    return '当前位置累计做功 '+signed(work)+' μJ · 到 B 时 W_AB = '+signed(6*q)+' μJ · Eₚ 变化 '+signed(-6*q)+' μJ';
  },
  potential(c,[shift,test],t){
    const a=8+shift,b=2+shift,q=test?-1:1;
    const axis=y=>211-y*8;
    path(c,[[72,axis(0)],[574,axis(0)]],mutedInk,2,[6,6]);label(c,'0 V',67,axis(0),mutedInk,17,'right');
    for(const [x,v,name,color] of [[202,a,'A',pink],[438,b,'B',blue]]){
      rect(c,x-30,Math.min(axis(v),axis(0)),60,Math.max(2,Math.abs(v)*8),color+'63');
      dot(c,x,axis(v),5,color);label(c,name+'：'+signed(v)+' V',x,v<0?axis(v)+21:axis(v)-21,color);
    }
    arrow(c,110,289,420,0,mint,2);
    dot(c,110+409*t,289,3.6,mint);
    sceneCaption(c,'匀强场方向向右','U_AB 始终为 6 V');
    return 'φ_A = '+a+' V · φ_B = '+b+' V · U_AB = 6 V · EₚA = '+signed(a*q)+' μJ';
  },
  equipotential(c,[mode,n],t){
    const a=t*TAU,radii=[44,55,73,97,140],values=[10,8,6,4.5,3.1];
    if(mode){
      uniform(c,53,585,68,293);
      for(let i=1;i<=5;i++){const x=65+i*85;path(c,[[x,42],[x,317]],i===n?gold:'#79a4cc',i===n?3:1.5,[6,5]);}
      dot(c,65+n*85,76+194*(.5-.5*Math.cos(a)),8,gold);
    }else{
      particle(c,320,180,1,21);
      for(let i=0;i<8;i++){const d=i*TAU/8;arrow(c,320+32*Math.cos(d),180+32*Math.sin(d),120*Math.cos(d),120*Math.sin(d),'#517d68');}
      for(const [i,r] of radii.entries())ring(c,320,180,r,i===n-1?gold:'#79a4cc',i===n-1?3:1.5);
      dot(c,320+radii[n-1]*Math.cos(a),180+radii[n-1]*Math.sin(a),8,gold);
    }
    return '探针所在等势线 '+n+' · φ ≈ '+(mode?12-2*n:values[n-1])+' V · 沿线移动 W = 0';
  },
  projection(c,[angle,e],t){
    const a=angle*Math.PI/180, ax=320,ay=235,bx=ax+156*Math.cos(a),by=ay-156*Math.sin(a),d=2*Math.cos(a);
    uniform(c,65,575,74,299,'#3e665a');
    path(c,[[ax,ay],[bx,by]],gold,3);path(c,[[bx,by],[bx,ay]],mutedInk,2,[5,5]);
    arrow(c,ax,ay,bx-ax,0,blue,3);
    dot(c,ax,ay,6,gold);dot(c,bx,by,6,gold);
    const probeX=ax+(bx-ax)*t,probeY=ay+(by-ay)*t;
    path(c,[[probeX,probeY],[probeX,ay]],'#5a9ab2',1.4,[3,4]);
    dot(c,probeX,probeY,4,gold);dot(c,probeX,ay,4,blue);
    label(c,'A',ax,ay+23);label(c,'B',bx,by-20);
    sceneCaption(c,'黄：实际位移 AB','蓝：沿电场方向的投影');
    return 'AB 长 2 m · 有符号投影 '+fmt(d)+' m · U_AB = '+signed(e*d)+' V';
  },
  rc(c,[mode,r],t){
    const time=t*12, tau=r*.6, ratio=Math.exp(-time/tau), current=(mode?-1:1)*8/r*ratio, q=4.8*(mode?ratio:1-ratio);
    path(c,[[58,87],[241,87],[241,148]],mutedInk,2);path(c,[[241,177],[241,239],[58,239],[58,176]],mutedInk,2);
    path(c,[[58,87],[58,147]],mutedInk,2);path(c,[[41,147],[75,147]],pink,3);path(c,[[48,176],[68,176]],blue,3);
    if(mode){rect(c,33,138,50,45,'#102122');path(c,[[58,139],[58,183]],mutedInk,2);}
    path(c,[[219,148],[263,148]],pink,4);path(c,[[219,177],[263,177]],blue,4);
    rect(c,123,77,56,20,'#2d4a45');label(c,'R',151,88,ink,16);
    if(Math.abs(current)>.05)arrow(c,151,119,(mode?-1:1)*45,0,mint,2.5);
    label(c,'电容器',239,273);label(c,'电路示意',110,40,mutedInk);
    const x0=334, y0=169, sx=21, sy=11;
    arrow(c,x0,y0,265,0,mutedInk);arrow(c,x0,278,0,-222,mutedInk);
    const trace=Array.from({length:Math.max(2,Math.ceil(time*8)+1)},(_,i)=>i);
    const pts=trace.map((_,i)=>{const x=time*i/(trace.length-1);return [x0+x*sx,y0-(mode?-1:1)*8/r*Math.exp(-x/tau)*sy];});
    c.beginPath();c.moveTo(x0,y0);pts.forEach(([x,y])=>c.lineTo(x,y));c.lineTo(x0+time*sx,y0);c.closePath();c.fillStyle='#cfff8232';c.fill();
    path(c,pts,mint,2.5);dot(c,...pts.at(-1),4,gold);
    label(c,'I / mA',357,45,ink,17);label(c,'t / s',598,195,ink,17);
    sceneCaption(c,'电源 8 V · 电容 600 μF','阴影：已转移的电荷');
    return 't = '+fmt(time,1)+' s · I = '+signed(current)+' mA · Q = '+fmt(q)+' mC · U = '+fmt(q/.6)+' V · 转移 '+fmt(4.8*(1-ratio))+' mC';
  },
  plates(c,[mode,d,area,epsilon],t){
    const cap=8.854*epsilon*area*.1/d, charge=mode?20:cap*5, voltage=mode?charge/cap:5;
    const half=25+14*d,w=155+area*3,left=320-w/2,right=320+w/2,top=180-half,bottom=180+half;
    rect(c,left,top,w,half*2,epsilon>1?'#243f42':'#17292a');
    path(c,[[left,top],[right,top]],pink,6);path(c,[[left,bottom],[right,bottom]],blue,6);
    const count=limit(Math.round(5+Math.log2(charge/20)*2),2,14);
    for(let i=0;i<count;i++){
      const x=left+16+(w-32)*i/(count-1);
      label(c,'+',x,top-19,pink,18);label(c,'−',x,bottom+19,blue,18);
      arrow(c,x,top+11,0,2*half-22,'#6a9480',1.5);
      dot(c,x,top+11+(2*half-26)*((t+i*.13)%1),2.8,mint);
    }
    if(epsilon>1)label(c,'电介质',320,180,ink,19);
    sceneCaption(c,mode?'已断开电源':'已接电源', '板间箭头表示场方向');
    return 'C = '+fmt(cap)+' pF · Q = '+fmt(charge)+' pC · U = '+fmt(voltage)+' V · E = '+fmt(voltage/d)+' V/mm';
  },
  accelerate(c,[u,d,k],t){
    const left=92,right=left+160+d*66, a=k*u/d,tf=Math.sqrt(2*d/a),v=Math.sqrt(2*k*u);
    path(c,[[left,62],[left,282]],pink,6);path(c,[[right,62],[right,282]],blue,6);
    uniform(c,left+13,right-13,88,267);
    for(const x of [left,right])label(c,x===left?'+':'−',x,46,x===left?pink:blue,22);
    const pos=left+10+(right-left-20)*t*t;
    particle(c,pos,180,1,14);arrow(c,pos,217,80*t,0,gold,3);
    sceneCaption(c,'绿色：电场','黄色：粒子速度');
    return 'a = '+fmt(a)+' m/s² · 当前速度 '+fmt(v*t)+' m/s · 末速度 '+fmt(v)+' m/s · 穿越时间 '+fmt(tf)+' s';
  },
  deflect(c,[u,v],t){
    const a=u/2, length=2, flight=length/v, y=.5*a*flight**2, tan=a*flight/v;
    const x0=86,x1=406,x2=577,y0=177;
    const trajectory=p=>{
      const dx=(x2-x0)*p, x=x0+dx;
      const displacement=x<x1?.5*a*(dx/160/v)**2:y+tan*(x-x1)/160;
      return [x,y0-80*displacement];
    };
    path(c,[[x0,y0-80],[x1,y0-80]],u>0?blue:u<0?pink:mutedInk,5);
    path(c,[[x0,y0+80],[x1,y0+80]],u>0?pink:u<0?blue:mutedInk,5);
    path(c,[[x2,60],[x2,292]],mutedInk,3);path(c,[[x0,y0],[x2,y0]],'#49665e',1,[5,5]);
    const exitY=y0-y*80;
    path(c,[[x0+160,y0],[x1,exitY]],mutedInk,1.2,[4,5]);
    const points=Array.from({length:71},(_,i)=>trajectory(i/70));
    path(c,points,'#578d72',2,[4,5]);path(c,points.slice(0,Math.floor(70*t)+1),mint,3);
    dot(c,...trajectory(t),7,gold);arrow(c,x1,exitY,62,-31*tan,blue,2.5);
    sceneCaption(c,'蓝色：出口瞬时速度','板距 2 m · q/m = 1 C/kg');
    return '板内时间 '+fmt(flight)+' s · 出口偏移 '+signed(y)+' m · 出口偏角 '+signed(Math.atan(tan)*180/Math.PI)+'°（向上为正）';
  },
  scope(c,[scan,wave,amplitude],t){
    const x0=307,y0=176,w=274;
    rect(c,300,55,289,243,'#173630');
    for(let x=313;x<587;x+=23)path(c,[[x,55],[x,297]],'#305146',1);
    for(let y=63;y<296;y+=23)path(c,[[300,y],[589,y]],'#305146',1);
    const signal=p=>wave===2?0:wave===1?(p<.5?1:-1):Math.sin(p*TAU);
    const trace=p=>[x0+(scan?.5:p)*w,y0-amplitude*18*signal(p)];
    const points=Array.from({length:121},(_,i)=>trace(i/120));
    path(c,points,'#5a8b5f',2);path(c,points.slice(0,Math.floor(t*120)+1),mint,3);
    dot(c,...trace(t),7,gold);
    particle(c,81,177,-1,15);arrow(c,105,177,153,0,blue,2);
    path(c,[[146,137],[202,137]],pink,4);path(c,[[146,217],[202,217]],blue,4);
    dot(c,107+t*147,177,3,mint);
    label(c,'电子枪',73,243,mutedInk,17);label(c,'偏转电极',198,267,mutedInk,17);
    sceneCaption(c,'黄色：屏幕上的光点','荧光屏');
    return scan?'水平位置固定 · 亮点随 Y 信号上下移动。':'锯齿扫描让亮点从左向右移动 · Y 信号决定高度。';
  }
};

function drawSimulation(canvas,id,values,t) {
  const c=surface(canvas);grid(c);
  return simulations[id](c,values,t);
}
