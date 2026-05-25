<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useToast } from "../composables/useToast";
import { supabase } from "../lib/supabase";

const router = useRouter();
const { user, fetchProfile } = useAuth();
const toast = useToast();

// Wizard state
const currentStep = ref(1);
const transitionDirection = ref("slide-left");
const saving = ref(false);
const slugAvailable = ref(null); // true | false | null (checking)
const checkingSlug = ref(false);

const form = reactive({
  agencyName: "",
  tagline: "",
  logoFile: null,
  logoPreview: null,
  brandColor: "#C9A84C",
  clientName: "",
  clientCompany: "",
  clientEmail: "",
  projectName: "",
  tabs: { invoices: true, files: true, feedback: true },
  portalSlug: "",
});

const colors = [
  "#C9A84C",
  "#8A5C4E",
  "#4A5C4E",
  "#3D5A80",
  "#9A8C98",
  "#6B705C",
];

// Step validation helper
const isStepValid = () => {
  if (currentStep.value === 1) {
    return form.agencyName.trim().length > 0 && form.tagline.trim().length > 0;
  }
  if (currentStep.value === 2) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      form.clientName.trim().length > 0 &&
      emailRegex.test(form.clientEmail) &&
      form.projectName.trim().length > 0
    );
  }
  if (currentStep.value === 3) {
    return form.portalSlug.trim().length > 0 && slugAvailable.value === true;
  }
  return true;
};

// Navigation
const nextStep = () => {
  if (!isStepValid()) return;
  transitionDirection.value = "slide-left";
  currentStep.value++;
};

const prevStep = () => {
  transitionDirection.value = "slide-right";
  currentStep.value--;
};

// Logo Selector
const fileInput = ref(null);
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast.error("Logo file size must be less than 2MB");
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast.error("Only image files are allowed");
    return;
  }

  form.logoFile = file;
  form.logoPreview = URL.createObjectURL(file);
};

// Slug sanitizer
const sanitizeSlug = (val) => {
  if (!val) return "";
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // replace multiple hyphens
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens
};

// Debounced Slug Checker
let slugDebounceTimeout = null;
watch(
  () => form.portalSlug,
  (newSlug) => {
    const sanitized = sanitizeSlug(newSlug);
    if (sanitized !== newSlug) {
      form.portalSlug = sanitized;
      return;
    }

    slugAvailable.value = null;
    if (!sanitized) return;

    checkingSlug.value = true;
    clearTimeout(slugDebounceTimeout);
    slugDebounceTimeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("portal_slug")
          .eq("portal_slug", sanitized)
          .maybeSingle();

        if (error) throw error;
        slugAvailable.value = !data;
      } catch (err) {
        console.error("Slug verification error:", err);
        slugAvailable.value = false;
      } finally {
        checkingSlug.value = false;
      }
    }, 600);
  },
);

// Auto-fill slug from agency name
watch(
  () => form.agencyName,
  (val) => {
    if (currentStep.value === 1) {
      form.portalSlug = sanitizeSlug(val);
    }
  },
);

