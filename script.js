// ── State ──────────────────────────────────────────────────────
let allTestimonials = [...TESTIMONIALS_DATA];
let allBlogs        = BLOGS_DATA.filter(b => b.published !== false);

// ── Stars ──────────────────────────────────────────────────────
function stars(n) {
  let h = '<div class="stars">';
  for (let i=1;i<=5;i++) h += `<div class="star${i>n?' empty':''}"></div>`;
  return h + '</div>';
}

// ── Render Testimonials ────────────────────────────────────────
function renderTestimonials(data) {
  const g = document.getElementById('testi-grid');
  if (!g) return;

  if (!data.length) {
    g.innerHTML='<p style="color:var(--muted);grid-column:1/-1;padding:2rem">No testimonials found for this filter.</p>';
    return;
  }

  g.innerHTML = data.map((t,i) => `
    <div class="testi-card fade-in" style="animation-delay:${i*0.07}s">
      <div class="testi-qmark">"</div>
      ${stars(Number(t.rating) || 0)}
      <p class="testi-text">${t.review||''}</p>
      <div class="testi-author">
        <div class="testi-avatar">${t.initials||(t.patient_name||'P').slice(0,2).toUpperCase()}</div>
        <div>
          <div class="testi-name">${t.patient_name||''}</div>
          <div class="testi-cond">${t.condition||''} · ${t.surgery_year||''}</div>
        </div>
      </div>
    </div>`).join('');
}

function filterT(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  const brain = ['brain','tumour','tumor','cranial','cerebro','aneurysm','craniotomy'];
  const spine = ['spine','spinal','lumbar','cervical','disc','vertebr'];

  let d = allTestimonials;

  if (type==='brain') {
    d = d.filter(t=>brain.some(k=>(t.condition||'').toLowerCase().includes(k)));
  } else if (type==='spine') {
    d = d.filter(t=>spine.some(k=>(t.condition||'').toLowerCase().includes(k)));
  } else if (type==='other') {
    d = d.filter(t=>{
      const c=(t.condition||'').toLowerCase();
      return !brain.some(k=>c.includes(k))&&!spine.some(k=>c.includes(k));
    });
  }

  renderTestimonials(d);
}

// ── Render Blogs ───────────────────────────────────────────────
function renderBlogs(data) {
  const g = document.getElementById('blog-grid');
  if (!g) return;

  if (!data.length) {
    g.innerHTML='<p style="color:var(--muted);grid-column:1/-1;padding:2rem">No blog posts found.</p>';
    return;
  }

  g.innerHTML = data.map((b,i) => `
    <div class="blog-card fade-in" style="animation-delay:${i*0.07}s" onclick="openModal(${b.id})">
      <div class="blog-img ${(b.tag_color||'brain').toLowerCase()}">${b.category||'Article'}</div>
      <div class="blog-body">
        <span class="blog-tag">${b.category||''}</span>
        <div class="blog-title">${b.title||''}</div>
        <p class="blog-excerpt">${b.excerpt||''}</p>
        <div class="blog-meta">
          <span>${b.date||''}</span><span>·</span>
          <span>${b.read_minutes||'?'} min read</span><span>·</span>
          <span class="blog-read">Read →</span>
        </div>
      </div>
    </div>`).join('');
}

function buildBlogCats() {
  const cats = [...new Set(allBlogs.map(b=>b.category).filter(Boolean))];
  const wrap = document.getElementById('blog-cats');
  if (!wrap) return;

  wrap.innerHTML = '<button class="cat-btn active" onclick="filterB(\'all\',this)">All Posts</button>';

  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.textContent = c;
    btn.onclick = function(){filterB(c,this);};
    wrap.appendChild(btn);
  });
}

function filterB(cat, btn) {
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  renderBlogs(cat==='all' ? allBlogs : allBlogs.filter(b=>b.category===cat));
}

// ── Blog Modal ─────────────────────────────────────────────────
function openModal(id) {
  const post = allBlogs.find(b=>b.id==id);
  if (!post) return;

  document.getElementById('modal-tag').innerHTML = `<span class="blog-tag">${post.category||''}</span>`;
  document.getElementById('modal-title').textContent = post.title||'';
  document.getElementById('modal-meta').innerHTML =
    `<span>${post.author||''}</span><span>·</span><span>${post.date||''}</span><span>·</span><span>${post.read_minutes||'?'} min read</span>`;

  document.getElementById('modal-body').innerHTML =
    (post.content || '').replace(/\n/g, "<br>");

  document.getElementById('blog-modal').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeBlogModal(e) {
  if(e.target.id==='blog-modal') closeModal();
}

function closeModal() {
  document.getElementById('blog-modal').classList.remove('open');
  document.body.style.overflow='';
}

document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeModal();
});

// ── Contact form ───────────────────────────────────────────────
function submitForm(e) {
  e.preventDefault();
  const ok = document.getElementById('form-ok');

  ok.style.display='block';

  e.target.querySelectorAll('input,select,textarea')
    .forEach(el=>el.value='');

  setTimeout(()=>ok.style.display='none', 6000);
}

// ── Admin Panel ────────────────────────────────────────────────
function toggleAdmin() {
  document.getElementById('admin-panel').classList.toggle('open');
}

// Excel parsing
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws));
      } catch(err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function uploadTestimonials(input) {
  const status = document.getElementById('testi-status');
  status.textContent = 'Reading…';

  try {
    const rows = await parseExcel(input.files[0]);

    allTestimonials = rows;
    renderTestimonials(allTestimonials);

    status.textContent = `✓ Loaded ${rows.length} testimonials`;
  } catch(e) {
    status.textContent = '✗ ' + e.message;
  }

  input.value = '';
}

async function uploadBlogs(input) {
  const status = document.getElementById('blog-status');
  status.textContent = 'Reading…';

  try {
    const rows = await parseExcel(input.files[0]);

    allBlogs = rows.filter(r => String(r.published).toUpperCase() !== 'FALSE');

    buildBlogCats();
    renderBlogs(allBlogs);

    status.textContent = `✓ Loaded ${allBlogs.length} posts`;
  } catch(e) {
    status.textContent = '✗ ' + e.message;
  }

  input.value = '';
}

// ── Init (IMPORTANT) ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderTestimonials(allTestimonials);
  buildBlogCats();
  renderBlogs(allBlogs);
});
