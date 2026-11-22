const wireColor='#90ada4';

function resistorSymbol(c,x,y,width=72,color=mint){
  rect(c,x-width/2,y-11,width,22,'#1b3331');
  path(c,[[x-width/2,y-11],[x+width/2,y-11],[x+width/2,y+11],[x-width/2,y+11],[x-width/2,y-11]],color,2);
}
function cellSymbol(c,x,y,color=ink,background='#102122'){
  rect(c,x-14,y-21,28,42,background);
  path(c,[[x-9,y-17],[x-9,y+17]],color,3);
  path(c,[[x+9,y-10],[x+9,y+10]],color,3);
}
function circuitMeter(c,x,y,letter){
  dot(c,x,y,18,'#142827');ring(c,x,y,18,blue,2);label(c,letter,x,y,blue,17);
}
function flowDots(c,points,t,count,color=mint){
  const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
  const total=lengths.reduce((sum,length)=>sum+length,0);
  for(let i=0;i<count;i++){
    let position=((t+i/count)%1+1)%1*total, segment=0;
    while(position>lengths[segment])position-=lengths[segment++];
    const [x,y]=points[segment], [nextX,nextY]=points[segment+1], fraction=position/lengths[segment];
    dot(c,x+(nextX-x)*fraction,y+(nextY-y)*fraction,3.5,color);
  }
}
function chapterCircuitArt(c){
  path(c,[[128,246],[128,108],[512,108],[512,246],[128,246]],'#507b62',8);
  resistorSymbol(c,320,108,150,'#507b62');
  cellSymbol(c,320,246,'#507b62','#edf2e9');
  label(c,'R',320,108,'#ddeadd',18);
  for(const x of [190,228,412,450])dot(c,x,108,8,'#7caa69');
}
function drawAxes(c,{x,y,w,h,xMax,yMax,xLabel,yLabel}){
  for(let i=1;i<=4;i++){
    const xx=x+w*i/4, yy=y-h*i/4;
    path(c,[[xx,y],[xx,y-h]],'#36504b',1);
    path(c,[[x,yy],[x+w,yy]],'#36504b',1);
    label(c,fmt(xMax*i/4,3),xx,y+17,mutedInk,13);
    label(c,fmt(yMax*i/4,3),x-8,yy,mutedInk,13,'right');
  }
  arrow(c,x,y,w+10,0,wireColor);arrow(c,x,y,0,-h-10,wireColor);
  label(c,'0',x-9,y+16,mutedInk,13,'right');
  label(c,xLabel,x+w,y+36,ink,15,'right');
  label(c,yLabel,x-6,y-h-22,ink,15,'left');
  return (u,v)=>[x+w*u/xMax,y-h*v/yMax];
}
function drawGauge(c,x,y,r,fraction,scale='linear'){
  const start=-Math.PI*.84,sweep=Math.PI*.68;
  const point=(f,d)=>[x+d*Math.cos(start+f*sweep),y+d*Math.sin(start+f*sweep)];
  const arc=Array.from({length:41},(_,i)=>point(i/40,r));
  path(c,arc,wireColor,2);
  for(let i=0;i<=20;i++)path(c,[point(i/20,r),point(i/20,r-(i%5===0?10:5))],wireColor,1);
  const marks=scale==='ohm'?[[0,'∞'],[.2,'400'],[.5,'100'],[.8,'25'],[1,'0']]
    :[[0,'0'],[.25,'25'],[.5,'50'],[.75,'75'],[1,'100']];
  for(const [f,value] of marks)label(c,value,...point(f,r+20),ink,15);
  path(c,[[x,y],point(limit(fraction,0,1),r-10)],gold,3);
  dot(c,x,y,7,gold);
  label(c,scale==='ohm'?'Ω 刻度':'满偏百分比 / %',x,y+27,mutedInk,16);
}