// Save Onboarding Data
const saveOnboarding = async () => {
  saving.value = true;
  try {
    if (!user.value?.id) throw new Error("Session not found");

    let logoUrl = null;
    // 1. Upload Logo if present
    if (form.logoFile) {
      const ext = form.logoFile.name.split(".").pop();
      const storagePath = `${user.value.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("clientos-files")
        .upload(storagePath, form.logoFile, {
          upsert: true,
        });

      if (uploadError) {
        console.warn(
          "Storage upload error (fallback to defaults):",
          uploadError,
        );
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("clientos-files").getPublicUrl(storagePath);
        logoUrl = publicUrl;
      }
    }

    // 2. Update Profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        agency_name: form.agencyName,
        tagline: form.tagline,
        logo_url: logoUrl,
        brand_color: form.brandColor,
        portal_slug: form.portalSlug,
        portal_settings: {
          tabs: form.tabs,
          welcomeMessage: `Welcome to your project workspace. Here we'll collaborate on deliverables, share files, and view milestones.`,
        },
      })
      .eq("id", user.value.id);
    if (profileError) throw profileError;

    // 3. Create Client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({
        freelancer_id: user.value.id,
        name: form.clientName,
        company: form.clientCompany,
        email: form.clientEmail,
      })
      .select()
      .single();
    if (clientError) throw clientError;

    // 4. Create Project
    const { error: projectError } = await supabase.from("projects").insert({
      freelancer_id: user.value.id,
      client_id: clientData.id,
      name: form.projectName,
      status: "active",
    });
    if (projectError) throw projectError;

    // Sync Auth store profile state
    await fetchProfile(user.value.id);

    // Complete transition
    toast.success("Workspace configured successfully!");
    nextStep();
  } catch (err) {
    toast.error("Configuration failed: " + err.message);
    console.error("Onboarding save error:", err);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  if (user.value?.id) {
    fetchProfile(user.value.id);
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-[#0A0A0F] text-[#E9E1D7] antialiased flex flex-col justify-center items-center p-6 relative overflow-hidden"
  >


    <div
      class="w-full max-w-[540px] bg-[#0D0D14] border border-[#1E2030] p-8 md:p-12 rounded-sm shadow-2xl relative z-10"
    >
      <!-- Logo header -->
      <div
        class="flex items-center gap-2.5 text-[#C9A84C] mb-10 justify-center"
      >
        <span
          class="material-symbols-outlined text-2xl"
          style="font-variation-settings: 'FILL' 1;"
          >widgets</span
        >
        <span class="font-display text-xl font-bold tracking-tight"
          >ClientOS</span
        >
      </div>

      <!-- Step Indicator Dot Tracker -->
      <div
        v-if="currentStep <= 3"
        class="flex justify-between items-center mb-8 max-w-[120px] mx-auto"
      >
        <div
          v-for="s in 3"
          :key="s"
          class="w-2.5 h-2.5 rounded-full border border-[#1E2030] transition-all"
          :class="
            s === currentStep
              ? 'bg-[#C9A84C] scale-110'
              : s < currentStep
                ? 'bg-[#5A5A70]'
                : 'bg-[#1A1A25]'
          "
        ></div>
      </div>

      <!-- STEP CONTAINER with Transitions -->
      <div class="relative overflow-hidden min-h-[300px]">
        <Transition :name="transitionDirection" mode="out-in">
          <!-- STEP 1: Branding -->
          <div
            v-if="currentStep === 1"
            :key="1"
            class="flex flex-col gap-6 text-left"
          >
            <div>
              <h3 class="font-display text-2xl text-[#E9E1D7] mb-1">
                Set up your brand
              </h3>
              <p class="font-body text-xs text-[#d0c5b2]/60">
                Customize how your client portal will look.
              </p>
            </div>

            <!-- Logo Upload -->
            <div>
              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block mb-2 font-bold"
                >Studio Logo (Optional)</label
              >
              <div
                @click="triggerFileSelect"
                class="border border-dashed border-[#1E2030] hover:border-[#C9A84C]/40 bg-[#16161F]/40 p-4 rounded-sm flex items-center justify-center gap-4 cursor-pointer transition-colors"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <div
                  v-if="form.logoPreview"
                  class="w-12 h-12 rounded-full overflow-hidden border border-[#1E2030]"
                >
                  <img
                    :src="form.logoPreview"
                    alt="Logo Preview"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="w-12 h-12 rounded-full bg-[#1A1A25] border border-[#1E2030] flex items-center justify-center text-[#5A5A6A]"
                >
                  <span class="material-symbols-outlined">upload_file</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[#E9E1D7] font-medium"
                    >Select file</span
                  >
                  <span class="text-[9px] text-[#5A5A70]"
                    >Max size 2MB (PNG, JPG, WEBP)</span
                  >
                </div>
              </div>
            </div>

            <!-- Agency Name / Tagline -->
            <div class="flex flex-col gap-4">
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.agencyName"
                  type="text"
                  placeholder="Agency or Freelancer Name"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.tagline"
                  type="text"
                  placeholder="Studio Tagline (e.g. Premium Brand Design)"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <!-- Color Palette Selection -->
            <div>
              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block mb-2 font-bold font-sans"
                >Brand Accent Color</label
              >
              <div class="flex gap-3 ml-2">
                <button
                  v-for="c in colors"
                  :key="c"
                  @click="form.brandColor = c"
                  type="button"
                  class="w-6 h-6 rounded-full border border-transparent transition-all"
                  :style="{
                    backgroundColor: c,
                    outline: form.brandColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }"
                ></button>
              </div>
            </div>

            <!-- Next Action -->
            <button
              @click="nextStep"
              :disabled="!isStepValid()"
              class="w-full bg-[#1A1A25] hover:bg-[#1E2030] border border-[#1E2030] text-[#E9E1D7] font-display text-xs uppercase tracking-widest py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              Continue
              <span class="material-symbols-outlined text-sm"
                >arrow_forward</span
              >
            </button>
          </div>

          <!-- STEP 2: First Client -->
          <div
            v-else-if="currentStep === 2"
            :key="2"
            class="flex flex-col gap-6 text-left"
          >
            <div>
              <h3 class="font-display text-2xl text-[#E9E1D7] mb-1">
                Add your first project
              </h3>
              <p class="font-body text-xs text-[#d0c5b2]/60">
                ClientOS works by grouping activities into client portals.
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block font-bold font-sans"
                >Client Information</label
              >
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.clientName"
                  type="text"
                  placeholder="Client Contact Name"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.clientCompany"
                  type="text"
                  placeholder="Client Company (Optional)"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.clientEmail"
                  type="email"
                  placeholder="Client Email Address"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>

              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block mt-2 font-bold font-sans"
                >Project Scope</label
              >
              <div class="border-b border-[#1E2030] pb-2">
                <input
                  v-model="form.projectName"
                  type="text"
                  placeholder="Project Name (e.g. Brand Identity)"
                  class="w-full bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-4">
              <button
                @click="prevStep"
                class="flex-1 border border-[#1E2030] hover:bg-[#1A1A25] text-xs font-display uppercase tracking-widest py-3.5 rounded-sm transition-colors text-center"
              >
                Back
              </button>
              <button
                @click="nextStep"
                :disabled="!isStepValid()"
                class="flex-1 bg-[#1A1A25] hover:bg-[#1E2030] border border-[#1E2030] text-[#E9E1D7] font-display text-xs uppercase tracking-widest py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>

          <!-- STEP 3: Portal config -->
          <div
            v-else-if="currentStep === 3"
            :key="3"
            class="flex flex-col gap-6 text-left"
          >
            <div>
              <h3 class="font-display text-2xl text-[#E9E1D7] mb-1">
                Portal Setup
              </h3>
              <p class="font-body text-xs text-[#d0c5b2]/60">
                Customize URLs and modules accessible to clients.
              </p>
            </div>

            <!-- Portal URL -->
            <div>
              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block mb-2 font-bold font-sans"
                >Custom Portal Link</label
              >
              <div class="flex items-center border-b border-[#1E2030] pb-2">
                <span class="text-xs text-[#5A5A6A] font-body pr-1 select-none"
                  >clientos.com/portal/</span
                >
                <input
                  v-model="form.portalSlug"
                  type="text"
                  placeholder="slug"
                  class="flex-1 bg-transparent border-none p-0 pb-1 text-sm text-[#E9E1D7] placeholder-[#d0c5b2]/30 focus:ring-0 focus:outline-none font-sans"
                />
              </div>
              <div class="mt-2 text-[10px]">
                <span v-if="checkingSlug" class="text-[#5A5A70]"
                  >Verifying availability...</span
                >
                <span
                  v-else-if="slugAvailable === true"
                  class="text-emerald-500 font-semibold"
                  >✓ Available</span
                >
                <span
                  v-else-if="slugAvailable === false"
                  class="text-[#8A6020] font-semibold"
                  >✗ Taken</span
                >
              </div>
            </div>

            <!-- Visible Tabs settings -->
            <div>
              <label
                class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block mb-3 font-bold font-sans"
                >Active Client Portal Tabs</label
              >
              <div class="flex flex-col gap-3">
                <label
                  v-for="tab in ['invoices', 'files', 'feedback']"
                  :key="tab"
                  class="flex items-center justify-between cursor-pointer py-1.5 border-b border-[#1E2030]/40"
                >
                  <span
                    class="text-xs uppercase tracking-wider text-[#A0A0B0] font-medium"
                    >{{ tab }}</span
                  >
                  <div
                    class="relative flex items-center justify-center w-5 h-5 border border-[#1E2030] rounded-sm hover:border-[#C9A84C] transition-colors"
                  >
                    <input
                      v-model="form.tabs[tab]"
                      type="checkbox"
                      class="peer sr-only"
                    />
                    <div
                      class="absolute inset-0 bg-[#C9A84C] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-sm"
                    >
                      <span
                        class="material-symbols-outlined text-[14px] text-[#0A0A0F] font-bold"
                        >check</span
                      >
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-4">
              <button
                @click="prevStep"
                class="flex-1 border border-[#1E2030] hover:bg-[#1A1A25] text-xs font-display uppercase tracking-widest py-3.5 rounded-sm transition-colors text-center"
              >
                Back
              </button>
              <button
                @click="saveOnboarding"
                :disabled="!isStepValid() || saving"
                class="flex-1 bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-display text-xs uppercase tracking-widest py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <template v-if="saving">
                  <span
                    class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce"
                  ></span>
                  <span
                    class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce [animation-delay:0.2s]"
                  ></span>
                  <span
                    class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce [animation-delay:0.4s]"
                  ></span>
                </template>
                <template v-else> Build Space </template>
              </button>
            </div>
          </div>

          <!-- STEP 4: Success Reveal -->
          <div
            v-else-if="currentStep === 4"
            :key="4"
            class="py-6 flex flex-col items-center gap-6 text-center"
          >
            <!-- Animated SVG Circle/Icon Reveal -->
            <div
              class="w-20 h-20 rounded-full border border-[#C9A84C]/25 flex items-center justify-center relative overflow-hidden bg-[#C9A84C]/5"
            >
              <span
                class="material-symbols-outlined text-4xl text-[#C9A84C] animate-pulse"
                >celebration</span
              >
            </div>

            <div>
              <h3 class="font-display text-2xl text-[#E9E1D7] mb-2">
                Space Ready!
              </h3>
              <p
                class="font-body text-xs text-[#d0c5b2]/60 max-w-sm mx-auto leading-relaxed"
              >
                Your agency portal has been crafted. You can now track
                timelines, generate updates, and share deliverables.
              </p>
            </div>

            <button
              @click="router.push('/app/dashboard')"
              class="w-full bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-display text-xs uppercase tracking-widest py-3.5 rounded-sm transition-all mt-4"
            >
              Go to Dashboard
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
