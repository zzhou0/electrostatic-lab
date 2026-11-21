const app = document.querySelector('#app');
let dispose = () => {};
const lowMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const key = 'electrostatic-lab-quizzes-v1';

function readAnswers(){
  try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
  catch { return {}; }
}
function storeAnswers(answers){
  try { localStorage.setItem(key,JSON.stringify(answers)); }
  catch { /* The current form still works when storage is unavailable. */ }
}
const chapterName = chapter => chapter.id==='9'?'第九章':'第十章';
const chapterLink = chapter => '#/'+chapter.id;
const topicLink = (chapter,topic) => chapterLink(chapter)+'/'+topic.id;
const quizLink = chapter => chapterLink(chapter)+'/quiz';
const breadcrumb = (chapter,current) => '<div class="crumb"><a href="#/">全部章节</a><span aria-hidden="true">/</span>'+ (current?'<a href="'+chapterLink(chapter)+'">'+chapterName(chapter)+'</a><span aria-hidden="true">/</span><span>'+current+'</span>':'<span>'+chapterName(chapter)+'</span>')+'</div>';

function home(){
  document.title='静电实验室 · 高中物理必修三';
  app.innerHTML=`
    <section class="hero" aria-labelledby="welcome">
      <div class="hero-copy">
        <p class="eyebrow">高中物理 · 必修第三册</p>
        <h1 id="welcome">让看不见的<span>电场动起来</span></h1>
        <p>拖动滑杆、改变电荷，观察电场怎样影响力与能量。看完动画，再用填空检验自己。</p>
        <a class="button primary" href="#/9">从第九章开始</a>
      </div>
      <div class="hero-art"><canvas data-art="hero" aria-hidden="true"></canvas></div>
    </section>
    <section aria-labelledby="chapters">
      <div class="section-title"><h2 id="chapters">选择章节</h2><span>${chapters.reduce((total,chapter)=>total+chapter.topics.length,0)} 个互动实验</span></div>
      <div class="chapter-grid">${chapters.map(chapter=>`
        <a class="chapter-card" href="${chapterLink(chapter)}">
          <div>
            <span class="chapter-label">${chapterName(chapter)}</span>
            <h3>${chapter.name}</h3>
            <p class="meta">${chapter.topics.length} 个动画 · ${chapter.topics.length} 道填空</p>
            <span class="card-cta">进入章节</span>
          </div>
          <canvas data-art="${chapter.icon}" aria-hidden="true"></canvas>
        </a>`).join('')}</div>
    </section>`;
  const draw=()=>app.querySelectorAll('[data-art]').forEach(canvas=>heroArt(canvas,canvas.dataset.art));
  draw(); window.addEventListener('resize',draw);
  dispose=()=>window.removeEventListener('resize',draw);
}

function chapterHome(chapter,quiz=false){
  document.title=chapterName(chapter)+(quiz?' · 知识填空':' · '+chapter.name)+' | 静电实验室';
  app.innerHTML=breadcrumb(chapter)+`
    <section class="chapter-head">
      <span class="chapter-label">${chapterName(chapter)}</span>
      <h1>${chapter.name}</h1><p>${chapter.intro}</p>
    </section>
    <nav class="tabs" aria-label="章节学习方式">
      <a class="button" href="${chapterLink(chapter)}" ${quiz?'':'aria-current="page"'}>知识学习</a>
      <a class="button" href="${quizLink(chapter)}" ${quiz?'aria-current="page"':''}>知识填空</a>
    </nav>
    <section id="chapter-content"></section>`;
  if(quiz){fillQuiz(chapter);return;}
  document.querySelector('#chapter-content').innerHTML=`
    <div class="section-title"><h2>选择知识点</h2><span>${chapter.topics.length} 个实验</span></div>
    <div class="topic-grid">${chapter.topics.map(topic=>`
      <a class="topic-card" href="${topicLink(chapter,topic)}"><strong>${topic.title}</strong><span>打开互动实验</span></a>`).join('')}</div>`;
}

const normalize = s => s.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s。．，−–]/g,x=>x==='−'||x==='–'?'-':'');

