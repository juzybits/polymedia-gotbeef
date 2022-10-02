/// Dynamic clouds

const IMG_WIDTH = 145; // px
const IMG_HEIGHT = 108; // px
const IMG_SQRT = 125 // px, square root of the area

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
    const canvasBottom = windowHeight-IMG_HEIGHT/2;
    const cloudFitsInGap = canvasBottom > canvasTop;
    if (!cloudFitsInGap) {
        // console.debug('[clouds] No space')
        return;
    }
    const canvasArea = windowWitdth * (canvasBottom - canvasTop);

    // Add extra clouds based on the area of the gap
    const canvasSqrt = Math.floor( Math.sqrt(canvasArea) );
    const extraClouds = canvasSqrt < 600 ? 0 : Math.floor( (canvasSqrt-475) / IMG_SQRT );
    const cloudCount = 1 + extraClouds;
    // console.debug('[clouds]', canvasSqrt, cloudCount);

    for (var i = 0; i < cloudCount; i++) {
        const top = getRandomInt(canvasTop, canvasBottom);
        const left = getRandomInt(-IMG_WIDTH/2, windowWitdth-IMG_WIDTH);

        const el = document.createElement('span');
        el.className = 'cloud';
        el.setAttribute(
          'style',
          `top: ${top}px; left: ${left}px`,
        );
        el.addEventListener('click', (event) => {
            el.className = 'steak';
        });
        document.body.appendChild(el);
    }
}
addEventListener('resize', removeClouds);

function removeClouds() {
    let el = null;
    while ( el = document.querySelector('.cloud, .steak') ) {
        el.parentNode.removeChild(el);
    }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return min + (max - min + 1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32 | 0;
}
