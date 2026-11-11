export const triggerConfetti = () => {
  if (typeof window === 'undefined') return;
  import('canvas-confetti').then((confettiModule) => {
    const confetti = confettiModule.default;
    // Launch celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#f59e0b', '#ef4444'],
      });
    }, 200);
  }).catch((err) => {
    console.warn('Confetti could not be triggered', err);
  });
};
