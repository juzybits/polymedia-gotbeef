/// Dynamic clouds

const IMG_WIDTH = 145; // px
const IMG_HEIGHT = 108; // px
const IMG_SQRT = 125 // px, square root of the area

// Preload images
// import imgDoorOpen from '../../img/door_open.webp';
import imgSteak from '../../img/steak.svg';
// (new Image()).src = imgDoorOpen;
(new Image()).src = imgSteak;

export function reloadClouds(): void
{
    // Remove all clouds
    let el = null;
    while ( el = document.querySelector('.cloud, .steak, .door-closed, .door-open') ) {
        el.parentNode?.removeChild(el);
    }

    // Get window dimensions
    const windowWidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
    const windowHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    // Get the elements that enclose the clouds
    const footer = document.getElementById('footer');
    const moreFromUs = document.getElementById('more-from-us');
    const page = document.getElementById('page');
    if (!footer || !page) return;

    // Paint clouds between the footer and the bottom of the browser window
    paintClouds(
        moreFromUs ? (moreFromUs.offsetTop + moreFromUs.offsetHeight) : (footer.offsetTop + 20),
        windowWidth - IMG_WIDTH,
        windowHeight - IMG_HEIGHT,
        0
    );
    // Paint clouds between the left edge of the browser window and the left edge of the page content
    const sideCloudsBottom = footer.offsetTop - IMG_HEIGHT + 20;
    paintClouds(
        0,
        page.offsetLeft - IMG_WIDTH,
        sideCloudsBottom,
        0
    );
    // Paint clouds between the right edge of the page content and the right edge of the browser window
    paintClouds(
        0,
        windowWidth - IMG_WIDTH,
        sideCloudsBottom,
        page.offsetLeft + page.offsetWidth
    );
    /*
    // Paint door between the right edge of the page content and the right edge of the browser window
    paintDoor(
        0,
        windowWidth - IMG_WIDTH,
        sideCloudsBottom,
        page.offsetLeft + page.offsetWidth
    );
    */
}

function paintClouds(top: number, right: number, bottom: number, left: number): void {
    const cloudFitsInArea = (right > left) && (bottom > top);
    if (!cloudFitsInArea) {
        return;
    }
    const canvasArea = (right-left) * (bottom-top);

    // Add extra clouds based on the area available
    const canvasSqrt = Math.floor( Math.sqrt(canvasArea) );
    const extraClouds = canvasSqrt < 500 ? 0 : Math.floor( (canvasSqrt-500) / IMG_SQRT );
    const cloudCount = getRandomInt(1, 2) + extraClouds;

    for (var i = 0; i < cloudCount; i++) {
        const imgTop = getRandomInt(top, bottom);
        const imgLeft = getRandomInt(left, right);

        const el = document.createElement('span');
        el.className = 'cloud';
        el.setAttribute(
          'style',
          `top: ${imgTop}px; left: ${imgLeft}px`,
        );
        el.addEventListener('click', (_event) => {
            el.className = 'steak';
        });
        document.body.appendChild(el);
    }
}

/*
function paintDoor(top: number, right: number, bottom: number, left: number): void {
    const doorFitsInArea = (right > left) && (bottom > top);
    if (!doorFitsInArea) {
        return;
    }
    const imgTop = getRandomInt(top, bottom);
    const imgLeft = getRandomInt(left, right);

    const el = document.createElement('span');
    el.className = 'door-closed';
    el.setAttribute(
      'style',
      `top: ${imgTop}px; left: ${imgLeft}px`,
    );
    el.addEventListener('click', (_event) => {
        if (el.className == 'door-closed') {
            el.className = 'door-open';
        } else {
            const network = localStorage.getItem('polymedia.network') || 'devnet';
            window.open('https://mountsogol.com?network='+network, '_blank')
        }
    });
    document.body.appendChild(el);
}
*/

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return min + (max - min + 1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32 | 0;
}
