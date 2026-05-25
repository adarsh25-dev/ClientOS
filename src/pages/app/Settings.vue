<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

const { profile, fetchProfile } = useAuth()
const toast = useToast()

// Tabs configuration
const activeTab = ref('profile') // 'profile' | 'keys' | 'notifications' | 'portal' | 'account'

// 1. Profile state
const profileForm = reactive({
  fullName: '',
  agencyName: '',
  tagline: '',
  logoFile: null,
  logoPreview: null,
  brandColor: '#C9A84C',
  portalSlug: ''
})

const logoInput = ref(null)
const colors = ['#C9A84C', '#8A5C4E', '#4A5C4E', '#3D5A80', '#9A8C98', '#6B705C']

const slugAvailable = ref(null)
const checkingSlug = ref(false)

const triggerLogoSelect = () => logoInput.value?.click()

const handleLogoSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Logo file size must be less than 2MB')
    return
  }

  profileForm.logoFile = file
  profileForm.logoPreview = URL.createObjectURL(file)
}

// Slug availability watch
let slugTimeout = null
watch(() => profileForm.portalSlug, (newSlug) => {
  if (newSlug === profile.value?.portal_slug) {
    slugAvailable.value = true
    return
  }

  const sanitized = newSlug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  if (sanitized !== newSlug) {
    profileForm.portalSlug = sanitized
    return
  }

  slugAvailable.value = null
  if (!sanitized) return

  checkingSlug.value = true
  clearTimeout(slugTimeout)
  slugTimeout = setTimeout(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('portal_slug')
        .eq('portal_slug', sanitized)
        .maybeSingle()

      if (error) throw error
      slugAvailable.value = !data
    } catch (err) {
      console.error(err)
      slugAvailable.value = false
    } finally {
      checkingSlug.value = false
    }
  }, 600)
})

