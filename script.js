const startBtn = document.getElementById('start-btn');

const overlay = document.getElementById('start-overlay');

const scene = document.getElementById('elevator-scene');

const flashEl = document.getElementById('flash-overlay');



startBtn.addEventListener('click', () => {

  overlay.classList.add('is-hidden');

  scene.setAttribute('aria-hidden', 'false');

  document.body.classList.add('doors-open');

  flashEl.classList.add('do-flash');

});

/* ===== FLOOR BUTTONS ===== */

const floorBtns = document.querySelectorAll('.floor-btn');

const summitBtn = document.getElementById('summit-btn');

const svgFloorGroups = {

  '10': document.getElementById('n.10'),

  '5':  document.getElementById('n.5'),

  '0':  document.getElementById('n.0'),

};



/* ===== ARROWS ===== */

const arrowsGroup = document.getElementById('arrows-group');

const floorArrowY = { '10': 338.3, '5': 379.39, '0': 420.49 };

const arrowOriginY = 420.49;



function moveArrowToFloor(floor) {

  if (!arrowsGroup) return;

  const deltaY = floorArrowY[floor] - arrowOriginY;

  const pct = (deltaY / 796.6 * 100).toFixed(3);

  arrowsGroup.style.translate = `0 ${pct}%`;

  arrowsGroup.classList.remove('is-nudging');

  void arrowsGroup.offsetWidth;

  const dur = (0.9 + Math.random() * 0.35).toFixed(2);

  arrowsGroup.style.animationDuration = `${dur}s`;

  arrowsGroup.classList.add('is-nudging');

}



let selectedFloor = null;



function setSelectedFloor(floor) {

  selectedFloor = floor;

  updateSummitEnabled();



    // ขยับลูกศร

    moveArrowToFloor(floor);



    floorBtns.forEach(b => {

      const f = b.dataset.floor;

      const svgG = svgFloorGroups[f];

      if (f === floor) {

        b.classList.add('is-selected');

        b.classList.remove('is-dimmed');

        if (svgG) { svgG.classList.add('is-selected'); svgG.classList.remove('is-dimmed', 'is-hover'); }

      } else {

        b.classList.remove('is-selected');

        b.classList.add('is-dimmed');

        if (svgG) { svgG.classList.remove('is-selected', 'is-hover'); svgG.classList.add('is-dimmed'); }

      }

    });

}



if (floorBtns.length === 0) {

  console.error('No .floor-btn found — open index.html (not ndex.html)');

}



floorBtns.forEach(btn => {

  btn.addEventListener('click', (e) => {

    e.preventDefault();

    e.stopPropagation();

    setSelectedFloor(btn.dataset.floor);

  });



  btn.addEventListener('mouseenter', () => {

    const svgG = svgFloorGroups[btn.dataset.floor];

    if (!svgG) return;

    if (!svgG.classList.contains('is-selected') && !svgG.classList.contains('is-dimmed')) {

      svgG.classList.add('is-hover');

    }

  });



  btn.addEventListener('mouseleave', () => {

    const svgG = svgFloorGroups[btn.dataset.floor];

    if (svgG) svgG.classList.remove('is-hover');

  });

});



/* ===== SUMMIT ===== */

const floorIndicatorContainer = document.querySelector('.floor-indicator-container');

const doorCloseContainer = document.getElementById('door-close-container');



function updateSummitEnabled() {
  if (!summitBtn) return;
  if (window.multiplayer?.inGame?.() && window.multiplayer.isHost()) {
    summitBtn.disabled = false;
    return;
  }
  summitBtn.disabled = !selectedFloor;
}



summitBtn.addEventListener('click', () => {
  if (window.multiplayer?.inGame?.()) {
    if (window.multiplayer.isHost()) {
      window.multiplayer.processRound();
    } else if (selectedFloor) {
      window.multiplayer.submitVote(selectedFloor);
    }
    return;
  }

  if (!selectedFloor) return;

  console.log('Selected floor:', selectedFloor);

  // Step 1: ยืดประตูปิด

  if (doorCloseContainer) {

    doorCloseContainer.classList.add('is-closing');



 doorCloseContainer.addEventListener('animationend', (e) => {

  if (e.animationName === 'doorCloseLeft' || e.animationName === 'doorCloseRight') {

    if (!doorCloseContainer._doorClosed) {

      doorCloseContainer._doorClosed = true;

      return;

    }



    // 1. เปลี่ยนสี body

    document.body.classList.add('is-arrived');



    // 2. ซ่อน control panel

    document.querySelector('.control-panel-container').classList.add('is-hidden');



    // 3. แสดง floor indicator

    if (floorIndicatorContainer) {

      floorIndicatorContainer.classList.add('is-visible');

    }

   // Step 2: ลดความสูงในที่เดิม (ไม่เลื่อน) ให้เท่าฉากประตูใหม่
        doorCloseContainer.classList.replace('is-closing', 'is-shrinking');
        doorCloseContainer._doorClosed = false;

        // Step 3: หดกลับแนวนอน — ใช้ขนาดเล็กที่ล็อกไว้แล้ว
        setTimeout(() => {
          doorCloseContainer.classList.replace('is-shrinking', 'is-opening');
        }, 700);

      }

    });



  } 

});



  updateSummitEnabled();

/* === Control Panel Float after entrance === */

const panelContainer = document.querySelector('.panel-frame');

