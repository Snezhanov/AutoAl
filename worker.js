export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // AutoAI Diagnostics API
    if (url.pathname === "/api/ask" && request.method === "POST") {
      try {
        let data;

        try {
          data = await request.json();
        } catch {
          return Response.json(
            { error: "Невалидна заявка. Моля, опитай отново." },
            { status: 400 }
          );
        }

        // Validate question
        const question =
          typeof data?.question === "string"
            ? data.question.trim()
            : "";

        if (!question) {
          return Response.json(
            { error: "Моля, въведи въпрос за автомобила." },
            { status: 400 }
          );
        }

        if (question.length > 5000) {
          return Response.json(
            {
              error:
                "Въпросът е прекалено дълъг. Съкрати го и опитай отново."
            },
            { status: 400 }
          );
        }

        // Validate vehicle information
        const rawCar =
          data?.car &&
          typeof data.car === "object" &&
          !Array.isArray(data.car)
            ? data.car
            : {};

        const readField = (value, maxLength = 100) => {
          if (
            typeof value !== "string" &&
            typeof value !== "number"
          ) {
            return "не е въведено";
          }

          const result = String(value)
            .trim()
            .slice(0, maxLength);

          return result || "не е въведено";
        };

        const car = {
          brand: readField(rawCar.brand),
          model: readField(rawCar.model),
          year: readField(rawCar.year, 20),
          engine: readField(rawCar.engine),
          power: readField(rawCar.power, 20),
          fuel: readField(rawCar.fuel),
          transmission: readField(rawCar.transmission),
          km: readField(rawCar.km, 30)
        };

        const carInfo = `
Марка: ${car.brand}
Модел: ${car.model}
Година: ${car.year}
Двигател: ${car.engine}
Мощност: ${car.power}
Гориво: ${car.fuel}
Скоростна кутия: ${car.transmission}
Пробег: ${car.km}
`;

        // Diagnostic system instructions
        const systemPrompt = `
Ти си AutoAI Diagnostics — внимателен и практичен автомобилен AI асистент.

Твоята задача е да помагаш на собствениците да разберат възможните причини за автомобилни проблеми и да изберат разумната следваща стъпка.

ОТГОВАРЯЙ:
- На български език.
- Ясно, спокойно и разбираемо.
- Съобразявай отговорите с данните за автомобила.
- Разграничавай установените факти от предположенията.
- Не представяй възможна повреда като сигурна диагноза.

1. БЕЗОПАСНОСТ

Преди диагностичния анализ прецени дали симптомите показват непосредствен риск.

При червено предупреждение за налягането на маслото, прегряване, сериозен проблем със спирачките или управлението, дим, силна миризма на гориво или внезапна сериозна загуба на мощност:
- Посъветвай потребителя да спре на безопасно място, когато това е възможно.
- Обясни дали автомобилът трябва да остане спрян.
- При сериозен риск препоръчай професионална помощ или пътна помощ.
- Не насърчавай продължаване на шофирането при опасни симптоми.

Не препоръчвай опасни проверки около движещи се или горещи части.

2. УТОЧНЯВАЩИ ВЪПРОСИ

Ако информацията не е достатъчна, задай до 3 кратки и конкретни въпроса.

Избирай въпросите според конкретния проблем, например:
- Кога се появява шумът — при студен или загрял двигател?
- Свети ли предупредителна лампа и какъв е цветът ѝ?
- Има ли загуба на мощност, дим или необичайна миризма?
- Проблемът появи ли се внезапно?

Не задавай въпроси, на които вече е отговорено.
Не задавай ненужни въпроси, когато информацията вече е достатъчна.
Ако има непосредствен риск, първо дай указания за безопасност.

3. АНАЛИЗ НА СИМПТОМИТЕ

- Използвай информацията за автомобила, когато е налична.
- Подреждай възможните причини според описаните симптоми.
- Обяснявай защо всяка причина е възможна.
- Не измисляй диагностични кодове, измервания или резултати от проверки.
- Не твърди, че си извършил физическа проверка или OBD диагностика.
- Не препоръчвай смяна на части без достатъчно основания.
- Ако не можеш надеждно да определиш вероятността, кажи го открито.

4. ПРАКТИЧНИ СТЪПКИ

Предлагай действия в разумен ред:
- Какво да се наблюдава първо.
- Какво може безопасно да провери собственикът.
- Какво изисква диагностично оборудване или сервиз.
- Каква информация да предостави потребителят на механика.

Не насърчавай продължително шофиране само за да се провери дали проблемът ще се повтори, когато има съмнение за сериозна повреда.

5. ОРИЕНТИРОВЪЧНИ ЦЕНИ

Посочвай приблизителни цени за Германия само когато имаш достатъчно информация.
Уточнявай, че цената зависи от действителната повреда, автомобила, частите и труда.
Не измисляй точна цена без основание.

6. ФОРМАТ НА ОТГОВОРА

Ако липсва важна информация, задай уточняващите въпроси директно.

Когато информацията е достатъчна, използвай подходящите раздели:

🔎 Оценка на проблема
🧩 Възможни причини
🔧 Какво да се провери първо
🏠 Какво може да провери собственикът
🛠️ Кога е нужен сервиз
⚠️ Безопасно ли е да се кара?
💶 Ориентировъчна цена

Не е необходимо да включваш всички раздели във всеки отговор.

Не се преструвай, че разполагаш с интернет търсене, сервизни данни или диагностични кодове, ако такива не са предоставени.
`;

        // Optional conversation history
        const history = Array.isArray(data.history)
          ? data.history
              .filter(
                (item) =>
                  item &&
                  (item.role === "user" ||
                    item.role === "assistant") &&
                  typeof item.content === "string" &&
                  item.content.trim().length > 0
              )
              .slice(-8)
              .map((item) => ({
                role: item.role,
                content: item.content.slice(0, 3000)
              }))
          : [];

        // Build AI conversation
        const messages = [
          {
            role: "system",
            content: systemPrompt
          },
          ...history,
          {
            role: "user",
            content: `
ДАННИ ЗА АВТОМОБИЛА:
${carInfo}

ТЕКУЩ ВЪПРОС НА ПОТРЕБИТЕЛЯ:
${question}
`
          }
        ];

        // Run AI model
        const result = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages
          }
        );

        const answer =
          typeof result?.response === "string"
            ? result.response.trim()
            : "";

        if (!answer) {
          return Response.json(
            {
              error:
                "AutoAI не успя да създаде отговор. Моля, опитай отново."
            },
            { status: 502 }
          );
        }

        return Response.json({ answer });
      } catch (error) {
        console.error("AutoAI diagnostics error:", error);

        return Response.json(
          {
            error:
              "Възникна проблем с диагностиката. Моля, опитай отново."
          },
          { status: 500 }
        );
      }
    }

    // Serve the existing website
    return env.ASSETS.fetch(request);
  }
};
