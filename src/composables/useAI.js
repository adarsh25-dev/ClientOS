import { ref } from 'vue'

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function useAI() {
  const loading = ref(false)
  const error = ref(null)
  const statusMessage = ref('')
  const generatedSummary = ref('')

  const statusCycle = [
    'Reading your notes…',
    'Structuring the update…',
    'Polishing the copy…',
    'Almost ready…'
  ]

  async function generateProjectUpdate({ projectName, clientName, rawNotes, tone = 'professional' }) {
    loading.value = true
    error.value = null
    generatedSummary.value = ''
    statusMessage.value = statusCycle[0]

    let statusIdx = 0
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statusCycle.length
      statusMessage.value = statusCycle[statusIdx]
    }, 1200)

    try {
      const apiKey = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY_LLAMA_70B
      if (!apiKey) {
        throw new Error('AI generation unavailable. Please configure VITE_NVIDIA_API_KEY_LLAMA_70B in your environment.')
      }

      if (!rawNotes || !rawNotes.trim()) {
        throw new Error('Please enter some raw notes for the AI to summarize.')
      }

      const systemPrompt = `You are a professional project manager writing client updates for a freelance agency. Write clear, confident, and polished project updates. Never mention internal tools or team dynamics. Always write from the agency's perspective. Keep the tone as specified.`
      
      const userPrompt = `Project: ${projectName}\nClient: ${clientName}\nTone: ${tone}\nRaw notes from the team:\n${rawNotes}\n\nWrite a professional client update. Structure it as: 1) What was completed this period, 2) What's currently in progress, 3) What's coming next. Use short paragraphs. No bullet points unless necessary. Max 200 words.`

      const baseUrl = import.meta.env.VITE_NVIDIA_BASE_URL || '/api/nvidia/v1'
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_NVIDIA_MODEL_LLAMA_70B || 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true
        })
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      clearInterval(statusInterval)
      statusMessage.value = 'Generating update...'

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              const text = data.choices[0]?.delta?.content || ''
              generatedSummary.value += text
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      clearInterval(statusInterval)
      console.error('AI Generation error:', err)
      const msg = err.message || ''
      if (msg.includes('429') || msg.includes('limit')) {
        error.value = 'Too many requests. Please wait a moment and try again.'
      } else if (msg.includes('API key') || msg.includes('401')) {
        error.value = 'AI generation unavailable. Please check your environment keys.'
      } else if (msg.includes('Failed to fetch') || msg.includes('network')) {
        error.value = 'Connection failed. Please check your internet.'
      } else {
        error.value = msg || 'An unexpected error occurred during AI generation.'
      }
      throw error.value
    } finally {
      clearInterval(statusInterval)
      loading.value = false
      statusMessage.value = ''
    }
  }

  async function extractInvoiceItems(dataUrl) {
    loading.value = true
    error.value = null
    statusMessage.value = 'Analyzing document...'

    try {
      const apiKey = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY_VISION
      if (!apiKey) {
        throw new Error('AI extraction unavailable. Please configure VITE_NVIDIA_API_KEY_VISION in your environment.')
      }

      const systemPrompt = `You are a data extraction assistant. Extract all line items from the provided invoice, receipt, or timesheet image. Return ONLY a valid JSON array of objects. Do not wrap it in markdown block quotes. Each object MUST have exactly these keys: "description" (string), "qty" (number), "rate" (number). If an item lacks a quantity, default to 1. If an item lacks a rate, default to 0.`

      const baseUrl = import.meta.env.VITE_NVIDIA_BASE_URL || '/api/nvidia/v1'
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_NVIDIA_MODEL_VISION || 'meta/llama-3.2-11b-vision-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: [
                { type: 'text', text: 'Extract the line items from this image.' },
                { type: 'image_url', image_url: { url: dataUrl } }
              ]
            }
          ],
          max_tokens: 1024,
          temperature: 0.1
        })
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()

      const rawText = data.choices[0]?.message?.content || '[]'
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
      
      const parsed = JSON.parse(cleanedText)
      if (!Array.isArray(parsed)) {
        throw new Error('AI did not return a valid list of items.')
      }
      return parsed
    } catch (err) {
      console.error('AI Extraction error:', err)
      error.value = err.message || 'An error occurred during AI extraction.'
      throw error.value
    } finally {
      loading.value = false
      statusMessage.value = ''
    }
  }

  async function generateInvoiceNotes(clientName, lineItems) {
    loading.value = true
    error.value = null
    statusMessage.value = 'Writing notes...'

    try {
      const apiKey = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY_LLAMA_8B
      if (!apiKey) {
        throw new Error('AI generation unavailable. Please configure VITE_NVIDIA_API_KEY_LLAMA_8B in your environment.')
      }

      const itemsList = lineItems.filter(i => i.description).map(i => `- ${i.description} (Qty: ${i.qty || 1}, Rate: $${i.rate || 0})`).join('\n')
      const systemPrompt = `You are a polite, professional assistant for a design/development agency. Write a very brief, friendly thank-you note to the client to put on their invoice. Acknowledge the specific work being billed if appropriate. Maximum 2 short sentences.`
      const userPrompt = `Client: ${clientName || 'Valued Client'}\nItems billed:\n${itemsList}`

      const baseUrl = import.meta.env.VITE_NVIDIA_BASE_URL || '/api/nvidia/v1'
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_NVIDIA_MODEL_LLAMA_8B || 'meta/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()

      return data.choices[0]?.message?.content?.trim() || ''
    } catch (err) {
      console.error('AI Note generation error:', err)
      throw err
    } finally {
      loading.value = false
      statusMessage.value = ''
    }
  }

  async function searchFiles(query, filesList) {
    if (!query || !filesList || filesList.length === 0) return filesList

    loading.value = true
    error.value = null
    statusMessage.value = 'Semantic searching...'

    try {
      const embeddingKey = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY_EMBEDDING || import.meta.env.VITE_NVIDIA_API_KEY_SEARCH
      const rerankingKey = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY_RERANKING || import.meta.env.VITE_NVIDIA_API_KEY_SEARCH
      const baseUrl = import.meta.env.VITE_NVIDIA_BASE_URL || '/api/nvidia/v1'

      if (!embeddingKey || !rerankingKey) {
        throw new Error('API keys for embedding or reranking not configured.')
      }

      // 1. Prepare passages
      const passages = filesList.map(f => ({
        text: `File name: ${f.name}. File type: ${f.file_type}. Uploaded on: ${f.uploaded_at}. Status: ${f.status}.`
      }))
      const inputTexts = [query, ...passages.map(p => p.text)]

      // 2. Get embeddings
      statusMessage.value = 'Generating embeddings...'
      const embedModel = import.meta.env.VITE_NVIDIA_MODEL_EMBEDDING || 'nvidia/llama-nemotron-embed-1b-v2'
      const embedRes = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${embeddingKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: embedModel,
          input: inputTexts,
          input_type: "passage",
          truncate: "END"
        })
      })

      if (!embedRes.ok) throw new Error(`Embedding API failed with status ${embedRes.status}`)
      const embedData = await embedRes.json()
      
      const queryEmbedding = embedData.data[0].embedding
      const passageEmbeddings = embedData.data.slice(1).map(d => d.embedding)

      // 3. Calculate similarity and get top K
      const scoredPassages = passages.map((p, index) => {
        const score = cosineSimilarity(queryEmbedding, passageEmbeddings[index])
        return { ...p, score, originalIndex: index }
      })
      
      // Sort by similarity and take top 10 for reranking to save latency/tokens
      scoredPassages.sort((a, b) => b.score - a.score)
      const topPassages = scoredPassages.slice(0, 10)

      // 4. Rerank
      statusMessage.value = 'Reranking results...'
      const rerankModel = import.meta.env.VITE_NVIDIA_MODEL_RERANKING || import.meta.env.VITE_NVIDIA_MODEL_SEARCH || 'nvidia/rerank-qa-mistral-4b'
      const rerankRes = await fetch(`/api/nemotron/v1/retrieval/nvidia/reranking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rerankingKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: rerankModel,
          query: { text: query },
          passages: topPassages.map(p => ({ text: p.text }))
        })
      })

      if (!rerankRes.ok) {
        throw new Error(`Ranking API failed with status ${rerankRes.status}`)
      }

      const rerankData = await rerankRes.json()
      
      if (rerankData.rankings) {
        const finalRankedFiles = rerankData.rankings
          .filter(r => r.logit > -15.0) // Filter out irrelevant passages
          .sort((a, b) => b.logit - a.logit)
          .map(r => filesList[topPassages[r.index].originalIndex])
        
        return finalRankedFiles.filter(Boolean)
      }
      
      return filesList
    } catch (err) {
      console.error('AI Search error:', err)
      const q = query.toLowerCase()
      return filesList.filter(f => f.name.toLowerCase().includes(q))
    } finally {
      loading.value = false
      statusMessage.value = ''
    }
  }

  return {
    loading,
    error,
    statusMessage,
    generatedSummary,
    generateProjectUpdate,
    extractInvoiceItems,
    generateInvoiceNotes,
    searchFiles
  }
}
