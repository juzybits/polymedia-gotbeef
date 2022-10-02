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
