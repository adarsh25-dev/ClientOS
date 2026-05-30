<template>
  <nav class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-[#252321] left-0 right-0">
    <div class="flex justify-between items-center px-6 md:px-margin-desktop py-4 md:py-phi-unit max-w-[1440px] mx-auto w-full">
      <div class="font-headline-lg text-2xl md:text-headline-lg tracking-tighter text-on-surface dark:text-on-surface">
        ClientOS
      </div>
      
      <!-- Desktop Links -->
      <div class="hidden md:flex gap-stack-lg">
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('platform')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Platform</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('intelligence')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Intelligence</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('network')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Network</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('pricing')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Pricing</a>
      </div>

      <!-- Desktop Buttons & Mobile Toggle -->
      <div class="flex items-center gap-4 md:gap-6">
        <router-link to="/login" class="hidden md:block font-label-sm text-label-sm uppercase tracking-[0.1em] text-on-surface hover:text-primary transition-colors duration-400">Log In</router-link>
        <router-link to="/signup" class="hidden md:block font-label-sm text-[10px] md:text-label-sm uppercase tracking-[0.1em] border border-primary text-primary px-4 py-2 md:px-6 md:py-3 rounded-none hover:bg-primary hover:text-[#0A0A0F] transition-all duration-400 whitespace-nowrap" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Early Access</router-link>
        
        <!-- Hamburger — hidden when drawer is open to prevent double X -->
        <button
          v-show="!isMobileMenuOpen"
          class="md:hidden relative z-[60] text-on-surface flex items-center justify-center w-9 h-9 transition-colors"
          @click="isMobileMenuOpen = true"
          aria-label="Toggle menu"
        >
          <span class="material-symbols-outlined text-2xl transition-all duration-300">menu</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Menu Drawer — teleported to body to escape nav stacking context -->
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-[55] flex flex-col md:hidden"
        style="background: #0A0A0F;"
      >
        <!-- Top bar replica with close button -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div class="font-headline-lg text-2xl tracking-tighter text-on-surface">ClientOS</div>
          <button
            @click="isMobileMenuOpen = false"
            aria-label="Close menu"
            class="flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-on-surface/70 hover:text-on-surface hover:border-white/30 hover:bg-white/5 transition-all duration-200"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Nav Links -->
        <nav class="flex flex-col items-start justify-center flex-1 px-8 gap-2">
          <a
            v-for="(item, i) in navItems"
            :key="item.id"
            class="nav-link w-full py-5 border-b border-white/8 font-headline-md text-[2rem] leading-tight tracking-tight text-on-surface/90 hover:text-primary transition-colors cursor-pointer select-none"
            :style="{ transitionDelay: `${i * 40}ms` }"
            @click.prevent="handleMobileNav(item.id)"
          >
            {{ item.label }}
          </a>
        </nav>

        <!-- Footer CTAs -->
        <div class="px-6 pb-12 pt-6 flex flex-col gap-3 shrink-0 border-t border-white/10">
          <router-link
            to="/login"
            @click="isMobileMenuOpen = false"
            class="block w-full py-4 text-center font-label-sm text-sm uppercase tracking-[0.12em] border border-primary text-primary font-semibold hover:bg-primary hover:text-[#0A0A0F] transition-all duration-400"
          >
            Log In
          </router-link>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const isMobileMenuOpen = ref(false);

const navItems = [
  { id: 'platform', label: 'Platform' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'network', label: 'Network' },
  { id: 'pricing', label: 'Pricing' },
];

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) {
    const navHeight = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

const handleMobileNav = (id) => {
  isMobileMenuOpen.value = false;
  setTimeout(() => scrollToSection(id), 300);
};
</script>

<style scoped>
/* Drawer slide-in from right */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.drawer-enter-to,
.drawer-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.border-white\/8 {
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