const circuitSimulations={
  'source-current'(c,[open,u,seconds],t){
    const left=106,right=534,top=98,bottom=251,gap=210;
    path(c,[[gap-30,top],[left,top],[left,bottom],[right,bottom],[right,top],[gap+30,top]],wireColor,2.5);
    path(c,[[gap-30,top],[gap+30,open?top-31:top]],open?gold:mint,2.6);
    dot(c,gap-30,top,4,wireColor);dot(c,gap+30,top,4,wireColor);
    resistorSymbol(c,381,top);label(c,'6 Ω',381,63);
    cellSymbol(c,320,bottom);
    label(c,'+',293,bottom+29,pink);label(c,'−',347,bottom+29,blue);
    label(c,'电源 '+u+' V',320,bottom+58);
    if(!open){
      arrow(c,293,top-34,46,0,mint,2);
      arrow(c,337,top+34,-46,0,blue,2);
      const externalPath=[[305,bottom],[left,bottom],[left,top],[right,top],[right,bottom],[335,bottom]];
      flowDots(c,externalPath,1-t,9,blue);
      arrow(c,302,bottom-28,36,0,blue,2);
      label(c,'电源内部把电子从正极移向负极',320,bottom-53,mutedInk,16);
    }
    sceneCaption(c,'绿：常规电流方向','蓝：电子漂移方向');
    const i=open?0:u/6;
    return (open?'开关断开，电源两端仍有电压':'闭合回路')+' · I = '+fmt(i,3)+' A · '+seconds+' s 通过截面的电荷量 Q = '+fmt(i*seconds,3)+' C';
  },
  'carrier-flow'(c,[n,area,v],t){
    const middle=177,half=34*Math.sqrt(area), x=102;
    rect(c,x,middle-half,440,2*half,'#24423d');
    path(c,[[x,middle-half],[542,middle-half]],wireColor,2);
    path(c,[[x,middle+half],[542,middle+half]],wireColor,2);
    const cut=402,len=128*v, count=4+3*n, rows=area+1;
    rect(c,cut-len,middle-half,len,2*half,'#57754887');
    path(c,[[cut,middle-half-18],[cut,middle+half+18]],gold,3);
    label(c,'观察截面',cut,middle-half-36,gold);
    for(let row=0;row<rows;row++){
      const y=middle-half+12+(2*half-24)*row/(rows-1);
      for(let j=0;j<count;j++){
        const phase=((j/count+row*.071+t)%1);
        dot(c,x+440*phase,y,3.5,blue);
      }
    }
    arrow(c,cut-len,middle+half+29,len,0,mint);
    label(c,'1 s 内漂移距离 vt',320,middle+half+50,ink,17);
    sceneCaption(c,'蓝点：载流子示意','绿区：1 s 内能够通过截面的柱体');
    return 'I ≈ '+fmt(1.602*n*area*v,3)+' A · 1 s 内通过约 '+fmt(n*area*v,3)+' ×10¹⁹ 个电子；电子方向向右，常规电流向左。';
  },
  'wire-resistance'(c,[material,length,area,temperature],t){
    const rho20=[1.68e-8,9.7e-8,1.1e-6][material];
    const rho=rho20*(1+[.0039,.005,.0004][material]*(temperature-20));
    const resistance=rho*length/(area*1e-6), reference=1;
    path(c,[[70,180],[70,109],[570,109],[570,240],[70,240],[70,180]],wireColor,2);
    const wireLength=126+25*length, height=9+area*42, left=320-wireLength/2;
    rect(c,left,109-height/2,wireLength,height,[gold,'#91abc0',pink][material]);
    label(c,'待测导线',320,60);label(c,'串联参考电阻 1 Ω',320,210);
    resistorSymbol(c,320,240,104);
    cellSymbol(c,160,240);
    flowDots(c,[[80,109],[70,109],[70,240],[570,240],[570,109],[80,109]],t,14,blue);
    sceneCaption(c,'导线长度、粗细和材质随设置变化','两者串联，电流相同');
    return 'R = '+fmt(resistance,3)+' Ω · ρ ≈ '+fmt(rho*1e8,3)+' ×10⁻⁸ Ω·m\n待测导线与参考电阻的电压降之比 = '+fmt(resistance/reference,3)+' : 1';
  },
  'iv-curve'(c,[u,r]){
    const xy=drawAxes(c,{x:96,y:281,w:456,h:190,xMax:12,yMax:4,xLabel:'U / V',yLabel:'I / A'});
    const bulb=voltage=>voltage/(3*(1+.14*voltage));
    path(c,[xy(0,0),xy(12,12/r)],mint,2.6);
    path(c,Array.from({length:61},(_,i)=>xy(i/5,bulb(i/5))),gold,2.6);
    path(c,[xy(u,0),xy(u,Math.max(u/r,bulb(u)))],mutedInk,1.2,[4,4]);
    dot(c,...xy(u,u/r),6,mint);dot(c,...xy(u,bulb(u)),6,gold);
    label(c,'线性电阻',465,45,mint,17);label(c,'灯丝（示意）',466,69,gold,17);
    return 'U = '+u+' V · 线性元件 I = '+fmt(u/r,3)+' A、R = '+r+' Ω\n灯丝 I ≈ '+fmt(bulb(u),3)+' A、该点 U/I ≈ '+fmt(u/bulb(u),2)+' Ω';
  },
  vernier(c,[mode,sample]){
    const n=[10,20,50][mode], k=Math.floor([.2,.61,.34,.82,.45,.96][sample-1]*n);
    const whole=2+sample, reading=whole+k/n;
    const x=46, mainStep=Math.min(25,544/(n+10)), zero=x+reading*mainStep;
    rect(c,33,83,576,70,'#294743');rect(c,zero-8,180,mainStep*(n-1)+16,70,'#304950');
    for(let i=0;i<=Math.floor(551/mainStep);i++){
      const xx=x+i*mainStep, highlight=i===whole+k;
      path(c,[[xx,146],[xx,146-(i%5===0?24:16)]],highlight?gold:ink,highlight?2.5:1);
      if(i<11||i%5===0)label(c,i,xx,110,ink,mainStep<11?10:14);
    }
    for(let j=0;j<=n;j++){
      const xx=zero+j*mainStep*(n-1)/n;
      path(c,[[xx,185],[xx,185+(j%5===0?24:16)]],j===k?gold:blue,j===k?2.5:1);
      if(j%5===0)label(c,j,xx,230,blue,14);
    }
    const aligned=x+(whole+k)*mainStep;
    path(c,[[aligned,146],[aligned,185]],gold,1.6,[3,4]);
    path(c,[[zero,163],[zero,181]],blue,2);
    label(c,'主尺 / mm',97,56);label(c,'游标零线',zero,274,blue,16);
    sceneCaption(c,'黄色：主尺与游标对齐的刻线');
    return '整毫米 '+whole+' mm · 游标第 '+k+' 格对齐 · 精度 '+(1/n)+' mm\n读数 = '+reading.toFixed(mode===0?1:2)+' mm';
  },
  micrometer(c,[fixed,thimble]){
    const step=79, start=83, mid=176, reading=fixed+thimble*.01, seam=start+step*reading;
    rect(c,64,107,seam-64,138,'#294743');rect(c,seam,78,618-seam,194,'#314951');
    path(c,[[64,mid],[610,mid]],mutedInk,2);path(c,[[seam,78],[seam,272]],gold,2);
    for(let half=0;half<=9;half++){
      const xx=start+half*step/2;
      if(xx>seam+1e-7)break;
      const whole=half%2===0;
      path(c,[[xx,mid+(whole?-8:8)],[xx,mid+(whole?-30:30)]],whole?ink:blue,2);
      if(whole)label(c,half/2,xx,131,ink,15);
    }
    for(let i=Math.floor(thimble)-5;i<=Math.ceil(thimble)+5;i++){
      const y=mid+(thimble-i)*14, printed=(i+50)%50, major=printed%5===0;
      path(c,[[seam+5,y],[seam+(major?43:24),y]],major?ink:blue,1.5);
      if(major)label(c,printed,seam+56,y,ink,15);
    }
    label(c,'固定套筒',124,66);label(c,'可动转筒',562,53);
    sceneCaption(c,'蓝色：半毫米刻线与转筒细分','横线：转筒读数基准');
    return '固定刻度 '+fixed.toFixed(1)+' mm · 转筒 '+thimble.toFixed(1)+' 格 × 0.01 mm · 合计 '+reading.toFixed(3)+' mm';
  },
  'resistivity-lab'(c,[length,diameter,rheostat,finite],t){
    const area=Math.PI*(diameter*1e-3)**2/4,rho=1.1e-6, actual=rho*length/area;
    const measured=finite?1/(1/actual+1/50):actual, i=6/(rheostat+measured), u=i*measured;
    path(c,[[44,96],[261,96],[261,253],[44,253],[44,96]],wireColor,2);
    path(c,[[112,96],[112,161],[238,161],[238,96]],wireColor,2);
    circuitMeter(c,77,96,'A');circuitMeter(c,175,161,'V');
    resistorSymbol(c,175,96,76);label(c,'金属丝',175,64,mint,16);
    resistorSymbol(c,203,253,63);arrow(c,185,268,38,-29,gold);
    label(c,'滑动变阻器',204,286,ink,15);cellSymbol(c,91,253);
    dot(c,112,96,4,wireColor);dot(c,238,96,4,wireColor);
    flowDots(c,[[47,96],[259,96],[259,253],[101,253]],t,5);
    const xy=drawAxes(c,{x:340,y:264,w:248,h:180,xMax:.6,yMax:6,xLabel:'I / A',yLabel:'U / V'});
    const end=Math.min(.6,6/measured);
    path(c,[xy(0,0),xy(end,end*measured)],mint,2);
    for(const setting of [10,20,35,50,60]){
      const value=6/(setting+measured);
      dot(c,...xy(value,value*measured),3.5,blue);
    }
    dot(c,...xy(i,u),6,gold);
    return 'I = '+fmt(i,3)+' A · U = '+fmt(u,3)+' V · U–I 斜率 = '+fmt(measured,2)+' Ω\n由读数算得 ρ ≈ '+fmt(measured*area/length*1e6,3)+' ×10⁻⁶ Ω·m（模型值 1.100 ×10⁻⁶ Ω·m）';
  },
  'series-parallel'(c,[parallel,r1,r2,u],t){
    const r=parallel?1/(1/r1+1/r2):r1+r2, i=u/r;
    const i1=parallel?u/r1:i,i2=parallel?u/r2:i;
    const u1=i1*r1,u2=i2*r2;
    const bottom=278,left=110,right=530,top=parallel?83:125;
    const loop=[[305,bottom],[left,bottom],[left,top],[right,top],[right,bottom],[335,bottom]];
    path(c,loop,wireColor,2);
    if(parallel){
      const mid=179;
      path(c,[[left,mid],[right,mid]],wireColor,2);
      dot(c,left,mid,5,wireColor);dot(c,right,mid,5,wireColor);
      flowDots(c,[[left,mid],[right,mid]],t*i2/3,5,blue);
      label(c,'R₂ · '+r2+' Ω',320,mid-31,blue,18);resistorSymbol(c,320,mid,76,blue);
    }else{
      label(c,'R₂ · '+r2+' Ω',428,top-31,blue,18);resistorSymbol(c,428,top,76,blue);
    }
    flowDots(c,loop,t*i1/3,12);
    const x1=parallel?320:212;
    label(c,'R₁ · '+r1+' Ω',x1,top-31,mint,18);resistorSymbol(c,x1,top);
    cellSymbol(c,320,bottom);label(c,u+' V',320,314);
    return 'R总 = '+fmt(r,3)+' Ω · I总 = '+fmt(i,3)+' A · P总 = '+fmt(u*i,3)+' W\nR₁：'+fmt(i1,3)+' A、'+fmt(u1,3)+' V　｜　R₂：'+fmt(i2,3)+' A、'+fmt(u2,3)+' V';
  },
  'meter-convert'(c,[current,voltageRange,currentRange,percent],t){
    const range=current?currentRange:voltageRange, f=percent/100;
    const resistance=current?100/(range-1):1000*range-100;
    path(c,[[45,154],[281,154]],wireColor,2.5);circuitMeter(c,126,154,'G');
    if(current){
      path(c,[[76,154],[76,221],[247,221],[247,154]],wireColor,2);
      resistorSymbol(c,164,221,65);
      if(f)flowDots(c,[[90,221],[237,221]],t,4,blue);
      label(c,'分流电阻',164,254,blue,17);
    }else{
      resistorSymbol(c,218,154,63);label(c,'串联电阻',218,190,mint,17);
    }
    if(f)flowDots(c,[[45,154],[76,154]],t,1,mint);
    drawGauge(c,451,235,103,f);
    return (current?'并联分流电阻 ':'串联分压电阻 ')+fmt(resistance,3)+' Ω · 表头电流 '+fmt(f,3)+' mA\n输入 '+fmt(range*f,3)+(current?' mA':' V')+' · 满偏量程 '+range+(current?' mA':' V');
  },
  multimeter(c,[mode,connection,range,zero]){
    const voltage=[3,15,30][range],ampere=[.06,.3,.6][range],multiplier=[1,10,100][range];
    const testVoltage=6,testCurrent=.12,testResistance=470;
    const resistanceMode=mode===2, shorted=connection===2;
    if(mode===3){
      drawGauge(c,208,247,113,0);
      label(c,'OFF',490,181,mutedInk,26);
      return '已关表 · 测量结束。';
    }
    const correctlyConnected=mode===0?connection===0:mode===1?connection===1:shorted||connection===3;
    const f=correctlyConnected?(mode===0?testVoltage/voltage:mode===1?testCurrent/ampere:shorted?zero?1:.82:zero?1/(1+testResistance/(100*multiplier)):0):0;
    drawGauge(c,208,247,113,f,resistanceMode?'ohm':'linear');
    const left=425,right=552,top=177,mid=223,bottom=268;
    for(const [x,color] of [[left,pink],[right,blue]]){
      dot(c,x,139,5,color);path(c,[[x,144],[x,top]],color,2.3);
    }
    circuitMeter(c,489,139,resistanceMode?'Ω':mode===0?'V':'A');
    path(c,[[left,139],[471,139]],pink,2);path(c,[[507,139],[right,139]],blue,2);
    const wiring=['并联接入','串联接入','表笔短接','接独立电阻'][connection];
    label(c,wiring,490,104,correctlyConnected?mint:gold,19);
    if(connection<2){
      path(c,[[left,top],[left,bottom],[right,bottom],[right,top]],wireColor,2);
      cellSymbol(c,489,bottom);
      if(connection===0){
        path(c,[[left,top],[right,top]],wireColor,2);
        resistorSymbol(c,489,top,56);
        dot(c,left,top,4,wireColor);dot(c,right,top,4,wireColor);
      }else{
        c.save();
        c.translate(right,mid);c.rotate(Math.PI/2);resistorSymbol(c,0,0,44);c.restore();
      }
    }else{
      path(c,[[left,top],[left,mid],[right,mid],[right,top]],wireColor,2);
      if(!shorted)resistorSymbol(c,489,mid,57,correctlyConnected?mint:gold);
    }
    label(c,mode===0?'直流 '+voltage+' V 挡':mode===1?'直流 '+ampere+' A 挡':'欧姆 ×'+multiplier+' 挡',490,303,ink,18);
    if(!correctlyConnected)return ['将电表并联在元件两端。','把电表串联接入回路。','先断开原电源和其他元件，再短接调零或测独立电阻。'][mode];
    if(f>1)return '指针超量程 · 换较高量程。';
    if(!resistanceMode)return mode===0?'读数 6 V · 红表笔接高电势端。':'读数 0.12 A · 电流由红表笔流入。';
    if(shorted)return zero?'指针指向右端 0 Ω · 可以接入待测电阻。':'短接中 · 将欧姆调零切到「当前挡已调零」。';
    return zero?'读数 '+fmt(testResistance/multiplier,2)+' × '+multiplier+' = '+testResistance+' Ω':'当前挡未调零 · 先短接两表笔。';
  },
  'ohm-scale'(c,[mode,zero,r],t){
    const effective=mode===0?0:r, f=mode===2?0:(zero/100)/(1+effective/100);
    drawGauge(c,318,260,144,f,'ohm');
    label(c,'电流越大，欧姆读数越小',318,61,ink,20);
    if(f>0)flowDots(c,[[143,316],[496,316]],t*f,5,blue);
    const state=mode===0?'短接：Rₓ = 0 Ω':mode===1?'接入：Rₓ = '+r+' Ω':'断开：Rₓ → ∞';
    return state+' · 实际电流约为满偏的 '+fmt(f*100,1)+'%'+(zero===100?' · 欧姆零点已校准。':' · 把表笔短接，将调零调到 100%。');
  },
  'circuit-blackbox'(c,[sample,ohm,reverse],t){
    rect(c,239,93,162,142,'#2c4743');
    label(c,'样本 '+['A','B','C'][sample],320,142,ink,22);label(c,'?',320,189,gold,34);
    const leftColor=reverse?pink:blue,rightColor=reverse?blue:pink;
    path(c,[[239,172],[139,172],[139,254],[270,254]],leftColor,2.5);
    path(c,[[401,172],[501,172],[501,254],[369,254]],rightColor,2.5);
    dot(c,239,172,6,leftColor);dot(c,401,172,6,rightColor);
    circuitMeter(c,320,254,ohm?'Ω':'V');
    path(c,[[270,254],[302,254]],leftColor,2);path(c,[[338,254],[369,254]],rightColor,2);
    const direction=reverse?'红左、黑右':'黑左、红右';
    sceneCaption(c,ohm?'模拟指针式欧姆挡 · 黑表笔接内置电池正极':'直流电压挡',direction);
    if(!ohm)return direction+' · 电压读数 '+(sample===0?(reverse?'+3':'−3'):'0')+' V';
    if(sample===0)return '检测到样本有电源 · 停止电阻测量，请切回直流电压挡。';
    const resistance=sample===1?'220 Ω':reverse?'∞（近似）':'约 20 Ω';
    if(sample===1||!reverse)flowDots(c,reverse?[[400,172],[236,172]]:[[236,172],[400,172]],t,4,blue);
    return direction+' · 电阻读数 '+resistance;
  }
};
