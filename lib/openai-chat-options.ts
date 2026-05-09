export function openAIModelSupportsCustomTemperature(model: string) {
  const normalizedModel = model.toLowerCase();

  return !normalizedModel.startsWith("gpt-5") && !normalizedModel.startsWith("o");
}

export function withOpenAIChatTemperature<TPayload extends { model: string }>(
  payload: TPayload,
  temperature: number,
) {
  if (!openAIModelSupportsCustomTemperature(payload.model)) {
    return payload;
  }

  return {
    ...payload,
    temperature,
  };
}
