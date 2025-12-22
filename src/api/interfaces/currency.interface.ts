export interface ICurrencyService {
  convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<{
    converted: number;
    rate: number;
    timestamp: string;
  }>;

  getExchangeRate(from: string, to: string): Promise<number>;

  getSupportedCurrencies(): Promise<string[]>;
}
