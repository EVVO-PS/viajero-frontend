export interface CountryName {
    common: string;
    official: string;
  }
  
  export interface CountryFlags {
    png: string;
    svg: string;
    alt?: string;
  }
  
  export interface Country {
    name: CountryName;
    flags: CountryFlags;
  }