panelContainer.addEventListener('animationend', (e) => {

  if (e.animationName === 'panelEntrance') {

    panelContainer.classList.add('is-floating');

  }

});
/* --- segment map: which segments are ON per character --- */
const SEG_MAP = {
  //        a      b      c      d      e      f      g
  'G': [true,  false, true,  true,  true,  true,  true ],
  '0': [true,  true,  true,  true,  true,  true,  false],
  '1': [false, true,  true,  false, false, false, false],
  '2': [true,  true,  false, true,  true,  false, true ],
  '3': [true,  true,  true,  true,  false, false, true ],
  '4': [false, true,  true,  false, false, true,  true ],
  '5': [true,  false, true,  true,  false, true,  true ],
  '6': [true,  false, true,  true,  true,  true,  true ],
  '7': [true,  true,  true,  false, false, false, false],
  '8': [true,  true,  true,  true,  true,  true,  true ],
  '9': [true,  true,  true,  true,  false, true,  true ],
  ' ': [false, false, false, false, false, false, false],
};
 
const SEG_NAMES = ['a','b','c','d','e','f','g'];
 
/* Set one SVG digit (d0=tens, d1=units) to a character */
function setDigit(digitId, ch) {
  const segs = SEG_MAP[ch] || SEG_MAP[' '];
  const isG = ch === 'G';
  SEG_NAMES.forEach((s, i) => {
    const el = document.getElementById(`seg-${digitId}-${s}`);
    if (!el) return;
    if (s === 'g') {
      const half = document.getElementById(`seg-${digitId}-g-half`);
      if (isG && half) {
        el.classList.remove('seg-on'); el.classList.add('seg-off');      
        half.classList.add('seg-on');  half.classList.remove('seg-off'); 
      } else {
        if (half) { half.classList.remove('seg-on'); half.classList.add('seg-off'); }
        if (segs[i]) { el.classList.add('seg-on'); el.classList.remove('seg-off'); }
        else          { el.classList.remove('seg-on'); el.classList.add('seg-off'); }
      }
      return;
    }
    if (segs[i]) {
      el.classList.add('seg-on');
      el.classList.remove('seg-off');
    } else {
      el.classList.remove('seg-on');
      el.classList.add('seg-off');
    }
  });
}
 
/* Show floor directly on 7-segment display */
function spinToFloor(floorStr) {
  const isSingle = floorStr === 'G' || floorStr.length === 1;
  const d0el = document.getElementById('seg-d0');
  const d1el = document.getElementById('seg-d1');
  if (isSingle) {
    if (d0el) d0el.style.opacity = '0';
    if (d1el) d1el.setAttribute('transform', 'translate(12,0)');
    setDigit('d0', ' ');
    setDigit('d1', floorStr);
  } else {
    if (d0el) d0el.style.opacity = '1';
    if (d1el) d1el.setAttribute('transform', 'translate(25,0)');
    const digits = floorStr.split('');
    setDigit('d0', digits[0]);
    setDigit('d1', digits[1]);
  }
}

spinToFloor('G');

const LIFT_FLOORS = ['G', '5', '10', '15', '20', '25', '30', '35', '40'];
const LIFT_ARRIVAL_MS = 850;
const LIFT_STEP_MS = 550;

function floorToIndex(floor) {
  const i = LIFT_FLOORS.indexOf(String(floor));
  return i === -1 ? 0 : i;
}

function moveLiftToIndex(idx) {
  document.querySelector('.floor-light.is-lit')?.classList.remove('is-lit');
  const wrap = document.getElementById('direct-panel-wrap');
  if (wrap) wrap.style.setProperty('--direct-step', idx);
  spinToFloor(LIFT_FLOORS[idx]);
  if (window._needleStartSwing) window._needleStartSwing();
  return new Promise((resolve) => {
    setTimeout(() => {
      const floorEl = document.getElementById('floor-' + LIFT_FLOORS[idx]);
      if (floorEl) floorEl.classList.add('is-lit');
      if (window._needleStopSwing) window._needleStopSwing();
      resolve();
    }, LIFT_ARRIVAL_MS);
  });
}

window.setConeStep = (step) => {
  const cone = document.getElementById('cone-marker');
  if (cone) cone.style.setProperty('--step', step);
};

window.resetPlayerVote = () => {
  selectedFloor = null;
  updateSummitEnabled();
  document.querySelectorAll('.floor-btn').forEach((b) => {
    b.classList.remove('is-selected', 'is-dimmed');
  });
};

window.playLiftPath = async (path, onComplete) => {
  if (!path || path.length === 0) {
    if (onComplete) onComplete();
    return;
  }
  for (let i = 1; i < path.length; i++) {
    await moveLiftToIndex(floorToIndex(path[i]));
    await new Promise((r) => setTimeout(r, LIFT_STEP_MS));
  }
  if (onComplete) onComplete();
};

/* === เข็มวัดแรงดัน: แกว่งซ้าย-ขวาเร็วๆ ตอนวิ่ง หยุดตั้งตรงตอนถึงชั้น === */
(() => {
  const pivot = () => document.querySelector('#needle-pivot');
 
  function setAngle(deg) {
    const el = pivot();
    if (el) el.style.transform = `rotate(${deg}deg)`;
  }
 
  let swingAngle = 0;
  let swingDir = 1;
  let swingTimer = null;
 
  function startSwing() {
    if (swingTimer) return;
    swingTimer = setInterval(() => {
      const step = 15 + Math.random() * 15;
      swingAngle += swingDir * step;
      if (swingAngle >= 180) {
        swingAngle = 180;
        swingDir = -1;
      } else if (swingAngle <= -180) {
        swingAngle = -180;
        swingDir = 1;
      }
      setAngle(swingAngle);
    }, 40);
  }
 
  function stopSwing() {
    if (swingTimer) {
      clearInterval(swingTimer);
      swingTimer = null;
    }
    setAngle(0);
  }
 
  window._needleStartSwing = startSwing;
  window._needleStopSwing  = stopSwing;
  setAngle(0);
})();