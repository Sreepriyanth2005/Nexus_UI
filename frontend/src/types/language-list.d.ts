declare module "language-list" {
  class LanguageList {
    getData(): Array<{
      code: string;
      language: string;
    }>;

    getLanguageCodes(): string[];

    getLanguageName(code: string): string;
  }

  export default LanguageList;
}