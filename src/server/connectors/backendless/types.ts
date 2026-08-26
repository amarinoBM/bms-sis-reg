export type BackendlessProperty = {
  name: string;
  type: string;
  relatedTable?: string | null;
  required?: boolean;
  defaultValue?: unknown;
  isPrimaryKey?: boolean;
};

export type BackendlessRow = Record<string, unknown> & {
  objectId?: string;
  created?: number;
  updated?: number;
};

export type BackendlessTableExport = {
  table: string;
  properties: BackendlessProperty[];
};
