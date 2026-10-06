export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // AI API
    if (url.pathname === "/api/ask" && request.method === "POST") {
      try {
        const data = await request.json();
        const question = data.question?.trim();

        if (!question) {
          return Response.json(
            { error: "Липсва въпрос." },
            { status: 400 }
          );
        }

        const prompt = `
Ти си AutoAI — интелигентен асистент за собственици на автомобили.

Помагай с:
- диагностика на автомобилни проблеми
- предупредителни лампи
- поддръжка
- ремонти
- ориентировъчни разходи
- покупка на употребяван автомобил
- безопасност
- сервизна история

Отговаряй на български език.
Бъди ясен и практичен.
Не измисляй сигурна диагноза, когато няма достатъчно информация.
При потенциално опасен проблем препоръчай професионален сервиз.

Автомобил на потребителя:
VW Tiguan
1.5 TSI
150 HP
105 000 km

Въпрос на потребителя:
${question}
`;

        const result = await env.AI.run(
         "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              {
                role: "system",
                content: "Ти си AutoAI, автомобилен AI асистент."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          }
        );

        return Response.json({
          answer: result.response
        });
      } catch (error) {
        return Response.json(
          {
            error: "Възникна грешка при AI системата.",
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    // Website
    return env.ASSETS.fetch(request);
  }
};
