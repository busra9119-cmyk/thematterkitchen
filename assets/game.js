/* The Matter Kitchen v19 — eight illustrated, automatic turn-skipping kitchen surprises. */
'use strict';
const chefs=[
  {name:'Coco',slug:'coco',celebrationDuration:960,file:'station_coco.webp',color:'#49b9f9',incorrectDuration:1440,cookingDurations:[1800, 1800, 1800, 1920, 1800, 1320],gifs:{idle:'assets/coco_idle.webp',incorrect:'assets/coco_incorrect.gif',celebration:'assets/coco_celebration.gif',steps:['assets/coco_step_1.gif','assets/coco_step_2.gif','assets/coco_step_3.gif','assets/coco_step_4.gif','assets/coco_step_5.gif','assets/coco_step_6.gif']}},
  {name:'Davy',slug:'davy',celebrationDuration:1270,file:'station_davy.webp',color:'#71ce59',incorrectDuration:1080,cookingDurations:[1320, 1380, 1920, 1320, 1980, 2100],gifs:{idle:'assets/davy_idle.webp',incorrect:'assets/davy_incorrect.gif',celebration:'assets/davy_celebration.gif',steps:['assets/davy_step_1.gif','assets/davy_step_2.gif','assets/davy_step_3.gif','assets/davy_step_4.gif','assets/davy_step_5.gif','assets/davy_step_6.gif']}},
  {name:'Boris',slug:'boris',celebrationDuration:1020,file:'station_boris.webp',color:'#f5c844',incorrectDuration:1380,cookingDurations:[1440, 2100, 1920, 2400, 2160, 2100],gifs:{idle:'assets/boris_idle.webp',incorrect:'assets/boris_incorrect.gif',celebration:'assets/boris_celebration.gif',steps:['assets/boris_step_1.gif','assets/boris_step_2.gif','assets/boris_step_3.gif','assets/boris_step_4.gif','assets/boris_step_5.gif','assets/boris_step_6.gif']}},
  {name:'Pedro',slug:'pedro',celebrationDuration:1080,file:'station_pedro.webp',color:'#ae85fb',incorrectDuration:1440,cookingDurations:[1800, 1800, 2100, 2400, 2100, 1800],gifs:{idle:'assets/pedro_idle.webp',incorrect:'assets/pedro_incorrect.gif',celebration:'assets/pedro_celebration.gif',steps:['assets/pedro_step_1.gif','assets/pedro_step_2.gif','assets/pedro_step_3.gif','assets/pedro_step_4.gif','assets/pedro_step_5.gif','assets/pedro_step_6.gif']}}
];
const cookingLayouts={"coco":[[-1,32,102,33.6,5],[0,32,100,33.6,5],[-1,32,102,33.6,5],[0,31.3,100,34.4,5],[0,31.4,100,34.2,5],[-1,31.0,102,38.0,2]],"davy":[[-3,29.2,106,36.4,5],[-3,30.9,106,35.2,5],[-2,31,104,35,5],[-3,32,106,33.6,5],[-3,30.9,106,35.2,5],[-1,30.0,102,36.5,2]],"boris":[[-1,31.3,102,34.2,5],[0,31.7,100,34,5],[0,31.5,100,34.2,5],[0,31.4,100,34.5,5],[0,31.4,100,34.5,5],[-1,31,102,35.5,2]],"pedro":[[0,31.7,100,34.0,5],[0,31.5,100,34.5,5],[0,31.6,100,34.4,5],[0,31.8,100,34.2,5],[0,31.5,100,34.5,5],[-1,31,102,35.5,2]]};
const celebrationLayouts={"coco":[4,28.5,92,43.5,5],"davy":[2,29.5,96,41.5,5],"boris":[2,29.5,96,41.5,5],"pedro":[2,29.0,96,42.0,5]};
const stage=document.getElementById('stage');
const teams=document.getElementById('teams');
const panel=document.getElementById('question-panel');
const shade=document.getElementById('shade');
const flash=document.getElementById('flash');
const score=[0,0,0,0];
const finaleOverlay=document.getElementById('grand-finale');
const finaleViewBtn=document.getElementById('view-finale');
let finaleShownOnce=false;
function showFinale(){
  if(!score.every(n=>n===6)||reactionBusy||currentEvent||active!==-1)return;
  finaleShownOnce=true;
  finaleViewBtn.hidden=false;
  finaleOverlay.hidden=false;
  MatterAudio.setDuck(.22);
  MatterAudio.play('grand_finale');
  document.getElementById('finale-play-again').focus({preventScroll:true});
}
function hideFinale(){
  finaleOverlay.hidden=true;
  MatterAudio.setDuck(1);
  finaleViewBtn.focus({preventScroll:true});
}
function maybeShowFinale(){
  if(score.every(n=>n===6)&&!finaleShownOnce)showFinale();
}
document.getElementById('finale-back').addEventListener('click',hideFinale);
finaleViewBtn.addEventListener('click',showFinale);
document.getElementById('finale-play-again').addEventListener('click',()=>resetGame(false));
const positions=[14.9,29.2,43.65,58.05,72.6,87.25];
const STORAGE_KEY='the-matter-kitchen-editor-v25-60-noreading';
const originalBank=structuredClone(window.DEFAULT_QUESTION_BANK);
let bank=loadBank();
let active=-1, reactionBusy=false, replayCounter=0;
const freezeTimers=Array(chefs.length).fill(null);
let currentQuestion=null, questionDeck=[], seenIds=new Set();
let turnCount=0, questionCycle=1;
let editingBank=null, editingTab='regular',editingId=null;
// Surprise questions are not mixed into the regular question deck.
const SURPRISE_SETTINGS_KEY='matter-kitchen-surprises-enabled-v1';
let surprisesEnabled=(()=>{try{return localStorage.getItem(SURPRISE_SETTINGS_KEY)!=='false'}catch(_){return true}})();
let currentEvent=null, questionMode='regular';
const MAX_SURPRISES_PER_TEAM=2;
const teamSurpriseCounts=Array(chefs.length).fill(0);
const teamSurprisedSteps=Array.from({length:chefs.length},()=>new Set());
const surpriseOverlay=document.getElementById('surprise-overlay');
const surpriseSetting=document.getElementById('surprises-enabled');
surpriseSetting.checked=surprisesEnabled;
const STEP_SURPRISES={
  coco:{
    2:{event:'Berry Spill',card:'coco_berries.png',text:'Oops! Coco dropped the berries. She needs a moment to pick them up.'},
    4:{event:'Syrup Spill',card:'coco_syrup.png',text:'Oh no! Coco spilled syrup on the pancakes. She needs time to tidy up.'}
  },
  davy:{
    4:{event:'Power Outage',card:'davy_power.png',text:'Oh no! Davy’s chocolate freezer has no power. He needs to wait a little.'},
    5:{event:'Sprinkles Spill',card:'davy_sprinkles.png',text:'Oops! Davy knocked over the sprinkles. He needs time to clean up.'}
  },
  boris:{
    2:{event:'Missing Ingredient',card:'boris_ingredient.png',text:'Boris needs an ingredient for his soup, but it is missing. He has to find it.'},
    4:{event:'Soup Spill',card:'boris_soup.png',text:'Oh no! Boris’s soup boiled over. He needs time to clean up.'}
  },
  pedro:{
    2:{event:'Blender Trouble',card:'pedro_blender.png',text:'The blender lid popped off! Pedro needs a moment to fix it.'},
    4:{event:'Missing Scoop',card:'pedro_scoop.png',text:'Pedro cannot find the ice cream scoop. He needs time to look for it.'}
  }
};
function getTeamSurprise(i){
  if(!surprisesEnabled||score[i]===6||teamSurpriseCounts[i]>=MAX_SURPRISES_PER_TEAM)return null;
  const chef=chefs[i];
  const nextStep=score[i]+1;
  const config=STEP_SURPRISES[chef.slug]?.[nextStep];
  if(!config||teamSurprisedSteps[i].has(nextStep))return null;
  return {chef:i,step:nextStep,...config};
}
function showSurpriseIntro(){
  if(!currentEvent)return;
  document.getElementById('surprise-title').textContent='KITCHEN SURPRISE!';
  document.getElementById('surprise-description').textContent=currentEvent.text;
  const card=document.getElementById('surprise-card-image');
  card.src='assets/surprise_cards/'+currentEvent.card;
  card.alt='Illustration of '+chefs[currentEvent.chef].name+' and a cooking problem';
  surpriseOverlay.classList.toggle('power-event',currentEvent.event==='Power Outage');
  surpriseOverlay.hidden=false;
  MatterAudio.setDuck(.22);
  MatterAudio.surprise(currentEvent.card);
  document.getElementById('surprise-next').focus({preventScroll:true});
}
function triggerSurprise(i){
  const config=getTeamSurprise(i);
  if(!config)return false;
  teamSurpriseCounts[i]++;
  teamSurprisedSteps[i].add(config.step);
  currentEvent=config;
  showSurpriseIntro();
  return true;
}
function resolveSurprise(){
  if(!currentEvent)return;
  currentEvent=null;
  surpriseOverlay.hidden=true;
  surpriseOverlay.classList.remove('power-event');
  MatterAudio.setDuck(1);
}
document.getElementById('surprise-next').addEventListener('click',()=>{MatterAudio.play('next_team');resolveSurprise();});
surpriseSetting.addEventListener('change',()=>{
  surprisesEnabled=surpriseSetting.checked;
  try{localStorage.setItem(SURPRISE_SETTINGS_KEY,String(surprisesEnabled));}catch(_){ }
});

