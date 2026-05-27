# ClientOS 🚀
### The White-Label Client Portal That Transforms Freelance Delivery into a High-End Agency Experience

ClientOS is a centralized, premium delivery workspace designed for freelancers, indie hackers, and creative agencies. Instead of managing clients via scattered email chains, Slack messages, and Google Drive links, ClientOS gives them a branded, secure, and AI-augmented cockpit. 

Impress your clients, save hours on admin tasks, and charge agency-level rates by delivering a premium workspace.

---

## ✨ Core Features Built to Impress

### 🔒 Zero-Leakage Multi-Tenant Architecture
* **Supabase Row-Level Security (RLS)**: Client and freelancer data is strictly isolated. There is absolutely zero risk of cross-tenant data leakage.
* **Granular Role-Based Access**: Freelancers manage the backend, while clients get a beautifully streamlined, read-only/interactive interface.

### 🧠 AI-Augmented Invoice Builder
* **AI Document Scanner**: Upload or drag-and-drop any invoice, receipt, or timesheet image. The built-in vision model automatically extracts descriptions, quantities, and rates directly into the editor.
* **AI Note Generator (Auto-Write)**: Draft professional, customized thank-you notes for client invoices with one click, tailored to the specific line items you're billing for.

### 📂 Semantic Deliverable Search
* Powered by Postgres `pgvector` embeddings.
* Clients can search their deliverables conceptually (e.g., searching "marketing copy" will find relevant documents even if the exact words don't match).

### 🎨 Agency-Grade UI/UX
* Designed with a stunning dark-mode layout, glassmorphism, and responsive CSS.
* Animated micro-interactions driven by **GSAP** make the interface feel responsive, modern, and alive.

---

## 🛠️ The Tech Stack

ClientOS is built on a modern, high-performance stack:
* **Frontend**: Vue 3 (Composition API), Pinia (State Management), Tailwind CSS, GSAP (Animations), Vue Router
* **Database & Auth**: Supabase (Postgres, Go-backed Auth, Row-Level Security, Database functions)
* **Vector Database**: `pgvector` for semantic document retrieval
* **AI Integration**: NVIDIA NIM APIs (Llama-3.2-11b-vision-instruct for scanning, Llama-3.1-8b-instruct for text generation)

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/adarsh25-dev/ClientOS.git
cd ClientOS

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# NVIDIA API Configuration for AI Features
VITE_NVIDIA_API_KEY=your_nvidia_api_key
VITE_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📈 Business Value: Why Use ClientOS?

| Before ClientOS | After ClientOS |
| :--- | :--- |
| Invoices drafted manually, taking 15+ minutes. | AI scans documents & drafts notes in 5 seconds. |
| Scattered files, PDFs, and links across emails. | One secure, searchable portal for all deliverables. |
| Clients constantly asking "What's the status?" | Real-time project tracking dashboard. |
| Standard PDF invoice. | Interactive portal for payments, downloads, and tracking. |

ClientOS doesn't just manage your work—**it packages your value.** Show your clients that you run a structured, secure, and modern operation.
