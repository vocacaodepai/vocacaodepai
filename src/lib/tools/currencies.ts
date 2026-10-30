export interface Currency {
  code: string;
  name: string;
  flag: string;
  /** tem PTAX no Banco Central */
  ptax?: boolean;
}

// Lista fechada (doc 06 §3.1): pares X-BRL disponíveis na AwesomeAPI.
export const CURRENCIES: Currency[] = [
  { code: "BRL", name: "Real brasileiro", flag: "🇧🇷" },
  { code: "USD", name: "Dólar americano", flag: "🇺🇸", ptax: true },
  { code: "EUR", name: "Euro", flag: "🇪🇺", ptax: true },
  { code: "GBP", name: "Libra esterlina", flag: "🇬🇧", ptax: true },
  { code: "ARS", name: "Peso argentino", flag: "🇦🇷" },
  { code: "CLP", name: "Peso chileno", flag: "🇨🇱" },
  { code: "UYU", name: "Peso uruguaio", flag: "🇺🇾" },
  { code: "PYG", name: "Guarani paraguaio", flag: "🇵🇾" },
  { code: "COP", name: "Peso colombiano", flag: "🇨🇴" },
  { code: "MXN", name: "Peso mexicano", flag: "🇲🇽" },
  { code: "CAD", name: "Dólar canadense", flag: "🇨🇦", ptax: true },
  { code: "AUD", name: "Dólar australiano", flag: "🇦🇺", ptax: true },
  { code: "NZD", name: "Dólar neozelandês", flag: "🇳🇿" },
  { code: "JPY", name: "Iene japonês", flag: "🇯🇵", ptax: true },
  { code: "CNY", name: "Yuan chinês", flag: "🇨🇳" },
  { code: "KRW", name: "Won sul-coreano", flag: "🇰🇷" },
  { code: "INR", name: "Rupia indiana", flag: "🇮🇳" },
  { code: "CHF", name: "Franco suíço", flag: "🇨🇭", ptax: true },
  { code: "SEK", name: "Coroa sueca", flag: "🇸🇪", ptax: true },
  { code: "NOK", name: "Coroa norueguesa", flag: "🇳🇴", ptax: true },
  { code: "DKK", name: "Coroa dinamarquesa", flag: "🇩🇰", ptax: true },
  { code: "PLN", name: "Zloty polonês", flag: "🇵🇱" },
  { code: "CZK", name: "Coroa tcheca", flag: "🇨🇿" },
  { code: "HUF", name: "Florim húngaro", flag: "🇭🇺" },
  { code: "TRY", name: "Lira turca", flag: "🇹🇷" },
  { code: "ZAR", name: "Rand sul-africano", flag: "🇿🇦" },
  { code: "ILS", name: "Novo shekel israelense", flag: "🇮🇱" },
  { code: "AED", name: "Dirham dos Emirados", flag: "🇦🇪" },
  { code: "SAR", name: "Riyal saudita", flag: "🇸🇦" },
  { code: "RUB", name: "Rublo russo", flag: "🇷🇺" },
  { code: "BTC", name: "Bitcoin", flag: "₿" },
  { code: "ETH", name: "Ethereum", flag: "Ξ" },
];

export const currencyByCode = (code: string) => CURRENCIES.find((c) => c.code === code);