function fillQuiz(chapter){
  const chapterContent=document.querySelector('#chapter-content');
  chapterContent.innerHTML=`
    <div class="quiz-head">
      <h2>知识填空</h2>
      <p>填完后检查答案。每题都能打开对应实验复习。</p>
    </div>
    <form id="quiz-form">
      <div class="quiz-list">${chapter.topics.map((topic,i)=>`
        <section class="quiz-card" id="quiz-${topic.id}">
          <h2>${i+1}. ${topic.title}</h2>
          <label for="answer-${topic.id}"><span>${topic.quiz.before}</span>
            <input id="answer-${topic.id}" name="${topic.id}" type="text" autocomplete="off" spellcheck="false" aria-describedby="feedback-${topic.id}" placeholder="填写答案">
            <span>${topic.quiz.after}</span>
          </label>
          <p class="feedback" id="feedback-${topic.id}" aria-live="polite"></p>
          <a class="card-cta" href="${topicLink(chapter,topic)}">复习此实验</a>
        </section>`).join('')}</div>
      <div class="quiz-summary">
        <button type="submit" class="button primary">检查答案</button>
        <button type="button" class="button" id="reveal">查看解析</button>
        <button type="button" class="button secondary" id="clear">清空本章</button>
        <output id="score" aria-live="polite"></output>
      </div>
    </form>`;
  const form=document.querySelector('#quiz-form'), score=document.querySelector('#score');
  const all=readAnswers(), saved=all[chapter.id] || {};
  const rows=chapter.topics.map(topic=>({
    topic, input:form.elements.namedItem(topic.id), card:document.getElementById('quiz-'+topic.id), feedback:document.getElementById('feedback-'+topic.id)
  }));
  for(const row of rows)row.input.value=typeof saved[row.topic.id]==='string'?saved[row.topic.id]:'';
  form.addEventListener('input',event=>{
    const row=rows.find(row=>row.input===event.target);
    if(!row)return;
    saved[row.topic.id]=row.input.value;
    all[chapter.id]=saved;storeAnswers(all);
    delete row.card.dataset.result;
    row.feedback.textContent='';score.textContent='';
  });
  function grade(reveal){
    let right=0,attempted=0;
    for(const {topic,input,card,feedback} of rows){
      const value=normalize(input.value), q=topic.quiz, match=q.answers.some(answer=>normalize(answer)===value);
      if(value)attempted++;
      if(match)right++;
      card.dataset.result=match?'right':value?'wrong':'empty';
      if(match)feedback.textContent='正确。'+q.explanation;
      else if(reveal)feedback.textContent='参考答案：'+q.answers[0]+'。'+q.explanation;
      else feedback.textContent=value?'再试一次。也可以打开对应实验。':'还未作答。';
    }
    score.textContent='答对 '+right+' / '+rows.length+' 题 · 已填 '+attempted+' 题';
  }
  form.addEventListener('submit',event=>{event.preventDefault();grade(false);});
  document.querySelector('#reveal').addEventListener('click',()=>grade(true));
  document.querySelector('#clear').addEventListener('click',()=>{
    form.reset();for(const row of rows){delete row.card.dataset.result;row.feedback.textContent='';delete saved[row.topic.id];}
    delete all[chapter.id];storeAnswers(all);score.textContent='已清空本章填写记录';
  });
}

function lesson(chapter,topic){
  document.title=topic.title+' | 静电实验室';
  const next=chapter.topics[chapter.topics.indexOf(topic)+1];
  app.innerHTML=breadcrumb(chapter,'知识学习')+`
    <div class="topic-head"><span class="chapter-label">${chapterName(chapter)} · ${chapter.name}</span><h1>${topic.title}</h1></div>
    <div class="lesson">
      <figure class="sim">
        <div class="sim-header"><strong>互动演示</strong><div><button id="play" type="button"></button><button id="reset" type="button">重置</button></div></div>
        <canvas id="canvas" role="img" aria-label="${topic.title}的动画示意">${topic.idea}</canvas>
        <figcaption class="readout" id="readout"></figcaption>
      </figure>
      <div class="side">
        <section class="panel"><h2>实验设置</h2>
          ${topic.controls.map((control,i)=>`
            <label class="control" for="control-${i}">
              <span>${control.label}${control.options?'':'<output id="value-'+i+'" for="control-'+i+'"></output>'}</span>
              ${control.options?
                '<select id="control-'+i+'">'+control.options.map((option,j)=>'<option value="'+j+'">'+option+'</option>').join('')+'</select>':
                '<input type="range" id="control-'+i+'" min="'+control.min+'" max="'+control.max+'" step="'+control.step+'" value="'+control.initial+'">'}
            </label>`).join('')}
          <p>${topic.try}</p>
        </section>
        <section class="panel"><h2>看懂原理</h2><strong class="formula">${topic.formula}</strong><p>${topic.idea}</p></section>
      </div>
    </div>
    <div class="lesson-actions">
      <a class="button secondary" href="${quizLink(chapter)}?topic=${topic.id}">做这道填空</a>
      <a class="button primary" href="${next?topicLink(chapter,next):quizLink(chapter)}">${next?'下一知识点':'进入本章填空'}</a>
    </div>`;
  attachSimulation(topic);
}

