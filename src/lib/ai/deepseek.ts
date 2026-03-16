const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-chat";

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type AiHelperMode = "app" | "product" | "day" | "chat";

export type ProductAiSuggestion = {
  name: string;
  unitMode: "grams" | "piece";
  unitLabel: string;
  gramsPerUnit: number | null;
  proteinPer100: number;
  fatPer100: number;
  carbsPer100: number;
  kcalPer100: number;
  fiberPer100: number;
  magnesiumPer100: number;
  ironPer100: number;
  zincPer100: number;
  omega3Per100: number;
  vitaminB12Per100: number;
  note: string;
};

export type AiHelperResult =
  | { mode: "app"; answer: string }
  | { mode: "chat"; answer: string }
  | { mode: "day"; answer: string }
  | { mode: "product"; answer: string; product: ProductAiSuggestion };

export function inferProductRequest(text: string) {
  const original = text.trim();
  if (!original) {
    return { productName: "", productContext: "" };
  }

  const normalized = original.toLowerCase();
  const hasProductIntent =
    normalized.includes("данные по") ||
    normalized.includes("нутриент") ||
    normalized.includes("кбжу") ||
    normalized.includes("бжу") ||
    normalized.includes("калорий") ||
    normalized.includes("магний") ||
    normalized.includes("желез") ||
    normalized.includes("цинк") ||
    normalized.includes("омега") ||
    normalized.includes("витамин") ||
    normalized.includes("создай продукт") ||
    normalized.includes("добавь продукт") ||
    normalized.includes("добавить продукт") ||
    normalized.includes("продукт ") ||
    original.split(/\s+/).length <= 3;

  if (!hasProductIntent) {
    return { productName: "", productContext: "" };
  }

  let productName = original
    .replace(/^(ну\s+)?(хорошо\s+)?/i, "")
    .replace(/^(дай|подбери|найди|добавь|добавить|создай|покажи|проверь|помоги)\s+(мне\s+)?/i, "")
    .replace(/^(данные|нутриенты|кбжу|бжу|калорийность|пищевую ценность)\s+(по|для)\s+/i, "")
    .replace(/^(продукт\s+)?(по|для)\s+/i, "")
    .replace(/^(продукт\s+)/i, "")
    .replace(/^(о|об)\s+/i, "")
    .replace(/\s+(чтобы|чтоб|и)\s+.*$/i, "")
    .replace(/[?!.]+$/g, "")
    .trim();

  productName = productName
    .replace(/^(данные\s+по\s+)/i, "")
    .replace(/^(нутриенты\s+по\s+)/i, "")
    .replace(/^(для\s+)/i, "")
    .trim();

  return {
    productName,
    productContext: original,
  };
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI ответил без JSON.");
  }

  return source.slice(start, end + 1);
}

function clampNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeProductSuggestion(payload: unknown): ProductAiSuggestion {
  if (!payload || typeof payload !== "object") {
    throw new Error("Некорректный ответ AI.");
  }

  const candidate = payload as Record<string, unknown>;
  const unitMode = candidate.unitMode === "piece" ? "piece" : "grams";
  const gramsPerUnitValue = clampNumber(candidate.gramsPerUnit, 0);

  return {
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : "Новый продукт",
    unitMode,
    unitLabel:
      typeof candidate.unitLabel === "string" && candidate.unitLabel.trim()
        ? candidate.unitLabel.trim()
        : unitMode === "piece"
          ? "шт."
          : "",
    gramsPerUnit: unitMode === "piece" && gramsPerUnitValue > 0 ? gramsPerUnitValue : null,
    proteinPer100: clampNumber(candidate.proteinPer100),
    fatPer100: clampNumber(candidate.fatPer100),
    carbsPer100: clampNumber(candidate.carbsPer100),
    kcalPer100: Math.round(clampNumber(candidate.kcalPer100)),
    fiberPer100: clampNumber(candidate.fiberPer100),
    magnesiumPer100: clampNumber(candidate.magnesiumPer100),
    ironPer100: clampNumber(candidate.ironPer100),
    zincPer100: clampNumber(candidate.zincPer100),
    omega3Per100: clampNumber(candidate.omega3Per100),
    vitaminB12Per100: clampNumber(candidate.vitaminB12Per100),
    note:
      typeof candidate.note === "string" && candidate.note.trim()
        ? candidate.note.trim()
        : "AI подобрал ориентировочные значения.",
  };
}

async function requestDeepSeek(apiKey: string, messages: DeepSeekMessage[]) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `DeepSeek ответил с ошибкой ${response.status}.`);
  }

  const json = (await response.json()) as ChatResponse;
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("DeepSeek вернул пустой ответ.");
  }

  return content;
}