function normalizeBank(data){
  if(!data || !Array.isArray(data.regular) || !Array.isArray(data.surprises))throw new Error('Expected regular and surprises arrays.');
  const seen=new Set();
  const clean=(arr,prefix)=>arr.map((q,i)=>{
    if(!q || typeof q!=='object') throw new Error('Invalid question at index '+i);
    const o={};
    for(const k of ['id','topic','event','question','passage','answer','skill','visualBrief','image','teacherNotes'])o[k]=String(q[k]??'');
    o.enabled=q.enabled!==false;
    if(!o.id) o.id=prefix+(i+1).toString().padStart(prefix==='Q'?3:2,'0');
    if(seen.has(o.id))throw new Error('Duplicate question ID: '+o.id);
    seen.add(o.id);
    return o;
  });
  return {regular:clean(data.regular,'Q'),surprises:clean(data.surprises,'S')};
}
function loadBank(){
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw)return normalizeBank(JSON.parse(raw));
  }catch(err){console.warn('Saved questions could not be loaded:',err)}
  return normalizeBank(originalBank);
}
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}
function enabledRegular(){return bank.regular.filter(q=>q.enabled && q.question.trim() && q.answer.trim())}
function rebuildDeck(){
  questionDeck=shuffle(enabledRegular().filter(q=>!seenIds.has(q.id)).map(q=>q.id));
}
function getNextQuestion(){
  if(!questionDeck.length){
    // Avoid repeating a regular question until every enabled question has been used.
    seenIds.clear(); questionCycle++;
    rebuildDeck();
  }
  const nextId=questionDeck.pop();
  return bank.regular.find(q=>q.id===nextId)||null;
}
function returnPendingQuestion(){
  if(currentQuestion && !seenIds.has(currentQuestion.id) && !questionDeck.includes(currentQuestion.id))questionDeck.push(currentQuestion.id);
  currentQuestion=null;
}
function markQuestionUsed(){
  if(!currentQuestion)return;
  seenIds.add(currentQuestion.id);
  turnCount++;
  // Every four completed regular questions begins a new round.
  if(turnCount%4===0)shuffle(questionDeck);
  updateRoundLabel();
  currentQuestion=null;
  questionMode='regular';
}
function updateRoundLabel(){
  const round=Math.floor(turnCount/4)+1;
  document.getElementById('round-chip').textContent='ROUND '+round;
  document.getElementById('round-chip').title='Questions do not repeat until the active bank has been used.';
}
function draw(){
  teams.innerHTML='';
  chefs.forEach((chef,i)=>{
    const team=document.createElement('div');
    team.className='team';team.dataset.chef=chef.slug;
    team.style.setProperty('--i',i);
    team.style.setProperty('--team-color',chef.color);
    team.setAttribute('role','button');team.tabIndex=0;
    team.innerHTML=`<div class="track"><img src="assets/progress_tracker.webp" alt=""><div class="markers"></div></div><div class="chef-slot"><img class="chef-image" alt=""></div><img class="station-img" src="assets/${chef.file}" alt="">`;
    const markers=team.querySelector('.markers');
    for(let j=0;j<6;j++){
      const m=document.createElement('span');m.className='lit';
      m.style.left=positions[j]+'%';markers.appendChild(m);
    }
    team.addEventListener('click',()=>openQuestion(i));
    team.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openQuestion(i)}});
    teams.appendChild(team);
    updateProgress(i);restoreCurrentStage(i);
  });
}
function updateProgress(i){
  const team=teams.children[i];
  team.setAttribute('aria-label',chefs[i].name+' cooking station, '+score[i]+' of 6 steps completed');
  [...team.querySelectorAll('.lit')].forEach((m,j)=>m.classList.toggle('on',j<score[i]));
  team.classList.toggle('finished',score[i]===6);
}
function displayImage(i,url,animate=false){
  // Cancel any previous freeze before changing the same chef's artwork.
  if(freezeTimers[i]!==null){clearTimeout(freezeTimers[i]);freezeTimers[i]=null;}
  const img=teams.children[i].querySelector('.chef-image');
  const next=img.cloneNode(false);
  next.src=animate?url+(url.includes('?')?'&':'?')+'replay='+(++replayCounter):url;
  next.style.display='block';img.replaceWith(next);
  return next;
}
function lastFrame(gifPath){
  return gifPath.replace(/\.gif$/i,'_last.png');
}
function playOnceAndHold(i,gifPath,durationMs,onFinished,onStarted){
  // A GIF can't be paused reliably in HTML. Use the original GIF for its
  // exact measured length, then replace it with a PNG of its final frame.
  const image=displayImage(i,gifPath,true);
  let started=false,finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;
    if(teams.children[i]?.querySelector('.chef-image')!==image)return;
    displayImage(i,lastFrame(gifPath));
    if(onFinished)onFinished();
  };
  const start=()=>{
    if(started||finished||teams.children[i]?.querySelector('.chef-image')!==image)return;
    started=true;
    if(onStarted)onStarted();
    freezeTimers[i]=setTimeout(finish,durationMs);
  };
  // Start counting once the animation has loaded; this matters on slow Wi-Fi.
  if(image.complete && image.naturalWidth>0)start();
  else{
    image.addEventListener('load',start,{once:true});
    image.addEventListener('error',finish,{once:true});
  }
}
function setCookingLayout(i,step){
  const team=teams.children[i];
  const [left,top,width,height,depth]=cookingLayouts[chefs[i].slug][step-1];
  team.style.setProperty('--cook-left',left+'%');team.style.setProperty('--cook-top',top+'%');
  team.style.setProperty('--cook-width',width+'%');team.style.setProperty('--cook-height',height+'%');
  team.style.setProperty('--cook-depth',String(depth));
}
function setCelebrationLayout(i){
  const team=teams.children[i];
  const [left,top,width,height,depth]=celebrationLayouts[chefs[i].slug];
  team.style.setProperty('--cele-left',left+'%');team.style.setProperty('--cele-top',top+'%');
  team.style.setProperty('--cele-width',width+'%');team.style.setProperty('--cele-height',height+'%');
  team.style.setProperty('--cele-depth',String(depth));
}
function restoreCurrentStage(i){
  const team=teams.children[i],chef=chefs[i],step=score[i];
  team.classList.remove('reacting','working-active','celebrating');
  if(step===6 && chef.gifs.celebration){
    team.classList.remove('cooking');team.classList.add('celebrating');
    team.dataset.step='6';setCelebrationLayout(i);
    displayImage(i,lastFrame(chef.gifs.celebration));
  }else if(step>0 && chef.gifs.steps[step-1]){
    team.classList.add('cooking');team.dataset.step=String(step);
    setCookingLayout(i,step);
    // Never replay yesterday's cooking stage after a wrong answer.
    displayImage(i,lastFrame(chef.gifs.steps[step-1]));
  }else{
    team.classList.remove('cooking');delete team.dataset.step;
    displayImage(i,chef.gifs.idle);
  }
}
// v27: grow short questions and automatically fit longer or teacher-edited ones.
function fitQuestionFont(){
  const content=document.getElementById('question-content');
  const text=document.getElementById('question-text');
  const copy=document.getElementById('question-copy');
  if(!text.textContent || !content.clientWidth)return;
  // Stage-relative sizing keeps the typography in proportion to the card
  // whether the projector is 16:9 or the game fills a different aspect ratio.
  const stageWidth=stage.getBoundingClientRect().width;
  const words=text.textContent.trim().split(/\s+/).length;
  const chars=text.textContent.length;
  const picture=content.classList.contains('with-picture');
  const passage=content.classList.contains('with-passage');
  let target;
  if(passage) target=Math.min(58,stageWidth*.036);
  else if(picture) target=Math.min(60,stageWidth*.036);
  else if(chars<=22 && words<=5) target=Math.min(82,stageWidth*.050);
  else if(chars<=36) target=Math.min(76,stageWidth*.046);
  else target=Math.min(66,stageWidth*.041);
  // Readability floor scales down on a narrow screen; it does not force overflow.
  const floor=Math.max(20,Math.min(32,stageWidth*.025));
  text.style.fontSize=target.toFixed(1)+'px';
  for(let n=0;n<48;n++){
    if((copy.scrollHeight<=content.clientHeight-12 && text.scrollWidth<=text.clientWidth+8) || target<=floor)break;
    target-=2;
    text.style.fontSize=target.toFixed(1)+'px';
  }
}
window.addEventListener('resize',()=>{if(active!==-1)fitQuestionFont()});
if(document.fonts?.ready)document.fonts.ready.then(()=>{if(active!==-1)fitQuestionFont()});
function setQuestionContent(q,i){
  const content=document.getElementById('question-content');
  const passage=document.getElementById('passage');
  const visual=document.getElementById('question-visual');
  const text=document.getElementById('question-text');
  passage.textContent=q.passage||'';
  passage.hidden=!q.passage;
  text.textContent=q.question;
  content.classList.toggle('with-passage',Boolean(q.passage));
  content.classList.toggle('with-picture',Boolean(q.image));
  if(q.image){visual.src=q.image;visual.alt=q.visualBrief||'Question illustration';}else visual.removeAttribute('src');
}
function openQuestion(i){
  if(!finaleOverlay.hidden||reactionBusy||active!==-1||score[i]===6||currentEvent||!surpriseOverlay.hidden||!document.getElementById('settings-modal').hidden)return;
  const q=getNextQuestion();
  if(!q){alert('No active regular questions. Open Settings to add or enable questions.');return;}
  questionMode='regular';currentQuestion=q;active=i;
  teams.children[i].classList.add('active');
  setQuestionContent(q,i);
  panel.classList.add('open');panel.setAttribute('aria-hidden','false');
  shade.classList.add('open');stage.classList.add('question-open');
  requestAnimationFrame(fitQuestionFont);
  MatterAudio.setDuck(.58);
  panel.focus({preventScroll:true});
}
function closeQuestion(putBack=true){
  if(active===-1)return;
  const old=active;active=-1;
  if(putBack){returnPendingQuestion();}
  panel.classList.remove('open');panel.setAttribute('aria-hidden','true');
  shade.classList.remove('open');stage.classList.remove('question-open');
  MatterAudio.setDuck(1);
  teams.children[old]?.classList.remove('active');
  teams.children[old]?.focus({preventScroll:true});
}
function flashAnswer(good){
  flash.className=good?'flash yes':'flash no';
  setTimeout(()=>flash.className='flash',520);
}

