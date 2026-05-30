<template>
  <nav class="fixed top-0 w-full z-40 bg-surface/80 backdrop-blur-md dark:bg-surface/80 border-b border-outline-variant/30 left-0 right-0">
    <div class="flex justify-between items-center px-margin-desktop py-phi-unit max-w-[1440px] mx-auto w-full">
      <div class="font-headline-lg text-headline-lg tracking-tighter text-on-surface dark:text-on-surface">
        ClientOS
      </div>
      <div class="hidden md:flex gap-stack-lg">
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('platform')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Platform</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('intelligence')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Intelligence</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('network')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Network</a>
        <a class="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-400 ease-out cursor-pointer" @click.prevent="scrollToSection('pricing')" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Pricing</a>
      </div>
      <div class="flex items-center gap-6">
        <router-link to="/login" class="font-label-sm text-label-sm uppercase tracking-[0.1em] text-on-surface hover:text-primary transition-colors duration-400">Log In</router-link>
        <router-link to="/signup" class="font-label-sm text-label-sm uppercase tracking-[0.1em] border border-primary text-primary px-6 py-3 rounded-none hover:bg-primary hover:text-[#0A0A0F] transition-all duration-400" style="transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);">Early Access</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) {
    const navHeight = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};
</script>

<style scoped>
</style>
