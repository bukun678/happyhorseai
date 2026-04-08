export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  try {
    const { prompt = '', style = 'Cinematic', aspect = '16:9', duration = '6 seconds', systemPrompt = '' } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }
    const endpoint = process.env.HAPPYHORSE_API_ENDPOINT || '';
    const apiKey = process.env.HAPPYHORSE_API_KEY || '';
    const model = process.env.HAPPYHORSE_MODEL || 'happyhorse-default';

    if (!endpoint || !apiKey) {
      res.status(200).json({
        placeholder: true,
        model,
        output:
          `HappyHorse AI generated a ${style.toLowerCase()} video concept in ${aspect} format with an estimated ${duration.toLowerCase()} runtime.\n\n` +
          `Prompt: "${prompt}"\n\n` +
          `Result summary: dynamic motion, stronger scene identity, and a polished product-style preview suitable for a generator demo flow.`,
        message: 'Placeholder response returned because the backend endpoint is not configured yet.'
      });
      return;
    }

    const upstreamBody = { model, prompt, style, aspect, duration, system: systemPrompt || undefined };
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(upstreamBody)
    });

    const rawText = await upstream.text();
    let data;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data?.error || data?.message || 'Upstream request failed.', upstream: data });
      return;
    }

    const output =
      data?.output ||
      data?.text ||
      data?.result ||
      data?.data?.output ||
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      JSON.stringify(data);

    res.status(200).json({ placeholder: false, model, output });
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Unexpected server error.' });
  }
}
