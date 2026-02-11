/**
 * BURGER KING MOROCCO - TOMBOLA ENGINE
 */

// --- CONFIGURATION ---
const WIN_RATE = 0.10; // 10% Chance of winning
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // Replace with your deployment URL

const PRIZES = [
    { label: "Free Meal", isWin: true, angle: 0 },
    { label: "Better Luck!", isWin: false, angle: 72 },
    { label: "Free Side", isWin: true, angle: 144 },
    { label: "Better Luck!", isWin: false, angle: 216 },
    { label: "Discount -10%", isWin: true, angle: 288 }
];

// --- NAVIGATION LOGIC ---
function navigateTo(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo(0, 0);
}

// --- LOADER ---
window.addEventListener('load', () => {
    const progress = document.querySelector('.progress');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
            }, 500);
        } else {
            width += 5;
            progress.style.width = width + '%';
        }
    }, 50);
});

// --- FORM HANDLING ---
const dataForm = document.getElementById('dataForm');
dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Anti-fraud Check
    if (localStorage.getItem('bk_played')) {
        alert("You have already participated! One entry per guest.");
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loader').classList.remove('hidden');

    const formData = new FormData(dataForm);
    const data = Object.fromEntries(formData.entries());

    // AI Greeting Animation
    document.getElementById('dynamic-greeting').innerText = `Preparing your luck, ${data.firstName}! 🍔`;

    try {
        // Send data to Google Sheets
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        });
        
        setTimeout(() => {
            navigateTo('tombola');
        }, 1500);
    } catch (error) {
        console.error("Submission failed", error);
        // Fallback to allow play anyway for UX
        navigateTo('tombola');
    }
});

// --- WHEEL LOGIC ---
let isSpinning = false;

function spinWheel() {
    if (isSpinning) return;
    if (localStorage.getItem('bk_played')) {
        alert("Wait for your previous prize!");
        return;
    }

    isSpinning = true;
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    
    // 1. Determine Win/Loss based on probability
    const isWinner = Math.random() < WIN_RATE;
    
    // 2. Filter available outcomes
    const possiblePrizes = isWinner 
        ? PRIZES.filter(p => p.isWin) 
        : PRIZES.filter(p => !p.isWin);
    
    const result = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];
    
    // 3. Calculate rotation
    // Add 5-10 full spins for effect + the target angle
    const extraSpins = (Math.floor(Math.random() * 5) + 5) * 360;
    const finalRotation = extraSpins + (360 - result.angle);
    
    wheel.style.transform = `rotate(${finalRotation}deg)`;
    spinBtn.disabled = true;

    // 4. On Animation End
    setTimeout(() => {
        showResult(result);
        localStorage.setItem('bk_played', 'true');
    }, 4100);
}

function showResult(prize) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('resultTitle');
    const msg = document.getElementById('resultMessage');
    const coupon = document.getElementById('couponArea');

    modal.style.display = 'flex';

    if (prize.isWin) {
        title.innerText = "CHAMPION!";
        msg.innerText = `You just won a ${prize.label}. Grill-icious!`;
        document.getElementById('couponCode').innerText = "BK-" + Math.random().toString(36).substr(2, 6).toUpperCase();
        coupon.classList.remove('hidden');
        
        // Confetti!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D62300', '#F5A100', '#502314']
        });
    } else {
        title.innerText = "SO CLOSE!";
        msg.innerText = "The flames are still hot, but no prize this time. Enjoy your meal!";
        coupon.classList.add('hidden');
    }
}

// --- Anti-Fraud Configuration ---
const SECURITY = {
    playKey: 'bk_morocco_2025_status',
    winRate: 0.05 // 5% chance. Set to 0.00 for 0% chance.
};

function secureFormSubmit() {
    // 1. Validate Form
    const name = document.getElementById('name').value;
    if(name.length < 2) return;

    // 2. Mark session as "Authorized to Spin"
    sessionStorage.setItem('can_spin', 'true');
    
    // 3. Dynamic transition
    showLoader();
    setTimeout(() => nextPage('tombola'), 1000);
}

function handleSpin() {
    // SECURITY CHECK: Did they come from the form?
    if(!sessionStorage.getItem('can_spin')) {
        alert("Access Denied: Please fill the form first.");
        return;
    }
    
    // SECURITY CHECK: Have they played today?
    if(localStorage.getItem(SECURITY.playKey)) {
        alert("Your crown is already claimed for today!");
        return;
    }

    // Determine result BEFORE animation (Server-side simulation)
    const seed = Math.random();
    const isWinner = seed < SECURITY.winRate;
    
    // Execute animation based on fixed result
    animateWheel(isWinner);
    
    // Burn the session immediately so they can't spin twice
    localStorage.setItem(SECURITY.playKey, 'played');
    sessionStorage.removeItem('can_spin');
}