import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAI } from '../useAI'

// Mock environment variables
vi.stubEnv('VITE_NVIDIA_API_KEY_LLAMA_70B', 'test-key')

describe('useAI Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('generateProjectUpdate with empty rawNotes throws a validation error before calling API', async () => {
    const { generateProjectUpdate, error } = useAI()

    await expect(
      generateProjectUpdate({
        projectName: 'Web App',
        clientName: 'Sarah',
        rawNotes: '',
        tone: 'professional'
      })
    ).rejects.toThrow()

    expect(error.value).toContain('Please enter some raw notes')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('generateProjectUpdate returns non-empty string on success', async () => {
    const { generateProjectUpdate, generatedSummary } = useAI()

    // Mock fetch SSE response
    const mockChunks = [
      'data: {"choices":[{"delta":{"content":"Completed item 1. "}}]}\n',
      'data: {"choices":[{"delta":{"content":"Working on item 2. "}}]}\n',
      'data: {"choices":[{"delta":{"content":"Next is item 3."}}]}\n',
      'data: [DONE]\n'
    ]

    let currentChunk = 0
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: () => {
            if (currentChunk < mockChunks.length) {
              const chunk = mockChunks[currentChunk++]
              return Promise.resolve({ done: false, value: new TextEncoder().encode(chunk) })
            }
            return Promise.resolve({ done: true })
          }
        })
      }
    })

    await generateProjectUpdate({
      projectName: 'Aura branding',
      clientName: 'Vertex Capital',
      rawNotes: 'Notes go here',
      tone: 'friendly'
    })

    expect(generatedSummary.value).toBe('Completed item 1. Working on item 2. Next is item 3.')
  })

  it('API error sets error state correctly', async () => {
    const { generateProjectUpdate, error } = useAI()

    global.fetch.mockRejectedValue(new Error('Rate limit exceeded (429)'))

    await expect(
      generateProjectUpdate({
        projectName: 'Aura branding',
        clientName: 'Vertex Capital',
        rawNotes: 'Notes go here',
        tone: 'friendly'
      })
    ).rejects.toThrow()

    expect(error.value).toContain('Too many requests. Please wait a moment')
  })
})
