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

/// Dynamic clouds

import cloudImage from '../../img/cloud.png';
import steakImage from '../../img/steak.svg';

const cloudWidth = 145; // px
const cloudHeight = 108; // px

export function reloadClouds()
{
    let el = null;
    while ( el = document.querySelector('.cloud') ) {
        el.parentNode.removeChild(el);
    }

    const windowWitdth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    const windowHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    // if (windowWitdth < 810) {
    //     console.log('OUT', windowWitdth, windowHeight); // TODO Remove
    //     return;
    // }

    const extraClouds = windowWitdth < 810 ? 0 : Math.floor( (windowWitdth-810) / 500 );
    const cloudCount = 1 + extraClouds;
    const footerOffsetTop = document.getElementById('footer').offsetTop;
    console.log('IIIII', windowWitdth, windowHeight, footerOffsetTop, cloudCount); // TODO Remove

    if (footerOffsetTop > windowHeight-cloudHeight) {
        return;
    }

    for (var i = 0; i < cloudCount; i++) {
        const top = getRandomInt(footerOffsetTop, windowHeight-cloudHeight);
        const left = getRandomInt(25-cloudWidth, windowWitdth-cloudWidth);

        const el = document.createElement('img');
        el.className = 'cloud';
        el.setAttribute(
          'style',
          `top: ${top}px; left: ${left}px`,
        );
        el.src = cloudImage;
        el.addEventListener('click', (event) => {
            console.log('Clicked');
            el.src = steakImage;
        }, false);
        document.body.appendChild(el);
    }
}
addEventListener('resize', (event) => { // TODO: delay/buffer
    // console.log('Reloading clouds'); // TODO Remove
    reloadClouds();
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return min + (max - min + 1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32 | 0;
}
