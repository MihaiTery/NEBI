/* ===== NEBI Coming Soon — Interactive Script ===== */

(function () {
    'use strict';

    // --- DOM Elements ---
    const cat = document.getElementById('cat');
    const catImg = document.getElementById('catImg');
    const speechBubble = document.getElementById('speechBubble');
    const speechText = document.getElementById('speechText');
    const decorations = document.getElementById('decorations');

    // --- Cat sprite files ---
    const SPRITES = {
        IDLE_1: 'PHASE 1.png',
        IDLE_2: 'PHASE 2.png',
        SLEEP: 'PHASE 3.png',
        RUN_1: 'RUN PHASE 1.png',
        RUN_2: 'RUN PHASE 2.png',
        JUMP: 'JUMP PHASE.png'
    };

    // --- State ---
    const STATE_IDLE = 'idle';
    const STATE_RUNNING = 'running';
    const STATE_JUMPING = 'jumping';
    const STATE_SLEEPING = 'sleeping';

    let currentState = STATE_IDLE;
    let idleTimer = null;
    let speechTimer = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isKeyboardMode = false;
    let catX = 0;
    let keysPressed = {};

    // Animation cycling
    let idleCycleInterval = null;
    let idleCycleFrame = 0;
    let runCycleInterval = null;
    let runCycleFrame = 0;

    // --- Speech messages ---
    const SPEECH_MESSAGES = [
        'Mai ai puțină răbdare.',
        'Construim ceva pentru mine.',
        'Miau! Vino mai târziu.',
        'Se lucrează...',
        'Pssst... e secret!',
        '🐟 Pește?'
    ];

    // --- Initialize ---
    function init() {
        setupMouseTracking();
        setupCatClick();
        setupPageClick();
        setupKeyboard();
        startIdleState();
        spawnFish();
        spawnPawPrints();
        preloadImages();
    }

    function preloadImages() {
        Object.values(SPRITES).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // ===== STATE MACHINE =====

    function enterState(newState) {
        if (currentState === newState) return;

        // Exit previous state
        exitState(currentState);

        currentState = newState;

        // Enter new state
        switch (newState) {
            case STATE_IDLE:
                startIdleCycle();
                startIdleTimer();
                break;
            case STATE_RUNNING:
                startRunCycle();
                break;
            case STATE_JUMPING:
                catImg.src = SPRITES.JUMP;
                catImg.classList.remove('cat-jump');
                void catImg.offsetWidth;
                catImg.classList.add('cat-jump');
                setTimeout(() => {
                    catImg.classList.remove('cat-jump');
                    // Return to previous context after jump
                    if (keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
                        enterState(STATE_RUNNING);
                    } else {
                        enterState(STATE_IDLE);
                    }
                }, 400);
                break;
            case STATE_SLEEPING:
                catImg.src = SPRITES.SLEEP;
                showZzz();
                break;
        }
    }

    function exitState(state) {
        switch (state) {
            case STATE_IDLE:
                stopIdleCycle();
                clearTimeout(idleTimer);
                break;
            case STATE_RUNNING:
                stopRunCycle();
                break;
            case STATE_SLEEPING:
                hideZzz();
                break;
        }
    }

    // --- Idle State: cycle Phase 1 ↔ Phase 2 ---
    function startIdleState() {
        enterState(STATE_IDLE);
    }

    function startIdleCycle() {
        idleCycleFrame = 0;
        catImg.src = SPRITES.IDLE_1;
        idleCycleInterval = setInterval(() => {
            idleCycleFrame = (idleCycleFrame + 1) % 2;
            catImg.src = idleCycleFrame === 0 ? SPRITES.IDLE_1 : SPRITES.IDLE_2;
        }, 800);
    }

    function stopIdleCycle() {
        clearInterval(idleCycleInterval);
        idleCycleInterval = null;
    }

    // --- Run State: cycle RUN PHASE 1 ↔ RUN PHASE 2 ---
    function startRunCycle() {
        runCycleFrame = 0;
        catImg.src = SPRITES.RUN_1;
        runCycleInterval = setInterval(() => {
            runCycleFrame = (runCycleFrame + 1) % 2;
            catImg.src = runCycleFrame === 0 ? SPRITES.RUN_1 : SPRITES.RUN_2;
        }, 200);
    }

    function stopRunCycle() {
        clearInterval(runCycleInterval);
        runCycleInterval = null;
    }

    // --- Sleep: 10s inactivity ---
    function startIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            enterState(STATE_SLEEPING);
        }, 10000);
    }

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        if (currentState === STATE_SLEEPING) {
            enterState(STATE_IDLE);
        } else if (currentState === STATE_IDLE) {
            // Restart the 10s countdown
            startIdleTimer();
        }
    }

    // --- ZZZ management ---
    function showZzz() {
        if (!cat.querySelector('.zzz')) {
            const zzz = document.createElement('div');
            zzz.className = 'zzz visible';
            zzz.textContent = 'Z z Z';
            cat.appendChild(zzz);
        }
    }

    function hideZzz() {
        const zzz = cat.querySelector('.zzz');
        if (zzz) zzz.remove();
    }

    // --- Wake up from any state to idle ---
    function wakeUp() {
        enterState(STATE_IDLE);
    }

    // --- Mouse Tracking ---
    function setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            resetIdleTimer();
            handleMouseProximity(e);
        });
    }

    function handleMouseProximity(e) {
        if (isKeyboardMode) return;
        if (currentState === STATE_SLEEPING) return;

        const catRect = cat.getBoundingClientRect();
        const catCenterX = catRect.left + catRect.width / 2;

        const dx = e.clientX - catCenterX;
        const dy = e.clientY - (catRect.top + catRect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Face toward mouse
        cat.style.transform = `scaleX(${dx < 0 ? -1 : 1})`;

        // Attention animation when mouse is nearby
        if (distance < 200 && distance > 50) {
            if (!catImg.classList.contains('cat-attention') && !catImg.classList.contains('cat-jump')) {
                catImg.classList.add('cat-attention');
                setTimeout(() => catImg.classList.remove('cat-attention'), 600);
            }
        }
    }

    // --- Cat Click ---
    function setupCatClick() {
        cat.addEventListener('click', (e) => {
            e.stopPropagation();
            wakeUp();

            // Jump
            enterState(STATE_JUMPING);

            // Show speech bubble
            showSpeechBubble();
        });

        // Hover jump
        cat.addEventListener('mouseenter', () => {
            if (currentState === STATE_IDLE) {
                catImg.classList.remove('cat-jump');
                void catImg.offsetWidth;
                catImg.classList.add('cat-jump');
                setTimeout(() => catImg.classList.remove('cat-jump'), 400);
            }
        });
    }

    function showSpeechBubble() {
        clearTimeout(speechTimer);
        const msg = SPEECH_MESSAGES[Math.floor(Math.random() * SPEECH_MESSAGES.length)];
        speechText.textContent = msg;
        speechBubble.classList.add('visible');

        speechTimer = setTimeout(() => {
            speechBubble.classList.remove('visible');
        }, 2500);
    }

    // --- Page Click (spawn ball) ---
    function setupPageClick() {
        document.addEventListener('click', (e) => {
            if (cat.contains(e.target)) return;
            resetIdleTimer();
            spawnBall(e.clientX, e.clientY);
        });
    }

    function spawnBall(x, y) {
        const ball = document.createElement('div');
        ball.className = 'pixel-ball';
        ball.style.left = x - 8 + 'px';
        ball.style.top = y - 8 + 'px';
        document.body.appendChild(ball);

        // Cat looks at ball
        const catRect = cat.getBoundingClientRect();
        const catCenterX = catRect.left + catRect.width / 2;
        cat.style.transform = `scaleX(${x < catCenterX ? -1 : 1})`;

        setTimeout(() => ball.remove(), 1500);
    }

    // --- Keyboard Easter Egg ---
    function setupKeyboard() {
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.id = 'keyboardHint';
        hint.textContent = '← → mișcă pisica  |  SPACE = sare';
        document.body.appendChild(hint);

        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();

                const wasPressed = keysPressed[e.code];
                keysPressed[e.code] = true;

                if (!isKeyboardMode) {
                    activateKeyboardMode();
                }

                resetIdleTimer();

                if (e.code === 'Space') {
                    if (currentState !== STATE_JUMPING) {
                        enterState(STATE_JUMPING);
                    }
                } else if (!wasPressed) {
                    // Start running on first press
                    if (currentState !== STATE_JUMPING) {
                        enterState(STATE_RUNNING);
                    }
                    handleMovement(e.code);
                } else {
                    // Repeated keydown (held key)
                    handleMovement(e.code);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            keysPressed[e.code] = false;

            // If no arrow keys held and not jumping, return to idle
            if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') &&
                !keysPressed['ArrowLeft'] && !keysPressed['ArrowRight'] &&
                currentState === STATE_RUNNING) {
                enterState(STATE_IDLE);
            }
        });
    }

    function activateKeyboardMode() {
        isKeyboardMode = true;

        const catArea = document.querySelector('.cat-area');
        catArea.style.position = 'relative';
        catArea.style.width = '100%';

        cat.classList.add('moveable');
        catX = 0;
        cat.style.left = `calc(50% - 80px + ${catX}px)`;

        const hint = document.getElementById('keyboardHint');
        hint.classList.add('visible');
        setTimeout(() => hint.classList.remove('visible'), 3000);
    }

    function handleMovement(code) {
        const step = 24;

        if (code === 'ArrowLeft') {
            catX -= step;
            cat.style.transform = 'scaleX(-1)';
            cat.style.left = `calc(50% - 80px + ${catX}px)`;
        } else if (code === 'ArrowRight') {
            catX += step;
            cat.style.transform = 'scaleX(1)';
            cat.style.left = `calc(50% - 80px + ${catX}px)`;
        }
    }

    // --- Fish Decorations ---
    function spawnFish() {
        const fishEmojis = ['🐟', '🐠', '🐡'];

        function createFish() {
            const fish = document.createElement('div');
            fish.className = 'pixel-fish' + (Math.random() > 0.5 ? ' reverse' : '');
            fish.textContent = fishEmojis[Math.floor(Math.random() * fishEmojis.length)];
            fish.style.top = (10 + Math.random() * 80) + '%';
            fish.style.animationDuration = (12 + Math.random() * 18) + 's';
            fish.style.fontSize = (18 + Math.random() * 12) + 'px';
            fish.style.opacity = 0.3 + Math.random() * 0.3;
            decorations.appendChild(fish);

            fish.addEventListener('animationend', () => fish.remove());
        }

        for (let i = 0; i < 3; i++) {
            setTimeout(createFish, i * 2000);
        }

        setInterval(createFish, 6000 + Math.random() * 4000);
    }

    // --- Paw Prints ---
    function spawnPawPrints() {
        function createPaw() {
            const paw = document.createElement('div');
            paw.className = 'paw-print';
            paw.textContent = '🐾';
            paw.style.left = (5 + Math.random() * 90) + '%';
            paw.style.top = (5 + Math.random() * 90) + '%';
            paw.style.fontSize = (14 + Math.random() * 10) + 'px';
            document.body.appendChild(paw);

            setTimeout(() => paw.remove(), 2500);
        }

        setInterval(createPaw, 3000 + Math.random() * 3000);
    }

    // --- Touch Support (mobile) ---
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        resetIdleTimer();
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        resetIdleTimer();
    });

    // --- Start ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
