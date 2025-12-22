import { ICurrencyService } from "../interfaces/currency.interface";
import { CURRENCIES } from "../constants";
import axios from "axios";

export class FixerService implements ICurrencyService {
  private baseUrl = "http://data.fixer.io/api";
  private apiKey = process.env.FIXER_API_KEY || "";
  private cache: Map<
    string,
    { rates: Record<string, number>; timestamp: number }
  > = new Map();
  private cacheTtl = 3600000; // 1 hour

  async convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<{
    converted: number;
    rate: number;
    timestamp: string;
  }> {
    const rate = await this.getExchangeRate(from, to);
    const converted = amount * rate;
    const timestamp = new Date().toISOString();

    return {
      converted: parseFloat(converted.toFixed(2)),
      rate: parseFloat(rate.toFixed(6)),
      timestamp,
    };
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    const rates = await this.getCachedRates(from);

    if (!rates[to]) {
      throw new Error(`Exchange rate for ${to} not available`);
    }

    return rates[to];
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const rates = await this.getCachedRates(CURRENCIES.EUR);
    return Object.keys(rates);
  }

  private async getCachedRates(
    base: string = CURRENCIES.EUR
  ): Promise<Record<string, number>> {
    const cached = this.cache.get(base);

    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.rates;
    }

    return this.fetchRatesFromAPI(base);
  }

  private async fetchRatesFromAPI(
    base: string = CURRENCIES.EUR
  ): Promise<Record<string, number>> {
    if (!this.apiKey) {
      console.error("Fixer API key not configured");
      throw new Error("Fixer API key not configured");
    }

    try {
      const response = await axios.get(`${this.baseUrl}/latest`, {
        params: {
          access_key: this.apiKey,
          base: base,
        },
      });

      if (!response.data.success) {
        console.error("Fixer API error:", response.data.error);
        throw new Error(
          response.data.error?.info || "Fixer API responded with an error"
        );
      }

      const rates = response.data.rates;
      this.cache.set(base, {
        rates,
        timestamp: Date.now(),
      });

      return rates;
    } catch (error) {
      console.error("Failed to fetch rates from Fixer API:", error);
      throw new Error("Failed to fetch rates from Fixer API");
    }
  }
}