function attachSimulation(topic){
  const canvas=document.querySelector('#canvas'), readout=document.querySelector('#readout'), play=document.querySelector('#play');
  const inputs=topic.controls.map((_,i)=>document.querySelector('#control-'+i));
  let phase=0,frame=0,previous=0,running=!lowMotion.matches;
  const single=topic.animated||topic.id==='work'||topic.id==='sharing';
  const readouts=topic.controls.map((_,i)=>document.querySelector('#value-'+i));
  const draw=()=>{
    const values=inputs.map(input=>Number(input.value));
    for(const [i,control] of topic.controls.entries()){
      const output=readouts[i];
      if(output)output.value=values[i]+control.unit;
    }
    const text=drawSimulation(canvas,topic.id,values,phase);
    if(readout.textContent!==text)readout.textContent=text;
  };
  const update=()=>{play.textContent=running?'暂停':single&&phase===1?'重播':'播放';};
  function duration(){
    if(topic.id==='rc')return 7000;
    if(topic.id==='accelerate'){
      const [u,d,k]=inputs.map(input=>Number(input.value));
      return 1000+1000*Math.sqrt(2*d*d/(k*u));
    }
    return single?4200:3300;
  }
  function animate(timestamp){
    if(!running)return;
    if(previous)phase+=Math.min(timestamp-previous,50)/duration();
    previous=timestamp;
    if(single&&phase>=1){phase=1;running=false;update();}
    else if(phase>=1)phase%=1;
    draw();
    if(running)frame=requestAnimationFrame(animate);
  }
  function restart(nextRunning){
    cancelAnimationFrame(frame);running=nextRunning;previous=0;
    draw();update();
    if(running)frame=requestAnimationFrame(animate);
  }
  inputs.forEach((input,i)=>{
    input.value=topic.controls[i].initial;
    input.addEventListener('input',()=>{
      if(single){phase=0;restart(!lowMotion.matches);}
      else draw();
    });
  });
  play.addEventListener('click',()=>{if(phase===1)phase=0;restart(!running);});
  document.querySelector('#reset').addEventListener('click',()=>{
    inputs.forEach((input,i)=>{input.value=topic.controls[i].initial;});
    phase=0;restart(!lowMotion.matches);
  });
  window.addEventListener('resize',draw);
  restart(running);
  dispose=()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',draw);};
}

function route(){
  dispose();dispose=()=>{};
  const [path,params]=location.hash.slice(1).split('?');
  const [,chapterId,topicId]=path.split('/');
  const chapter=chapters.find(item=>item.id===chapterId);
  document.querySelectorAll('.bar nav a').forEach(link=>{
    if(chapter&&link.getAttribute('href')===chapterLink(chapter))link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  });
  if(!chapter)home();
  else if(topicId==='quiz')chapterHome(chapter,true);
  else {
    const topic=chapter.topics.find(item=>item.id===topicId);
    if(topic)lesson(chapter,topic);
    else chapterHome(chapter);
  }
  window.scrollTo(0,0);
  if(topicId==='quiz'){
    const target=new URLSearchParams(params||'').get('topic');
    const destination=target&&document.getElementById('quiz-'+target);
    if(destination)destination.scrollIntoView({block:'start'});
  }
}
window.addEventListener('hashchange',route);
route();
