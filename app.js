"use strict";

const CONFIG={EXAM_QUESTIONS:60,EXAM_SECONDS:105*60,PASSING_PERCENT:72};
const BANK=Array.isArray(window.QUESTION_BANK)?window.QUESTION_BANK:[];
const SECTIONS=[
  {id:"agents",name:"AI Agents",weight:"35%",icon:"◇",desc:"Agent Script, actions, topics, channels, security and deterministic behavior."},
  {id:"prompt",name:"Prompt Engineering",weight:"20%",icon:"✦",desc:"Prompt Builder, templates, grounding, models and Trust Layer."},
  {id:"data",name:"Data 360 Fundamentals",weight:"20%",icon:"◫",desc:"Data Libraries, chunking, indexing, search and retrievers."},
  {id:"testing",name:"Testing, Deployment & Maintenance",weight:"10%",icon:"↗",desc:"Testing Center, sandbox, production and deployment lifecycle."},
  {id:"governance",name:"Governance & Observability",weight:"10%",icon:"◎",desc:"Analytics, optimization, logs, adoption and monitoring."},
  {id:"multi_agent",name:"Multi-Agent Orchestration",weight:"5%",icon:"⌘",desc:"MCP, A2A, SOMA and multi-agent architecture."}
];
const sectionMap=Object.fromEntries(SECTIONS.map(s=>[s.id,s]));
const $=id=>document.getElementById(id);
const els={home:$("home-view"),session:$("session-view"),results:$("results-view"),brandHome:$("brand-home"),homeTop:$("home-top"),bankCount:$("bank-count"),heroBankCount:$("hero-bank-count"),sectionList:$("section-list"),sectionCards:$("section-cards"),startStudy:$("start-study"),startExam:$("start-exam"),sidebarStartExam:$("sidebar-start-exam"),mobileMenu:$("mobile-menu"),sidebar:$("sidebar"),topbarTitle:$("topbar-title"),topbarSubtitle:$("topbar-subtitle"),sidebarProgress:$("sidebar-progress"),sidebarAnswered:$("sidebar-answered"),sidebarCorrect:$("sidebar-correct"),progressRing:$("progress-ring"),sessionModeChip:$("session-mode-chip"),sessionTitle:$("session-title"),sessionSubtitle:$("session-subtitle"),metricProgress:$("metric-progress"),metricScore:$("metric-score"),scoreMetric:$("score-metric"),timerMetric:$("timer-metric"),metricTimer:$("metric-timer"),progressFill:$("progress-fill"),questionNumber:$("question-number"),sourceNumber:$("source-number"),flagQuestion:$("flag-question"),questionText:$("question-text"),selectHint:$("select-hint"),optionsList:$("options-list"),feedbackCard:$("feedback-card"),feedbackIcon:$("feedback-icon"),feedbackTitle:$("feedback-title"),feedbackAnswer:$("feedback-answer"),feedbackExplanation:$("feedback-explanation"),prevQuestion:$("prev-question"),checkAnswer:$("check-answer"),nextQuestion:$("next-question"),submitExam:$("submit-exam"),exitSession:$("exit-session"),navigatorGrid:$("navigator-grid"),navigatorCount:$("navigator-count"),jumpUnanswered:$("jump-unanswered"),resultBadge:$("result-badge"),resultTitle:$("result-title"),resultMessage:$("result-message"),resultScore:$("result-score"),scoreRing:$("score-ring"),resultCorrect:$("result-correct"),resultIncorrect:$("result-incorrect"),resultUnanswered:$("result-unanswered"),resultTime:$("result-time"),reviewMissed:$("review-missed"),newExam:$("new-exam"),backHomeResults:$("back-home-results"),reviewList:$("review-list"),confirmOverlay:$("confirm-overlay"),confirmCopy:$("confirm-copy"),confirmCancel:$("confirm-cancel"),confirmSubmit:$("confirm-submit"),shuffleStudy:$("shuffle-study")};
let state=freshState(),timerId=null;
const studySessionCache={};
function studyCacheKey(sectionId){return sectionId||"__all__"}
function saveStudySession(){
  if(state.mode!=="study")return;
  studySessionCache[studyCacheKey(state.section)]={
    answers:{...state.answers},checked:{...state.checked},flagged:{...state.flagged},
    current:state.current,startedAt:state.startedAt,
    order:state.questions.map(q=>q.id)
  };
}
function freshState(){return{mode:null,section:null,questions:[],current:0,answers:{},checked:{},flagged:{},secondsLeft:CONFIG.EXAM_SECONDS,startedAt:null,submittedAt:null,result:null}}
function showView(name){[els.home,els.session,els.results].forEach(v=>v.classList.remove("active"));els[name].classList.add("active");els.sidebar.classList.remove("open");window.scrollTo({top:0,behavior:"smooth"})}
function shuffled(items){const arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function cloneQuestion(question,shuffleOptions){const q=JSON.parse(JSON.stringify(question));if(shuffleOptions){const original=q.answer[0],letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ",randomized=shuffled(q.options);let mapped=original;q.options=randomized.map((opt,i)=>{const letter=letters[i];if(opt.letter===original)mapped=letter;return{...opt,letter}});q.answer=[mapped]}return q}
function currentQuestion(){return state.questions[state.current]}
function answerFor(q){return state.answers[q.id]||null}
function isCorrect(q){return answerFor(q)===q.answer[0]}
function sectionQuestions(id){return BANK.filter(q=>q.section===id)}
function sectionCount(id){return sectionQuestions(id).length}
function renderSections(){els.sectionList.innerHTML="";els.sectionCards.innerHTML="";SECTIONS.forEach((s,i)=>{const count=sectionCount(s.id);const nav=document.createElement("button");nav.className="section-nav";nav.dataset.section=s.id;nav.innerHTML=`<span class="sec-icon">${s.icon}</span><span class="sec-name">${i+1}. ${escapeHtml(s.name)}<small style="display:block;color:#7f8982;margin-top:2px">${s.weight} exam weight</small></span><span class="sec-count">${count}</span>`;nav.addEventListener("click",()=>startStudy(s.id));els.sectionList.appendChild(nav);const card=document.createElement("button");card.className="section-card";card.innerHTML=`<span class="section-icon">${s.icon}</span><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.desc)}</small></span><b>${count}</b>`;card.addEventListener("click",()=>startStudy(s.id));els.sectionCards.appendChild(card)})}
function startStudy(sectionId=null){
  stopTimer();
  saveStudySession();
  const cached=studySessionCache[studyCacheKey(sectionId)];
  state=freshState();state.mode="study";state.section=sectionId;
  const source=sectionId?sectionQuestions(sectionId):BANK;
  let orderedSource=source;
  if(cached?.order?.length){
    const byId=new Map(source.map(q=>[q.id,q]));
    orderedSource=cached.order.map(id=>byId.get(id)).filter(Boolean);
    const seen=new Set(orderedSource.map(q=>q.id));
    orderedSource=[...orderedSource,...source.filter(q=>!seen.has(q.id))];
  }
  state.questions=orderedSource.map(q=>cloneQuestion(q,false));
  state.startedAt=cached?.startedAt||Date.now();state.secondsLeft=0;
  if(cached){state.answers={...cached.answers};state.checked={...cached.checked};state.flagged={...cached.flagged};state.current=Math.min(cached.current||0,Math.max(0,state.questions.length-1));}
  showView("session");renderSession();
  if(cached&&state.current>0)setTimeout(()=>jumpToQuestion(state.current,false),0);
}
function shuffleStudyQuestions(){
  if(state.mode!=="study"||state.questions.length<2)return;
  state.questions=shuffled(state.questions);
  state.current=0;
  saveStudySession();
  renderSession();
  requestAnimationFrame(()=>jumpToQuestion(0,true));
}
function startExam(){stopTimer();state=freshState();state.mode="exam";state.questions=shuffled(BANK).slice(0,Math.min(CONFIG.EXAM_QUESTIONS,BANK.length)).map(q=>cloneQuestion(q,false));state.startedAt=Date.now();state.secondsLeft=CONFIG.EXAM_SECONDS;showView("session");renderSession();timerId=setInterval(tickTimer,1000)}
function sessionStats(){
  const total=state.questions.length;
  const answered=state.mode==="study"?state.questions.filter(q=>state.checked[q.id]).length:state.questions.filter(q=>answerFor(q)).length;
  const checked=state.questions.filter(q=>state.checked[q.id]);
  const correct=checked.filter(q=>isCorrect(q)).length;
  const score=checked.length?Math.round(correct/checked.length*100):0;
  return{total,answered,checked,correct,score};
}
function updateSessionChrome(){
  const {total,answered,score}=sessionStats();
  const label=state.mode==="exam"?"Timed Exam Simulation":(state.section?sectionMap[state.section].name:"All Study Questions");
  els.sessionModeChip.textContent=state.mode==="exam"?"Exam Mode":"Study Mode";
  els.sessionModeChip.classList.toggle("exam",state.mode==="exam");
  els.sessionTitle.textContent=label;
  els.sessionSubtitle.textContent=state.mode==="exam"?`Question ${state.current+1} of ${total}`:`${total} questions · scroll to study`;
  els.topbarTitle.textContent=label;
  els.topbarSubtitle.textContent=state.mode==="exam"?"Answers stay hidden until submission.":"Scroll through questions or jump directly from the navigator.";
  els.metricProgress.textContent=`${answered}/${total}`;
  els.metricScore.textContent=state.mode==="exam"?"Hidden":`${score}%`;
  els.timerMetric.style.display=state.mode==="exam"?"grid":"none";
  els.metricTimer.textContent=formatClock(state.secondsLeft);
  els.metricTimer.classList.toggle("danger",state.mode==="exam"&&state.secondsLeft<=600);
  if(els.shuffleStudy)els.shuffleStudy.style.display=state.mode==="study"?"inline-flex":"none";
  els.progressFill.style.width=`${total?answered/total*100:0}%`;
}
function renderSession(){
  if(!state.questions.length)return;
  updateSessionChrome();
  const layout=document.querySelector(".session-layout");
  layout.classList.add("study-continuous");layout.classList.remove("exam-paged");
  renderContinuousFeed();
  renderNavigator();renderSidebarProgress();
}
function renderContinuousFeed(){
  els.studyFeed=els.studyFeed||$("study-feed");
  els.studyFeed.hidden=false;els.studyFeed.innerHTML="";
  state.questions.forEach((q,idx)=>els.studyFeed.appendChild(state.mode==="study"?buildStudyCard(q,idx):buildExamCard(q,idx)));
  if(state.mode==="exam"){
    const submit=document.createElement("div");submit.className="exam-submit-bar";submit.innerHTML=`<div><strong>Ready to finish?</strong><span>You can review or change any answer above before submitting.</span></div><button type="button" class="primary-btn">Submit exam</button>`;
    submit.querySelector("button").addEventListener("click",requestExamSubmit);els.studyFeed.appendChild(submit);
  }
}
function buildStudyCard(q,idx){
  const card=document.createElement("article");card.className="study-card";card.id=`study-question-${idx+1}`;card.dataset.index=idx;
  if(idx===state.current)card.classList.add("active-question");
  const selected=answerFor(q),confirmed=!!state.checked[q.id],correct=confirmed&&isCorrect(q),correctOpt=q.options.find(o=>o.letter===q.answer[0]);
  const options=q.options.map(opt=>{
    const cls=["option-btn"];
    if(selected===opt.letter)cls.push("selected");
    if(confirmed&&opt.letter===q.answer[0])cls.push("correct");
    if(confirmed&&selected===opt.letter&&selected!==q.answer[0])cls.push("incorrect");
    return `<button type="button" class="${cls.join(" ")}" data-letter="${escapeHtml(opt.letter)}"><span class="option-letter">${escapeHtml(opt.letter)}</span><span class="option-text">${escapeHtml(opt.text)}</span></button>`;
  }).join("");
  const feedback=confirmed?`<div class="feedback-card${correct?"":" incorrect"}"><div class="feedback-heading"><span class="feedback-icon">${correct?"✓":"×"}</span><div><strong>${correct?"Correct!":"Not quite — you can choose another option"}</strong><span>Correct answer: ${escapeHtml(q.answer[0])}${correctOpt?` — ${escapeHtml(correctOpt.text)}`:""}</span></div></div><div class="feedback-explanation">${q.explanation?escapeHtml(q.explanation):"<em>No explanation was included for this question in the supplied source PDF.</em>"}</div></div>`:"";
  card.innerHTML=`<div class="question-toolbar"><div><span class="question-number">Question ${idx+1}</span><span class="source-number">Bank #${q.id}</span></div><button type="button" class="flag-btn ${state.flagged[q.id]?"active":""}" data-action="flag">${state.flagged[q.id]?"★ Marked":"☆ Mark for review"}</button></div><h2 class="question-text">${escapeHtml(q.text)}</h2><p class="select-hint">Choose an option, then press <b>Select answer</b>. You can change it afterward.</p><div class="options-list">${options}</div><div class="study-answer-actions"><button type="button" class="primary-btn select-answer-btn" data-action="confirm" ${selected?"":"disabled"}>Select answer</button></div>${feedback}`;
  card.querySelectorAll(".option-btn").forEach(btn=>btn.addEventListener("click",()=>selectStudyChoice(q.id,btn.dataset.letter,idx)));
  card.querySelector('[data-action="confirm"]').addEventListener("click",()=>confirmStudyAnswer(q.id,idx));
  card.querySelector('[data-action="flag"]').addEventListener("click",()=>toggleStudyFlag(q.id,idx));
  return card;
}
function buildExamCard(q,idx){
  const card=document.createElement("article");card.className="study-card exam-question-card";card.id=`study-question-${idx+1}`;card.dataset.index=idx;if(idx===state.current)card.classList.add("active-question");
  const selected=answerFor(q);
  const options=q.options.map(opt=>`<button type="button" class="option-btn${selected===opt.letter?" selected":""}" data-letter="${escapeHtml(opt.letter)}"><span class="option-letter">${escapeHtml(opt.letter)}</span><span class="option-text">${escapeHtml(opt.text)}</span></button>`).join("");
  card.innerHTML=`<div class="question-toolbar"><div><span class="question-number">Question ${idx+1}</span><span class="source-number">Bank #${q.id}</span></div><button type="button" class="flag-btn ${state.flagged[q.id]?"active":""}" data-action="flag">${state.flagged[q.id]?"★ Marked":"☆ Mark for review"}</button></div><h2 class="question-text">${escapeHtml(q.text)}</h2><p class="select-hint">Select one answer. You can change it at any time before submitting the exam.</p><div class="options-list">${options}</div>`;
  card.querySelectorAll(".option-btn").forEach(btn=>btn.addEventListener("click",()=>selectExamChoice(q.id,btn.dataset.letter,idx)));
  card.querySelector('[data-action="flag"]').addEventListener("click",()=>toggleStudyFlag(q.id,idx));return card;
}
function selectExamChoice(questionId,letter,idx){state.current=idx;state.answers[questionId]=letter;replaceContinuousCard(idx);updateSessionChrome();renderNavigator()}
function replaceContinuousCard(idx){const old=$( `study-question-${idx+1}` );if(!old)return;const q=state.questions[idx];old.replaceWith(state.mode==="study"?buildStudyCard(q,idx):buildExamCard(q,idx))}
function replaceStudyCard(idx){replaceContinuousCard(idx)}
function selectStudyChoice(questionId,letter,idx){
  state.current=idx;state.answers[questionId]=letter;state.checked[questionId]=false;saveStudySession();replaceStudyCard(idx);updateSessionChrome();renderNavigator();renderSidebarProgress();
}
function confirmStudyAnswer(questionId,idx){
  if(!state.answers[questionId])return;state.current=idx;state.checked[questionId]=true;saveStudySession();replaceStudyCard(idx);updateSessionChrome();renderNavigator();renderSidebarProgress();
}
function toggleStudyFlag(questionId,idx){state.flagged[questionId]=!state.flagged[questionId];state.current=idx;saveStudySession();replaceStudyCard(idx);renderNavigator()}
function renderExamQuestion(){
  const q=currentQuestion(),total=state.questions.length;
  els.questionNumber.textContent=`Question ${state.current+1}`;els.sourceNumber.textContent=`Bank #${q.id}`;els.questionText.textContent=q.text;
  els.selectHint.textContent="Select one answer. You can change it before submitting the exam.";
  const flagged=!!state.flagged[q.id];els.flagQuestion.classList.toggle("active",flagged);els.flagQuestion.textContent=flagged?"★ Marked":"☆ Mark for review";
  renderOptions(q);els.feedbackCard.hidden=true;renderActions();
}
function renderOptions(q){
  els.optionsList.innerHTML="";const selected=answerFor(q);
  q.options.forEach(opt=>{const btn=document.createElement("button");btn.type="button";btn.className="option-btn";btn.innerHTML=`<span class="option-letter">${escapeHtml(opt.letter)}</span><span class="option-text">${escapeHtml(opt.text)}</span>`;if(selected===opt.letter)btn.classList.add("selected");btn.addEventListener("click",()=>selectAnswer(q.id,opt.letter));els.optionsList.appendChild(btn)})
}
function selectAnswer(questionId,letter){state.answers[questionId]=letter;renderSession()}
function renderFeedback(){}
function renderActions(){els.prevQuestion.disabled=state.current===0;els.nextQuestion.disabled=state.current>=state.questions.length-1;els.checkAnswer.style.display="none";els.submitExam.style.display=state.mode==="exam"?"inline-flex":"none"}
function renderNavigator(){
  const answered=state.mode==="study"?state.questions.filter(q=>state.checked[q.id]).length:state.questions.filter(q=>answerFor(q)).length;
  els.navigatorCount.textContent=`${answered} answered`;els.navigatorGrid.innerHTML="";
  state.questions.forEach((q,idx)=>{const b=document.createElement("button");b.className="nav-q";b.textContent=idx+1;b.title=`Question ${idx+1} · Bank #${q.id}`;if(state.mode==="study"?state.checked[q.id]:answerFor(q))b.classList.add("answered");if(idx===state.current)b.classList.add("current");if(state.flagged[q.id])b.classList.add("flagged");if(state.mode==="study"&&state.checked[q.id])b.classList.add(isCorrect(q)?"correct":"wrong");b.addEventListener("click",()=>jumpToQuestion(idx));els.navigatorGrid.appendChild(b)})
}
function jumpToQuestion(idx,smooth=true){state.current=idx;document.querySelectorAll(".study-card.active-question").forEach(c=>c.classList.remove("active-question"));const card=$( `study-question-${idx+1}` );card?.classList.add("active-question");card?.scrollIntoView({behavior:smooth?"smooth":"auto",block:"start"});renderNavigator()}
function renderSidebarProgress(){
  if(state.mode!=="study"){els.sidebarProgress.textContent="0%";els.sidebarAnswered.textContent="0";els.sidebarCorrect.textContent="0";els.progressRing.style.setProperty("--angle","0deg");return}
  const answered=state.questions.filter(q=>state.checked[q.id]).length,correct=state.questions.filter(q=>state.checked[q.id]&&isCorrect(q)).length,pct=state.questions.length?Math.round(answered/state.questions.length*100):0;
  els.sidebarProgress.textContent=`${pct}%`;els.sidebarAnswered.textContent=answered;els.sidebarCorrect.textContent=correct;els.progressRing.style.setProperty("--angle",`${pct*3.6}deg`);document.querySelectorAll('.section-nav').forEach(n=>n.classList.toggle('active',n.dataset.section===state.section))
}
function go(delta){const next=state.current+delta;if(next<0||next>=state.questions.length)return;state.current=next;renderSession();scrollQuestionIntoView()}
function toggleFlag(){const q=currentQuestion();state.flagged[q.id]=!state.flagged[q.id];renderSession()}
function jumpToUnanswered(){for(let offset=1;offset<=state.questions.length;offset++){const idx=(state.current+offset)%state.questions.length;const blank=state.mode==="study"?!state.checked[state.questions[idx].id]:!answerFor(state.questions[idx]);if(blank){jumpToQuestion(idx);return}}}
function scrollQuestionIntoView(){document.querySelector(".question-panel")?.scrollIntoView({behavior:"smooth",block:"start"})}
function tickTimer(){if(state.mode!=="exam")return;state.secondsLeft=Math.max(0,state.secondsLeft-1);els.metricTimer.textContent=formatClock(state.secondsLeft);els.metricTimer.classList.toggle("danger",state.secondsLeft<=600);if(state.secondsLeft===0){stopTimer();submitExamNow()}}
function requestExamSubmit(){const unanswered=state.questions.filter(q=>!answerFor(q)).length;els.confirmCopy.textContent=unanswered?`You still have ${unanswered} unanswered question${unanswered===1?"":"s"}. Submit anyway?`:"All questions are answered. Calculate your final score?";els.confirmOverlay.hidden=false}
function submitExamNow(){if(state.mode!=="exam")return;stopTimer();els.confirmOverlay.hidden=true;state.submittedAt=Date.now();const correct=state.questions.filter(q=>answerFor(q)&&isCorrect(q)).length,answered=state.questions.filter(q=>answerFor(q)).length,incorrect=answered-correct,unanswered=state.questions.length-answered,score=Math.round(correct/state.questions.length*1000)/10,passed=score>=CONFIG.PASSING_PERCENT,elapsedSeconds=Math.max(0,Math.min(CONFIG.EXAM_SECONDS,CONFIG.EXAM_SECONDS-state.secondsLeft));state.result={correct,incorrect,unanswered,score,passed,elapsedSeconds};renderResults();showView("results")}
function renderResults(){const r=state.result;if(!r)return;els.resultBadge.textContent=r.passed?"✓":"×";els.resultBadge.classList.toggle("fail",!r.passed);els.resultTitle.textContent=r.passed?"You passed the simulation":"Below the passing target";els.resultMessage.textContent=r.passed?`You cleared the ${CONFIG.PASSING_PERCENT}% practice target. Review any misses and try another randomized set.`:`The practice target is ${CONFIG.PASSING_PERCENT}%. Review missed questions before the next attempt.`;els.resultScore.textContent=`${r.score.toFixed(1)}%`;els.scoreRing.style.setProperty("--score-angle",`${Math.min(360,Math.max(0,r.score*3.6))}deg`);els.resultCorrect.textContent=r.correct;els.resultIncorrect.textContent=r.incorrect;els.resultUnanswered.textContent=r.unanswered;els.resultTime.textContent=formatDuration(r.elapsedSeconds);els.reviewList.innerHTML="";els.reviewMissed.disabled=false}
function renderMissedReview(){
  els.reviewList.innerHTML="";
  state.questions.forEach((q,index)=>{
    const chosen=answerFor(q);
    const correct=isCorrect(q);
    const unanswered=!chosen;
    const item=document.createElement("article");
    item.className=`review-item ${correct?"review-correct":"review-wrong"}`;
    const answers=q.options.map(opt=>{
      const classes=["review-answer"];
      if(opt.letter===q.answer[0])classes.push("correct");
      if(chosen===opt.letter&&chosen!==q.answer[0])classes.push("chosen-wrong");
      return `<div class="${classes.join(" ")}"><strong>${escapeHtml(opt.letter)}.</strong> ${escapeHtml(opt.text)}</div>`
    }).join("");
    const status=correct?"Correct":unanswered?"Unanswered":"Incorrect";
    const statusClass=correct?"status-correct":"status-wrong";
    const answerSummary=correct
      ? `Your answer: ${escapeHtml(chosen)}`
      : unanswered
        ? `Correct answer: ${escapeHtml(q.answer[0])}`
        : `Your answer: ${escapeHtml(chosen)} · Correct: ${escapeHtml(q.answer[0])}`;
    item.innerHTML=`<div class="review-item-head"><span>Question ${index+1} · Bank #${q.id}</span><strong class="${statusClass}">${status}</strong></div><h3>${escapeHtml(q.text)}</h3><div class="review-answer-grid">${answers}</div><div class="review-answer-summary ${statusClass}">${answerSummary}</div><div class="review-explanation">${q.explanation?escapeHtml(q.explanation):"<em>No explanation was included in the supplied source PDF.</em>"}</div>`;
    els.reviewList.appendChild(item)
  });
  els.reviewList.scrollIntoView({behavior:"smooth",block:"start"})
}
function exitToHome(){stopTimer();state=freshState();els.confirmOverlay.hidden=true;els.topbarTitle.textContent="Agentforce Specialist Practice Test";els.topbarSubtitle.textContent="Study by exam domain or run a full simulation.";document.querySelectorAll('.section-nav').forEach(n=>n.classList.remove('active'));renderSidebarProgress();showView("home")}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null}
function formatClock(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return[h,m,sec].map(n=>String(n).padStart(2,"0")).join(":")}
function formatDuration(s){const m=Math.floor(s/60),sec=s%60;return`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]))}

const ACCESS_PASSWORD="Agentforce26!";
function initPasswordGate(){
  const gate=$("password-gate"),form=$("password-form"),input=$("password-input"),error=$("password-error"),toggle=$("password-toggle");
  if(!gate||!form)return;
  document.body.classList.add("locked");
  form.addEventListener("submit",e=>{
    e.preventDefault();
    if(input.value===ACCESS_PASSWORD){gate.classList.add("unlocked");document.body.classList.remove("locked");error.textContent="";setTimeout(()=>gate.remove(),220);}
    else{error.textContent="Incorrect password. Try again.";input.select();}
  });
  toggle.addEventListener("click",()=>{const showing=input.type==="text";input.type=showing?"password":"text";toggle.textContent=showing?"Show":"Hide";});
}
function init(){initPasswordGate();els.bankCount.textContent=BANK.length;els.heroBankCount.textContent=BANK.length;renderSections();els.startStudy.addEventListener("click",()=>startStudy(null));els.startExam.addEventListener("click",startExam);els.sidebarStartExam.addEventListener("click",startExam);if(els.shuffleStudy)els.shuffleStudy.addEventListener("click",shuffleStudyQuestions);[els.brandHome,els.homeTop,els.exitSession,els.backHomeResults].forEach(el=>el.addEventListener("click",exitToHome));els.prevQuestion.addEventListener("click",()=>go(-1));els.nextQuestion.addEventListener("click",()=>go(1));els.flagQuestion.addEventListener("click",toggleFlag);els.jumpUnanswered.addEventListener("click",jumpToUnanswered);els.submitExam.addEventListener("click",requestExamSubmit);els.confirmCancel.addEventListener("click",()=>els.confirmOverlay.hidden=true);els.confirmSubmit.addEventListener("click",submitExamNow);els.reviewMissed.addEventListener("click",renderMissedReview);els.newExam.addEventListener("click",startExam);els.mobileMenu.addEventListener("click",()=>els.sidebar.classList.toggle("open"));document.addEventListener("keydown",e=>{if(!els.session.classList.contains("active"))return;if(["INPUT","TEXTAREA"].includes(e.target?.tagName))return;const q=currentQuestion();if(!q)return;if(state.mode==="exam"){if(["1","2","3","4"].includes(e.key)){const opt=q.options[Number(e.key)-1];if(opt)selectExamChoice(q.id,opt.letter,state.current)}else if(e.key==="ArrowRight")go(1);else if(e.key==="ArrowLeft")go(-1);else if(e.key.toLowerCase()==="f")toggleFlag()}});if(!BANK.length){els.startStudy.disabled=true;els.startExam.disabled=true}}
init();
