<template>
  <main class="flex-grow bg-surface w-full">
    <!-- CTA SECTION -->
    <section class="cta-section relative w-full min-h-[819px] flex items-center justify-center overflow-hidden py-32 is-visible bg-surface">
        <div class="cta-watermark">CLIENTOS</div>
        <div class="cta-glow"></div>
        <div class="relative z-10 flex flex-col items-center text-center px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto">
            <h2 class="cinematic-reveal font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg mb-stack-md max-w-4xl tracking-tight text-on-surface">
                Stop sending update emails.
            </h2>
            <p class="cinematic-reveal delay-100 font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl">
                Give your clients a portal that makes you look world-class.
            </p>
            <div class="flex flex-col sm:flex-row gap-6 items-center justify-center">
                <router-link to="/signup" class="btn-primary px-8 py-4 font-label-sm text-label-sm uppercase tracking-widest inline-flex items-center justify-center min-w-[200px]">
                    Start Free Trial
                </router-link>
                <router-link to="/signup" class="btn-secondary px-8 py-4 font-label-sm text-label-sm uppercase tracking-widest inline-flex items-center justify-center min-w-[200px]">
                    See a Live Demo
                </router-link>
            </div>
        </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="bg-surface dark:bg-surface border-t border-outline-variant/20 w-full px-margin-desktop py-stack-lg flex flex-col justify-between items-center relative z-10" style="background-color: #131318;">
      <div class="max-w-[1440px] mx-auto w-full flex flex-col gap-16">
          <!-- 4-Column Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 w-full">
              <!-- Column 1: Brand -->
              <div class="col-span-1 md:col-span-1 flex flex-col gap-4">
                  <span class="font-headline-lg text-headline-lg text-on-surface dark:text-on-surface tracking-tighter block mb-2">
                      ClientOS
                  </span>
                  <p class="font-body-md text-body-md text-on-surface-variant/70 max-w-xs">
                      Cinematic Intelligence for independent teams.
                  </p>
              </div>

              <!-- Column 2: Product Links -->
              <div class="col-span-1 flex flex-col gap-4">
                  <h4 class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant mb-2">Product</h4>
                  <ul class="flex flex-col gap-3">
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#platform">Platform</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#intelligence">Intelligence</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#network">Network</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#pricing">Pricing</a></li>
                  </ul>
              </div>

              <!-- Column 3: Company -->
              <div class="col-span-1 flex flex-col gap-4">
                  <h4 class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant mb-2">Company</h4>
                  <ul class="flex flex-col gap-3">
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#about">About</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#careers">Careers</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#contact">Contact</a></li>
                      <li class=""><a class="footer-link font-body-md text-body-md text-on-surface-variant cursor-pointer" href="#legal">Legal</a></li>
                  </ul>
              </div>

              <!-- Column 4: Social Icons -->
              <div class="col-span-1 flex flex-col gap-4">
                  <h4 class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant mb-2">Social</h4>
                  <div class="flex gap-4">
                      <!-- Clean minimal icons representation using text/symbols for Noir aesthetic -->
                      <a class="w-10 h-10 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-[#F0EDE6] hover:border-[#F0EDE6] transition-colors duration-200" href="#x">
                          <span class="font-label-sm uppercase">X</span>
                      </a>
                      <a class="w-10 h-10 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-[#F0EDE6] hover:border-[#F0EDE6] transition-colors duration-200" href="#in">
                          <span class="font-label-sm uppercase">IN</span>
                      </a>
                      <a class="w-10 h-10 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-[#F0EDE6] hover:border-[#F0EDE6] transition-colors duration-200" href="#ig">
                          <span class="font-label-sm uppercase">IG</span>
                      </a>
                  </div>
              </div>
          </div>

          <!-- Bottom Bar -->
          <div class="w-full pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <span class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant/50">
                  © 2024 ClientOS. Cinematic Intelligence.
              </span>
              <span class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant/50">
                  Built for the world's best independent teams.
              </span>
          </div>
      </div>
  </footer>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    // Simple Intersection Observer to trigger CTA glow on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.3 });

    const ctaSection = document.querySelector('.cta-section');
    if (ctaSection) {
        observer.observe(ctaSection);
    }
});
</script>

<style>
.cta-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%);
    font-size: 400px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    letter-spacing: -0.05em;
    color: white;
    opacity: 0.03;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    line-height: 1;
}

.cta-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    height: 80vw;
    background: radial-gradient(circle, #C9A84C 0%, transparent 60%);
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    transition: opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.cta-section.is-visible .cta-glow {
    opacity: 0.06;
}

.btn-primary {
    background-color: theme('colors.primary-container');
    color: black;
    border-radius: 1px;
    transition: transform 250ms ease-in-out, background-color 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.btn-primary:hover {
    transform: scale(1.03);
    background-color: theme('colors.primary');
}

.btn-secondary {
    background-color: transparent;
    color: theme('colors.primary-container');
    border: 1px solid theme('colors.primary-container');
    border-radius: 1px;
    transition: transform 250ms ease-in-out, background-color 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.btn-secondary:hover {
    transform: scale(1.03);
    background-color: rgba(201, 168, 76, 0.05); /* Primary container with low opacity */
}

/* Cinematic transition easing */
.cinematic-transition {
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
    transition-duration: 400ms;
}

.cinematic-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
}

.is-visible .cinematic-reveal {
    opacity: 1;
    transform: translateY(0);
}

.delay-100 {
    transition-delay: 100ms;
}

@media (prefers-reduced-motion: reduce) {
    .cta-glow,
    .btn-primary,
    .btn-secondary,
    .cinematic-transition,
    .cinematic-reveal {
        transition: none;
    }
    .cinematic-reveal {
        opacity: 1;
        transform: none;
    }
}

.footer-link {
    transition: color 200ms ease;
}
.footer-link:hover {
    color: #F0EDE6 !important;
}
</style>