function answer(isCorrect){
  if(active===-1||reactionBusy)return;
  const idx=active,chef=chefs[idx],team=teams.children[idx];
  markQuestionUsed();closeQuestion(false);
  reactionBusy=true;flashAnswer(isCorrect);
  if(isCorrect){
    if(triggerSurprise(idx)){
      reactionBusy=false;
      return;
    }
    MatterAudio.play('correct');
    const nextStep=score[idx],cookingGif=chef.gifs.steps[nextStep];
    if(cookingGif){
      team.classList.remove('reacting','celebrating');
      team.classList.add('cooking','working-active');
      team.dataset.step=String(nextStep+1);
      setCookingLayout(idx,nextStep+1);
      playOnceAndHold(idx,cookingGif,chef.cookingDurations?.[nextStep]??1800,()=>{
        score[idx]=Math.min(6,score[idx]+1);
        updateProgress(idx);team.classList.remove('working-active');
        if(score[idx]===6 && chef.gifs.celebration){
          team.classList.remove('cooking','reacting');team.classList.add('celebrating');
          setCelebrationLayout(idx);
          playOnceAndHold(idx,chef.gifs.celebration,chef.celebrationDuration,()=>{
            reactionBusy=false;
            MatterAudio.setDuck(1);
            maybeShowFinale();
          },()=>{
            MatterAudio.setDuck(.18);
            MatterAudio.celebrate(chef.slug);
          });
        }else reactionBusy=false;
      },()=>MatterAudio.cooking(chef.slug,nextStep+1));
    }else{score[idx]=Math.min(6,score[idx]+1);updateProgress(idx);restoreCurrentStage(idx);reactionBusy=false;maybeShowFinale();}
  }else{
    team.classList.remove('cooking','working-active','celebrating');team.classList.add('reacting');
    delete team.dataset.step;
    playOnceAndHold(idx,chef.gifs.incorrect,chef.incorrectDuration,()=>{
      restoreCurrentStage(idx);reactionBusy=false;
    },()=>MatterAudio.play('incorrect'));
  }
}
shade.addEventListener('click',()=>closeQuestion(true));
document.getElementById('correct').addEventListener('click',()=>answer(true));
document.getElementById('incorrect').addEventListener('click',()=>answer(false));

