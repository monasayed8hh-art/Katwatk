const SUPER_ADMIN_CODE = "0112838183800"; // كود المشرف الجديد

// ========================= بيانات المواد والمدرسين =========================
const subjectsDB = {
    arabic: { name: "لغة عربية", icon: "fas fa-language", image: "images/arabic.jpg", teachers: ["محمد صلاح","رضا الفاروق"] },
    english: { name: "لغة إنجليزية", icon: "fas fa-globe", image: "images/english.jpg", teachers: ["ميس مي مجدي","انجلشاوي"] },
    math: { name: "رياضيات", icon: "fas fa-calculator", image: "images/math.jpg", teachers: ["أحمد عصام","لطفي زهران"] },
    biology: { name: "أحياء", icon: "fas fa-dna", image: "images/biology.jpg", teachers: ["أحمد الجوهري","محمد أيمن"] },
    physics: { name: "فيزياء", icon: "fas fa-atom", image: "images/physics.jpg", teachers: ["محمد عبدالمعبود","حسام خليل"] },
    chemistry: { name: "كيمياء", icon: "fas fa-flask", image: "images/chemistry.jpg", teachers: ["محمد عبدالجواد","خالد صقر"] }
};

// بيانات كورسات المدرسين
const teacherCoursesDB = {
    "محمد صلاح": { "نوفمبر 2025": { "الأسبوع الأول": "https://www.youtube.com/embed/dQw4w9WgXcQ" } },
    "أحمد عصام": { "نوفمبر 2025": { "الأسبوع الأول": "https://www.youtube.com/embed/dQw4w9WgXcQ" } },
    "ميس مي مجدي": { "نوفمبر 2025": { "Week 1": "https://www.youtube.com/embed/dQw4w9WgXcQ" } }
};

// حفظ الأكواد والجلسات
let generatedCodesList = JSON.parse(localStorage.getItem('khatwatak_codes_db')) || [];
let currentUserSession = JSON.parse(localStorage.getItem('khatwatak_active_session'));
let studentProgress = JSON.parse(localStorage.getItem('khatwatak_student_progress')) || {};

// ========================= وظائف عامة =========================
function generateStars(){
    const container = document.getElementById('star-container');
    if(!container) return;
    for(let i=0;i<50;i++){
        const star = document.createElement('div');
        star.className='star';
        star.style.width=star.style.height=(Math.random()*3+1)+'px';
        star.style.left=(Math.random()*100)+'%';
        star.style.top=(Math.random()*100)+'%';
        star.style.animationDuration=(Math.random()*5+3)+'s';
        star.style.animationDelay=(Math.random()*5)+'s';
        container.appendChild(star);
    }
}

window.showView = function(viewId){
    document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));
    const target=document.getElementById(viewId);
    if(target) target.classList.add('active');
    const subTitle=document.getElementById('sub-title');
    if(subTitle){
        if(viewId.includes('admin')) subTitle.innerText="إدارة الأكواد والطلاب";
        else if(viewId.includes('student')) subTitle.innerText="اكتشف موادك التعليمية";
        else subTitle.innerText="منصتك التعليمية المتكاملة";
    }
}
window.logoutUser=function(){localStorage.removeItem('khatwatak_active_session'); showView('login-view');}

// ========================= منطق تسجيل الدخول =========================
window.attemptLogin=function(){
    const code=document.getElementById('access-code-input').value.trim();
    if(code===SUPER_ADMIN_CODE){ showView('admin-panel-view'); initAdminPage(); return; }
    const student=generatedCodesList.find(u=>u.code===code);
    if(student){
        const now=new Date().getTime();
        if(now>student.expiryTimestamp){ alert("⛔ انتهت صلاحية الكود."); return; }
        if(!student.start){ student.start=now; localStorage.setItem('khatwatak_codes_db',JSON.stringify(generatedCodesList)); }
        localStorage.setItem('khatwatak_active_session',JSON.stringify(student));
        currentUserSession=student;
        showView('student-dashboard-view'); loadStudentDataIntoDashboard();
    }else{ alert("❌ الكود غير صحيح!"); }
}

// ========================= لوحة الطالب =========================
function getGreeting(){
    const h=new Date().getHours();
    if(h>=4&&h<12) return "صباح الخير ☀️! يوم دراسي موفق.";
    if(h>=12&&h<17) return "مساء الخير 👋! وقت مثالي للإنجاز.";
    if(h>=17&&h<22) return "مرحباً بك! لا تنسى مراجعة مواد اليوم 🌙.";
    return "وقت متأخر، لا بأس ببعض المذاكرة الخفيفة.";
}

function calculateAndRenderProgress(){
    const studentCode=currentUserSession.code;
    const totalSubjects=Object.keys(subjectsDB).length;
    const exploredSubjects=new Set(Object.keys(studentProgress[studentCode]||{})).size;
    const percentage=Math.min(100, Math.round(exploredSubjects/totalSubjects*100));
    document.getElementById('progress-percentage').innerText=`${percentage}%`;
    document.getElementById('academic-progress-bar').style.width=`${percentage}%`;
}

