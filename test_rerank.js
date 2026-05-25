const apiKey = process.env.VITE_NVIDIA_API_KEY;
fetch('https://integrate.api.nvidia.com/v1/ranking', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'nvidia/rerank-qa-mistral-4b',
    query: { text: "hex" },
    passages: [
      { text: "File name: Brand_Guidelines_V2.pdf. File type: application/pdf. Uploaded on: 2026-05-24. Status: pending." },
      { text: "File name: Q3_Financial_Projections.csv. File type: text/csv." },
      { text: "File name: some_image.png. File type: image/png" }
    ]
  })
}).then(res => res.json()).then(console.log);