// ----- Teacher Settings: edit question, passage, answer, image, topic, enabled -----
const modal=document.getElementById('settings-modal');
const editorList=document.getElementById('editor-list');
const editorForm=document.getElementById('editor-form');
const editFields={id:'edit-id',topic:'edit-topic',event:'edit-event',question:'edit-question',passage:'edit-passage',answer:'edit-answer',skill:'edit-skill',enabled:'edit-enabled',visualBrief:'edit-visual-brief',image:'edit-image',teacherNotes:'edit-notes'};
const editNodes=Object.fromEntries(Object.entries(editFields).map(([key,id])=>[key,document.getElementById(id)]));
function editorItems(){return editingBank[editingTab]}
function getEditingQuestion(){return editorItems().find(q=>q.id===editingId)||null}
function setEditorStatus(message,isError=false){
  const el=document.getElementById('editor-status');el.textContent=message;el.classList.toggle('error',isError);
}
function setEditorTab(tab){
  editingTab=tab;editingId=editorItems()[0]?.id||null;
  document.querySelectorAll('.editor-tab').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));
  document.getElementById('edit-event-row').hidden=tab!=='surprises';
  document.getElementById('bank-hint').textContent=tab==='surprises'
    ? 'Kitchen Surprise messages are illustrated events, not extra quiz questions.'
    : 'Regular questions are shuffled after every four completed turns. No repeats until the unused bank is exhausted.';
  document.getElementById('editor-search').value='';
  updateCategoryFilter();refreshEditorList();showEditorQuestion();
}
function updateCategoryFilter(){
  const select=document.getElementById('editor-topic-filter');
  select.replaceChildren(new Option('All topics',''));
  [...new Set(editorItems().map(q=>q.topic).filter(Boolean))].sort().forEach(t=>select.add(new Option(t,t)));
}
function refreshEditorList(){
  document.querySelector('[data-tab="regular"]').textContent=`Regular Questions (${editingBank.regular.length})`;
  document.querySelector('[data-tab="surprises"]').textContent=`Kitchen Surprises (${editingBank.surprises.length})`;
  const search=document.getElementById('editor-search').value.trim().toLowerCase();
  const topic=document.getElementById('editor-topic-filter').value;
  const items=editorItems().filter(q=>(!topic||q.topic===topic)&&(!search||[q.id,q.topic,q.question,q.answer].join(' ').toLowerCase().includes(search)));
  editorList.replaceChildren();
  document.getElementById('editor-count').textContent=`${items.length} shown · ${editorItems().filter(q=>q.enabled).length} enabled`;
  items.forEach(q=>{
    const b=document.createElement('button');
    b.type='button';b.className='editor-row';
    if(q.id===editingId)b.classList.add('current');
    if(!q.enabled)b.classList.add('off');
    const idSpan=document.createElement('span');idSpan.className='id';idSpan.textContent=q.id;
    const copy=document.createElement('span');
    const title=document.createElement('span');title.className='question-snippet';title.textContent=q.question||'(New question)';
    const cat=document.createElement('span');cat.className='category-snippet';cat.textContent=q.topic||(editingTab==='surprises'?'Surprise':'No topic');
    copy.append(title,cat);b.append(idSpan,copy);
    b.addEventListener('click',()=>{editingId=q.id;showEditorQuestion();refreshEditorList()});
    editorList.append(b);
  });
}
function showEditorQuestion(){
  const q=getEditingQuestion();
  if(!q){editorForm.style.opacity='.55';return;}
  editorForm.style.opacity='1';
  document.getElementById('editor-heading').textContent='Edit '+q.id;
  for(const [k,node] of Object.entries(editNodes)){
    if(k==='enabled')node.checked=q.enabled!==false;
    else if(k==='image'&&q.image.startsWith('data:'))node.value='';
    else node.value=q[k]||'';
  }
  document.getElementById('editor-image-preview').hidden=!q.image;
  if(q.image)document.getElementById('editor-image-preview').src=q.image;
  document.getElementById('editor-upload').value='';
}
for(const [k,node] of Object.entries(editNodes)){
  if(k==='id')continue;
  node.addEventListener(k==='enabled'?'change':'input',()=>{
    const q=getEditingQuestion();if(!q)return;
    if(k==='enabled')q[k]=node.checked;
    else q[k]=node.value;
    if(k==='image'){document.getElementById('editor-image-preview').hidden=!q.image;if(q.image)document.getElementById('editor-image-preview').src=q.image;}
    if(k==='question'||k==='topic'||k==='enabled')refreshEditorList();
    setEditorStatus('Unsaved changes — choose Save changes.');
  });
}
function nextId(){
  const prefix=editingTab==='regular'?'Q':'S';
  const nums=editorItems().map(q=>Number((q.id||'').replace(/\D/g,''))).filter(Number.isFinite);
  const next=Math.max(0,...nums)+1;
  return prefix+String(next).padStart(prefix==='Q'?3:2,'0');
}
document.getElementById('editor-add').addEventListener('click',()=>{
  const id=nextId(),q={id,topic:'',event:'',question:'',passage:'',answer:'',skill:'',visualBrief:'',image:'',teacherNotes:'',enabled:false};
  editorItems().push(q);editingId=id;
  document.getElementById('editor-search').value='';document.getElementById('editor-topic-filter').value='';
  refreshEditorList();showEditorQuestion();setEditorStatus('New question added to draft. Add a question and answer, then enable it.');
});
document.getElementById('editor-delete').addEventListener('click',()=>{
  const q=getEditingQuestion();if(!q)return;
  if(!confirm(`Delete ${q.id}? This is not saved until you choose Save changes.`))return;
  editingBank[editingTab]=editorItems().filter(x=>x.id!==q.id);
  editingId=editorItems()[0]?.id||null;
  updateCategoryFilter();refreshEditorList();showEditorQuestion();setEditorStatus(q.id+' removed from draft. Save changes to apply.');
});
document.getElementById('editor-search').addEventListener('input',refreshEditorList);
document.getElementById('editor-topic-filter').addEventListener('change',refreshEditorList);
document.querySelectorAll('.editor-tab').forEach(b=>b.addEventListener('click',()=>setEditorTab(b.dataset.tab)));
function openEditor(){
  if(active!==-1||reactionBusy||currentEvent||!surpriseOverlay.hidden)return;
  editingBank=structuredClone(bank);
  editingTab='regular';editingId=editingBank.regular[0]?.id||null;
  modal.hidden=false;MatterAudio.setDuck(.48);setEditorTab('regular');setEditorStatus('Changes are saved in this browser. Export JSON for backups or another computer.');
  document.getElementById('settings-close').focus({preventScroll:true});
}
function closeEditor(){modal.hidden=true;editingBank=null;MatterAudio.setDuck(1);document.getElementById('settings-btn').focus({preventScroll:true})}
document.getElementById('settings-btn').addEventListener('click',openEditor);
document.getElementById('settings-close').addEventListener('click',closeEditor);
document.getElementById('editor-save').addEventListener('click',()=>{
  try {
    const checked=normalizeBank(editingBank);
    for(const type of ['regular','surprises']){
      for(const q of checked[type]){
        if(q.enabled && (!q.question.trim()||!q.answer.trim()))throw new Error(`Please complete the question and answer for ${q.id}, or disable it.`);
      }
    }
    if(!checked.regular.some(q=>q.enabled))throw new Error('Enable at least one regular question.');
    bank=checked;
    let saved=true;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(bank))}catch(err){saved=false;console.warn(err)}
    seenIds=new Set([...seenIds].filter(id=>bank.regular.some(q=>q.id===id)));
    rebuildDeck();
    editingBank=structuredClone(bank);
    setEditorStatus(saved?'Saved! Changes will be available next time on this browser.':'Changes applied for this session only. Use Export JSON to save a backup.',!saved);
    updateCategoryFilter();refreshEditorList();
  } catch(err){setEditorStatus(err.message,true);}
});
document.getElementById('editor-defaults').addEventListener('click',()=>{
  if(!confirm('Restore the original 60 regular questions? This will overwrite your current editor draft.'))return;
  editingBank=structuredClone(originalBank);setEditorTab(editingTab);
  setEditorStatus('Original bank restored in draft. Click Save changes to apply.');
});
document.getElementById('editor-export').addEventListener('click',()=>{
  const data=JSON.stringify({version:1,...editingBank},null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='the-matter-kitchen-questions.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setEditorStatus('Question bank exported. Keep this file as a backup or import it on another device.');
});
document.getElementById('editor-import').addEventListener('click',()=>document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    const obj=JSON.parse(await file.text());
    editingBank=normalizeBank(obj);
    setEditorTab(editingTab);
    setEditorStatus(`Imported ${editingBank.regular.length} regular and ${editingBank.surprises.length} surprise questions into draft. Click Save changes.`);
  }catch(err){setEditorStatus('Import failed: '+err.message,true)}
  e.target.value='';
});
document.getElementById('editor-upload').addEventListener('change',e=>{
  const file=e.target.files?.[0],q=getEditingQuestion();
  if(!file||!q)return;
  if(!file.type.startsWith('image/')){setEditorStatus('Please select an image.',true);return;}
  const fr=new FileReader();
  fr.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const max=660,scale=Math.min(1,max/im.width,max/im.height);
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(im.width*scale));
      canvas.height=Math.max(1,Math.round(im.height*scale));
      const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0,canvas.width,canvas.height);
      q.image=canvas.toDataURL('image/webp',.77);
      document.getElementById('editor-image-preview').src=q.image;
      document.getElementById('editor-image-preview').hidden=false;
      editNodes.image.value='';
      setEditorStatus('Picture added to draft. Click Save changes, then Export JSON to back up your edits.');
    };
    im.onerror=()=>setEditorStatus('Could not read image file.',true);
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
});
document.getElementById('editor-remove-image').addEventListener('click',()=>{
  const q=getEditingQuestion();if(!q)return;
  q.image='';editNodes.image.value='';document.getElementById('editor-image-preview').hidden=true;
  setEditorStatus('Picture removed from draft. Click Save changes.');
});
function resetGame(askConfirmation=true){
  if(askConfirmation&&!confirm('Start a new game? All teams will return to 0/6 and the regular questions will be reshuffled.'))return;
  freezeTimers.forEach((timer,i)=>{
    if(timer!==null)clearTimeout(timer);
    freezeTimers[i]=null;
  });
  reactionBusy=false;active=-1;currentQuestion=null;questionMode='regular';
  currentEvent=null;teamSurpriseCounts.fill(0);teamSurprisedSteps.forEach(set=>set.clear());
  surpriseOverlay.hidden=true;surpriseOverlay.classList.remove('power-event');
  panel.classList.remove('open');shade.classList.remove('open');stage.classList.remove('question-open');
  finaleOverlay.hidden=true;finaleViewBtn.hidden=true;finaleShownOnce=false;
  MatterAudio.reset();
  score.fill(0);turnCount=0;questionCycle=1;seenIds.clear();rebuildDeck();updateRoundLabel();draw();
  if(!modal.hidden)closeEditor();
  teams.children[0]?.focus({preventScroll:true});
}
document.getElementById('new-game').addEventListener('click',()=>resetGame(true));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!finaleOverlay.hidden){hideFinale();return;}
    if(!modal.hidden){closeEditor();return;}
    if(!surpriseOverlay.hidden)return;
    closeQuestion(true);
  }
  if(modal.hidden && e.key.toLowerCase()==='l'&&!e.repeat&&!e.altKey&&!e.ctrlKey&&!e.metaKey)stage.classList.toggle('show-slots');
});
rebuildDeck();draw();updateRoundLabel();