function loadStudentDataIntoDashboard(){
    if(!currentUserSession){ showView('login-view'); return; }
    document.getElementById('student-name-display').innerText=currentUserSession.name;
    document.getElementById('student-stream-display').innerText=currentUserSession.stream==='science'?'علمي علوم':'علمي رياضة';
    document.getElementById('student-code-display').innerText=currentUserSession.code;
    document.getElementById('expiry-date-display').innerText=new Date(currentUserSession.expiryTimestamp).toLocaleDateString('ar-EG');
    document.getElementById('dynamic-greeting').innerHTML=`${getGreeting()} يا <strong>${currentUserSession.name}</strong>.`;

    if(!studentProgress[currentUserSession.code]) studentProgress[currentUserSession.code]={};
    calculateAndRenderProgress();

    // المواد
    const subjectsGrid=document.getElementById('subjects-grid'); subjectsGrid.innerHTML='';
    for(const [key,data] of Object.entries(subjectsDB)){
        const card=document.createElement('div'); card.className='subject-card';
        card.innerHTML=`<img src="${data.image}" alt="${data.name}"><h3>${data.name}</h3>`;
        card.onclick=()=>loadTeachersForSubject(key);
        subjectsGrid.appendChild(card);
    }

    // المدرسين
    loadTeachersIntoDashboard();
}

// ===================================
const teachersDB=[
    {name:"أ. أحمد علي",subject:"رياضيات"},
    {name:"أ. سارة محمد",subject:"لغة عربية"},
    {name:"أ. محمد حسن",subject:"علوم"},
    {name:"أ. ليلى مصطفى",subject:"لغة إنجليزية"}
];

function loadTeachersIntoDashboard(){
    const teachersGrid=document.getElementById('teachers-grid'); teachersGrid.innerHTML='';
    teachersDB.forEach(t=>{
        const card=document.createElement('div'); card.className='teacher-card';
        card.innerHTML=`<div>${t.name}<br><small>${t.subject}</small></div>`;
        teachersGrid.appendChild(card);
    });
}

// ========================= تحميل المدرسين والمواد =========================
window.loadTeachersForSubject=function(subjectKey){
    const studentCode=currentUserSession.code;
    studentProgress[studentCode][subjectKey]=true;
    localStorage.setItem('khatwatak_student_progress',JSON.stringify(studentProgress));
    calculateAndRenderProgress();

    const subjectData=subjectsDB[subjectKey];
    document.getElementById('selected-subject-header').innerHTML=`<i class="${subjectData.icon}"></i> ${subjectData.name}`;

    const teachersGrid=document.getElementById('teachers-grid'); teachersGrid.innerHTML='';
    subjectData.teachers.forEach(t=>{
        const card=document.createElement('div'); card.className='teacher-card';
        card.innerHTML=`<i class="fas fa-chalkboard-user"></i> ${t}`;
        card.onclick=()=>loadCoursesForTeacher(t);
        teachersGrid.appendChild(card);
    });

    showView('teachers-view');
}

window.loadCoursesForTeacher=function(teacherName){
    document.getElementById('selected-teacher-header').innerText=`كورسات ${teacherName}`;
    const coursesByMonth=teacherCoursesDB[teacherName];
    const coursesFlex=document.querySelector('#courses-view .courses-flex'); coursesFlex.innerHTML='';
    if(coursesByMonth){
        const colors=['linear-gradient(135deg,#1abc9c,#16a085)','linear-gradient(135deg,#3498db,#2980b9)','linear-gradient(135deg,#f1c40f,#f39c12)','linear-gradient(135deg,#e74c3c,#c0392b)'];
        let idx=0;
        Object.entries(coursesByMonth).forEach(([month,weeks])=>{
            const card=document.createElement('div'); card.className='month-card';
            card.style.background=colors[idx%colors.length]; card.innerText=month;
            card.onclick=()=>loadWeeksForMonth(teacherName,month,weeks); coursesFlex.appendChild(card); idx++;
        });
    }else{ coursesFlex.innerHTML=`<p style="text-align:center;color:#eb4d4b;">لا توجد كورسات متاحة حالياً</p>`; }
    showView('courses-view');
}

window.loadWeeksForMonth=function(teacherName,month,weeksData){
    document.getElementById('selected-week-header').innerHTML=`${teacherName} - ${month}`;
    const weeksGrid=document.getElementById('weeks-grid'); weeksGrid.innerHTML='';
    const weekColors=['linear-gradient(135deg,#007bff,#0056b3)','linear-gradient(135deg,#ffc107,#d39e00)','linear-gradient(135deg,#17a2b8,#117a8b)','linear-gradient(135deg,#28a745,#1e7e34)'];
    let idx=0;
    Object.entries(weeksData).forEach(([week,link])=>{
        const card=document.createElement('div'); card.className='week-card subject-card';
        card.style.background=weekColors[idx%weekColors.length];
        card.innerHTML=`<i class="fas fa-video" style="font-size:3rem;margin-bottom:10px;"></i><h3>${week}</h3>`;
        card.onclick=()=>openVideoModal(link,`${teacherName} - ${month} - ${week}`);
        weeksGrid.appendChild(card); idx++;
    });
    showView('weeks-view');
}

// ========================= الفيديو Modal =========================
window.openVideoModal=function(link,title){
    const modal=document.getElementById('video-modal');
    const iframe=document.getElementById('video-iframe');
    const modalTitle=document.getElementById('modal-video-title');
    modalTitle.innerText=title; iframe.src=link; modal.classList.add('active'); document.body.style.overflow='hidden';
}
window.closeVideoModal=function(){
    const modal=document.getElementById('video-modal'); const iframe