export async function askAiHelper({
  apiKey,
  mode,
  question,
  currentPath,
  productName,
  productContext,
  dayContext,
}: {
  apiKey: string;
  mode: AiHelperMode;
  question: string;
  currentPath: string;
  productName?: string;
  productContext?: string;
  dayContext?: string;
}): Promise<AiHelperResult> {
  if (mode === "app") {
    const content = await requestDeepSeek(apiKey, [
      {
        role: "system",
        content:
          "Ты очень короткий AI-помощник только по мобильному приложению учета питания EWL. " +
          "Отвечай только про интерфейс и действия внутри приложения: вкладки Профиль, День, Продукты, Календарь, поиск, добавление еды, создание продукта, тема, творожок. " +
          "Не давай общих советов по жизни, медицине, психологии или диетологии. Если вопрос не про приложение, мягко верни к приложению. " +
          "Пиши коротко, дружелюбно, по-русски, максимум 4 коротких предложения.",
      },
      {
        role: "user",
        content: `Текущий экран: ${currentPath}. Вопрос пользователя: ${question}`,
      },
    ]);

    return {
      mode: "app",
      answer: content,
    };
  }

  if (mode === "day") {
    const content = await requestDeepSeek(apiKey, [
      {
        role: "system",
        content:
          "Ты короткий AI-помощник внутри дневного плана питания. " +
          "Твоя задача: по текущему съеденному, цели, остаткам калорий, БЖУ и дефицитам нутриентов предложить, чем лучше добрать день. " +
          "Пиши по-русски, коротко, мягко, без стыда, максимум 5 коротких предложений. " +
          "Предлагай 2-4 конкретные идеи еды или продуктов. " +
          "Если калорий осталось мало, советуй что-то легкое. Если калории уже закрыты или превышены, не предлагай доедать, а мягко скажи, что день уже можно спокойно закончить. " +
          "Отвечай только по текущему дню и продуктам, без общих лекций.",
      },
      {
        role: "user",
        content: `Контекст дня: ${dayContext ?? ""}\nЗапрос пользователя: ${question}`,
      },
    ]);

    return {
      mode: "day",
      answer: content,
    };
  }

  if (mode === "chat") {
    const content = await requestDeepSeek(apiKey, [
      {
        role: "system",
        content:
          "Ты дружелюбный AI-помощник внутри приложения EWL. " +
          "Отвечай по-русски, коротко, понятно и спокойно. " +
          "Можно помогать информацией по приложению, продуктам, питанию и общим бытовым вопросам. " +
          "Если тебе передан контекст текущего дня, используй его как главный ориентир для вопросов про еду, калории, БЖУ и нутриенты. " +
          "Когда вопрос про то, что можно съесть сегодня, отвечай с учетом уже съеденного и остатка по дню, а не общими советами. " +
          "Очень важно: ты ничего не делаешь сам за пользователя. Ты не нажимаешь кнопки, не создаешь продукты, не сохраняешь данные и не меняешь записи. " +
          "Если пользователь просит что-то сделать, объясни это как информационную подсказку или короткий план действий. " +
          "Пиши максимум 5 коротких предложений, без лишней воды.",
      },
      {
        role: "user",
        content: `Текущий экран: ${currentPath}. ${dayContext ? `Контекст дня: ${dayContext}. ` : ""}Вопрос пользователя: ${question}`,
      },
    ]);

    return {
      mode: "chat",
      answer: content,
    };
  }

  const content = await requestDeepSeek(apiKey, [
    {
      role: "system",
      content:
        "Ты помощник для заполнения нутриентов продукта в приложении питания. " +
        "Нужно вернуть только JSON без пояснений и markdown. " +
        'Формат: {"name":"", "unitMode":"grams|piece", "unitLabel":"", "gramsPerUnit":0, "proteinPer100":0, "fatPer100":0, "carbsPer100":0, "kcalPer100":0, "fiberPer100":0, "magnesiumPer100":0, "ironPer100":0, "zincPer100":0, "omega3Per100":0, "vitaminB12Per100":0, "note":""}. ' +
        "Все значения должны быть на 100 г. Если пользователь описал продукт за 1 штуку, сначала оцени вес одной штуки и пересчитай на 100 г. " +
        "Если данных мало, верни реалистичную ориентировочную оценку и короткую note. Не оставляй поля пустыми.",
    },
    {
      role: "user",
      content: `Продукт: ${productName ?? ""}. Контекст: ${productContext ?? ""}. Доп. запрос: ${question}`,
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  const product = normalizeProductSuggestion(parsed);

  return {
    mode: "product",
    answer: product.note,
    product,
  };
}
