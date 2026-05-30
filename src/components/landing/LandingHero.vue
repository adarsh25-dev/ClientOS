<template>
  <main class="flex-grow flex items-center pt-[100px] pb-stack-lg relative overflow-hidden">
    <!-- Abstract Ink Background (Simulated via CSS gradients) -->
    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background: radial-gradient(circle at 70% 30%, rgba(201, 168, 76, 0.15), transparent 40%), radial-gradient(circle at 30% 70%, rgba(201, 168, 76, 0.05), transparent 50%); filter: blur(40px);"></div>
    
    <div class="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-gutter z-10">
        <!-- Left: Content (55%) -->
        <div class="w-full md:w-[55%] flex flex-col gap-stack-lg mt-stack-lg md:mt-0">
            <h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-[0.9] tracking-tight font-light" ref="heroHeadline">
                Your clients <br/>
                deserve a <br/>
                better experience.
            </h1>
            
            <div class="mt-stack-md flex items-center opacity-0 animate-fade-in-up" style="animation-delay: 800ms; animation-fill-mode: forwards;">
                <router-link to="/signup" class="inline-flex items-center justify-center font-label-sm text-label-sm uppercase tracking-[0.1em] border border-[#252321] text-[rgba(208,197,178,0.6)] px-8 py-4 hover:bg-[#252321] hover:text-[#0A0A0F] transition-all duration-400 ease-out" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">
                    Get Early Access
                </router-link>
            </div>
        </div>
        
        <!-- Right: Mockup (45%) -->
        <div class="w-full md:w-[45%] mt-stack-lg md:mt-0 perspective-[1000px] flex justify-end">
            <div class="hero-mockup mockup-shadow bg-surface-container/80 backdrop-blur-sm border border-[#252321] rounded-none p-stack-md w-full max-w-[500px]" ref="heroMockup">
                <!-- Mockup Header -->
                <div class="flex justify-between items-center border-b border-[#252321] pb-stack-sm mb-stack-md">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[20px]">dataset</span>
                        <span class="font-label-sm text-label-sm uppercase text-[rgba(208,197,178,0.6)]">Portfolio Overview</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="h-2 w-2 rounded-full bg-[#4A5C4E]"></div>
                        <span class="font-label-sm text-[10px] uppercase text-[rgba(208,197,178,0.6)] tracking-wider">Live Sync</span>
                    </div>
                </div>
                
                <!-- Mockup Content -->
                <div class="flex flex-col gap-stack-md">
                    <div class="flex items-end justify-between">
                        <div>
                            <div class="font-label-sm text-[10px] uppercase text-[rgba(208,197,178,0.6)] mb-1">Total Assets managed</div>
                            <div class="font-headline-lg text-headline-lg text-on-surface">$142.5M</div>
                        </div>
                        <div class="text-[#4A5C4E] font-label-sm flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">trending_up</span>
                            +2.4%
                        </div>
                    </div>
                    
                    <!-- Progress Section -->
                    <div>
                        <div class="flex justify-between font-label-sm text-[10px] text-[rgba(208,197,178,0.6)] mb-2">
                            <span>Quarterly Target</span>
                            <span>85%</span>
                        </div>
                        <div class="h-[2px] w-full bg-[#252321] relative">
                            <div class="absolute left-0 top-0 h-full bg-primary w-[85%]"></div>
                        </div>
                    </div>
                    
                    <!-- Client List Snippet -->
                    <div class="mt-stack-sm flex flex-col gap-3">
                        <div class="flex items-center justify-between py-2 border-b border-[#252321]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-surface-container-high border border-[#252321] flex items-center justify-center text-primary font-label-sm">EH</div>
                                <span class="font-body-md text-sm text-on-surface">Evelyn Harper</span>
                            </div>
                            <div class="font-body-md text-sm text-[rgba(208,197,178,0.6)]">Awaiting Sig</div>
                        </div>
                        
                        <div class="flex items-center justify-between py-2 border-b border-[#252321]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-surface-container-high border border-[#252321] flex items-center justify-center text-primary font-label-sm">MW</div>
                                <span class="font-body-md text-sm text-on-surface">Marcus Webb</span>
                            </div>
                            <div class="font-body-md text-sm text-[#4A5C4E]">Completed</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Infinite Ticker Bottom -->
    <div class="absolute bottom-0 left-0 w-full border-t border-[#252321] overflow-hidden py-4 bg-surface/50 backdrop-blur-sm">
        <div class="flex w-[200%] animate-infinite-scroll">
            <div class="flex w-1/2 justify-around items-center font-label-sm text-label-sm uppercase tracking-[0.2em] text-[rgba(208,197,178,0.6)]">
                <span>Metanoia</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Aether</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Vanguard</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Elysium</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Aura</span>
            </div>
            <div class="flex w-1/2 justify-around items-center font-label-sm text-label-sm uppercase tracking-[0.2em] text-[rgba(208,197,178,0.6)]">
                <span>Metanoia</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Aether</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Vanguard</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Elysium</span>
                <span class="w-1 h-1 rounded-full bg-[#252321]"></span>
                <span>Aura</span>
            </div>
        </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const heroHeadline = ref(null);
const heroMockup = ref(null);

onMounted(() => {
    // Headline Stagger Animation
    if (heroHeadline.value) {
        const htmlString = heroHeadline.value.innerHTML;
        
        // Reconstruct headline with spans for each word to animate
        const lines = htmlString.split('<br>');
        heroHeadline.value.innerHTML = '';
        
        let wordIndex = 0;
        
        lines.forEach((line) => {
            const words = line.trim().split(' ');
            const lineDiv = document.createElement('div');
            lineDiv.className = 'overflow-hidden';
            
            words.forEach(word => {
                if(word.trim() === '') return;
                const span = document.createElement('span');
                span.className = 'stagger-word';
                span.textContent = word + ' ';
                span.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                span.style.transitionDelay = `${wordIndex * 80}ms`;
                
                lineDiv.appendChild(span);
                wordIndex++;
            });
            
            heroHeadline.value.appendChild(lineDiv);
        });

        // Trigger animations
        setTimeout(() => {
            const staggerWords = document.querySelectorAll('.stagger-word');
            staggerWords.forEach(word => {
                word.style.opacity = '1';
                word.style.transform = 'translateY(0)';
            });
        }, 100);
    }

    // Mockup Animation
    if (heroMockup.value) {
        setTimeout(() => {
            heroMockup.value.style.transition = 'transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 1s ease-out';
            heroMockup.value.style.opacity = '1';
            heroMockup.value.style.transform = 'translateY(0) rotateY(-8deg) rotateX(5deg)';
        }, 600);
    }
});
</script>

<style>
/* Use unscoped so .stagger-word works */
.stagger-word {
    opacity: 0;
    transform: translateY(40px);
    display: inline-block;
}

.hero-mockup {
    opacity: 0;
    transform: translateY(20px) rotateY(-8deg) rotateX(5deg);
}

.mockup-shadow {
    box-shadow: 20px 30px 60px -15px rgba(201, 168, 76, 0.15);
}

@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-up {
    animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes infinite-scroll {
    0% { transform: translateX(0) }
    100% { transform: translateX(-50%) }
}
.animate-infinite-scroll {
    animation: infinite-scroll 60s linear infinite;
}
</style>
