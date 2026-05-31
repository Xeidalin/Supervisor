import { ProviderDefinition } from "./types";
import { deepseekProvider } from "./deepseek";
import { veniceProvider } from "./venice";

const registry = new Map<string, ProviderDefinition>([
  ["deepseek", deepseekProvider],
  ["venice", veniceProvider],
]);

export function getProvider(id: string): ProviderDefinition | undefined {
  return registry.get(id);
}

export function getAllProviders(): ProviderDefinition[] {
  return Array.from(registry.values());
}

export function registerProvider(provider: ProviderDefinition): void {
  registry.set(provider.id, provider);
}