const saveProfile = async () => {
  if (!profileForm.fullName || !profileForm.agencyName || slugAvailable.value === false) {
    toast.error('Please verify all required fields and slug availability')
    return
  }

  try {
    let logoUrl = profile.value?.logo_url || null

    if (profileForm.logoFile) {
      const ext = profileForm.logoFile.name.split('.').pop()
      const storagePath = `${profile.value.id}/logo_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('clientos-files')
        .upload(storagePath, profileForm.logoFile)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('clientos-files')
        .getPublicUrl(storagePath)
      logoUrl = publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileForm.fullName,
        agency_name: profileForm.agencyName,
        tagline: profileForm.tagline,
        logo_url: logoUrl,
        brand_color: profileForm.brandColor,
        portal_slug: profileForm.portalSlug
      })
      .eq('id', profile.value.id)
    if (error) throw error

    await fetchProfile(profile.value.id)
    toast.success('Profile updated successfully')
  } catch (err) {
    toast.error('Failed to update profile: ' + err.message)
  }
}



// 3. Notifications preference state
const notifications = reactive({
  emailOnApproval: true,
  emailOnFeedback: true,
  emailOnInvoice: true
})

const saveNotifications = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        notifications
      })
      .eq('id', profile.value.id)
    if (error) throw error
    toast.success('Notification preferences saved')
  } catch (err) {
    toast.error('Failed to save preferences')
  }
}

// 4. Portal settings state
const portalSettings = reactive({
  tabs: {
    overview: true,
    files: true,
    invoices: true,
    feedback: true
  },
  welcomeMessage: ''
})

const savePortalSettings = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        portal_settings: portalSettings
      })
      .eq('id', profile.value.id)
    if (error) throw error
    toast.success('Portal settings updated')
  } catch (err) {
    toast.error('Failed to save settings')
  }
}

// 5. Account change password / Delete states
const newPassword = ref('')
const confirmPassword = ref('')
const deleteConfirmationText = ref('')

const handlePasswordChange = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    toast.error('Password must be at least 6 characters')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords do not match')
    return
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })
    if (error) throw error
    toast.success('Password updated successfully')
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    toast.error('Failed to change password: ' + err.message)
  }
}

const handleDeleteAccount = async () => {
  if (deleteConfirmationText.value !== 'DELETE') {
    toast.error('Please type DELETE to confirm')
    return
  }

  try {
    // Perform MVP account delete mock
    toast.success('Account deletion requested successfully')
    // Sign out
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    window.location.href = '/'
  } catch (err) {
    toast.error('Failed to request deletion')
  }
}

// Pre-populate settings on mount
onMounted(() => {
  if (profile.value) {
    profileForm.fullName = profile.value.full_name || ''
    profileForm.agencyName = profile.value.agency_name || ''
    profileForm.tagline = profile.value.tagline || ''
    profileForm.logoPreview = profile.value.logo_url || null
    profileForm.brandColor = profile.value.brand_color || '#C9A84C'
    profileForm.portalSlug = profile.value.portal_slug || ''



    if (profile.value.notifications) {
      Object.assign(notifications, profile.value.notifications)
    }
    if (profile.value.portal_settings) {
      Object.assign(portalSettings, profile.value.portal_settings)
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    <!-- Header -->
    <div class="border-b border-custom-border pb-6">
      <h2 class="font-display text-2xl text-on-surface mb-1.5">Settings</h2>
      <p class="font-body text-xs text-on-surface-variant">Manage branding profiles and notifications.</p>
    </div>

    <!-- Navigation & Editor Split layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      
      <!-- Left Tab selector list -->
      <div class="lg:col-span-3 flex flex-col gap-1.5">
        <button
          v-for="tab in [
            { id: 'profile', label: 'Agency Profile', icon: 'badge' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications' },
            { id: 'portal', label: 'Client Portal', icon: 'settings_input_component' },
            { id: 'account', label: 'Account Security', icon: 'shield_lock' }
          ]"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-button uppercase tracking-wider text-on-surface-variant hover:text-primary hover:bg-custom-bg-card transition-all"
          :class="activeTab === tab.id ? 'bg-custom-bg-card text-primary' : ''"
        >
          <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Right Edit Panel -->
      <div class="lg:col-span-9 bg-custom-bg-card border border-custom-border p-6 md:p-8 rounded-sm">
        <Transition name="fade" mode="out-in">
          
          <!-- TAB 1: Profile -->
          <div v-if="activeTab === 'profile'" :key="1" class="flex flex-col gap-6">
            <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface border-b border-custom-border pb-3">Agency Brand Settings</h3>

            <!-- Logo -->
            <div class="flex items-center gap-6">
              <div @click="triggerLogoSelect" class="w-16 h-16 rounded-full overflow-hidden border border-custom-border bg-custom-hover flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <img v-if="profileForm.logoPreview" :src="profileForm.logoPreview" alt="Logo" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-custom-muted">add_a_photo</span>
              </div>
              <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="handleLogoSelect" />
              <div class="flex flex-col gap-1.5 text-xs">
                <button @click="triggerLogoSelect" class="text-primary hover:underline font-semibold font-button uppercase tracking-wider text-[10px]">Change Logo</button>
                <span class="text-custom-muted">Supports PNG, JPG, WEBP under 2MB</span>
              </div>
            </div>

            <!-- Form parameters -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Full Name</label>
                <input v-model="profileForm.fullName" type="text" class="bg-custom-hover border border-custom-border rounded-sm p-3 text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>

              <div class="flex flex-col">
                <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Agency Name</label>
                <input v-model="profileForm.agencyName" type="text" class="bg-custom-hover border border-custom-border rounded-sm p-3 text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div class="flex flex-col">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Studio Tagline</label>
              <input v-model="profileForm.tagline" type="text" class="bg-custom-hover border border-custom-border rounded-sm p-3 text-xs text-on-surface focus:outline-none focus:border-primary" />
            </div>

            <!-- Accent Color picker -->
            <div>
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2.5 font-bold font-sans">Brand Accent Color</label>
              <div class="flex flex-wrap items-center gap-3">
                <button
                  v-for="c in colors"
                  :key="c"
                  @click="profileForm.brandColor = c"
                  class="w-6 h-6 rounded-full border border-transparent transition-all"
                  :style="{ backgroundColor: c, outline: profileForm.brandColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }"
                ></button>
                <input
                  v-model="profileForm.brandColor"
                  type="text"
                  class="bg-custom-hover border border-custom-border rounded-sm p-1.5 w-24 text-xs font-mono text-on-surface text-center focus:outline-none"
                  placeholder="#Hex"
                />
              </div>
            </div>

            <!-- Portal Slug configuration -->
            <div class="flex flex-col">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Portal Room Slug</label>
              <div class="flex items-center bg-custom-hover border border-custom-border rounded-sm px-3 py-2 text-xs">
                <span class="text-custom-muted font-medium pr-1">clientos.com/portal/</span>
                <input v-model="profileForm.portalSlug" type="text" class="flex-grow bg-transparent border-none p-0 focus:ring-0 text-on-surface" />
              </div>
              <div class="mt-2 text-[10px]">
                <span v-if="checkingSlug" class="text-custom-muted">Verifying availability...</span>
                <span v-else-if="slugAvailable === true" class="text-emerald-500 font-semibold">✓ Available / Unchanged</span>
                <span v-else-if="slugAvailable === false" class="text-[#8A6020] font-semibold">✗ Taken</span>
              </div>
            </div>

            <!-- Save Button -->
            <button
              @click="saveProfile"
              class="self-start bg-primary hover:bg-primary-container text-on-primary font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors mt-2"
            >
              Save Profile
            </button>
          </div>



          <!-- TAB 3: Notifications -->
          <div v-else-if="activeTab === 'notifications'" :key="3" class="flex flex-col gap-6 text-left">
            <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface border-b border-custom-border pb-3">Notification Preferences</h3>

            <div class="flex flex-col gap-4">
              <!-- Switch 1 -->
              <label class="flex items-center justify-between cursor-pointer py-2 border-b border-custom-border/30">
                <div class="flex flex-col gap-1">
                  <span class="text-xs uppercase tracking-wider font-semibold text-on-surface">File Approvals</span>
                  <span class="text-[10px] text-custom-muted">Receive email summaries when a client marks a file as approved.</span>
                </div>
                <div class="relative flex items-center justify-center w-5 h-5 border border-custom-border rounded-sm hover:border-primary transition-colors">
                  <input v-model="notifications.emailOnApproval" type="checkbox" class="peer sr-only" />
                  <div class="absolute inset-0 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                    <span class="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                  </div>
                </div>
              </label>

              <!-- Switch 2 -->
              <label class="flex items-center justify-between cursor-pointer py-2 border-b border-custom-border/30">
                <div class="flex flex-col gap-1">
                  <span class="text-xs uppercase tracking-wider font-semibold text-on-surface">Client Portal Feedback</span>
                  <span class="text-[10px] text-custom-muted">Alert on new portal discussion threads or change requests.</span>
                </div>
                <div class="relative flex items-center justify-center w-5 h-5 border border-custom-border rounded-sm hover:border-primary transition-colors">
                  <input v-model="notifications.emailOnFeedback" type="checkbox" class="peer sr-only" />
                  <div class="absolute inset-0 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                    <span class="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                  </div>
                </div>
              </label>

              <!-- Switch 3 -->
              <label class="flex items-center justify-between cursor-pointer py-2 border-b border-custom-border/30">
                <div class="flex flex-col gap-1">
                  <span class="text-xs uppercase tracking-wider font-semibold text-on-surface">Invoices Status</span>
                  <span class="text-[10px] text-custom-muted">Alert on invoice views and invoice payment updates.</span>
                </div>
                <div class="relative flex items-center justify-center w-5 h-5 border border-custom-border rounded-sm hover:border-primary transition-colors">
                  <input v-model="notifications.emailOnInvoice" type="checkbox" class="peer sr-only" />
                  <div class="absolute inset-0 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                    <span class="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                  </div>
                </div>
              </label>
            </div>

            <button
              @click="saveNotifications"
              class="self-start bg-primary hover:bg-primary-container text-on-primary font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors mt-2"
            >
              Save Preferences
            </button>
          </div>

          <!-- TAB 4: Portal Settings -->
          <div v-else-if="activeTab === 'portal'" :key="4" class="flex flex-col gap-6 text-left">
            <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface border-b border-custom-border pb-3">Client Portal Modules</h3>

            <!-- Switch Toggles -->
            <div class="flex flex-col gap-4">
              <label v-for="tab in ['overview', 'files', 'invoices', 'feedback']" :key="tab" class="flex items-center justify-between cursor-pointer py-2 border-b border-custom-border/30">
                <div class="flex flex-col gap-1">
                  <span class="text-xs uppercase tracking-wider font-semibold text-on-surface">{{ tab }} module</span>
                  <span class="text-[10px] text-custom-muted">Enable client access to the {{ tab }} tab.</span>
                </div>
                <div class="relative flex items-center justify-center w-5 h-5 border border-custom-border rounded-sm hover:border-primary transition-colors">
                  <input v-model="portalSettings.tabs[tab]" type="checkbox" class="peer sr-only" />
                  <div class="absolute inset-0 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                    <span class="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                  </div>
                </div>
              </label>
            </div>

            <!-- Welcome Message text -->
            <div class="flex flex-col">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold">Portal Welcome Message</label>
              <textarea
                v-model="portalSettings.welcomeMessage"
                class="w-full h-24 bg-custom-hover border border-custom-border rounded-sm p-3 text-xs text-on-surface placeholder-custom-muted focus:outline-none resize-none"
              ></textarea>
            </div>

            <button
              @click="savePortalSettings"
              class="self-start bg-primary hover:bg-primary-container text-on-primary font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors mt-2"
            >
              Update Settings
            </button>
          </div>

          <!-- TAB 5: Account -->
          <div v-else-if="activeTab === 'account'" :key="5" class="flex flex-col gap-8 text-left">
            
            <!-- Change Password -->
            <div class="flex flex-col gap-4">
              <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface border-b border-custom-border pb-3">Update Credentials</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold">New Password</label>
                  <input v-model="newPassword" type="password" class="bg-custom-hover border border-custom-border rounded-sm p-2.5 text-xs text-on-surface focus:outline-none" />
                </div>
                <div class="flex flex-col">
                  <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold">Confirm New Password</label>
                  <input v-model="confirmPassword" type="password" class="bg-custom-hover border border-custom-border rounded-sm p-2.5 text-xs text-on-surface focus:outline-none" />
                </div>
              </div>

              <button
                @click="handlePasswordChange"
                class="self-start border border-custom-border hover:bg-custom-hover text-xs font-button uppercase tracking-widest text-on-surface py-2.5 px-6 rounded-sm transition-colors"
              >
                Change Password
              </button>
            </div>

            <!-- Danger Zone deletion -->
            <div class="flex flex-col gap-4 border-t border-error/20 pt-6">
              <h3 class="font-headline-sm text-sm uppercase tracking-widest text-error border-b border-error/10 pb-3">Danger Zone</h3>
              
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Permanently erase your account, agency details, clients, files, and billing history. This action is irreversible.
              </p>

              <div class="flex flex-col max-w-sm">
                <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold">Type <strong class="text-error font-bold">DELETE</strong> to confirm</label>
                <div class="flex gap-2">
                  <input
                    v-model="deleteConfirmationText"
                    type="text"
                    placeholder="DELETE"
                    class="bg-custom-hover border border-error/20 focus:border-error/50 rounded-sm p-2.5 text-xs text-on-surface focus:outline-none w-24 text-center"
                  />
                  <button
                    @click="handleDeleteAccount"
                    class="bg-error/10 hover:bg-error/25 border border-error/20 text-error text-xs font-button uppercase tracking-widest py-2.5 px-5 rounded-sm transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

          </div>

        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
