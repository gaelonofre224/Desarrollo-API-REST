interface HALSONLink {
  href: string;
  rel?: string;           // Relation type
  type?: string;          // Media type (e.g., 'application/json')
  title?: string;         // Human-readable title
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // HTTP method
  templated?: boolean;    // Whether href is a URI template
  deprecation?: string;   // Deprecation notice URL
  profile?: string;       // Link profile URL
  hreflang?: string;      // Language of the linked resource
  name?: string;          // Secondary key for selecting links
}

type HALSONResourceLinks = Partial<Record<string, HALSONLink | HALSONLink[]>>;

// IANA Link Relations (RFC 8288)
declare const IanaRels: {
  readonly SELF: 'self';
  readonly EDIT: 'edit';
  readonly DELETE: 'delete';
  readonly NEXT: 'next';
  readonly PREV: 'prev';
  readonly PREVIOUS: 'previous';
  readonly FIRST: 'first';
  readonly LAST: 'last';
  readonly RELATED: 'related';
  readonly ALTERNATE: 'alternate';
  readonly CANONICAL: 'canonical';
  readonly COLLECTION: 'collection';
  readonly ITEM: 'item';
  readonly UP: 'up';
  readonly HELP: 'help';
  readonly ABOUT: 'about';
  readonly BOOKMARK: 'bookmark';
  readonly TAG: 'tag';
  readonly SEARCH: 'search';
};

type IanaRel = 'self' | 'edit' | 'delete' | 'next' | 'prev' | 'previous' | 'first' | 'last' | 'related' | 'alternate' | 'canonical' | 'collection' | 'item' | 'up' | 'help' | 'about' | 'bookmark' | 'tag' | 'search';

// URI Template expansion support
interface URITemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

interface PageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

type PagedResource<T extends object = object> = HALSONResourceOf<T> & {
  page: PageMetadata;
  hasNext(): boolean;
  hasPrev(): boolean;
  hasFirst(): boolean;
  hasLast(): boolean;
  next(): string | null;
  prev(): string | null;
  first(): string | null;
  last(): string | null;
};

interface HALResourceBuilder<T extends object> {
  link(rel: string, href: string): HALResourceBuilder<T>;
  link(rel: string, link: HALSONLink): HALResourceBuilder<T>;
  embed<U extends object>(rel: string, resource: HALSONResourceOf<U>): HALResourceBuilder<T>;
  embed<U extends object>(rel: string, resources: HALSONResourceOf<U>[]): HALResourceBuilder<T>;
  template(rel: string, template: string): HALResourceBuilder<T>;
  curie(name: string, href: string, templated?: boolean): HALResourceBuilder<T>;
  build(): HALSONResourceOf<T>;
}

declare function HALResourceBuilder<T extends object>(data: T): HALResourceBuilder<T>;

interface CurieLink {
  name: string;
  href: string;
  templated: boolean;
}

interface ContentNegotiation {
  getContentType(): string;
  accepts(mediaType: string): boolean;
  asJson(): string;
  asHal(): string;
}

interface ValidationOptions {
  strict?: boolean;
  allowMissingLinks?: string[];
  requireLinks?: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface HALSONResource extends ContentNegotiation {
  className: 'HALSONResource';
  _links?: HALSONResourceLinks;
  _embedded?: EmbeddedHALSONResources;
  listLinkRels(): string[];
  listEmbedRels(): string[];
  getLinks(
    rel: string,
    filterCallback?: FilterCallback<HALSONLink>,
    begin?: number | undefined,
    end?: number | undefined,
  ): HALSONLink[];
  getLink<D>(rel: string, def: D): HALSONLink | D;
  getLink<D>(rel: string, filterCallback: FilterCallback<HALSONLink>, def: D): HALSONLink | D;
  getEmbeds<I>(
    rel: string,
    filterCallback?: FilterCallback<I>,
    begin?: number | undefined,
    end?: number | undefined,
  ): I[];
  getEmbed<I, D>(rel: string, def: D): I | D;
  getEmbed<I, D>(rel: string, filterCallback: FilterCallback<I> | undefined, def: D): I | D;
  addLink(rel: string, link: string | HALSONLink): this & {_links: HALSONResourceLinks};
  addEmbed<I>(rel: string, embed: I | readonly I[]): this & {_embedded: EmbeddedHALSONResources};
  insertEmbed<I>(
    rel: string,
    index: number,
    embed: I | readonly I[],
  ): this & {_embedded: EmbeddedHALSONResources};
  removeLinks(rel: string, filterCallback?: FilterCallback<HALSONLink>): this;
  removeEmbeds(rel: string, filterCallback?: FilterCallback<HALSONLink>): this;

  hasLink(rel: string): boolean;
  hasLinks(rel: string): boolean;
  isTemplated(rel: string): boolean;
  expandTemplate(rel: string, variables: URITemplateVariables): string;
  addTemplate(rel: string, template: string, variables?: URITemplateVariables): this & {_links: HALSONResourceLinks};

  follow<T extends object = object>(rel: string, fetchOptions?: RequestInit): Promise<HALSONResourceOf<T>>;
  followAll<T extends object = object>(rel: string, fetchOptions?: RequestInit): Promise<HALSONResourceOf<T>[]>;
  getHref(rel: string): string | null;
  getAllHrefs(rel: string): string[];
  resolve(rel: string, variables?: URITemplateVariables): string | null;

  addCurie(curie: CurieLink): this;
  addCurie(name: string, href: string, templated?: boolean): this;
  getCuries(): CurieLink[];
  expandCurie(rel: string): string;

  validate(options?: ValidationOptions): ValidationResult;
  clone(): this;
  merge(other: HALSONResource): this;
}

type EmbeddedHALSONResources = Partial<Record<string, HALSONResource | HALSONResource[]>>;

type FilterCallback<T> = (item: T, index: number, items: T[]) => unknown

declare function createHALSONResource(data: string | object): HALSONResource;
declare function createHALSONResource<T extends object>(data: string | T): HALSONResourceOf<T>;

// Generic alias
type HALSONResourceOf<T extends object> = HALSONResource & T;

// Create a namespace to export the generic type
declare namespace createHALSONResource {
  export type HALSONResource<T extends object = object> = HALSONResourceOf<T>;
  export { IanaRels, HALResourceBuilder };
  export type {
    IanaRel,
    HALSONLink,
    URITemplateVariables,
    PageMetadata,
    PagedResource,
    CurieLink,
    ContentNegotiation,
    ValidationOptions,
    ValidationResult
  };
}

export = createHALSONResource;
export as namespace halson;

declare global {
  interface Window {
    halson: typeof createHALSONResource;
  }
}
