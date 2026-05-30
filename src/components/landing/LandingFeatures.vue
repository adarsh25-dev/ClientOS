<template>
  <main id="platform" class="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-margin-desktop py-stack-lg mt-12 md:mt-24 relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <!-- Left Sticky Panel -->
        <div class="md:col-span-5 relative">
            <div class="md:sticky top-[150px] flex flex-col gap-stack-lg">
                <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight">
                    The Core<br/>Infrastructure
                </h1>
                
                <div class="flex flex-col gap-stack-md mt-8 border-l border-[#2A2D3A] pl-8">
                    <div class="progress-item text-on-surface-variant transition-all duration-500 font-body-lg text-body-lg cinematic-ease" data-target="card-0">
                        <span class="text-label-sm opacity-50 mr-4">01</span> Branded Portals
                    </div>
                    <div class="progress-item text-on-surface-variant transition-all duration-500 font-body-lg text-body-lg cinematic-ease" data-target="intelligence">
                        <span class="text-label-sm opacity-50 mr-4">02</span> AI Project Summaries
                    </div>
                    <div class="progress-item text-on-surface-variant transition-all duration-500 font-body-lg text-body-lg cinematic-ease" data-target="card-2">
                        <span class="text-label-sm opacity-50 mr-4">03</span> File Delivery Room
                    </div>
                    <div class="progress-item text-on-surface-variant transition-all duration-500 font-body-lg text-body-lg cinematic-ease" data-target="card-3">
                        <span class="text-label-sm opacity-50 mr-4">04</span> Invoice Tracker
                    </div>
                    <div class="progress-item text-on-surface-variant transition-all duration-500 font-body-lg text-body-lg cinematic-ease" data-target="card-4">
                        <span class="text-label-sm opacity-50 mr-4">05</span> Live Feedback Threads
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Right Scroll Panel -->
        <div class="md:col-span-7 flex flex-col gap-24 md:gap-[153px] pb-[100px] md:pb-[204px] mt-16 md:mt-0">
            <!-- Card 1 -->
            <article class="feature-card reveal-hidden transition-all duration-[1200ms] cinematic-ease bg-surface-dim border border-[#2A2D3A] hover:border-primary p-8 md:p-[4rem] flex flex-col gap-stack-lg relative overflow-hidden" id="card-0">
                <div class="absolute top-0 right-0 p-8 font-headline-xl text-headline-xl text-primary/10 select-none">01</div>
                
                <div class="flex flex-col gap-4 z-10">
                    <h2 class="font-headline-xl text-headline-xl text-on-surface">Branded Portals</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Every client gets their own white-labeled space. Uncompromisingly tailored to your brand's quiet luxury.</p>
                </div>
                
                <!-- Mini UI: Portal Shell -->
                <div class="h-64 w-full bg-surface-container-lowest border border-[#2A2D3A] mt-8 flex flex-col relative z-10 rounded-sm">
                    <div class="h-12 border-b border-[#2A2D3A] flex items-center px-4 justify-between bg-surface/50">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full border border-[#2A2D3A] flex items-center justify-center">
                                <div class="w-3 h-3 bg-primary/20 rounded-full"></div>
                            </div>
                            <div class="w-16 h-3 bg-outline-variant/20 rounded-sm"></div>
                        </div>
                        <div class="flex gap-2">
                            <div class="w-3 h-3 rounded-full bg-outline-variant/20"></div>
                            <div class="w-3 h-3 rounded-full bg-outline-variant/20"></div>
                            <div class="w-3 h-3 rounded-full bg-outline-variant/20"></div>
                        </div>
                    </div>
                    <div class="flex flex-grow">
                        <div class="w-1/4 border-r border-[#2A2D3A] p-4 flex flex-col gap-4 bg-surface-container-low/50">
                            <div class="flex flex-col gap-2">
                                <div class="w-full h-2 bg-outline-variant/20 rounded-sm"></div>
                                <div class="w-3/4 h-2 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                            <div class="flex flex-col gap-2 mt-4">
                                <div class="w-5/6 h-2 bg-outline-variant/10 rounded-sm"></div>
                                <div class="w-2/3 h-2 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                        </div>
                        <div class="w-3/4 p-6 flex flex-col gap-4">
                            <div class="w-1/3 h-5 bg-outline-variant/20 rounded-sm"></div>
                            <div class="w-full h-32 bg-surface-container-high/30 border border-[#2A2D3A] rounded-sm flex flex-col gap-3 p-4">
                                <div class="w-1/2 h-3 bg-outline-variant/10 rounded-sm"></div>
                                <div class="w-full h-2 bg-outline-variant/5 rounded-sm"></div>
                                <div class="w-3/4 h-2 bg-outline-variant/5 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Card 2 -->
            <article class="feature-card reveal-hidden transition-all duration-[1200ms] cinematic-ease bg-surface-dim border border-[#2A2D3A] hover:border-primary p-8 md:p-[4rem] flex flex-col gap-stack-lg relative overflow-hidden" id="intelligence">
                <div class="absolute top-0 right-0 p-8 font-headline-xl text-headline-xl text-primary/10 select-none">02</div>
                
                <div class="flex flex-col gap-4 z-10">
                    <h2 class="font-headline-xl text-headline-xl text-on-surface">AI Project Summaries</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Paste raw notes, get polished client updates in one click. Semantic intelligence working quietly in the background.</p>
                </div>
                
                <!-- Mini UI: Text Condensing -->
                <div class="h-64 w-full bg-surface-container-lowest border border-[#2A2D3A] mt-8 p-8 relative flex flex-col justify-center items-center overflow-hidden z-10 rounded-sm">
                    <div class="absolute top-8 left-8 right-8 flex flex-col gap-4">
                        <div class="anim-line h-1 bg-outline-variant/40 w-full" style="animation-delay: 0s;"></div>
                        <div class="anim-line h-1 bg-outline-variant/30 w-5/6" style="animation-delay: 0.1s;"></div>
                        <div class="anim-line h-1 bg-outline-variant/20 w-11/12" style="animation-delay: 0.2s;"></div>
                        <div class="anim-line h-1 bg-outline-variant/40 w-full" style="animation-delay: 0.3s;"></div>
                        <div class="anim-line h-1 bg-outline-variant/30 w-4/5" style="animation-delay: 0.4s;"></div>
                    </div>
                    
                    <div class="absolute bottom-12 w-56 h-20 bg-surface-container-high border border-primary/40 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-sm">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                            <span class="font-label-sm text-label-sm text-primary uppercase tracking-widest">Summary.doc</span>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Card 3 -->
            <article class="feature-card reveal-hidden transition-all duration-[1200ms] cinematic-ease bg-surface-dim border border-[#2A2D3A] hover:border-primary p-8 md:p-[4rem] flex flex-col gap-stack-lg relative overflow-hidden" id="card-2">
                <div class="absolute top-0 right-0 p-8 font-headline-xl text-headline-xl text-primary/10 select-none">03</div>
                
                <div class="flex flex-col gap-4 z-10">
                    <h2 class="font-headline-xl text-headline-xl text-on-surface">File Delivery Room</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Secure, version-controlled handoffs. No more lost links or confused clients.</p>
                </div>
                
                <!-- Mini UI: Delivery Room -->
                <div class="h-64 w-full bg-surface-container-lowest border border-[#2A2D3A] mt-8 p-6 relative flex flex-col gap-3 overflow-hidden z-10 rounded-sm">
                    <div class="flex justify-between items-center border-b border-[#2A2D3A] pb-3 mb-2">
                        <div class="w-24 h-3 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-16 h-3 bg-outline-variant/10 rounded-sm"></div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-surface-container-high/30 border border-[#2A2D3A] rounded-sm opacity-50">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-surface-variant rounded-sm flex items-center justify-center text-xs text-outline-variant">v1</div>
                            <div class="w-32 h-2 bg-outline-variant/20 rounded-sm"></div>
                        </div>
                        <div class="w-4 h-4 rounded-full border border-outline-variant/30"></div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-surface-container-high/30 border border-[#2A2D3A] rounded-sm opacity-70">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-surface-variant rounded-sm flex items-center justify-center text-xs text-outline-variant">v2</div>
                            <div class="w-32 h-2 bg-outline-variant/30 rounded-sm"></div>
                        </div>
                        <div class="w-4 h-4 rounded-full border border-outline-variant/30"></div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-surface-container-high border border-primary/30 rounded-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-primary/10 border border-primary/30 rounded-sm flex items-center justify-center text-xs text-primary">v3</div>
                            <div class="w-32 h-2 bg-primary/40 rounded-sm"></div>
                        </div>
                        <div class="w-4 h-4 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                    </div>
                    
                    <div class="absolute right-8 bottom-8 border-2 border-primary/40 text-primary/40 font-display-lg text-lg px-4 py-1 uppercase tracking-widest transform -rotate-12 opacity-80">
                        Approved
                    </div>
                </div>
            </article>

            <!-- Card 4 -->
            <article class="feature-card reveal-hidden transition-all duration-[1200ms] cinematic-ease bg-surface-dim border border-[#2A2D3A] hover:border-primary p-8 md:p-[4rem] flex flex-col gap-stack-lg relative overflow-hidden" id="card-3">
                <div class="absolute top-0 right-0 p-8 font-headline-xl text-headline-xl text-primary/10 select-none">04</div>
                
                <div class="flex flex-col gap-4 z-10">
                    <h2 class="font-headline-xl text-headline-xl text-on-surface">Invoice Tracker</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Seamless billing integrated directly into the client experience. Status updates at a glance.</p>
                </div>
                
                <!-- Mini UI: Invoice -->
                <div class="h-64 w-full bg-surface-container-lowest border border-[#2A2D3A] mt-8 p-6 relative flex flex-col z-10 rounded-sm items-center justify-center">
                    <div class="w-3/4 bg-surface border border-[#2A2D3A] rounded-sm p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                        
                        <div class="flex justify-between items-start">
                            <div class="flex flex-col gap-2">
                                <div class="w-16 h-3 bg-outline-variant/30 rounded-sm"></div>
                                <div class="w-24 h-2 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                            <div class="w-20 h-4 bg-outline-variant/20 rounded-sm"></div>
                        </div>
                        
                        <div class="flex flex-col gap-2 mt-2">
                            <div class="flex justify-between border-b border-[#2A2D3A] pb-2">
                                <div class="w-1/2 h-2 bg-outline-variant/10 rounded-sm"></div>
                                <div class="w-1/4 h-2 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                            <div class="flex justify-between border-b border-[#2A2D3A] pb-2">
                                <div class="w-1/3 h-2 bg-outline-variant/10 rounded-sm"></div>
                                <div class="w-1/4 h-2 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-slow"></div>
                                <span class="text-[10px] text-primary uppercase tracking-wider">Paid</span>
                            </div>
                            <div class="w-1/3 h-4 bg-outline-variant/30 rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Card 5 -->
            <article class="feature-card reveal-hidden transition-all duration-[1200ms] cinematic-ease bg-surface-dim border border-[#2A2D3A] hover:border-primary p-8 md:p-[4rem] flex flex-col gap-stack-lg relative overflow-hidden" id="card-4">
                <div class="absolute top-0 right-0 p-8 font-headline-xl text-headline-xl text-primary/10 select-none">05</div>
                
                <div class="flex flex-col gap-4 z-10">
                    <h2 class="font-headline-xl text-headline-xl text-on-surface">Live Feedback Threads</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Contextual comments pinned directly to deliverables. No more confusing email chains.</p>
                </div>
                
                <!-- Mini UI: Feedback -->
                <div class="h-64 w-full bg-surface-container-lowest border border-[#2A2D3A] mt-8 p-6 relative flex items-center justify-center z-10 rounded-sm">
                    <div class="w-2/3 h-40 bg-surface-container-high/40 border border-[#2A2D3A] rounded-sm p-4 flex flex-col gap-3 relative">
                        <div class="w-full h-2 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-5/6 h-2 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-full h-2 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-4/5 h-2 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-full h-2 bg-outline-variant/20 rounded-sm"></div>
                        <div class="w-3/4 h-2 bg-outline-variant/20 rounded-sm"></div>
                        
                        <!-- Comment 1 -->
                        <div class="absolute -right-12 top-6 flex items-start gap-2">
                            <div class="w-8 h-px bg-primary/40 mt-3"></div>
                            <div class="bg-surface border border-primary/30 p-2 rounded-sm shadow-lg w-32 flex flex-col gap-2">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-4 h-4 rounded-full bg-primary/20"></div>
                                    <div class="w-12 h-1.5 bg-outline-variant/40 rounded-sm"></div>
                                </div>
                                <div class="w-full h-1 bg-outline-variant/20 rounded-sm"></div>
                                <div class="w-4/5 h-1 bg-outline-variant/20 rounded-sm"></div>
                            </div>
                        </div>
                        
                        <!-- Comment 2 -->
                        <div class="absolute -left-12 bottom-6 flex items-start gap-2 flex-row-reverse">
                            <div class="w-8 h-px bg-[#2A2D3A] mt-3"></div>
                            <div class="bg-surface border border-[#2A2D3A] p-2 rounded-sm shadow-lg w-28 flex flex-col gap-2">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-4 h-4 rounded-full bg-outline-variant/20"></div>
                                    <div class="w-10 h-1.5 bg-outline-variant/30 rounded-sm"></div>
                                </div>
                                <div class="w-full h-1 bg-outline-variant/10 rounded-sm"></div>
                                <div class="w-3/4 h-1 bg-outline-variant/10 rounded-sm"></div>
                            </div>
                        </div>
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
    // Intersection Observer for Card Reveal Animation
    const cards = document.querySelectorAll('.feature-card');
    const progressItems = document.querySelectorAll('.progress-item');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('reveal-hidden');
                entry.target.classList.add('reveal-visible');
                
                // Update Progress indicator
                const targetId = entry.target.id;
                progressItems.forEach(item => {
                    if (item.getAttribute('data-target') === targetId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    cards.forEach(card => cardObserver.observe(card));
});
</script>

<style>
/* Use unscoped so they apply nicely */
.cinematic-ease {
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes condenseLines {
    0% { transform: translateY(0); opacity: 0.5; }
    50% { transform: translateY(20px) scaleY(0.5); opacity: 0.8; }
    100% { transform: translateY(40px) scaleY(0.1); opacity: 0; }
}
.anim-line {
    animation: condenseLines 3s infinite alternate cubic-bezier(0.22, 1, 0.36, 1);
}

/* Scroll reveal class */
.reveal-hidden {
    opacity: 0;
    transform: translateX(60px) scale(0.97);
}
.reveal-visible {
    opacity: 1;
    transform: translateX(0) scale(1);
}

/* Progress Item Active State */
.progress-item.active {
    color: var(--color-primary, #C9A84C);
    transform: translateX(10px);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
}
.animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