/* v26: true fullscreen; the kitchen stage fills the whole display without letterbox bars. */
(function setupFullscreen(){
  const btn=document.getElementById('fullscreen-btn');
  const label=document.getElementById('fullscreen-label');
  if(!btn)return;
  const current=()=>document.fullscreenElement || document.webkitFullscreenElement;
  const sync=()=>{
    const isFullscreen=Boolean(current());
    // Also provide a class for WebKit/fullscreen style compatibility.
    document.documentElement.classList.toggle('matter-fullscreen',isFullscreen);
    label.textContent=isFullscreen?'EXIT FULLSCREEN':'FULLSCREEN';
    btn.setAttribute('aria-label',isFullscreen?'Exit fullscreen':'Enter fullscreen');
    btn.setAttribute('aria-pressed',String(isFullscreen));
    btn.title=isFullscreen?'Exit fullscreen (Esc or F)':'Enter fullscreen (F)';
  };
  const toggle=async()=>{
    try{
      if(current()){
        if(document.exitFullscreen)await document.exitFullscreen();
        else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
      }else{
        const root=document.documentElement;
        if(root.requestFullscreen)await root.requestFullscreen();
        else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();
        else throw new Error('Fullscreen is not supported by this browser.');
      }
    }catch(err){
      console.warn('Fullscreen request failed:',err);
      alert('Fullscreen could not be opened. Try Chrome or press F11.');
    }
    sync();
  };
  btn.addEventListener('click',toggle);
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('webkitfullscreenchange',sync);
  document.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()!=='f'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.target?.closest('input, textarea, select, [contenteditable]'))return;
    if(!document.getElementById('settings-modal').hidden)return;
    e.preventDefault();toggle();
  });
  sync();
})();
