/// Confetti effect

import JSConfetti from 'js-confetti';

export function showConfetti(emoji?: string) {
    let config = !emoji ? {} : {
        emojis: [emoji],
        emojiSize: 175,
        confettiNumber: 18,
    };
    (new JSConfetti()).addConfetti(config);
}

/// Dynamic clouds // TODO turn in to class in its own file

const cloudWidth = 145; // px
const cloudHeight = 108; // px
const cloudSqroot = 125 // px, square root of the area

export function reloadClouds()
{
    removeClouds();

    // Get window dimensions
    const windowWitdth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
    const windowHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    // Find the area of the gap between the footer and the bottom of the window
    const canvasTop = document.getElementById('footer').offsetTop + 16;
    const canvasBottom = windowHeight-cloudHeight/2;
    const cloudFitsInGap = canvasBottom > canvasTop;
    if (!cloudFitsInGap) {
        console.debug('[clouds] No space')
        return;
    }
    const canvasArea = windowWitdth * (canvasBottom - canvasTop);

    // Add extra clouds based on the area of the gap
    const canvasSqrt = Math.floor( Math.sqrt(canvasArea) );
    const extraClouds = canvasSqrt < 600 ? 0 : Math.floor( (canvasSqrt-475) / cloudSqroot );
    const cloudCount = 1 + extraClouds;
    console.debug('[clouds]', canvasSqrt, cloudCount);

    for (var i = 0; i < cloudCount; i++) {
        const top = getRandomInt(canvasTop, canvasBottom);
        const left = getRandomInt(-cloudWidth/2, windowWitdth-cloudWidth);

        const el = document.createElement('span');
        el.className = 'cloud';
        el.setAttribute(
          'style',
          `top: ${top}px; left: ${left}px`,
        );
        el.addEventListener('click', (event) => {
            el.className = el.className=='cloud' ? 'steak' : 'cloud';
        }, false);
        document.body.appendChild(el);
    }
}
let locked = false;
addEventListener('resize', () => {
    if (locked) {
        return;
    }
    locked = true;
    removeClouds();
    setTimeout(() => {
        reloadClouds();
        locked = false;
    }, 500);
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return min + (max - min + 1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32 | 0;
}

// Remove all .cloud elements
function removeClouds() {
    let el = null;
    while ( el = document.querySelector('.cloud,.steak') ) {
        el.parentNode.removeChild(el);
    }
}
