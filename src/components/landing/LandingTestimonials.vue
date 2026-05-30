<template>
  <main id="network" class="w-full py-24 md:py-32 flex flex-col gap-16 bg-surface-container-lowest">
    <header class="px-margin-desktop flex flex-col items-center text-center gap-4 max-w-[1440px] mx-auto w-full">
        <h2 class="font-label-sm text-label-sm text-primary tracking-[0.2em] uppercase">Client Perspectives</h2>
        <h3 class="font-headline-xl text-headline-xl text-on-surface max-w-2xl">The difference between a vendor and a partner.</h3>
    </header>
    
    <!-- Carousel Container -->
    <div class="w-full relative flex justify-center">
        <div class="flex overflow-x-auto hide-scrollbar gap-gutter px-margin-desktop cursor-grab active:cursor-grabbing snap-x snap-mandatory py-4 max-w-full" id="testimonial-carousel">
            
            <!-- Card 1 -->
            <article class="testimonial-card flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[38vw] max-w-[500px] bg-surface border border-outline-variant rounded-none p-8 md:p-12 flex flex-col justify-between gap-8 snap-center opacity-0 translate-x-10 transition-all duration-[600ms] ease-cinematic hover:-translate-y-2 hover:border-primary-container group">
                <div class="flex flex-col gap-6">
                    <span class="font-display-lg text-display-lg text-primary-container leading-none opacity-80">"</span>
                    <p class="font-headline-lg text-[22px] md:text-[24px] leading-[1.6] text-on-surface transition-colors group-hover:text-white">
                        We stopped sending 14-email threads the day we switched. Our clients feel like they're working with a proper agency now.
                    </p>
                </div>
                <div class="flex items-center gap-4 pt-6 border-t border-outline-variant/30">
                    <img alt="Avatar of Sarah M." class="w-10 h-10 object-cover rounded-full grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgrjfw3nVVdpWQKOmIhrYQwU2BK8Au7_42pd13RXsJEwUS1JdHXTHStoOnSjeNxKqz-96GqIvcK3Xlw7KGm-ioJ-4b0B7IGOD_eoSUuvE5KLODyfZ91rUz2apww2huY58e81AngBIic2Zpql_P_tYiNBDo9lj1asp3EyylcaEZDxpqUojI5b8lZobAM20Gb_9T39_ChbW7JBpQ7tCyw-V9f-ZBrfglkVtxPvvTGxjUmlwyx6sYsPX32lP3YOMhV45kJakKyE_UjRQ"/>
                    <div class="flex flex-col">
                        <span class="font-body-md text-body-md text-on-surface">Sarah M.</span>
                        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Creative Director, Fold Studio</span>
                    </div>
                </div>
            </article>

            <!-- Card 2 -->
            <article class="testimonial-card flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[38vw] max-w-[500px] bg-surface border border-outline-variant rounded-none p-8 md:p-12 flex flex-col justify-between gap-8 snap-center opacity-0 translate-x-10 transition-all duration-[600ms] ease-cinematic hover:-translate-y-2 hover:border-primary-container group" style="transition-delay: 150ms;">
                <div class="flex flex-col gap-6">
                    <span class="font-display-lg text-display-lg text-primary-container leading-none opacity-80">"</span>
                    <p class="font-headline-lg text-[22px] md:text-[24px] leading-[1.6] text-on-surface transition-colors group-hover:text-white">
                        The AI summary feature alone saves me 2 hours a week. I just paste my Slack notes and it writes the client update for me.
                    </p>
                </div>
                <div class="flex items-center gap-4 pt-6 border-t border-outline-variant/30">
                    <img alt="Avatar of James T." class="w-10 h-10 object-cover rounded-full grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLeETLinvGxvZN-mP6z9OYc3WAQDhByCuIYLo3WGMw6F3DCnPJfGKU68BJt4paWDmXt8PUTk7U0xtVxWmaVlWNz0tMIxdpuC0YHzxSMvvvedr08VXP6qXhY4QmaFe2tLheSnlTba4mARxnHLy98Xyv5p2aoc_A7QEQK0y7rwWmjKZdtmoTppVxLRSz7yrxNJwx-wpp_GMxwn_yghmD5AcoOvNNeXAqpsGp3ZT-XMy0GH8FS_R3g8gJ45pMWJYMAv-9kgavVXbovAs"/>
                    <div class="flex flex-col">
                        <span class="font-body-md text-body-md text-on-surface">James T.</span>
                        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Product Designer</span>
                    </div>
                </div>
            </article>

            <!-- Card 3 -->
            <article class="testimonial-card flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[38vw] max-w-[500px] bg-surface border border-outline-variant rounded-none p-8 md:p-12 flex flex-col justify-between gap-8 snap-center opacity-0 translate-x-10 transition-all duration-[600ms] ease-cinematic hover:-translate-y-2 hover:border-primary-container group" style="transition-delay: 300ms;">
                <div class="flex flex-col gap-6">
                    <span class="font-display-lg text-display-lg text-primary-container leading-none opacity-80">"</span>
                    <p class="font-headline-lg text-[22px] md:text-[24px] leading-[1.6] text-on-surface transition-colors group-hover:text-white">
                        Every portal feels like it was made for that specific client. Our retention improved noticeably after switching.
                    </p>
                </div>
                <div class="flex items-center gap-4 pt-6 border-t border-outline-variant/30">
                    <img alt="Avatar of Priya K." class="w-10 h-10 object-cover rounded-full grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnzkMG4lLoh1h13_uzaMqj6m7m2eXtqby0LVdQ2Uxn8M3-oa8ZB3IIxFiEzDxPSq-9-EbJ1KL_Zm9_tpSp16nVHfGQcPtGZ7V9_JuQAuoBeNy80s1Xi3F1JeMkb_jPvC_DzkSBld2cO8Cjy7xbEiLSGFk2PBY_0tfsKqsS3kCoAS3sbpvusJXnlglBnoy1c1Z-mKsl9krpslXpDJf3yYRR-csclQgTcPHtkcJLq5KXnAAbEid_oAZYVUKkZVQ_qOrHux01FtARh9U"/>
                    <div class="flex flex-col">
                        <span class="font-body-md text-body-md text-on-surface">Priya K.</span>
                        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Founder, Signal Agency</span>
                    </div>
                </div>
            </article>
        </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    // Intersection Observer for Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.testimonial-card');
                cards.forEach(card => {
                    card.classList.remove('opacity-0', 'translate-x-10');
                    card.classList.add('opacity-100', 'translate-x-0');
                });
                observerInstance.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const carouselSection = document.getElementById('testimonial-carousel');
    if (carouselSection) {
        observer.observe(carouselSection);
    }

    // Drag to Scroll Logic for Carousel
    const slider = document.getElementById('testimonial-carousel');
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast multiplier
            slider.scrollLeft = scrollLeft - walk;
        });
    }
});
</script>

<style>
/* Hide Scrollbar for Carousel */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Smooth Dragging Cursor */
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }

/* Cinematic Easing */
.ease-cinematic {
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
