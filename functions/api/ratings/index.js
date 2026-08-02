export async function onRequestGet(context) {
  const result = await context.env.LOCALCLAW_DB.prepare(`
    SELECT model_id, ROUND(AVG(rating), 2) AS average, COUNT(*) AS count
    FROM model_ratings
    GROUP BY model_id
    ORDER BY count DESC, average DESC, model_id ASC
  `).all();

  const ratings = (result.results || []).map((row) => ({
    modelId: row.model_id,
    average: Number(row.average || 0),
    count: Number(row.count || 0)
  }));

  return new Response(JSON.stringify({ ok: true, ratings }), {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
