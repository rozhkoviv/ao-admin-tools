export type Tag = {
  color: string;
  text: string;
};

export type XdbInfo = {
  version: string;
  resourceId?: string;
  type: string;
  filePath?: string;
  fields: {
    main: Component[];
    additional: CardComponent[];
  };
};

export type Component = {
  isArray: boolean;
  editorType: string;
  sysName: string;
  name?: string;
  tags?: Tag[];
  desc?: string;
  readOnly?: boolean;
  value?: any;
  typeName?: string;
  getValue?: () => any;
};

export type CardComponent = {
  name: string;
  content: Component[];
};

export type ArrayItem = {
  key: string;
  value: Component;
};

export type DatabaseResourceField = {
  name: string;
  text?: string;
  isArray: boolean;
  fields?: DatabaseResourceField[];
  attributes?: {
    name: string;
    value: string;
  }[];
};

export type DatabaseResource = {
  typeName: string;
  resourceId: string;
  fields?: DatabaseResourceField[];
};

export type PakResource = {
  path: string;
  data: Buffer;
};

export type LocResources = {
  region: string;
  resources: PakResource[];
};

export type XdbResource = {
  path: string;
  resourceId: string;
  type: string;
  data: string;
};

export type LocData = {
  region: string;
  value: string;
};

export type LocResource = {
  path: string;
  name: string;
  locs: LocData[];
};

export type TypeFieldInfo = {
  typeName: string;
  name: string;
  description: string | undefined;
  attributes: string[] | undefined;
  isArray: boolean;
  systemType: string | undefined;
  editorType: string;
  isAbstract: boolean;
  inline: boolean;
};

export type TypeInfo = {
  typeName: string;
  serverTypeName: string;
  systemType: string;
  description?: string;
  baseType?: string;
  attributes?: string[];
  fields: TypeFieldInfo[];
  enumValues?: string[];
};
