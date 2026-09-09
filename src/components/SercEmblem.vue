<template>
  <div class="serc-seal-container">
    <svg
      class="serc-seal-svg"
      fill="none"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sercSealBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0e2954" />
          <stop offset="100%" stop-color="#051228" />
        </radialGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Outer decorative ring -->
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="#f5c443"
        stroke-dasharray="3 2"
        stroke-width="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="url(#sercSealBg)"
        stroke="#f5c443"
        stroke-width="1.5"
      />

      <!-- Mythical Cambodian Emblem / Garuda motif -->
      <path
        d="M50 16 L54 26 L65 26 L56 33 L60 44 L50 37 L40 44 L44 33 L35 26 L46 26 Z"
        fill="#f5c443"
        filter="url(#goldGlow)"
      />
      <path
        d="M26 62 Q50 48 74 62 Q50 82 26 62 Z"
        fill="#22c55e"
        opacity="0.9"
      />
      <path
        d="M34 58 Q50 42 66 58"
        fill="none"
        stroke="#ffffff"
        stroke-width="2"
      />
      <circle cx="50" cy="50" fill="#f5c443" r="6" />
      <circle cx="50" cy="74" fill="#f5c443" r="3" />
      <path
        d="M42 75 Q50 80 58 75"
        fill="none"
        stroke="#f5c443"
        stroke-width="2"
      />
    </svg>
  </div>
</template>

<style scoped>
.serc-seal-container {
  width: 72px;
  height: 72px;
  min-width: 72px;
  border-radius: 50%;
  background: rgba(8, 21, 46, 0.85);
  padding: 5px;
  border: 1.5px solid rgba(245, 196, 67, 0.5);
  box-shadow: 0 0 16px rgba(245, 196, 67, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.serc-seal-container:hover {
  transform: scale(1.05);
}

.serc-seal-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
</style>
