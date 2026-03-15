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

export type AiHelperMode = "app" | "product";

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
  | { mode: "product"; answer: string; product: ProductAiSuggestion };

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
}: {
  apiKey: string;
  mode: AiHelperMode;
  question: string;
  currentPath: string;
  productName?: string;
  productContext?: string;
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
